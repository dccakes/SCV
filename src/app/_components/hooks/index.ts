import { useEffect, useRef, useState } from 'react'
import { type ReactElement } from 'react'

const useDisablePageScroll = () => {
  useEffect(() => {
    document.body.classList.add('overflow-hidden')
    return () => document.body.classList.remove('overflow-hidden')
  }, [])
}

const useOuterClick = (callback: () => void) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [callback])

  return ref
}

const useMultistepForm = (steps: ReactElement[]) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  function next() {
    setCurrentStepIndex((i) => {
      if (i >= steps.length - 1) return i
      return i + 1
    })
  }

  function back() {
    setCurrentStepIndex((i) => {
      if (i <= 0) return i
      return i - 1
    })
  }

  function goTo(index: number) {
    setCurrentStepIndex(index)
  }

  return {
    currentStepIndex,
    formStep: steps[currentStepIndex],
    formSteps: steps,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1,
    goTo,
    next,
    back,
  }
}

const useConfirmReloadPage = (shouldPreventUnload: boolean) => {
  useEffect(() => {
    const preventUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Changes you made may not be saved.'
    }

    if (typeof window !== 'undefined' && shouldPreventUnload) {
      window.addEventListener('beforeunload', preventUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', preventUnload)
    }
  }, [shouldPreventUnload])
}

const useScrollToTop = () => {
  useEffect(() => {
    try {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      })
    } catch (error) {
      // fallback for older browsers
      window.scrollTo(0, 0)
    }
  }, [])
}

export {
  useConfirmReloadPage,
  useDisablePageScroll,
  useMultistepForm,
  useOuterClick,
  useScrollToTop,
}
