"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { 
  ShieldAlert, 
  GitFork, 
  Clock, 
  Landmark, 
  FileCheck2, 
  Layers, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import "./MagicBento.css";

export const DEFAULT_PARTICLE_COUNT = 10;
export const DEFAULT_SPOTLIGHT_RADIUS = 320;
export const DEFAULT_SOVEREIGN_GLOW = "245, 158, 11"; // Warm Amber / Sovereign Gold RGB
const MOBILE_BREAKPOINT = 768;

export interface MagicBentoCardData {
  color?: string;
  title: string;
  description: string;
  label: string;
  stat?: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const SETU_CORE_CAPABILITIES: MagicBentoCardData[] = [
  {
    color: "#0F172A",
    title: "Split-Contract Radar",
    description: "GFR 2017 Rule 155 compliance engine detecting sub-₹5 Lakh artificial project splitting designed to bypass open e-tenders.",
    label: "GFR §155",
    stat: "₹5.0L Threshold",
    href: "/alerts",
    icon: ShieldAlert,
  },
  {
    color: "#0F172A",
    title: "Contractor Monopoly Barometer",
    description: "Continuous Herfindahl-Hirschman Index (HHI) tracking to flag blocks and districts with extreme vendor and agency capture.",
    label: "HHI > 0.65",
    stat: "Zero Competition",
    href: "/graph",
    icon: Layers,
  },
  {
    color: "#0D1527",
    title: "Cross-Border Cartel Conduits",
    description: "Forensic SVG Bézier flow arcs mapping executing agency syndicates siphoning capital across adjoining parliamentary seats.",
    label: "Forensic GIS",
    stat: "40 Live Conduits",
    href: "/maps",
    icon: GitFork,
  },
  {
    color: "#0F172A",
    title: "4D Pre-Election Surge Scrubber",
    description: "Month-by-month time-lapse playback revealing the March Rush and anomalous pre-election sanction spikes across all 543 constituencies.",
    label: "March Rush",
    stat: "+34% Anomaly Surge",
    href: "/maps",
    icon: Clock,
  },
  {
    color: "#0F172A",
    title: "4-Tier Governance Cockpit",
    description: "Constitutional oversight tailored from Central MoSPI Ministry planners down to District Magistrates and elected MPs.",
    label: "Multi-Tier",
    stat: "790+ Seats",
    href: "/dashboard",
    icon: Landmark,
  },
  {
    color: "#0F172A",
    title: "Audit-Ready Case Files",
    description: "One-click generation of statutory investigation briefs certified for Comptroller and Auditor General (CAG) and anti-corruption action.",
    label: "CAG Ready",
    stat: "Court Admissible",
    href: "/cases",
    icon: FileCheck2,
  },
];

const createParticleElement = (x: number, y: number, color: string = DEFAULT_SOVEREIGN_GLOW) => {
  const el = document.createElement("div");
  el.className = "bento-particle";
  el.style.cssText = `
    position: absolute;
    width: 3.5px;
    height: 3.5px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.75);
    pointer-events: none;
    z-index: 10;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.45,
  fadeDistance: radius * 0.75,
});

const updateCardGlowProperties = (
  card: HTMLElement,
  mouseX: number,
  mouseY: number,
  glow: number,
  radius: number
) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty("--glow-x", `${relativeX}%`);
  card.style.setProperty("--glow-y", `${relativeY}%`);
  card.style.setProperty("--glow-intensity", glow.toString());
  card.style.setProperty("--glow-radius", `${radius}px`);
};

interface ParticleCardProps {
  children: React.ReactNode;
  className?: string;
  disableAnimations?: boolean;
  style?: React.CSSProperties;
  particleCount?: number;
  glowColor?: string;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  href?: string;
}

const ParticleCard: React.FC<ParticleCardProps> = ({
  children,
  className = "",
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_SOVEREIGN_GLOW,
  enableTilt = true,
  clickEffect = true,
  enableMagnetism = false,
  href,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLElement[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLElement[]>([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        },
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true) as HTMLElement;
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(
          clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 0.9, duration: 0.3, ease: "back.out(1.5)" }
        );

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80,
          rotation: Math.random() * 360,
          duration: 2.2 + Math.random() * 2,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
      }, index * 90);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.35,
          ease: "power2.out",
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.35,
          ease: "power2.out",
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        // Subtle, elegant 5-degree maximum tilt (preventing excessive rotation)
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.15,
          ease: "power1.out",
          transformPerspective: 900,
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.035;
        const magnetY = (y - centerY) * 0.035;

        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.35) 0%, rgba(${glowColor}, 0.15) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 100;
      `;

      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
          onComplete: () => ripple.remove(),
        }
      );
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("click", handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("click", handleClick);
      clearAllParticles();
    };
  }, [
    animateParticles,
    clearAllParticles,
    disableAnimations,
    enableTilt,
    enableMagnetism,
    clickEffect,
    glowColor,
  ]);

  const content = (
    <div
      ref={cardRef}
      className={`${className} group cursor-pointer`}
      style={{
        ...style,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full h-full no-underline">
        {content}
      </Link>
    );
  }

  return content;
};

