# CRM System - AI Agent Instructions

## Architecture Overview

This is a **multi-tenant CRM system** built with React/Vite frontend and Node.js/Express/Sequelize backend. Key architectural concepts:

- **Multi-tenancy**: All data scoped by `organization_id` via `tenancy.middleware.js`
- **RBAC System**: 6-tier role hierarchy (super_admin→admin→manager→sales_agent→marketing→user) with granular permissions in `rbac.middleware.js`
- **JWT Authentication**: Access/refresh token pattern with automatic token refresh handling
- **Email Integration**: IMAP receiver for incoming emails with Gmail API for sending

## Critical Development Patterns
 - Follow the logic and structure of hubspot crm

### Backend Route Structure

```javascript
// All authenticated routes follow this pattern:
router.use(authenticateToken);
router.use(ensureTenancy); // Adds req.tenancy.organization_id
router.use(requirePermission("resource.action")); // RBAC check
```

### Database Model Associations

All models inherit organization-level scoping via `Organization.hasMany()` relationships in `src/models/index.js`. **IMPORTANT**: Some Activity model associations are commented out pending migrations - check file comments before uncommenting.

### Frontend State Management

- **Zustand** stores in `src/store/` (authStore, uiStore)
- **React Query** for server state with global error handling in `api.js`
- **Automatic token refresh** via axios interceptors - 401/403 responses trigger logout

## Development Workflow

### Starting the System

Use `START.ps1` - checks dependencies and starts both servers. Backend runs on `:5000`, frontend on `:5173`.

### Database Changes

**Never use Sequelize auto-sync** in production. Use SQL migration files in `backend/migrations/`. The Activities table specifically requires manual migration due to MySQL key limitations.

### Environment Setup

- Backend: Copy `.env.example` → `.env`, set DB credentials and JWT secrets
- Frontend: Defaults work for development, can override via `.env`

## Component Patterns

### Backend Controllers

```javascript
// Standard controller pattern with tenancy
exports.getAll = async (req, res) => {
  const items = await Model.findAll({
    where: { organization_id: req.tenancy.organization_id },
  });
};
```

### Frontend API Services

All API calls go through `services/api.js` with automatic token attachment and error handling. Services in `services/index.js` export domain-specific functions.

### RBAC Integration

Use `requirePermission('resource.action')` middleware. Permission format: `{resource}.{action}[.scope]` where scope can be `own` for user-owned data only.

## Key Integration Points

### Email System

- **Receiving**: `emailReceiver.js` monitors IMAP, creates Email records
- **Sending**: `emailService.js` uses Gmail API with OAuth2
- **Configuration**: `email.config.js` with environment-based settings

### User Management

- Registration creates Organization + first User
- User roles stored as enum in User model
- RBAC permissions defined in `rbac.middleware.js` ROLES object
- User role : 3 user roles user, admin, super admin

### Dashboard Data

Dashboard aggregates cross-module data (contacts, deals, activities) with real-time statistics. Use proper organization scoping in all queries.

## Security Considerations

- All routes require authentication except `/auth/login` and `/auth/register`
- Multi-tenancy enforced at middleware level - never trust client-side organization filtering
- Rate limiting on API routes via `rateLimiter.middleware.js`
- CORS configured for frontend URL only

## Common Debugging Steps

1. **Database sync issues**: Check `backend/migrations/README.md` for manual SQL scripts
2. **Permission errors**: Verify user role and required permissions in `rbac.middleware.js`
3. **API failures**: Check token validity and tenancy context in network tab
4. **Email not working**: Verify Gmail API credentials and IMAP settings in console logs

## File Patterns to Maintain

- Controllers: Export async functions with req/res parameters
- Models: Use Sequelize v6 syntax with proper associations
- Routes: Apply middleware in order: auth → tenancy → RBAC → controller
- Components: Use React hooks, prop destructuring, and error boundaries
- Services: Return promises, handle errors consistently

## Datatable

- Use server-side pagination, sorting, filtering

## Additional Notes

- Always test multi-tenant scenarios with different organizations
- Review security settings before deploying to production
- Keep dependencies updated, especially security-related packages

## UI / UX Guidelines

- Consistent styling using Tailwind CSS
- Responsive design for mobile and desktop
- Accessibility considerations (ARIA roles, keyboard navigation)
- Similar to hubspot crm
