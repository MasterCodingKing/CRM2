# Email Configuration Guide

This CRM system uses **Nodemailer** to send emails directly from the application.

## Setup Instructions

### 1. Configure Environment Variables

Edit `backend/.env` file and add your email credentials:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### 2. Gmail Setup (Recommended for Testing)

If using Gmail:

1. **Enable 2-Factor Authentication** on your Google Account

   - Go to: https://myaccount.google.com/security

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "CRM App"
   - Copy the 16-character password
   - Use this password in `SMTP_PASS` (not your regular Gmail password)

### 3. Other Email Providers

#### **Outlook/Office 365**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### **SendGrid** (Production Recommended)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### **Mailtrap** (Development/Testing)

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

## How It Works

1. **Create Email Activity**: Add an email activity with:

   - Subject
   - Description (email body)
   - Email Address

2. **Send Email**:

   - Automatically sent when activity is created
   - Or click "Send Email" button to send manually
   - Button shows "Resend Email" if already sent

3. **Email Template**: Professional HTML email template with:
   - Subject as heading
   - Description as content
   - Sender's name
   - CRM branding

## Features

- ✅ Automatic email sending on activity creation
- ✅ Manual email sending via button
- ✅ Resend capability
- ✅ Email status tracking (sent/failed)
- ✅ Professional HTML templates
- ✅ Error handling and logging

## Troubleshooting

**Email not sending?**

1. Check your SMTP credentials in `.env`
2. Verify your email provider allows SMTP
3. For Gmail, ensure you're using an App Password
4. Check backend console logs for errors

**Still having issues?**

- Use Mailtrap for development (catches all emails)
- Check firewall/antivirus blocking port 587
- Try port 465 with `secure: true` for SSL

## Security Notes

- Never commit `.env` file to version control
- Use App Passwords, not actual passwords
- For production, use professional email services (SendGrid, AWS SES)
- Enable rate limiting to prevent abuse
