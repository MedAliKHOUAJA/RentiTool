import __stayListing from "./jsons/__stayListing.json";
import __carsListing from "./jsons/__carsListing.json";
import __experiencesListing from "./jsons/__experiencesListing.json";
import __toolListing from "./jsons/__toolListing.json";
import {
  DEMO_STAY_CATEGORIES,
  DEMO_EXPERIENCES_CATEGORIES,
  DEMO_TOOL_CATEGORIES,
} from "./taxonomies";
import { CarDataType, ExperiencesDataType, StayDataType } from "./types";
import { ToolDataType } from "@/features/tools/presentation/tool.dto";
import { DEMO_AUTHORS } from "./authors";
import car1 from "@/images/cars/1.png";
import car2 from "@/images/cars/2.png";
import car3 from "@/images/cars/3.png";
import car4 from "@/images/cars/4.png";
import car5 from "@/images/cars/5.png";
import car6 from "@/images/cars/6.png";
import car7 from "@/images/cars/7.png";
import car8 from "@/images/cars/8.png";
import car9 from "@/images/cars/9.png";
import car10 from "@/images/cars/10.png";
import car11 from "@/images/cars/11.png";
import car12 from "@/images/cars/12.png";
import car13 from "@/images/cars/13.png";
import car14 from "@/images/cars/14.png";
import car15 from "@/images/cars/15.png";
import car16 from "@/images/cars/16.png";
import { Route } from "@/routers/types";

const carsImgs = [
  car1, car2, car3, car4, car5, car6, car7, car8,
  car9, car10, car11, car12, car13, car14, car15, car16,
];

const DEMO_STAY_LISTINGS = __stayListing.map((post, index): StayDataType => {
  const category = DEMO_STAY_CATEGORIES.filter(
    (taxonomy) => taxonomy.id === post.listingCategoryId
  )[0];
  return {
    ...post,
    id: `stayListing_${index}_`,
    saleOff: !index ? "-20% today" : post.saleOff,
    isAds: !index ? true : post.isAds,
    author: DEMO_AUTHORS.filter((user) => user.id === post.authorId)[0],
    listingCategory: category,
    href: post.href as Route,
  };
});

const DEMO_EXPERIENCES_LISTINGS = __experiencesListing.map(
  (post, index): ExperiencesDataType => {
    const category = DEMO_EXPERIENCES_CATEGORIES.filter(
      (taxonomy) => taxonomy.id === post.listingCategoryId
    )[0];
    return {
      ...post,
      id: `experiencesListing_${index}_`,
      saleOff: !index ? "-20% today" : post.saleOff,
      isAds: !index ? true : post.isAds,
      author: DEMO_AUTHORS.filter((user) => user.id === post.authorId)[0],
      listingCategory: category,
      href: post.href as Route,
    };
  }
);

const DEMO_CAR_LISTINGS = __carsListing.map((post, index): CarDataType => {
  const category = DEMO_EXPERIENCES_CATEGORIES.filter(
    (taxonomy) => taxonomy.id === post.listingCategoryId
  )[0];
  return {
    ...post,
    id: `carsListing_${index}_`,
    saleOff: !index ? "-20% today" : post.saleOff,
    isAds: !index ? true : post.isAds,
    author: DEMO_AUTHORS.filter((user) => user.id === post.authorId)[0],
    listingCategory: category,
    featuredImage: carsImgs[index],
    href: post.href as Route,
  };
});

const DEMO_TOOL_LISTINGS = __toolListing.map((post, index): ToolDataType => {
  const category = DEMO_TOOL_CATEGORIES.filter(
    (taxonomy) => taxonomy.id === post.listingCategoryId
  )[0];
  return {
    ...post,
    id: post.id,
    author: DEMO_AUTHORS.filter((user) => user.id === post.authorId)[0],
    listingCategory: category,
    href: `/listing-tool-detail?id=${post.id}` as Route,
    saleOff: !index ? "-15% today" : post.saleOff,
    isAds: !index ? true : post.isAds,
  };
});

export { DEMO_STAY_LISTINGS, DEMO_EXPERIENCES_LISTINGS, DEMO_CAR_LISTINGS, DEMO_TOOL_LISTINGS };