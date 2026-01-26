import React from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = '',
  style = {}
}) => {
  const skeletonStyle: React.CSSProperties = {
    width,
    height,
    borderRadius,
    backgroundColor: '#E5E7EB',
    animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    ...style
  }

  return (
    <div className={`skeleton ${className}`} style={skeletonStyle}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
        `}
      </style>
    </div>
  )
}
