const express = require('express');
const router = express.Router();

const note = require('./noteController');
router.get('/note/definition/:word', note.definitionWord);

module.exports = router;