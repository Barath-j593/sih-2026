"use client";

import React, { useRef, useEffect, useMemo, type CSSProperties, type ReactNode, type MouseEventHandler } from "react";
import Link from "next/link";
import { Renderer, Program, Mesh, Triangle, Color } from "ogl";
import "./SpecularButton.css";

export type ButtonSize = "sm" | "md" | "lg";
export type ButtonVariant = "primary" | "amber" | "secondary" | "parchment" | "danger" | "success";

export interface SpecularButtonProps {
  children?: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  radius?: number;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  textColor?: string;
  lineColor?: string;
  baseColor?: string;
  borderColor?: string;
  intensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  className?: string;
  type?: "button" | "submit" | "reset";
  href?: string;
  target?: string;
  rel?: string;
  title?: string;
  id?: string;
}

interface ShaderProps {
  radius: number;
  lineColor: string;
  baseColor: string;
  intensity: number;
  shineSize: number;
  shineFade: number;
  thickness: number;
  speed: number;
  followMouse: boolean;
  proximity: number;
  autoAnimate: boolean;
}

// Padding around button so the rim glow can bleed outside the perimeter
const PAD = 16;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) { 
  return sdRoundedRect(p, uHalfSize, uRadius); 
}

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = shapeSDF(p);
  vec2 L = vec2(cos(uAngle), sin(uAngle));

  // Dark base stroke hugging the edge for crisp sovereign tactile definition
  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

  // Symmetric specular: edges facing toward/away from the light both catch a streak.
  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`;

// SETU Statutory Brand Presets
const SETU_VARIANTS: Record<
  ButtonVariant,
  {
    tint: string;
    tintOpacity: number;
    textColor: string;
    lineColor: string;
    baseColor: string;
    borderColor: string;
    intensity: number;
  }
> = {
  // Sovereign Midnight: Slate black background with golden amber royal rim
  primary: {
    tint: "#1C1917",
    tintOpacity: 1,
    textColor: "#F7F5EE",
    lineColor: "#FDE68A", // Warm gold gleam
    baseColor: "#6E4529", // Sovereign bronze
    borderColor: "rgba(217, 119, 6, 0.35)",
    intensity: 1.0
  },
  // Saffron / Statutory Amber
  amber: {
    tint: "#D97706",
    tintOpacity: 1,
    textColor: "#FFFFFF",
    lineColor: "#FFFBEB", // Crisp sunlight gold
    baseColor: "#78350F", // Deep amber shadow
    borderColor: "rgba(251, 191, 36, 0.45)",
    intensity: 1.05
  },
  // Archival Vellum / Parchment Paper
  secondary: {
    tint: "#FAF7F2",
    tintOpacity: 1,
    textColor: "#1C1917",
    lineColor: "#D97706", // Amber stroke
    baseColor: "#D9D2C5", // Subtle hairline
    borderColor: "rgba(28, 25, 23, 0.2)",
    intensity: 0.9
  },
  parchment: {
    tint: "#FAF7F2",
    tintOpacity: 1,
    textColor: "#1C1917",
    lineColor: "#D97706",
    baseColor: "#D9D2C5",
    borderColor: "rgba(28, 25, 23, 0.2)",
    intensity: 0.9
  },
  // Critical / Red Flag / Investigation
  danger: {
    tint: "#991B1B",
    tintOpacity: 1,
    textColor: "#FFFFFF",
    lineColor: "#FCA5A5", // Crimson specular shine
    baseColor: "#450A0A",
    borderColor: "rgba(239, 68, 68, 0.4)",
    intensity: 1.1
  },
  // Verified / Clean / Low Risk
  success: {
    tint: "#065F46",
    tintOpacity: 1,
    textColor: "#FFFFFF",
    lineColor: "#6EE7B7", // Mint emerald specular shine
    baseColor: "#022C22",
    borderColor: "rgba(16, 185, 129, 0.4)",
    intensity: 1.0
  }
};

const DEFAULT_RADII: Record<ButtonSize, number> = {
  sm: 10,
  md: 12,
  lg: 14
};

export const SpecularButton: React.FC<SpecularButtonProps> = ({
  children = "Action",
  size = "md",
  variant = "primary",
  radius,
  tint,
  tintOpacity,
  blur = 0,
  textColor,
  lineColor,
  baseColor,
  borderColor,
  intensity,
  shineSize = 12,
  shineFade = 40,
  thickness = 1.1,
  speed = 0.3,
  followMouse = true,
  proximity = 240,
  autoAnimate = false,
  disabled = false,
  onClick,
  className = "",
  type = "button",
  href,
  target,
  rel,
  title,
  id
}) => {
  const btnRef = useRef<HTMLElement | null>(null);
  const fxRef = useRef<HTMLSpanElement>(null);
  const propsRef = useRef<ShaderProps>({} as ShaderProps);

  const activeRadius = radius ?? DEFAULT_RADII[size];
  const variantTokens = SETU_VARIANTS[variant] || SETU_VARIANTS.primary;

  const resolvedTint = tint ?? variantTokens.tint;
  const resolvedTintOpacity = tintOpacity ?? variantTokens.tintOpacity;
  const resolvedTextColor = textColor ?? variantTokens.textColor;
  const resolvedLineColor = lineColor ?? variantTokens.lineColor;
  const resolvedBaseColor = baseColor ?? variantTokens.baseColor;
  const resolvedBorderColor = borderColor ?? variantTokens.borderColor;
  const resolvedIntensity = intensity ?? variantTokens.intensity;

  propsRef.current = {
    radius: activeRadius,
    lineColor: resolvedLineColor,
    baseColor: resolvedBaseColor,
    intensity: resolvedIntensity,
    shineSize,
    shineFade,
    thickness,
    speed,
    followMouse,
    proximity,
    autoAnimate
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const btn = btnRef.current;
    const fx = fxRef.current;
    if (!btn || !fx) return;

    // Honor reduced motion preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: Renderer | null = null;
    let gl: any = null;
    let ro: ResizeObserver | null = null;
    let raf = 0;
    let onPointerMove: ((e: PointerEvent) => void) | null = null;

    try {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr });
      gl = renderer.gl;
      if (!gl) return;

      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const geometry = new Triangle(gl);
      if (geometry.attributes.uv) delete geometry.attributes.uv;

      const program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uCenter: { value: [0, 0] },
          uHalfSize: { value: [1, 1] },
          uRadius: { value: 0 },
          uAngle: { value: 2.4 },
          uPx: { value: dpr },
          uLineColor: { value: [1, 1, 1] },
          uBaseColor: { value: [0.32, 0.32, 0.32] },
          uIntensity: { value: 1 },
          uShineSize: { value: 0.17 },
          uShineFade: { value: 0.7 },
          uThickness: { value: 1 },
          uBaseWidth: { value: dpr }
        }
      });

      const mesh = new Mesh(gl, { geometry, program });
      fx.appendChild(gl.canvas);

      const sizeRef = { w: 1, h: 1 };
      const resize = () => {
        if (!btn || !renderer) return;
        const rect = btn.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w === 0 || h === 0) return;
        sizeRef.w = w;
        sizeRef.h = h;
        renderer.setSize(w + PAD * 2, h + PAD * 2);
        program.uniforms.uCenter.value = [(PAD + w / 2) * dpr, (PAD + h / 2) * dpr];
        program.uniforms.uHalfSize.value = [(w / 2) * dpr, (h / 2) * dpr];
      };

      ro = new ResizeObserver(resize);
      ro.observe(btn);
      resize();

      let pointerAngle: number | null = null;
      let proximityT = 0;

      onPointerMove = (e: PointerEvent) => {
        if (prefersReducedMotion || !btn) return;
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
        const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
        const dist = Math.hypot(dx, dy);

        if (dist === 0) {
          const nx = (e.clientX - cx) / (rect.width / 2);
          const ny = (cy - e.clientY) / (rect.height / 2);
          pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15;
        } else {
          pointerAngle = Math.atan2(cy - e.clientY, e.clientX - cx);
        }
        const t = Math.max(0, 1 - dist / Math.max(propsRef.current.proximity, 1));
        proximityT = t * t * (3 - 2 * t);
      };

      window.addEventListener("pointermove", onPointerMove);

      let angle = 2.4;
      let idleAngle = 2.4;
      let bright = 0;
      let last = performance.now();

      const lineC = new Color();
      const baseC = new Color();

      const update = (now: number) => {
        raf = requestAnimationFrame(update);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const p = propsRef.current;

        if (!prefersReducedMotion) {
          idleAngle += p.speed * dt;
        }

        const target =
          p.followMouse && pointerAngle != null && (!p.autoAnimate || proximityT > 0)
            ? pointerAngle
            : idleAngle;
        const diff = ((target - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        angle += diff * (1 - Math.exp(-dt * 7));

        const brightTarget = p.autoAnimate ? 1 : proximityT;
        bright += (brightTarget - bright) * (1 - Math.exp(-dt * 8));

        lineC.set(p.lineColor);
        baseC.set(p.baseColor);
        program.uniforms.uAngle.value = angle;
        program.uniforms.uRadius.value = Math.min(p.radius, Math.min(sizeRef.w, sizeRef.h) / 2) * dpr;
        program.uniforms.uLineColor.value = [lineC.r, lineC.g, lineC.b];
        program.uniforms.uBaseColor.value = [baseC.r, baseC.g, baseC.b];
        program.uniforms.uIntensity.value = p.intensity * bright;
        program.uniforms.uShineSize.value = (p.shineSize * Math.PI) / 180;
        program.uniforms.uShineFade.value = (p.shineFade * Math.PI) / 180;
        program.uniforms.uThickness.value = p.thickness * dpr;

        renderer.render({ scene: mesh });
      };

      raf = requestAnimationFrame(update);
    } catch (err) {
      console.warn("SpecularButton WebGL initialization fallback:", err);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (onPointerMove) window.removeEventListener("pointermove", onPointerMove);
      if (gl?.canvas?.parentNode === fx) {
        fx.removeChild(gl.canvas);
      }
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [activeRadius, resolvedLineColor, resolvedBaseColor, resolvedIntensity, shineSize, shineFade, thickness, speed, followMouse, proximity, autoAnimate]);

  const buttonStyle: CSSProperties = {
    "--sb-radius": `${activeRadius}px`,
    "--sb-tint": resolvedTint,
    "--sb-tint-opacity": resolvedTintOpacity,
    "--sb-blur": `${blur}px`,
    "--sb-text-color": resolvedTextColor,
    "--sb-border-color": resolvedBorderColor
  } as CSSProperties;

  const combinedClassName = `specular-button specular-button--${size} ${className}`.trim();

  // If href is provided, render as accessible Next.js Link
  if (href && !disabled) {
    return (
      <Link
        ref={(el) => {
          btnRef.current = el as unknown as HTMLElement;
        }}
        href={href}
        target={target}
        rel={rel}
        title={title}
        id={id}
        onClick={onClick as any}
        className={combinedClassName}
        style={buttonStyle}
      >
        <span ref={fxRef} className="specular-button__fx" aria-hidden="true" />
        <span className="specular-button__label">{children}</span>
      </Link>
    );
  }

  // Otherwise render standard HTML button
  return (
    <button
      ref={(el) => {
        btnRef.current = el;
      }}
      type={type}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onClick}
      title={title}
      id={id}
      className={combinedClassName}
      style={buttonStyle}
    >
      <span ref={fxRef} className="specular-button__fx" aria-hidden="true" />
      <span className="specular-button__label">{children}</span>
    </button>
  );
};

export default SpecularButton;
