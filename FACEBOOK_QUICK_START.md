# ✅ Facebook Integration - Quick Start Checklist

## 🎯 Goal

Get Facebook integration running in under 30 minutes!

---

## ☑️ Phase 1: Database Setup (5 minutes)

- [ ] Open MySQL client (Workbench, phpMyAdmin, or command line)
- [ ] Run migration file:
  ```bash
  mysql -u your_user -p your_database < backend/migrations/004_create_facebook_tables.sql
  ```
- [ ] Verify tables created:
  ```sql
  SHOW TABLES LIKE 'facebook%';
  ```
  Should show: `facebook_pages`, `facebook_messages`, `facebook_leads`

---

## ☑️ Phase 2: Facebook App Setup (15 minutes)

- [ ] Go to https://developers.facebook.com/
- [ ] Click "My Apps" → "Create App"
- [ ] Choose "Business" type
- [ ] Name it (e.g., "My CRM")
- [ ] Add products:
  - [ ] Facebook Login
  - [ ] Messenger
  - [ ] Marketing API (for leads)
- [ ] Go to Settings → Basic
- [ ] Copy **App ID** and **App Secret**
- [ ] Add OAuth redirect URL:
  ```
  http://localhost:5000/api/social-media/auth/facebook/callback
  ```

---

## ☑️ Phase 3: CRM Configuration (5 minutes)

- [ ] Edit `backend/.env`:

  ```env
  FACEBOOK_APP_ID=paste_your_app_id
  FACEBOOK_APP_SECRET=paste_your_app_secret
  FACEBOOK_WEBHOOK_VERIFY_TOKEN=make_up_random_string_123
  FRONTEND_URL=http://localhost:5173
  BACKEND_URL=http://localhost:5000
  ```

- [ ] Restart backend:

  ```bash
  cd backend
  npm run dev
  ```

- [ ] Restart frontend:
  ```bash
  cd frontend
  npm run dev
  ```

---

## ☑️ Phase 4: First Connection (5 minutes)

- [ ] Open browser to `http://localhost:5173`
- [ ] Login to your CRM
- [ ] Navigate to Marketing or Facebook page
- [ ] Click **"Connect Facebook"** button
- [ ] Log in with your Facebook account
- [ ] Grant all permissions
- [ ] Verify you're redirected back to CRM
- [ ] See your account listed

---

## ☑️ Phase 5: Connect a Page (2 minutes)

- [ ] Click **"Add Page"** button
- [ ] Select your Facebook account from dropdown
- [ ] Wait for pages to load
- [ ] Click **"Connect"** on a page
- [ ] Verify page appears in list with:
  - ✅ Page name and picture
  - ✅ Follower count
  - ✅ Webhook status

---

## ☑️ Phase 6: Test Messenger (3 minutes)

- [ ] Go to **Messenger** tab in CRM
- [ ] Open Facebook in another browser/tab
- [ ] Send message to your Page (from your personal account)
- [ ] Check CRM - message should appear!
- [ ] Reply from CRM
- [ ] Verify reply shows on Facebook

---

## ☑️ Phase 7: Test Leads (Optional - 5 minutes)

**Only if you have Lead Ads:**

- [ ] Go to **Leads** tab in CRM
- [ ] Click **"Sync Leads"**
- [ ] Select your Page
- [ ] Verify leads appear in table
- [ ] Click **"Convert"** on a lead
- [ ] Check Contacts page - new contact should exist!

---

## 🎉 Success Criteria

You're done when you can:

✅ See Facebook account connected
✅ See Facebook Page listed
✅ Send and receive messages via Messenger
✅ (Optional) Import and convert leads

---

## 🚨 Troubleshooting

### ❌ "OAuth redirect mismatch"

**Fix**: Make sure URL in Facebook app settings exactly matches:

```
http://localhost:5000/api/social-media/auth/facebook/callback
```

### ❌ "No pages showing"

**Fix**:

1. Ensure you're Page admin
2. Try reconnecting Facebook account
3. Check browser console for errors

### ❌ "Messages not appearing"

**Fix**:

1. Ensure page is connected (not just account)
2. Check backend logs for webhook events
3. Verify webhook subscription in Facebook App

### ❌ "Database errors"

**Fix**:

1. Verify migration ran successfully
2. Check all tables exist: `SHOW TABLES LIKE 'facebook%';`
3. Restart backend server

---

## 📞 Need Help?

Check these files:

- **Detailed Setup**: [FACEBOOK_INTEGRATION_GUIDE.md](FACEBOOK_INTEGRATION_GUIDE.md)
- **Implementation Summary**: [FACEBOOK_IMPLEMENTATION_SUMMARY.md](FACEBOOK_IMPLEMENTATION_SUMMARY.md)
- **All Platforms**: [SOCIAL_PLATFORMS_QUICK_REFERENCE.md](SOCIAL_PLATFORMS_QUICK_REFERENCE.md)

---

## ⏭️ What's Next?

After basic setup works:

1. **Production Webhooks** (10 min)

   - Deploy backend to production
   - Update webhook URL in Facebook
   - Test real-time updates

2. **App Review** (submit, wait 3-7 days)

   - Required for non-admin users
   - See full guide for details

3. **Instagram** (instant!)

   - Connect Instagram to your Page
   - Auto-detected by CRM
   - DMs work same as Messenger

4. **Other Platforms** (15 min each)
   - Twitter/X
   - LinkedIn
   - YouTube

---

## ✨ Quick Tips

- 💡 Test with your own accounts first
- 💡 Use "Development Mode" in Facebook for testing
- 💡 Keep backend console open to see API calls
- 💡 Check browser DevTools for frontend errors
- 💡 Use ngrok for webhook testing before production

---

**Ready? Start with Phase 1! ⬆️**

Total time: ~30 minutes for basic setup, fully functional integration! 🎯
