import { useEffect, useRef, useCallback } from 'react';

export function useAutoScroller(isScrolling: boolean, scrollSpeed: number) {
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef(scrollSpeed);
  scrollSpeedRef.current = scrollSpeed;

  const scrollStep = useCallback((timestamp: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = timestamp;
    }
    const delta = Math.min(timestamp - lastTimeRef.current, 100);
    lastTimeRef.current = timestamp;

    if (!isUserScrollingRef.current) {
      // Base rate: scrollSpeed pixels per tick at 60fps
      const pixelShift = (scrollSpeedRef.current * 0.75 * delta) / 16.67;
      window.scrollBy({ top: pixelShift, behavior: 'instant' as ScrollBehavior });
    }

    animationFrameRef.current = requestAnimationFrame(scrollStep);
  }, []);

  useEffect(() => {
    if (isScrolling) {
      lastTimeRef.current = null;
      animationFrameRef.current = requestAnimationFrame(scrollStep);
    } else if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isScrolling, scrollStep]);

  useEffect(() => {
    if (!isScrolling) return;

    const handleWheel = () => {
      isUserScrollingRef.current = true;
      if (userScrollTimeoutRef.current !== null) {
        window.clearTimeout(userScrollTimeoutRef.current);
      }
      userScrollTimeoutRef.current = window.setTimeout(() => {
        isUserScrollingRef.current = false;
        userScrollTimeoutRef.current = null;
      }, 1500);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchmove', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleWheel);
      if (userScrollTimeoutRef.current !== null) {
        window.clearTimeout(userScrollTimeoutRef.current);
        userScrollTimeoutRef.current = null;
      }
      isUserScrollingRef.current = false;
    };
  }, [isScrolling]);
}
