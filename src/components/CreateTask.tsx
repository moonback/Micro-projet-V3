import React, { useState, useRef } from 'react'
import { Camera, MapPin, Calendar, Euro, Type, FileText, ArrowLeft, ArrowRight, Check, X, Zap, TrendingUp, Star, Clock, Tag, Globe, AlertTriangle, Crown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import LocationPicker from './LocationPicker'
import Header from './Header'

export default function CreateTask() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [budget, setBudget] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [deadline, setDeadline] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('France')
  const [isUrgent, setIsUrgent] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [availableHours, setAvailableHours] = useState({
    monday: ['09:00-12:00', '14:00-18:00'],
    tuesday: ['09:00-12:00', '14:00-18:00'],
    wednesday: ['09:00-12:00', '14:00-18:00'],
    thursday: ['09:00-12:00', '14:00-18:00'],
    friday: ['09:00-12:00', '14:00-18:00'],
    saturday: ['09:00-12:00'],
    sunday: []
  })
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])

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

  const priorities = [
    { value: 'low', label: 'Faible', color: 'from-gray-400 to-gray-500', icon: '🐌' },
    { value: 'medium', label: 'Moyenne', color: 'from-blue-400 to-blue-500', icon: '⚡' },
    { value: 'high', label: 'Élevée', color: 'from-orange-400 to-orange-500', icon: '🔥' },
    { value: 'urgent', label: 'Urgente', color: 'from-red-400 to-red-500', icon: '🚨' }
  ]

  const commonTags = [
    'Urgent', 'Flexible', 'À domicile', 'Transport', 'Manuel', 'Intellectuel', 
    'Créatif', 'Technique', 'Social', 'Environnemental', 'Éducatif', 'Santé'
  ]

  const steps = [
    { id: 1, title: 'Informations', description: 'Titre, description et catégorie', icon: Type },
    { id: 2, title: 'Détails', description: 'Priorité, durée et disponibilités', icon: Clock },
    { id: 3, title: 'Localisation', description: 'Où se trouve la tâche', icon: MapPin },
    { id: 4, title: 'Budget & Finalisation', description: 'Prix, échéance et photos', icon: Euro }
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedPhotos(prev => [...prev, ...files])
  }

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags(prev => [...prev, tag])
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
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

      // Préparer les données de la tâche
      const taskData = {
        title,
        description,
        category,
        tags: tags.length > 0 ? tags : null,
        priority,
        budget: parseFloat(budget),
        estimated_duration: estimatedDuration || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        },
        latitude: location.lat,
        longitude: location.lng,
        address,
        city: city || null,
        postal_code: postalCode || null,
        country,
        author: user.id,
        status: 'open',
        currency: 'EUR',
        is_urgent: isUrgent,
        is_featured: isFeatured,
        available_hours: availableHours,
        payment_status: 'pending'
      }

      // Créer la tâche
      const { error } = await supabase
        .from('tasks')
        .insert(taskData)

      if (error) throw error

      // Reset form
      setTitle('')
      setDescription('')
      setCategory('')
      setTags([])
      setPriority('medium')
      setBudget('')
      setEstimatedDuration('')
      setDeadline('')
      setLocation(null)
      setAddress('')
      setCity('')
      setPostalCode('')
      setCountry('France')
      setIsUrgent(false)
      setIsFeatured(false)
      setSelectedPhotos([])
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
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const canGoToNext = () => {
    switch (currentStep) {
      case 1: return title.trim() && description.trim() && category
      case 2: return priority && (estimatedDuration || true) // Durée optionnelle
      case 3: return location && address
      case 4: return budget && parseFloat(budget) > 0
      default: return false
    }
  }

  if (showLocationPicker) {
    return <LocationPicker onLocationSelect={handleLocationSelect} onCancel={() => setShowLocationPicker(false)} />
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header avec gradient moderne */}
             <Header
         title="Créer une Nouvelle Tâche"
         subtitle={`Étape ${currentStep}/4: ${steps[currentStep - 1].title}`}
         showSearch={false}
         showFilters={false}
         showViewToggle={false}
         showRefresh={false}
         className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white"
       />

      {/* Contenu du formulaire */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pb-24">
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

              {/* Tags */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mr-3">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  Tags (Optionnel)
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {commonTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                          tags.includes(tag)
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <div key={tag} className="flex items-center bg-blue-100 text-blue-700 px-3 py-2 rounded-full">
                          <span className="text-sm font-medium">{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-blue-500 hover:text-blue-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
              {/* Priorité */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mr-3">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  Niveau de Priorité
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {priorities.map((priorityItem) => (
                    <button
                      key={priorityItem.value}
                      type="button"
                      onClick={() => setPriority(priorityItem.value as any)}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        priority === priorityItem.value
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{priorityItem.icon}</div>
                      <div className="text-sm font-medium text-gray-700">{priorityItem.label}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Durée estimée */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-3">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  Durée Estimée (Optionnel)
                </label>
                <input
                  type="text"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all"
                  placeholder="ex: 2 heures, 1 jour, 30 minutes..."
                />
              </motion.div>

              {/* Options spéciales */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  Options Spéciales
                </label>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-gray-700 font-medium">Marquer comme urgente</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">Mettre en avant</span>
                  </label>
                </div>
              </motion.div>
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
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800 text-lg">Emplacement sélectionné</p>
                        <p className="text-green-700">{address}</p>
                      </div>
                    </div>
                    
                    {/* Champs de localisation supplémentaires */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ville"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Code Postal</label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Code postal"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
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
                  onChange={handlePhotoUpload}
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
                
                {/* Photos sélectionnées */}
                {selectedPhotos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {selectedPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation entre étapes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex items-center justify-between gap-3 pt-8 pb-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6"
        >
          <motion.button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            whileHover={{ scale: currentStep > 1 ? 1.05 : 1 }}
            whileTap={{ scale: currentStep > 1 ? 0.95 : 1 }}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl font-medium transition-all min-h-[48px] ${
              currentStep > 1
                ? 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 shadow-md hover:shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Précédent</span>
          </motion.button>

          {currentStep < 4 ? (
            <motion.button
              type="button"
              onClick={nextStep}
              disabled={!canGoToNext()}
              whileHover={{ scale: canGoToNext() ? 1.05 : 1 }}
              whileTap={{ scale: canGoToNext() ? 0.95 : 1 }}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl font-medium transition-all min-h-[48px] ${
                canGoToNext()
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="text-sm">Suivant</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              disabled={loading || !canGoToNext()}
              whileHover={{ scale: loading || !canGoToNext() ? 1 : 1.05 }}
              whileTap={{ scale: loading || !canGoToNext() ? 1 : 0.95 }}
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all min-h-[48px] ${
                loading || !canGoToNext()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Création...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span className="text-sm">Créer la Tâche</span>
                </>
              )}
            </motion.button>
          )}
        </motion.div>
      </form>
    </div>
  )
}