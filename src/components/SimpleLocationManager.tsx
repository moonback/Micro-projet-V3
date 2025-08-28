import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Edit3, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface SimpleLocationManagerProps {
  className?: string
  onLocationUpdate?: () => void
}

interface LocationData {
  address: string
  city: string
  postal_code: string
  country: string
}

export default function SimpleLocationManager({ className = '', onLocationUpdate }: SimpleLocationManagerProps) {
  const { user } = useAuth()
  const [locationData, setLocationData] = useState<LocationData>({
    address: '',
    city: '',
    postal_code: '',
    country: 'France'
  })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      loadLocation()
    }
  }, [user])

  const loadLocation = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('address, city, postal_code, country')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setLocationData({
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          country: data.country || 'France'
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la localisation:', error)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          address: locationData.address || null,
          city: locationData.city || null,
          postal_code: locationData.postal_code || null,
          country: locationData.country || 'France'
        })
        .eq('id', user.id)

      if (error) throw error

      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      
      // Notifier les composants parents que la localisation a été mise à jour
      if (onLocationUpdate) {
        onLocationUpdate()
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    loadLocation() // Restaurer les données originales
    setEditing(false)
  }

  const hasLocation = locationData.address || locationData.city || locationData.postal_code

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className={`bg-white rounded-3xl p-6 shadow-lg border border-gray-100 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Ma Localisation
        </h2>
        {!editing && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditing(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="Modifier la localisation"
          >
            <Edit3 className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={locationData.address}
              onChange={(e) => setLocationData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Rue de la Paix"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={locationData.city}
                onChange={(e) => setLocationData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Paris"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Postal
              </label>
              <input
                type="text"
                value={locationData.postal_code}
                onChange={(e) => setLocationData(prev => ({ ...prev, postal_code: e.target.value }))}
                placeholder="75001"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pays
            </label>
            <select
              value={locationData.country}
              onChange={(e) => setLocationData(prev => ({ ...prev, country: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="France">France</option>
              <option value="Belgique">Belgique</option>
              <option value="Suisse">Suisse</option>
              <option value="Luxembourg">Luxembourg</option>
              <option value="Canada">Canada</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCancel}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </motion.button>
          </div>
        </div>
      ) : (
        <div>
          {hasLocation ? (
            <div className="space-y-3">
              {locationData.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Adresse</p>
                    <p className="text-sm font-medium text-gray-900">{locationData.address}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                {locationData.city && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-sm text-gray-600">{locationData.city}</span>
                  </div>
                )}
                {locationData.postal_code && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm text-gray-600">{locationData.postal_code}</span>
                  </div>
                )}
                {locationData.country && locationData.country !== 'France' && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span className="text-sm text-gray-600">{locationData.country}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucune localisation définie</p>
              <p className="text-gray-400 text-xs mt-1">Cliquez sur l'icône d'édition pour ajouter votre localisation</p>
            </div>
          )}
        </div>
      )}

      {/* Notification de sauvegarde */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-4 right-4 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg text-sm"
          >
            Localisation sauvegardée !
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
