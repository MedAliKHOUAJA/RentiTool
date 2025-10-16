import React, { FC } from "react";
import { ToolDataType } from "@/data/types";
import StartRating from "@/components/StartRating";
import BtnLikeIcon from "@/components/BtnLikeIcon";
import SaleOffBadge from "@/components/SaleOffBadge";
import Badge from "@/shared/Badge";
import Image from "next/image";
import Link from "next/link";


export interface ToolCardProps {
  className?: string;
  data: ToolDataType;
  size?: "default" | "small";
  onDelete?: (() => void) | undefined; // when provided, show a delete icon
  showLike?: boolean; // show like/fav heart
  onEdit?: (() => void) | undefined; // when provided, show an edit icon
}

const ToolCard: FC<ToolCardProps> = ({
  size = "default",
  className = "",
  data,
  onDelete,
  showLike = true,
  onEdit,
}) => {
  const {
    featuredImage,
    title,
    href,
    like,
    saleOff,
    isAds,
    price,
    reviewStart,
    reviewCount,
  } = data;

  const hasActions = Boolean(onEdit || onDelete);

  const renderSliderGallery = () => {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden">
        <div className="aspect-w-16 aspect-h-9 ">
          <Image
            fill
            src={featuredImage}
            alt={title}
            sizes="(max-width: 640px) 100vw, 350px"
          />
        </div>
        {showLike && !hasActions && (
          <BtnLikeIcon isLiked={like} className="absolute right-3 top-3 z-[1]" />
        )}
        {saleOff && <SaleOffBadge className="absolute left-3 top-3" />}
      </div>
    );
  };

  const renderContent = () => {
    return (
      <div className={size === "default" ? "p-5  space-y-4" : "p-3  space-y-2"}>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {isAds && <Badge name="ADS" color="green" />}
            <h2
              className={`capitalize ${
                size === "default"
                  ? "text-xl font-semibold"
                  : "text-base font-medium"
              }`}
            >
              <span className="line-clamp-1">{title}</span>
            </h2>
          </div>
        </div>
        <div className="w-14  border-b border-neutral-100 dark:border-neutral-800"></div>
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold">
            {price}€
            {` `}
            {size === "default" && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400 font-normal">
                /jour
              </span>
            )}
          </span>
          <StartRating reviewCount={reviewCount} point={reviewStart} />
        </div>
      </div>
    );
  };

  return (
    <div
      className={`nc-ToolCard group relative border border-neutral-200 dark:border-neutral-700 rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 ${className}`}
      data-nc-id="ToolCard"
    >
      <Link href={href} className="flex flex-col">
        <div className={hasActions ? 'transition-all duration-200 group-hover:blur-sm' : ''}>
          {renderSliderGallery()}
          {renderContent()}
        </div>
      </Link>

      {/* Hover overlay for actions */}
      {hasActions && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="pointer-events-auto inline-flex items-center gap-3 bg-black/40 text-white px-4 py-3 rounded-full backdrop-blur-sm shadow-lg">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
                title="Edit tool"
                aria-label="Edit tool"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712Z" />
                  <path d="M3 17.25V21h3.75L19.31 8.44l-3.712-3.712L3 17.25Z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                title="Delete tool"
                aria-label="Delete tool"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M9 3.75A2.25 2.25 0 0 1 11.25 1.5h1.5A2.25 2.25 0 0 1 15 3.75V4.5h3.75a.75.75 0 0 1 0 1.5H18l-1.03 13.39A2.25 2.25 0 0 1 14.73 21.75H9.27a2.25 2.25 0 0 1-2.24-2.36L6 6h-.75a.75.75 0 0 1 0-1.5H9V3.75Zm1.5.75h3V3.75a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75V4.5ZM8.25 6l1 13.06c.03.41.37.69.77.69h5.96c.4 0 .74-.28.77-.69L17.75 6H8.25Zm2.25 3a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5c0-.41.34-.75.75-.75Zm4.5 0a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5c0-.41.34-.75.75-.75Z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCard;