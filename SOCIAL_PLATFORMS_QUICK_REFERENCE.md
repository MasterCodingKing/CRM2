# Quick Setup: All Social Media Platforms

## Platform Comparison

| Platform      | OAuth       | Messaging    | Lead Ads    | Post Scheduling | Analytics      |
| ------------- | ----------- | ------------ | ----------- | --------------- | -------------- |
| **Facebook**  | ✅          | ✅ Messenger | ✅ Lead Ads | ✅              | ✅ Ads Manager |
| **Instagram** | ✅ (via FB) | ✅ DMs       | ❌          | ✅              | ✅ Insights    |
| **Twitter/X** | ✅          | ✅ DMs       | ❌          | ✅              | ✅ Analytics   |
| **LinkedIn**  | ✅          | ✅ InMail    | ✅ Lead Gen | ✅              | ✅ Campaign    |
| **YouTube**   | ✅          | ✅ Comments  | ❌          | ✅ Upload       | ✅ Studio      |
| **TikTok**    | ✅          | ❌           | ❌          | ✅              | ✅ Business    |

---

## 1. Instagram Setup (via Facebook)

Instagram integrates through Facebook Business. No separate app needed!

### Prerequisites

- Instagram Business or Creator account
- Connected to a Facebook Page

### Steps

1. Complete Facebook setup first (see [FACEBOOK_INTEGRATION_GUIDE.md](FACEBOOK_INTEGRATION_GUIDE.md))
2. Connect Instagram to your Facebook Page:
   - Go to Facebook Page Settings
   - Click "Instagram" → "Connect Account"
   - Log in to Instagram
3. When connecting the Facebook Page in CRM, Instagram is auto-detected
4. Instagram DMs appear in same Messenger interface

### Permissions Needed

- `instagram_basic`
- `instagram_manage_messages`
- `instagram_manage_comments`

---

## 2. Twitter/X Setup

### Step 1: Create Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Note your **API Key**, **API Secret**, **Client ID**, **Client Secret**

### Step 2: Configure OAuth 2.0

1. In app settings, enable OAuth 2.0
2. Set **Type**: Web App
3. Add callback URL:
   ```
   http://localhost:5000/api/social-media/auth/twitter/callback
   https://yourdomain.com/api/social-media/auth/twitter/callback
   ```

### Step 3: Update .env

```env
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
```

### Step 4: Connect in CRM

1. Navigate to Marketing page
2. Click "Connect Twitter"
3. Authorize access
4. Start posting and managing DMs!

### Features Available

- ✅ Post tweets
- ✅ Schedule tweets
- ✅ Direct messages (DMs)
- ✅ Analytics (impressions, engagements)
- ❌ Lead ads (not available on Twitter)

---

## 3. LinkedIn Setup

### Step 1: Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in details:
   - App name
   - LinkedIn Page (must have one)
   - Privacy policy URL
   - Logo

### Step 2: Request Products

1. Click "Products" tab
2. Request access to:
   - **Sign In with LinkedIn** - OAuth
   - **Share on LinkedIn** - Post to feed
   - **Advertising API** - Lead gen forms (if using ads)

### Step 3: Configure OAuth

1. Go to "Auth" tab
2. Add redirect URLs:
   ```
   http://localhost:5000/api/social-media/auth/linkedin/callback
   https://yourdomain.com/api/social-media/auth/linkedin/callback
   ```

### Step 4: Update .env

```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

### Features Available

- ✅ Post to company pages
- ✅ Schedule posts
- ✅ Lead gen forms (with Advertising API)
- ✅ Analytics (impressions, clicks, engagement)
- ⚠️ InMail (requires Sales Navigator API)

---

## 4. YouTube Setup (via Google)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable these APIs:
   - YouTube Data API v3
   - YouTube Analytics API
   - Google+ API

### Step 2: Create OAuth 2.0 Credentials

1. Go to "Credentials"
2. Create "OAuth 2.0 Client ID"
3. Application type: Web application
4. Add authorized redirect URIs:
   ```
   http://localhost:5000/api/social-media/auth/google/callback
   https://yourdomain.com/api/social-media/auth/google/callback
   ```

### Step 3: Update .env

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Features Available

- ✅ Upload videos
- ✅ Manage comments
- ✅ Analytics (views, watch time, engagement)
- ✅ Live chat moderation
- ❌ YouTube Shorts (separate API)

---

## 5. TikTok Setup

### Step 1: TikTok for Business

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create developer account
3. Create app

### Step 2: Request Permissions

1. Apply for "Login Kit"
2. Apply for "Content Posting API"
3. Wait for approval (can take 1-2 weeks)

### Step 3: Update .env

```env
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
```

### Features Available (Limited)

- ✅ Post videos
- ✅ Basic analytics
- ❌ Messaging (not available via API)
- ❌ Comments management (limited)

---

## Environment Variables Summary

Add all these to `backend/.env`:

```env
# ======================
# FACEBOOK / INSTAGRAM
# ======================
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_random_verification_token

