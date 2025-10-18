export interface Review {
    id: number;
    bookingId: number;
    toolId: string;
    reviewer: {
      id: string;
      name: string;
      avatar?: string;
    };
    rating: number;
    communication?: number;
    toolCondition?: number;
    punctuality?: number;
    comment?: string;
    images?: string[];
    response?: string;
    respondedAt?: Date;
    createdAt: Date;
  }
  
  export interface CreateReviewDto {
    bookingId: number;
      toolId?: string;
      revieweeId?: string;    rating: number;
    communication?: number;
    toolCondition?: number;
    punctuality?: number;
    comment?: string;
    images?: string[];
  }
  
  export interface ReviewStatistics {
    averageRating: number;
    totalReviews: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  }