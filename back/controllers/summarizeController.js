const aiService = require('../services/aiService');
const { getFirestore } = require('firebase-admin/firestore');

const getDB = () => getFirestore();

exports.summarizeText = async (req, res) => {
  try {
    const { text, maxLength } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texte invalide' });
    }
    const summary = await aiService.generateSummary(text, maxLength || 150);
    res.status(200).json({ summary });
  } catch (e) {
    res.status(500).json({ error: 'Erreur résumé texte', details: e.message });
  }
};

exports.summarizeFromBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { maxLength } = req.body;
    if (!bookId) return res.status(400).json({ error: 'bookId manquant' });

    const db = getDB();
    const doc = await db.collection('books').doc(bookId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Livre introuvable' });

    const text = doc.data().extractedText;
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Pas de texte à résumer' });

    const summary = await aiService.generateSummary(text, maxLength || 150);
    res.status(200).json({ bookId, title: doc.data().title, summary });
  } catch (e) {
    res.status(500).json({ error: 'Erreur résumé livre', details: e.message });
  }
};

exports.extractKeywords = (req, res) => {
  try {
    const { text, maxKeywords } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texte invalide' });
    }
    const keywords = aiService.extractKeywords(text, maxKeywords || 8);
    res.status(200).json({ keywords });
  } catch (e) {
    res.status(500).json({ error: 'Erreur mots-clés', details: e.message });
  }
};

exports.checkAIHealth = async (req, res) => {
  try {
    const healthy = await aiService.checkAPIHealth();
    res.status(200).json({ healthy });
  } catch (e) {
    res.status(500).json({ healthy: false, error: e.message });
  }
};
