// 📁 Fichier : /back/services/pdfService.js

const fs = require('fs');
const pdfParse = require('pdf-parse');

class PDFService {
  
  /**
   * Extrait le texte d'un fichier PDF en préservant la structure
   * @param {string} filePath - Chemin vers le fichier PDF
   * @returns {Promise<{text: string, numPages: number, info: Object}>}
   */
  async extractTextFromPDF(filePath) {
    try {
      console.log(`🔍 Extraction du texte PDF: ${filePath}`);
      
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer, {
        // Options pour préserver la structure
        normalizeWhitespace: false,
        disableCombineTextItems: false
      });
      
      const extractedText = pdfData.text;
      const numPages = pdfData.numpages;
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Le PDF semble être vide ou contenir uniquement des images');
      }
      
      console.log(`✅ Texte extrait: ${extractedText.length} caractères, ${numPages} pages`);
      
      return {
        text: this.intelligentCleanText(extractedText),
        numPages: numPages,
        info: pdfData.info || {},
        rawText: extractedText // Garder le texte brut pour référence
      };
      
    } catch (error) {
      console.error('❌ Erreur extraction PDF:', error);
      throw new Error(`Erreur lors de l'extraction du PDF: ${error.message}`);
    }
  }
  
  /**
   * Nettoyage intelligent qui préserve la structure du document
   * @param {string} text - Texte brut
   * @returns {string} - Texte nettoyé mais structuré
   */
  intelligentCleanText(text) {
    // Étape 1: Supprimer uniquement les caractères de contrôle dangereux
    let cleaned = text
      // Garder les caractères importants : \n, \t, espaces, accents
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Préserver les caractères Unicode (accents, symboles)
      .replace(/\uFEFF/g, '') // BOM uniquement
      .replace(/\u00A0/g, ' '); // Espace insécable -> espace normal
    
    // Étape 2: Normaliser les retours à la ligne sans les supprimer
    cleaned = cleaned
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Réduire les espaces multiples sur une même ligne SANS toucher aux \n
      .replace(/[ \t]+/g, ' ')
      // Réduire les lignes vides excessives (plus de 3) à 2 maximum
      .replace(/\n{4,}/g, '\n\n\n');
    
    // Étape 3: Nettoyer les artéfacts PDF courants
    cleaned = cleaned
      // Supprimer les numéros de page isolés (ligne contenant uniquement un numéro)
      .replace(/^\s*\d+\s*$/gm, '')
      // Supprimer les headers/footers répétitifs courts
      .replace(/^(.{1,30})\n(?=.*^\1$)/gm, '')
      // Rejoindre les mots coupés en fin de ligne (trait d'union)
      .replace(/([a-zàâäéèêëïîôöùûüÿç])-\s*\n\s*([a-zàâäéèêëïîôöùûüÿç])/gi, '$1$2\n')
      // Rejoindre les lignes coupées au milieu d'une phrase
      .replace(/([a-zàâäéèêëïîôöùûüÿç,])\s*\n\s*([a-zàâäéèêëïîôöùûüÿç])/g, '$1 $2');
    
    // Étape 4: Préserver la structure des paragraphes
    const lines = cleaned.split('\n');
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Garder les lignes vides pour la structure
      if (line === '') {
        processedLines.push('');
        continue;
      }
      
      // Garder les titres/headers (lignes courtes, souvent en majuscules)
      if (line.length < 60 && (line.match(/[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/g)?.length || 0) > line.length * 0.3) {
        processedLines.push(line);
        continue;
      }
      
      // Traitement normal des lignes de contenu
      processedLines.push(line);
    }
    
    return processedLines.join('\n').trim();
  }
  
  /**
   * Détecte la langue du document PDF
   * @param {string} text - Texte extrait
   * @returns {string} - Code langue (fr, en, es, it, de)
   */
  detectDocumentLanguage(text) {
    const sample = text.substring(0, 2000).toLowerCase();
    
    const languageMarkers = {
      fr: {
        words: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout'],
        chars: ['à', 'é', 'è', 'ê', 'ë', 'ç', 'ù', 'û', 'ü', 'ô', 'ö', 'î', 'ï', 'â', 'ä', 'ÿ'],
        patterns: [/\b(les?|des?|du|aux?|ces?|cette|son|sa|ses)\b/g]
      },
      en: {
        words: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'],
        chars: [],
        patterns: [/\b(the|and|that|with|have|this|will|your|from|they)\b/g]
      },
      es: {
        words: ['el', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una'],
        chars: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'],
        patterns: [/\b(que|con|por|para|esta|este|son|las|los)\b/g]
      },
      it: {
        words: ['il', 'di', 'che', 'e', 'la', 'per', 'una', 'in', 'con', 'non', 'da', 'su', 'un', 'le', 'si', 'ma', 'come', 'del', 'della'],
        chars: ['à', 'è', 'é', 'ì', 'í', 'ò', 'ó', 'ù', 'ú'],
        patterns: [/\b(che|con|per|della|degli|sono|dalla|nella)\b/g]
      },
      de: {
        words: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine'],
        chars: ['ä', 'ö', 'ü', 'ß'],
        patterns: [/\b(der|die|und|den|von|das|mit|für|ist|ein|eine)\b/g]
      }
    };

    let maxScore = 0;
    let detectedLang = 'fr'; // défaut français

    for (const [lang, markers] of Object.entries(languageMarkers)) {
      let score = 0;
      
      // Score basé sur les mots courants
      markers.words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = sample.match(regex);
        if (matches) score += matches.length * 2;
      });
      
      // Score basé sur les caractères spéciaux
      markers.chars.forEach(char => {
        const count = (sample.match(new RegExp(char, 'g')) || []).length;
        score += count;
      });
      
      // Score basé sur les patterns
      markers.patterns.forEach(pattern => {
        const matches = sample.match(pattern);
        if (matches) score += matches.length * 3;
      });

      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }
  
  /**
   * Extrait les métadonnées enrichies du PDF
   * @param {string} filePath - Chemin vers le fichier PDF
   * @returns {Promise<Object>}
   */
  async extractMetadata(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      const stats = fs.statSync(filePath);
      
      return {
        // Métadonnées PDF standard
        title: pdfData.info?.Title || null,
        author: pdfData.info?.Author || null,
        subject: pdfData.info?.Subject || null,
        creator: pdfData.info?.Creator || null,
        producer: pdfData.info?.Producer || null,
        creationDate: pdfData.info?.CreationDate || null,
        modificationDate: pdfData.info?.ModDate || null,
        
        // Informations de structure
        pages: pdfData.numpages,
        version: pdfData.version || null,
        
        // Statistiques de fichier
        fileSize: stats.size,
        fileSizeHuman: this.formatFileSize(stats.size),
        
        // Statistiques de contenu
        textLength: pdfData.text?.length || 0,
        estimatedWords: pdfData.text ? pdfData.text.split(/\s+/).length : 0,
        estimatedReadingTime: pdfData.text ? Math.ceil(pdfData.text.split(/\s+/).length / 200) : 0,
        
        // Langue détectée
        detectedLanguage: pdfData.text ? this.detectDocumentLanguage(pdfData.text) : null
      };
    } catch (error) {
      console.error('❌ Erreur extraction métadonnées PDF:', error);
      return {};
    }
  }
  
  /**
   * Formate la taille de fichier de manière lisible
   * @param {number} bytes 
   * @returns {string}
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Analyse la structure du document (chapitres, sections)
   * @param {string} text - Texte extrait
   * @returns {Array<Object>}
   */
  analyzeDocumentStructure(text) {
    const sections = [];
    const lines = text.split('\n');
    
    // Patterns pour détecter les titres/sections
    const titlePatterns = [
      /^(CHAPITRE|CHAPTER|PARTE|KAPITEL|CAPITOLO)\s+(\d+|[IVXLCDM]+)/i,
      /^(\d+\.?\s+[-–—]?\s*[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ])/,
      /^([IVXLCDM]+\.?\s+[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ])/,
      /^([A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ\s]{5,50})$/
    ];
    
    let currentSection = null;
    let sectionId = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      // Vérifier si c'est un titre
      let isTitle = false;
      for (const pattern of titlePatterns) {
        if (pattern.test(line)) {
          isTitle = true;
          break;
        }
      }
      
      // Vérifier les caractéristiques d'un titre
      if (!isTitle && line.length < 80 && line.length > 5) {
        const upperCaseRatio = (line.match(/[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/g) || []).length / line.length;
        if (upperCaseRatio > 0.5) {
          isTitle = true;
        }
      }
      
      if (isTitle) {
        // Sauvegarder la section précédente
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Créer une nouvelle section
        currentSection = {
          id: sectionId++,
          title: line,
          startLine: i,
          content: line + '\n'
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      } else {
        // Contenu avant le premier titre
        if (sections.length === 0) {
          sections.push({
            id: sectionId++,
            title: 'Introduction',
            startLine: 0,
            content: line + '\n'
          });
          currentSection = sections[0];
        }
      }
    }
    
    // Ajouter la dernière section
    if (currentSection && !sections.includes(currentSection)) {
      sections.push(currentSection);
    }
    
    // Calculer les statistiques pour chaque section
    return sections.map(section => ({
      ...section,
      wordCount: section.content.split(/\s+/).filter(w => w.length > 0).length,
      characterCount: section.content.length,
      estimatedReadingTime: Math.ceil(section.content.split(/\s+/).length / 200)
    }));
  }
}

module.exports = new PDFService();