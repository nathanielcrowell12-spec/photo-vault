import { ReactNode } from 'react'

interface ParallaxSectionProps {
  children: ReactNode
  imageSrc: string
  imageAlt: string
  overlayClassName?: string
  className?: string
}

export function ParallaxSection({
  children,
  imageSrc,
  imageAlt,
  overlayClassName = 'bg-black/75',
  className = '',
}: ParallaxSectionProps) {
  return (
    <div className={`parallax-section relative isolate overflow-hidden ${className}`}>
      <div
        className="parallax-bg absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat bg-fixed max-md:bg-scroll"
        style={{ backgroundImage: `url(${imageSrc})` }}
        role="img"
        aria-label={imageAlt}
      />
      <div className={`absolute inset-0 -z-10 ${overlayClassName}`} />
      {children}
    </div>
  )
}
