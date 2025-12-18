# Social Media Integration Setup Guide

This guide explains how to set up social media integrations for the CRM system.

## Environment Variables

Add the following to your `backend/.env` file:

```env
# ======================
# FACEBOOK / INSTAGRAM
# ======================
# Get these from https://developers.facebook.com/apps/
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_random_verification_token

# ======================
# TWITTER / X
# ======================
# Get these from https://developer.twitter.com/en/portal/dashboard
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# ======================
# LINKEDIN
# ======================
# Get these from https://www.linkedin.com/developers/apps
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# ======================
# GOOGLE / YOUTUBE
# ======================
# Get these from https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ======================
# OAUTH CALLBACK BASE URL
# ======================
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

## Facebook/Instagram Setup

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" as the app type
4. Fill in the details and create

### 2. Add Required Products

Add these products to your app:

- **Facebook Login** - for OAuth authentication
- **Messenger** - for messaging integration
- **Instagram Graph API** - for Instagram access
- **Marketing API** - for ads and lead ads
- **Webhooks** - for real-time updates

### 3. Configure Facebook Login

1. Go to Facebook Login → Settings
2. Add OAuth Redirect URIs:
   - `http://localhost:5000/api/social-media/auth/facebook/callback`
   - `https://yourdomain.com/api/social-media/auth/facebook/callback`

### 4. Request Permissions

Request these permissions in App Review:

- `pages_show_list` - List pages
- `pages_read_engagement` - Read page posts
- `pages_manage_posts` - Publish posts
- `pages_messaging` - Messenger access
- `leads_retrieval` - Lead Ads data
- `ads_read` - Ads insights
- `instagram_basic` - Instagram account access
- `instagram_manage_messages` - Instagram DMs

### 5. Configure Webhooks

1. Go to Webhooks in your app dashboard
2. Subscribe to:
   - Page: `feed`, `messages`, `messaging_postbacks`, `leadgen`
   - Instagram: `messages`, `comments`
3. Set callback URL: `https://yourdomain.com/api/social-media/webhooks/facebook`
4. Set verify token: Same as `FACEBOOK_WEBHOOK_VERIFY_TOKEN` in .env

## Twitter/X Setup

### 1. Create a Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Apply for Elevated access if needed

### 2. Configure OAuth 2.0

1. Go to your app → Settings → User authentication settings
2. Enable OAuth 2.0
3. Set Type to "Web App"
4. Add callback URLs:
   - `http://localhost:5000/api/social-media/auth/twitter/callback`
   - `https://yourdomain.com/api/social-media/auth/twitter/callback`

### 3. Required Scopes

Request these scopes:

- `tweet.read`, `tweet.write`
- `users.read`
- `dm.read`, `dm.write`
- `offline.access` (for refresh tokens)

## LinkedIn Setup

### 1. Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create an app
3. Get company/organization access if needed

### 2. Configure OAuth

1. Go to Auth tab
2. Add redirect URLs:
   - `http://localhost:5000/api/social-media/auth/linkedin/callback`
   - `https://yourdomain.com/api/social-media/auth/linkedin/callback`

### 3. Request Products

Add these products:

- **Sign In with LinkedIn using OpenID Connect**
- **Share on LinkedIn** (requires company verification)
- **Marketing Developer Platform** (for organization posts)

## Google/YouTube Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3

### 2. Configure OAuth Consent Screen

1. Go to APIs & Services → OAuth consent screen
2. Configure the consent screen
3. Add scopes:
   - `youtube.readonly`
   - `youtube.upload`

### 3. Create OAuth Credentials

1. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
2. Select "Web application"
3. Add redirect URIs:
   - `http://localhost:5000/api/social-media/auth/google/callback`
   - `https://yourdomain.com/api/social-media/auth/google/callback`

## Database Migration

Run the migration to create required tables:

```sql
-- Run the migration file
mysql -u your_user -p your_database < backend/migrations/002_create_social_media_tables.sql
mysql -u your_user -p your_database < backend/migrations/003_enhance_social_media_tables.sql
```

## API Endpoints

### OAuth Flow

```
GET /api/social-media/auth/:platform
→ Returns authorization URL for the platform

GET /api/social-media/auth/:platform/callback
→ Handles OAuth callback (public endpoint)
```

### Account Management

```
GET /api/social-media/accounts
→ List all connected accounts

POST /api/social-media/accounts/connect
→ Manually connect account (with token)

DELETE /api/social-media/accounts/:id
→ Disconnect account

GET /api/social-media/accounts/:id/pages
→ Get pages/sub-accounts for connected account
```

### Posts

```
GET /api/social-media/posts
→ List all posts

POST /api/social-media/posts
→ Create and publish post

POST /api/social-media/posts/schedule
→ Schedule post for later
```

### Messaging (Inbox)

```
GET /api/social-media/inbox
→ Get all conversations across platforms

GET /api/social-media/conversations/:id/messages
→ Get messages for a conversation

POST /api/social-media/conversations/:id/messages
→ Send a message
```

### Lead Ads

```
GET /api/social-media/leads/forms
→ Get all lead forms

GET /api/social-media/leads/forms/:formId
→ Get leads from a form

POST /api/social-media/leads/:leadId/import
→ Import lead as CRM contact
```

### Ads & Analytics

```
GET /api/social-media/ads/accounts
→ Get connected ad accounts

GET /api/social-media/ads/accounts/:adAccountId/campaigns
→ Get campaigns

GET /api/social-media/ads/campaigns/:campaignId/insights
→ Get campaign insights

GET /api/social-media/analytics
→ Get overall analytics
```

### Webhooks

```
GET /api/social-media/webhooks/facebook
→ Facebook webhook verification

POST /api/social-media/webhooks/facebook
→ Facebook webhook event handler
```

## Features

### ✅ Implemented

- OAuth authentication for Facebook, Twitter, LinkedIn, Instagram, Google
- Account connection and management
- Post publishing to multiple platforms
- Scheduled posts
- Unified inbox for Messenger/DMs
- Facebook Lead Ads integration
- Lead import to CRM contacts
- Ad account and campaign viewing
- Basic analytics

### 🔜 Coming Soon

- Instagram story publishing
- TikTok integration
- Automated responses (chatbot)
- Advanced analytics and reporting
- Bulk scheduling
- Content calendar view
- Sentiment analysis

## Troubleshooting

### OAuth Errors

1. **Invalid redirect URI**: Make sure the callback URL in your app settings exactly matches
2. **Invalid scope**: Ensure your app has been approved for the required permissions
3. **Token expired**: Implement token refresh logic (already included in services)

### Webhook Not Receiving Events

1. Verify your webhook URL is publicly accessible
2. Check the verify token matches
3. Ensure your app is subscribed to the correct events
4. Check Facebook/platform webhook debugging tools

### API Rate Limits

- Facebook: 200 calls per user per hour
- Twitter: Varies by endpoint
- LinkedIn: 1000 requests per day for member endpoints

Implement caching and rate limiting on your end to avoid hitting limits.

## Security Considerations

1. **Store tokens securely**: Access tokens are encrypted in the database
2. **Use HTTPS in production**: OAuth callbacks require HTTPS
3. **Validate webhooks**: Verify webhook signatures where available
4. **Limit permissions**: Only request scopes you actually need
5. **Token refresh**: Implement automatic token refresh before expiration
