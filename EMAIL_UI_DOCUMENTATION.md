# Email System - HubSpot-Style UI Documentation

## Overview

The email system now features a modern, HubSpot-style interface with a split-panel layout that groups emails by contact and displays threaded conversations.

## UI Features

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ Header (Compose Button, Stats)                 │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│  Contacts    │   Email Thread View             │
│  List        │                                  │
│  (Left Panel)│   (Right Panel)                 │
│              │                                  │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

### Left Panel - Contacts/Conversations

**Features:**

- **Search Bar**: Search conversations by contact name or email
- **Filter Tabs**:
  - All: Show all conversations
  - Unread: Show only conversations with unread emails
  - Sent: Show only sent emails
- **Contact Cards**: Each card displays:
  - Avatar with initials
  - Contact name
  - Email address
  - Last email subject (preview)
  - Timestamp (relative: "2h ago", "Yesterday", "Dec 17")
  - Unread count badge
  - Total email count

**Visual Indicators:**

- Bold text for unread messages
- Blue badge for unread count
- Purple icon for bulk emails
- Active selection with blue left border

### Right Panel - Email Thread View

**When No Thread Selected:**

- Empty state with mail icon
- "Select a conversation" message
- Quick compose button

**When Thread Selected:**

1. **Thread Header**:

   - Contact avatar (large)
   - Contact name and email
   - Message count
   - Company name (if available)
   - Delete and more options buttons

2. **Email Messages**:

   - Each email shows:
     - Sender avatar (You or Contact)
     - Sender name
     - Email direction (From/To)
     - Full timestamp
     - Status badges (Reply, Bulk, Sent)
     - Subject (for first email only)
     - Message body
     - Send status indicator

3. **Reply Box**:
   - Expandable reply area
   - Contact email confirmation
   - Text area for message
   - Send/Cancel buttons
   - Loading state during send

## Functions & Processes

### 1. Email Grouping by Contact

**Process:**

```javascript
// Frontend groups emails by contact email address
const emailsByContact = {};
emails.forEach((email) => {
  const contactEmail =
    email.type === "received" ? email.from_email : email.to_email;

  // Group by lowercase email for consistency
  const emailKey = contactEmail.toLowerCase().trim();

  if (!emailsByContact[emailKey]) {
    emailsByContact[emailKey] = [];
  }
  emailsByContact[emailKey].push(email);
});
```

**Purpose:**

- Groups all emails with the same contact
- Creates unified conversation view
- Maintains chronological order within groups

### 2. Email Threading

**Process:**

```javascript
// Backend loads parent emails with replies
const { rows: emails, count } = await Email.findAndCountAll({
  where: {
    parent_id: null, // Only top-level emails
  },
  include: [
    {
      model: Email,
      as: "replies",
      separate: true,
      order: [["created_at", "ASC"]],
    },
  ],
});
```

**Purpose:**

- Links replies to original emails
- Displays conversation history
- Maintains email context

### 3. Sending Emails

**Compose Modal Flow:**

```
1. User clicks "Compose" button
2. Modal opens with form:
   - Send To: All Customers / Individual Customer
   - Customer: Dropdown (if individual selected)
   - Subject: Text input
   - Message: Textarea
3. User fills form and clicks "Send"
4. Frontend validates required fields
5. API call to POST /api/email/send
6. Backend sends via Gmail API
7. Email saved to database
8. Success notification
9. Email list refreshes
```

**API Endpoint:**

```javascript
POST /api/email/send
Body: {
  to: "email@example.com",  // Can be comma-separated
  subject: "Email subject",
  message: "Email message content"
}
```

### 4. Replying to Emails

**Reply Flow:**

```
1. User selects conversation from left panel
2. Frontend loads full email thread via GET /api/email/:id
3. Thread displays in right panel
4. User clicks "Reply" button
5. Reply box expands with textarea
6. User types message and clicks "Send Reply"
7. API call to POST /api/email/:id/reply
8. Backend:
   - Sends email with proper threading headers
   - Creates reply record linked to parent
   - Saves to database
9. Thread refreshes to show new reply
10. Reply box collapses
```

**API Endpoint:**

