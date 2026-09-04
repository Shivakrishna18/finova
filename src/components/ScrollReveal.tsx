import React, { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number // in ms
  staggerIndex?: number // for staggered lists
  staggerDelay?: number // ms between items (default 50ms)
  className?: string
  style?: React.CSSProperties
  direction?: 'up' | 'down' | 'none'
  threshold?: number
}

export default function ScrollReveal({
  children,
  delay = 0,
  staggerIndex = 0,
  staggerDelay = 50,
  className = '',
  style = {},
  direction = 'up',
  threshold = 0.1,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element)
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  const totalDelay = delay + staggerIndex * staggerDelay

  const translateY = direction === 'up' ? (isVisible ? '0px' : '14px') : direction === 'down' ? (isVisible ? '0px' : '-14px') : '0px'
  const scale = isVisible ? '1' : '0.985'
  const opacity = isVisible ? 1 : 0

  return (
    <div
      ref={elementRef}
      className={`scroll-reveal-item ${isVisible ? 'revealed' : ''} ${className}`}
      style={{
        opacity,
        transform: `translate3d(0, ${translateY}, 0) scale(${scale})`,
        transition: `opacity 400ms cubic-bezier(0.16, 1, 0.3, 1) ${totalDelay}ms, transform 450ms cubic-bezier(0.16, 1, 0.3, 1) ${totalDelay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
