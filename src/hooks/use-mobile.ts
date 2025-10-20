import * as React from "react"

/**
 * Mobile breakpoint constant (768px)
 * Based on common responsive design patterns where tablets and below are considered mobile
 */
const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect mobile screen size
 * @param breakpoint Optional custom breakpoint (defaults to 768px)
 * @returns boolean indicating if screen is mobile size
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT) {
  // Initialize with false for SSR compatibility, will update on client
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    try {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
      
      const onChange = () => {
        setIsMobile(window.innerWidth < breakpoint)
      }
      
      // Set initial value
      setIsMobile(window.innerWidth < breakpoint)
      
      // Add event listener
      mql.addEventListener("change", onChange)
      
      // Cleanup
      return () => mql.removeEventListener("change", onChange)
    } catch (error) {
      console.warn('useIsMobile: Failed to set up media query listener:', error)
      // Fallback to window width check
      setIsMobile(window.innerWidth < breakpoint)
    }
  }, [breakpoint])

  return isMobile
}
