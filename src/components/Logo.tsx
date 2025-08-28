import React from 'react'
import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12'
}

export default function Logo({ size = 'lg', className = '', onClick }: LogoProps) {
  return (
    <motion.div
      className={`relative ${sizeClasses[size]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Logo principal sans fond, juste l'image PNG */}
      <div className="w-full h-full flex items-center justify-center">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="w-full h-full object-contain"
        />
      </div>
    </motion.div>
  )
}
