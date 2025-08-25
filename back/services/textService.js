// 📁 Fichier : /back/services/textService.js

const fs = require('fs');

class TextService {
  
  /**
   * Extrait le texte d'un fichier TXT en préservant le formatage original
   * @param {string} filePath - Chemin vers le fichier TXT
   * @returns {Promise<string>}
   */
  async extractTextFromTXT(filePath) {
    try {
      console.log(`📄 Lecture du fichier TXT: ${filePath}`);
      
      const text = fs.readFileSync(filePath, 'utf8');
      
      if (!text || text.trim().length === 0) {
        throw new Error('Le fichier TXT est vide');
      }
      
      // Préservation du formatage original avec nettoyage minimal
      const preservedText = this.preserveOriginalFormatting(text);
      console.log(`✅ Texte lu: ${preservedText.length} caractères`);
      
      return preservedText;
      
    } catch (error) {
      console.error('❌ Erreur lecture TXT:', error);
      throw new Error(`Erreur lors de la lecture du fichier TXT: ${error.message}`);
    }
  }
  
  /**
   * Préserve le formatage original du texte (nouvelle méthode)
   * @param {string} text - Texte brut
   * @returns {string} - Texte avec formatage préservé
   */
  preserveOriginalFormatting(text) {
    return text
      // Normaliser seulement les retours à la ligne Windows/Mac
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Supprimer uniquement les caractères de contrôle vraiment problématiques
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Préserver les espaces multiples intentionnels (indentation, formatage)
      // Supprimer seulement les espaces en fin de ligne
      .replace(/[ \t]+$/gm, '')
      // Limiter les lignes vides excessives (plus de 3) mais en garder la structure
      .replace(/\n{4,}/g, '\n\n\n')
      // Trim seulement les espaces en début/fin de document
      .trim();
  }
  
  /**
   * Version alternative de nettoyage (pour compatibilité)
   * @param {string} text - Texte brut
   * @returns {string} - Texte nettoyé
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[ ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  
  /**
   * Découpe le texte en chapitres/sections avec meilleure détection
   * @param {string} text - Texte complet
   * @returns {Array<Object>} - Liste des chapitres
   */
  splitIntoChapters(text) {
    const chapters = [];
    
    // Patterns améliorés pour détecter les chapitres (multilingue)
    const chapterPatterns = [
      // Français
      /^(CHAPITRE|PARTIE|SECTION|LIVRE)\s+(\d+|[IVXLCDM]+)/gmi,
      /^(Ch\.|Chap\.)\s*(\d+)/gmi,
      // Anglais
      /^(CHAPTER|PART|SECTION|BOOK)\s+(\d+|[IVXLCDM]+)/gmi,
      /^(Ch\.|Chap\.)\s*(\d+)/gmi,
      // Espagnol
      /^(CAPÍTULO|PARTE|SECCIÓN|LIBRO)\s+(\d+|[IVXLCDM]+)/gmi,
      // Italien
      /^(CAPITOLO|PARTE|SEZIONE|LIBRO)\s+(\d+|[IVXLCDM]+)/gmi,
      // Numérotation simple
      /^(\d+\.|\d+\s+[-–—]|\d+\s*\-)/gm,
      /^[IVX]+\.\s+/gm,
      // Titres avec astérisques ou autres marqueurs
      /^\*+\s*.+\s*\*+$/gm,
      /^={3,}.*={3,}$/gm,
      /^-{3,}.*-{3,}$/gm
    ];
    
    let chapterMatches = [];
    let usedPattern = null;
    
    // Essayer chaque pattern
    for (const pattern of chapterPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 1) { // Au moins 2 chapitres détectés
        chapterMatches = matches;
        usedPattern = pattern;
        break;
      }
    }
    
    if (chapterMatches.length === 0) {
      // Pas de chapitres détectés, découper intelligemment par taille
      return this.smartSplitBySize(text);
    }
    
    console.log(`📚 ${chapterMatches.length} chapitres détectés avec le pattern: ${usedPattern}`);
    
    // Découper selon les chapitres détectés
    for (let i = 0; i < chapterMatches.length; i++) {
      const match = chapterMatches[i];
      const startIndex = match.index;
      const endIndex = i < chapterMatches.length - 1 
        ? chapterMatches[i + 1].index 
        : text.length;
      
      const chapterText = text.substring(startIndex, endIndex).trim();
      const title = match[0].trim();
      
      chapters.push({
        id: i + 1,
        title: title,
        content: chapterText,
        startIndex: startIndex,
        endIndex: endIndex,
        wordCount: this.countWords(chapterText),
        characterCount: chapterText.length
      });
    }
    
