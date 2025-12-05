# CRM System - Complete Setup Guide

A fully functional Customer Relationship Management system built with React, Node.js, Express, MySQL, and Sequelize.

## Features

✅ **Authentication System**

- User registration with organization creation
- JWT-based login/logout
- Role-based access control (Admin, Manager, User)
- Multi-tenancy support

✅ **Contact Management**

- Create, read, update, delete contacts
- Search and filter functionality
- Status tracking (Lead, Qualified, Customer, Inactive)
- Pagination support

✅ **Deal Pipeline**

- Kanban board view
- Customizable pipeline stages
- Drag-and-drop support (UI ready)
- Deal value tracking
- Win/loss management

✅ **Activity Tracking**

- Notes, calls, emails, meetings, tasks
- Timeline view
- Task completion tracking
- Activity linking to contacts and deals

✅ **Dashboard**

- Real-time statistics
- Pipeline analytics
- Revenue tracking
- Recent activities feed
- Upcoming tasks widget

## Tech Stack

### Backend

- Node.js 18+
- Express.js
- Sequelize ORM
- MySQL 8.0+
- JWT Authentication
- bcryptjs for password hashing
- Winston for logging
- Helmet for security
- Rate limiting

### Frontend

- React 18
- Vite
- TailwindCSS
- React Router
- TanStack Query (React Query)
- Zustand (State Management)
- Recharts (Analytics)
- Axios
- Lucide React (Icons)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18+ ([Download](https://nodejs.org/))
- MySQL 8.0+ ([Download](https://dev.mysql.com/downloads/))
- Git

## Installation

### 1. Database Setup

First, create the MySQL database:

```sql
CREATE DATABASE crm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
Copy-Item .env.example .env

# Edit .env file with your database credentials
# Update these values:
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=crm_db
# DB_USER=your_mysql_user
# DB_PASSWORD=your_mysql_password
# JWT_SECRET=change-this-to-a-random-secret-key
# JWT_REFRESH_SECRET=change-this-to-another-random-key

# The server will auto-create tables on first run in development mode
```

### 3. Frontend Setup

```powershell
# Open a new terminal
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
Copy-Item .env.example .env

# The default values should work:
# VITE_API_URL=http://localhost:5000/api
```

## Running the Application

### Start Backend Server

```powershell
# In backend directory
npm run dev
```

The API server will start on http://localhost:5000

### Start Frontend Development Server

```powershell
# In frontend directory (new terminal)
npm run dev
```

The frontend will start on http://localhost:5173

## First Time Usage

1. Open your browser and navigate to http://localhost:5173
2. Click "Sign up" to create a new account
3. Fill in the registration form:
   - Organization Name (your company name)
   - Your name and email
   - Password
4. After registration, you'll be automatically logged in
5. A default sales pipeline will be created for you

## Default Features

When you register a new organization, the system automatically creates:

- ✅ Your organization record
- ✅ Admin user account
- ✅ Default sales pipeline with stages:
  - Lead (10% probability)
  - Qualified (25% probability)
  - Proposal (50% probability)
  - Negotiation (75% probability)
  - Closed Won (100% probability)

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user and organization
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user info

### Contacts

- `GET /api/contacts` - List contacts (with pagination and filters)
- `GET /api/contacts/:id` - Get contact details
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Deals

- `GET /api/deals` - List deals
- `GET /api/deals/:id` - Get deal details
- `POST /api/deals` - Create deal
- `PUT /api/deals/:id` - Update deal
- `PUT /api/deals/:id/stage` - Update deal stage
- `POST /api/deals/:id/won` - Mark deal as won
- `POST /api/deals/:id/lost` - Mark deal as lost
- `DELETE /api/deals/:id` - Delete deal

### Activities

- `GET /api/activities` - List activities
- `POST /api/activities` - Create activity
- `PUT /api/activities/:id` - Update activity
- `PUT /api/activities/:id/complete` - Mark task as complete
- `DELETE /api/activities/:id` - Delete activity

### Pipelines

- `GET /api/pipelines` - List pipelines
- `POST /api/pipelines` - Create pipeline
- `PUT /api/pipelines/:id` - Update pipeline
- `PUT /api/pipelines/:id/default` - Set as default

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics

## Project Structure

```
CRM2.2/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # Sequelize models
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Auth, validation, error handling
│   │   ├── utils/          # Helpers (JWT, logger)
│   │   └── app.js          # Express app setup
│   ├── server.js           # Server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Zustand stores
│   │   ├── main.jsx        # App entry point
│   │   └── index.css       # Tailwind styles
│   ├── index.html
│   └── package.json
│
└── CRM_DEVELOPMENT_GUIDE.md
```

## Troubleshooting

### Backend won't start

- Check if MySQL is running
- Verify database credentials in `.env`
- Ensure port 5000 is not in use

### Frontend won't start

- Check if backend is running on port 5000
- Ensure port 5173 is not in use
- Clear npm cache: `npm cache clean --force`

### Database connection errors

- Verify MySQL service is running
- Check database name exists
- Confirm user has proper permissions

### CORS errors

- Ensure backend `FRONTEND_URL` matches frontend URL
- Check if both servers are running

## Security Notes

⚠️ **Important for Production:**

1. Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random values
2. Use environment-specific `.env` files
3. Enable HTTPS
4. Set up proper database backups
5. Implement rate limiting (already included)
6. Review and update CORS settings
7. Use strong database passwords
8. Don't commit `.env` files to git

## Development vs Production

### Development Mode

- Auto-sync database models
- Detailed error logging
- Hot reload enabled
- CORS allows localhost

### Production Mode (Future)

- Manual migrations required
- Minimal error details
- Optimized builds
- Restricted CORS
- Environment variables from hosting provider

## Next Steps

Now that your CRM is running, you can:

1. ✅ Add your first contact
2. ✅ Create a deal and move it through the pipeline
3. ✅ Add activities and tasks
4. ✅ Explore the dashboard analytics
5. ✅ Invite team members (feature ready to implement)
6. ✅ Customize your pipeline stages

## Support

For issues or questions:

- Check the CRM_DEVELOPMENT_GUIDE.md for detailed information
- Review the code comments
- Check browser console for frontend errors
- Check terminal logs for backend errors

## License

This project is provided as-is for educational and commercial use.

---

**Built with ❤️ for small business success**
