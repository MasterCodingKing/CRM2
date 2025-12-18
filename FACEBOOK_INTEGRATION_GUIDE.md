# Complete Facebook & Social Media Integration Setup Guide

## 🎯 Overview

This guide will walk you through setting up complete Facebook integration for your CRM, including:

- **Facebook Pages** - Manage and publish to your business pages
- **Messenger** - Respond to customer messages directly from CRM
- **Lead Ads** - Auto-import leads from Facebook advertising
- **Instagram** - Connect Instagram Business accounts (via Facebook)
- **Ads Manager** - Track campaign performance and insights

---

## 📋 Prerequisites

- A Facebook Business Account
- Admin access to Facebook Pages you want to connect
- Node.js 16+ and MySQL 8+ installed
- Your CRM backend and frontend running

---

## Part 1: Facebook App Creation (15 minutes)

### Step 1: Create Facebook App

1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select app type: **"Business"**
4. Fill in details:
   - **App Name**: Your CRM Name (e.g., "My CRM System")
   - **App Contact Email**: Your email
   - **Business Account**: Select or create one
5. Click **"Create App"**

### Step 2: Add Required Products

In your app dashboard, add these products:

#### A. Facebook Login

1. Click **"Set Up"** on Facebook Login
2. Select **"Web"** platform
3. Add OAuth Redirect URIs:
   ```
   http://localhost:5000/api/social-media/auth/facebook/callback
   https://yourdomain.com/api/social-media/auth/facebook/callback
   ```
4. Click **"Save Changes"**

#### B. Messenger

1. Click **"Set Up"** on Messenger
2. This will be configured later with webhooks

#### C. Instagram (Optional but Recommended)

1. Click **"Set Up"** on Instagram
2. Will auto-configure with Facebook Login

#### D. Marketing API (For Lead Ads)

1. Click **"Set Up"** on Marketing API
2. Accept terms of service

### Step 3: Configure App Settings

