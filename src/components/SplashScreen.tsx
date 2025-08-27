import React, { useEffect, useState } from 'react'
import { MapPin, Users, Clock, Euro } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showContent, setShowContent] = useState(false)

  const features = [
    {
      icon: MapPin,
      title: 'Tâches Locales',
      description: 'Trouvez des services près de chez vous'
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Entraide et collaboration locale'
    },
    {
      icon: Clock,
      title: 'Rapide',
      description: 'Tâches complétées en quelques heures'
    },
    {
      icon: Euro,
      title: 'Économique',
      description: 'Prix justes et transparents'
    }
  ]

  useEffect(() => {
    // Délai initial avant d'afficher le contenu
    const initialTimer = setTimeout(() => {
      setShowContent(true)
    }, 500)

    // Timer pour passer à l'étape suivante
    const stepTimer = setTimeout(() => {
      setCurrentStep(1)
    }, 2000)

    // Timer pour terminer le splash
    const finalTimer = setTimeout(() => {
      onComplete()
    }, 4000)

    return () => {
      clearTimeout(initialTimer)
      clearTimeout(stepTimer)
      clearTimeout(finalTimer)
    }
  }, [onComplete])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col items-center justify-center p-8">
      {/* Logo et Titre Principal */}
      <div className={`text-center mb-12 transition-all duration-1000 ${
        showContent ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
      }`}>
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <MapPin className="w-12 h-12 text-blue-600" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          MicroTask
        </h1>
        
        <p className="text-xl md:text-2xl text-blue-100 font-medium">
          Plateforme Locale de Délégation de Tâches
        </p>
      </div>

      {/* Fonctionnalités */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl w-full transition-all duration-1000 delay-500 ${
        showContent ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
      }`}>
        {features.map((feature, index) => (
          <div
            key={index}
            className={`text-center transition-all duration-700 delay-${index * 200} ${
              currentStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <feature.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-white mb-1">
              {feature.title}
            </h3>
            <p className="text-xs md:text-sm text-blue-100">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Barre de Progression */}
      <div className={`mt-12 w-full max-w-md transition-all duration-1000 delay-1000 ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-white/20 rounded-full h-2 backdrop-blur-sm">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-3000 ease-out"
            style={{ width: `${(currentStep + 1) * 25}%` }}
          />
        </div>
        <p className="text-center text-white/80 text-sm mt-3">
          Chargement... {Math.round((currentStep + 1) * 25)}%
        </p>
      </div>

      {/* Indicateur de Chargement */}
      <div className={`mt-8 transition-all duration-1000 delay-1500 ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>

      {/* Version */}
      <div className={`absolute bottom-8 text-center transition-all duration-1000 delay-2000 ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}>
        <p className="text-white/60 text-sm">
          Version 1.0.0 • Rendez service à votre communauté locale
        </p>
      </div>
    </div>
  )
}
