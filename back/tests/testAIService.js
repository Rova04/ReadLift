// 📁 Fichier : /back/tests/testAIService.js

require('dotenv').config(); // Charger les variables d'environnement
const aiService = require('../services/aiService');

// Textes d'exemple pour les tests
const sampleTexts = {
  short: "L'intelligence artificielle est une technologie révolutionnaire. Elle transforme notre façon de travailler et de vivre. Les applications sont nombreuses dans tous les secteurs.",
  
  medium: `L'intelligence artificielle (IA) désigne l'ensemble des théories et des techniques mises en œuvre en vue de réaliser des machines capables de simuler l'intelligence humaine. Elle est devenue l'une des technologies les plus importantes du 21e siècle. 

L'IA se divise en plusieurs branches : l'apprentissage automatique (machine learning), le traitement du langage naturel, la vision par ordinateur, et la robotique. Chaque domaine a ses propres applications et défis.

Les entreprises investissent massivement dans cette technologie pour automatiser leurs processus, améliorer leur efficacité et créer de nouveaux services. Cependant, l'IA soulève aussi des questions éthiques importantes concernant l'emploi, la vie privée et la prise de décision automatisée.

L'avenir de l'IA promet des avancées spectaculaires, mais nécessite une réflexion approfondie sur son impact sociétal.`,

  long: `L'intelligence artificielle (IA) représente l'un des domaines technologiques les plus fascinants et les plus prometteurs de notre époque. Définie comme la capacité des machines à imiter l'intelligence humaine, l'IA englobe un vaste ensemble de techniques et d'approches qui visent à créer des systèmes capables de raisonner, d'apprendre et de prendre des décisions de manière autonome.

Les origines de l'intelligence artificielle remontent aux années 1940-1950, avec les travaux pionniers d'Alan Turing, qui a proposé le célèbre "test de Turing" pour évaluer la capacité d'une machine à exhiber un comportement intelligent équivalent à celui d'un être humain. Depuis lors, le domaine a connu plusieurs périodes d'enthousiasme et de désillusion, appelées "hivers de l'IA".

Aujourd'hui, grâce aux avancées en informatique, à l'augmentation de la puissance de calcul et à la disponibilité de grandes quantités de données, l'IA connaît un renouveau spectaculaire. Les algorithmes d'apprentissage automatique, et en particulier l'apprentissage profond (deep learning), ont révolutionné notre capacité à résoudre des problèmes complexes dans de nombreux domaines.

Les applications de l'IA sont désormais omniprésentes : reconnaissance vocale et faciale, traduction automatique, véhicules autonomes, diagnostic médical assisté, recommandations personnalisées, jeux vidéo, finance algorithmique, et bien d'autres. Chaque secteur d'activité trouve des moyens d'exploiter cette technologie pour améliorer ses performances et créer de la valeur.

Cependant, le développement rapide de l'IA soulève également des défis importants. Les questions d'éthique, de transparence des algorithmes, de protection de la vie privée, d'impact sur l'emploi et de gouvernance technologique sont au cœur des débats contemporains. Il est crucial de développer une IA responsable qui bénéficie à l'ensemble de la société tout en minimisant les risques potentiels.`
};

/**
 * Fonction utilitaire pour afficher les résultats de test
 */
function displayTestResult(testName, result, startTime) {
  const duration = Date.now() - startTime;
  console.log('\n' + '='.repeat(60));
  console.log(`🧪 TEST: ${testName}`);
  console.log(`⏱️  Durée: ${duration}ms`);
  console.log('📄 Résultat:');
  console.log(result);
  console.log('='.repeat(60));
}

/**
 * Test 1: Vérification de l'état de l'API
 */
async function testAPIHealth() {
  console.log('🔍 Test de l\'état de l\'API Hugging Face...');
  const startTime = Date.now();
  
  try {
    const isHealthy = await aiService.checkAPIHealth();
    displayTestResult('API Health Check', 
      isHealthy ? '✅ API fonctionnelle' : '❌ API non disponible', 
      startTime
    );
    return isHealthy;
  } catch (error) {
    displayTestResult('API Health Check', `❌ Erreur: ${error.message}`, startTime);
    return false;
  }
}

/**
 * Test 2: Résumé avec texte court
 */
async function testShortSummary() {
  console.log('📝 Test résumé texte court...');
  const startTime = Date.now();
  
  try {
    const summary = await aiService.generateSummary(sampleTexts.short, 50);
    displayTestResult('Résumé Texte Court', summary, startTime);
  } catch (error) {
    displayTestResult('Résumé Texte Court', `❌ Erreur: ${error.message}`, startTime);
  }
}

/**
 * Test 3: Résumé avec texte moyen
 */
async function testMediumSummary() {
  console.log('📝 Test résumé texte moyen...');
  const startTime = Date.now();
  
  try {
    const summary = await aiService.generateSummary(sampleTexts.medium, 100);
    displayTestResult('Résumé Texte Moyen', summary, startTime);
  } catch (error) {
    displayTestResult('Résumé Texte Moyen', `❌ Erreur: ${error.message}`, startTime);
  }
}

