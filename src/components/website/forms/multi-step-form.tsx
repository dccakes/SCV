import React, { type Dispatch, type SetStateAction } from 'react'

type MultistepRsvpFormProps = {
  children: React.ReactNode
  currentStep: number
  setCurrentStep: Dispatch<SetStateAction<number>>
}

export default function MultistepRsvpForm({
  children,
  currentStep,
  setCurrentStep,
}: MultistepRsvpFormProps) {
  const goNext = () => {
    setCurrentStep((prev) => prev + 1)
  }
  const goBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const currentStepForm = React.Children.toArray(children)[currentStep - 1] // -1 because currentStep is 1 indexed

  if (React.isValidElement<{ goNext: () => void; goBack: () => void }>(currentStepForm)) {
    return React.cloneElement(currentStepForm, { goNext, goBack })
  }

  return currentStepForm
}
