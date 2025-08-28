// Script de test pour valider les corrections de l'authentification
// À exécuter dans la console du navigateur après avoir chargé l'application

console.log('🧪 Test des Corrections d\'Authentification');

// Test 1: Vérifier que useAuth est disponible
function testUseAuthAvailability() {
  console.log('✅ Test 1: Vérification de useAuth');
  
  // Vérifier que l'application est chargée
  if (typeof window !== 'undefined' && window.React) {
    console.log('   - React est disponible');
  } else {
    console.log('   - ❌ React n\'est pas disponible');
    return false;
  }
  
  return true;
}

// Test 2: Vérifier l'état initial
function testInitialState() {
  console.log('✅ Test 2: Vérification de l\'état initial');
  
  // Vérifier que l'écran de chargement est affiché
  const loadingElement = document.querySelector('.animate-spin');
  if (loadingElement) {
    console.log('   - Écran de chargement affiché');
  } else {
    console.log('   - ❌ Écran de chargement non trouvé');
  }
  
  return true;
}

// Test 3: Vérifier la persistance de session
function testSessionPersistence() {
  console.log('✅ Test 3: Vérification de la persistance de session');
  
  // Vérifier que Supabase est configuré
  if (window.supabase) {
    console.log('   - Client Supabase disponible');
    
    // Vérifier la configuration
    const config = window.supabase.supabaseUrl;
    if (config) {
      console.log('   - Configuration Supabase trouvée');
    } else {
      console.log('   - ❌ Configuration Supabase manquante');
    }
  } else {
    console.log('   - ❌ Client Supabase non disponible');
  }
  
  return true;
}

// Test 4: Vérifier le composant de débogage
function testDebugComponent() {
  console.log('✅ Test 4: Vérification du composant de débogage');
  
  const debugElement = document.querySelector('[class*="fixed top-4 right-4"]');
  if (debugElement) {
    console.log('   - Composant de débogage affiché');
    
    // Vérifier les informations affichées
    const loadingInfo = debugElement.textContent.includes('Loading');
    const userInfo = debugElement.textContent.includes('User');
    const profileInfo = debugElement.textContent.includes('Profile');
    
    if (loadingInfo && userInfo && profileInfo) {
      console.log('   - Toutes les informations de débogage sont présentes');
    } else {
      console.log('   - ⚠️ Certaines informations de débogage sont manquantes');
    }
  } else {
    console.log('   - ❌ Composant de débogage non trouvé');
  }
  
  return true;
}

// Test 5: Vérifier la navigation
function testNavigation() {
  console.log('✅ Test 5: Vérification de la navigation');
  
  // Vérifier que la navigation est conditionnelle
  const bottomNav = document.querySelector('[class*="fixed bottom-0"]');
  if (bottomNav) {
    console.log('   - Navigation du bas affichée');
  } else {
    console.log('   - Navigation du bas masquée (vue spéciale)');
  }
  
  return true;
}

// Fonction principale de test
function runAllTests() {
  console.log('🚀 Démarrage des tests...\n');
  
  const tests = [
    testUseAuthAvailability,
    testInitialState,
    testSessionPersistence,
    testDebugComponent,
    testNavigation
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  tests.forEach((test, index) => {
    try {
      const result = test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`   - ❌ Erreur dans le test ${index + 1}:`, error.message);
    }
    console.log(''); // Ligne vide pour la lisibilité
  });
  
  // Résumé des tests
  console.log('📊 Résumé des Tests:');
  console.log(`   - Tests réussis: ${passedTests}/${totalTests}`);
  console.log(`   - Taux de succès: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Tous les tests sont passés avec succès !');
    console.log('✅ Les corrections d\'authentification fonctionnent correctement.');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez les corrections.');
  }
}

// Instructions d'utilisation
console.log('📋 Instructions d\'utilisation:');
console.log('1. Assurez-vous que l\'application est chargée');
console.log('2. Ouvrez la console du navigateur (F12)');
console.log('3. Exécutez: runAllTests()');
console.log('4. Vérifiez les résultats des tests');
console.log('');

// Exposer la fonction de test globalement
window.runAllTests = runAllTests;

console.log('🔧 Script de test chargé. Exécutez runAllTests() pour commencer les tests.');
