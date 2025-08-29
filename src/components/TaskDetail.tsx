// Remplacer l'import pour avoir accès à toutes les icônes nécessaires
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Euro, Calendar, Clock, Star, MessageCircle, CheckCircle, XCircle, AlertTriangle, TrendingUp, Tag, Zap, Heart, Crown, Globe, Building, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { TaskWithProfiles } from '../types/task'
import Header from './Header'
import TaskApplications from './TaskApplications'

// Fonction pour récupérer l'adresse (pas de changement nécessaire ici)
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`
    )
    if (!response.ok) throw new Error('Erreur lors de la récupération de l\'adresse')
    const data = await response.json()
    if (data.display_name) {
      const addressParts = data.display_name.split(', ')
      return addressParts.slice(0, 3).join(', ')
    }
    return 'Adresse non trouvée'
  } catch {
    return 'Erreur de géocodification'
  }
}

interface TaskDetailProps {
  task: TaskWithProfiles
  onBack: () => void
  onChatOpen: (taskId: string) => void
}

export default function TaskDetail({ task, onBack, onChatOpen }: TaskDetailProps) {
  const { user } = useAuth()
  const [actionLoading, setActionLoading] = useState(false)
  const [resolvedAddress, setResolvedAddress] = useState<string>('')
  const [hasApplied, setHasApplied] = useState(false)
  const [checkingApplication, setCheckingApplication] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 1024)
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    const checkApplication = async () => {
      if (!user || task.status !== 'open') return
      setCheckingApplication(true)
      try {
        const { data } = await supabase
          .from('task_applications')
          .select('id')
          .eq('task_id', task.id)
          .eq('helper_id', user.id)
          .single()
        if (data) setHasApplied(true)
      } catch {
        setHasApplied(false)
      } finally {
        setCheckingApplication(false)
      }
    }
    checkApplication()
  }, [user, task.id, task.status])

  useEffect(() => {
    const resolveAddress = async () => {
      if (task.address) return setResolvedAddress(task.address)
      if (task.location) {
        try {
          const coords = task.location as any
          if (coords.coordinates?.length >= 2) {
            const [lng, lat] = coords.coordinates
            const addr = await reverseGeocode(lat, lng)
            setResolvedAddress(addr)
          }
        } catch {
          setResolvedAddress('Adresse non disponible')
        }
      } else setResolvedAddress('Aucune localisation')
    }
    resolveAddress()
  }, [task.address, task.location])

  const isAuthor = user?.id === task.author
  const isHelper = user?.id === task.helper
  const canAccept = !isAuthor && !isHelper && task.status === 'open'
  const canComplete = (isAuthor || isHelper) && task.status === 'in_progress'
  const canCancel = (isAuthor || isHelper) && ['open', 'assigned', 'in_progress'].includes(task.status)

  // --- UI helpers ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouverte'
      case 'assigned': return 'Assignée'
      case 'in_progress': return 'En cours'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-700'
      case 'medium': return 'bg-blue-100 text-blue-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'urgent': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Faible'
      case 'medium': return 'Moyenne'
      case 'high': return 'Élevée'
      case 'urgent': return 'Urgente'
      default: return priority
    }
  }
  const getCategoryIcon = (category: string) => {
    const categoryIcons: Record<string, string> = {
      'Livraison': '🚚',
      'Nettoyage': '🧹',
      'Courses': '🛒',
      'Déménagement': '📦',
      'Montage': '🔧',
      'Garde d\'Animaux': '🐾',
      'Jardinage': '🌱',
      'Aide Informatique': '💻',
      'Cours Particuliers': '📚',
      'Autre': '✨'
    }
    return categoryIcons[category] || '🏷️'
  }
  
  // Custom Card Component
  const Card = ({ children, initial = { opacity: 0, y: 15 }, animate = { opacity: 1, y: 0 }, transition = { duration: 0.4 } }: any) => (
    <motion.div initial={initial} animate={animate} transition={transition} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      {children}
    </motion.div>
  )

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans">
      <Header
        title={task.title}
        subtitle={`Tâche ${task.status === 'open' ? 'disponible' : 'en cours'}`}
        showSearch={false}
        showFilters={false}
        showViewToggle={false}
        showRefresh={false}
        onBack={onBack}
        className="bg-white text-gray-900 shadow-sm border-b border-gray-200"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            <Card transition={{ duration: 0.4 }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {getCategoryIcon(task.category)}
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">€{task.budget}</div>
                  <div className="text-sm text-gray-500">Budget</div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">{task.description}</p>
              <hr className="my-6 border-t border-gray-200" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Durée estimée</div>
                    <div className="text-sm text-gray-600">{task.estimated_duration || 'Non spécifié'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Date limite</div>
                    <div className="text-sm text-gray-600">{task.deadline ? new Date(task.deadline).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Non spécifiée'}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card transition={{ duration: 0.5 }}>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center"><MapPin className="w-5 h-5 mr-2 text-blue-600" />Localisation</h3>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{resolvedAddress || 'Chargement...'}</div>
                  {task.city && <div className="text-sm text-gray-600">{task.city}, {task.country}</div>}
                </div>
              </div>
            </Card>

            <Card transition={{ duration: 0.6 }}>
              <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {checkingApplication ? (
                  <div className="flex-1 flex items-center justify-center py-4 px-6 text-gray-500 bg-gray-100 rounded-xl">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mr-3" />
                    <span>Vérification...</span>
                  </div>
                ) : hasApplied ? (
                  <div className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-3">
                    <CheckCircle className="w-5 h-5" />
                    <span>Candidature Envoyée</span>
                  </div>
                ) : canAccept ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] flex items-center justify-center space-x-3">
                    <CheckCircle className="w-5 h-5" />
                    <span>Postuler</span>
                  </motion.button>
                ) : null}

                {isHelper && task.status === 'assigned' && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] flex items-center justify-center space-x-3">
                    <TrendingUp className="w-5 h-5" />
                    <span>Commencer</span>
                  </motion.button>
                )}

                {canComplete && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-[0_0_15px_rgba(147,51,234,0.5)] flex items-center justify-center space-x-3">
                    <CheckCircle className="w-5 h-5" />
                    <span>Terminer</span>
                  </motion.button>
                )}

                {canCancel && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] flex items-center justify-center space-x-3">
                    <XCircle className="w-5 h-5" />
                    <span>Annuler</span>
                  </motion.button>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onChatOpen(task.id)} className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] flex items-center justify-center space-x-3">
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat</span>
                </motion.button>
              </div>
            </Card>

            <TaskApplications taskId={task.id} taskTitle={task.title} taskStatus={task.status} isAuthor={isAuthor} onStatusChange={() => { }} />
          </div>

          {/* Colonne latérale */}
          {!isMobile && (
            <div className="space-y-6">
              <Card transition={{ duration: 0.4 }}>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-blue-200">
                    {task.author_profile?.name?.charAt(0) || 'U'}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{task.author_profile?.name || 'Utilisateur'}</h4>
                  <div className="flex items-center justify-center space-x-1 text-yellow-600 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < (task.author_profile?.rating || 0) ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{task.author_profile?.rating_count || 0} évaluation(s)</p>
                </div>
              </Card>

              <Card transition={{ duration: 0.5 }}>
                <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Créée le</span><span className="font-medium text-gray-900">{new Date(task.created_at).toLocaleDateString('fr-FR')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Statut</span><span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(task.status)}`}>{getStatusLabel(task.status)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Priorité</span><span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)}`}>{getPriorityLabel(task.priority)}</span></div>
                  {task.is_urgent && (
                    <div className="flex items-center justify-center p-2 bg-red-50 rounded-lg border border-red-200 text-red-700 font-medium text-xs">
                      <AlertTriangle className="w-4 h-4 mr-1" /> Tâche urgente
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}