    return chapters;
  }
  
  /**
   * Découpe intelligente par taille avec respect des paragraphes
   * @param {string} text - Texte complet
   * @param {number} targetChunkSize - Taille cible par chunk
   * @returns {Array<Object>}
   */
  smartSplitBySize(text, targetChunkSize = 2500) {
    const chunks = [];
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    let chunkIndex = 1;
    let currentStartIndex = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (!paragraph) continue;
      
      const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;
      
      if (testChunk.length > targetChunkSize && currentChunk.length > 0) {
        // Sauvegarder le chunk actuel
        chunks.push({
          id: chunkIndex,
          title: `Section ${chunkIndex}`,
          content: currentChunk.trim(),
          startIndex: currentStartIndex,
          endIndex: currentStartIndex + currentChunk.length,
          wordCount: this.countWords(currentChunk),
          characterCount: currentChunk.length
        });
        
        currentStartIndex += currentChunk.length + 2; // +2 pour \n\n
        currentChunk = paragraph;
        chunkIndex++;
      } else {
        currentChunk = testChunk;
      }
    }
    
    // Ajouter le dernier chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: chunkIndex,
        title: `Section ${chunkIndex}`,
        content: currentChunk.trim(),
        startIndex: currentStartIndex,
        endIndex: currentStartIndex + currentChunk.length,
        wordCount: this.countWords(currentChunk),
        characterCount: currentChunk.length
      });
    }
    
    console.log(`📝 Texte divisé en ${chunks.length} sections intelligentes`);
    return chunks;
  }
  
  /**
   * Compte les mots avec support multilingue et accents
   * @param {string} text - Texte à analyser
   * @returns {number}
   */
  countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // Support des caractères accentués et des langues latines
    const words = text
      .trim()
      .split(/[\s\n\r\t]+/)
      .filter(word => {
        // Supprimer les mots vides et les caractères de ponctuation isolés
        return word.length > 0 && 
               /[a-zA-ZàâäéèêëïîôöùûüÿçñáíóúýñÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇÑÁÍÓÚÝ]/.test(word);
      });
    
    return words.length;
  }
  
  /**
   * Compte les statistiques du texte avec support multilingue
   * @param {string} text - Texte à analyser
   * @returns {Object}
   */
  getTextStats(text) {
    const words = this.countWords(text);
    
    // Détecter les phrases avec support multilingue
    const sentences = text
      .split(/[.!?。！？]+/)
      .filter(s => s.trim().length > 5 && /[a-zA-ZàâäéèêëïîôöùûüÿçñáíóúýñÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇÑÁÍÓÚÝ]/.test(s));
    
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 10);
    
    // Détecter la langue pour adapter la vitesse de lecture
    const detectedLang = this.detectLanguage(text);
    const readingSpeed = this.getReadingSpeedByLanguage(detectedLang);
    
    return {
      characterCount: text.length,
      wordCount: words,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: sentences.length > 0 ? Math.round(words / sentences.length) : 0,
      readingTimeMinutes: Math.ceil(words / readingSpeed),
      detectedLanguage: detectedLang,
      averageWordsPerParagraph: paragraphs.length > 0 ? Math.round(words / paragraphs.length) : 0
    };
  }
  
  /**
   * Détection de langue basique (compatible avec aiService)
   * @param {string} text - Texte à analyser
   * @returns {string} - Code de langue
   */
  detectLanguage(text) {
    const sample = text.substring(0, 1000).toLowerCase();
    
    const languageMarkers = {
      fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'avoir', 'que', 'pour', 'dans', 'ce', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'sur'],
      en: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this'],
      es: ['el', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una'],
      it: ['il', 'di', 'che', 'e', 'la', 'per', 'una', 'in', 'con', 'non', 'da', 'su', 'del', 'al', 'lo', 'si', 'ma', 'come', 'anche', 'me']
    };

    let maxScore = 0;
    let detectedLang = 'fr'; // défaut français

    for (const [lang, markers] of Object.entries(languageMarkers)) {
      const score = markers.reduce((acc, marker) => {
        const regex = new RegExp(`\\b${marker}\\b`, 'gi');
        return acc + (sample.match(regex) || []).length;
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }
  
  /**
   * Vitesse de lecture par langue (mots par minute)
   * @param {string} language - Code de langue
   * @returns {number} - Vitesse en mots/minute
   */
  getReadingSpeedByLanguage(language) {
    const speeds = {
      'fr': 200,  // Français
      'en': 220,  // Anglais
      'es': 190,  // Espagnol
      'it': 185,  // Italien
      'de': 180   // Allemand
    };
    
    return speeds[language] || 200;
  }
  
  /**
   * Extrait un résumé simple basé sur les meilleures phrases (amélioré)
   * @param {string} text - Texte complet
   * @param {number} maxSentences - Nombre max de phrases
   * @returns {string}
   */
  extractSimpleSummary(text, maxSentences = null) {
    try {
      // Utiliser la logique de l'aiService pour déterminer le nombre de phrases
      const textLength = text.length;
      let targetSentences = maxSentences;
      
      if (!targetSentences) {
        if (textLength < 5000) targetSentences = 2;
        else if (textLength < 20000) targetSentences = 4;
        else if (textLength < 50000) targetSentences = 6;
        else targetSentences = 8;
      }
      
      // Découper en phrases avec support multilingue
      const sentences = text
        .split(/[.!?。！？]+/)
        .map(s => s.trim())
        .filter(s => {
          return s.length > 15 && 
                 s.split(/\s+/).length > 4 && 
                 /[a-zA-ZàâäéèêëïîôöùûüÿçñáíóúýñÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇÑÁÍÓÚÝ]/.test(s);
        });

      if (sentences.length === 0) {
        return `Document de ${Math.ceil(textLength / 1000)}k caractères. Contenu disponible pour lecture complète.`;
      }

      const selectedSentences = [];

      if (sentences.length >= targetSentences) {
        // Première phrase (introduction)
        selectedSentences.push(sentences[0]);

        // Répartir les autres phrases de manière intelligente
        if (targetSentences > 1) {
          const step = Math.max(1, Math.floor((sentences.length - 1) / (targetSentences - 1)));
          
          for (let i = 1; i < targetSentences; i++) {
            const index = Math.min(i * step, sentences.length - 1);
            const candidate = sentences[index];
            
            // Éviter les doublons et les phrases trop similaires
            if (!selectedSentences.some(existing => 
                this.calculateSimilarity(existing, candidate) > 0.7)) {
              selectedSentences.push(candidate);
            }
          }
        }
      } else {
        selectedSentences.push(...sentences.slice(0, targetSentences));
      }

      const summary = selectedSentences
        .join('. ')
        .replace(/\.\s*\./g, '.')
        .replace(/\s+/g, ' ')
        .trim() + '.';

      if (summary.length < 50) {
        return `Document de ${Math.ceil(textLength / 1000)}k caractères contenant du contenu textuel structuré. Lecture complète recommandée pour plus de détails.`;
      }

      return summary;

    } catch (error) {
      console.error('❌ Erreur résumé simple:', error);
      return 'Résumé indisponible. Document prêt pour la lecture.';
    }
  }
  
  /**
   * Calcule la similarité entre deux phrases (pour éviter les doublons)
   * @param {string} sentence1 
   * @param {string} sentence2 
   * @returns {number} - Score de similarité (0-1)
   */
  calculateSimilarity(sentence1, sentence2) {
    const words1 = sentence1.toLowerCase().split(/\s+/);
    const words2 = sentence2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }
  
  /**
   * Intégration avec aiService pour résumé intelligent
   * @param {string} text - Texte à résumer
   * @param {Object} aiService - Instance du service IA
   * @returns {Promise<string>}
   */
  async generateIntelligentSummary(text, aiService) {
    try {
      // Utiliser d'abord l'IA si disponible
      const aiSummary = await aiService.generateSummary(text);
      
      if (aiSummary && aiSummary.length > 50 && !aiSummary.includes('Résumé indisponible')) {
        return aiSummary;
      }
      
      // Fallback vers le résumé simple amélioré
      return this.extractSimpleSummary(text);
      
    } catch (error) {
      console.error('❌ Erreur résumé intelligent:', error);
      return this.extractSimpleSummary(text);
    }
  }
  
  /**
   * Valide que le texte contient bien le contenu original
   * @param {string} originalText - Texte original
   * @param {string} processedText - Texte traité
   * @returns {Object} - Rapport de validation
   */
  validateTextIntegrity(originalText, processedText) {
    const originalStats = this.getTextStats(originalText);
    const processedStats = this.getTextStats(processedText);
    
    const charLossPercentage = ((originalStats.characterCount - processedStats.characterCount) / originalStats.characterCount) * 100;
    const wordLossPercentage = ((originalStats.wordCount - processedStats.wordCount) / originalStats.wordCount) * 100;
    
    return {
      isValid: charLossPercentage < 5 && wordLossPercentage < 5, // Moins de 5% de perte acceptable
      originalStats,
      processedStats,
      charLossPercentage: Math.round(charLossPercentage * 100) / 100,
      wordLossPercentage: Math.round(wordLossPercentage * 100) / 100,
      recommendations: charLossPercentage > 5 ? 
        ['Utiliser preserveOriginalFormatting() au lieu de cleanText()'] : 
        ['Intégrité du texte préservée']
    };
  }
}

module.exports = new TextService();