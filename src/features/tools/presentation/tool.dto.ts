import { Route } from "@/routers/types";
import { StaticImageData } from "next/image";
import { Review } from "@/features/reviews/types";
import { AuthorType, TaxonomyType } from "@/data/types";

export interface ToolDataType {
  id: string | number;
  ownerId?: string | null;
  author: AuthorType;
  date: string;
  href: Route<string>;
  title: string;
  featuredImage: StaticImageData | string;
  featuredImageBinary?: Buffer;
  commentCount: number;
  viewCount: number;
  address: string;
  reviewStart: number;
  reviewCount: number;
  like: boolean;
  price: string;
  listingCategory: TaxonomyType;
  saleOff?: string | null;
  isAds?: boolean | null;
  isActive?: boolean; 
  map: {
    lat: number;
    lng: number;
  };
  reviews?: Review[];
  desc?: string; 
  galleryImgs?: string[];
}
