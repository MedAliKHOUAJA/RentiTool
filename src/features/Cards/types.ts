// src/features/Cards/types.ts
export interface Card {
  CardId: number;
  UserId: string;
  JobTitle: string;
  CompanyName: string;
  WebSite: string | null;
  QrCodeUrl: string | null;
  SocialLinks: Record<string, string> | null;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string | null;
  Governorate: string | null;
  Delegation: string | null;
  Postalcode: string | null;
  ProfilePictureUrl: string | null;
  CompanyLogoUrl: string | null;
  IsFavorite?: boolean;
  IsArchived?: boolean;
  Notes?: string;
  ReceivedAt?: string;
  SpecialtiesAndExpertise?: string[] | null;
  Tags?: string[] | null;
}