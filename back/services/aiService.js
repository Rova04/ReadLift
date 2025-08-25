// 📁 Fichier : /back/services/aiService.js

const { HfInference } = require('@huggingface/inference');

class AIService {
  constructor() {
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.warn('⚠️ HUGGINGFACE_API_KEY non définie - fonctionnalités IA limitées');
    }
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

    this.models = {
      summarization: 'facebook/bart-large-cnn',
      summarizationFallback: 'sshleifer/distilbart-cnn-12-6',
    };

    // Configuration pour résumés adaptatifs selon la longueur
    this.summaryConfig = {
      short: { maxLength: 80, minLength: 30, sentences: 2 },      // < 5000 chars
      medium: { maxLength: 150, minLength: 60, sentences: 4 },    // 5000-20000 chars
      long: { maxLength: 300, minLength: 120, sentences: 6 },     // 20000-50000 chars
      veryLong: { maxLength: 500, minLength: 200, sentences: 8 }  // > 50000 chars
    };
  }

  /**
   * Détermine la configuration de résumé selon la longueur du texte
   */
  getSummaryConfigForLength(textLength) {
    if (textLength < 5000) return this.summaryConfig.short;
    if (textLength < 20000) return this.summaryConfig.medium;
    if (textLength < 50000) return this.summaryConfig.long;
    return this.summaryConfig.veryLong;
  }

  /**
   * Détecte la langue du texte (basique)
   */
  detectLanguage(text) {
    const sample = text.substring(0, 500).toLowerCase();
    
    // Mots courants par langue
    const languageMarkers = {
      fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour'],
      en: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for'],
      es: ['el', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo'],
      it: ['il', 'di', 'che', 'e', 'la', 'per', 'una', 'in', 'con', 'non', 'da', 'su']
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

  async generateSummary(text, customMaxLength = null) {
    try {
      console.log('🤖 Génération du résumé adaptatif avec Hugging Face...');

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Texte invalide pour le résumé');
      }

      // Configuration adaptative selon la longueur
      const config = this.getSummaryConfigForLength(text.length);
      const maxLength = customMaxLength || config.maxLength;
      
      console.log(`📏 Texte: ${text.length} chars - Config: ${JSON.stringify(config)}`);

      if (!process.env.HUGGINGFACE_API_KEY) {
        console.warn('⚠️ Clé API Hugging Face manquante, utilisation du résumé simple');
        return this.generateSimpleSummary(text, config.sentences);
      }

      const processedText = this.preprocessText(text);
      const detectedLang = this.detectLanguage(text);
      
      console.log(`🌍 Langue détectée: ${detectedLang}`);

      try {
        return await this.generateSummaryWithModel(processedText, maxLength, config.minLength, this.models.summarization);
      } catch (primaryError) {
        console.warn('⚠️ Échec modèle principal, tentative avec modèle de secours:', primaryError.message);

        try {
          return await this.generateSummaryWithModel(processedText, maxLength, config.minLength, this.models.summarizationFallback);
        } catch (fallbackError) {
          console.warn('⚠️ Échec modèle de secours, utilisation résumé simple:', fallbackError.message);
          return this.generateSimpleSummary(text, config.sentences);
        }
      }

    } catch (error) {
      console.error('❌ Erreur génération résumé:', error);
      const config = this.getSummaryConfigForLength(text.length);
      return this.generateSimpleSummary(text, config.sentences);
    }
  }

  async generateSummaryWithModel(text, maxLength, minLength, modelName) {
    const response = await this.hf.summarization({
      model: modelName,
      inputs: text,
      parameters: {
        max_length: Math.min(maxLength, 500),
        min_length: Math.max(minLength, 20),
        do_sample: false,
        early_stopping: true,
        length_penalty: 2.0,
        repetition_penalty: 1.2,
        no_repeat_ngram_size: 3
      }
    });

    const summary = response.summary_text || response.generated_text;

    if (!summary || summary.trim().length === 0) {
      throw new Error('Résumé vide généré par le modèle');
    }

    return this.postprocessSummary(summary, text);
  }

  preprocessText(text) {
    // Préserver les accents et caractères spéciaux
    let cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,;:!?()[\]"'\-àâäéèêëïîôöùûüÿçñáíóúýñÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇÑÁÍÓÚÝ]/g, '')
      .trim();

    // Longueur adaptative selon le modèle
    const maxChars = 4000;

    if (cleaned.length <= maxChars) {
      return cleaned;
    }

    const truncated = cleaned.substring(0, maxChars);
    
    // Chercher une coupure naturelle
    const sentenceEnders = ['.', '!', '?', '。', '！', '？']; // Support multilingue
    
    let bestCutPoint = -1;
    for (const ender of sentenceEnders) {
      const lastIndex = truncated.lastIndexOf(ender);
      if (lastIndex > bestCutPoint && lastIndex > maxChars * 0.7) {
        bestCutPoint = lastIndex;
      }
    }

    if (bestCutPoint > 0) {
      return truncated.substring(0, bestCutPoint + 1);
    }

    // Coupure sur un espace
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > maxChars * 0.8 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  postprocessSummary(summary, originalText) {
    let processed = summary
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
      .replace(/\.\s*$/, '.');

    // Validation anti-hallucination basique
    processed = this.validateSummaryContent(processed, originalText);

    return processed;
  }

  /**
   * Validation basique pour éviter les hallucinations
   */
  validateSummaryContent(summary, originalText) {
    const summaryWords = summary.toLowerCase().split(/\s+/);
    const originalWords = new Set(originalText.toLowerCase().split(/\s+/));
    
    // Filtrer les mots qui n'existent pas dans le texte original (sauf mots très courants)
    const commonWords = new Set([
      'le', 'de', 'et', 'à', 'un', 'il', 'être', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'sa', 'ses',
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
      'est', 'sont', 'était', 'sera', 'fait', 'dit', 'peut', 'doit', 'très', 'plus', 'moins',
      'is', 'are', 'was', 'will', 'can', 'could', 'should', 'would', 'has', 'had', 'do', 'does'
    ]);

    const validWords = summaryWords.filter(word => 
      word.length <= 2 || 
      commonWords.has(word) || 
      originalWords.has(word) ||
      originalWords.has(word.replace(/s$/, '')) || // pluriel
      originalWords.has(word + 's') // singulier
    );

    // Si trop de mots invalides, retourner un résumé simple
    if (validWords.length < summaryWords.length * 0.7) {
      console.warn('⚠️ Résumé potentiellement halluciné, utilisation du résumé simple');
      const config = this.getSummaryConfigForLength(originalText.length);
      return this.generateSimpleSummary(originalText, config.sentences);
    }

    return summary;
  }

  generateSimpleSummary(text, sentenceCount = 3) {
    try {
      console.log(`📝 Génération résumé simple (${sentenceCount} phrases)...`);

      if (!text || text.trim().length === 0) {
        return 'Texte vide - impossible de générer un résumé.';
      }

      // Normaliser les terminaisons de phrases pour différentes langues
      const sentences = text
        .split(/[.!?。！？]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.split(' ').length > 4) // Phrases plus substantielles
        .slice(0, Math.min(30, sentenceCount * 6)); // Plus d'options

      if (sentences.length === 0) {
        return `Document de ${Math.ceil(text.length / 1000)}k caractères. Contenu disponible pour lecture complète.`;
      }

      const selectedSentences = [];

      if (sentences.length >= sentenceCount) {
        // Première phrase (introduction)
        selectedSentences.push(sentences[0]);

        // Répartir les autres phrases
        if (sentenceCount > 1) {
          const step = Math.floor(sentences.length / sentenceCount);
          for (let i = 1; i < sentenceCount && i * step < sentences.length; i++) {
            const index = Math.min(i * step, sentences.length - 1);
            if (!selectedSentences.includes(sentences[index])) {
              selectedSentences.push(sentences[index]);
            }
          }
        }
      } else {
        selectedSentences.push(...sentences);
      }

      const summary = selectedSentences.join('. ').replace(/\.\s*\./g, '.') + '.';

      if (summary.length < 50) {
        return `Résumé automatique : Document de ${Math.ceil(text.length / 1000)}k caractères contenant du contenu textuel. Lecture complète recommandée pour plus de détails.`;
      }

      return summary;

    } catch (error) {
      console.error('❌ Erreur résumé simple:', error);
      return 'Résumé indisponible. Document prêt pour la lecture.';
    }
  }

  extractKeywords(text, maxKeywords = 8) {
    try {
      // Mots vides multilingues
      const stopWords = new Set([
        // Français
        'le', 'de', 'un', 'à', 'être', 'et', 'en', 'avoir', 'que', 'pour',
        'dans', 'ce', 'il', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout',
        'plus', 'par', 'grand', 'ou', 'son', 'sa', 'ses', 'du', 'des', 'la',
        'les', 'au', 'aux', 'cette', 'ces', 'cet', 'mon', 'ma', 'mes', 'ton',
        'ta', 'tes', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'qui',
        'quoi', 'dont', 'où', 'quand', 'comme', 'sans', 'sous', 'après',
        'avant', 'pendant', 'depuis', 'jusqu', 'vers', 'chez', 'entre',
        // Anglais
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for',
        'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
        'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would',
        // Espagnol
        'el', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo',
        'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una', 'tiene', 'las'
      ]);

      // Normaliser le texte en préservant les accents
      const words = text
        .toLowerCase()
        .replace(/[^\w\sàâäéèêëïîôöùûüÿçñáíóúýñ]/g, ' ')
        .split(/\s+/)
        .filter(word =>
          word.length > 3 &&
          !stopWords.has(word) &&
          !/^\d+$/.test(word) &&
          word.match(/[a-zA-Zàâäéèêëïîôöùûüÿçñáíóúýñ]/)
        );

      const wordCount = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // Score pondéré par fréquence et longueur
      const weightedWords = Object.entries(wordCount)
        .map(([word, count]) => ({
          word,
          score: count * Math.log(word.length + 1) * (word.length > 5 ? 1.2 : 1)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxKeywords)
        .map(({ word }) => word);

      return weightedWords;

    } catch (error) {
      console.error('❌ Erreur extraction mots-clés:', error);
      return [];
    }
  }

  async analyzeSentiment(text) {
    try {
      // Analyse de sentiment basique (peut être étendue avec une API)
      const positiveWords = ['bon', 'bien', 'excellent', 'magnifique', 'parfait', 'super', 'génial', 'formidable'];
      const negativeWords = ['mauvais', 'mal', 'terrible', 'horrible', 'nul', 'catastrophique', 'affreux'];
      
      const words = text.toLowerCase().split(/\s+/);
      let positiveCount = 0;
      let negativeCount = 0;
      
      words.forEach(word => {
        if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
        if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
      });
      
      const total = positiveCount + negativeCount;
      if (total === 0) return { sentiment: 'neutral', confidence: 0.5 };
      
      const sentiment = positiveCount > negativeCount ? 'positive' : 'negative';
      const confidence = Math.max(positiveCount, negativeCount) / total;
      
      return { sentiment, confidence };
      
    } catch (error) {
      console.error('❌ Erreur analyse sentiment:', error);
      return { sentiment: 'neutral', confidence: 0.5 };
    }
  }

  async checkAPIHealth() {
    try {
      if (!process.env.HUGGINGFACE_API_KEY) {
        return false;
      }

      const testResponse = await this.hf.summarization({
        model: this.models.summarizationFallback,
        inputs: "This is a simple test to check if the API is working properly. The test should return a brief summary.",
        parameters: { max_length: 50, min_length: 10 }
      });

      return !!(testResponse && (testResponse.summary_text || testResponse.generated_text));
    } catch (error) {
      console.error('❌ API Hugging Face non disponible:', error.message);
      return false;
    }
  }
}

module.exports = new AIService();