# Complete CRM Development Guide

## Solo Developer Edition

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Project Structure](#project-structure)
5. [Development Roadmap](#development-roadmap)
6. [Feature Specifications](#feature-specifications)
7. [API Endpoints](#api-endpoints)
8. [Security Implementation](#security-implementation)
9. [Deployment Guide](#deployment-guide)
10. [Marketing & Launch](#marketing--launch)

---

## Project Overview

### Product Vision

A modern, niche-focused CRM built for [YOUR TARGET MARKET]. Simple, fast, and affordable.

### Core Value Proposition

- Simpler than Salesforce
- More affordable than HubSpot
- Built specifically for [YOUR NICHE]

### Target Customer

- Small to medium businesses (5-50 employees)
- [Specific industry/use case]
- Budget: $20-100/month
- Need: Better contact and pipeline management

### Pricing Strategy

- **Starter**: $29/month (1-3 users)
- **Professional**: $59/month (4-10 users)
- **Business**: $99/month (11-25 users)
- 14-day free trial, no credit card required

---

## Tech Stack

### Frontend

- **React 18** with Vite
- **TailwindCSS** for styling
- **React Router** for navigation
- **TanStack Query** (React Query) for server state
- **Zustand** for client state
- **React Hook Form** for forms
- **Recharts** for analytics
- **date-fns** for date handling

### Backend

- **Node.js 18+** with Express
- **Sequelize ORM** with MySQL
- **JWT** for authentication
- **Nodemailer** for emails (dev), **SendGrid** (production)
- **Bull** with Redis for background jobs
- **Winston** for logging
- **Helmet** for security headers
- **express-rate-limit** for rate limiting

### Database

- **MySQL 8.0+**
- PlanetScale or AWS RDS recommended for production

### DevOps & Tools

- **Git** + GitHub
- **PM2** for process management
- **Sentry** for error tracking
- **Docker** for local development (optional)

---

## Database Schema

### Core Tables

#### 1. Organizations

```sql
CREATE TABLE organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  plan VARCHAR(50) DEFAULT 'starter',
  status ENUM('active', 'suspended', 'cancelled') DEFAULT 'active',
  trial_ends_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. Users

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('admin', 'manager', 'user') DEFAULT 'user',
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_org_email (organization_id, email)
);
```

#### 3. Contacts

```sql
CREATE TABLE contacts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  owner_id INT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  job_title VARCHAR(255),
  source VARCHAR(100),
  status ENUM('lead', 'qualified', 'customer', 'inactive') DEFAULT 'lead',
  tags JSON,
  custom_fields JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_org_contacts (organization_id, status),
  INDEX idx_owner (owner_id),
  INDEX idx_email (email)
);
```

#### 4. Deals

```sql
CREATE TABLE deals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  contact_id INT,
  owner_id INT,
  title VARCHAR(255) NOT NULL,
  value DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  stage VARCHAR(100) NOT NULL,
  probability INT DEFAULT 0,
  expected_close_date DATE,
  closed_at DATETIME,
  status ENUM('open', 'won', 'lost') DEFAULT 'open',
  lost_reason TEXT,
  custom_fields JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_org_deals (organization_id, status, stage)
);
```

#### 5. Activities

```sql
CREATE TABLE activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  user_id INT,
  contact_id INT,
  deal_id INT,
  type ENUM('note', 'call', 'email', 'meeting', 'task') NOT NULL,
  subject VARCHAR(255),
  description TEXT,
  scheduled_at DATETIME,
  completed_at DATETIME,
  is_completed BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
  INDEX idx_org_activities (organization_id, created_at),
  INDEX idx_contact (contact_id),
  INDEX idx_deal (deal_id)
);
```

#### 6. Pipelines

```sql
CREATE TABLE pipelines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  stages JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_org_pipelines (organization_id)
);

-- stages JSON format:
-- [
--   {"id": 1, "name": "Lead", "order": 0, "probability": 10},
--   {"id": 2, "name": "Qualified", "order": 1, "probability": 25},
--   {"id": 3, "name": "Proposal", "order": 2, "probability": 50},
--   {"id": 4, "name": "Negotiation", "order": 3, "probability": 75},
--   {"id": 5, "name": "Closed Won", "order": 4, "probability": 100}
-- ]
```

#### 7. Custom Fields

```sql
CREATE TABLE custom_fields (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  entity_type ENUM('contact', 'deal', 'company') NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type ENUM('text', 'number', 'date', 'select', 'multiselect', 'boolean') NOT NULL,
  options JSON,
  is_required BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_field (organization_id, entity_type, field_name)
);
```

#### 8. Email Templates

```sql
CREATE TABLE email_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT false,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## Project Structure

### Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── email.js
│   ├── models/
│   │   ├── index.js
│   │   ├── Organization.js
│   │   ├── User.js
│   │   ├── Contact.js
│   │   ├── Deal.js
│   │   ├── Activity.js
│   │   ├── Pipeline.js
│   │   └── CustomField.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── contacts.routes.js
│   │   ├── deals.routes.js
│   │   ├── activities.routes.js
│   │   └── pipelines.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── users.controller.js
│   │   ├── contacts.controller.js
│   │   ├── deals.controller.js
│   │   ├── activities.controller.js
│   │   └── pipelines.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── email.service.js
│   │   ├── contact.service.js
│   │   └── analytics.service.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── tenancy.middleware.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── jwt.js
│   │   └── validators.js
│   ├── jobs/
│   │   ├── emailQueue.js
│   │   └── analyticsQueue.js
│   └── app.js
├── tests/
│   ├── unit/
│   └── integration/
├── migrations/
├── seeders/
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   └── Loading.jsx
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Layout.jsx
│   │   ├── contacts/
│   │   │   ├── ContactList.jsx
│   │   │   ├── ContactForm.jsx
│   │   │   └── ContactDetail.jsx
│   │   ├── deals/
│   │   │   ├── Pipeline.jsx
│   │   │   ├── DealCard.jsx
│   │   │   └── DealForm.jsx
│   │   └── dashboard/
│   │       ├── Stats.jsx
│   │       └── Charts.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Contacts.jsx
│   │   ├── Deals.jsx
│   │   ├── Activities.jsx
│   │   └── Settings.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useContacts.js
│   │   ├── useDeals.js
│   │   └── useActivities.js
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.service.js
│   │   ├── contacts.service.js
│   │   └── deals.service.js
│   ├── store/
│   │   ├── authStore.js
│   │   └── uiStore.js
│   ├── utils/
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Development Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Goal: Working authentication and basic contact management**

#### Week 1: Setup & Authentication

- [ ] Initialize Git repository
- [ ] Setup backend (Express + Sequelize)
- [ ] Setup frontend (Vite + React + Tailwind)
- [ ] Database schema creation
- [ ] JWT authentication implementation
- [ ] User registration endpoint
- [ ] Login endpoint
- [ ] Password reset flow

#### Week 2: Organization & User Management

- [ ] Organization creation on signup
- [ ] Multi-tenancy middleware
- [ ] User profile management
- [ ] Role-based access control (admin, manager, user)
- [ ] User invitation system
- [ ] Basic settings page

#### Week 3: Contact Management Core

- [ ] Contact CRUD endpoints
- [ ] Contact list view with pagination
- [ ] Contact detail page
- [ ] Contact form (create/edit)
- [ ] Search functionality
- [ ] Filter by status, owner
- [ ] Contact import from CSV

#### Week 4: Polish & Testing

- [ ] Error handling standardization
- [ ] Form validation (frontend + backend)
- [ ] Loading states
- [ ] Success/error notifications
- [ ] Basic unit tests
- [ ] API endpoint testing
- [ ] Bug fixes from manual testing

### Phase 2: Core CRM Features (Weeks 5-8)

#### Week 5: Deals & Pipeline

- [ ] Pipeline creation and management
- [ ] Default pipeline setup
- [ ] Deal CRUD endpoints
- [ ] Kanban board view for deals
- [ ] Drag-and-drop functionality
- [ ] Deal detail modal
- [ ] Link deals to contacts

#### Week 6: Activities & Timeline

- [ ] Activity CRUD endpoints
- [ ] Activity types (note, call, email, meeting, task)
- [ ] Activity timeline view
- [ ] Task management with due dates
- [ ] Completed tasks tracking
- [ ] Activity filters
- [ ] Link activities to contacts/deals

#### Week 7: Dashboard & Analytics

- [ ] Dashboard layout
- [ ] Key metrics cards (total contacts, deals, revenue)
- [ ] Deals by stage chart
- [ ] Revenue over time chart
- [ ] Recent activities feed
- [ ] Upcoming tasks widget
- [ ] Performance analytics

#### Week 8: Custom Fields & Flexibility

- [ ] Custom field definition UI
- [ ] Custom field CRUD endpoints
- [ ] Dynamic form generation
- [ ] Custom field rendering in views
- [ ] Field validation
- [ ] Import/export with custom fields

### Phase 3: Enhancement & Polish (Weeks 9-12)

#### Week 9: Email Integration

- [ ] Email template management
- [ ] Send email from contact/deal view
- [ ] Email logging as activity
- [ ] SendGrid integration
- [ ] Email delivery tracking
- [ ] Template variables

#### Week 10: Advanced Features

- [ ] Bulk actions (edit, delete, assign)
- [ ] Advanced filtering
- [ ] Saved views
- [ ] Tags system
- [ ] File attachments
- [ ] Notes with rich text

#### Week 11: Team Collaboration

- [ ] Activity mentions (@user)
- [ ] Assignment notifications
- [ ] Team activity feed
- [ ] Shared email templates
- [ ] User performance reports

#### Week 12: Mobile & Optimization

- [ ] Mobile responsive design
- [ ] Performance optimization
- [ ] Database query optimization
- [ ] Frontend bundle optimization
- [ ] SEO for marketing pages
- [ ] Final bug fixes

### Phase 4: Launch Preparation (Weeks 13-16)

#### Week 13: Billing & Subscriptions

- [ ] Stripe integration
- [ ] Subscription plans setup
- [ ] Payment flow
- [ ] Trial management
- [ ] Upgrade/downgrade logic
- [ ] Billing portal

#### Week 14: Security & Compliance

- [ ] Security audit
- [ ] Rate limiting tuning
- [ ] Data encryption at rest
- [ ] GDPR compliance features
- [ ] Privacy policy page
- [ ] Terms of service page

#### Week 15: Documentation & Support

- [ ] User documentation
- [ ] Video tutorials
- [ ] Help center articles
- [ ] Onboarding flow
- [ ] Sample data seeding
- [ ] Support ticket system

#### Week 16: Deploy & Launch

- [ ] Production environment setup
- [ ] Domain and SSL configuration
- [ ] Database migration to production
- [ ] Monitoring and alerts
- [ ] Backup automation
- [ ] Soft launch to beta users
- [ ] Official launch

---

## Feature Specifications

### 1. Authentication System

**Registration Flow:**

1. User submits email, password, organization name
2. System creates organization record
3. System creates user as admin
4. System creates default pipeline
5. System sends welcome email
6. User redirected to onboarding

**Security Requirements:**

- Password minimum 8 characters
- At least one uppercase, lowercase, number
- JWT access token (15 min expiry)
- JWT refresh token (7 days expiry)
- Secure httpOnly cookies
- Rate limiting: 5 attempts per 15 minutes

### 2. Contact Management

**Contact Fields:**

- Basic: First name, last name, email, phone
- Professional: Company, job title
- Meta: Source, status, tags
- Custom: User-defined fields
- System: Owner, created date, updated date

**Features:**

- List view with sorting and pagination
- Detail view with activity timeline
- Quick add form
- Bulk import from CSV
- Duplicate detection
- Merge duplicates
- Export to CSV

**Filters:**

- By status (lead, qualified, customer)
- By owner (my contacts, team contacts, all)
- By source
- By tags
- By date range
- Custom field filters

### 3. Deal Pipeline

**Pipeline Stages (Default):**

1. Lead (10% probability)
2. Qualified (25% probability)
3. Proposal Sent (50% probability)
4. Negotiation (75% probability)
5. Closed Won (100% probability)

**Deal Features:**

- Drag-and-drop between stages
- Deal value and currency
- Expected close date
- Win/loss tracking
- Lost reason capture
- Deal progress probability
- Revenue forecasting

**Views:**

- Kanban board (default)
- List view with filters
- Forecast view
- Won/lost analysis

### 4. Activity Management

**Activity Types:**

- **Note**: Free-form text entry
- **Call**: Call log with duration
- **Email**: Email sent/received
- **Meeting**: Scheduled meeting with date/time
- **Task**: To-do item with due date

**Features:**

- Create from contact/deal view
- Activity timeline
- Upcoming tasks dashboard
- Overdue task alerts
- Task completion tracking
- Activity search
- Filter by type, date, user

### 5. Dashboard & Reports

**Dashboard Widgets:**

- Total contacts, deals, revenue
- Deals by stage (bar chart)
- Revenue trend (line chart)
- Win rate percentage
- Average deal size
- Sales cycle length
- Recent activities feed
- Upcoming tasks

**Reports:**

- Sales performance by user
- Pipeline health
- Conversion rates by stage
- Revenue forecasting
- Activity summary
- Custom date ranges
- Export to PDF/CSV

---

## API Endpoints

### Authentication

```
POST   /api/auth/register          - Register new organization + user
POST   /api/auth/login             - Login
POST   /api/auth/refresh           - Refresh access token
POST   /api/auth/logout            - Logout
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password with token
GET    /api/auth/me                - Get current user info
```

### Users

```
GET    /api/users                  - List organization users
GET    /api/users/:id              - Get user details
PUT    /api/users/:id              - Update user
DELETE /api/users/:id              - Delete user (admin only)
POST   /api/users/invite           - Invite new user
PUT    /api/users/:id/role         - Update user role (admin only)
```

### Contacts

```
GET    /api/contacts               - List contacts (paginated, filtered)
GET    /api/contacts/:id           - Get contact details
POST   /api/contacts               - Create contact
PUT    /api/contacts/:id           - Update contact
DELETE /api/contacts/:id           - Delete contact
POST   /api/contacts/import        - Bulk import from CSV
GET    /api/contacts/export        - Export to CSV
POST   /api/contacts/bulk          - Bulk update/delete
GET    /api/contacts/:id/activities - Get contact activities
```

### Deals

```
GET    /api/deals                  - List deals (paginated, filtered)
GET    /api/deals/:id              - Get deal details
POST   /api/deals                  - Create deal
PUT    /api/deals/:id              - Update deal
DELETE /api/deals/:id              - Delete deal
PUT    /api/deals/:id/stage        - Move deal to different stage
POST   /api/deals/:id/won          - Mark deal as won
POST   /api/deals/:id/lost         - Mark deal as lost
GET    /api/deals/:id/activities   - Get deal activities
```

### Activities

```
GET    /api/activities             - List activities (paginated, filtered)
GET    /api/activities/:id         - Get activity details
POST   /api/activities             - Create activity
PUT    /api/activities/:id         - Update activity
DELETE /api/activities/:id         - Delete activity
PUT    /api/activities/:id/complete - Mark task as complete
```

### Pipelines

```
GET    /api/pipelines              - List pipelines
GET    /api/pipelines/:id          - Get pipeline details
POST   /api/pipelines              - Create pipeline
PUT    /api/pipelines/:id          - Update pipeline
DELETE /api/pipelines/:id          - Delete pipeline
PUT    /api/pipelines/:id/default  - Set as default pipeline
```

### Custom Fields

```
GET    /api/custom-fields          - List custom fields
POST   /api/custom-fields          - Create custom field
PUT    /api/custom-fields/:id      - Update custom field
DELETE /api/custom-fields/:id      - Delete custom field
```

### Dashboard & Analytics

```
GET    /api/dashboard/stats        - Get dashboard statistics
GET    /api/analytics/pipeline     - Pipeline analytics
GET    /api/analytics/revenue      - Revenue analytics
GET    /api/analytics/performance  - User performance
```

---

## Security Implementation

### 1. Authentication Middleware

```javascript
// backend/src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

module.exports = { authenticateToken, authorize };
```

### 2. Multi-tenancy Middleware

```javascript
// backend/src/middlewares/tenancy.middleware.js
const ensureTenancy = (req, res, next) => {
  // Add organization_id filter to all queries
  req.tenancy = {
    organization_id: req.user.organization_id,
  };
  next();
};

module.exports = { ensureTenancy };
```

### 3. Rate Limiting

```javascript
// backend/src/middlewares/rateLimiter.middleware.js
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many login attempts, please try again later",
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later",
});

module.exports = { authLimiter, apiLimiter };
```

### 4. Input Validation

```javascript
// backend/src/middlewares/validation.middleware.js
const { body, validationResult } = require("express-validator");

const validateContact = [
  body("email").optional().isEmail().normalizeEmail(),
  body("phone").optional().isMobilePhone(),
  body("first_name").optional().trim().isLength({ min: 1, max: 100 }),
  body("last_name").optional().trim().isLength({ min: 1, max: 100 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateContact };
```

### 5. Environment Variables

```bash
# .env.example
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=crm_db
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (Development)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_pass

# Email (Production)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@yourcrm.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Sentry (Error Tracking)
SENTRY_DSN=your_sentry_dsn
```

---

## Deployment Guide

### 1. Frontend Deployment (Vercel)

**Steps:**

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables:
   - `VITE_API_URL=https://api.yourcrm.com`
5. Deploy

**Custom Domain:**

- Add domain in Vercel dashboard
- Update DNS records as instructed
- SSL automatically provisioned

### 2. Backend Deployment (Railway)

**Steps:**

1. Create new project on Railway
2. Connect GitHub repository
3. Add MySQL database service
4. Add Redis service
5. Configure environment variables (copy from .env)
6. Deploy

**Database Setup:**

```bash
# Run migrations
npm run migrate

# Seed default data
npm run seed
```

### 3. Database (PlanetScale)

**Why PlanetScale:**

- Managed MySQL with automatic backups
- Branching for safe migrations
- No connection limits
- Free tier available

**Setup:**

1. Create account at planetscale.com
2. Create database
3. Get connection string
4. Update DB_HOST, DB_USER, DB_PASSWORD in env

### 4. Email (SendGrid)

**Setup:**

1. Create account at sendgrid.com
2. Verify domain
3. Create API key
4. Update SENDGRID_API_KEY in env
5. Create email templates in SendGrid

### 5. Monitoring (Sentry)

**Setup:**

1. Create account at sentry.io
2. Create project (Node.js for backend, React for frontend)
3. Get DSN
4. Install SDK:

```bash
npm install @sentry/node @sentry/react
```

5. Initialize in app

### 6. Domain Setup

**DNS Records:**

```
A     @              76.76.21.21  (Vercel IP)
A     www            76.76.21.21
CNAME api            your-app.up.railway.app
CNAME www            cname.vercel-dns.com
```

---

## Marketing & Launch

### Pre-Launch Checklist (2 weeks before)

**Product:**

- [ ] All MVP features working
- [ ] No critical bugs
- [ ] Mobile responsive
- [ ] Fast loading times
- [ ] SSL certificate active
- [ ] Error tracking active
- [ ] Backup system tested

**Marketing Assets:**

- [ ] Landing page live
- [ ] Product screenshots/videos
- [ ] Pricing page
- [ ] Feature comparison
- [ ] FAQ page
- [ ] Blog (3-5 articles)
- [ ] Help documentation

**Legal:**

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie Policy
- [ ] GDPR compliance

**Analytics:**

- [ ] Google Analytics setup
- [ ] Conversion tracking
- [ ] User behavior tracking
- [ ] Error monitoring

### Launch Strategy

**Week 1: Soft Launch**

- Launch to friends and family
- Collect feedback
- Fix critical issues
- Refine onboarding

**Week 2: Beta Launch**

- Post on Reddit (r/SaaS, r/startups, r/entrepreneur)
- Post on Indie Hackers
- Share on Twitter/LinkedIn
- Reach out to 50 potential customers directly
- Offer beta discount (50% off for 6 months)

**Week 3-4: Public Launch**

- Product Hunt launch
- Hacker News post
- LinkedIn articles
- Guest posts on relevant blogs
- Outreach to industry newsletters
- Start paid ads (Google, Facebook)

**Month 2-3: Growth**

- Content marketing (SEO blog posts)
- YouTube tutorials
- Podcast appearances
- Partnerships/integrations
- Affiliate program
- Customer success stories

### Launch Platforms

**Product Hunt:**

- Schedule for Tuesday-Thursday (best days)
- Prepare hunter outreach list
- Create teaser gif/video
- Engage with comments all day
- Offer special launch discount

**Hacker News:**

- Post on "Show HN"
- Clear, honest title
- Be ready to answer questions
- Don't be salesy
- Focus on technical details

**Reddit:**

- Build karma first (2-4 weeks)
- Participate genuinely in communities
- Follow subreddit rules carefully
- Respond to all comments
- Don't delete negative feedback

### Growth Channels

**1. Content Marketing**

- Write 2-3 blog posts per week
- Focus on pain points and solutions
- Target long-tail keywords
- Build backlinks
- Repurpose content (Twitter, LinkedIn)

**2. SEO**

- On-page optimization
- Technical SEO audit
- Build quality backlinks
- Create comparison pages (vs Salesforce, vs HubSpot)
- Guest posting

**3. Paid Ads**

- Start with $500/month budget
- Test Google Search ads
- Test Facebook/Instagram ads
- LinkedIn ads for B2B
- Retargeting campaigns

**4. Partnerships**

- Integration with popular tools (Zapier, Slack)
- Affiliate program (20% recurring)
- Co-marketing with complementary tools
- Reseller partnerships

**5. Email Marketing**

- Build email list from day one
- Weekly newsletter
- Drip campaigns for trials
- Product updates
- Educational content

### Pricing Experiments

**Month 1-2:**

- Test current pricing
- Track conversion rates
- Survey users about pricing

**Month 3-4:**

- A/B test different price points
- Test annual vs monthly
- Add/remove features per tier

**Month 5-6:**

- Optimize based on data
- Consider adding enterprise tier
- Grandfather existing customers

### Customer Acquisition Cost (CAC) Goals

**Initial Goals:**

- CAC: $100-200
- Lifetime Value (LTV): $600-1200
- LTV:CAC ratio: 3:1 minimum
- Payback period: 6-12 months

**Channels ROI Tracking:**

- Organic: $0 CAC (time investment)
- Content: $50-100 CAC
- Paid ads: $200-400 CAC
- Partnerships: $50-150 CAC

### Key Metrics to Track

**Product Metrics:**

- Sign-up conversion rate
- Trial-to-paid conversion
- Churn rate (target <5% monthly)
- Feature adoption rates
- Time to value
- Daily/Monthly active users

**Business Metrics:**

- Monthly Recurring Revenue (MRR)
- MRR growth rate
- Customer Lifetime Value (LTV)
- Customer Acquisition Cost (CAC)
- Net revenue retention
- Gross profit margin

**Marketing Metrics:**

- Website traffic
- Conversion rates by channel
- Email open/click rates
- Social media engagement
- Blog traffic and rankings
- Ad performance (CTR, CPC, ROAS)

---

## Success Milestones

### Month 1-3: Getting Started

- [ ] 10 paying customers
- [ ] $500 MRR
- [ ] Product fully functional
- [ ] Basic marketing in place
- [ ] Customer feedback loop established

### Month 4-6: Early Traction

- [ ] 50 paying customers
- [ ] $3,000 MRR
- [ ] First case study completed
- [ ] 3+ traffic channels working
- [ ] Positive unit economics

### Month 7-12: Growth

- [ ] 200 paying customers
- [ ] $12,000 MRR
- [ ] Small team (2-3 people)
- [ ] Automated onboarding
- [ ] Strong word-of-mouth

### Year 2: Scale

- [ ] 500+ paying customers
- [ ] $30,000+ MRR
- [ ] Full-time on product
- [ ] Multiple revenue channels
- [ ] Community building

---

## Common Pitfalls to Avoid

### Technical Pitfalls

1. **Over-engineering early**: Build simple first, add complexity later
2. **Ignoring security**: Implement from day one
3. **Poor database design**: Plan schema carefully
4. **No error tracking**: Set up Sentry immediately
5. **Skipping tests**: Write tests for critical paths

### Product Pitfalls

1. **Too many features**: Focus on core value proposition
2. **Ignoring feedback**: Listen to early users
3. **Poor onboarding**: Make first experience amazing
4. **Complicated UI**: Keep it simple and intuitive
5. **No mobile support**: Mobile is critical

### Business Pitfalls

1. **Underpricing**: Charge what you're worth
2. **No marketing**: Build audience from day one
3. **Ignoring metrics**: Track everything
4. **Poor customer support**: Respond quickly
5. **Giving up too early**: Takes 6-12 months to gain traction

---

## Resources & Tools

### Learning Resources

- **Y Combinator Startup School**: Free online course
- **Indie Hackers**: Community and resources
- **MicroConf**: Conferences and content
- **The SaaS Playbook**: Comprehensive guide
- **Practical Dev**: Development tutorials

### Tools

- **Design**: Figma, TailwindUI
- **Analytics**: Plausible, Mixpanel
- **Email**: SendGrid, Mailgun
- **Support**: Crisp, Intercom
- **Payments**: Stripe
- **Hosting**: Vercel, Railway
- **Monitoring**: Sentry, UptimeRobot

### Communities

- **Indie Hackers**: indie hackers.com
- **r/SaaS**: reddit.com/r/SaaS
- **Twitter**: #buildinpublic
- **Discord**: Various SaaS communities
- **ProductHunt**: Product feedback

---

## Final Thoughts

Building a SaaS CRM as a solo developer is challenging but absolutely achievable. The key is to:

1. **Start small**: MVP first, then iterate
2. **Ship fast**: Get feedback early and often
3. **Focus on value**: Solve real problems
4. **Market early**: Build audience while building product
5. **Be patient**: Success takes time (6-24 months)
6. **Stay consistent**: Small progress daily compounds
7. **Learn constantly**: Stay updated with tech and business

Remember: Every successful SaaS started with version 1.0. Your goal is to launch, learn, and iterate. Don't aim for perfection—aim for value.

**Good luck! 🚀**

---

## Appendix

### A. Quick Start Commands

**Backend Setup:**

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run migrate
npm run seed
npm run dev
```

**Frontend Setup:**

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### B. Useful SQL Queries

**Get organization statistics:**

```sql
SELECT
  o.name,
  COUNT(DISTINCT u.id) as users,
  COUNT(DISTINCT c.id) as contacts,
  COUNT(DISTINCT d.id) as deals,
  SUM(CASE WHEN d.status = 'won' THEN d.value ELSE 0 END) as revenue
FROM organizations o
LEFT JOIN users u ON o.id = u.organization_id
LEFT JOIN contacts c ON o.id = c.organization_id
LEFT JOIN deals d ON o.id = d.organization_id
WHERE o.id = ?
GROUP BY o.id;
```

**Get pipeline conversion rates:**

```sql
SELECT
  stage,
  COUNT(*) as deals,
  COUNT(CASE WHEN status = 'won' THEN 1 END) as won,
  ROUND(COUNT(CASE WHEN status = 'won' THEN 1 END) * 100.0 / COUNT(*), 2) as win_rate
FROM deals
WHERE organization_id = ?
GROUP BY stage;
```

### C. Environment Setup Checklist

**Development:**

- [ ] Node.js 18+ installed
- [ ] MySQL 8.0+ running
- [ ] Redis running
- [ ] Git configured
- [ ] Code editor (VS Code recommended)
- [ ] Postman or similar for API testing

**Production:**

- [ ] Domain purchased
- [ ] DNS configured
- [ ] SSL certificate
- [ ] Database hosted (PlanetScale/RDS)
- [ ] Redis hosted
- [ ] Email service (SendGrid)
- [ ] Error tracking (Sentry)
- [ ] Monitoring (UptimeRobot)
- [ ] Backup system

---

**Document Version:** 1.0  
**Last Updated:** December 4, 2025  
**Author:** Solo Developer Guide  
**License:** Use freely for your own projects
