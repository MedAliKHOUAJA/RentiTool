// src/features/Cards/types.ts
export interface Card {
  CardId: number;
  UserId: string;
  JobTitle: string;
  CompanyName: string;
  WebSite: string | null;
  QrCodeUrl: string | null;
  SocialLinks: { [key: string]: string } | null;
  BackgroundColor?: string;
  TextColor?: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: number | null;
  Governorate?: string;
  Delegation?: string;
  Postalcode?: number;
  ProfilePictureUrl?: string | null;
  CompanyLogoUrl?: string | null;
}