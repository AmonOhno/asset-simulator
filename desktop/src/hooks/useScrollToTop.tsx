import { useCallback } from 'react';

export const useScrollToTop = (componentId: string) => {
  return useCallback(() => {
    const element = document.querySelector(`#${componentId} .card-body`);
    if (element) {
      element.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    }
  }, [componentId]);
};