```javascript
POST /api/email/:id/reply
Body: {
  message: "Reply message content"
}
```

### 5. Marking Emails as Read

**Process:**

```javascript
// Automatically marks as read when viewing
const getEmailById = async (req, res) => {
  const email = await Email.findOne({ where: { id } });

  // Mark as read
  if (!email.read_at) {
    await email.update({
      read_at: new Date(),
      status: "read",
    });
  }

  return email;
};
```

**Trigger:**

- When user clicks on conversation
- When email thread is loaded in right panel

### 6. Deleting Email Threads

**Delete Flow:**

```
1. User clicks delete icon in thread header
2. Confirmation dialog appears
3. User confirms deletion
4. API call to DELETE /api/email/:id
5. Backend:
   - Deletes all replies (parent_id = :id)
   - Deletes parent email
6. Frontend:
   - Closes thread view
   - Removes conversation from list
   - Refreshes email data
```

**API Endpoint:**

```javascript
DELETE /api/email/:id
```

### 7. Filtering & Search

**Contact Search:**

```javascript
const filteredContacts = contactList.filter((contact) => {
  const searchLower = contactSearch.toLowerCase();
  const nameMatch = `${contact.first_name} ${contact.last_name}`
    .toLowerCase()
    .includes(searchLower);
  const emailMatch = contact.email?.toLowerCase().includes(searchLower);
  return nameMatch || emailMatch;
});
```

**Filter Tabs:**

```javascript
// All filter
if (filter === "all") return true;

// Unread filter
if (filter === "unread") return contact.unreadCount > 0;

// Sent filter
if (filter === "sent") return contact.emails.some((e) => e.type === "sent");
```

### 8. Real-time Date Formatting

**Relative Timestamps:**

```javascript
const formatDate = (dateString) => {
  const diffInDays = /* calculate difference */;

  if (diffInDays === 0) {
    if (diffInHours === 0) return `${diffInMinutes}m ago`;
    return `${diffInHours}h ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
```

**Full Timestamps:**

- Used in email thread messages
- Format: "Dec 17, 2025 at 3:06 PM"

### 9. Bulk Email Handling

**Special Processing:**

```javascript
// Identify bulk emails
const isBulk = email.to_email?.split(",").length > 1;

// Display bulk indicator
{
  isBulk && (
    <span className="px-2 py-0.5 bg-purple-100 text-purple-700">Bulk</span>
  );
}

