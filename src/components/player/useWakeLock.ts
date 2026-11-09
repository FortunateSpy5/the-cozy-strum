import { useState, useEffect, useRef, useCallback } from 'react';

export function useWakeLock(enabledByDefault = true) {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestLock = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }
    try {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        return;
      }
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      setIsActive(true);

      sentinel.addEventListener('release', () => {
        setIsActive(false);
        wakeLockRef.current = null;
      });
    } catch {
      setIsActive(false);
    }
  }, []);

  const releaseLock = useCallback(async () => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // ignore
      }
    }
    wakeLockRef.current = null;
    setIsActive(false);
  }, []);

  const toggleWakeLock = useCallback(async () => {
    if (isActive) {
      await releaseLock();
    } else {
      await requestLock();
    }
  }, [isActive, requestLock, releaseLock]);

  useEffect(() => {
    const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    setIsSupported(supported);

    if (supported && enabledByDefault) {
      void requestLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabledByDefault && !wakeLockRef.current) {
        void requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        void wakeLockRef.current.release();
      }
      wakeLockRef.current = null;
    };
  }, [enabledByDefault, requestLock]);

  return { isSupported, isActive, toggleWakeLock, requestLock, releaseLock };
}
