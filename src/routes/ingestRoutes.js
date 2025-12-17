const express = require('express');
const router = express.Router();
const { ingestNews } = require('../controllers/ingestController');

router.post('/', ingestNews);

module.exports = router;
