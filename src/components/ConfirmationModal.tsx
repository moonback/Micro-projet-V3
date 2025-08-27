import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

export type ModalType = 'success' | 'error' | 'warning' | 'info'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  loading = false
}: ConfirmationModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />
      case 'error':
        return <XCircle className="w-8 h-8 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />
      case 'info':
        return <Info className="w-8 h-8 text-blue-600" />
      default:
        return <Info className="w-8 h-8 text-blue-600" />
    }
  }

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
      case 'error':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  const handleConfirm = () => {
    if (!loading) {
      onConfirm()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 500 }}
              className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all w-full max-w-md"
            >
              {/* Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getIcon()}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {title}
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <p className="text-gray-600 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 ${getButtonColor()}`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Chargement...</span>
                    </div>
                  ) : (
                    confirmText
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Hook personnalisé pour utiliser la modale
export function useConfirmationModal() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as ModalType,
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    onConfirm: () => {},
    loading: false
  })

  const showModal = (config: {
    title: string
    message: string
    type?: ModalType
    confirmText?: string
    cancelText?: string
    onConfirm: () => void | Promise<void>
  }) => {
    setModalState({
      isOpen: true,
      title: config.title,
      message: config.message,
      type: config.type || 'info',
      confirmText: config.confirmText || 'Confirmer',
      cancelText: config.cancelText || 'Annuler',
      onConfirm: config.onConfirm,
      loading: false
    })
  }

  const hideModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const setLoading = (loading: boolean) => {
    setModalState(prev => ({ ...prev, loading }))
  }

  const ModalComponent = () => (
    <ConfirmationModal
      {...modalState}
      onClose={hideModal}
      onConfirm={async () => {
        setLoading(true)
        try {
          await modalState.onConfirm()
          hideModal()
        } catch (error) {
          console.error('Error in confirmation modal:', error)
        } finally {
          setLoading(false)
        }
      }}
    />
  )

  return {
    showModal,
    hideModal,
    setLoading,
    ModalComponent
  }
}