1. Go to **Settings** → **Basic**
2. Note your **App ID** and **App Secret** (you'll need these)
3. Add **Privacy Policy URL**: `https://yourdomain.com/privacy`
4. Add **Terms of Service URL**: `https://yourdomain.com/terms`
5. Add **App Icon** (180x180 pixels minimum)
6. Select **Category**: Business Tools or CRM
7. Click **"Save Changes"**

### Step 4: Set Up Webhooks

1. Go to **Products** → **Webhooks**
2. Click **"Create Subscription"** for **Page**
3. Enter:
   - **Callback URL**: `https://yourdomain.com/api/social-media/webhooks/facebook`
   - **Verify Token**: Create a random string (e.g., `your_random_token_12345`)
4. Subscribe to these fields:
   - ✅ `messages` - For Messenger
   - ✅ `messaging_postbacks` - For button clicks
   - ✅ `messaging_optins` - For opt-ins
   - ✅ `feed` - For posts and comments
   - ✅ `leadgen` - For lead ads
5. Click **"Verify and Save"**

---

## Part 2: CRM Backend Configuration (10 minutes)

### Step 1: Update Environment Variables

Edit `backend/.env` and add:

```env
# Facebook Integration
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_random_token_12345

# App URLs (must match Facebook app settings)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

### Step 2: Run Database Migrations

Run these SQL migrations in order:

```bash
# Connect to MySQL
mysql -u your_user -p your_database

# Run migrations
source backend/migrations/002_create_social_media_tables.sql
source backend/migrations/003_enhance_social_media_tables.sql
source backend/migrations/004_create_facebook_tables.sql
```

Or run them manually via MySQL Workbench or phpMyAdmin.

### Step 3: Restart Backend Server

```bash
cd backend
npm install  # If you added any new packages
npm run dev
```

Verify the server starts without errors.

---

## Part 3: Facebook App Review & Permissions (30-60 minutes)

> **Note**: Facebook requires app review for production use. For testing, you can use your own account immediately.

### Development Mode (For Testing)

1. In Facebook App Dashboard, ensure **"App Mode"** is set to **"Development"**
2. Go to **Roles** → **Roles**
3. Add test users or your own Facebook account as **Admin** or **Developer**
4. You can now test all features with these accounts

### Production Mode (Requires Review)

To use with real customers, you need to request permissions:

#### Step 1: Prepare Materials

Create these documents (can be simple):

- **Privacy Policy** - How you handle user data
- **Terms of Service** - App usage terms
- **Data Deletion Instructions** - How users can delete their data

Upload to your website and add URLs to Facebook App settings.

#### Step 2: Request Permissions

1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:

| Permission                  | Purpose                  | Required? |
| --------------------------- | ------------------------ | --------- |
| `email`                     | Get user email           | ✅ Yes    |
| `public_profile`            | Basic user info          | ✅ Yes    |
| `pages_show_list`           | List user's pages        | ✅ Yes    |
| `pages_read_engagement`     | Read page posts/comments | ✅ Yes    |
| `pages_manage_posts`        | Publish to pages         | Optional  |
| `pages_messaging`           | Messenger access         | ✅ Yes    |
| `leads_retrieval`           | Get lead ads data        | ✅ Yes    |
| `instagram_basic`           | Instagram access         | Optional  |
| `instagram_manage_messages` | Instagram DMs            | Optional  |

#### Step 3: Submit for Review

For each permission:

1. Click **"Request Advanced Access"**
2. Provide:
   - **Detailed description** of how you'll use it
   - **Screencast video** (2-3 minutes) showing the feature
   - **Test account** (optional but helps)
3. Submit and wait 3-7 days for approval

---

## Part 4: Using the Integration (5 minutes)

### Step 1: Access Facebook Integration

1. Start your CRM frontend:
   ```bash
   cd frontend
   npm run dev
   ```
2. Log in to your CRM
3. Navigate to **Marketing** or **Facebook Integration** page

### Step 2: Connect Your Facebook Account

1. Click **"Connect Facebook"** button
2. You'll be redirected to Facebook login
3. Grant all requested permissions
4. You'll be redirected back to your CRM

### Step 3: Connect Facebook Pages

1. After connection, you'll see **"Add Page"** button
2. Click it and select pages you want to connect
3. Each page will be subscribed to webhooks automatically

### Step 4: Test Features

#### Test Messenger

1. Go to **Messenger** tab
2. Send a message to your Facebook Page from a different account
3. You should see it appear in your CRM inbox
4. Reply from CRM and verify it appears on Facebook

#### Test Leads

1. Create a Lead Ad on Facebook (or use existing)
2. Go to **Leads** tab in CRM
3. Click **"Sync Leads"**
4. Leads should appear in the table
5. Click **"Convert"** to create a contact in your CRM

---

## Part 5: Webhook Setup for Production (10 minutes)

### Why Webhooks Matter

Webhooks enable real-time updates:

- New messages appear instantly
- Leads import automatically
- Comments sync immediately

### Requirements

- **HTTPS URL** (required by Facebook)
- **Public domain** (localhost won't work in production)

### Option A: Use ngrok for Testing

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

Update Facebook webhook URL to: `https://abc123.ngrok.io/api/social-media/webhooks/facebook`

### Option B: Deploy to Production

Deploy your backend to:

- **Heroku**: `https://your-app.herokuapp.com`
- **DigitalOcean**: `https://your-domain.com`
- **AWS**: `https://api.your-domain.com`

Then update webhook URL in Facebook app.

### Verify Webhook is Working

1. Go to **Webhooks** in Facebook App Dashboard
2. Click **"Test"** next to your Page subscription
3. Select **"messages"** and click **"Send Test Request"**
4. Check your backend logs - you should see the webhook event

---

## Part 6: Advanced Features

### Auto-Import Leads

To automatically create contacts when leads come in:

1. The webhook is already set up
2. Check `backend/src/controllers/socialIntegration.controller.js`
3. The `handleLeadEvent` function auto-creates contacts
4. Customize the logic as needed

### Auto-Response Messages

To automatically reply to Messenger messages:

1. Edit `backend/src/controllers/socialIntegration.controller.js`
2. In `handleMessengerEvent` function, add:

```javascript
if (data.eventType === "message" && !data.isEcho) {
  // Send auto-response
  await facebookService.sendMessage(
    page.page_access_token,
    data.senderId,
    "Thanks for messaging us! We'll respond shortly."
  );
}
```

### Connect Instagram

If your Facebook Page has an Instagram Business account:

1. The Instagram account is auto-detected when connecting a page
2. You can reply to Instagram DMs from the same Messenger interface
3. No additional setup needed!

---

## 🎛️ Architecture Overview

```
┌─────────────────────┐
│   CRM Frontend      │
│  (React/Vite)       │
└──────────┬──────────┘
           │
           ├─────────────────────────────────────┐
           │                                     │
┌──────────▼──────────┐            ┌────────────▼─────────┐
│  Facebook OAuth     │            │   Messenger/Leads    │
│  (Connect Account)  │            │   (Sync Data)        │
└──────────┬──────────┘            └────────────┬─────────┘
           │                                     │
┌──────────▼───────────────────────────────────▼─────────┐
│              Express.js Backend                         │
│  - /api/social-media/auth/:platform                     │
│  - /api/facebook/pages                                  │
│  - /api/facebook/messages                               │
│  - /api/facebook/leads                                  │
│  - /api/social-media/webhooks/facebook (webhook)        │
└──────────┬───────────────────────────────────┬─────────┘
           │                                    │
┌──────────▼──────────┐            ┌───────────▼─────────┐
│   MySQL Database    │            │  Facebook Platform  │
│  - Organizations    │            │  - Graph API        │
│  - Users            │            │  - Webhooks         │
│  - Contacts         │            │  - OAuth            │
│  - FacebookPages    │            └─────────────────────┘
│  - FacebookMessages │
│  - FacebookLeads    │
└─────────────────────┘
```

---

## 🔧 Troubleshooting

### Issue: "OAuth redirect URI mismatch"

**Solution**: Make sure the callback URL in Facebook app matches exactly:

- Check protocol (http vs https)
- Check port number
- Check path (`/api/social-media/auth/facebook/callback`)

### Issue: "Webhook verification failed"

**Solution**:

1. Check `FACEBOOK_WEBHOOK_VERIFY_TOKEN` in `.env` matches Facebook setting
2. Ensure webhook URL is publicly accessible (use ngrok for testing)
3. Check backend logs for errors

### Issue: "No pages showing up"

**Solution**:

1. Verify you're an admin of the Facebook Page
2. Check if `pages_show_list` permission was granted
3. Try disconnecting and reconnecting your account

### Issue: "Messages not appearing in CRM"

**Solution**:

1. Verify webhook is subscribed to `messages` field
2. Check Page webhook subscription is active
3. Test webhook delivery in Facebook App Dashboard
4. Check backend logs for webhook events

### Issue: "Leads not syncing"

**Solution**:

1. Verify webhook is subscribed to `leadgen` field
2. Check if `leads_retrieval` permission is granted
3. Manually sync using "Sync Leads" button
4. Verify you have active lead forms

---

## 📊 Database Schema Reference

### facebook_pages

- Stores connected Facebook Pages
- Includes page tokens and metadata
- Links to `social_media_accounts`

### facebook_messages

- All Messenger conversations
- Direction: incoming/outgoing
- Can link to CRM contacts

### facebook_leads

- Leads from Lead Ads
- Auto-parsed fields (email, phone, etc.)
- Can convert to contacts/deals

---

## 🚀 Next Steps

1. **Connect Twitter/X**: Similar flow, see `SOCIAL_MEDIA_SETUP.md`
2. **Connect LinkedIn**: Business page posting and messaging
3. **Connect Instagram**: Already included with Facebook
4. **Add Analytics**: Track campaign ROI and lead quality
5. **Chatbots**: Build automated responses for common questions

---

## 📚 Additional Resources

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api/)
- [Messenger Platform Docs](https://developers.facebook.com/docs/messenger-platform/)
- [Lead Ads API](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/)
- [Webhooks Reference](https://developers.facebook.com/docs/graph-api/webhooks/)

---

## 🆘 Support

Having issues? Check:

1. **Backend logs**: `backend/server.log` or console output
2. **Frontend console**: Browser DevTools → Console
3. **Facebook App Dashboard**: Webhooks → View Events
4. **Database**: Verify tables were created correctly

---

**Setup Complete! 🎉**

Your CRM now has full Facebook integration. You can manage pages, respond to messages, import leads, and track campaigns all from one place.

Need help with other platforms? Check out:

- `SOCIAL_MEDIA_SETUP.md` - General social media setup
- `EMAIL_SETUP.md` - Email integration
- `RBAC_QUICK_SETUP.md` - User permissions
