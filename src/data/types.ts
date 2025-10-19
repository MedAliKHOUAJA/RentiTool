import { Route } from "@/routers/types";
import { StaticImageData } from "next/image";

//  ######  CustomLink  ######## //
export interface CustomLink {
  label: string;
  href: Route<string> | string;
  targetBlank?: boolean;
}

//  ##########  PostDataType ######## //
export interface TaxonomyType {
  id: string | number;
  name: string;
  href: Route<string>;
  count?: number;
  thumbnail?: string;
  desc?: string;
  color?: TwMainColor | string;
  taxonomy: "category" | "tag";
  listingType?: "stay" | "experiences" | "car" | "tool";
}

export interface AuthorType {
  id: string | number;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar: string | StaticImageData;
  bgImage?: string | StaticImageData;
  email?: string;
  count: number;
  desc: string;
  jobName: string;
  href: Route<string>;
  starRating?: number;
}

export interface PostDataType {
  id: string | number;
  author: AuthorType;
  date: string;
  href: Route<string>;
  categories: TaxonomyType[];
  title: string;
  featuredImage: StaticImageData | string;
  desc?: string;
  commentCount: number;
  viewdCount: number;
  readingTime: number;
  postType?: "standard" | "video" | "gallery" | "audio";
}

export type TwMainColor =
  | "pink"
  | "green"
  | "yellow"
  | "red"
  | "indigo"
  | "blue"
  | "purple"
  | "gray";

//
export interface StayDataType {
  id: string | number;
  author: AuthorType;
  date: string;
  href: Route<string>;
  title: string;
  featuredImage: StaticImageData | string;
  commentCount: number;
  viewCount: number;
  address: string;
  reviewStart: number;
  reviewCount: number;
  like: boolean;
  galleryImgs: (StaticImageData | string)[];
  price: string;
  listingCategory: TaxonomyType;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  saleOff?: string | null;
  isAds: boolean | null;
  map: {
    lat: number;
    lng: number;
  };
}

//
export interface ExperiencesDataType {
  id: string | number;
  author: AuthorType;
  date: string;
  href: Route<string>;
  title: string;
  featuredImage: StaticImageData | string;
  commentCount: number;
  viewCount: number;
  address: string;
  reviewStart: number;
  reviewCount: number;
  like: boolean;
  galleryImgs: (StaticImageData | string)[];
  price: string;
  listingCategory: TaxonomyType;
  maxGuests: number;
  saleOff?: string | null;
  isAds: boolean | null;
  map: {
    lat: number;
    lng: number;
  };
}

//
export interface CarDataType {
  id: string | number;
  author: AuthorType;
  date: string;
  href: Route<string>;
  title: string;
  featuredImage: StaticImageData | string;
  commentCount: number;
  viewCount: number;
  address: string;
  reviewStart: number;
  reviewCount: number;
  like: boolean;
  galleryImgs: (StaticImageData | string)[];
  price: string;
  listingCategory: TaxonomyType;
  seats: number;
  gearshift: string;
  saleOff?: string | null;
  isAds: boolean | null;
  map: {
    lat: number;
    lng: number;
  };
}

//
export interface ToolDataType {
  id: string | number;
  ownerId?: string | null;
  author: AuthorType;
  date: string;
  href: Route<string>;
  title: string;
  featuredImage: StaticImageData | string;
  desc?: string;
  commentCount: number;
  viewCount: number;
  address: string;
  reviewStart: number;
  reviewCount: number;
  like: boolean;
  galleryImgs: (StaticImageData | string)[];
  price: string;
  listingCategory: TaxonomyType;
  saleOff?: string | null;
  isAds: boolean | null;
  map: {
    lat: number;
    lng: number;
  };
}

// ##########  RentalDataType ######## //
export interface RentalDataType {
  rentalId: number;
  toolId: number;
  ownerId: string;
  renterId: string;
  totalPrice: number;
  rentalDateStart: string;
  rentalDateEnd: string;
  statusId: number;
  createdAt?: string;
  updatedAt?: string;
  toolTitle?: string;
  toolName?: string;
  toolPrice?: number;
  toolOwnerId?: string;
  statusName?: string;
  toolImageUrl?: string;
}

// Payment Types
export interface PaymentDataType {
  paymentId: number;
  amount: number;
  paymentStatusId: number;
  paymentTypeId: number;
  paymentDate: string;
  rentalId: number;
  statusName?: string;
  typeName?: string;
  rentalInfo?: {
    toolName?: string;
    toolId?: number;
    rentalDateStart?: string;
    rentalDateEnd?: string;
  };
}

export interface PaymentStatusType {
  statusId: number;
  statusName: string;
}

export interface PaymentTypeType {
  typeId: number;
  typeName: string;
}

export interface PaymentCreateRequest {
  amount: number;
  paymentTypeId: number;
  rentalId: number;
  paymentStatusId?: number; // Default to 1 (Pending)
}

export interface RentalCreateRequest {
  toolId: number;
  ownerId: string;
  renterId: string;
  totalPrice: number;
  rentalDateStart: string;
  rentalDateEnd: string;
  statusId?: number;
  paymentMethodId?: number;
}

export interface RentalUpdateRequest {
  rentalId: number;
  totalPrice?: number;
  rentalDateStart?: string;
  rentalDateEnd?: string;
  statusId?: number;
}

export interface RentalStatus {
  id: number;
  name: string;
  description?: string;
}
