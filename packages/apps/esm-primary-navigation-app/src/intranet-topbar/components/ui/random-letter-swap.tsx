"use client";

import React, { useState, useMemo } from "react";
import { motion, type Transition } from "motion/react";
import { useNavigate, useLocation } from "react-router-dom";

export interface RandomLetterSwapProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  staggerDuration?: number;
  transition?: Transition;
  className?: string;
  href?: string;
  key?: React.Key;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  disableDefaultNavigation?: boolean;
  forceHover?: boolean;
  [key: string]: any;
}

const URL_MAP: Record<string, string> = {
  home: "/",
  work: "/work",
  about: "/about",
  blog: "/blog",
  contact: "/contact",
};

export function RandomLetterSwap({
  label,
  staggerDuration = 0.025,
  transition = { duration: 0.6, type: "spring" },
  className = "",
  href,
  onClick,
  disableDefaultNavigation = false,
  forceHover,
  ...props
}: RandomLetterSwapProps) {
  const [isHoveredInternal, setIsHoveredInternal] = useState(false);
  const isHovered = forceHover !== undefined ? forceHover : isHoveredInternal;
  const navigate = useNavigate();
  const location = useLocation();

  const targetUrl = href || URL_MAP[label.toLowerCase()] || `/${label.toLowerCase()}`;
  const isActive =
    location.pathname === targetUrl ||
    (targetUrl === "/" && (location.pathname === "/" || location.pathname === "/accueil"));

  // Generate randomized delays for each character to produce the authentic scramble/swap effect
  const delays = useMemo(() => {
    const chars = label.split("");
    const indices = chars.map((_, i) => i);
    // Shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return chars.map((_, i) => indices[i] * staggerDuration);
  }, [label, staggerDuration]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e);
    } else if (!disableDefaultNavigation) {
      navigate(targetUrl);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
      onMouseEnter={() => setIsHoveredInternal(true)}
      onMouseLeave={() => setIsHoveredInternal(false)}
      className={`inline-flex items-center select-none relative transition-colors ${className} ${
        isActive ? "!text-white font-semibold" : ""
      }`}
      {...props}
    >
      <span className="inline-flex items-center">
        {label.split("").map((char, i) => {
          if (char === " ") {
            return <span key={i}>&nbsp;</span>;
          }
          return (
            <span
              key={i}
              className="relative inline-flex overflow-hidden h-[1.25em] leading-tight"
            >
              <motion.span
                animate={{ y: isHovered ? "-100%" : "0%" }}
                transition={{ ...transition, delay: delays[i] }}
                className="inline-block"
              >
                {char}
              </motion.span>
              <motion.span
                aria-hidden="true"
                animate={{ y: isHovered ? "0%" : "100%" }}
                transition={{ ...transition, delay: delays[i] }}
                className="absolute left-0 top-0 inline-block select-none"
              >
                {char}
              </motion.span>
            </span>
          );
        })}
      </span>
      {isActive && (
        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-400/80 rounded-full" />
      )}
    </div>
  );
}
