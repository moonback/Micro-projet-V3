import React, { useState, useRef } from 'react'
import { Camera, MapPin, Calendar, Euro, Type, FileText, ArrowLeft, ArrowRight, Check, X, Zap, TrendingUp, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import LocationPicker from './LocationPicker'

export default function CreateTask() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    { name: 'Livraison', icon: '🚚', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
    { name: 'Nettoyage', icon: '🧹', color: 'from-green-500 to-green-600', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    { name: 'Courses', icon: '🛒', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
    { name: 'Déménagement', icon: '📦', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
    { name: 'Montage', icon: '🔧', color: 'from-red-500 to-red-600', bgColor: 'bg-red-100', textColor: 'text-red-700' },
    { name: 'Garde d\'Animaux', icon: '🐾', color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-100', textColor: 'text-pink-700' },
    { name: 'Jardinage', icon: '🌱', color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
    { name: 'Aide Informatique', icon: '💻', color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-100', textColor: 'text-indigo-700' },
    { name: 'Cours Particuliers', icon: '📚', color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
    { name: 'Autre', icon: '✨', color: 'from-gray-500 to-gray-600', bgColor: 'bg-gray-100', textColor: 'text-gray-700' }
  ]

  const steps = [
    { id: 1, title: 'Informations', description: 'Titre et description', icon: Type },
    { id: 2, title: 'Localisation', description: 'Où se trouve la tâche', icon: MapPin },
    { id: 3, title: 'Budget & Détails', description: 'Prix et échéance', icon: Euro }
  ]

  // Fonction utilitaire pour s'assurer que le profil existe
  const ensureUserProfile = async () => {
    if (!user) return false

    try {
      // Vérifier si le profil existe
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profil n'existe pas, le créer
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
            rating: 0,
            rating_count: 0,
            is_verified: false
          })

        if (createProfileError) {
          console.error('Error creating profile:', createProfileError)
          return false
        }
      } else if (profileError) {
        console.error('Error checking profile:', profileError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error ensuring user profile:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !location) return

    setLoading(true)

    try {
      // S'assurer que le profil utilisateur existe
      const profileExists = await ensureUserProfile()
      if (!profileExists) {
        throw new Error('Impossible de créer ou vérifier le profil utilisateur')
      }

      // Maintenant créer la tâche
      const { error } = await supabase
        .from('tasks')
        .insert({
          title,
          description,
          category,
          budget: parseFloat(budget),
          deadline: deadline ? new Date(deadline).toISOString() : null,
          location: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          address,
          author: user.id,
          status: 'open',
          currency: 'EUR'
        })

      if (error) throw error

      // Reset form
      setTitle('')
      setDescription('')
      setCategory('')
      setBudget('')
      setDeadline('')
      setLocation(null)
      setAddress('')
      setCurrentStep(1)
      
      alert('Tâche créée avec succès !')
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Erreur lors de la création de la tâche. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (selectedLocation: { lat: number; lng: number }, selectedAddress: string) => {
    setLocation(selectedLocation)
    setAddress(selectedAddress)
    setShowLocationPicker(false)
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const canGoToNext = () => {
    switch (currentStep) {
      case 1: return title.trim() && description.trim() && category
      case 2: return location && address
      case 3: return budget && parseFloat(budget) > 0
      default: return false
    }
  }

  if (showLocationPicker) {
    return <LocationPicker onLocationSelect={handleLocationSelect} onCancel={() => setShowLocationPicker(false)} />
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header avec gradient moderne */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-2xl font-bold mb-6 text-center"
          >
            Créer une Nouvelle Tâche
          </motion.h1>
          
          {/* Indicateur d'étapes moderne */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm shadow-lg ${
                    currentStep >= step.id 
                      ? 'bg-gradient-to-br from-white to-blue-50 text-blue-600' 
                      : 'bg-white/20 text-white/70 backdrop-blur-sm'
                  }`}
                >
                  {currentStep > step.id ? <Check className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                </motion.div>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-1 mx-3 rounded-full ${
                    currentStep > step.id ? 'bg-gradient-to-r from-white to-blue-200' : 'bg-white/30'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-lg font-semibold mb-2">{steps[currentStep - 1].title}</h2>
            <p className="text-blue-100">{steps[currentStep - 1].description}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Contenu du formulaire */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Titre */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                    <Type className="w-4 h-4 text-white" />
                  </div>
                  Titre de la Tâche
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all"
                  placeholder="De quoi avez-vous besoin ?"
                  required
                />
              </motion.div>

              {/* Description */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-3">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg transition-all"
                  placeholder="Donnez plus de détails sur votre tâche..."
                  required
                />
              </motion.div>

              {/* Catégorie */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  Catégorie
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat, index) => (
                    <motion.button
                      key={cat.name}
                      type="button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.05, duration: 0.6 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCategory(cat.name)}
                      className={`p-4 rounded-2xl border-2 transition-all shadow-md hover:shadow-lg ${
                        category === cat.name
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{cat.icon}</div>
                      <div className="text-sm font-medium text-gray-700">{cat.name}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sélectionner l'Emplacement</h3>
                <p className="text-gray-600 mb-6">Choisissez où se trouve votre tâche</p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Choisir sur la Carte
                </motion.button>
              </motion.div>

              {location && address && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-6 shadow-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 text-lg">Emplacement sélectionné</p>
                      <p className="text-green-700">{address}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Budget */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-3">
                    <Euro className="w-4 h-4 text-white" />
                  </div>
                  Budget (EUR)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  step="0.01"
                  min="1"
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all"
                  placeholder="Combien êtes-vous prêt à payer ?"
                  required
                />
              </motion.div>

              {/* Date limite */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  Date Limite (Optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </motion.div>

              {/* Photos */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  Ajouter des Photos (Optionnel)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-blue-400 hover:bg-blue-50 transition-all hover:shadow-md"
                >
                  <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium text-lg">Appuyez pour ajouter des photos</p>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation entre étapes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex items-center justify-between pt-8 border-t border-gray-200"
        >
          <motion.button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            whileHover={{ scale: currentStep > 1 ? 1.05 : 1 }}
            whileTap={{ scale: currentStep > 1 ? 0.95 : 1 }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all ${
              currentStep > 1
                ? 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 shadow-md hover:shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Précédent</span>
          </motion.button>

          {currentStep < 3 ? (
            <motion.button
              type="button"
              onClick={nextStep}
              disabled={!canGoToNext()}
              whileHover={{ scale: canGoToNext() ? 1.05 : 1 }}
              whileTap={{ scale: canGoToNext() ? 0.95 : 1 }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all ${
                canGoToNext()
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Suivant</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              disabled={loading || !canGoToNext()}
              whileHover={{ scale: loading || !canGoToNext() ? 1 : 1.05 }}
              whileTap={{ scale: loading || !canGoToNext() ? 1 : 0.95 }}
              className={`flex items-center space-x-2 px-8 py-3 rounded-2xl font-semibold transition-all ${
                loading || !canGoToNext()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Créer la Tâche</span>
                </>
              )}
            </motion.button>
          )}
        </motion.div>
      </form>
    </div>
  )
}