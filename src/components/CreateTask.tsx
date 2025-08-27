import React, { useState, useRef } from 'react'
import { Camera, MapPin, Calendar, Euro, Type, FileText, ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
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
    { name: 'Livraison', icon: '🚚', color: 'bg-blue-50 text-blue-600' },
    { name: 'Nettoyage', icon: '🧹', color: 'bg-green-50 text-green-600' },
    { name: 'Courses', icon: '🛒', color: 'bg-purple-50 text-purple-600' },
    { name: 'Déménagement', icon: '📦', color: 'bg-orange-50 text-orange-600' },
    { name: 'Montage', icon: '🔧', color: 'bg-red-50 text-red-600' },
    { name: 'Garde d\'Animaux', icon: '🐾', color: 'bg-pink-50 text-pink-600' },
    { name: 'Jardinage', icon: '🌱', color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Aide Informatique', icon: '💻', color: 'bg-indigo-50 text-indigo-600' },
    { name: 'Cours Particuliers', icon: '📚', color: 'bg-amber-50 text-amber-600' },
    { name: 'Autre', icon: '✨', color: 'bg-gray-50 text-gray-600' }
  ]

  const steps = [
    { id: 1, title: 'Informations', description: 'Titre et description' },
    { id: 2, title: 'Localisation', description: 'Où se trouve la tâche' },
    { id: 3, title: 'Budget & Détails', description: 'Prix et échéance' }
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-white"
    >
      {/* Header avec étapes */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Créer une Nouvelle Tâche</h1>
        
        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                currentStep >= step.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">{steps[currentStep - 1].title}</h2>
          <p className="text-gray-600">{steps[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Contenu du formulaire */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Type className="inline w-5 h-5 mr-2 text-blue-600" />
                  Titre de la Tâche
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="De quoi avez-vous besoin ?"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <FileText className="inline w-5 h-5 mr-2 text-blue-600" />
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg"
                  placeholder="Donnez plus de détails sur votre tâche..."
                  required
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Catégorie
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <motion.button
                      key={cat.name}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCategory(cat.name)}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        category === cat.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{cat.icon}</div>
                      <div className="text-sm font-medium text-gray-700">{cat.name}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-8">
                <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sélectionner l'Emplacement</h3>
                <p className="text-gray-600 mb-6">Choisissez où se trouve votre tâche</p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors"
                >
                  Choisir sur la Carte
                </motion.button>
              </div>

              {location && address && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-2xl p-4"
                >
                  <div className="flex items-center space-x-3">
                    <Check className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Emplacement sélectionné</p>
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
              className="space-y-6"
            >
              {/* Budget */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Euro className="inline w-5 h-5 mr-2 text-green-600" />
                  Budget (EUR)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  step="0.01"
                  min="1"
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="Combien êtes-vous prêt à payer ?"
                  required
                />
              </div>

              {/* Date limite */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="inline w-5 h-5 mr-2 text-blue-600" />
                  Date Limite (Optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Camera className="inline w-5 h-5 mr-2 text-purple-600" />
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
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="font-medium">Appuyez pour ajouter des photos</p>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation entre étapes */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-200">
          <motion.button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            whileHover={{ scale: currentStep > 1 ? 1.05 : 1 }}
            whileTap={{ scale: currentStep > 1 ? 0.95 : 1 }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-colors ${
              currentStep > 1
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
              className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-colors ${
                canGoToNext()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
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
              className={`flex items-center space-x-2 px-8 py-3 rounded-2xl font-semibold transition-colors ${
                loading || !canGoToNext()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
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
        </div>
      </form>
    </motion.div>
  )
}