"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import Image, { StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { variants } from "@/utils/animationVariants";
import Link from "next/link";
import { Route } from "@/routers/types";

export interface GallerySliderProps {
  className?: string;
  galleryImgs: (StaticImageData | string)[];
  ratioClass?: string;
  href?: Route<string>;
  imageClass?: string;
  galleryClass?: string;
  navigation?: boolean;
  enablePreview?: boolean;
  hoverZoom?: boolean;
  hoverZoomScale?: number;
}

export default function GallerySlider({
  className = "",
  galleryImgs,
  ratioClass = "aspect-w-4 aspect-h-3",
  imageClass = "",
  galleryClass = "rounded-xl",
  href = "/listing-stay-detail" as Route,
  navigation = true,
  enablePreview = true,
  hoverZoom = true,
  hoverZoomScale = 1.8,
}: GallerySliderProps) {
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const dragRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
  }>({ dragging: false, startX: 0, startY: 0, lastX: 0, lastY: 0 });
  const pinchRef = useRef<{
    pinching: boolean;
    startDist: number;
    startZoom: number;
  }>({ pinching: false, startDist: 0, startZoom: 1 });
  const [hoverActive, setHoverActive] = useState(false);
  const [hoverOrigin, setHoverOrigin] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  // Ensure we always have at least one image to render
  const images =
    Array.isArray(galleryImgs) && galleryImgs.filter(Boolean).length > 0
      ? galleryImgs.filter(Boolean)
      : ["/images/placeholder-large.png"];

  // Keep current index within bounds if images change
  useEffect(() => {
    if (index > images.length - 1) setIndex(0);
  }, [images.length]);

  useEffect(() => {
    if (!isPreviewOpen) return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isPreviewOpen]);

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));
  const clampOffset = (x: number, y: number, z: number) => {
    // Compute bounds so image cannot be dragged out completely
    const maxX = Math.max(0, (z - 1) * (containerSize.w / 2));
    const maxY = Math.max(0, (z - 1) * (containerSize.h / 2));
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  };

  const openPreview = () => {
    setIsPreviewOpen(true);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!enablePreview) return;
    e.preventDefault();
    const delta = -e.deltaY; // wheel up zooms in
    const factor = delta > 0 ? 1.1 : 0.9;
    const newZoom = clamp(zoom * factor, 1, 4);
    // Optional: adjust offset so zoom centers around cursor (approximate)
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      const scaleRatio = newZoom / zoom;
      const nx = cx - (cx - offset.x) * scaleRatio;
      const ny = cy - (cy - offset.y) * scaleRatio;
      const clamped = clampOffset(nx, ny, newZoom);
      setOffset(clamped);
    }
    setZoom(newZoom);
  };

  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (zoom <= 1) return;
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.lastX = offset.x;
    dragRef.current.lastY = offset.y;
  };
  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const { x, y } = clampOffset(
      dragRef.current.lastX + dx,
      dragRef.current.lastY + dy,
      zoom
    );
    setOffset({ x, y });
  };
  const onMouseUp: React.MouseEventHandler<HTMLDivElement> = () => {
    dragRef.current.dragging = false;
  };

  const dist = (
    t1: { clientX: number; clientY: number },
    t2: { clientX: number; clientY: number }
  ) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (e.touches.length === 2) {
      pinchRef.current.pinching = true;
      pinchRef.current.startDist = dist(e.touches[0], e.touches[1]);
      pinchRef.current.startZoom = zoom;
    } else if (e.touches.length === 1 && zoom > 1) {
      dragRef.current.dragging = true;
      dragRef.current.startX = e.touches[0].clientX;
      dragRef.current.startY = e.touches[0].clientY;
      dragRef.current.lastX = offset.x;
      dragRef.current.lastY = offset.y;
    }
  };
  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (pinchRef.current.pinching && e.touches.length === 2) {
      e.preventDefault();
      const d = dist(e.touches[0], e.touches[1]);
      const factor = d / (pinchRef.current.startDist || 1);
      const newZoom = clamp(pinchRef.current.startZoom * factor, 1, 4);
      setZoom(newZoom);
      // Keep offsets clamped
      const clamped = clampOffset(offset.x, offset.y, newZoom);
      setOffset(clamped);
    } else if (dragRef.current.dragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragRef.current.startX;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      const { x, y } = clampOffset(
        dragRef.current.lastX + dx,
        dragRef.current.lastY + dy,
        zoom
      );
      setOffset({ x, y });
    }
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    pinchRef.current.pinching = false;
    dragRef.current.dragging = false;
  };

  const onDoubleClick: React.MouseEventHandler<HTMLDivElement> = () => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  function changePhotoId(newVal: number) {
    if (newVal > index) {
      setDirection(1);
    } else {
      setDirection(-1);
    }
    setIndex(newVal);
  }

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (index < images?.length - 1) {
        changePhotoId(index + 1);
      }
    },
    onSwipedRight: () => {
      if (index > 0) {
        changePhotoId(index - 1);
      }
    },
    trackMouse: true,
  });

  let currentImage = images[Math.min(index, images.length - 1)];

  const showArrows = loaded && navigation && images.length > 1;
  const showDots = navigation && images.length > 1;
  const hoverStyle =
    hoverActive && hoverZoom && !isPreviewOpen
      ? ({
          transform: `scale(${hoverZoomScale})`,
          transformOrigin: `${hoverOrigin.x}% ${hoverOrigin.y}%`,
        } as React.CSSProperties)
      : undefined;

  const updateHoverOrigin = (e: React.MouseEvent<HTMLElement>) => {
    if (!hoverZoom) return;
    const el = e.currentTarget as HTMLElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoverOrigin({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  return (
    <MotionConfig
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
    >
      <div
        className={`relative group group/cardGallerySlider ${className}`}
        {...handlers}
      >
        {/* Main image */}
        <div className={`relative w-full overflow-hidden ${galleryClass}`}>
          {href && !enablePreview ? (
            <Link
              href={href}
              className={`relative w-full flex items-center justify-center ${ratioClass}`}
              onMouseEnter={() => setHoverActive(true)}
              onMouseMove={updateHoverOrigin}
              onMouseLeave={() => setHoverActive(false)}
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={index}
                  custom={direction}
                  variants={variants(340, 1)}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0" style={hoverStyle}>
                    <Image
                      src={currentImage || ""}
                      fill
                      alt="listing card gallery"
                      className={imageClass || "object-cover"}
                      onLoadingComplete={() => setLoaded(true)}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => enablePreview && setIsPreviewOpen(true)}
              className={`relative w-full flex items-center justify-center ${ratioClass} cursor-zoom-in`}
              onMouseEnter={() => setHoverActive(true)}
              onMouseMove={updateHoverOrigin}
              onMouseLeave={() => setHoverActive(false)}
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={index}
                  custom={direction}
                  variants={variants(340, 1)}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0" style={hoverStyle}>
                    <Image
                      src={currentImage || ""}
                      fill
                      alt="listing card gallery"
                      className={imageClass || "object-cover"}
                      onLoadingComplete={() => setLoaded(true)}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </button>
          )}
        </div>

        {/* Buttons + bottom nav bar */}
        <>
          {/* Buttons */}
          {showArrows && (
            <div className="opacity-0 group-hover/cardGallerySlider:opacity-100 transition-opacity ">
              {index > 0 && (
                <button
                  className="absolute w-8 h-8 left-3 top-[calc(50%-16px)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-6000 dark:hover:border-neutral-500 rounded-full flex items-center justify-center hover:border-neutral-300 focus:outline-none"
                  style={{ transform: "translate3d(0, 0, 0)" }}
                  onClick={() => changePhotoId(index - 1)}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
              )}
              {index + 1 < images.length && (
                <button
                  className="absolute w-8 h-8 right-3 top-[calc(50%-16px)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-6000 dark:hover:border-neutral-500 rounded-full flex items-center justify-center hover:border-neutral-300 focus:outline-none"
                  style={{ transform: "translate3d(0, 0, 0)" }}
                  onClick={() => changePhotoId(index + 1)}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Bottom Nav bar */}
          {showDots && (
            <>
              <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-neutral-900 opacity-50 rounded-b-lg"></div>
              <div className="flex items-center justify-center absolute bottom-2 left-1/2 transform -translate-x-1/2 space-x-1.5">
                {images.map((_, i) => (
                  <button
                    className={`w-1.5 h-1.5 rounded-full ${
                      i === index ? "bg-white" : "bg-white/60 "
                    }`}
                    onClick={() => changePhotoId(i)}
                    key={i}
                  />
                ))}
              </div>
            </>
          )}
        </>
        {/* Preview Modal */}
        {enablePreview && isPreviewOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={closePreview}
          >
            <div
              ref={containerRef}
              className="relative w-[80vw] h-[80vh] select-none"
              onClick={(e) => e.stopPropagation()}
              onWheel={handleWheel}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onDoubleClick={onDoubleClick}
            >
              <div
                className="absolute inset-0"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                }}
              >
                <Image
                  src={currentImage || ""}
                  fill
                  alt="preview"
                  className="object-contain"
                  sizes="80vw"
                />
              </div>
              {/* Close button */}
              <button
                type="button"
                className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center"
                onClick={closePreview}
                aria-label="Close preview"
              >
                ×
              </button>
              {/* Zoom controls */}
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center text-xl"
                  onClick={() => setZoom((z) => clamp(z * 0.9, 1, 4))}
                  aria-label="Zoom out"
                >
                  −
                </button>
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center text-xl"
                  onClick={() => setZoom((z) => clamp(z * 1.1, 1, 4))}
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  type="button"
                  className="ml-1 px-3 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center text-sm"
                  onClick={() => {
                    setZoom(1);
                    setOffset({ x: 0, y: 0 });
                  }}
                  aria-label="Reset zoom"
                >
                  Reset
                </button>
              </div>
              {/* Prev/Next inside modal */}
              {images.length > 1 && (
                <>
                  {index > 0 && (
                    <button
                      type="button"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center"
                      onClick={() => changePhotoId(index - 1)}
                      aria-label="Previous image"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                  )}
                  {index + 1 < images.length && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center"
                      onClick={() => changePhotoId(index + 1)}
                      aria-label="Next image"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
