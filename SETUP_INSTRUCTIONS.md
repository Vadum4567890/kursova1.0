# 🚀 Project Setup Instructions

This guide will help you complete the setup of the Car Rental System project.

## ✅ Completed Steps

- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed

## 📝 Required Steps

### 1. Create Backend Environment File

Create a file named `.env` in the `backend/` directory with the following content:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=1234
DB_DATABASE=car_rental_db
JWT_SECRET=your-secret-key-here-change-in-production
PORT=3000
NODE_ENV=development
```

**Note:** Change the `DB_PASSWORD` to match your PostgreSQL password if it's different from `1234`.

### 2. Create Frontend Environment File (Optional)

The frontend has a default API URL, but you can create a `.env` file in the `frontend/` directory if you want to customize it:

```env
VITE_API_URL=http://localhost:3000/api
```

This is optional since the frontend defaults to `http://localhost:3000/api` if not specified.

### 3. Database Setup

#### Option A: Using pgAdmin
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on "Databases"
4. Select "Create" → "Database..."
5. Enter name: `car_rental_db`
6. Click "Save"

#### Option B: Using psql Command Line
```bash
psql -U postgres
CREATE DATABASE car_rental_db;
\q
```

#### Option C: Using SQL Script
You can also use the provided script:
```bash
psql -U postgres -f database/create-database.sql
```

### 4. Run Database Migrations (Optional)

If you want to use migrations instead of auto-sync:

```bash
cd backend
npm run migration:run
```

**Note:** The project is configured to auto-sync the database schema in development mode (`synchronize: true`), so migrations are optional.

### 5. Seed Database (Optional)

To populate the database with initial data:

```bash
cd backend
npm run seed
```

## 🚀 Starting the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend will be available at: `http://localhost:3000`
- API Documentation (Swagger): `http://localhost:3000/api-docs`
- Health Check: `http://localhost:3000/health`

### Start Frontend Server

Open a new terminal window:

```bash
cd frontend
npm run dev
```

The frontend will be available at: `http://localhost:3001`

## 🔍 Verification

1. **Backend Check:**
   - Visit `http://localhost:3000/health` - should return a health status
   - Visit `http://localhost:3000/api-docs` - should show Swagger documentation

2. **Frontend Check:**
   - Visit `http://localhost:3001` - should show the application
   - Check browser console for any errors

3. **Database Check:**
   - The backend will automatically create tables on first connection
   - Check pgAdmin or run: `\dt` in psql to see created tables

## 🐛 Troubleshooting

### Backend won't start
- Check if PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database `car_rental_db` exists
- Check if port 3000 is available (use `npm run kill-port` if needed)

### Frontend won't connect to backend
- Ensure backend is running on port 3000
- Check browser console for CORS errors
- Verify `VITE_API_URL` in frontend `.env` (if created)

### Database connection errors
- Verify PostgreSQL service is running
- Check username and password in `.env`
- Ensure database exists
- Check PostgreSQL logs for detailed errors

## 📚 Additional Resources

- [Backend Setup Guide](./backend/SETUP_DB.md)
- [Server Start Guide](./backend/START_SERVER.md)
- [Database Creation Guide](./backend/CREATE_DATABASE.md)
- [API Documentation](./backend/README_API.md)

## ✨ Next Steps

After setup is complete:
1. Access the application at `http://localhost:3001`
2. Register a new user or use existing credentials
3. Explore the admin panel and client features
4. Check out the API documentation at `http://localhost:3000/api-docs`

---

**Happy coding! 🚗✨**

