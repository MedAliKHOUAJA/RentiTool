export interface Image {
    imageId: number;             
    imageBinary: Buffer;         
    userId?: number | null;      
    businessCardId?: number | null; 
    toolId?: number | null;       
    ratingId?: number | null;     
    isPrimaryToolImage: boolean;  
    classificationId?: ClassificationId | null;
  }

  export enum ClassificationId {
    BusinessCardImage = 1,
    UserImage = 2,
    RatingImage = 3,
    ToolImage = 4,
  }
  
  export interface ClassificationImage {
    classificationId: ClassificationId;
    classificationName: string;  
  }