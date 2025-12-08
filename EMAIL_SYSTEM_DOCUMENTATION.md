# Email System Documentation

## Overview

The CRM email system allows authenticated users to send emails to individual contacts or all contacts at once using a composable interface.

---

## Architecture Flow

```
Frontend (React) → API Request → Backend (Express) → Nodemailer → SMTP Server → Recipient
```

---

## 1. Frontend Components

### **Path:** `frontend/src/pages/ComposeEmail.jsx`

**Purpose:** User interface for composing and sending emails

**Features:**

- Select recipient type (All Customers / Individual Customer)
- Compose subject and message
- Form validation
- Success/Error notifications
- Authentication check before submission

**Key Functions:**

#### `handleSubmit(e)`

- **Triggered:** When user clicks "Send Email" button
- **Process:**
  1. Validates user is authenticated (checks localStorage for `accessToken`)
  2. Determines recipient email(s) based on selection:
     - If "All Customers": Collects all contact emails from fetched data
     - If "Individual Customer": Gets email of selected contact
  3. Validates that recipient email exists
  4. Sends POST request to `/api/email/send` with payload:
     ```json
     {
       "to": "email@example.com",
       "subject": "Email subject",
       "message": "Email body text"
     }
     ```
  5. Handles success/error responses
  6. Redirects to login if token is invalid (403/401 errors)

#### `handleClear()`

- Resets all form fields to empty state

**State Management:**

- `formData`: Stores subject and message
- `sendto`: Stores recipient type selection ("1" = All, "2" = Individual)
- `customername`: Stores selected contact ID for individual emails
- `loading`: Boolean for submission state
- `success`: Boolean for success message display
- `error`: String for error message display

**Dependencies:**

- `@tanstack/react-query`: Fetches contacts list
- `contactsService.getAll()`: Retrieves contact data
- `api.post()`: Makes authenticated API calls

---

## 2. API Layer

### **Path:** `frontend/src/services/api.js`

**Purpose:** Axios instance with authentication interceptors

**Configuration:**

- Base URL: `http://localhost:5000/api` (or `VITE_API_URL` from env)
- Content-Type: `application/json`

**Request Interceptor:**

```javascript
// Automatically adds Bearer token to all requests
config.headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`;
```

**Response Interceptor:**

```javascript
// Handles 401 errors by clearing tokens and redirecting to login
if (error.response?.status === 401) {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
}
```

---

## 3. Backend Routes

### **Path:** `backend/src/routes/email.routes.js`

**Endpoint:** `POST /api/email/send`

**Protection:** Requires authentication (`authenticateToken`) and tenancy (`ensureTenancy`)

**Route Registration:**

```javascript
router.post("/send", emailController.sendEmail);
```

### **Path:** `backend/src/routes/index.js`

**Mounts email routes:**

```javascript
router.use("/email", authenticateToken, ensureTenancy, emailRoutes);
```

**Full Path:** `/api/email/send`

---

## 4. Authentication Middleware

### **Path:** `backend/src/middlewares/auth.middleware.js`

#### `authenticateToken(req, res, next)`

**Purpose:** Verifies JWT token from request headers

**Process:**

1. Extracts token from `Authorization: Bearer <token>` header
2. Verifies token using `verifyAccessToken()` from JWT utility
3. Decodes token and attaches user data to `req.user`
4. Returns 401 if token missing
5. Returns 403 if token invalid/expired

**Success:** Calls `next()` and continues to controller
**Failure:** Returns error response and stops request

---

## 5. Email Controller

### **Path:** `backend/src/controllers/email.controller.js`

#### `sendEmail(req, res)`

**Purpose:** Handles email sending logic

**Request Body:**

```json
{
  "to": "email@example.com" or "email1@example.com, email2@example.com",
  "subject": "Email subject",
  "message": "Email message body"
}
```

**Validation Steps:**

1. Checks if `to`, `subject`, `message` are present (400 if missing)
2. Validates email format using regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
3. Returns 400 if any email is invalid

**Process:**

1. Splits comma-separated emails and trims whitespace
2. Validates each email address
3. Calls `sendComposedEmail()` from email service
4. Logs email activity with user ID
5. Returns success response with messageId

**Success Response (200):**

```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<unique-message-id>",
    "accepted": ["email@example.com"]
  }
}
```

**Error Responses:**

- 400: Validation errors (missing fields, invalid email)
- 500: Email sending failures (SMTP errors)

---

## 6. Email Service

### **Path:** `backend/src/utils/emailService.js`

**Purpose:** Core email sending functionality

#### `sendEmail({ to, subject, text, html })`

**Purpose:** Low-level email sending function

**Process:**

1. Gets sender email from environment variables (`SMTP_FROM` or `SMTP_USER`)
2. Constructs mail options:
   ```javascript
   {
     from: '"CRM System" <your-email@gmail.com>',
     to: 'recipient@example.com',
     subject: 'Subject',
     text: 'Plain text version',
     html: '<div>HTML version</div>'
   }
   ```
3. Sends email via Nodemailer transporter
4. Logs success/failure
5. Returns result object with messageId, accepted, rejected

**Returns:**

```javascript
{
  success: true,
  messageId: '<message-id>',
  accepted: ['email@example.com'],
  rejected: []
}
```

#### `sendComposedEmail({ to, subject, message })`

**Purpose:** Wrapper for compose form emails

**Process:**

1. Converts plain text message to HTML:
   ```javascript
   const html = `
     <div style="font-family: Arial, sans-serif; padding: 20px;">
       ${message.replace(/\n/g, "<br>")}
     </div>
   `;
   ```
2. Calls `sendEmail()` with both text and HTML versions
3. Returns result from `sendEmail()`

---

## 7. Email Configuration

### **Path:** `backend/src/config/email.config.js`

**Purpose:** Nodemailer transporter configuration

**Environment Variables Required:**

```env
SMTP_HOST=smtp.gmail.com         # SMTP server hostname
SMTP_PORT=587                    # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@gmail.com   # Email account username
SMTP_PASS=your-app-password      # Email account password/app password
SMTP_FROM=your-email@gmail.com   # Sender email address
```

**Transporter Configuration:**

```javascript
{
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465', // true for SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
}
```

**Connection Verification:**

- Runs on startup to verify SMTP configuration
- Logs success: "✅ Email service is ready"
- Logs errors: "❌ Email service not configured properly"

---

## Complete Request Flow

### Step-by-Step Process:

1. **User fills form** in `ComposeEmail.jsx`

   - Selects recipients (All/Individual)
   - Enters subject and message
   - Clicks "Send Email"

2. **Frontend validation**

   - Checks if user is authenticated
   - Validates recipient selection
   - Extracts contact email(s) from fetched data
   - Logs request details to console

3. **API request sent**

   - `api.post('/email/send', { to, subject, message })`
   - Axios interceptor adds `Authorization: Bearer <token>` header
   - Request sent to `http://localhost:5000/api/email/send`

