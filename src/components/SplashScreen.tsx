import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Users, Clock, Euro, Sparkles, ArrowRight } from 'lucide-react'
import Logo from './Logo'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showContent, setShowContent] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const features = [
    {
      icon: MapPin,
      title: 'Tâches Locales',
      description: 'Trouvez des services près de chez vous',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Entraide et collaboration locale',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Clock,
      title: 'Rapide',
      description: 'Tâches complétées en quelques heures',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Euro,
      title: 'Économique',
      description: 'Prix justes et transparents',
      color: 'from-purple-500 to-pink-500'
    }
  ]

  useEffect(() => {
    // Délai initial avant d'afficher le contenu
    const initialTimer = setTimeout(() => {
      setShowContent(true)
    }, 300)

    // Timer pour passer à l'étape suivante
    const stepTimer = setTimeout(() => {
      setCurrentStep(1)
    }, 2000)

    // Timer pour terminer le splash (5 secondes total)
    const finalTimer = setTimeout(() => {
      setIsAnimating(true)
      setTimeout(() => {
        onComplete()
      }, 800)
    }, 5000)

    return () => {
      clearTimeout(initialTimer)
      clearTimeout(stepTimer)
      clearTimeout(finalTimer)
    }
  }, [onComplete])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      transition: {
        duration: 0.8,
        ease: "easeInOut" as const
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  }

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        type: "spring" as const,
        stiffness: 100
      }
    }
  }

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    }
  }

  const progressVariants = {
    hidden: { width: 0 },
    visible: { 
      width: "100%",
      transition: {
        duration: 4.7, // 5 secondes moins le délai initial de 300ms
        ease: "easeInOut" as const
      }
    }
  }

  return (
    <AnimatePresence mode="wait">
      {!isAnimating ? (
        <motion.div
          className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Particules d'arrière-plan */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/10 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Logo et Titre Principal */}
          <motion.div 
            className="text-center pt-20 pb-16 px-8"
            variants={itemVariants}
          >
            <motion.div
              className="w-28 h-28 bg-gradient-to-br from-white to-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/25"
              variants={logoVariants}
            >
              <Logo size="xl" className="w-16 h-16" />
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-cyan-200 mb-6"
              variants={itemVariants}
            >
              MicroTask
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-blue-200 font-medium mb-2"
              variants={itemVariants}
            >
              Plateforme Locale de Délégation de Tâches
            </motion.p>
            
            <motion.div 
              className="flex items-center justify-center space-x-2 text-blue-300"
              variants={itemVariants}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">Rendez service à votre communauté</span>
              <Sparkles className="w-5 h-5" />
            </motion.div>
          </motion.div>

          {/* Fonctionnalités */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto px-8 mb-16"
            variants={itemVariants}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="text-center group"
                variants={featureVariants}
                initial="hidden"
                animate={currentStep >= 1 ? "visible" : "hidden"}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div 
                  className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105`}
                  whileHover={{ rotate: 5 }}
                >
                  <feature.icon className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-blue-200 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Barre de Progression */}
          <motion.div 
            className="w-full max-w-md mx-auto px-8 mb-8"
            variants={itemVariants}
          >
            <div className="bg-white/10 rounded-full h-3 backdrop-blur-sm overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full rounded-full"
                variants={progressVariants}
                initial="hidden"
                animate="visible"
              />
            </div>
            <motion.p 
              className="text-center text-blue-200 text-sm mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Chargement... {Math.round(((currentStep + 1) / 2) * 100)}%
            </motion.p>
          </motion.div>

          {/* Bouton de démarrage */}
          <motion.div 
            className="text-center mb-8"
            variants={itemVariants}
          >
            <motion.button
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsAnimating(true)
                setTimeout(() => onComplete(), 800)
              }}
            >
              <span>Commencer</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Version */}
          <motion.div 
            className="absolute bottom-8 left-0 right-0 text-center"
            variants={itemVariants}
          >
            <p className="text-blue-300/60 text-sm">
              Version 1.0.0 • Développé avec ❤️ pour la communauté
            </p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="text-center">
            <motion.div
              className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            />
            <p className="text-blue-200 font-medium">Préparation de votre expérience...</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
