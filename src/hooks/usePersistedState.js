import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that persists state to sessionStorage
 * State survives tab switches, app switches, and soft refreshes
 * @param {string} key - Storage key
 * @param {any} initialValue - Default value if nothing in storage
 * @param {boolean} useLocalStorage - Use localStorage instead of sessionStorage for persistence across browser sessions
 */
export function usePersistedState(key, initialValue, useLocalStorage = false) {
  const storage = useLocalStorage ? localStorage : sessionStorage;
  const isInitialized = useRef(false);

  // Initialize state from storage or default value
  const [state, setState] = useState(() => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading ${key} from storage:`, error);
      return initialValue;
    }
  });

  // Persist to storage whenever state changes (but not on first mount)
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    try {
      storage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error saving ${key} to storage:`, error);
    }
  }, [key, state, storage]);

  return [state, setState];
}

/**
 * Hook to track and restore scroll position
 * @param {string} key - Unique key for this scroll position
 */
export function useScrollRestoration(key) {
  const scrollKey = `scroll_${key}`;

  useEffect(() => {
    // Restore scroll position on mount
    const savedPosition = sessionStorage.getItem(scrollKey);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, position);
      });
    }

    // Save scroll position periodically
    const handleScroll = () => {
      sessionStorage.setItem(scrollKey, window.scrollY.toString());
    };

    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      // Save one last time on unmount
      handleScroll();
    };
  }, [scrollKey]);
}

/**
 * Hook to prevent unnecessary data fetching when tab regains visibility
 * Only fetches if data is stale (older than specified time)
 * @param {Function} fetchFunction - Function to call for fetching data
 * @param {number} staleTime - Time in ms after which data is considered stale (default: 5 minutes)
 */
export function useVisibilityAwareFetch(fetchFunction, staleTime = 5 * 60 * 1000) {
  const lastFetchTime = useRef(null);
  const hasFetchedOnce = useRef(false);

  const shouldFetch = () => {
    if (!hasFetchedOnce.current) return true;
    if (!lastFetchTime.current) return true;
    const timeSinceLastFetch = Date.now() - lastFetchTime.current;
    return timeSinceLastFetch > staleTime;
  };

  const fetch = async (...args) => {
    if (shouldFetch()) {
      await fetchFunction(...args);
      lastFetchTime.current = Date.now();
      hasFetchedOnce.current = true;
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldFetch()) {
        fetchFunction();
        lastFetchTime.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchFunction, staleTime]);

  return fetch;
}
