"use client";

import { useState, useRef } from "react";

export default function VideoSplash({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);

  function handleCanPlay() {
    videoRef.current?.play().catch(() => {
      onComplete();
    });
  }

  function handleEnded() {
    setFading(true);
    setTimeout(onComplete, 600);
  }

  function handleSkip() {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    setFading(true);
    setTimeout(onComplete, 300);
  }

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        src="/trailer.mp4"
        muted
        playsInline
        preload="auto"
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={() => onComplete()}
        className="w-full h-full object-cover"
      />
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-6 text-white/50 text-xs px-3 py-1.5 rounded-full border border-white/20 hover:text-white hover:border-white/40 transition-colors active:scale-95"
      >
        Skip
      </button>
    </div>
  );
}
