import { useState, useEffect, useCallback } from 'react';

export function useAutoScrollCountIn(
  isScrolling: boolean,
  setIsScrolling: (val: boolean | ((prev: boolean) => boolean)) => void
) {
  const [countInSeconds, setCountInSeconds] = useState<number | null>(null);

  const toggleScroll = useCallback(() => {
    if (isScrolling || countInSeconds !== null) {
      setIsScrolling(false);
      setCountInSeconds(null);
      return;
    }
    setCountInSeconds(3);
  }, [isScrolling, countInSeconds, setIsScrolling]);

  const cancelCountIn = useCallback(() => {
    setCountInSeconds(null);
  }, []);

  useEffect(() => {
    if (countInSeconds === null) return;
    if (countInSeconds <= 1) {
      const timer = setTimeout(() => {
        setCountInSeconds(null);
        setIsScrolling(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setCountInSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countInSeconds, setIsScrolling]);

  return {
    countInSeconds,
    toggleScroll,
    cancelCountIn,
  };
}
