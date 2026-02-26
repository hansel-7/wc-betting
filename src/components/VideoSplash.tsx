"use client";

import { useState, useRef, useEffect } from "react";

export default function VideoSplash() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [done, setDone] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("vinacado_splash");
    if (!seen) {
      setDone(false);
    }
  }, []);

  useEffect(() => {
    if (done) return;

    const video = videoRef.current;
    if (!video) return;

    function tryPlay() {
      video!.play().catch(() => finish());
    }

    if (video.readyState >= 3) {
      tryPlay();
    } else {
      video.addEventListener("canplay", tryPlay, { once: true });
    }

    return () => {
      video.removeEventListener("canplay", tryPlay);
    };
  }, [done]);

  function finish() {
    sessionStorage.setItem("vinacado_splash", "1");
    setFading(true);
    setTimeout(() => setDone(true), 500);
  }

  if (done) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        className="w-full h-full object-cover"
      >
        <source src="/trailer.mp4" type="video/mp4" />
      </video>
      <button
        onClick={finish}
        className="absolute bottom-8 right-6 text-white/50 text-xs px-3 py-1.5 rounded-full border border-white/20 hover:text-white hover:border-white/40 transition-colors active:scale-95"
      >
        Skip
      </button>
    </div>
  );
}