4. **Backend receives request**

   - Express routes to `/api/email/send`
   - `authenticateToken` middleware verifies JWT token
   - `ensureTenancy` middleware checks tenant context
   - Request forwarded to `emailController.sendEmail()`

5. **Controller processes request**

   - Extracts `to`, `subject`, `message` from body
   - Validates all fields are present
   - Validates email format(s)
   - Splits multiple emails if comma-separated

6. **Email service sends email**

   - `sendComposedEmail()` converts message to HTML
   - `sendEmail()` constructs mail options
   - Nodemailer transporter sends via SMTP
   - Returns messageId and accepted/rejected lists

7. **Response returned**

   - Controller logs activity
   - Returns success JSON response
   - Frontend receives response

8. **Frontend handles response**
   - Shows success message
   - Clears form fields
   - Auto-hides success after 5 seconds
   - Logs response to console

---

## Error Handling

### Frontend Errors:

- **No token:** "You are not logged in. Please login again." → Redirect to /login
- **No recipient email:** "No valid email addresses found. Please check contact email fields."
- **401/403 response:** "Your session has expired. Please login again." → Redirect to /login
- **Network errors:** Displays error message from response

### Backend Errors:

- **401 Unauthorized:** Missing token
- **403 Forbidden:** Invalid/expired token
- **400 Bad Request:** Missing fields or invalid email format
- **500 Internal Server Error:** SMTP/sending failures

### SMTP Errors:

- Connection refused: SMTP server unreachable
- Authentication failed: Invalid credentials
- Recipient rejected: Invalid recipient email

---

## Database Models

**No database storage for sent emails** - Emails are sent directly via SMTP without persistence.

**Contacts are fetched from:**

- Endpoint: `GET /api/contacts?limit=20`
- Model: `backend/src/models/Contact.js`
- Fields used: `id`, `first_name`, `last_name`, `email`

---

## Security Features

1. **Authentication Required:** All email endpoints require valid JWT token
2. **Tenant Isolation:** `ensureTenancy` ensures users only access their organization's data
3. **Email Validation:** Regex validation prevents invalid email addresses
4. **Token Expiration:** Tokens expire (default 15m), requiring re-authentication
5. **CORS Protection:** Only configured frontend origins can access API
6. **Rate Limiting:** API rate limiter prevents abuse

---

## Configuration Setup

### Gmail Setup (Recommended):

1. Enable 2-Factor Authentication on Google account
2. Generate App Password:

   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" app and your device
   - Copy 16-character password

3. Update `backend/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=your-email@gmail.com
   ```

