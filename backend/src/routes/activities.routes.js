const express = require('express');
const router = express.Router();
const activitiesController = require('../controllers/activities.controller');

router.get('/', activitiesController.getActivities);
router.get('/:id', activitiesController.getActivity);
router.post('/', activitiesController.createActivity);
router.put('/:id', activitiesController.updateActivity);
router.put('/:id/complete', activitiesController.completeActivity);
router.delete('/:id', activitiesController.deleteActivity);

module.exports = router;
