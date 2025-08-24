"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface AudioContextType {
  isMusicPlaying: boolean;
  isAudioMuted: boolean;
  audioLoaded: boolean;
  isFirstLoad: boolean;
  cacheStatus: string;
  toggleAudio: () => void;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Global variables for audio management
let globalAudioInstance: HTMLAudioElement | null = null;
let isAudioInitialized = false;
let activeProviderCount = 0;
let globalAudioState = {
  isMusicPlaying: false,
  isAudioMuted: false,
  audioLoaded: false,
  isFirstLoad: true, // Ensure this starts as true
  cacheStatus: 'checking'
};

// Global flag to ensure audio initialization happens only once
let hasInitializedAudio = false;

// Global flag to track if audio was playing before navigation
let wasAudioPlayingBeforeNavigation = false;

// Store audio state in localStorage for true persistence
let audioStateFromStorage = {
  wasPlaying: false,
  wasMuted: false,
  volume: 0.5
};

// Initialize audio at module level, independent of React components
if (typeof window !== 'undefined') {
  // Check if audio already exists in localStorage
  try {
    const stored = localStorage.getItem('zelmu-audio-state');
    if (stored) {
      audioStateFromStorage = JSON.parse(stored);
    }
  } catch (error) {
    // Silent error handling
  }
  
  // Add a global test function for debugging
  (window as any).testAudio = () => {
    if (globalAudioInstance) {
      globalAudioInstance.play().then(() => {
        // Manually trigger state change event
        window.dispatchEvent(new CustomEvent('audioStateChanged', {
          detail: {
            isMusicPlaying: true,
            isAudioMuted: false,
            audioLoaded: true,
            isFirstLoad: false
          }
        }));
      }).catch((error) => {
        // Silent error handling
      });
    }
  };

  // Add a test function to check current audio state
  (window as any).checkAudioState = () => {
    return {
      globalAudioState,
      audioStateFromStorage,
      wasAudioPlayingBeforeNavigation,
      hasInitializedAudio
    };
  };

  // Add a function to manually trigger wavy animation state
  (window as any).triggerWavyAnimation = () => {
    if (globalAudioInstance) {
      globalAudioState.isMusicPlaying = true;
      globalAudioState.isFirstLoad = false;
      window.dispatchEvent(new CustomEvent('audioStateChanged', {
        detail: {
          isMusicPlaying: true,
          isAudioMuted: false,
          audioLoaded: true,
          isFirstLoad: false
        }
      }));
    }
  };

  // Add a function to manually test mute state
  (window as any).testMuteState = () => {
    if (globalAudioInstance) {
      return {
        actualMuted: globalAudioInstance.muted,
        actualPaused: globalAudioInstance.paused,
        globalState: globalAudioState
      };
    }
    return null;
  };

  // Add a function to check actual vs React state
  (window as any).checkStateSync = () => {
    if (globalAudioInstance) {
      // Silent state check
    }
  };

  // Add a function to test page refresh state restoration
  (window as any).testRefreshRestore = () => {
    if (globalAudioInstance) {
      // Silent refresh test
    }
  };

  // Add a function to manually force the correct state
  (window as any).forceCorrectState = () => {
    if (globalAudioInstance) {
      const actualMuted = globalAudioInstance.muted;
      const actualPaused = globalAudioInstance.paused;
      
      // Force update all states to match actual audio element
      globalAudioState.isAudioMuted = actualMuted;
      globalAudioState.isMusicPlaying = !actualPaused;
      globalAudioState.isFirstLoad = false; // We have state now
      
      // Dispatch event to notify all components
      window.dispatchEvent(new CustomEvent('audioStateChanged', {
        detail: {
          isMusicPlaying: !actualPaused,
          isAudioMuted: actualMuted,
          audioLoaded: true,
          isFirstLoad: false
        }
      }));
    }
  };

  // Add functions to debug localStorage
  (window as any).checkLocalStorage = () => {
    try {
      const stored = localStorage.getItem('zelmu-audio-state');
      return {
        rawStored: stored,
        parsed: stored ? JSON.parse(stored) : null
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  (window as any).clearLocalStorage = () => {
    localStorage.removeItem('zelmu-audio-state');
  };

  (window as any).setLocalStorage = (wasPlaying: boolean, wasMuted: boolean) => {
    const state = { wasPlaying, wasMuted, volume: 0.5 };
    localStorage.setItem('zelmu-audio-state', JSON.stringify(state));
  };

  // Add a function to manually test mute functionality
  (window as any).testMute = () => {
    if (globalAudioInstance) {
      globalAudioInstance.muted = true;
      
      // Update global state
      globalAudioState.isAudioMuted = true;
      globalAudioState.isMusicPlaying = false;
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('audioStateChanged', {
        detail: {
          isMusicPlaying: false,
          isAudioMuted: true,
          audioLoaded: true,
          isFirstLoad: false
        }
      }));
    }
  };

  // Add a test function to manually start audio
  (window as any).testStartAudio = () => {
    if (globalAudioInstance) {
      // Try to start audio
      globalAudioInstance.muted = false;
      globalAudioInstance.play().then(() => {
        // Update state
        globalAudioState.isMusicPlaying = true;
        globalAudioState.isFirstLoad = false;
        globalAudioState.isAudioMuted = false;
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('audioStateChanged', {
          detail: {
            isMusicPlaying: true,
            isAudioMuted: false,
            audioLoaded: true,
            isFirstLoad: false
          }
        }));
      }).catch((error) => {
        // Silent error handling
      });
    }
  };

  // Add a function to start audio from dashboard (View Tournament Details button)
  (window as any).startAudioFromDashboard = () => {
    if (globalAudioInstance) {
      // Ensure audio is not muted
      globalAudioInstance.muted = false;
      
      // Try to play the audio
      globalAudioInstance.play().then(() => {
        // Update all state references
        globalAudioState.isMusicPlaying = true;
        globalAudioState.isFirstLoad = false;
        globalAudioState.isAudioMuted = false;
        
        // Update localStorage
        audioStateFromStorage.wasPlaying = true;
        audioStateFromStorage.wasMuted = false;
        try {
          localStorage.setItem('zelmu-audio-state', JSON.stringify(audioStateFromStorage));
        } catch (error) {
          // Silent error handling
        }
        
        // Dispatch event to notify all components
        window.dispatchEvent(new CustomEvent('audioStateChanged', {
          detail: {
            isMusicPlaying: true,
            isAudioMuted: false,
            audioLoaded: true,
            isFirstLoad: false
          }
        }));
      }).catch((error) => {
        // Even if play fails, update the state to indicate user intent
        globalAudioState.isFirstLoad = false;
        globalAudioState.isAudioMuted = false;
        
        // Dispatch event with updated state
        window.dispatchEvent(new CustomEvent('audioStateChanged', {
          detail: {
            isMusicPlaying: false,
            isAudioMuted: false,
            audioLoaded: true,
            isFirstLoad: false
          }
        }));
      });
    }
  };

  // Add function to stop audio on logout
  (window as any).stopAudioOnLogout = () => {
    if (globalAudioInstance) {
      // Stop the audio
      globalAudioInstance.pause();
      globalAudioInstance.currentTime = 0; // Reset to beginning
      globalAudioInstance.muted = true;
      
      // Reset all global states
      globalAudioState.isMusicPlaying = false;
      globalAudioState.isAudioMuted = true;
      globalAudioState.isFirstLoad = true;
      globalAudioState.audioLoaded = false;
      
      // Reset localStorage state
      audioStateFromStorage.wasPlaying = false;
      audioStateFromStorage.wasMuted = true;
      audioStateFromStorage.volume = 0.5;
      
      // Clear localStorage
      try {
        localStorage.removeItem('zelmu-audio-state');
      } catch (error) {
        // Silent error handling
      }
      
      // Reset navigation tracking
      wasAudioPlayingBeforeNavigation = false;
      
      // Dispatch event to notify all components
      window.dispatchEvent(new CustomEvent('audioStateChanged', {
        detail: {
          isMusicPlaying: false,
          isAudioMuted: true,
          audioLoaded: false,
          isFirstLoad: true
        }
      }));
    }
  };

  // Add debug function to test logout audio stop
  (window as any).testLogoutAudioStop = () => {
    if (typeof window !== 'undefined' && (window as any).stopAudioOnLogout) {
      (window as any).stopAudioOnLogout();
    }
  };
  
  // Create audio instance at module level if it doesn't exist
  if (!globalAudioInstance) {
    globalAudioInstance = new Audio('/app/music/bgmi theme.mp3');
    globalAudioInstance.loop = true;
    globalAudioInstance.preload = 'auto';
    globalAudioInstance.volume = audioStateFromStorage.volume || 0.5;
    
    // Set up event listeners at module level
    globalAudioInstance.addEventListener('loadeddata', () => {
      globalAudioState.audioLoaded = true;
      globalAudioState.isAudioMuted = false;
      
      // Check if we have previous state from localStorage
      if (audioStateFromStorage.wasMuted) {
        globalAudioState.isAudioMuted = true;
        globalAudioState.isFirstLoad = false; // Not first load if we have previous state
        if (globalAudioInstance) {
          globalAudioInstance.muted = true;
        }
      } else if (audioStateFromStorage.wasPlaying) {
        globalAudioState.isFirstLoad = false; // Not first load if we have previous state
      } else {
        globalAudioState.isFirstLoad = true;
      }
      
      // Trigger a custom event to notify React components
      window.dispatchEvent(new CustomEvent('audioStateChanged', {
        detail: {
          isMusicPlaying: false,
          isAudioMuted: globalAudioState.isAudioMuted,
          audioLoaded: true,
          isFirstLoad: globalAudioState.isFirstLoad
        }
      }));
    });
    
    globalAudioInstance.addEventListener('error', () => {
      // Silent error handling
    });
    
    globalAudioInstance.addEventListener('loadstart', () => {
      // Silent event handling
    });
    
    globalAudioInstance.addEventListener('canplay', () => {
      // Silent event handling
    });
    
    globalAudioInstance.addEventListener('play', () => {
      globalAudioState.isMusicPlaying = true;
      globalAudioState.isFirstLoad = false; // Set to false when audio starts playing
      wasAudioPlayingBeforeNavigation = true;
      audioStateFromStorage.wasPlaying = true;
      
      // Save to localStorage
      try {
        localStorage.setItem('zelmu-audio-state', JSON.stringify(audioStateFromStorage));
      } catch (error) {
        // Silent error handling
      }
      
      // Trigger a custom event to notify React components
      window.dispatchEvent(new CustomEvent('audioStateChanged', {
        detail: {
          isMusicPlaying: true,
          isAudioMuted: false,
          audioLoaded: true,
          isFirstLoad: false
        }
      }));
    });
    
    globalAudioInstance.addEventListener('pause', () => {
      globalAudioState.isMusicPlaying = false;
      wasAudioPlayingBeforeNavigation = false;
      audioStateFromStorage.wasPlaying = false;
      
      // Check if audio was paused due to muting
      if (globalAudioInstance && globalAudioInstance.muted) {
        globalAudioState.isAudioMuted = true;
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('zelmu-audio-state', JSON.stringify(audioStateFromStorage));
      } catch (error) {
        // Silent error handling
      }
      
      // Trigger a custom event to notify React components
      window.dispatchEvent(new CustomEvent('audioStateChanged', {
        detail: {
          isMusicPlaying: false,
          isAudioMuted: globalAudioInstance ? globalAudioInstance.muted : false,
          audioLoaded: true,
          isFirstLoad: false
        }
      }));
    });
    
    // Auto-resume if it was playing before - but only after user interaction
    if (audioStateFromStorage.wasPlaying && !audioStateFromStorage.wasMuted) {
      // Will resume after user interaction
    }
    
    isAudioInitialized = true;
    hasInitializedAudio = true;
    
    // Audio instance created and event listeners added
  }
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  // Prevent multiple AudioProvider instances from being created
  const providerKey = useRef(Math.random().toString(36).substr(2, 9));
  
  activeProviderCount++;

  // Use refs for internal state that doesn't trigger re-renders
  const isMusicPlayingRef = useRef(false);
  const isAudioMutedRef = useRef(false);
  const audioLoadedRef = useRef(false);
  const isFirstLoadRef = useRef(true);
  const cacheStatusRef = useRef('checking');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State for UI updates only
  const [isMusicPlaying, setIsMusicPlaying] = useState(globalAudioState.isMusicPlaying);
  const [isAudioMuted, setIsAudioMuted] = useState(globalAudioState.isAudioMuted);
  const [audioLoaded, setAudioLoaded] = useState(globalAudioState.audioLoaded);
  const [isFirstLoad, setIsFirstLoad] = useState(globalAudioState.isFirstLoad);
  const [cacheStatus, setCacheStatus] = useState(globalAudioState.cacheStatus);

  // Track component lifecycle
  useEffect(() => {
    return () => {
      // Cleanup
    };
  }, []);

  // Initialize audio element - ensure only one instance ever
  useEffect(() => {
    if (typeof window === 'undefined') {
      return; // Skip on server
    }

    // Audio is already initialized at module level, just sync the state
    if (globalAudioInstance) {
      audioRef.current = globalAudioInstance;
      audioLoadedRef.current = globalAudioState.audioLoaded;
      isMusicPlayingRef.current = globalAudioState.isMusicPlaying;
      isAudioMutedRef.current = globalAudioState.isAudioMuted;
      isFirstLoadRef.current = globalAudioState.isFirstLoad;
      
      setAudioLoaded(globalAudioState.audioLoaded);
      setIsMusicPlaying(globalAudioState.isMusicPlaying);
      setIsAudioMuted(globalAudioState.isAudioMuted);
      setIsFirstLoad(globalAudioState.isFirstLoad);
      
      // Try to resume audio if it was playing before
      if (audioStateFromStorage.wasPlaying && !audioStateFromStorage.wasMuted) {
        // Try to play, but don't fail if blocked
        globalAudioInstance.play().catch(() => {
          // Set state to indicate audio is ready but waiting for user interaction
          setIsFirstLoad(true);
        });
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Listen for audio state changes from module level
  useEffect(() => {
    const handleAudioStateChange = (event: CustomEvent) => {
      setAudioLoaded(event.detail.audioLoaded);
      setIsMusicPlaying(event.detail.isMusicPlaying);
      setIsAudioMuted(event.detail.isAudioMuted);
      setIsFirstLoad(event.detail.isFirstLoad);
    };
    
    window.addEventListener('audioStateChanged', handleAudioStateChange as EventListener);
    
    return () => {
      window.removeEventListener('audioStateChanged', handleAudioStateChange as EventListener);
    };
  }, []);

  // Periodic state synchronization check
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (audioRef.current) {
        const actualMuted = audioRef.current.muted;
        const actualPaused = audioRef.current.paused;
        
        // Check if our state is out of sync with the actual audio element
        if (actualMuted !== isAudioMutedRef.current || actualPaused !== !isMusicPlayingRef.current) {
          // Update our state to match the actual audio element
          isAudioMutedRef.current = actualMuted;
          isMusicPlayingRef.current = !actualPaused;
          globalAudioState.isAudioMuted = actualMuted;
          globalAudioState.isMusicPlaying = !actualPaused;
          
          setIsAudioMuted(actualMuted);
          setIsMusicPlaying(!actualPaused);
          
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('audioStateChanged', {
            detail: {
              isMusicPlaying: !actualPaused,
              isAudioMuted: actualMuted,
              audioLoaded: true,
              isFirstLoad: false
            }
          }));
        }
      }
    }, 1000); // Check every second
    
    // Also add a more frequent check for the first few seconds after mount
    const initialSyncInterval = setInterval(() => {
      if (audioRef.current) {
        const actualMuted = audioRef.current.muted;
        const actualPaused = audioRef.current.paused;
        
        // Force correct state for first few seconds
        if (isAudioMutedRef.current !== actualMuted || isMusicPlayingRef.current !== !actualPaused) {
          // Update all states
          isAudioMutedRef.current = actualMuted;
          isMusicPlayingRef.current = !actualPaused;
          globalAudioState.isAudioMuted = actualMuted;
          globalAudioState.isMusicPlaying = !actualPaused;
          globalAudioState.isFirstLoad = false;
          
          setIsAudioMuted(actualMuted);
          setIsMusicPlaying(!actualPaused);
          setIsFirstLoad(false);
          
          // Dispatch event
          window.dispatchEvent(new CustomEvent('audioStateChanged', {
            detail: {
              isMusicPlaying: !actualPaused,
              isAudioMuted: actualMuted,
              audioLoaded: true,
              isFirstLoad: false
            }
          }));
        }
      }
    }, 200); // Check every 200ms for first few seconds
    
    // Stop the initial sync after 5 seconds
    setTimeout(() => {
      clearInterval(initialSyncInterval);
    }, 5000);
    
    return () => {
      clearInterval(syncInterval);
      clearInterval(initialSyncInterval);
    };
  }, []);

  const toggleAudio = useCallback(() => {
    if (audioRef.current) {
      // Get current state from the actual audio element
      const currentMuted = audioRef.current.muted;
      const currentPaused = audioRef.current.paused;
      
      // Toggle the muted state
      const newMutedState = !currentMuted;
      audioRef.current.muted = newMutedState;
      
      // Update all state references
      isAudioMutedRef.current = newMutedState;
      globalAudioState.isAudioMuted = newMutedState;
      setIsAudioMuted(newMutedState);
      
      if (newMutedState) {
        // Audio was muted
        setIsMusicPlaying(false);
        globalAudioState.isMusicPlaying = false;
        isMusicPlayingRef.current = false;
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('audioStateChanged', {
          detail: {
            isMusicPlaying: false,
            isAudioMuted: true,
            audioLoaded: true,
            isFirstLoad: false
          }
        }));
      } else {
        // Audio was unmuted
        audioRef.current.play().then(() => {
          isMusicPlayingRef.current = true;
          globalAudioState.isMusicPlaying = true;
          setIsMusicPlaying(true);
          
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('audioStateChanged', {
            detail: {
              isMusicPlaying: true,
              isAudioMuted: false,
              audioLoaded: true,
              isFirstLoad: false
            }
          }));
        }).catch((error) => {
          // Silent error handling
        });
      }
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  // The value provided to the context
  const contextValue = useMemo(() => ({
    isMusicPlaying,
    isAudioMuted,
    audioLoaded,
    isFirstLoad,
    cacheStatus,
    toggleAudio,
    setVolume
  }), [isMusicPlaying, isAudioMuted, audioLoaded, isFirstLoad, cacheStatus, toggleAudio, setVolume]);

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