### Other Providers:

**Outlook/Hotmail:**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com
```

**Custom SMTP:**
Update host, port, and credentials according to provider documentation.

---

## Testing

### Test Email Functionality:

1. **Login** to the CRM application
2. **Navigate** to "Compose Email" in sidebar
3. **Select recipient type:**
   - "All Customers" - sends to all contacts with valid emails
   - "Individual Customer" - sends to selected contact
4. **Fill in subject and message**
5. **Click "Send Email"**
6. **Check browser console** for logs:
   - Token status
   - Recipient email(s)
   - Request/response details
7. **Check backend logs** for SMTP activity
8. **Check recipient inbox** for received email

### Common Issues:

**403 Forbidden Error:**

- Token expired → Login again
- Token invalid → Clear localStorage and login

**No email sent:**

- Check SMTP credentials in `.env`
- Verify SMTP connection in backend logs
- Check spam folder in recipient inbox

**Contacts not loading:**

- Check authentication
- Verify database has contacts with email fields
- Check browser network tab for API errors

---

## File Structure Summary

```
CRM/
├── frontend/src/
│   ├── pages/
│   │   └── ComposeEmail.jsx          # Email compose UI
│   ├── services/
│   │   ├── api.js                    # Axios instance with auth
│   │   └── index.js                  # Service exports
│   └── store/
│       └── authStore.js              # Authentication state
│
└── backend/src/
    ├── config/
    │   └── email.config.js           # Nodemailer transporter
    ├── controllers/
    │   └── email.controller.js       # Email sending logic
    ├── middlewares/
    │   ├── auth.middleware.js        # JWT verification
    │   └── tenancy.middleware.js     # Multi-tenant isolation
    ├── routes/
    │   ├── email.routes.js           # Email endpoints
    │   └── index.js                  # Route mounting
    └── utils/
        ├── emailService.js           # Email service functions
        ├── jwt.js                    # JWT utilities
        └── logger.js                 # Logging utilities
```

---

## API Reference

### POST /api/email/send

**Authentication:** Required (Bearer token)

**Request:**

```http
POST /api/email/send HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "to": "recipient@example.com",
  "subject": "Hello World",
  "message": "This is a test email."
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<20231208123456.12345@gmail.com>",
    "accepted": ["recipient@example.com"]
  }
}
```

**Response (Error - 400):**

```json
{
  "success": false,
  "message": "Invalid email address: invalid-email"
}
```

**Response (Error - 403):**

```json
{
  "error": "Invalid or expired token"
}
```

**Response (Error - 500):**

```json
{
  "success": false,
  "message": "Failed to send email",
  "error": "Connection timeout"
}
```

---

## Logging

**Frontend Console Logs:**

- `Contacts data:` - Fetched contacts array
- `=== Form Submission Started ===` - Form submit initiated
- `Token:` - Authentication token status
- `Sending email to:` - Recipient email address(es)
- `Response:` - API response data
- `Email send error:` - Error details

**Backend Logs:**

- `SMTP server is ready to send emails` - Connection verified
- `Email sent to {email}: {messageId}` - Email sent successfully
- `Send email error:` - Email sending failure

---

## Dependencies

**Frontend:**

- `axios` - HTTP client
- `@tanstack/react-query` - Data fetching and caching
- `zustand` - State management

**Backend:**

- `nodemailer` - Email sending library
- `express` - Web framework
- `jsonwebtoken` - JWT authentication
- `winston` - Logging

---

## Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=crm_db
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email (REQUIRED FOR EMAIL FUNCTIONALITY)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Maintenance

### Monitoring:

- Check backend logs for email sending errors
- Monitor SMTP connection status on startup
- Track failed email attempts in application logs

### Updates:

- Keep Nodemailer updated for security patches
- Rotate SMTP credentials periodically
- Review and update email templates as needed

### Troubleshooting:

1. Check SMTP credentials are correct
2. Verify firewall allows outbound connections on SMTP port
3. Check email provider's sending limits
4. Review backend logs for detailed error messages
5. Test SMTP connection using verification on startup

---

## Future Enhancements

Potential improvements to consider:

1. **Email Templates:** Pre-defined HTML templates for professional emails
2. **Attachments:** Support for file attachments
3. **Email Queue:** Background job queue for bulk emails
4. **Email History:** Database storage of sent emails
5. **Email Tracking:** Track opens and clicks
6. **Rich Text Editor:** WYSIWYG editor for HTML emails
7. **Email Scheduling:** Schedule emails for future delivery
8. **CC/BCC Support:** Add back carbon copy functionality
9. **Email Analytics:** Track delivery rates and bounces
10. **Multiple SMTP Accounts:** Support different sender addresses

---

**Last Updated:** December 8, 2025
**Version:** 1.0.0
