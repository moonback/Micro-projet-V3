import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MessageSquare, 
  DollarSign, 
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Star
} from 'lucide-react'
import { useTaskApplications } from '../hooks/useTaskApplications'
import { TaskApplicationWithProfiles, ApplicationFormData } from '../types/task'
import { useAuth } from '../hooks/useAuth'
import { useConfirmationModal } from './ConfirmationModal'
import { showNotification } from './NotificationToast'
import { convertDurationToInterval } from '../utils/durationUtils'
import DurationInput from './DurationInput'

interface TaskApplicationsProps {
  taskId: string
  taskTitle: string
  taskStatus: string
  isAuthor: boolean
  onStatusChange?: () => void
}

export default function TaskApplications({ 
  taskId, 
  taskTitle, 
  taskStatus, 
  isAuthor, 
  onStatusChange 
}: TaskApplicationsProps) {
  const { user } = useAuth()
  const { 
    applications, 
    loading, 
    error, 
    filters,
    createApplication,
    acceptApplication,
    rejectApplication,
    withdrawApplication,
    approveTaskStart,
    rejectTaskStart,
    updateFilters,
    resetFilters
  } = useTaskApplications(taskId)

  const { showModal, ModalComponent } = useConfirmationModal()
  
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<TaskApplicationWithProfiles | null>(null)
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    message: '',
    proposed_budget: undefined,
    proposed_duration: ''
  })

  // Vérifier si l'utilisateur a déjà candidaté
  const hasApplied = applications.some(app => 
    app.helper_id === user?.id && ['pending', 'accepted'].includes(app.status)
  )

  // Vérifier si l'utilisateur peut candidater
  const canApply = user && 
                  !isAuthor && 
                  taskStatus === 'open' && 
                  !hasApplied

  // Vérifier si l'utilisateur peut gérer les candidatures
  const canManageApplications = isAuthor && taskStatus === 'open'

  // Vérifier si l'utilisateur peut valider le démarrage
  const canApproveStart = isAuthor && taskStatus === 'pending_approval'

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.message.trim()) {
      showNotification('error', 'Veuillez saisir un message de motivation')
      return
    }

    // Convertir la durée proposée en format PostgreSQL interval
    const convertedDuration = formData.proposed_duration ? 
      convertDurationToInterval(formData.proposed_duration) : null

    const success = await createApplication(taskId, {
      ...formData,
      proposed_duration: convertedDuration
    })
    
    if (success) {
      showNotification('success', 'Candidature envoyée avec succès !')
      setShowApplicationForm(false)
      setFormData({ message: '', proposed_budget: undefined, proposed_duration: '' })
      onStatusChange?.()
    }
  }

  const handleAcceptApplication = (application: TaskApplicationWithProfiles) => {
    showModal({
      title: 'Accepter la candidature',
      message: `Êtes-vous sûr de vouloir accepter la candidature de ${application.helper_name || 'cet aide'} ?`,
      type: 'warning',
      onConfirm: async () => {
        const success = await acceptApplication(application.id)
        if (success) {
          showNotification('success', 'Candidature acceptée !')
          onStatusChange?.()
        }
      }
    })
  }

  const handleRejectApplication = (application: TaskApplicationWithProfiles) => {
    showModal({
      title: 'Rejeter la candidature',
      message: `Êtes-vous sûr de vouloir rejeter la candidature de ${application.helper_name || 'cet aide'} ?`,
      type: 'warning',
      onConfirm: async () => {
        const success = await rejectApplication(application.id)
        if (success) {
          showNotification('success', 'Candidature rejetée')
        }
      }
    })
  }

  const handleWithdrawApplication = (application: TaskApplicationWithProfiles) => {
    showModal({
      title: 'Retirer la candidature',
      message: 'Êtes-vous sûr de vouloir retirer votre candidature ?',
      type: 'warning',
      onConfirm: async () => {
        const success = await withdrawApplication(application.id)
        if (success) {
          showNotification('success', 'Candidature retirée')
          onStatusChange?.()
        }
      }
    })
  }

  const handleApproveStart = () => {
    showModal({
      title: 'Valider le démarrage',
      message: 'Êtes-vous sûr de vouloir valider le démarrage de cette tâche ?',
      type: 'success',
      onConfirm: async () => {
        const success = await approveTaskStart(taskId)
        if (success) {
          showNotification('success', 'Tâche démarrée avec succès !')
          onStatusChange?.()
        }
      }
    })
  }

  const handleRejectStart = () => {
    showModal({
      title: 'Rejeter le démarrage',
      message: 'Êtes-vous sûr de vouloir rejeter le démarrage et remettre la tâche en statut ouvert ?',
      type: 'warning',
      onConfirm: async () => {
        const success = await rejectTaskStart(taskId)
        if (success) {
          showNotification('success', 'Tâche remise en statut ouvert')
          onStatusChange?.()
        }
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'accepted': return 'Acceptée'
      case 'rejected': return 'Rejetée'
      case 'withdrawn': return 'Retirée'
      default: return status
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur : {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Candidatures ({applications.length})
          </h3>
          <p className="text-sm text-gray-600">
            {taskTitle}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Bouton candidater */}
          {canApply && (
            <button
              onClick={() => setShowApplicationForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Candidater
            </button>
          )}

          {/* Boutons de validation pour l'auteur */}
          {canApproveStart && (
            <>
              <button
                onClick={handleApproveStart}
                className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Valider le démarrage
              </button>
              <button
                onClick={handleRejectStart}
                className="btn-secondary bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Rejeter
              </button>
            </>
          )}

          {/* Boutons utilitaires */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filtres */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilters({ status: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="accepted">Acceptées</option>
                  <option value="rejected">Rejetées</option>
                  <option value="withdrawn">Retirées</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilters({ dateTo: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="btn-secondary w-full"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulaire de candidature */}
      <AnimatePresence>
        {showApplicationForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6"
          >
            <h4 className="text-lg font-semibold text-blue-900 mb-4">
              Postuler pour cette tâche
            </h4>
            
            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message de motivation *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Expliquez pourquoi vous êtes la personne idéale pour cette tâche..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget proposé (optionnel)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.proposed_budget || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      proposed_budget: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Budget en EUR"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée proposée (optionnel)
                  </label>
                  <DurationInput
                    value={formData.proposed_duration}
                    onChange={(value) => setFormData(prev => ({ ...prev, proposed_duration: value }))}
                    placeholder="ex: 2 heures, 1 jour..."
                    showSuggestions={true}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? 'Envoi...' : 'Envoyer la candidature'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des candidatures */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Chargement des candidatures...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune candidature pour le moment</p>
            {canApply && (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="btn-primary mt-4"
              >
                Être le premier à candidater
              </button>
            )}
          </div>
        ) : (
          applications.map((application) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                {/* Informations de l'aide */}
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {application.helper_avatar ? (
                        <img 
                          src={application.helper_avatar} 
                          alt={application.helper_name || 'Aide'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {application.helper_name || 'Aide anonyme'}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {application.helper_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{application.helper_rating.toFixed(1)}</span>
                            <span>({application.helper_rating_count})</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(application.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      {/* Message de motivation */}
                      {application.message && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-700 text-sm">{application.message}</p>
                          </div>
                        </div>
                      )}

                      {/* Propositions */}
                      <div className="flex flex-wrap gap-3">
                        {application.proposed_budget && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>{application.proposed_budget}€</span>
                          </div>
                        )}
                        {application.proposed_duration && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{application.proposed_duration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 lg:items-end">
                  {isAuthor && application.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptApplication(application)}
                        className="btn-primary bg-green-600 hover:bg-green-700 text-sm px-3 py-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accepter
                      </button>
                      <button
                        onClick={() => handleRejectApplication(application)}
                        className="btn-secondary bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeter
                      </button>
                    </div>
                  )}

                  {application.helper_id === user?.id && application.status === 'pending' && (
                    <button
                      onClick={() => handleWithdrawApplication(application)}
                      className="btn-secondary text-sm px-3 py-2"
                    >
                      Retirer
                    </button>
                  )}

                  {application.status === 'accepted' && (
                    <div className="text-green-600 text-sm font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Candidature acceptée
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal de confirmation */}
      <ModalComponent />
    </div>
  )
}
