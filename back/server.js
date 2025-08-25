// 📁 Fichier : /back/server.js
require('dotenv').config();

// 🔐 INITIALISATION FIREBASE EN PREMIER
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-service-account.json');

initializeApp({ credential: cert(serviceAccount) });
console.log('✅ Firebase initialisé avec succès');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const routes = require('./controllers/route');

// Services
const pdfService = require('./services/pdfService');
const textService = require('./services/textService');
const aiService = require('./services/aiService');
const bookController = require('./controllers/bookController');

// Routes
const summarizeRoutes = require('./routes/summarizeRoutes');

const app = express();
const PORT = process.env.PORT || 3001;
const db = getFirestore();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use('/', routes);

// Logger
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body);
  }
  next();
});

// Dossier static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

// 📌 ROUTES IA
app.use('/api', summarizeRoutes);


// 📌 UPLOAD LIVRE
app.post('/upload-book', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });

    const { title, author } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const pathFichier = req.file.path;

    let text = '';
    let totalPages = 0;
    if (ext === '.pdf') {
      const result = await pdfService.extractTextFromPDF(pathFichier);
      text = result.text;
      totalPages = result.numPages;
    } else if (ext === '.txt') {
      text = await textService.extractTextFromTXT(pathFichier);
      totalPages = Math.ceil(text.length / 2000);
    }

    if (!text || text.trim().length === 0) throw new Error("Texte vide");

    const chapters = textService.splitIntoChapters(text);
    const summary = await aiService.generateSummary(text);

    const bookData = {
      title: title || req.file.originalname,
      author: author || 'Auteur inconnu',
      originalFileName: req.file.originalname,
      fileType: ext,
      fileUrl: `/uploads/${path.basename(pathFichier)}`,
      extractedText: text,
      summary,
      chapters,
      totalPages,
      wordCount: text.split(' ').length,
      uploadDate: new Date().toISOString(),
      readingProgress: {
        currentPage: 1,
        currentChapter: 0,
        currentPosition: 0,
        lastReadDate: new Date().toISOString(),
        isCompleted: false,
        bookmarks: []
      }
    };

    const docRef = await db.collection('books').add(bookData);
    res.status(201).json({ message: 'Livre sauvegardé', bookId: docRef.id, ...bookData });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('❌ Upload Error:', error);
    res.status(500).json({ error: 'Erreur lors du traitement', details: error.message });
  }
});

// 📌 Autres routes
app.get('/books', async (req, res) => {
  try {
    const snapshot = await db.collection('books').orderBy('uploadDate', 'desc').get();
    const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(books);
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/books/:id', async (req, res) => {
  try {
    const doc = await db.collection('books').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Livre non trouvé' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/books/:id/progress', async (req, res) => {
  try {
    const updateData = {
      'readingProgress.currentPage': req.body.currentPage || 1,
      'readingProgress.currentChapter': req.body.currentChapter || 0,
      'readingProgress.currentPosition': req.body.currentPosition || 0,
      'readingProgress.lastReadDate': new Date().toISOString()
    };
    if (req.body.bookmarks) updateData['readingProgress.bookmarks'] = req.body.bookmarks;
    await db.collection('books').doc(req.params.id).update(updateData);
    res.json({ message: 'Progression mise à jour' });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/books/:id/complete', async (req, res) => {
  try {
    await db.collection('books').doc(req.params.id).update({
      'readingProgress.isCompleted': true,
      'readingProgress.lastReadDate': new Date().toISOString()
    });
    res.json({ message: 'Livre terminé' });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
app.put('/books/:id', bookController.updateBookMetadata.bind(bookController));

app.delete('/books/:id', async (req, res) => {
  try {
    const doc = await db.collection('books').doc(req.params.id).get();
    if (doc.exists && doc.data().fileUrl) {
      const filePath = path.join(__dirname, doc.data().fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.collection('books').doc(req.params.id).delete();
    res.json({ message: 'Livre supprimé' });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: '📚 API Lecture Augmentée active' });
});

app.all('/*splat', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée', method: req.method, url: req.originalUrl });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur sur http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => console.error('❌ Unhandled Rejection:', err));
process.on('uncaughtException', (err) => console.error('❌ Uncaught Exception:', err));
