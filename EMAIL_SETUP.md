# Complete Email System Setup Guide

This CRM system provides **full email functionality** including sending emails via SMTP and receiving emails via IMAP with automatic reply detection and threading.

## 🚀 Quick Setup Summary

1. **Configure Gmail/Outlook credentials** in `.env` file
2. **Enable 2FA and generate App Password** for Gmail
3. **Enable IMAP access** in email settings
4. **Start the backend server** - email system activates automatically
5. **Test by composing an email** and check if received emails appear

## 📋 Detailed Setup Instructions

### Step 1: Configure Environment Variables

Edit your `backend/.env` file and add these email credentials:

```env
# SMTP Configuration (for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# IMAP Configuration (for receiving emails)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
```

### Step 2: Gmail Setup (Recommended)

Follow these steps **in order** to set up Gmail integration:

#### 2a. Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" and enable it
3. Complete the phone verification process
4. **Wait 5-10 minutes** for activation

#### 2b. Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other (Custom name)" as the device
4. Name it **"CRM System"**
5. Click **"Generate"**
6. **Copy the 16-character password** (like: `abcd efgh ijkl mnop`)
7. **Paste this into both `SMTP_PASS` and `IMAP_PASS`** in your `.env`

#### 2c. Enable IMAP Access

1. Open Gmail → Click ⚙️ Settings → "See all settings"
2. Go to **"Forwarding and POP/IMAP"** tab
3. Find "IMAP access" section
4. Select **"Enable IMAP"**
5. Click **"Save Changes"**

#### 2d. Update Your .env File

```env
# Gmail Configuration - Replace with YOUR details
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-16-char-app-password
```

### Step 3: Alternative Email Providers

#### **Outlook/Office 365 Setup**

1. **Enable IMAP in Outlook:**

   - Sign in to Outlook.com
   - Go to Settings ⚙️ → Mail → Sync email
   - Enable "IMAP access"

2. **Configure .env:**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com

IMAP_HOST=outlook.office365.com
IMAP_PORT=993
IMAP_USER=your-email@outlook.com
IMAP_PASS=your-password
```

#### **For Development/Testing Only**

**Mailtrap** (catches emails without sending):

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
# Note: Mailtrap doesn't support IMAP receiving
```

**SendGrid** (sending only, no IMAP):

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## 🎯 Step 4: Start the System

### 4a. Start Backend Server

```bash
cd backend
npm start
# OR for development with auto-reload:
npm run dev
```

**Look for these success messages:**

```
✅ Email service is ready
✅ IMAP connection ready - Email receiver is active
🚀 Server running on port 5000
```

### 4b. Start Frontend

```bash
cd frontend
npm run dev
```

## 📧 Step 5: Test Your Email System

### Test Sending Emails

1. Open CRM → **"Emails"** page
2. Click **"Compose Email"**
3. Fill in subject and message
4. Choose recipient (contact or all contacts)
5. Click **"Send Email"**
6. ✅ Email should appear in sent list

### Test Receiving Emails

1. Send an email **TO** your CRM email address from any email client
2. Wait **30-60 seconds** (system checks every 30s)
3. ✅ Email should appear in CRM emails list with **green "Received"** badge
4. Click the email to view details
5. Click **"Reply"** to test reply functionality

### Test Reply Threading

1. Reply to any received email from CRM
2. Then reply to that same email from your external email client
3. ✅ All replies should be grouped under the original email

## 🔧 How the Email System Works

### Automatic Email Processing

- **IMAP Connection**: Connects to your email server on startup
- **Real-time Monitoring**: Checks for new emails every 30 seconds
- **Smart Threading**: Groups replies with original emails automatically
- **Latest First**: Shows newest emails at the top of the list
- **Status Tracking**: Tracks sent/received/failed email status

### Email Types & Visual Indicators

- **📧 Sent Emails**: Blue icon, shows "To: recipient@email.com"
- **✅ Received Emails**: Green icon with "Received" badge, shows "From: sender@email.com"
- **💬 Replies**: Grouped under original email, shows reply count
- **👥 Bulk Emails**: Purple icon, shows "X recipients"

### Reply Intelligence

- **Smart Recipient Detection**: Replies to correct sender automatically
- **Subject Threading**: Maintains "Re:" prefix for proper threading
- **Conversation History**: Shows full email thread in detail view
- **Reply All Support**: For bulk emails sent to multiple recipients

## Features

### Sending Features

- ✅ Compose and send emails directly from CRM
- ✅ Send to individual contacts or all contacts (bulk)
- ✅ Professional HTML templates with CRM branding
- ✅ Email status tracking (sent/failed)
- ✅ Error handling and logging

### Receiving Features

