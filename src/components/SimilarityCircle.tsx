"use client";

import React from "react";

export default function SimilarityCircle({
  similarity,
  size = 80,
  className = "",
  variant = "error",
}: {
  similarity: number;
  size?: number;
  className?: string;
  variant?: "error" | "success" | "warning" | "info";
}) {
  const pct = Math.max(0, Math.min(100, Math.round((similarity ?? 0) * 100)));
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const colors = getColors(variant);
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className={colors.bg}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className={colors.fg}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className={colors.text}
          style={{ fontWeight: 700, fontSize: size * 0.28 }}
        >
          {pct}%
        </text>
      </svg>
    </div>
  );
}

function getColors(variant: "error" | "success" | "warning" | "info") {
  switch (variant) {
    case "success":
      return {
        bg: "text-green-200 dark:text-green-900/50",
        fg: "text-green-500 dark:text-green-400",
        text: "fill-green-700 dark:fill-green-300",
      };
    case "warning":
      return {
        bg: "text-amber-200 dark:text-amber-900/50",
        fg: "text-amber-500 dark:text-amber-400",
        text: "fill-amber-700 dark:fill-amber-300",
      };
    case "info":
      return {
        bg: "text-sky-200 dark:text-sky-900/50",
        fg: "text-sky-500 dark:text-sky-400",
        text: "fill-sky-700 dark:fill-sky-300",
      };
    case "error":
    default:
      return {
        bg: "text-red-200 dark:text-red-900/50",
        fg: "text-red-500 dark:text-red-400",
        text: "fill-red-700 dark:fill-red-300",
      };
  }
}
