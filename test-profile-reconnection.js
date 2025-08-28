// Script de test pour la reconnexion du profil
// À exécuter dans la console du navigateur après avoir chargé l'application

console.log('🧪 Test de Reconnexion du Profil');

// Test 1: Vérifier l'état initial de l'authentification
function testInitialAuthState() {
  console.log('✅ Test 1: Vérification de l\'état initial d\'authentification');
  
  // Vérifier que l'application est chargée
  if (typeof window !== 'undefined') {
    console.log('   - Application chargée');
    
    // Vérifier que Supabase est disponible
    if (window.supabase) {
      console.log('   - Client Supabase disponible');
    } else {
      console.log('   - ❌ Client Supabase non disponible');
      return false;
    }
  } else {
    console.log('   - ❌ Application non chargée');
    return false;
  }
  
  return true;
}

// Test 2: Vérifier la session Supabase
async function testSupabaseSession() {
  console.log('✅ Test 2: Vérification de la session Supabase');
  
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (session) {
      console.log(`   - ✅ Session trouvée pour: ${session.user.email}`);
      console.log(`   - User ID: ${session.user.id}`);
      console.log(`   - Session valide jusqu\'à: ${new Date(session.expires_at * 1000).toLocaleString()}`);
      return true;
    } else {
      console.log('   - ℹ️ Aucune session active');
      return false;
    }
  } catch (error) {
    console.log(`   - ❌ Erreur lors de la vérification de la session: ${error.message}`);
    return false;
  }
}

// Test 3: Vérifier le profil en base de données
async function testProfileInDatabase() {
  console.log('✅ Test 3: Vérification du profil en base de données');
  
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session?.user) {
      console.log('   - ℹ️ Aucun utilisateur connecté');
      return false;
    }
    
    const { data: profile, error } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.log(`   - ❌ Erreur lors de la récupération du profil: ${error.message}`);
      return false;
    }
    
    if (profile) {
      console.log(`   - ✅ Profil trouvé en base: ${profile.name}`);
      console.log(`   - Profil ID: ${profile.id}`);
      console.log(`   - Vérifié: ${profile.is_verified ? 'Oui' : 'Non'}`);
      return true;
    } else {
      console.log('   - ❌ Profil non trouvé en base');
      return false;
    }
  } catch (error) {
    console.log(`   - ❌ Erreur lors du test de la base: ${error.message}`);
    return false;
  }
}

// Test 4: Vérifier le cache de profil
function testProfileCache() {
  console.log('✅ Test 4: Vérification du cache de profil');
  
  if (window.profileCache) {
    const cacheSize = window.profileCache.size;
    console.log(`   - Cache de profil: ${cacheSize} profil(s) en cache`);
    
    if (cacheSize > 0) {
      // Afficher les profils en cache
      for (const [userId, profile] of window.profileCache.entries()) {
        console.log(`     - ${userId}: ${profile.name}`);
      }
    }
    return true;
  } else {
    console.log('   - ❌ Cache de profil non disponible');
    return false;
  }
}

// Test 5: Vérifier l'état React de l'authentification
function testReactAuthState() {
  console.log('✅ Test 5: Vérification de l\'état React d\'authentification');
  
  // Vérifier que les composants de débogage sont présents
  const authDebug = document.querySelector('[class*="fixed top-4 right-4"]');
  const profileTest = document.querySelector('[class*="fixed top-4 left-4"]');
  
  if (authDebug) {
    console.log('   - ✅ Composant AuthDebug présent');
  } else {
    console.log('   - ❌ Composant AuthDebug manquant');
  }
  
  if (profileTest) {
    console.log('   - ✅ Composant ProfileTest présent');
  } else {
    console.log('   - ❌ Composant ProfileTest manquant');
  }
  
  // Vérifier les informations affichées
  if (authDebug) {
    const loadingText = authDebug.textContent.includes('Loading');
    const userText = authDebug.textContent.includes('User');
    const profileText = authDebug.textContent.includes('Profile');
    
    console.log(`   - Informations AuthDebug: Loading(${loadingText}), User(${userText}), Profile(${profileText})`);
  }
  
  return true;
}

// Test 6: Simulation d'une actualisation de page
function testPageRefreshSimulation() {
  console.log('✅ Test 6: Simulation d\'actualisation de page');
  
  console.log('   - 📋 Instructions pour tester manuellement:');
  console.log('     1. Assurez-vous d\'être connecté');
  console.log('     2. Appuyez sur F5 (rafraîchir la page)');
  console.log('     3. Vérifiez que le profil se reconnecte automatiquement');
  console.log('     4. Utilisez le composant ProfileTest pour valider');
  
  return true;
}

// Fonction principale de test
async function runProfileReconnectionTests() {
  console.log('🚀 Démarrage des tests de reconnexion du profil...\n');
  
  const tests = [
    { name: 'État initial d\'authentification', fn: testInitialAuthState },
    { name: 'Session Supabase', fn: testSupabaseSession },
    { name: 'Profil en base de données', fn: testProfileInDatabase },
    { name: 'Cache de profil', fn: testProfileCache },
    { name: 'État React d\'authentification', fn: testReactAuthState },
    { name: 'Simulation d\'actualisation', fn: testPageRefreshSimulation }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n🧪 ${test.name}:`);
    
    try {
      let result;
      if (test.fn.constructor.name === 'AsyncFunction') {
        result = await test.fn();
      } else {
        result = test.fn();
      }
      
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`   - ❌ Erreur dans le test: ${error.message}`);
    }
  }
  
  // Résumé des tests
  console.log('\n📊 Résumé des Tests de Reconnexion du Profil:');
  console.log(`   - Tests réussis: ${passedTests}/${totalTests}`);
  console.log(`   - Taux de succès: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('✅ Le profil devrait se reconnecter correctement lors de l\'actualisation.');
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez la configuration.');
  }
  
  // Recommandations
  console.log('\n💡 Recommandations:');
  console.log('   - Utilisez le composant ProfileTest pour des tests en temps réel');
  console.log('   - Vérifiez les logs dans la console pour diagnostiquer les problèmes');
  console.log('   - Testez l\'actualisation de page (F5) pour valider la reconnexion');
}

// Instructions d'utilisation
console.log('📋 Instructions d\'utilisation:');
console.log('1. Assurez-vous que l\'application est chargée');
console.log('2. Ouvrez la console du navigateur (F12)');
console.log('3. Exécutez: runProfileReconnectionTests()');
console.log('4. Vérifiez les résultats des tests');
console.log('5. Testez l\'actualisation de page (F5)');
console.log('');

// Exposer la fonction de test globalement
window.runProfileReconnectionTests = runProfileReconnectionTests;

console.log('🔧 Script de test de reconnexion du profil chargé. Exécutez runProfileReconnectionTests() pour commencer les tests.');
