import { useCallback } from 'react';

export const useScrollToTop = (selector: string) => {
  return useCallback(() => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    }
  }, [selector]);
};