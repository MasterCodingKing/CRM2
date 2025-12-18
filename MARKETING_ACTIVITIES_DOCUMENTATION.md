# Marketing & Activities Enhancement Documentation

## Overview

This document covers the new Social Media Marketing module and the enhanced Activities module with calendar functionality, both designed following HubSpot CRM patterns.

---

## 1. SOCIAL MEDIA MARKETING MODULE

### Features

#### 1.1 Social Media Account Management

Connect and manage multiple social media platforms:

- Facebook
- Twitter (X)
- Instagram
- LinkedIn
- YouTube

**Process:**

1. Click "Connect Account" button
2. Select platform from dropdown
3. Enter access token (from platform's developer portal)
4. Optionally provide Page/Account ID
5. Click "Connect Account"

**Account Card Display:**

- Platform icon with brand color
- Account name/Page ID
- Connection status indicator
- Posts count
- Followers count
- Disconnect option

#### 1.2 Post Creation & Publishing

**Create Post:**

1. Click "Create Post" button
2. Select target platforms (multiple allowed)
3. Write post content
4. Add media URL (optional): Images or videos
5. Choose to post immediately or schedule

**Post Features:**

- Multi-platform posting
- Media attachments (images/videos)
- Scheduled posting for future dates
- Real-time or scheduled publishing

**Post Display:**

- Platform icon and name
- Posted date
- Content with media preview
- Engagement metrics:
  - Views count
  - Likes count
  - Comments count
  - Shares count
- Link to view on platform
- View comments option

#### 1.3 Comment Management

**View Comments:**

1. Click "View Comments" on any post with comments
2. See all comments from the platform
3. Author information displayed
4. Reply to comments directly from CRM

**Reply to Comments:**

1. Open comments modal
2. Type reply message
3. Click reply
4. Response posted to platform

#### 1.4 Analytics Dashboard

**Metrics Tracked:**

- Total Reach: Total views across all platforms
- Total Engagement: Likes + Comments + Shares
- New Followers: Follower growth
- Posts Published: Total posts this month

**Analytics View:**

- Beautiful gradient cards
- Percentage change indicators
- 30-day period default
- Exportable data (future)

#### 1.5 Scheduled Posts Management

**Features:**

- View all scheduled posts
- Edit scheduled time
- Cancel scheduled posts
- Platform-specific scheduling

**Scheduled Post Display:**

- Countdown timer
- Platform indicator
- Content preview
- Scheduled date/time
- Quick edit/cancel options

### Backend API Endpoints

```
GET    /api/social-media/accounts                 - Get all connected accounts
POST   /api/social-media/accounts/connect         - Connect new account
DELETE /api/social-media/accounts/:id             - Disconnect account

GET    /api/social-media/posts                    - Get all posts
POST   /api/social-media/posts                    - Create and publish post
POST   /api/social-media/posts/schedule           - Schedule post for later

GET    /api/social-media/posts/:id/comments       - Get post comments
POST   /api/social-media/comments/:id/reply       - Reply to comment

GET    /api/social-media/analytics                - Get analytics data
```

### Database Schema

**social_media_accounts:**

- Platform, credentials, tokens
- Follower/post counts
- Active status, sync timestamps

**social_media_posts:**

- Content, media URLs
- Platform, external IDs
- Engagement metrics
- Scheduled/published dates
- Status tracking

**social_media_comments:**

- Post linkage
- Author information
- Reply threading
- Engagement metrics

### Integration Notes

**Current Implementation:**

- Mock data for development
- Prepared for API integration
- Token-based authentication ready

**Production Integration:**
Need to integrate with:

- Facebook Graph API
- Twitter API v2
- Instagram Graph API
- LinkedIn API
- YouTube Data API

Each platform requires:

- Developer app registration
- OAuth 2.0 flow
- API credentials
- Webhook setup for comments

---

## 2. ACTIVITIES MODULE WITH CALENDAR

### Enhanced Features

#### 2.1 View Modes

**List View:**

- Traditional list of all activities
- Filterable by type and status
- Expandable details
- Quick actions

**Calendar View:**

- Monthly calendar grid
- Visual activity indicators
- Color-coded by type
- Click to create/view

**Toggle Between Views:**

- Button group in header
- Preserves filters
- Smooth transitions

#### 2.2 Calendar Functionality

**Calendar Features:**

- Month navigation (Prev/Next/Today)
- Week/Day view options (coming soon)
- Today highlighting
- Day click to create activity
- Activity click to edit

**Activity Display on Calendar:**

- Up to 3 activities shown per day
- Color-coded by type:
  - Task: Blue
  - Meeting: Purple
  - Call: Green
  - Email: Orange
  - Demo: Pink
  - Proposal: Indigo
  - Support Ticket: Red
  - Note: Gray
- "+X more" for additional activities
- Hover tooltips

#### 2.3 Creating Activities from Calendar

**Quick Create:**

1. Click on any date in calendar
2. Modal opens with date pre-filled
3. Select activity type
4. Fill required fields
5. Save

**Pre-filled Data:**

- Scheduled date from clicked day
- Due date same as scheduled
- Default time can be adjusted

#### 2.4 Activity Types Supported

**Task:**

- Priority levels
- Due dates
- Checklists
- Recurring patterns
- Progress tracking

**Meeting:**

- Virtual/In-person/Phone
- Meeting links (Zoom, Teams, etc.)
- Attendee management
- Agenda notes
- Reminders

**Call:**

- Phone number
- Call duration
- Call outcome
- Notes

**Email:**

- Recipient email
- Follow-up tracking

**Demo:**

- Products showcased
- Demo date/time
- Attendees

**Proposal:**

- Proposal value
- Due date
- Status tracking

**Support Ticket:**

- Severity levels
- Category
- SLA tracking
- Escalation workflow

**Note:**

- General notes
- Contact linking

#### 2.5 Calendar Integration Logic

**Date Matching:**

- Uses `scheduled_at` primarily
- Falls back to `due_date`
- Falls back to `created_at`
- Handles null dates gracefully

**Month View Grid:**

- 7-column grid (Sun-Sat)
- Shows 35-42 days
- Includes previous/next month days
- Grayed out non-current month

**Activity Grouping:**

- Groups by date (YYYY-MM-DD)
- Sorted chronologically
- Cached for performance

**Click Handlers:**

- Date click: Create new activity
- Activity click: Edit activity
- Stop propagation for nested clicks

### UI/UX Highlights

**List View:**

- Expandable cards
- Inline editing
- Progress bars for tasks
- Status badges
- Quick actions (Call, Join, Escalate)

**Calendar View:**

- Clean grid design
- Responsive sizing
- Touch-friendly
- Keyboard navigation (future)

**Stats Cards:**

- Real-time counts
- Completion rates
- Overdue warnings
- SLA breach alerts

**Filters:**

- Type tabs (All, Task, Meeting, etc.)
- Status dropdown (All, Pending, Completed, Overdue)
- Combines with view mode

### Backend Enhancements

**Activities Controller:**
Already supports:

- Advanced filtering
- Date range queries
- Type filtering
- Status filtering
- Search functionality
- Assigned user filtering

**Stats Endpoint:**

- Task completion rates
- Overdue counts
- Today's meetings/calls
- Open ticket counts
- SLA breach tracking

### Best Practices

**Creating Activities:**

1. Always assign to user
2. Link to contact when possible
3. Set proper dates
4. Use checklists for complex tasks
5. Set reminders for meetings

**Calendar Usage:**

1. Use for visual planning
2. Drag-and-drop (future enhancement)
3. Weekly review in calendar view
4. Monthly planning sessions

**Integration with Other Modules:**

- Link activities to contacts
- Link activities to deals
- Email integration
- Call logging

### Future Enhancements

#### Calendar:

1. Week view with hourly timeline
2. Day view with schedule blocks
3. Drag-and-drop rescheduling
4. Recurring activity visualization
5. Multi-user calendar overlay
6. Calendar sync (Google, Outlook)
7. Time zone support
8. Availability checking

#### Social Media:

1. Post performance analytics
2. Best time to post suggestions
3. Hashtag analytics
4. Competitor monitoring
5. Sentiment analysis
6. Automated responses
7. Content calendar
8. Team collaboration on posts
9. Approval workflows
10. Media library

### Migration & Setup

**Run Database Migration:**

```bash
# From backend directory
psql -U your_user -d crm_db -f migrations/002_create_social_media_tables.sql
```

**Verify Tables Created:**

- social_media_accounts
- social_media_posts
- social_media_comments

**Configure Social Media APIs:**

1. Create developer apps on each platform
2. Get API credentials
3. Update `.env` with tokens (future)
4. Implement OAuth flows (future)

### Testing Checklist

**Social Media:**

- [ ] Connect Facebook account
- [ ] Connect Twitter account
- [ ] Connect Instagram account
- [ ] Connect LinkedIn account
- [ ] Create post to single platform
- [ ] Create post to multiple platforms
- [ ] Schedule post for future
- [ ] View scheduled posts
- [ ] View post analytics
- [ ] View post comments
- [ ] Reply to comment
- [ ] Disconnect account

**Activities Calendar:**

- [ ] Toggle to calendar view
- [ ] Navigate months (prev/next/today)
- [ ] Click date to create activity
- [ ] Create task from calendar
- [ ] Create meeting from calendar
- [ ] View activity on calendar
- [ ] Click activity to edit
- [ ] Multiple activities on same day
- [ ] Overdue activities on calendar
- [ ] Filter by type in calendar view
- [ ] Filter by status in calendar view

### Troubleshooting

**Social Media Not Loading:**

- Check backend server running
- Verify database migration ran
- Check browser console for errors
- Verify routes registered

**Calendar Not Showing Activities:**

- Ensure activities have dates
- Check date format (ISO 8601)
- Verify date parsing in Calendar component
- Check activities query returns data

**Can't Create from Calendar:**

- Verify date click handler
- Check modal opening
- Ensure form data sets correctly
- Verify mutation runs

### Performance Considerations

**Social Media:**

- Cache API responses
- Paginate posts list
- Lazy load images
- Debounce search

**Calendar:**

- Memoize date calculations
- Cache activity grouping
- Lazy load month data
- Virtual scrolling for large datasets

### Security Notes

**Social Media:**

- Store tokens encrypted
- Use environment variables
- Implement token refresh
- Rate limit API calls
- Validate webhook signatures

**Activities:**

- Enforce organization scoping
- Validate user permissions
- Sanitize user input
- Secure date parsing

---

## Quick Start Guide

### Social Media Marketing

1. **Setup:**

   - Run migration: `002_create_social_media_tables.sql`
   - Navigate to Marketing page
   - Click "Connect Account"

2. **First Post:**

   - Connect at least one account
   - Click "Create Post"
   - Select platforms
   - Write content
   - Click "Post Now"

3. **Monitor Engagement:**
   - Switch to Analytics tab
   - View metrics
   - Check comments on posts
   - Reply to engage audience

### Activities Calendar

1. **View Calendar:**

   - Navigate to Activities page
   - Click "Calendar" view toggle
   - See month view with activities

2. **Create Activity:**

   - Click on desired date
   - Select activity type
   - Fill details
   - Save

3. **Manage Activities:**
   - Click activity to edit
   - Use filters to focus
   - Toggle between list and calendar
   - Complete tasks from list view

---

## Support & Resources

**Documentation:**

- HubSpot CRM patterns
- date-fns library docs
- React Query docs

**APIs to Integrate:**

- Facebook: developers.facebook.com
- Twitter: developer.twitter.com
- Instagram: developers.facebook.com/products/instagram
- LinkedIn: docs.microsoft.com/linkedin
- YouTube: developers.google.com/youtube

**Component Libraries Used:**

- Lucide React (icons)
- date-fns (date manipulation)
- React Query (data fetching)
- Tailwind CSS (styling)
