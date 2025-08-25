// 📁 Fichier : /back/middleware/uploadMiddleware.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class UploadMiddleware {
  constructor() {
    this.initializeStorage();
    this.initializeMulter();
  }

  /**
   * Initialise la configuration de stockage
   * Définit où et comment les fichiers sont stockés temporairement
   */
  initializeStorage() {
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        
        // Créer le dossier uploads s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
          console.log(`📁 Dossier uploads créé: ${uploadDir}`);
        }
        
        cb(null, uploadDir);
      },
      
      filename: (req, file, cb) => {
        // Générer un nom unique pour éviter les conflits
        const uniqueSuffix = `${uuidv4()}-${Date.now()}`;
        const fileExtension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExtension)
          .replace(/[^a-zA-Z0-9]/g, '_'); // Nettoyer le nom
        
        const uniqueName = `${baseName}-${uniqueSuffix}${fileExtension}`;
        cb(null, uniqueName);
      }
    });
  }

  /**
   * Initialise la configuration Multer
   * Configure les limites et les filtres de fichiers
   */
  initializeMulter() {
    this.upload = multer({
      storage: this.storage,
      
      // Limite de taille des fichiers
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 5, // Maximum 5 fichiers simultanés
        fieldSize: 1 * 1024 * 1024, // 1MB pour les champs de formulaire
        fieldNameSize: 100 // Taille max du nom des champs
      },
      
      // Filtrage des types de fichiers
      fileFilter: this.fileFilter.bind(this)
    });
  }

  /**
   * Filtre les types de fichiers acceptés
   * Sécurise l'upload en vérifiant l'extension et le type MIME
   */
  fileFilter(req, file, cb) {
    try {
      console.log(`📄 Vérification du fichier: ${file.originalname}`);
      
      // Types MIME acceptés
      const allowedMimeTypes = [
        'application/pdf',
        'text/plain',
        'text/txt'
      ];
      
      // Extensions acceptées
      const allowedExtensions = ['.pdf', '.txt'];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      
      // Vérification de l'extension
      if (!allowedExtensions.includes(fileExtension)) {
        const error = new Error(`Extension non supportée: ${fileExtension}. Extensions acceptées: ${allowedExtensions.join(', ')}`);
        error.code = 'INVALID_FILE_TYPE';
        return cb(error);
      }
      
      // Vérification du type MIME
      if (!allowedMimeTypes.includes(file.mimetype)) {
        const error = new Error(`Type MIME non supporté: ${file.mimetype}. Types acceptés: ${allowedMimeTypes.join(', ')}`);
        error.code = 'INVALID_MIME_TYPE';
        return cb(error);
      }
      
      // Vérification de la taille du nom de fichier
      if (file.originalname.length > 255) {
        const error = new Error('Le nom du fichier est trop long (max 255 caractères)');
        error.code = 'FILENAME_TOO_LONG';
        return cb(error);
      }
      
      // Vérification des caractères dangereux dans le nom
      const dangerousChars = /[<>:"/\\|?*\x00-\x1F]/;
      if (dangerousChars.test(file.originalname)) {
        const error = new Error('Le nom du fichier contient des caractères non autorisés');
        error.code = 'INVALID_FILENAME';
        return cb(error);
      }
      
      console.log(`✅ Fichier accepté: ${file.originalname}`);
      cb(null, true);
      
    } catch (error) {
      console.error('❌ Erreur fileFilter:', error);
      cb(error);
    }
  }

  /**
   * Middleware pour upload d'un seul fichier
   * Utilisé pour l'upload d'un livre à la fois
   */
  single(fieldName = 'file') {
    return (req, res, next) => {
      const uploadSingle = this.upload.single(fieldName);
      
      uploadSingle(req, res, (error) => {
        if (error) {
          return this.handleUploadError(error, req, res, next);
        }
        
        // Validation supplémentaire après upload
        if (req.file) {
          const validationError = this.validateUploadedFile(req.file);
          if (validationError) {
            this.cleanupFile(req.file.path);
            return res.status(400).json({ error: validationError });
          }
        }
        
        next();
      });
    };
  }

  /**
   * Middleware pour upload de plusieurs fichiers
   * Utilisé si on veut permettre l'upload multiple
   */
  multiple(fieldName = 'files', maxCount = 5) {
    return (req, res, next) => {
      const uploadMultiple = this.upload.array(fieldName, maxCount);
      
      uploadMultiple(req, res, (error) => {
        if (error) {
          return this.handleUploadError(error, req, res, next);
        }
        
        // Validation de chaque fichier uploadé
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            const validationError = this.validateUploadedFile(file);
            if (validationError) {
              // Nettoyer tous les fichiers en cas d'erreur
              req.files.forEach(f => this.cleanupFile(f.path));
              return res.status(400).json({ error: validationError });
            }
          }
        }
        
        next();
      });
    };
  }

  /**
   * Gère les erreurs d'upload
   * Convertit les erreurs techniques en messages utilisateur
   */
  handleUploadError(error, req, res, next) {
    console.error('❌ Erreur upload:', error);
    
    // Nettoyer les fichiers en cas d'erreur
    if (req.file) {
      this.cleanupFile(req.file.path);
    }
    if (req.files) {
      req.files.forEach(file => this.cleanupFile(file.path));
    }
    
    let statusCode = 500;
    let message = 'Erreur lors de l\'upload du fichier';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        statusCode = 413;
        message = 'Fichier trop volumineux. Taille maximum: 50MB';
        break;
      case 'LIMIT_FILE_COUNT':
        statusCode = 400;
        message = 'Trop de fichiers. Maximum 5 fichiers simultanés';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        statusCode = 400;
        message = 'Champ de fichier inattendu';
        break;
      case 'INVALID_FILE_TYPE':
      case 'INVALID_MIME_TYPE':
      case 'FILENAME_TOO_LONG':
      case 'INVALID_FILENAME':
        statusCode = 400;
        message = error.message;
        break;
      default:
        message = process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Erreur lors de l\'upload du fichier';
    }
    
    res.status(statusCode).json({ error: message });
  }

  /**
   * Valide un fichier après upload
   * Effectue des vérifications de sécurité supplémentaires
   */
  validateUploadedFile(file) {
    try {
      // Vérifier que le fichier existe
      if (!fs.existsSync(file.path)) {
        return 'Le fichier uploadé est introuvable';
      }
      
      // Vérifier la taille réelle du fichier
      const stats = fs.statSync(file.path);
      if (stats.size === 0) {
        return 'Le fichier est vide';
      }
      
      if (stats.size > 50 * 1024 * 1024) {
        return 'Le fichier dépasse la taille maximum autorisée (50MB)';
      }
      
      // Vérification supplémentaire pour les PDFs
      if (file.mimetype === 'application/pdf') {
        const buffer = fs.readFileSync(file.path, { encoding: null, flag: 'r' });
        const isPdf = buffer.length > 4 && 
                     buffer[0] === 0x25 && 
                     buffer[1] === 0x50 && 
                     buffer[2] === 0x44 && 
                     buffer[3] === 0x46; // %PDF
        
        if (!isPdf) {
          return 'Le fichier ne semble pas être un PDF valide';
        }
      }
      
      // Vérification pour les fichiers texte
      if (file.mimetype === 'text/plain') {
        try {
          const content = fs.readFileSync(file.path, 'utf8');
          if (content.trim().length === 0) {
            return 'Le fichier texte est vide';
          }
        } catch (error) {
          return 'Impossible de lire le contenu du fichier texte';
        }
      }
      
      console.log(`✅ Fichier validé: ${file.originalname}`);
      return null; // Pas d'erreur
      
    } catch (error) {
      console.error('❌ Erreur validation fichier:', error);
      return 'Erreur lors de la validation du fichier';
    }
  }

  /**
   * Nettoie un fichier temporaire
   * Supprime les fichiers en cas d'erreur ou après traitement
   */
  cleanupFile(filePath) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Fichier temporaire supprimé: ${filePath}`);
      }
    } catch (error) {
      console.error('⚠️ Erreur suppression fichier:', error);
    }
  }

  /**
   * Middleware de validation des métadonnées
   * Valide les informations du livre (titre, auteur, etc.)
   */
  validateMetadata() {
    return (req, res, next) => {
      const { title, author, description, category, tags } = req.body;
      const errors = [];
      
      // Validation du titre
      if (title && typeof title !== 'string') {
        errors.push('Le titre doit être une chaîne de caractères');
      }
      if (title && title.length > 200) {
        errors.push('Le titre ne peut pas dépasser 200 caractères');
      }
      
      // Validation de l'auteur
      if (author && typeof author !== 'string') {
        errors.push('L\'auteur doit être une chaîne de caractères');
      }
      if (author && author.length > 100) {
        errors.push('Le nom de l\'auteur ne peut pas dépasser 100 caractères');
      }
      
      // Validation de la description
      if (description && typeof description !== 'string') {
        errors.push('La description doit être une chaîne de caractères');
      }
      if (description && description.length > 1000) {
        errors.push('La description ne peut pas dépasser 1000 caractères');
      }
      
      // Validation de la catégorie
      if (category && typeof category !== 'string') {
        errors.push('La catégorie doit être une chaîne de caractères');
      }
      
      // Validation des tags
      if (tags) {
        if (typeof tags === 'string') {
          // Convertir la chaîne en tableau
          req.body.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (!Array.isArray(tags)) {
          errors.push('Les tags doivent être un tableau ou une chaîne séparée par des virgules');
        }
      }
      
      // Retourner les erreurs s'il y en a
      if (errors.length > 0) {
        return res.status(400).json({ 
          error: 'Erreurs de validation des métadonnées',
          details: errors 
        });
      }
      
      next();
    };
  }

  /**
   * Middleware de limitation du taux d'upload
   * Empêche le spam d'uploads
   */
  rateLimitUpload() {
    const uploadAttempts = new Map();
    const maxUploads = 10; // Max 10 uploads par heure
    const timeWindow = 60 * 60 * 1000; // 1 heure
    
    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      // Nettoyer les anciennes entrées
      for (const [ip, attempts] of uploadAttempts.entries()) {
        const validAttempts = attempts.filter(time => now - time < timeWindow);
        if (validAttempts.length === 0) {
          uploadAttempts.delete(ip);
        } else {
          uploadAttempts.set(ip, validAttempts);
        }
      }
      
      // Vérifier les tentatives actuelles
      const currentAttempts = uploadAttempts.get(clientIP) || [];
      
      if (currentAttempts.length >= maxUploads) {
        return res.status(429).json({
          error: 'Trop de tentatives d\'upload. Veuillez réessayer plus tard.',
          retryAfter: Math.ceil((currentAttempts[0] + timeWindow - now) / 1000)
        });
      }
      
      // Enregistrer cette tentative
      currentAttempts.push(now);
      uploadAttempts.set(clientIP, currentAttempts);
      
      next();
    };
  }

  /**
   * Middleware de nettoyage automatique
   * Supprime les fichiers temporaires anciens
   */
  cleanupOldFiles() {
    return (req, res, next) => {
      // Nettoyer en arrière-plan (non bloquant)
      setImmediate(() => {
        this.performCleanup();
      });
      
      next();
    };
  }

  /**
   * Effectue le nettoyage des fichiers anciens
   */
  performCleanup() {
    try {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) return;
      
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures
      
      const files = fs.readdirSync(uploadDir);
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Nettoyage: ${cleanedCount} fichiers temporaires supprimés`);
      }
    } catch (error) {
      console.error('⚠️ Erreur nettoyage automatique:', error);
    }
  }
}

// Export d'une instance unique (singleton)
module.exports = new UploadMiddleware();