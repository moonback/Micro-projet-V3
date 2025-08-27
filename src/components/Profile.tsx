import React, { useState } from 'react'
import { User, Star, Phone, Mail, Camera, Edit, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Profile() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [phone, setPhone] = useState(profile?.phone || '')

  const handleSave = async () => {
    await updateProfile({ name, phone })
    setIsEditing(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Profil</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-600" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="text-center mt-4">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xl font-bold text-gray-900 text-center border-b border-gray-300 focus:border-blue-500 outline-none"
                placeholder="Votre nom"
              />
            ) : (
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.name || 'Utilisateur Anonyme'}
              </h2>
            )}
            
            <div className="flex items-center justify-center mt-2">
              {renderStars(profile?.rating || 0)}
              <span className="ml-2 text-sm text-gray-600">
                ({profile?.rating_count || 0} avis)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Informations de Contact</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-900">{user?.email}</span>
              </div>
              
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-3" />
                {isEditing ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-gray-900 border-b border-gray-300 focus:border-blue-500 outline-none"
                    placeholder="Votre numéro de téléphone"
                  />
                ) : (
                  <span className="text-gray-900">
                    {profile?.phone || 'Non renseigné'}
                  </span>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Statistiques du Compte</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-xs text-gray-600">Tâches Créées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-xs text-gray-600">Tâches Terminées</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Moyens de Paiement
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Notifications
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Confidentialité et Sécurité
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Aide et Support
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se Déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}