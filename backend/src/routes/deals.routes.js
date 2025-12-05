const express = require('express');
const router = express.Router();
const dealsController = require('../controllers/deals.controller');

router.get('/', dealsController.getDeals);
router.get('/:id', dealsController.getDeal);
router.post('/', dealsController.createDeal);
router.put('/:id', dealsController.updateDeal);
router.put('/:id/stage', dealsController.updateDealStage);
router.post('/:id/won', dealsController.markDealWon);
router.post('/:id/lost', dealsController.markDealLost);
router.delete('/:id', dealsController.deleteDeal);

module.exports = router;
