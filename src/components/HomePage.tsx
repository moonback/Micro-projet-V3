import React, { useState, useEffect } from 'react'
import { MapPin, Users, Clock, Euro, Shield, Star, ArrowRight, CheckCircle, TrendingUp, Zap, Heart, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

interface HomePageProps {
  onGetStarted: () => void
}

export default function HomePage({ onGetStarted }: HomePageProps) {
  const { user } = useAuth()
  const [isDesktop, setIsDesktop] = useState(false)

  // Détecter la taille de l'écran
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const features = [
    {
      icon: MapPin,
      title: 'Tâches Locales',
      description: 'Trouvez des services et de l\'aide dans votre quartier',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700'
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Rejoignez une communauté d\'entraide locale',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700'
    },
    {
      icon: Clock,
      title: 'Rapide',
      description: 'Tâches complétées en quelques heures',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700'
    },
    {
      icon: Euro,
      title: 'Économique',
      description: 'Prix justes et transparents pour tous',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700'
    },
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Paiements sécurisés et profils vérifiés',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700'
    },
    {
      icon: Star,
      title: 'Qualité',
      description: 'Système d\'évaluation et de confiance',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700'
    }
  ]

  const howItWorks = [
    {
      step: '1',
      title: 'Créez une Tâche',
      description: 'Décrivez ce dont vous avez besoin et fixez votre budget',
      icon: Zap
    },
    {
      step: '2',
      title: 'Trouvez de l\'Aide',
      description: 'Des personnes qualifiées proposent leurs services',
      icon: Users
    },
    {
      step: '3',
      title: 'Collaborez',
      description: 'Communiquez en temps réel et suivez l\'avancement',
      icon: Clock
    },
    {
      step: '4',
      title: 'Finalisez',
      description: 'Confirmez la completion et laissez un avis',
      icon: CheckCircle
    }
  ]

  const stats = [
    { number: '1000+', label: 'Tâches Créées', icon: MapPin, color: 'from-blue-500 to-blue-600' },
    { number: '500+', label: 'Utilisateurs Actifs', icon: Users, color: 'from-green-500 to-green-600' },
    { number: '95%', label: 'Tâches Complétées', icon: CheckCircle, color: 'from-purple-500 to-purple-600' },
    { number: '4.8/5', label: 'Note Moyenne', icon: Star, color: 'from-yellow-500 to-yellow-600' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section avec gradient moderne */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className={`relative ${isDesktop ? 'max-w-7xl' : 'max-w-6xl'} mx-auto px-4 py-16 md:py-24 lg:py-32`}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`${isDesktop ? 'w-32 h-32' : 'w-20 h-20'} bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30`}
            >
              <MapPin className={`${isDesktop ? 'w-12 h-12' : 'w-10 h-10'} text-white`} />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className={`${isDesktop ? 'text-5xl lg:text-7xl' : 'text-4xl md:text-6xl'} font-bold mb-6 leading-tight`}
            >
              Rendez Service à Votre<br />
              <span className="text-blue-200">Communauté Locale</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className={`${isDesktop ? 'text-2xl lg:text-3xl' : 'text-xl md:text-2xl'} text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed`}
            >
              MicroTask connecte les personnes qui ont besoin d'aide avec celles qui peuvent en apporter. 
              Créez des tâches, trouvez de l'aide, et construisez une communauté plus forte.
            </motion.p>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGetStarted}
              className={`${isDesktop ? 'px-12 py-5 text-xl' : 'px-8 py-4 text-lg'} bg-gradient-to-r from-white to-blue-50 text-blue-600 rounded-2xl font-semibold hover:shadow-xl transition-all flex items-center justify-center mx-auto space-x-2 shadow-lg`}
            >
              <span>Commencer Maintenant</span>
              <ArrowRight className={`${isDesktop ? 'w-6 h-6' : 'w-5 h-5'}`} />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Statistiques avec design moderne */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className={`py-16 ${isDesktop ? 'lg:py-24' : ''} bg-white`}
      >
        <div className={`${isDesktop ? 'max-w-7xl' : 'max-w-6xl'} mx-auto px-4`}>
          <div className={`grid ${isDesktop ? 'grid-cols-4 gap-8' : 'grid-cols-2 md:grid-cols-4 gap-6'}`}>
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all`}>
                  <stat.icon className={`${isDesktop ? 'w-10 h-10' : 'w-8 h-8'} text-white`} />
                </div>
                <div className={`${isDesktop ? 'text-4xl lg:text-5xl' : 'text-3xl md:text-4xl'} font-bold text-gray-900 mb-2`}>
                  {stat.number}
                </div>
                <div className={`${isDesktop ? 'text-lg' : 'text-base'} text-gray-600 font-medium`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Fonctionnalités avec cartes modernes */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className={`py-16 ${isDesktop ? 'lg:py-24' : ''} bg-gray-50`}
      >
        <div className={`${isDesktop ? 'max-w-7xl' : 'max-w-6xl'} mx-auto px-4`}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`${isDesktop ? 'text-4xl lg:text-5xl' : 'text-3xl md:text-4xl'} font-bold text-gray-900 mb-4`}>
              Pourquoi Choisir MicroTask ?
            </h2>
            <p className={`${isDesktop ? 'text-2xl lg:text-3xl' : 'text-xl'} text-gray-600 max-w-3xl mx-auto leading-relaxed`}>
              Une plateforme complète et sécurisée pour tous vos besoins locaux
            </p>
          </motion.div>
          
          <div className={`grid ${isDesktop ? 'grid-cols-1 lg:grid-cols-3 gap-10' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: isDesktop ? -8 : -5 }}
                className={`bg-white ${isDesktop ? 'p-8' : 'p-6'} rounded-3xl shadow-lg hover:shadow-xl transition-all border border-gray-100`}
              >
                <div className={`${isDesktop ? 'w-16 h-16' : 'w-14 h-14'} bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className={`${isDesktop ? 'w-8 h-8' : 'w-7 h-7'} text-white`} />
                </div>
                <h3 className={`${isDesktop ? 'text-2xl' : 'text-xl'} font-semibold text-gray-900 mb-3`}>
                  {feature.title}
                </h3>
                <p className={`${isDesktop ? 'text-lg' : 'text-base'} text-gray-600 leading-relaxed`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Comment ça marche avec étapes modernes */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className={`py-16 ${isDesktop ? 'lg:py-24' : ''} bg-white`}
      >
        <div className={`${isDesktop ? 'max-w-7xl' : 'max-w-6xl'} mx-auto px-4`}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`${isDesktop ? 'text-4xl lg:text-5xl' : 'text-3xl md:text-4xl'} font-bold text-gray-900 mb-4`}>
              Comment ça Marche ?
            </h2>
            <p className={`${isDesktop ? 'text-2xl lg:text-3xl' : 'text-xl'} text-gray-600 max-w-3xl mx-auto leading-relaxed`}>
              En 4 étapes simples, obtenez l'aide dont vous avez besoin
            </p>
          </motion.div>
          
          <div className={`grid ${isDesktop ? 'grid-cols-4 gap-10' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'}`}>
            {howItWorks.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="relative">
                  <div className={`${isDesktop ? 'w-24 h-24' : 'w-20 h-20'} bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 ${isDesktop ? 'text-3xl' : 'text-2xl'} font-bold shadow-lg group-hover:shadow-xl transition-all`}>
                    {step.step}
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <step.icon className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} text-white`} />
                  </div>
                </div>
                <h3 className={`${isDesktop ? 'text-2xl' : 'text-xl'} font-semibold text-gray-900 mb-3`}>
                  {step.title}
                </h3>
                <p className={`${isDesktop ? 'text-lg' : 'text-base'} text-gray-600 leading-relaxed`}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Call to Action avec gradient */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className={`py-16 ${isDesktop ? 'lg:py-24' : ''} bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600`}
      >
        <div className={`${isDesktop ? 'max-w-5xl' : 'max-w-4xl'} mx-auto px-4 text-center`}>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className={`${isDesktop ? 'text-4xl lg:text-5xl' : 'text-3xl md:text-4xl'} font-bold text-white mb-4`}
          >
            Prêt à Commencer ?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
            className={`${isDesktop ? 'text-2xl' : 'text-xl'} text-blue-100 mb-8 leading-relaxed`}
          >
            Rejoignez des milliers d'utilisateurs qui font déjà partie de la communauté MicroTask
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            viewport={{ once: true }}
            className={`flex ${isDesktop ? 'flex-row gap-6' : 'flex-col sm:flex-row gap-4'} justify-center`}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGetStarted}
              className={`${isDesktop ? 'px-12 py-4 text-xl' : 'px-8 py-3 text-lg'} bg-gradient-to-r from-white to-blue-50 text-blue-600 rounded-2xl font-semibold hover:shadow-xl transition-all flex items-center justify-center space-x-2 shadow-lg`}
            >
              <span>Commencer Maintenant</span>
              <ArrowRight className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'}`} />
            </motion.button>
            
            {!user && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${isDesktop ? 'px-12 py-4 text-xl' : 'px-8 py-3 text-lg'} border-2 border-white text-white rounded-2xl font-semibold hover:bg-white hover:text-blue-600 transition-all backdrop-blur-sm`}
              >
                En Savoir Plus
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Footer moderne */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className={`py-8 ${isDesktop ? 'lg:py-12' : ''} bg-gradient-to-r from-gray-900 to-gray-800 text-gray-400`}
      >
        <div className={`${isDesktop ? 'max-w-7xl' : 'max-w-6xl'} mx-auto px-4 text-center`}>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className={`${isDesktop ? 'w-6 h-6' : 'w-5 h-5'} text-red-500`} />
            <span className={`${isDesktop ? 'text-base' : 'text-sm'} font-medium`}>
              © 2024 MicroTask. Tous droits réservés.
            </span>
          </div>
          <p className={`${isDesktop ? 'text-base' : 'text-sm'} text-gray-500`}>
            Rendez service à votre communauté locale
          </p>
        </div>
      </motion.div>
    </div>
  )
}
