"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";

export interface TextPressureProps {
  text?: string;
  fontFamily?: string;
  fontUrl?: string;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  alpha?: boolean;
  flex?: boolean;
  stroke?: boolean;
  scale?: boolean;
  textColor?: string;
  strokeColor?: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
  center?: boolean;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getAttr = (distance: number, maxDist: number, minVal: number, maxVal: number) => {
  const val = maxVal - Math.abs((maxVal * distance) / maxDist);
  return Math.max(minVal, val + minVal);
};

const debounce = <T extends (...args: any[]) => any>(func: T, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export function TextPressure({
  text = "SETU",
  fontFamily = "Roboto Flex",
  fontUrl = "https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap",
  width = true,
  weight = true,
  italic = true,
  alpha = false,
  flex = true,
  stroke = false,
  scale = false,
  textColor = "#1C1917",
  strokeColor = "#B45309",
  className = "",
  minFontSize = 32,
  maxFontSize = 96,
  center = true
}: TextPressureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);

  const mouseRef = useRef({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });

  const [mounted, setMounted] = useState(false);
  const [fontSize, setFontSize] = useState(minFontSize);
  const [scaleY, setScaleY] = useState(1);
  const [lineHeight, setLineHeight] = useState(1);

  const chars = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        cursorRef.current.x = t.clientX;
        cursorRef.current.y = t.clientY;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    if (containerRef.current) {
      const { left, top, width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = left + containerW / 2;
      mouseRef.current.y = top + containerH / 2;
      cursorRef.current.x = mouseRef.current.x;
      cursorRef.current.y = mouseRef.current.y;
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const setSize = useCallback(() => {
    if (!containerRef.current || !titleRef.current) return;

    const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
    if (containerW === 0 || containerH === 0) return;

    // Constrain font size so it comfortably fits within both container height and width
    const heightLimit = containerH * 0.72;
    const charCount = Math.max(chars.length, 1);
    // At maximum variable width (wdth: 200), letters can expand up to ~1.2x of font size
    const widthLimit = containerW / (charCount * (center ? 1.35 : 1.15));

    let targetSize = Math.min(heightLimit, widthLimit);
    if (maxFontSize && targetSize > maxFontSize) {
      targetSize = maxFontSize;
    }
    targetSize = Math.max(targetSize, minFontSize);

    setFontSize(Math.round(targetSize));
    setScaleY(1);
    setLineHeight(1);

    requestAnimationFrame(() => {
      if (!titleRef.current) return;
      const textRect = titleRef.current.getBoundingClientRect();

      if (scale && textRect.height > 0) {
        const yRatio = containerH / textRect.height;
        setScaleY(yRatio);
        setLineHeight(yRatio);
      }
    });
  }, [chars.length, minFontSize, maxFontSize, center, scale]);

  useEffect(() => {
    const debouncedSetSize = debounce(setSize, 60);
    debouncedSetSize();
    window.addEventListener("resize", debouncedSetSize);
    return () => window.removeEventListener("resize", debouncedSetSize);
  }, [setSize]);

  useEffect(() => {
    let rafId: number;
    const animate = () => {
      mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 12;
      mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 12;

      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        // Effective interaction radius around letters
        const maxDist = Math.max(titleRect.width / 2, 240);

        spansRef.current.forEach((span) => {
          if (!span) return;

          const rect = span.getBoundingClientRect();
          const charCenter = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
          };

          const d = dist(mouseRef.current, charCenter);

          const wdth = width ? Math.floor(getAttr(d, maxDist, 25, 151)) : 100;
          const wght = weight ? Math.floor(getAttr(d, maxDist, 100, 950)) : 400;
          const italVal = italic ? getAttr(d, maxDist, 0, 1).toFixed(2) : "0";
          const alphaVal = alpha ? getAttr(d, maxDist, 0.2, 1).toFixed(2) : "1";

          const newFontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;

          if (span.style.fontVariationSettings !== newFontVariationSettings) {
            span.style.fontVariationSettings = newFontVariationSettings;
          }
          if (alpha && span.style.opacity !== alphaVal) {
            span.style.opacity = alphaVal;
          }
        });
      }

      rafId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafId);
  }, [width, weight, italic, alpha]);

  // Use dangerouslySetInnerHTML to guarantee 0 SSR hydration text mismatch
  const styleElement = useMemo(() => {
    const css = `
      @import url('${fontUrl}');

      .text-pressure-title.is-center {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: clamp(0.75rem, 2.5vw, 2.25rem);
      }

      .text-pressure-title.is-space-between {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .text-pressure-title.stroke span {
        position: relative;
        color: ${textColor};
      }
      .text-pressure-title.stroke span::after {
        content: attr(data-char);
        position: absolute;
        left: 0;
        top: 0;
        color: transparent;
        z-index: -1;
        -webkit-text-stroke-width: 3px;
        -webkit-text-stroke-color: ${strokeColor};
      }

      .text-pressure-title {
        color: ${textColor};
      }
    `;

    return (
      <style
        dangerouslySetInnerHTML={{
          __html: css
        }}
      />
    );
  }, [fontUrl, textColor, strokeColor]);

  const layoutClass = center
    ? "is-center"
    : flex
    ? "is-space-between"
    : "";

  const dynamicClassName = [className, layoutClass, stroke ? "stroke" : ""].filter(Boolean).join(" ");

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {styleElement}
      <h1
        ref={titleRef}
        className={`text-pressure-title ${dynamicClassName}`}
        style={{
          fontFamily: `"${fontFamily}", sans-serif`,
          textTransform: "uppercase",
          fontSize: `${fontSize}px`,
          lineHeight,
          transform: `scale(1, ${scaleY})`,
          transformOrigin: "center center",
          margin: 0,
          textAlign: "center",
          userSelect: "none",
          whiteSpace: "nowrap",
          fontWeight: 100,
          width: center ? "auto" : "100%"
        }}
      >
        {chars.map((char, i) => (
          <span
            key={i}
            ref={(el) => {
              spansRef.current[i] = el;
            }}
            data-char={char}
            style={{
              display: "inline-block",
              color: stroke ? undefined : textColor,
              transition: "font-variation-settings 0.04s ease-out",
              willChange: "font-variation-settings"
            }}
          >
            {char}
          </span>
        ))}
      </h1>
    </div>
  );
}

export default TextPressure;
