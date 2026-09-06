"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { gsap } from "gsap";
import "./MagicCard.css";

export interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glowColor?: string;
  glowRadius?: number;
  enableTilt?: boolean;
  maxTilt?: number;
  enableBorderGlow?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  enableStars?: boolean;
  particleCount?: number;
  disableAnimations?: boolean;
  as?: "div" | "article" | "section" | "li";
}

const DEFAULT_GLOW_COLOR = "245, 158, 11"; // Sovereign Gold RGB
const DEFAULT_GLOW_RADIUS = 240;
const MOBILE_BREAKPOINT = 768;

export const MagicCard: React.FC<MagicCardProps> = ({
  children,
  className = "",
  style = {},
  glowColor = DEFAULT_GLOW_COLOR,
  glowRadius = DEFAULT_GLOW_RADIUS,
  enableTilt = true,
  maxTilt = 4,
  enableBorderGlow = true,
  enableMagnetism = false,
  clickEffect = true,
  enableStars = false,
  particleCount = 6,
  disableAnimations = false,
  as: Component = "div",
  onClick,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const particlesRef = useRef<HTMLElement[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= MOBILE_BREAKPOINT ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const shouldDisable = disableAnimations || isMobile;

  // Particle management for optional spark stars
  const clearParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    particlesRef.current.forEach((p) => {
      gsap.to(p, {
        scale: 0,
        opacity: 0,
        duration: 0.2,
        ease: "power1.in",
        onComplete: () => p.parentNode?.removeChild(p),
      });
    });
    particlesRef.current = [];
  }, []);

  const spawnParticles = useCallback(() => {
    if (!cardRef.current || !enableStars || shouldDisable) return;
    const { width, height } = cardRef.current.getBoundingClientRect();

    for (let i = 0; i < particleCount; i++) {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const p = document.createElement("div");
        p.className = "magic-card-particle";
        p.style.cssText = `
          left: ${Math.random() * width}px;
          top: ${Math.random() * height}px;
          --glow-color: ${glowColor};
        `;
        cardRef.current.appendChild(p);
        particlesRef.current.push(p);

        gsap.fromTo(p, { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.85, duration: 0.25 });
        gsap.to(p, {
          x: (Math.random() - 0.5) * 40,
          y: (Math.random() - 0.5) * 40,
          opacity: 0.2,
          duration: 1.8 + Math.random(),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }, i * 110);
      timeoutsRef.current.push(timeoutId);
    }
  }, [enableStars, shouldDisable, particleCount, glowColor]);

  useEffect(() => {
    if (shouldDisable || !cardRef.current) return;
    const el = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      if (enableStars) spawnParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      if (enableStars) clearParticles();

      if (enableBorderGlow) {
        el.style.setProperty("--glow-intensity", "0");
      }

      if (enableTilt) {
        gsap.to(el, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.35,
          ease: "power2.out",
        });
      }

      if (enableMagnetism) {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.35,
          ease: "power2.out",
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Update cursor border-glow properties
      if (enableBorderGlow) {
        const relativeX = (x / rect.width) * 100;
        const relativeY = (y / rect.height) * 100;
        el.style.setProperty("--glow-x", `${relativeX}%`);
        el.style.setProperty("--glow-y", `${relativeY}%`);
        el.style.setProperty("--glow-intensity", "1");
        el.style.setProperty("--glow-radius", `${glowRadius}px`);
        el.style.setProperty("--glow-color", glowColor);
      }

      // Subtle institutional 3D tilt
      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;
        gsap.to(el, {
          rotateX,
          rotateY,
          duration: 0.15,
          ease: "power1.out",
          transformPerspective: 900,
        });
      }

      // Subtle magnetism tracking
      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.025;
        const magnetY = (y - centerY) * 0.025;
        gsap.to(el, {
          x: magnetX,
          y: magnetY,
          duration: 0.25,
          ease: "power2.out",
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDist = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement("div");
      ripple.className = "magic-card-ripple";
      ripple.style.cssText = `
        width: ${maxDist * 2}px;
        height: ${maxDist * 2}px;
        left: ${x - maxDist}px;
        top: ${y - maxDist}px;
        background: radial-gradient(circle, rgba(${glowColor}, 0.28) 0%, rgba(${glowColor}, 0.1) 35%, transparent 70%);
      `;
      el.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.65,
          ease: "power2.out",
          onComplete: () => ripple.remove(),
        }
      );
    };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("click", handleClick);

    return () => {
      isHoveredRef.current = false;
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("click", handleClick);
      clearParticles();
    };
  }, [
    shouldDisable,
    enableBorderGlow,
    enableTilt,
    enableMagnetism,
    enableStars,
    clickEffect,
    glowColor,
    glowRadius,
    maxTilt,
    spawnParticles,
    clearParticles,
  ]);

  const combinedClassName = [
    "magic-card",
    enableBorderGlow ? "magic-card--border-glow" : "",
    enableTilt ? "magic-card--tilt" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const combinedStyle: React.CSSProperties = {
    ...style,
    "--glow-color": glowColor,
    "--glow-radius": `${glowRadius}px`,
  } as React.CSSProperties;

  const Comp: any = Component;

  return (
    <Comp
      ref={cardRef}
      className={combinedClassName}
      style={combinedStyle}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Comp>
  );
};

export default MagicCard;
