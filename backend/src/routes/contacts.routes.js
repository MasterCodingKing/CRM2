const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contacts.controller');

router.get('/', contactsController.getContacts);
router.get('/:id', contactsController.getContact);
router.post('/', contactsController.createContact);
router.put('/:id', contactsController.updateContact);
router.delete('/:id', contactsController.deleteContact);

module.exports = router;
