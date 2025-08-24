"use client";

import { useAudio } from '@/contexts/AudioContext';

interface MusicControlProps {
  isMobile?: boolean;
  className?: string;
}

export default function MusicControl({ isMobile = false, className = "" }: MusicControlProps) {
  const { isMusicPlaying, isAudioMuted, audioLoaded, isFirstLoad, toggleAudio } = useAudio();

  // Determine what to display based on state
  let displayState = 'unknown';
  if (isFirstLoad) {
    displayState = 'first-load';
  } else if (isAudioMuted) {
    displayState = 'muted';
  } else if (isMusicPlaying) {
    displayState = 'playing';
  } else {
    displayState = 'stopped';
  }

  return (
    <div className={`w-10 h-10 rounded-full border border-white/30 flex justify-center items-center cursor-pointer transition-all duration-300 hover:scale-110 hover:border-white/50 ${className}`}>
      <button
        onClick={toggleAudio}
        className="relative w-full h-full rounded-full flex justify-center items-center"
        title={isFirstLoad ? "Click anywhere to start music" : isAudioMuted ? "Unmute Music" : "Mute Music"}
        disabled={!audioLoaded}
      >
        {isFirstLoad ? (
          // Show flat line when waiting for first user interaction
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="w-5.5 h-4 md:w-5.5 md:h-4" viewBox="0 0 32 16">
            <polyline points="0 8 1 8 2 8 3 8 4 8 5 8 6 8 7 8 8 8 9 8 10 8 11 8 12 8 13 8 14 8 15 8 16 8 17 8 18 8 19 8 20 8 21 8 22 8 23 8 24 8 25 8 26 8 27 8 28 8 29 8 30 8 31 8" stroke="white" strokeWidth="1.5" fill="none"/>
          </svg>
        ) : isAudioMuted ? (
          // Show flat line when muted
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="w-5.5 h-4 md:w-5.5 md:h-4" viewBox="0 0 32 16">
            <polyline points="0 8 1 8 2 8 3 8 4 8 5 8 6 8 7 8 8 8 9 8 10 8 11 8 12 8 13 8 14 8 15 8 16 8 17 8 18 8 19 8 20 8 21 8 22 8 23 8 24 8 25 8 26 8 27 8 28 8 29 8 30 8 31 8" stroke="white" strokeWidth="1.5" fill="none"/>
          </svg>
        ) : (
          // Show animated wavy line when music is playing
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="w-5.5 h-4 md:w-5.5 md:h-4 animate-wave" viewBox="0 0 32 16">
            <circle cx="2" cy="9.09202" r="0.8" fill="white" className="wave-point-1"/>
            <circle cx="4" cy="8.52929" r="0.8" fill="white" className="wave-point-2"/>
            <circle cx="6" cy="8.00525" r="0.8" fill="white" className="wave-point-3"/>
            <circle cx="8" cy="7.88477" r="0.8" fill="white" className="wave-point-1"/>
            <circle cx="10" cy="7.14044" r="0.8" fill="white" className="wave-point-5"/>
            <circle cx="12" cy="7.42156" r="0.8" fill="white" className="wave-point-6"/>
            <circle cx="14" cy="10.2069" r="0.8" fill="white" className="wave-point-7"/>
            <circle cx="16" cy="12.3709" r="0.8" fill="white" className="wave-point-8"/>
            <circle cx="18" cy="10.0453" r="0.8" fill="white" className="wave-point-1"/>
            <circle cx="20" cy="5.36273" r="0.8" fill="white" className="wave-point-2"/>
            <circle cx="22" cy="3.89642" r="0.8" fill="white" className="wave-point-3"/>
            <circle cx="24" cy="6.42794" r="0.8" fill="white" className="wave-point-4"/>
            <circle cx="26" cy="8.68943" r="0.8" fill="white" className="wave-point-5"/>
            <circle cx="28" cy="8.57662" r="0.8" fill="white" className="wave-point-6"/>
            <circle cx="30" cy="8.02421" r="0.8" fill="white" className="wave-point-7"/>
          </svg>
        )}
      </button>
    </div>
  );
}