/**
 * Test 4: Résumé avec texte long
 */
async function testLongSummary() {
  console.log('📝 Test résumé texte long...');
  const startTime = Date.now();
  
  try {
    const summary = await aiService.generateSummary(sampleTexts.long, 150);
    displayTestResult('Résumé Texte Long', summary, startTime);
  } catch (error) {
    displayTestResult('Résumé Texte Long', `❌ Erreur: ${error.message}`, startTime);
  }
}

/**
 * Test 5: Extraction de mots-clés
 */
async function testKeywordExtraction() {
  console.log('🔑 Test extraction mots-clés...');
  const startTime = Date.now();
  
  try {
    const keywords = aiService.extractKeywords(sampleTexts.medium, 8);
    displayTestResult('Extraction Mots-clés', 
      `Mots-clés trouvés: ${keywords.join(', ')}`, 
      startTime
    );
  } catch (error) {
    displayTestResult('Extraction Mots-clés', `❌ Erreur: ${error.message}`, startTime);
  }
}

/**
 * Test 6: Test de fallback (résumé simple)
 */
async function testFallbackSummary() {
  console.log('🔄 Test fallback résumé simple...');
  const startTime = Date.now();
  
  try {
    const summary = aiService.generateSimpleSummary(sampleTexts.medium, 3);
    displayTestResult('Fallback Résumé Simple', summary, startTime);
  } catch (error) {
    displayTestResult('Fallback Résumé Simple', `❌ Erreur: ${error.message}`, startTime);
  }
}

/**
 * Test 7: Gestion d'erreurs (texte vide)
 */
async function testErrorHandling() {
  console.log('⚠️  Test gestion d\'erreurs...');
  const startTime = Date.now();
  
  try {
    const summary = await aiService.generateSummary('', 100);
    displayTestResult('Gestion Erreurs (texte vide)', summary, startTime);
  } catch (error) {
    displayTestResult('Gestion Erreurs (texte vide)', `❌ Erreur: ${error.message}`, startTime);
  }
}

/**
 * Test 8: Performance avec différentes tailles
 */
async function testPerformance() {
  console.log('⚡ Test performance...');
  
  const tests = [
    { name: 'Court (200 chars)', text: sampleTexts.short },
    { name: 'Moyen (800 chars)', text: sampleTexts.medium },
    { name: 'Long (2000+ chars)', text: sampleTexts.long }
  ];
  
  for (const test of tests) {
    const startTime = Date.now();
    try {
      await aiService.generateSummary(test.text, 100);
      const duration = Date.now() - startTime;
      console.log(`📊 ${test.name}: ${duration}ms`);
    } catch (error) {
      console.log(`📊 ${test.name}: ❌ ${error.message}`);
    }
  }
}

/**
 * Suite de tests complète
 */
async function runAllTests() {
  console.log('🚀 DÉBUT DES TESTS AISERVICE');
  console.log('🕐 ' + new Date().toLocaleString());
  
  // Vérifier les variables d'environnement
  console.log('\n📋 Configuration:');
  console.log(`HUGGINGFACE_API_KEY: ${process.env.HUGGINGFACE_API_KEY ? '✅ Définie' : '❌ Manquante'}`);
  
  const startTime = Date.now();
  
  // Exécuter tous les tests
  await testAPIHealth();
  await testShortSummary();
  await testMediumSummary();
  await testLongSummary();
  await testKeywordExtraction();
  await testFallbackSummary();
  await testErrorHandling();
  await testPerformance();
  
  const totalDuration = Date.now() - startTime;
  console.log('\n🏁 TESTS TERMINÉS');
  console.log(`⏱️  Durée totale: ${totalDuration}ms`);
  console.log('🕐 ' + new Date().toLocaleString());
}

/**
 * Test interactif simple
 */
async function testInteractive() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('💬 Mode test interactif - Entrez votre texte:');
  
  rl.question('Texte à résumer: ', async (text) => {
    if (text.trim()) {
      console.log('\n🤖 Génération du résumé...');
      try {
        const summary = await aiService.generateSummary(text, 100);
        console.log('\n📄 Résumé:');
        console.log(summary);
        
        const keywords = aiService.extractKeywords(text, 5);
        console.log('\n🔑 Mots-clés:', keywords.join(', '));
      } catch (error) {
        console.error('❌ Erreur:', error.message);
      }
    }
    rl.close();
  });
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes('--interactive')) {
  testInteractive();
} else if (args.includes('--health')) {
  testAPIHealth();
} else if (args.includes('--performance')) {
  testPerformance();
} else {
  runAllTests();
}

// Export pour utilisation dans d'autres tests
module.exports = {
  testAPIHealth,
  testShortSummary,
  testMediumSummary,
  testLongSummary,
  testKeywordExtraction,
  testFallbackSummary,
  testErrorHandling,
  testPerformance,
  runAllTests,
  sampleTexts
};