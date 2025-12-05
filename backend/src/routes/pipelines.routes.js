const express = require('express');
const router = express.Router();
const pipelinesController = require('../controllers/pipelines.controller');

router.get('/', pipelinesController.getPipelines);
router.get('/:id', pipelinesController.getPipeline);
router.post('/', pipelinesController.createPipeline);
router.put('/:id', pipelinesController.updatePipeline);
router.put('/:id/default', pipelinesController.setDefaultPipeline);
router.delete('/:id', pipelinesController.deletePipeline);

module.exports = router;