- ✅ **IMAP integration** - automatically receive emails
- ✅ **Latest emails on top** - newest emails appear first
- ✅ **Reply functionality** - reply to any received email
- ✅ **Email threading** - groups replies with original emails
- ✅ **Auto-detection** - identifies replies and conversations
- ✅ **Real-time sync** - checks for new emails every 30 seconds
- ✅ **Multi-provider support** - Gmail, Outlook, and others

## 🔍 Troubleshooting Guide

### ❌ Email Not Sending

**Check Console Output:**
Look for messages like: `❌ Email service not configured properly`

**Solutions:**

1. **Verify SMTP credentials** in `.env` file
   - Double-check username/password
   - Ensure no extra spaces in credentials
2. **Gmail Users**: Must use App Password (not regular password)
3. **Check Backend Logs**: Run `npm run dev` and watch for errors
4. **Test SMTP Connection**: Backend shows `✅ Email service is ready` on startup

### ❌ Email Not Receiving

**Check Console Output:**
Look for: `IMAP connection error` or `IMAP credentials not configured`

**Solutions:**

1. **Verify IMAP credentials** match SMTP credentials exactly
2. **Enable IMAP** in your email provider settings
3. **Gmail Users**:
   - Must enable IMAP in Gmail settings
   - Use same App Password for both SMTP and IMAP
4. **Firewall Issues**: Allow ports 993 (IMAP) and 587 (SMTP)
5. **Wait Time**: System checks every 30 seconds, be patient

### 🐛 Common Error Messages

**"SMTP connection error"**

- Wrong SMTP credentials or host
- Check `.env` file for typos

**"IMAP connection error"**

- Wrong IMAP credentials or IMAP not enabled
- For Gmail: Enable IMAP in settings

**"Authentication failed"**

- Using regular password instead of App Password (Gmail)
- 2FA not enabled (Gmail requirement)

**"Connect ECONNREFUSED"**

- Firewall blocking connection
- Wrong host/port configuration

### 🔧 Debug Steps

1. **Check Environment Variables:**

```bash
# In backend directory
node -e "require('dotenv').config(); console.log({
  SMTP_USER: process.env.SMTP_USER,
  IMAP_USER: process.env.IMAP_USER,
  SMTP_HOST: process.env.SMTP_HOST,
  IMAP_HOST: process.env.IMAP_HOST
})"
```

2. **Verify Email Provider Settings:**

   - Gmail: Settings → Forwarding and POP/IMAP → Enable IMAP
   - Outlook: Settings → Mail → Sync email → Enable IMAP

3. **Test with External Client:**
   - Try connecting to IMAP with Thunderbird/Mail app
   - Use same credentials as in `.env` file

### 🆘 Still Having Issues?

**For Development:**

- Use **Mailtrap** for testing (catches all emails safely)
- Disable IMAP temporarily by removing IMAP\_ variables

**Network Issues:**

- Check corporate firewall settings
- Try different ports: 465 (SSL) instead of 587 (TLS)
- Some ISPs block email ports

**Gmail Specific:**

- Ensure 2FA is enabled (required for App Passwords)
- Wait 10 minutes after generating App Password
- Try "Less secure app access" if App Password fails (not recommended)

## ⚡ Quick Reference

### Working Example (.env)

```env
# Gmail Configuration (Replace with YOUR details)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # 16-char App Password
SMTP_FROM=your-email@gmail.com

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=abcd efgh ijkl mnop  # Same App Password
```

### Success Indicators

✅ Backend startup shows: `Email service is ready`  
✅ Backend startup shows: `IMAP connection ready`  
✅ Can send email from CRM interface  
✅ Received emails appear with green badge  
✅ Reply button works on received emails

### Key Features You Get

- **📤 Send emails** to contacts directly from CRM
- **📥 Receive emails** automatically via IMAP
- **🔄 Reply functionality** with proper threading
- **📋 Latest emails first** - newest at top
- **👥 Bulk email support** - send to multiple contacts
- **🧵 Conversation threading** - groups related emails
- **⚡ Real-time sync** - checks every 30 seconds

## 🔒 Security & Production Notes

### Security Best Practices

- ✅ **Never commit `.env`** to version control (already in `.gitignore`)
- ✅ **Use App Passwords** instead of regular passwords
- ✅ **Enable 2FA** on your email account
- ✅ **Rate limiting** is already implemented in the backend
- ✅ **Input validation** prevents email injection attacks

### Production Recommendations

- **Email Service**: Use SendGrid/AWS SES for high volume
- **SMTP Credentials**: Store in secure environment variables
- **Monitoring**: Set up alerts for email failures
- **Backup**: Configure backup email provider
- **SSL**: Use SSL certificates for production domains

---

## 🎉 You're All Set!

Your CRM now has a **complete email system** with:

- Two-way email communication (send & receive)
- Automatic threading and organization
- Modern, intuitive interface
- Professional email templates
- Real-time synchronization

**Test it now:** Send yourself an email and watch it appear in the CRM! 🚀
