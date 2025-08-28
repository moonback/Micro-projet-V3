import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { validateEnvironment } from './lib/config'

// Valider l'environnement au démarrage
try {
  validateEnvironment()
} catch (error) {
  console.error('Failed to start application:', error)
  // Afficher une erreur visible à l'utilisateur
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <div>
        <h1 style="color: #dc2626; margin-bottom: 20px;">Erreur de Configuration</h1>
        <p style="color: #6b7280; margin-bottom: 20px;">
          L'application n'a pas pu démarrer à cause d'une erreur de configuration.
        </p>
        <p style="color: #9ca3af; font-size: 14px;">
          ${error instanceof Error ? error.message : 'Erreur inconnue'}
        </p>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 20px;">
          Vérifiez votre fichier .env et redémarrez l'application.
        </p>
      </div>
    </div>
  `
  throw error
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
