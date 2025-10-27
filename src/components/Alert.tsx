"use client";

import React from "react";

type Variant = "error" | "success" | "warning" | "info";

export default function Alert({
  variant = "info",
  title,
  children,
  onClose,
  className = "",
}: {
  variant?: Variant;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const styles = getStyles(variant);
  const Icon = getIcon(variant);
  return (
    <div
      role="alert"
      className={`w-full mb-4 rounded-2xl border p-4 flex items-start gap-3 ${styles.container} ${className}`}
    >
      <span className={`mt-0.5 inline-flex ${styles.icon}`}>{Icon}</span>
      <div className="flex-1 min-w-0">
        {title && (
          <div className={`font-semibold mb-0.5 ${styles.title}`}>{title}</div>
        )}
        {children && (
          <div className={`text-sm leading-relaxed ${styles.text}`}>
            {children}
          </div>
        )}
      </div>
      {onClose && (
        <button
          aria-label="Close alert"
          onClick={onClose}
          className={`ml-2 shrink-0 rounded-full p-1 transition hover:opacity-80 focus:outline-none focus:ring-2 ${styles.close}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

function getStyles(variant: Variant) {
  switch (variant) {
    case "error":
      return {
        container:
          "border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/50",
        icon: "text-red-600 dark:text-red-400",
        title: "text-red-900 dark:text-red-300",
        text: "text-red-800 dark:text-red-300/90",
        close:
          "text-red-700 dark:text-red-300 focus:ring-red-300 dark:focus:ring-red-700",
      };
    case "success":
      return {
        container:
          "border-green-200 bg-green-50 text-green-800 dark:border-green-800/60 dark:bg-green-950/50",
        icon: "text-green-600 dark:text-green-400",
        title: "text-green-900 dark:text-green-300",
        text: "text-green-800 dark:text-green-300/90",
        close:
          "text-green-700 dark:text-green-300 focus:ring-green-300 dark:focus:ring-green-700",
      };
    case "warning":
      return {
        container:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50",
        icon: "text-amber-600 dark:text-amber-400",
        title: "text-amber-900 dark:text-amber-300",
        text: "text-amber-800 dark:text-amber-300/90",
        close:
          "text-amber-700 dark:text-amber-300 focus:ring-amber-300 dark:focus:ring-amber-700",
      };
    case "info":
    default:
      return {
        container:
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/50",
        icon: "text-sky-600 dark:text-sky-400",
        title: "text-sky-900 dark:text-sky-300",
        text: "text-sky-800 dark:text-sky-300/90",
        close:
          "text-sky-700 dark:text-sky-300 focus:ring-sky-300 dark:focus:ring-sky-700",
      };
  }
}

function getIcon(variant: Variant) {
  switch (variant) {
    case "error":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l8.36 20.094A1.25 1.25 0 0 1 20.423 25H3.577a1.25 1.25 0 0 1-1.149-1.696L10.788 3.21ZM12 9a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 12 9Zm0 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "success":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M10.28 16.28a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06l2.47 2.47 6.47-6.47a.75.75 0 0 1 1.06 1.06l-7 7Z" />
          <path
            fillRule="evenodd"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM3.75 12a8.25 8.25 0 1 1 16.5 0 8.25 8.25 0 0 1-16.5 0Z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "warning":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            d="M12 2.25a.75.75 0 0 1 .67.417l9 18A.75.75 0 0 1 21 21.75H3a.75.75 0 0 1-.67-1.083l9-18A.75.75 0 0 1 12 2.25ZM12 7.5a.75.75 0 0 0-.75.75v6a.75.75 0 0 0 1.5 0v-6A.75.75 0 0 0 12 7.5Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "info":
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-1 1.5a.75.75 0 0 0 0 1.5h.25a.25.25 0 0 1 .25.25v3a.75.75 0 0 0 1.5 0v-3A1.75 1.75 0 0 0 11.25 10.5H11Z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}
