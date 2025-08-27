import React from 'react'
import { toast, ToastBar, Toaster } from 'react-hot-toast'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationToastProps {
  type: NotificationType
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

// Fonction utilitaire pour afficher des notifications
export const showNotification = (type: NotificationType, message: string, duration: number = 5000) => {
  const icon = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  }

  const style = {
    background: type === 'success' ? '#f0fdf4' : 
                type === 'error' ? '#fef2f2' : 
                type === 'warning' ? '#fffbeb' : '#eff6ff',
    color: type === 'success' ? '#166534' : 
           type === 'error' ? '#dc2626' : 
           type === 'warning' ? '#d97706' : '#2563eb',
    border: type === 'success' ? '1px solid #bbf7d0' : 
            type === 'error' ? '1px solid #fecaca' : 
            type === 'warning' ? '1px solid #fed7aa' : '1px solid #bfdbfe'
  }

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        style={style}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {icon[type]}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ),
    { duration }
  )
}

// Composant principal pour afficher les notifications
export default function NotificationToast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: '#fff',
          color: '#374151',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        success: {
          duration: 4000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          duration: 6000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {icon}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{message}</p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  )
}

// Composant de compatibilité pour l'ancien système
export function LegacyNotificationToast({
  type,
  message,
  isVisible,
  onClose,
  duration = 5000
}: NotificationToastProps) {
  React.useEffect(() => {
    if (isVisible) {
      showNotification(type, message, duration)
      onClose()
    }
  }, [isVisible, type, message, duration, onClose])

  return null
}
