// Remplacer l'import pour avoir accès à toutes les icônes nécessaires
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Euro, Calendar, Clock, Star, MessageCircle, CheckCircle, XCircle, AlertTriangle, TrendingUp, Tag, Zap, Heart, Crown, Globe, Building, Camera, FileText, Users, Filter, RefreshCw, X, Info, User } from 'lucide-react'
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

  // Helper functions for date/time formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDuration = (duration: string) => {
    const [hours, minutes] = duration.split(':').map(Number);
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} h`;
    return `${hours} h ${minutes} min`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}j`;
  };

  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const loadApplications = async () => {
    setLoadingApplications(true);
    try {
      const { data, error } = await supabase
        .from('task_applications')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('Error loading applications:', err);
      alert('Erreur lors du chargement des candidatures.');
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [task.id]);

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
        <div className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="xl:col-span-2 space-y-6">
            {/* En-tête de la tâche */}
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
              </div>

              {/* Description */}
              {task.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 text-blue-600 mr-2" />
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {/* Informations clés */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Durée estimée</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-900">
                    {task.estimated_duration ? formatDuration(task.estimated_duration) : 'Non spécifiée'}
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Date limite</span>
                  </div>
                  <p className="text-lg font-semibold text-green-900">
                    {task.deadline ? formatDate(task.deadline) : 'Aucune limite'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Localisation */}
            {task.address && (
              <Card transition={{ duration: 0.5 }}>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Localisation</h3>
                    <p className="text-gray-700">{task.address}</p>
                    {task.city && (
                      <p className="text-sm text-gray-500 mt-1">{task.city}, {task.postal_code} {task.country}</p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <Card transition={{ duration: 0.6 }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                {task.status === 'open' && task.author !== user?.id && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChatOpen(task.id)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Postuler</span>
                  </motion.button>
                )}
                
                {task.status === 'assigned' && task.helper === user?.id && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChatOpen(task.id)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Chat</span>
                  </motion.button>
                )}

                {task.author === user?.id && task.status === 'open' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChatOpen(task.id)}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <X className="w-5 h-5" />
                    <span>Annuler</span>
                  </motion.button>
                )}
              </div>
            </Card>

            {/* Candidatures */}
            <Card transition={{ duration: 0.7 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 text-purple-600 mr-2" />
                  Candidatures ({applications.length})
                </h3>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadApplications}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune candidature pour le moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((application) => (
                    <div key={application.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {application.helper_profile?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{application.helper_profile?.name || 'Utilisateur'}</p>
                            <p className="text-sm text-gray-500">{formatTimeAgo(application.created_at)}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                      </div>
                      {application.message && (
                        <p className="text-gray-700 text-sm mb-3">{application.message}</p>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-yellow-600">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < (application.helper_profile?.rating || 0) ? 'fill-current' : ''}`} />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">
                            ({application.helper_profile?.rating_count || 0} évaluation(s))
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Profil de l'auteur */}
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
                <p className="text-sm text-gray-500 mb-3">{task.author_profile?.rating_count || 0} évaluation(s)</p>
                <div className="text-xs text-gray-400">
                  Membre depuis {task.author_profile?.created_at ? formatTimeAgo(task.author_profile.created_at) : 'récemment'}
                </div>
              </div>
            </Card>

            {/* Informations de la tâche */}
            <Card transition={{ duration: 0.5 }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Info className="w-5 h-5 text-blue-600 mr-2" />
                Informations
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Créée</span>
                  <span className="text-sm font-medium text-gray-900">{formatTimeAgo(task.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Priorité</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>
                {task.is_urgent && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tâche urgente</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                      🚨 Urgente
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Budget */}
            <Card transition={{ duration: 0.6 }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Euro className="w-5 h-5 text-green-600 mr-2" />
                Budget
              </h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {task.budget}€
                </div>
                <p className="text-sm text-gray-500">Budget fixé</p>
                {task.currency && (
                  <p className="text-xs text-gray-400 mt-1">Devise: {task.currency}</p>
                )}
              </div>
            </Card>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <Card transition={{ duration: 0.7 }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 text-purple-600 mr-2" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full border border-purple-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}