
import { Tool } from "@/features/tools/domain/tool";
import { ToolDataType } from "@/data/types";
import { Route } from "@/routers/types";

export class ToolPresenter {
  static toToolDataType(tool: Tool): ToolDataType {
    return {
      id: tool.toolId,
      author: {
        id: tool.owner.userId,
        firstName: tool.owner.firstName,
        lastName: tool.owner.lastName,
        displayName: `${tool.owner.firstName} ${tool.owner.lastName}`,
        avatar: "/images/avatars/avatar-1.jpg", // placeholder
        count: 0,
        desc: "",
        jobName: "",
        href: "/author" as Route,
        starRating: 0,
      },
      date: new Date().toISOString(),
      href: `/listing-tool-detail/${tool.toolId}` as Route,
      title: tool.title,
      featuredImage: tool.imageUrl || "/images/placeholder-large.png",
      desc: tool.description,
      commentCount: 0, // needs to be implemented
      viewCount: 0, // needs to be implemented
      address: "", // needs to be implemented
      reviewStart: 0, // needs to be implemented
      reviewCount: 0, // needs to be implemented
      like: false, // needs to be implemented
      galleryImgs: tool.imageUrl ? [tool.imageUrl] : ["/images/placeholder-large.png"],
      price: `${tool.rentalPricePerDay}€/jour`,
      listingCategory: {
        id: tool.categoryId,
        name: "Category", // needs to be implemented
        href: "/",
        taxonomy: "category",
      },
      saleOff: null,
      isAds: null,
      map: { lat: 48.8566, lng: 2.3522 }, // placeholder
    };
  }
}
