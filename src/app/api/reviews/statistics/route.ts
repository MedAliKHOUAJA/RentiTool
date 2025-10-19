
import { NextResponse } from "next/server";
import { ReviewStatistics } from "@/features/reviews/types";

// TODO: Implement this API endpoint
export async function GET() {
  const defaultStats: ReviewStatistics = {
    averageRating: 0,
    totalReviews: 0,
    distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };
  return NextResponse.json(defaultStats);
}
