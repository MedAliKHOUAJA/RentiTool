import { ToolDataType } from "./types";
import { DEMO_AUTHORS } from "./authors";
import { DEMO_TOOL_CATEGORIES } from "./taxonomies";
import { Route } from "@/routers/types";

// DB entity shape for Tool (matches your Postgres table columns)
// Columns: ToolId (PK, integer), OwnerId (uuid), Title (varchar), Description (text),
// CategoryId (integer), SubCategoryId (integer), Brand (varchar), Model (varchar),
// RentalPricePerDay (numeric), RentalPricePerWeek (numeric), IsActive (boolean), StatusId (integer)
export interface ToolEntity {
  toolId: number;
  ownerId: string; // uuid
  title: string;
  description: string | null;
  categoryId: number;
  subCategoryId: number | null;
  brand: string | null;
  model: string | null;
  rentalPricePerDay: number | null;
  rentalPricePerWeek: number | null;
  isActive: boolean;
  statusId: number | null;
}

const DEMO_TOOLS_LISTINGS: ToolDataType[] = [
  {
    id: "tool_1",
    author: DEMO_AUTHORS[0],
    date: "2023-10-26",
    href: "/listing-tool-detail?id=tool_1" as Route,
    title: "Perceuse-visseuse sans fil Pro",
    featuredImage: "/images/placeholder-large.png",
    desc: "Une perceuse-visseuse sans fil puissante et polyvalente, idéale pour tous vos travaux de bricolage et d'assemblage.",
    commentCount: 28,
    viewCount: 1480,
    address: "Paris, France",
    reviewStart: 4.8,
    reviewCount: 34,
    like: false,
    galleryImgs: [
      "/images/placeholder-large.png",
      "/images/placeholder-large.png",
      "/images/placeholder-large.png",
    ],
    price: "15",
    listingCategory: DEMO_TOOL_CATEGORIES.find((c) => c.id === 10)!,
    saleOff: "-10%",
    isAds: null,
    map: { lat: 48.8566, lng: 2.3522 },
  },
  {
    id: "tool_2",
    author: DEMO_AUTHORS[1],
    date: "2023-10-27",
    href: "/listing-tool-detail?id=tool_2" as Route,
    title: "Tondeuse à gazon électrique",
    featuredImage: "/images/placeholder-large.png",
    desc: "Tondeuse électrique légère et facile à manier, parfaite pour les jardins de petite à moyenne taille.",
    commentCount: 12,
    viewCount: 980,
    address: "Lyon, France",
    reviewStart: 4.5,
    reviewCount: 21,
    like: true,
    galleryImgs: [
      "/images/placeholder-large.png",
      "/images/placeholder-large.png",
    ],
    price: "25",
    listingCategory: DEMO_TOOL_CATEGORIES.find((c) => c.id === 11)!,
    saleOff: null,
    isAds: true,
    map: { lat: 45.764, lng: 4.8357 },
  },
  {
    id: "tool_3",
    author: DEMO_AUTHORS[2],
    date: "2023-10-28",
    href: "/listing-tool-detail?id=tool_3" as Route,
    title: "Scie circulaire haute performance",
    featuredImage: "/images/placeholder-large.png",
    desc: "Scie circulaire puissante pour des coupes précises et rapides dans le bois.",
    commentCount: 18,
    viewCount: 1100,
    address: "Marseille, France",
    reviewStart: 4.9,
    reviewCount: 25,
    like: false,
    galleryImgs: [
      "/images/placeholder-large.png",
      "/images/placeholder-large.png",
    ],
    price: "20",
    listingCategory: DEMO_TOOL_CATEGORIES.find((c) => c.id === 10)!,
    saleOff: "-5%",
    isAds: null,
    map: { lat: 43.2965, lng: 5.3698 },
  },
  {
    id: "tool_4",
    author: DEMO_AUTHORS[3],
    date: "2023-10-29",
    href: "/listing-tool-detail?id=tool_4" as Route,
    title: "Bétonnière de chantier 160L",
    featuredImage: "/images/placeholder-large.png",
    desc: "Bétonnière robuste de 160 litres, parfaite pour les petits et moyens chantiers.",
    commentCount: 35,
    viewCount: 2500,
    address: "Lille, France",
    reviewStart: 4.7,
    reviewCount: 40,
    like: false,
    galleryImgs: [
      "/images/placeholder-large.png",
      "/images/placeholder-large.png",
    ],
    price: "40",
    listingCategory: DEMO_TOOL_CATEGORIES.find((c) => c.id === 12)!,
    saleOff: null,
    isAds: null,
    map: { lat: 50.6292, lng: 3.0573 },
  },
];

export { DEMO_TOOLS_LISTINGS };
