npm # 🚀 Quick Start Guide

## Get Your CRM Running in 5 Minutes!

### Step 1: Create Database (1 minute)

Open MySQL and run:

```sql
CREATE DATABASE crm_db;
```

### Step 2: Setup Backend (2 minutes)

```powershell
# Go to backend folder
cd backend

# Install packages
npm install

# Create environment file
Copy-Item .env.example .env

# Edit .env file - update these lines:
# DB_PASSWORD=your_mysql_password
# JWT_SECRET=any-random-string-here
# JWT_REFRESH_SECRET=another-random-string

# Start backend
npm run dev
```

✅ Backend should now be running on http://localhost:5000

### Step 3: Setup Frontend (2 minutes)

Open a **new terminal**:

```powershell
# Go to frontend folder
cd frontend

# Install packages
npm install

# Create environment file (uses defaults)
Copy-Item .env.example .env

# Start frontend
npm run dev
```

✅ Frontend should now be running on http://localhost:5173

### Step 4: Start Using! (30 seconds)

1. Open http://localhost:5173 in your browser
2. Click "Sign up"
3. Fill in the form (this creates your organization)
4. You're in! 🎉

---

## What You Get

✅ **Fully Functional CRM with:**

- User authentication & registration
- Contact management
- Deal pipeline with Kanban board
- Activity tracking (notes, tasks, calls, meetings)
- Dashboard with analytics
- Multi-tenancy support (each organization isolated)

✅ **Professional Features:**

- JWT authentication
- Role-based access control
- Rate limiting
- Error handling
- Responsive design
- Real-time updates

---

## Quick Test

After signing up, try this:

1. **Add a Contact** → Contacts page → "Add Contact" button
2. **Create a Deal** → Deals page → "Add Deal" button
3. **Add an Activity** → Activities page → "Add Activity" button
4. **Check Dashboard** → See your stats update!

---

## Troubleshooting

**Backend won't start?**

- Is MySQL running?
- Did you update `.env` with your MySQL password?

**Frontend won't connect?**

- Is backend running on port 5000?
- Check terminal for errors

**Need help?**

- Check README.md for detailed docs
- Check browser console (F12)
- Check terminal logs

---

## Next Steps

📚 Read the full documentation: `README.md`  
🎓 Learn about all features: `CRM_DEVELOPMENT_GUIDE.md`  
💻 Customize for your needs!

**Happy CRM-ing! 🚀**