// Show recipient count
{
  isBulk ? `${recipientCount} recipients` : email.to_email;
}
```

### 10. Loading States

**Frontend Loading Indicators:**

- Initial page load: Full-page spinner
- Sending reply: Button spinner + disabled state
- Loading thread: Smooth transition
- Empty states: Friendly messages with icons

**Backend Performance:**

- Eager loading of replies
- Indexed queries on organization_id, parent_id
- Pagination support for large datasets

## Data Flow

### Email Object Structure

```javascript
{
  id: 1,
  organization_id: 1,
  user_id: 1,
  to_email: "contact@example.com",
  from_email: null,                    // For received emails
  subject: "Email subject",
  message: "Email body content",
  type: "sent",                        // sent, received, reply
  is_bulk: false,
  parent_id: null,                     // Links to parent email
  message_id: "email-message-id",      // Gmail message ID
  status: "sent",                      // sent, read, failed
  read_at: null,                       // Timestamp when read
  created_at: "2025-12-17T15:06:00Z",
  replies: [                           // Nested replies
    {
      id: 2,
      parent_id: 1,
      message: "Reply content",
      created_at: "2025-12-17T16:30:00Z"
    }
  ]
}
```

### Contact List Item Structure

```javascript
{
  id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  company: "Acme Corp",
  emailCount: 5,                       // Total emails with this contact
  unreadCount: 2,                      // Unread email count
  lastEmail: { /* email object */ },   // Most recent email
  emails: [ /* array of emails */ ],   // All emails sorted by date
}
```

## API Endpoints Reference

### GET /api/email

Get all emails with pagination and filtering.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 100)
- `type`: Filter by type (all, sent, received)
- `contact_email`: Filter by contact email

### GET /api/email/by-contact

Get emails grouped by contact for conversation view.

**Response:**

```json
{
  "success": true,
  "conversations": [
    {
      "contact_email": "contact@example.com",
      "emails": [
        /* email objects */
      ],
      "unread_count": 2,
      "email_count": 5,
      "last_email_date": "2025-12-17T15:06:00Z",
      "last_email": {
        /* email object */
      }
    }
  ],
  "total": 10
}
```

### GET /api/email/:id

Get single email with full thread (all replies).

### POST /api/email/send

Send a new email.

### POST /api/email/:id/reply

Reply to an email (maintains threading).

### POST /api/email/:id/reply-all

Reply to all recipients of an email.

### DELETE /api/email/:id

Delete email and all its replies.

## Styling & UX

### Color Scheme

- **Primary**: Blue (#primary-600)
- **Unread**: Bold text, blue accents
- **Read**: Normal weight, gray text
- **Sent**: Primary blue icon
- **Received**: Green icon
- **Bulk**: Purple icon and badges
- **Success**: Green (CheckCircle)
- **Error**: Red (AlertCircle)

### Animations

- Smooth transitions on selection
- Hover states on all interactive elements
- Loading spinners for async operations
- Fade-in for modal dialogs

### Responsive Design

- Fixed left panel width (24rem/384px)
- Flexible right panel (grows to fill space)
- Scrollable areas for long lists/threads
- Mobile-friendly (can be enhanced further)

## Best Practices

1. **Always Refresh After Actions**:

   ```javascript
   queryClient.invalidateQueries(["emails"]);
   ```

2. **Handle Empty States**:

   - No conversations
   - No thread selected
   - No replies

3. **Provide Feedback**:

   - Loading states
   - Success/error messages
   - Disabled buttons during operations

4. **Maintain Thread Context**:

   - Load full thread when viewing
   - Show conversation history
   - Link replies to parents

5. **Optimize Performance**:
   - Paginate large lists
   - Lazy load thread details
   - Cache contact data

## Testing Checklist

- [ ] Compose and send email to single contact
- [ ] Compose and send bulk email to all contacts
- [ ] View email thread in right panel
- [ ] Reply to an email
- [ ] Reply to bulk email (reply all)
- [ ] Search contacts by name
- [ ] Search contacts by email
- [ ] Filter by "All" tab
- [ ] Filter by "Unread" tab
- [ ] Filter by "Sent" tab
- [ ] Delete email thread
- [ ] Check unread count updates
- [ ] Verify read status changes
- [ ] Test empty states
- [ ] Test with no contacts
- [ ] Test with no emails
- [ ] Verify timestamps display correctly
- [ ] Check bulk email indicators
- [ ] Verify avatar initials
- [ ] Test loading states
- [ ] Check error handling

## Future Enhancements

1. **Attachments**: Add file upload support
2. **Rich Text Editor**: HTML email composition
3. **Email Templates**: Predefined message templates
4. **Draft Saving**: Auto-save drafts
5. **Email Scheduling**: Schedule emails for later
6. **Bulk Actions**: Select multiple conversations
7. **Advanced Search**: Filter by date range, status, etc.
8. **Email Signatures**: Automatic signature insertion
9. **Read Receipts**: Track when emails are opened
10. **Mobile Responsive**: Collapsible panels for mobile
11. **Keyboard Shortcuts**: Quick navigation
12. **Contact Grouping**: Group by company or tag
13. **Email Analytics**: Open rates, response times
14. **Integration**: Connect with other CRM modules
15. **Notifications**: Real-time email notifications

## Troubleshooting

### Emails Not Appearing

- Check backend server is running
- Verify Gmail API credentials
- Check organization_id scoping
- Review browser console for errors

### Thread Not Loading

- Verify email ID is correct
- Check parent_id relationships in database
- Ensure replies are properly linked

### Reply Not Sending

- Verify recipient email is valid
- Check Gmail API quota
- Review backend logs for errors
- Ensure proper authentication

### UI Not Updating

- Check React Query cache invalidation
- Verify mutation callbacks
- Clear browser cache if needed
- Check for console errors
