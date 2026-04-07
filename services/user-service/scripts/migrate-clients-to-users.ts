import 'reflect-metadata';
import 'dotenv/config';
import { Client as PgClient } from 'pg';
import { AppDataSource } from '../src/database/data-source';
import { User, UserRole, VerifiedStatus } from '../src/entities/User.entity';
import { UserProfile } from '../src/entities/UserProfile.entity';
import { UserRating } from '../src/entities/UserRating.entity';

type LegacyClient = {
  id: number;
  full_name: string;
  address: string;
  phone: string;
  email: string | null;
  registration_date: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
};

function splitFullName(fullName: string): { firstName: string; lastName: string | null } {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Client',
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}

function buildFallbackEmail(phone: string, legacyId: number): string {
  const phoneKey = phone.replace(/\D+/g, '') || String(legacyId);
  return `client+${phoneKey}@migration.user-service`;
}

async function main() {
  const sourceClient = new PgClient({
    host: process.env.CLIENT_DB_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.CLIENT_DB_PORT || process.env.DB_PORT || '5432'),
    user: process.env.CLIENT_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.CLIENT_DB_PASSWORD || process.env.DB_PASSWORD || '1234',
    database: process.env.CLIENT_DB_DATABASE || 'client_service_db',
  });

  await sourceClient.connect();
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const profileRepository = AppDataSource.getRepository(UserProfile);
  const ratingRepository = AppDataSource.getRepository(UserRating);

  try {
    const existsResult = await sourceClient.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'clients'
      ) AS "exists"
    `);

    if (!existsResult.rows[0]?.exists) {
      // eslint-disable-next-line no-console
      console.log('No legacy clients table found in client_service_db. Nothing to migrate.');
      return;
    }

    const result = await sourceClient.query<LegacyClient>(`
      SELECT
        id,
        full_name,
        address,
        phone,
        email,
        registration_date,
        created_at,
        updated_at
      FROM clients
      ORDER BY id ASC
    `);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const legacy of result.rows) {
      const existing =
        (legacy.phone
          ? await userRepository.findOne({
              where: { phone: legacy.phone },
              relations: ['profile', 'rating'],
            })
          : null) ||
        (legacy.email
          ? await userRepository.findOne({
              where: { email: legacy.email },
              relations: ['profile', 'rating'],
            })
          : null);

      const email = legacy.email || buildFallbackEmail(legacy.phone, legacy.id);
      const { firstName, lastName } = splitFullName(legacy.full_name);

      if (!existing) {
        const user = userRepository.create({
          email,
          phone: legacy.phone || null,
          role: UserRole.RENTER,
          verifiedStatus: VerifiedStatus.PENDING,
          emailVerified: !!legacy.email,
          phoneVerified: !!legacy.phone,
          createdAt: new Date(legacy.created_at),
          updatedAt: new Date(legacy.updated_at),
        });

        const savedUser = await userRepository.save(user);

        await profileRepository.save(
          profileRepository.create({
            userId: savedUser.id,
            firstName,
            lastName,
            address: legacy.address || null,
            country: 'Ukraine',
            createdAt: new Date(legacy.created_at),
            updatedAt: new Date(legacy.updated_at),
          } as Partial<UserProfile>)
        );

        await ratingRepository.save(
          ratingRepository.create({
            userId: savedUser.id,
            rating: 0,
            reviewsCount: 0,
            asRenterRating: 0,
            asRenterCount: 0,
            asOwnerRating: 0,
            asOwnerCount: 0,
            updatedAt: new Date(legacy.updated_at),
          } as Partial<UserRating>)
        );

        created += 1;
        continue;
      }

      const userPatch: Partial<User> = {};
      if (!existing.phone && legacy.phone) userPatch.phone = legacy.phone;
      if (existing.role !== UserRole.RENTER && existing.role !== UserRole.BOTH) {
        userPatch.role = UserRole.BOTH;
      }
      if (existing.email.endsWith('@migration.user-service') && legacy.email) {
        userPatch.email = legacy.email;
        userPatch.emailVerified = true;
      }

      if (Object.keys(userPatch).length > 0) {
        await userRepository.update(existing.id, userPatch);
      }

      const existingProfile = await profileRepository.findOne({ where: { userId: existing.id } });
      if (!existingProfile) {
        await profileRepository.save(
          profileRepository.create({
            userId: existing.id,
            firstName,
            lastName,
            address: legacy.address || null,
            country: 'Ukraine',
          } as Partial<UserProfile>)
        );
      } else {
        await profileRepository.update(existing.id, {
          firstName: existingProfile.firstName || firstName,
          lastName: existingProfile.lastName || lastName,
          address: existingProfile.address || legacy.address || null,
        });
      }

      const existingRating = await ratingRepository.findOne({ where: { userId: existing.id } });
      if (!existingRating) {
        await ratingRepository.save(
          ratingRepository.create({
            userId: existing.id,
            rating: 0,
            reviewsCount: 0,
            asRenterRating: 0,
            asRenterCount: 0,
            asOwnerRating: 0,
            asOwnerCount: 0,
          } as Partial<UserRating>)
        );
      }

      updated += 1;
    }

    skipped = Math.max(0, result.rows.length - created - updated);

    // eslint-disable-next-line no-console
    console.log(`Client migration finished. created=${created} updated=${updated} skipped=${skipped}`);
  } finally {
    await sourceClient.end();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Client migration failed:', error);
  process.exit(1);
});
