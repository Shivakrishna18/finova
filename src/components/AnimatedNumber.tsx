import React, { useEffect, useState, useRef } from 'react'
import { formatINR } from '../data/demoFinancialState'

interface AnimatedNumberProps {
  value: number
  format?: 'currency' | 'number' | 'percent'
  duration?: number
  className?: string
  style?: React.CSSProperties
  prefix?: string
  suffix?: string
}

export default function AnimatedNumber({
  value,
  format = 'currency',
  duration = 450,
  className = '',
  style = {},
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setDisplayValue(value)
      prevValueRef.current = value
      return
    }

    const startValue = prevValueRef.current
    const endValue = value
    if (startValue === endValue) return

    const startTime = performance.now()

    const updateNumber = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic: 1 - pow(1 - progress, 3)
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (endValue - startValue) * ease

      setDisplayValue(current)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateNumber)
      } else {
        setDisplayValue(endValue)
        prevValueRef.current = endValue
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateNumber)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [value, duration])

  let formattedText = ''
  if (format === 'currency') {
    formattedText = formatINR(Math.round(displayValue))
  } else if (format === 'percent') {
    formattedText = `${Math.round(displayValue)}%`
  } else {
    formattedText = Math.round(displayValue).toLocaleString('en-IN')
  }

  return (
    <span
      className={`font-mono transition-colors ${className}`}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        ...style,
      }}
    >
      {prefix}
      {formattedText}
      {suffix}
    </span>
  )
}
