// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-KC4B05X3JN', {
      page_path: url,
    });
  }
};

// Track user registration
export const trackRegistration = (method: 'email' | 'google' | 'github') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method,
    });
  }
};

// Track user login
export const trackLogin = (method: 'email' | 'google' | 'github') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'login', {
      method: method,
    });
  }
};

// Track tournament registration
export const trackTournamentRegistration = (tournamentName: string, teamSize: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'tournament_registration', {
      tournament_name: tournamentName,
      team_size: teamSize,
    });
  }
};

// Track club creation
export const trackClubCreation = (clubName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'club_creation', {
      club_name: clubName,
    });
  }
};

// Track music control usage
export const trackMusicControl = (action: 'play' | 'pause' | 'mute' | 'unmute') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'music_control', {
      action: action,
    });
  }
};

// Track navigation between tournament pages
export const trackTournamentNavigation = (from: string, to: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'tournament_navigation', {
      from_page: from,
      to_page: to,
    });
  }
};