# ======================
# TWITTER / X
# ======================
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# ======================
# LINKEDIN
# ======================
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# ======================
# GOOGLE / YOUTUBE
# ======================
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ======================
# TIKTOK
# ======================
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# ======================
# APP URLS
# ======================
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

---

## Database Tables Used

All platforms use these tables:

### social_media_accounts

- Stores OAuth tokens for all platforms
- One row per connected account

### social_media_posts

- Published posts across all platforms
- Includes scheduled posts

### social_media_comments

- Comments and replies
- Nested structure for threads

### facebook_pages (Facebook specific)

- Facebook Page details
- Page-level access tokens

### facebook_messages (Facebook/Instagram specific)

- Messenger and Instagram DM conversations
- Can link to CRM contacts

### facebook_leads (Facebook specific)

- Lead Ads data
- Auto-import to contacts

---

## Feature Availability Matrix

### Posting

| Platform  | Text           | Images | Videos | Stories | Reels | Carousels |
| --------- | -------------- | ------ | ------ | ------- | ----- | --------- |
| Facebook  | ✅             | ✅     | ✅     | ❌      | ✅    | ✅        |
| Instagram | ✅             | ✅     | ✅     | ✅      | ✅    | ✅        |
| Twitter   | ✅ (280 char)  | ✅     | ✅     | ❌      | ❌    | ✅        |
| LinkedIn  | ✅ (3000 char) | ✅     | ✅     | ❌      | ❌    | ✅        |
| YouTube   | ❌             | ❌     | ✅     | ❌      | ❌    | ❌        |
| TikTok    | ✅             | ❌     | ✅     | ❌      | ❌    | ❌        |

### Messaging

| Platform  | Direct Messages | Group Chat | Auto-Reply | Chatbots   |
| --------- | --------------- | ---------- | ---------- | ---------- |
| Facebook  | ✅ Messenger    | ✅         | ✅         | ✅         |
| Instagram | ✅ DMs          | ❌         | ✅         | ⚠️ Limited |
| Twitter   | ✅ DMs          | ✅         | ✅         | ✅         |
| LinkedIn  | ✅ InMail       | ❌         | ❌         | ❌         |
| YouTube   | ✅ Comments     | ❌         | ✅         | ❌         |
| TikTok    | ❌              | ❌         | ❌         | ❌         |

---

## Multi-Platform Posting

To post to multiple platforms at once:

```javascript
// Example: Post to Facebook, Twitter, and LinkedIn simultaneously
const platforms = ["facebook", "twitter", "linkedin"];
const message = "Check out our new product!";
const imageUrl = "https://example.com/image.jpg";

for (const platform of platforms) {
  await socialMediaService.createPost({
    platform,
    accountId: accountIds[platform],
    message,
    imageUrl,
    scheduledFor: new Date("2024-01-01T10:00:00Z"), // Optional
  });
}
```

---

## Analytics & Reporting

Each platform provides different metrics:

### Facebook/Instagram

- Impressions, Reach
- Engagement (likes, comments, shares)
- Follower growth
- Best posting times
- Audience demographics

### Twitter

- Impressions, Engagements
- Retweets, Quote tweets
- Profile visits
- Top tweets

### LinkedIn

- Impressions, Clicks
- Engagement rate
- Follower demographics
- Company page analytics

### YouTube

- Views, Watch time
- Subscribers gained
- Average view duration
- Traffic sources

---

## Best Practices

### Security

- ✅ Never commit API keys to Git
- ✅ Use environment variables for all secrets
- ✅ Encrypt tokens in database
- ✅ Implement token refresh logic
- ✅ Use HTTPS for webhooks

### Rate Limiting

- Facebook: 200 calls/hour/user
- Twitter: 300 tweets/3 hours
- LinkedIn: 100 posts/day
- YouTube: 10,000 units/day

### Content

- ✅ Customize message per platform
- ✅ Use optimal image sizes
- ✅ Schedule for best times
- ✅ Respond to messages quickly
- ✅ Track what performs best

---

## Troubleshooting

### "Token expired" errors

- Implement token refresh logic
- Ask user to reconnect account
- Check token expiry in database

### "Rate limit exceeded"

- Queue posts to spread them out
- Cache API responses
- Respect platform limits

### "Permission denied"

- Verify app has required permissions
- Check app is approved in production mode
- Verify user granted all scopes

---

## Next Steps

1. ✅ Set up Facebook (start here - easiest)
2. ✅ Add Instagram (auto-included with Facebook)
3. ✅ Connect Twitter for real-time engagement
4. ✅ Add LinkedIn for B2B leads
5. ⏳ YouTube for video content
6. ⏳ TikTok for younger demographics

---

## Support

Each platform has developer documentation:

- [Facebook for Developers](https://developers.facebook.com/)
- [Twitter API Docs](https://developer.twitter.com/)
- [LinkedIn API Docs](https://docs.microsoft.com/en-us/linkedin/)
- [YouTube API Docs](https://developers.google.com/youtube/)
- [TikTok for Developers](https://developers.tiktok.com/)

---

**Happy Marketing! 📱🚀**
