import { useState, useCallback } from 'react';

/**
 * A custom hook for managing steps in a wizard or multi-step form.
 * @param maxStep The maximum number of steps
 * @param initialStep The starting step (default 1)
 */
export function useStep(maxStep: number, initialStep: number = 1) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const canGoToNextStep = currentStep < maxStep;
  const canGoToPrevStep = currentStep > 1;

  const setStep = useCallback((step: number) => {
    if (step >= 1 && step <= maxStep) {
      setCurrentStep(step);
    }
  }, [maxStep]);

  const goToNextStep = useCallback(() => {
    if (canGoToNextStep) setCurrentStep((step) => step + 1);
  }, [canGoToNextStep]);

  const goToPrevStep = useCallback(() => {
    if (canGoToPrevStep) setCurrentStep((step) => step - 1);
  }, [canGoToPrevStep]);

  const reset = useCallback(() => setCurrentStep(initialStep), [initialStep]);

  return [
    currentStep,
    {
      goToNextStep,
      goToPrevStep,
      canGoToNextStep,
      canGoToPrevStep,
      setStep,
      reset
    }
  ] as const;
}
