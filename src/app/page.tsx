"use client";

import { useEffect, useRef } from "react";

const DOCK_APPS = [
  {
    name: "Finder",
    image:
      "https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/finder.png",
  },
  {
    name: "Karten",
    image:
      "https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/map.png",
  },
  {
    name: "Nachrichten",
    image:
      "https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/messages.png",
  },
  {
    name: "Notizen",
    image:
      "https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/notes.png",
  },
  {
    name: "Safari",
    image:
      "https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/safari.png",
  },
  {
    name: "Bücher",
    image:
      "https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/books.png",
  },
];

export default function Home() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    let targetX = 50;
    let targetY = 38;
    let currentX = targetX;
    let currentY = targetY;

    const handlePointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / window.innerWidth) * 100;
      targetY = (event.clientY / window.innerHeight) * 100;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      rootRef.current?.style.setProperty("--pointer-x", `${currentX}%`);
      rootRef.current?.style.setProperty("--pointer-y", `${currentY}%`);
      frame = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main ref={rootRef} className="liquid-root">
      <svg className="liquid-defs" aria-hidden="true">
        <filter id="liquid-distortion" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.02"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
      </svg>

      <div className="liquid-scene" aria-hidden="true">
        <img src="/background.jpg" alt="" />
        <div className="scene-shade" />
        <div className="ambient-orb ambient-orb-one" />
        <div className="ambient-orb ambient-orb-two" />
        <div className="liquid-highlight liquid-highlight-one" />
        <div className="liquid-highlight liquid-highlight-two" />
      </div>

      <div className="workspace">
        <section className="glass-panel" aria-label="Widget-Fläche">
          <div className="glass-filter" />
          <div className="glass-overlay" />
          <div className="glass-specular" />
          <div className="widget-grid" aria-label="Freie Widget-Fläche">
            {/*
              Neue Apps und Widgets hier als direkte Kinder ergänzen.
              Das responsive Grid ordnet sie automatisch neu an.
            */}
          </div>
        </section>

        <section className="liquid-dock-wrapper" aria-label="Apps">
          <div className="liquid-dock-effect" />
          <div className="liquid-dock-tint" />
          <div className="liquid-dock-shine" />
          <div className="liquid-dock-content">
            <div className="liquid-dock">
              {DOCK_APPS.map((app) => (
                <button
                  key={app.name}
                  type="button"
                  className="dock-app"
                  title={`${app.name} öffnen`}
                  aria-label={`${app.name} öffnen`}
                >
                  <img src={app.image} alt="" />
                  <span>{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
