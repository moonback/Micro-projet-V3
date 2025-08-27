import React from 'react'
import { MapPin, Users, Clock, Euro, Shield, Star, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface HomePageProps {
  onGetStarted: () => void
}

export default function HomePage({ onGetStarted }: HomePageProps) {
  const { user } = useAuth()

  const features = [
    {
      icon: MapPin,
      title: 'Tâches Locales',
      description: 'Trouvez des services et de l\'aide dans votre quartier',
      color: 'text-blue-600'
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Rejoignez une communauté d\'entraide locale',
      color: 'text-green-600'
    },
    {
      icon: Clock,
      title: 'Rapide',
      description: 'Tâches complétées en quelques heures',
      color: 'text-orange-600'
    },
    {
      icon: Euro,
      title: 'Économique',
      description: 'Prix justes et transparents pour tous',
      color: 'text-purple-600'
    },
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Paiements sécurisés et profils vérifiés',
      color: 'text-red-600'
    },
    {
      icon: Star,
      title: 'Qualité',
      description: 'Système d\'évaluation et de confiance',
      color: 'text-yellow-600'
    }
  ]

  const howItWorks = [
    {
      step: '1',
      title: 'Créez une Tâche',
      description: 'Décrivez ce dont vous avez besoin et fixez votre budget'
    },
    {
      step: '2',
      title: 'Trouvez de l\'Aide',
      description: 'Des personnes qualifiées proposent leurs services'
    },
    {
      step: '3',
      title: 'Collaborez',
      description: 'Communiquez en temps réel et suivez l\'avancement'
    },
    {
      step: '4',
      title: 'Finalisez',
      description: 'Confirmez la completion et laissez un avis'
    }
  ]

  const stats = [
    { number: '1000+', label: 'Tâches Créées' },
    { number: '500+', label: 'Utilisateurs Actifs' },
    { number: '95%', label: 'Tâches Complétées' },
    { number: '4.8/5', label: 'Note Moyenne' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Rendez Service à Votre<br />
              <span className="text-blue-200">Communauté Locale</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              MicroTask connecte les personnes qui ont besoin d'aide avec celles qui peuvent en apporter. 
              Créez des tâches, trouvez de l'aide, et construisez une communauté plus forte.
            </p>
            
            <button
              onClick={onGetStarted}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors flex items-center justify-center mx-auto space-x-2"
            >
              <span>Commencer Maintenant</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fonctionnalités */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir MicroTask ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète et sécurisée pour tous vos besoins locaux
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${feature.color} bg-gray-100 rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment ça Marche ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              En 4 étapes simples, obtenez l'aide dont vous avez besoin
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à Commencer ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez des milliers d'utilisateurs qui font déjà partie de la communauté MicroTask
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Commencer Maintenant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            {!user && (
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                En Savoir Plus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">
            © 2024 MicroTask. Tous droits réservés. • Rendez service à votre communauté locale
          </p>
        </div>
      </div>
    </div>
  )
}
