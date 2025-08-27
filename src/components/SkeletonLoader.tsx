import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function Skeleton({ 
  className = '', 
  width, 
  height, 
  rounded = 'md' 
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  }

  return (
    <div
      className={`bg-gray-200 animate-pulse ${roundedClasses[rounded]} ${className}`}
      style={{
        width: width,
        height: height
      }}
    />
  )
}

// Composants de skeleton prédéfinis
export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-16 h-8 rounded-xl" />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <Skeleton className="w-20 h-6 rounded-full" />
        <Skeleton className="w-24 h-8 rounded-xl" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 text-center">
        <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Info sections */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            {[...Array(2)].map((_, j) => (
              <div key={j} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-20 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`max-w-xs px-4 py-2 rounded-lg ${
            i % 2 === 0 ? 'bg-gray-100' : 'bg-blue-600'
          }`}>
            <Skeleton className={`h-4 w-32 ${i % 2 === 0 ? 'bg-gray-200' : 'bg-blue-500'}`} />
            <Skeleton className={`h-3 w-16 mt-1 ${i % 2 === 0 ? 'bg-gray-200' : 'bg-blue-500'}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function FilterSkeleton() {
  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-10 rounded-xl" />
        <Skeleton className="w-16 h-8" />
      </div>
      
      <div className="space-y-4 p-4 bg-gray-50 rounded-2xl">
        <div>
          <Skeleton className="h-4 w-20 mb-3" />
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
        
        <div>
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
        
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function NavigationSkeleton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
      <div className="flex justify-around items-center">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-1">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="w-12 h-3 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Hook pour gérer l'état de loading
export function useSkeletonLoading(isLoading: boolean, Component: React.ComponentType<any>, SkeletonComponent: React.ComponentType, props?: any) {
  if (isLoading) {
    return <SkeletonComponent {...props} />
  }
  return <Component {...props} />
}