interface GlobalSpotlightProps {
  gridRef: React.RefObject<HTMLDivElement>;
  disableAnimations?: boolean;
  enabled?: boolean;
  spotlightRadius?: number;
  glowColor?: string;
}

const GlobalSpotlight: React.FC<GlobalSpotlightProps> = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_SOVEREIGN_GLOW,
}) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spotlight = document.createElement("div");
    spotlight.className = "magic-bento-global-spotlight";
    spotlight.style.cssText = `
      position: fixed;
      width: 650px;
      height: 650px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.12) 0%,
        rgba(${glowColor}, 0.06) 20%,
        rgba(${glowColor}, 0.02) 40%,
        transparent 70%
      );
      z-index: 50;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return;

      const section = gridRef.current.closest(".magic-bento-section");
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      const cards = gridRef.current.querySelectorAll<HTMLElement>(".magic-bento-card");

      if (!mouseInside) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        });
        cards.forEach((card) => {
          card.style.setProperty("--glow-intensity", "0");
        });
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) -
          Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.08,
        ease: "power1.out",
      });

      const targetOpacity =
        minDistance <= proximity
          ? 0.75
          : minDistance <= fadeDistance
          ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.75
          : 0;

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.18 : 0.4,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gridRef.current?.querySelectorAll<HTMLElement>(".magic-bento-card").forEach((card) => {
        card.style.setProperty("--glow-intensity", "0");
      });
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

export interface MagicBentoProps {
  cards?: MagicBentoCardData[];
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  className?: string;
}

export const MagicBento: React.FC<MagicBentoProps> = ({
  cards = SETU_CORE_CAPABILITIES,
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = true,
  glowColor = DEFAULT_SOVEREIGN_GLOW,
  clickEffect = true,
  enableMagnetism = true,
  className = "",
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;

  return (
    <div className={`magic-bento-section ${className}`}>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <div className="magic-bento-grid" ref={gridRef}>
        {cards.map((card, index) => {
          const baseClassName = `magic-bento-card ${
            textAutoHide ? "magic-bento-card--text-autohide" : ""
          } ${enableBorderGlow ? "magic-bento-card--border-glow" : ""}`;

          const CardIcon = card.icon;

          return (
            <ParticleCard
              key={`bento-card-${index}`}
              className={baseClassName}
              style={
                {
                  backgroundColor: card.color || "#0F172A",
                  "--bento-glow-color": glowColor,
                } as React.CSSProperties
              }
              disableAnimations={shouldDisableAnimations}
              particleCount={particleCount}
              glowColor={glowColor}
              enableTilt={enableTilt}
              clickEffect={clickEffect}
              enableMagnetism={enableMagnetism}
              href={card.href}
            >
              <div className="magic-bento-card__header">
                <div className="magic-bento-card__label">
                  {CardIcon && <CardIcon className="h-3 w-3 text-amber-400" />}
                  <span>{card.label}</span>
                </div>
                {card.stat && (
                  <span className="magic-bento-card__stat">{card.stat}</span>
                )}
              </div>

              <div className="magic-bento-card__content">
                <h3 className="magic-bento-card__title">{card.title}</h3>
                <p className="magic-bento-card__description">{card.description}</p>
              </div>

              <div className="magic-bento-card__footer">
                <span className="magic-bento-card__link">
                  <span>Inspect Signal</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
                <Sparkles className="h-3 w-3 text-amber-500/40 group-hover:text-amber-400 transition-colors" />
              </div>
            </ParticleCard>
          );
        })}
      </div>
    </div>
  );
};

export default MagicBento;
