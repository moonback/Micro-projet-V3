import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Clock, 
  Euro, 
  Star, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  Tag, 
  Calendar,
  MessageCircle,
  ArrowLeft,
  Edit3,
  Trash2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { TaskWithProfiles, TaskApplication } from '../types/task'
import { convertDurationToInterval } from '../utils/durationUtils'

interface TaskApplicationViewProps {
  task: TaskWithProfiles
  onBack: () => void
  onChatOpen: (taskId: string) => void
}

export default function TaskApplicationView({ task, onBack, onChatOpen }: TaskApplicationViewProps) {
  const { user } = useAuth()
  const [hasApplied, setHasApplied] = useState(false)
  const [checkingApplication, setCheckingApplication] = useState(false)
  const [application, setApplication] = useState<TaskApplication | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [proposedBudget, setProposedBudget] = useState<number | undefined>(task.budget)
  const [proposedDuration, setProposedDuration] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Debug log
  useEffect(() => {
    console.log('TaskApplicationView mounted with task:', task)
    console.log('Current user:', user)
  }, [task, user])

  // Vérifier si l'utilisateur a déjà candidaté
  useEffect(() => {
    const checkApplication = async () => {
      if (!user || task.status !== 'open') return
      
      setCheckingApplication(true)
      try {
        const { data, error } = await supabase
          .from('task_applications')
          .select('*')
          .eq('task_id', task.id)
          .eq('helper_id', user.id)
          .single()

        if (!error && data) {
          setHasApplied(true)
          setApplication(data)
          setMessage(data.message || '')
          setProposedBudget(data.proposed_budget || task.budget)
          setProposedDuration(data.proposed_duration || '')
        }
      } catch (error) {
        setHasApplied(false)
      } finally {
        setCheckingApplication(false)
      }
    }

    checkApplication()
  }, [user, task.id, task.status, task.budget])

  const handleSubmitApplication = async () => {
    if (!user || !message.trim()) return

    setLoading(true)
    try {
      // Convertir la durée proposée en format PostgreSQL interval
      const convertedDuration = proposedDuration ? 
        convertDurationToInterval(proposedDuration) : null

      const { error } = await supabase
        .from('task_applications')
        .insert({
          task_id: task.id,
          helper_id: user.id,
          message: message.trim(),
          proposed_budget: proposedBudget,
          proposed_duration: convertedDuration,
          status: 'pending'
        })

      if (error) throw error

      setHasApplied(true)
      // Recharger l'application pour obtenir l'ID
      const { data } = await supabase
        .from('task_applications')
        .select('*')
        .eq('task_id', task.id)
        .eq('helper_id', user.id)
        .single()

      if (data) {
        setApplication(data)
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Erreur lors de l\'envoi de la candidature')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateApplication = async () => {
    if (!application || !message.trim()) return

    setLoading(true)
    try {
      // Convertir la durée proposée en format PostgreSQL interval
      const convertedDuration = proposedDuration ? 
        convertDurationToInterval(proposedDuration) : null

      const { error } = await supabase
        .from('task_applications')
        .update({
          message: message.trim(),
          proposed_budget: proposedBudget,
          proposed_duration: convertedDuration,
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id)

      if (error) throw error

      setIsEditing(false)
      setApplication(prev => prev ? { ...prev, message: message.trim(), proposed_budget: proposedBudget, proposed_duration: convertedDuration || undefined } : null)
    } catch (error) {
      console.error('Error updating application:', error)
      alert('Erreur lors de la mise à jour de la candidature')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawApplication = async () => {
    if (!application) return

    if (!confirm('Êtes-vous sûr de vouloir retirer votre candidature ?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('task_applications')
        .update({
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString()
        })
        .eq('id', application.id)

      if (error) throw error

      setHasApplied(false)
      setApplication(null)
      setMessage('')
      setProposedBudget(task.budget)
      setProposedDuration('')
    } catch (error) {
      console.error('Error withdrawing application:', error)
      alert('Erreur lors du retrait de la candidature')
    } finally {
      setLoading(false)
    }
  }

  const formatDistance = (location: any) => {
    if (!location || !location.coordinates) return 'Distance inconnue'
    return 'À proximité'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) return 'À l\'instant'
    if (diffInHours < 24) return `Il y a ${Math.floor(diffInHours)}h`
    if (diffInHours < 48) return 'Hier'
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Disponible'
      case 'pending_approval': return 'En attente d\'approbation'
      case 'in_progress': return 'En cours'
      case 'completed': return 'Terminée'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Élevée'
      case 'medium': return 'Moyenne'
      case 'low': return 'Faible'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec bouton retour */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Détails de la Tâche</h1>
            <p className="text-sm text-gray-600">Postuler à cette tâche</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Carte principale de la tâche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          {/* En-tête avec statut et priorité */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {getCategoryIcon(task.category)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Par {task.author_profile?.name || 'Utilisateur'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-700 leading-relaxed mb-6 text-lg">{task.description}</p>

          {/* Métadonnées */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <Euro className="w-5 h-5" />
              <span className="font-medium">€{task.budget}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>{formatDistance(task.location)}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>{formatTimeAgo(task.created_at)}</span>
            </div>
            
            {task.deadline && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>{new Date(task.deadline).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {task.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Section de candidature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Votre Candidature</h3>

          {checkingApplication ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mr-3" />
              <span>Vérification de votre candidature...</span>
            </div>
          ) : hasApplied ? (
            <div className="space-y-4">
              {/* Statut de la candidature */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Candidature Envoyée</span>
                </div>
                <p className="text-blue-600 text-sm mt-1">
                  Votre candidature a été envoyée et est en attente de réponse.
                </p>
              </div>

              {/* Détails de la candidature */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Détails de votre candidature :</h4>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message de motivation
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Expliquez pourquoi vous êtes le bon candidat pour cette tâche..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Budget proposé (€)
                        </label>
                        <input
                          type="number"
                          value={proposedBudget || ''}
                          onChange={(e) => setProposedBudget(e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={task.budget?.toString()}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Durée proposée
                        </label>
                        <input
                          type="text"
                          value={proposedDuration}
                          onChange={(e) => setProposedDuration(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ex: 2 heures, 1 jour..."
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleUpdateApplication}
                        disabled={loading || !message.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Mise à jour...' : 'Sauvegarder'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Message :</span>
                      <p className="text-gray-900 mt-1">{application?.message || 'Aucun message'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Budget proposé :</span>
                        <p className="text-gray-900 mt-1">
                          €{application?.proposed_budget || task.budget}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Durée proposée :</span>
                        <p className="text-gray-900 mt-1">
                          {application?.proposed_duration || 'Non spécifiée'}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={handleWithdrawApplication}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Retirer</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Remplissez le formulaire ci-dessous pour postuler à cette tâche.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message de motivation *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Expliquez pourquoi vous êtes le bon candidat pour cette tâche, vos compétences, votre expérience..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget proposé (€)
                  </label>
                  <input
                    type="number"
                    value={proposedBudget || ''}
                    onChange={(e) => setProposedBudget(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={task.budget?.toString()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Budget original : €{task.budget}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée proposée
                  </label>
                  <input
                    type="text"
                    value={proposedDuration}
                    onChange={(e) => setProposedDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ex: 2 heures, 1 jour..."
                  />
                </div>
              </div>

              <button
                onClick={handleSubmitApplication}
                disabled={loading || !message.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Envoyer ma candidature</span>
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Actions</h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onChatOpen(task.id)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Contacter le propriétaire</span>
            </button>
            
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
            >
              Retour à la liste
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
