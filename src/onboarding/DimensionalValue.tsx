import React from 'react'

interface DimensionalValueProps {
  value: string
  prefix?: string
  suffix?: string
  accentColor?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  sublabel?: string
  className?: string
}

export default function DimensionalValue({
  value,
  prefix = '',
  suffix = '',
  accentColor = '#D72638',
  size = 'lg',
  sublabel,
  className = '',
}: DimensionalValueProps) {
  const sizeStyles = {
    sm: { fontSize: '18px', tracking: '0.04em', lineHeight: '1.2' },
    md: { fontSize: '24px', tracking: '0.03em', lineHeight: '1.1' },
    lg: { fontSize: '32px', tracking: '0.02em', lineHeight: '1.05' },
    xl: { fontSize: '42px', tracking: '0.01em', lineHeight: '1' },
  }[size]

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <div
        className="relative font-mono font-bold select-none"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: sizeStyles.fontSize,
          letterSpacing: sizeStyles.tracking,
          lineHeight: sizeStyles.lineHeight,
          perspective: '600px',
        }}
      >
        {/* Subtle shadow depth layer */}
        <span
          aria-hidden="true"
          className="absolute -bottom-[2px] left-[2px] opacity-25 filter blur-[2px] select-none pointer-events-none"
          style={{
            color: '#000000',
            transform: 'translateZ(-4px)',
          }}
        >
          {prefix}{value}{suffix}
        </span>

        {/* Mid depth rim */}
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 opacity-40 select-none pointer-events-none"
          style={{
            color: accentColor,
            transform: 'translate3d(0.5px, 0.5px, -1px)',
            filter: 'contrast(120%)',
          }}
        >
          {prefix}{value}{suffix}
        </span>

        {/* Foreground dimensional text */}
        <span
          className="relative inline-block"
          style={{
            background: `linear-gradient(180deg, #ffffff 10%, #e2e8f0 60%, ${accentColor} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 2px 14px ${accentColor}33`,
          }}
        >
          {prefix}{value}{suffix}
        </span>
      </div>

      {sublabel && (
        <span
          className="text-[11px] font-mono tracking-wider mt-1 uppercase"
          style={{ color: '#94a3b8' }}
        >
          {sublabel}
        </span>
      )}
    </div>
  )
}
