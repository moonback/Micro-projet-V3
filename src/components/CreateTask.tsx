import React, { useState, useRef } from 'react'
import { Camera, MapPin, Calendar, Euro, Type, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import LocationPicker from './LocationPicker'

export default function CreateTask() {
  const { user } = useAuth()
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
    'Livraison', 'Nettoyage', 'Courses', 'Déménagement', 'Montage',
    'Garde d\'Animaux', 'Jardinage', 'Aide Informatique', 'Cours Particuliers', 'Autre'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !location) return

    setLoading(true)

    try {
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

  if (showLocationPicker) {
    return <LocationPicker onLocationSelect={handleLocationSelect} onCancel={() => setShowLocationPicker(false)} />
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Créer une Nouvelle Tâche</h1>
        <p className="text-gray-600 text-sm">Publiez une tâche et obtenez de l'aide de votre communauté</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Type className="inline w-4 h-4 mr-1" />
            Titre de la Tâche
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="De quoi avez-vous besoin ?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline w-4 h-4 mr-1" />
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Donnez plus de détails sur votre tâche..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionnez une catégorie</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Euro className="inline w-4 h-4 mr-1" />
            Budget (EUR)
          </label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            step="0.01"
            min="1"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Combien êtes-vous prêt à payer ?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Date Limite (Optionnel)
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Localisation
          </label>
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {address || 'Sélectionnez un emplacement sur la carte'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Camera className="inline w-4 h-4 mr-1" />
            Ajouter des Photos (Optionnel)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50"
          >
            Appuyez pour ajouter des photos
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !location}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors min-h-[44px]"
        >
          {loading ? 'Création de la Tâche...' : 'Créer la Tâche'}
        </button>
      </form>
    </div>
  )
}