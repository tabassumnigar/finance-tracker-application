import { useMemo } from 'react';

export function useViewport() {
  const width = typeof window === 'undefined' ? 1200 : window.innerWidth;
  const breakpoint = useMemo(() => {
    if (width < 600) return 'mobile';
    if (width < 900) return 'tablet';
    return 'desktop';
  }, [width]);
  return { width, breakpoint };
}
