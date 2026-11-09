import { useEffect, useRef, useCallback } from 'react';

/**
 * Comfortable reading tempo:
 * At 1.0x, scrolls 14 pixels/sec (~3.5 seconds per line of tab + lyric).
 * At 0.5x, scrolls 7 pixels/sec (~7 seconds per line, relaxed practice pace).
 */
export const BASE_SCROLL_PIXELS_PER_SEC = 14;

export function useAutoScroller(
  isScrolling: boolean,
  scrollSpeed: number,
  onReachBottom?: () => void
) {
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef(scrollSpeed);
  scrollSpeedRef.current = scrollSpeed;
  const subPixelAccumulatorRef = useRef(0);
  const onReachBottomRef = useRef(onReachBottom);
  onReachBottomRef.current = onReachBottom;

  const scrollStep = useCallback((timestamp: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = timestamp;
    }
    const delta = Math.min(timestamp - lastTimeRef.current, 100);
    lastTimeRef.current = timestamp;

    if (!isUserScrollingRef.current) {
      const pixelsPerSecond = scrollSpeedRef.current * BASE_SCROLL_PIXELS_PER_SEC;
      const pixelShift = (pixelsPerSecond * delta) / 1000;
      subPixelAccumulatorRef.current += pixelShift;

      // Accumulate fractional pixels so low speeds (0.5x) never drop below 1px integer threshold
      if (subPixelAccumulatorRef.current >= 1) {
        const pixelsToScroll = Math.floor(subPixelAccumulatorRef.current);
        subPixelAccumulatorRef.current -= pixelsToScroll;
        window.scrollBy({ top: pixelsToScroll, behavior: 'instant' as ScrollBehavior });

        // Auto-pause if reached the end of document
        if (
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 4
        ) {
          onReachBottomRef.current?.();
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scrollStep);
  }, []);

  useEffect(() => {
    if (isScrolling) {
      lastTimeRef.current = null;
      subPixelAccumulatorRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(scrollStep);
    } else if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      subPixelAccumulatorRef.current = 0;
    }
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      subPixelAccumulatorRef.current = 0;
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
