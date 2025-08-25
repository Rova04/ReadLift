const express = require('express');
const router = express.Router();
const summarizeController = require('../controllers/summarizeController');

router.use((req, res, next) => {
  console.log(`🔗 Route AI: ${req.method} ${req.originalUrl}`);
  next();
});

router.get('/test-routes', (req, res) => {
  res.json({ message: '✅ Routes IA OK' });
});

router.get('/ai-status', summarizeController.checkAIHealth);
router.post('/summarize', summarizeController.summarizeText);
router.post('/summarize-from-book/:bookId', summarizeController.summarizeFromBook);
router.post('/keywords', summarizeController.extractKeywords);

module.exports = router;
