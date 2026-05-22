import { useCallback, useState } from "react";

export function useSubmitLock() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runWithLock = useCallback(async (task) => {
    if (isSubmitting) return null;
    setIsSubmitting(true);
    try {
      return await task();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  return { isSubmitting, runWithLock };
}
