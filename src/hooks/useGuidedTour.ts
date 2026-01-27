import { useState, useEffect, useCallback } from 'react';

export const useGuidedTour = (userId: string | undefined, routePath: string) => {
  const [isActive, setIsActive] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const storageKey = `tour_login_count_${userId}`;
    const completedToursKey = `tour_completed_${userId}`;
    
    const loginCount = parseInt(localStorage.getItem(storageKey) || '0', 10);
    const completedTours = JSON.parse(localStorage.getItem(completedToursKey) || '{}');

    // Check if within first 2 logins and tour not completed for this route
    const shouldShow = loginCount < 2 && !completedTours[routePath];
    
    setHasSeenTour(!shouldShow);
    
    if (shouldShow) {
      // Small delay to let the page render
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userId, routePath]);

  const completeTour = useCallback(() => {
    if (!userId) return;
    
    const completedToursKey = `tour_completed_${userId}`;
    const completedTours = JSON.parse(localStorage.getItem(completedToursKey) || '{}');
    completedTours[routePath] = true;
    localStorage.setItem(completedToursKey, JSON.stringify(completedTours));
    
    setIsActive(false);
    setHasSeenTour(true);
  }, [userId, routePath]);

  const startTour = useCallback(() => {
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  return {
    isActive,
    hasSeenTour,
    startTour,
    endTour,
  };
};

// Hook to track login count (call once on app load)
export const useTrackLogin = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    const storageKey = `tour_login_count_${userId}`;
    const sessionKey = `tour_session_${userId}`;
    
    // Only increment once per session
    if (sessionStorage.getItem(sessionKey)) return;
    
    const currentCount = parseInt(localStorage.getItem(storageKey) || '0', 10);
    localStorage.setItem(storageKey, String(currentCount + 1));
    sessionStorage.setItem(sessionKey, 'true');
  }, [userId]);
};
