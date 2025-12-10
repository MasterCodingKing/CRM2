const express = require('express');
const router = express.Router();
const activitiesController = require('../controllers/activities.controller');

// Core CRUD routes
router.get('/', activitiesController.getActivities);
router.get('/stats', activitiesController.getActivityStats);
router.get('/overdue', activitiesController.getOverdueActivities);
router.get('/team-members', activitiesController.getTeamMembers);
router.get('/:id', activitiesController.getActivity);
router.post('/', activitiesController.createActivity);
router.put('/:id', activitiesController.updateActivity);
router.delete('/:id', activitiesController.deleteActivity);

// Activity actions
router.put('/:id/complete', activitiesController.completeActivity);
router.post('/:id/send-email', activitiesController.sendActivityEmailNow);

// Checklist management
router.put('/:id/checklist', activitiesController.updateChecklist);

// Call logging
router.post('/log-call', activitiesController.logCall);

// Meeting attendees
router.put('/:id/attendee-status', activitiesController.updateAttendeeStatus);

// Support ticket actions
router.put('/:id/escalate', activitiesController.escalateTicket);
router.put('/:id/rate', activitiesController.rateTicket);

// Reminder actions
router.put('/:id/snooze', activitiesController.snoozeReminder);

module.exports = router;
