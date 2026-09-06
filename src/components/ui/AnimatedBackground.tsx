import React, { useState, useEffect, useRef } from 'react';

export interface AnimatedBackgroundProps {
  variant?: 'dashboard' | 'admin' | 'landing' | 'auth';
  className?: string;
  intensity?: 'subtle' | 'normal' | 'vibrant';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = 'dashboard',
  className = '',
  intensity = 'subtle',
}) => {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Smooth pointer interaction with spring-like physics
  useEffect(() => {
    if (prefersReducedMotion || typeof window === 'undefined') return;

    const handlePointerMove = (e: MouseEvent) => {
      // Normalize mouse coordinates from -1 to 1 relative to center
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth - 0.5) * 2;
      const ny = (e.clientY / innerHeight - 0.5) * 2;

      // Subtle range (max 24px parallax shift)
      targetPos.current = { x: nx * 24, y: ny * 20 };
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    // Smooth Lerp loop for 60fps fluid response
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const updatePosition = () => {
      currentPos.current.x = lerp(currentPos.current.x, targetPos.current.x, 0.06);
      currentPos.current.y = lerp(currentPos.current.y, targetPos.current.y, 0.06);

      // Only re-render when noticeable difference
      const dx = Math.abs(currentPos.current.x - mouseOffset.x);
      const dy = Math.abs(currentPos.current.y - mouseOffset.y);
      if (dx > 0.05 || dy > 0.05) {
        setMouseOffset({
          x: Math.round(currentPos.current.x * 10) / 10,
          y: Math.round(currentPos.current.y * 10) / 10,
        });
      }

      animationFrameId.current = requestAnimationFrame(updatePosition);
    };

    animationFrameId.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [prefersReducedMotion, mouseOffset.x, mouseOffset.y]);

  const opacityMap = {
    subtle: 'opacity-[0.45]',
    normal: 'opacity-[0.65]',
    vibrant: 'opacity-[0.85]',
  };

  const transformStyle = prefersReducedMotion
    ? undefined
    : {
        transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
        willChange: 'transform',
      };

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 ${opacityMap[intensity]} ${className}`}
    >
      <svg
        className="w-full h-full object-cover transition-transform duration-300 ease-out"
        style={transformStyle}
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Subtle Linear Grid Pattern with Crosshair Markers */}
          <pattern id="open-design-mesh-pattern" width="64" height="64" patternUnits="userSpaceOnUse">
            <path
              d="M 64 0 L 0 0 0 64"
              fill="none"
              stroke="rgba(148, 163, 184, 0.12)"
              strokeWidth="0.8"
            />
            {/* Crosshair at intersections */}
            <path
              d="M -3 0 L 3 0 M 0 -3 L 0 3"
              stroke="rgba(59, 130, 246, 0.22)"
              strokeWidth="0.8"
            />
          </pattern>

          {/* Core Dynamic Brand Gradients */}
          <linearGradient id="circuit-beam-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-primary, #2563eb)" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="circuit-beam-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#0284c7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="circuit-beam-3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>

          {/* Radial Ambient Glow Orbs */}
          <radialGradient id="ambient-orb-primary" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-primary, #2563eb)" stopOpacity="0.12" />
            <stop offset="60%" stopColor="var(--brand-primary, #2563eb)" stopOpacity="0.03" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="ambient-orb-emerald" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.10" />
            <stop offset="70%" stopColor="#10b981" stopOpacity="0.02" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="ambient-orb-purple" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.09" />
            <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.015" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Fade Mask to ensure bottom/content contrast */}
          <linearGradient id="bg-fade-mask" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="75%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0.15" />
          </linearGradient>
          <mask id="fade-overlay">
            <rect width="1440" height="900" fill="url(#bg-fade-mask)" />
          </mask>
        </defs>

        <g mask="url(#fade-overlay)">
          {/* 1. Precision Background Grid */}
          <rect width="1440" height="900" fill="url(#open-design-mesh-pattern)" />

          {/* 2. Ambient Floating Radial Gradient Orbs */}
          <circle
            cx="320"
            cy="180"
            r="380"
            fill="url(#ambient-orb-primary)"
            className="animate-svg-glow"
          />
          <circle
            cx="1180"
            cy="240"
            r="420"
            fill="url(#ambient-orb-emerald)"
            className="animate-svg-glow"
            style={{ animationDelay: '-4s' }}
          />
          <circle
            cx="720"
            cy="680"
            r="440"
            fill="url(#ambient-orb-purple)"
            className="animate-svg-glow"
            style={{ animationDelay: '-2s' }}
          />

          {/* 3. Variant-Specific Vector Circuits & Telemetry Paths */}
          {variant === 'landing' && (
            <g className="animate-svg-float">
              {/* Main Sweeping Architecture Curves */}
              <path
                d="M -100 280 C 260 140, 520 420, 880 240 S 1320 480, 1560 360"
                stroke="url(#circuit-beam-1)"
                strokeWidth="1.6"
                strokeDasharray="14 28"
                className="animate-svg-flow"
              />
              <path
                d="M -60 420 C 320 300, 680 560, 1040 380 S 1420 220, 1580 280"
                stroke="url(#circuit-beam-2)"
                strokeWidth="1.4"
                strokeDasharray="18 36"
                className="animate-svg-flow-reverse"
              />
              <path
                d="M 120 -60 C 380 260, 720 180, 1020 460 S 1340 580, 1520 780"
                stroke="url(#circuit-beam-3)"
                strokeWidth="1.2"
                strokeDasharray="12 24"
                className="animate-svg-flow-fast"
              />

              {/* Concentric Telemetry Orbital Rings */}
              <circle
                cx="720"
                cy="320"
                r="180"
                stroke="rgba(37, 99, 235, 0.12)"
                strokeWidth="1"
                strokeDasharray="6 12"
              />
              <circle
                cx="720"
                cy="320"
                r="280"
                stroke="rgba(16, 185, 129, 0.08)"
                strokeWidth="1"
                strokeDasharray="8 16"
              />
            </g>
          )}

          {(variant === 'dashboard' || variant === 'admin') && (
            <g>
              {/* Infrastructure Backbone Bus Lines */}
              <path
                d="M 0 160 L 480 160 L 640 280 L 1120 280 L 1260 180 L 1440 180"
                stroke="url(#circuit-beam-1)"
                strokeWidth="1.6"
                strokeDasharray="16 32"
                className="animate-svg-flow"
              />
              <path
                d="M 0 380 L 320 380 L 480 480 L 960 480 L 1120 360 L 1440 360"
                stroke="url(#circuit-beam-2)"
                strokeWidth="1.4"
                strokeDasharray="20 40"
                className="animate-svg-flow-reverse"
              />
              <path
                d="M 220 0 L 220 280 L 380 420 L 380 840"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="1"
                strokeDasharray="8 16"
              />
              <path
                d="M 1240 60 L 1240 380 L 1140 520 L 1140 900"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="1"
                strokeDasharray="8 16"
              />

              {/* Telemetry Anycast Node Clusters */}
              {/* Node 1: SGP Edge */}
              <g transform="translate(480, 160)">
                <circle r="12" fill="rgba(37, 99, 235, 0.12)" className="animate-svg-halo" />
                <circle r="4" fill="#2563eb" />
                <circle r="7" stroke="#93c5fd" strokeWidth="1" />
                <text x="12" y="4" fill="#64748b" fontSize="9" fontFamily="monospace">
                  NODE_SGP // 103.229.52.143
                </text>
              </g>

              {/* Node 2: FRA Edge */}
              <g transform="translate(1120, 280)">
                <circle r="12" fill="rgba(16, 185, 129, 0.12)" className="animate-svg-halo" style={{ animationDelay: '-1.5s' }} />
                <circle r="4" fill="#10b981" />
                <circle r="7" stroke="#a7f3d0" strokeWidth="1" />
                <text x="12" y="4" fill="#64748b" fontSize="9" fontFamily="monospace">
                  NODE_FRA // ANYCAST_02
                </text>
              </g>

              {/* Node 3: US-East Edge */}
              <g transform="translate(320, 380)">
                <circle r="12" fill="rgba(124, 58, 237, 0.12)" className="animate-svg-halo" style={{ animationDelay: '-2.5s' }} />
                <circle r="4" fill="#7c3aed" />
                <circle r="7" stroke="#ddd6fe" strokeWidth="1" />
                <text x="12" y="4" fill="#64748b" fontSize="9" fontFamily="monospace">
                  NODE_IAD // ROUTE_DISPATCH
                </text>
              </g>

              {/* Node 4: TYO Edge */}
              <g transform="translate(960, 480)">
                <circle r="10" fill="rgba(6, 182, 212, 0.12)" className="animate-svg-halo" style={{ animationDelay: '-3s' }} />
                <circle r="3.5" fill="#06b6d4" />
                <circle r="6" stroke="#a5f3fc" strokeWidth="1" />
                <text x="12" y="4" fill="#64748b" fontSize="9" fontFamily="monospace">
                  NODE_HND // LATENCY_18MS
                </text>
              </g>
            </g>
          )}

          {variant === 'auth' && (
            <g className="animate-svg-float">
              {/* Concentric Cryptographic Security Rings */}
              <circle
                cx="720"
                cy="450"
                r="160"
                stroke="rgba(37, 99, 235, 0.2)"
                strokeWidth="1.2"
                strokeDasharray="12 24"
                className="animate-svg-flow"
              />
              <circle
                cx="720"
                cy="450"
                r="260"
                stroke="rgba(79, 70, 229, 0.15)"
                strokeWidth="1"
                strokeDasharray="16 32"
                className="animate-svg-flow-reverse"
              />
              <circle
                cx="720"
                cy="450"
                r="380"
                stroke="rgba(16, 185, 129, 0.1)"
                strokeWidth="0.8"
                strokeDasharray="24 48"
                className="animate-svg-flow"
              />

              {/* Cross Axis Grid lines */}
              <line x1="720" y1="80" x2="720" y2="820" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="0.8" strokeDasharray="4 8" />
              <line x1="260" y1="450" x2="1180" y2="450" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="0.8" strokeDasharray="4 8" />

              {/* Shield Satellite Beacons */}
              <g transform="translate(720, 290)">
                <circle r="8" fill="rgba(37, 99, 235, 0.2)" className="animate-svg-halo" />
                <circle r="3" fill="#2563eb" />
              </g>
              <g transform="translate(880, 450)">
                <circle r="8" fill="rgba(16, 185, 129, 0.2)" className="animate-svg-halo" style={{ animationDelay: '-1s' }} />
                <circle r="3" fill="#10b981" />
              </g>
              <g transform="translate(720, 610)">
                <circle r="8" fill="rgba(124, 58, 237, 0.2)" className="animate-svg-halo" style={{ animationDelay: '-2s' }} />
                <circle r="3" fill="#7c3aed" />
              </g>
              <g transform="translate(560, 450)">
                <circle r="8" fill="rgba(6, 182, 212, 0.2)" className="animate-svg-halo" style={{ animationDelay: '-3s' }} />
                <circle r="3" fill="#06b6d4" />
              </g>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
