// 📁 Fichier : /back/controllers/uploadController.js

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const pdfService = require('../services/pdfService');
const textService = require('../services/textService');
const aiService = require('../services/aiService');

class UploadController {
  constructor() {
    this.db = getFirestore();
    this.bucket = getStorage().bucket();
  }

  /**
   * Upload et traite un fichier livre
   */
  async uploadBook(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const { title, author, description } = req.body;
      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      console.log(`📚 Début du traitement: ${req.file.originalname}`);

      // Validation du type de fichier
      if (!['.pdf', '.txt'].includes(fileExtension)) {
        this.cleanupFile(filePath);
        return res.status(400).json({ 
          error: 'Type de fichier non supporté. Seuls PDF et TXT sont acceptés.' 
        });
      }

      // Validation de la taille
      if (req.file.size > 50 * 1024 * 1024) { // 50MB
        this.cleanupFile(filePath);
        return res.status(400).json({ 
          error: 'Fichier trop volumineux. Taille maximum: 50MB' 
        });
      }

      // Extraction du texte
      const extractionResult = await this.extractTextFromFile(filePath, fileExtension);
      
      if (!extractionResult.success) {
        this.cleanupFile(filePath);
        return res.status(400).json({ error: extractionResult.error });
      }

      const { text: extractedText, pages: totalPages, metadata } = extractionResult.data;

      // Traitement du texte
      const processedData = await this.processExtractedText(extractedText);

      // Upload vers Firebase Storage
      const uploadResult = await this.uploadToFirebaseStorage(req.file);
      
      if (!uploadResult.success) {
        this.cleanupFile(filePath);
        return res.status(500).json({ error: uploadResult.error });
      }

      // Préparation des données du livre
      const bookData = this.prepareBookData({
        title: title || this.extractTitleFromFilename(req.file.originalname),
        author: author || metadata.author || 'Auteur inconnu',
        description: description || '',
        originalFileName: req.file.originalname,
        fileType: fileExtension,
        fileUrl: uploadResult.url,
        fileSize: req.file.size,
        extractedText: extractedText,
        totalPages: totalPages,
        metadata: metadata,
        ...processedData
      });

      // Sauvegarde dans Firestore
      const docRef = await this.db.collection('books').add(bookData);
      
      // Nettoyage du fichier temporaire
      this.cleanupFile(filePath);

      console.log(`✅ Livre traité avec succès - ID: ${docRef.id}`);

      // Réponse sans le texte complet pour économiser la bande passante
      const response = {
        message: 'Livre traité et sauvegardé avec succès',
        bookId: docRef.id,
        title: bookData.title,
        author: bookData.author,
        summary: bookData.summary,
        totalPages: totalPages,
        wordCount: bookData.wordCount,
        chaptersCount: bookData.chapters?.length || 0,
        uploadDate: bookData.uploadDate
      };

      res.status(201).json(response);

    } catch (error) {
      console.error('❌ Erreur uploadBook:', error);
      
      // Nettoyage en cas d'erreur
      if (req.file) {
        this.cleanupFile(req.file.path);
      }
      
      res.status(500).json({ 
        error: 'Erreur lors du traitement du fichier',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Extrait le texte d'un fichier selon son type
   */
  async extractTextFromFile(filePath, fileExtension) {
    try {
      let result = {};

      if (fileExtension === '.pdf') {
        const pdfResult = await pdfService.extractTextFromPDF(filePath);
        result = {
          text: pdfResult.text,
          pages: pdfResult.numPages,
          metadata: pdfResult.info || {}
        };
      } else if (fileExtension === '.txt') {
        const text = await textService.extractTextFromTXT(filePath);
        const stats = textService.getTextStats(text);
        result = {
          text: text,
          pages: Math.ceil(stats.wordCount / 250), // Estimation: 250 mots/page
          metadata: {
            wordCount: stats.wordCount,
            characterCount: stats.characterCount,
            readingTimeMinutes: stats.readingTimeMinutes
          }
        };
      }

      // Validation du contenu extrait
      if (!result.text || result.text.trim().length < 100) {
        throw new Error('Le fichier semble vide ou contient trop peu de texte lisible');
      }

      return { success: true, data: result };

    } catch (error) {
      console.error('❌ Erreur extraction texte:', error);
      return { 
        success: false, 
        error: `Impossible d'extraire le texte: ${error.message}` 
      };
    }
  }

  /**
   * Traite le texte extrait (résumé, chapitres, etc.)
   */
  async processExtractedText(text) {
    try {
      console.log('🔄 Traitement du texte...');

      // Génération du résumé
      const summary = await aiService.generateSummary(text);
      
      // Découpage en chapitres
      const chapters = textService.splitIntoChapters(text);
      
      // Extraction des mots-clés
      const keywords = await aiService.extractKeywords(text);
      
      // Statistiques du texte
      const stats = textService.getTextStats(text);
      
      // Analyse de sentiment
      const sentiment = await aiService.analyzeSentiment(text);

      return {
        summary: summary,
        chapters: chapters,
        keywords: keywords,
        stats: stats,
        sentiment: sentiment,
        wordCount: stats.wordCount,
        characterCount: stats.characterCount,
        readingTimeMinutes: stats.readingTimeMinutes
      };

    } catch (error) {
      console.error('❌ Erreur traitement texte:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        summary: 'Résumé non disponible',
        chapters: textService.splitBySize(text),
        keywords: [],
        stats: textService.getTextStats(text),
        sentiment: { sentiment: 'neutral', confidence: 0.5 },
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
        readingTimeMinutes: Math.ceil(text.split(/\s+/).length / 200)
      };
    }
  }

  /**
   * Upload le fichier vers Firebase Storage
   */
  async uploadToFirebaseStorage(file) {
    try {
      console.log('☁️ Upload vers Firebase Storage...');
      
      const fileName = `books/${uuidv4()}-${file.originalname}`;
      const fileUpload = this.bucket.file(fileName);
      
      // Upload du fichier
      await this.bucket.upload(file.path, {
        destination: fileName,
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadDate: new Date().toISOString()
          }
        }
      });

      // Rendre le fichier public pour pouvoir y accéder
      await fileUpload.makePublic();
      
      // Générer l'URL publique
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
      
      console.log(`✅ Fichier uploadé: ${publicUrl}`);
      
      return { 
        success: true, 
        url: publicUrl, 
        filename: fileName 
      };

    } catch (error) {
      console.error('❌ Erreur upload Firebase:', error);
      return { 
        success: false, 
        error: `Erreur upload vers le cloud: ${error.message}` 
      };
    }
  }

  /**
   * Prépare les données du livre pour la base de données
   */
  prepareBookData(data) {
    return {
      // Informations de base
      title: data.title,
      author: data.author,
      description: data.description,
      
      // Informations fichier
      originalFileName: data.originalFileName,
      fileType: data.fileType,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      
      // Contenu
      extractedText: data.extractedText,
      summary: data.summary,
      chapters: data.chapters || [],
      keywords: data.keywords || [],
      
      // Statistiques
      totalPages: data.totalPages,
      wordCount: data.wordCount,
      characterCount: data.characterCount,
      readingTimeMinutes: data.readingTimeMinutes,
      
      // Métadonnées
      metadata: data.metadata || {},
      sentiment: data.sentiment || { sentiment: 'neutral', confidence: 0.5 },
      
      // Dates
      uploadDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Progression de lecture
      readingProgress: {
        currentPage: 1,
        currentChapter: 0,
        currentPosition: 0,
        currentCharacterIndex: 0,
        lastReadDate: null,
        isCompleted: false,
        completionPercentage: 0,
        readingTime: 0, // en minutes
        bookmarks: [],
        notes: []
      },
      
      // Statut
      status: 'active',
      isPublic: false,
      tags: data.keywords?.slice(0, 5) || []
    };
  }

  /**
   * Extrait un titre à partir du nom de fichier
   */
  extractTitleFromFilename(filename) {
    return path.basename(filename, path.extname(filename))
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Nettoie un fichier temporaire
   */
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Fichier temporaire supprimé: ${filePath}`);
      }
    } catch (error) {
      console.error('⚠️ Erreur suppression fichier temporaire:', error);
    }
  }

  /**
   * Valide les données d'entrée
   */
  validateInput(req) {
    const errors = [];

    if (!req.file) {
      errors.push('Aucun fichier fourni');
    }

    if (req.body.title && req.body.title.length > 200) {
      errors.push('Le titre ne peut pas dépasser 200 caractères');
    }

    if (req.body.author && req.body.author.length > 100) {
      errors.push('Le nom de l\'auteur ne peut pas dépasser 100 caractères');
    }

    if (req.body.description && req.body.description.length > 1000) {
      errors.push('La description ne peut pas dépasser 1000 caractères');
    }

    return errors;
  }

  /**
   * Upload multiple de fichiers
   */
  async uploadMultipleBooks(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const results = [];
      const errors = [];

      for (const file of req.files) {
        try {
          // Simuler req.file pour chaque fichier
          const mockReq = { 
            file: file, 
            body: req.body 
          };
          
          const mockRes = {
            status: () => mockRes,
            json: (data) => data
          };

          const result = await this.uploadBook(mockReq, mockRes);
          results.push(result);
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      res.json({
        message: 'Traitement des fichiers terminé',
        successful: results.length,
        errors: errors.length,
        results: results,
        errors: errors
      });

    } catch (error) {
      console.error('❌ Erreur upload multiple:', error);
      res.status(500).json({ 
        error: 'Erreur lors du traitement des fichiers',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new UploadController();