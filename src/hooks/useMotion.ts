import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

export function useScrollReveal(refreshKey: string) {
  const reduced = useReducedMotion()
  useEffect(() => {
    if (reduced) {
      document.documentElement.classList.remove('motion-ready')
      return
    }
    document.documentElement.classList.add('motion-ready')
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      }
    }, { threshold: .08, rootMargin: '0px 0px -35px 0px' })
    document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((element) => observer.observe(element))
    const showFocused = (event: FocusEvent) => {
      let element = event.target as HTMLElement | null
      while (element) {
        if (element.hasAttribute('data-reveal')) element.classList.add('is-revealed')
        element = element.parentElement
      }
    }
    document.addEventListener('focusin', showFocused)
    return () => {
      observer.disconnect()
      document.removeEventListener('focusin', showFocused)
    }
  }, [reduced, refreshKey])
}

export function usePageProgress() {
  useEffect(() => {
    let frame = 0
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight
      document.documentElement.style.setProperty('--page-progress', String(height > 0 ? window.scrollY / height : 0))
      document.querySelector('.site-header')?.classList.toggle('is-scrolled', window.scrollY > 40)
      frame = 0
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])
}
