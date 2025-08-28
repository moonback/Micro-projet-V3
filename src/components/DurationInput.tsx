import React, { useState, useEffect } from 'react'
import { Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { convertDurationToInterval, isValidDurationFormat, getCommonDurationSuggestions } from '../utils/durationUtils'

interface DurationInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (isValid: boolean) => void
  placeholder?: string
  className?: string
  showSuggestions?: boolean
}

export default function DurationInput({
  value,
  onChange,
  onValidationChange,
  placeholder = "ex: 2 heures, 1 jour, 30 minutes...",
  className = "",
  showSuggestions = true
}: DurationInputProps) {
  const [isValid, setIsValid] = useState<boolean>(true)
  const [showSuggestionsList, setShowSuggestionsList] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  
  const suggestions = getCommonDurationSuggestions()

  useEffect(() => {
    const valid = value.trim() === '' || isValidDurationFormat(value)
    setIsValid(valid)
    
    if (onValidationChange) {
      onValidationChange(valid)
    }
    
    if (value.trim() && !valid) {
      setErrorMessage('Format non reconnu. Exemples: "2 heures", "1 jour", "30 minutes"')
    } else {
      setErrorMessage('')
    }
  }, [value, onValidationChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestionsList(false)
  }

  const handleFocus = () => {
    if (showSuggestions) {
      setShowSuggestionsList(true)
    }
  }

  const handleBlur = () => {
    // Délai pour permettre le clic sur les suggestions
    setTimeout(() => setShowSuggestionsList(false), 200)
  }

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-10 py-3 bg-white/60 backdrop-blur-sm border rounded-xl 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base 
            transition-all shadow-sm hover:shadow-md
            ${isValid 
              ? 'border-gray-200 focus:border-blue-500' 
              : 'border-red-300 focus:border-red-500'
            }
            ${className}
          `}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {value.trim() && (
            isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )
          )}
        </div>
      </div>
      
      {/* Message d'erreur */}
      {errorMessage && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errorMessage}
        </p>
      )}
      
      {/* Suggestions */}
      {showSuggestions && showSuggestionsList && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      {/* Aperçu de conversion */}
      {value.trim() && isValid && (
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <span>Format PostgreSQL: </span>
          <code className="ml-1 px-2 py-1 bg-gray-100 rounded text-blue-600">
            {convertDurationToInterval(value)}
          </code>
        </div>
      )}
    </div>
  )
}
