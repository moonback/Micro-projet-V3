import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Star, Calendar, LogOut, Edit, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'

interface ProfileProps {
  onSignOut: () => void
}

export default function Profile({ onSignOut }: ProfileProps) {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setProfile(data)
      setEditForm({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setEditForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      address: profile?.address || ''
    })
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          phone: editForm.phone,
          address: editForm.address
        })
        .eq('id', user.id)

      if (error) throw error

      await loadProfile()
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Erreur lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOutClick = async () => {
    try {
      await signOut()
      onSignOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Profil non trouvé</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{profile.name || 'Utilisateur'}</h1>
          <p className="text-blue-100">Membre de la communauté MicroTask</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Informations de Contact */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Informations de Contact
          </h2>
          
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom Complet
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{profile.name || 'Non spécifié'}</p>
                  <p className="text-sm text-gray-600">Nom complet</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{user?.email}</p>
                  <p className="text-sm text-gray-600">Adresse email</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{profile.phone || 'Non spécifié'}</p>
                  <p className="text-sm text-gray-600">Numéro de téléphone</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{profile.address || 'Non spécifié'}</p>
                  <p className="text-sm text-gray-600">Adresse</p>
                </div>
              </div>
              
              <button
                onClick={handleEdit}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier le Profil
              </button>
            </div>
          )}
        </div>

        {/* Statistiques du Compte */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-blue-600" />
            Statistiques du Compte
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {profile.rating || 0}
              </div>
              <div className="text-sm text-blue-600">Note moyenne</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {profile.rating_count || 0}
              </div>
              <div className="text-sm text-green-600">Évaluations</div>
            </div>
          </div>
        </div>

        {/* Informations du Compte */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Informations du Compte
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Membre depuis</span>
              <span className="font-medium text-gray-900">
                {new Date(profile.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Statut</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                profile.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {profile.is_verified ? 'Vérifié' : 'En attente'}
              </span>
            </div>
          </div>
        </div>

        {/* Bouton de Déconnexion */}
        <button
          onClick={handleSignOutClick}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Se Déconnecter
        </button>
      </div>
    </div>
  )
}