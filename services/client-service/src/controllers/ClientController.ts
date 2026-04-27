import { Request, Response } from 'express';
import { AppDataSource } from '../database/data-source';
import { Client } from '../entities/Client.entity';
const repo = () => AppDataSource.getRepository(Client);

export class ClientController {
  list = async (_req: Request, res: Response): Promise<void> => {
    const rows = await repo().find({ order: { id: 'DESC' } });
    res.json(rows);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const row = await repo().findOne({ where: { id } });
    if (!row) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.json(row);
  };

  getByPhone = async (req: Request, res: Response): Promise<void> => {
    const phone = req.params.phone?.trim();
    if (!phone) {
      res.status(400).json({ message: 'Phone required' });
      return;
    }
    const row = await repo().findOne({ where: { phone } });
    if (!row) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.json(row);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { fullName, address, phone, email } = req.body || {};
    if (!fullName || !address || !phone) {
      res.status(400).json({ message: 'fullName, address, phone обовʼязкові' });
      return;
    }
    const registrationDate = new Date(new Date().toISOString().slice(0, 10));
    const entity = repo().create({
      fullName: String(fullName),
      address: String(address),
      phone: String(phone),
      email: email ? String(email) : null,
      registrationDate,
    });
    const saved = await repo().save(entity);
    res.status(201).json({ data: saved });
  };

  /** Знайти за телефоном або створити */
  registerOrGet = async (req: Request, res: Response): Promise<void> => {
    const { fullName, address, phone, email } = req.body || {};
    if (!phone) {
      res.status(400).json({ message: 'phone обовʼязковий' });
      return;
    }
    const existing = await repo().findOne({ where: { phone: String(phone) } });
    if (existing) {
      res.json({ data: existing });
      return;
    }
    if (!fullName || !address) {
      res.status(400).json({ message: 'fullName та address обовʼязкові для нового клієнта' });
      return;
    }
    const registrationDate = new Date(new Date().toISOString().slice(0, 10));
    const entity = repo().create({
      fullName: String(fullName),
      address: String(address),
      phone: String(phone),
      email: email ? String(email) : null,
      registrationDate,
    });
    const saved = await repo().save(entity);
    res.status(201).json({ data: saved });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const row = await repo().findOne({ where: { id } });
    if (!row) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    const { fullName, address, phone, email } = req.body || {};
    if (fullName !== undefined) row.fullName = String(fullName);
    if (address !== undefined) row.address = String(address);
    if (phone !== undefined) row.phone = String(phone);
    if (email !== undefined) row.email = email ? String(email) : null;
    const saved = await repo().save(row);
    res.json({ data: saved });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const result = await repo().delete(id);
    if (!result.affected) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.status(204).end();
  };
}
