import { IsString, IsNumber, IsOptional, IsLatitude, IsLongitude } from 'class-validator';

export class SearchVenuesDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsOptional()
  @IsNumber()
  radiusKm?: number; // default 5km

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class VenueDetailsResponseDto {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  coverImage?: string;
  
  // Real-time presence data
  presenceCount: number;
  buysCount: number;
  receivesCount: number;
  
  createdAt: Date;
}

export class VenueListResponseDto {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  distance: number; // in km
  
  // Real-time presence data
  presenceCount: number;
  buysCount: number;
  receivesCount: number;
  
  coverImage?: string;
}

export class SetPresenceDto {
  @IsString()
  venueId: string;

  @IsOptional()
  wantsToBuy?: boolean;

  @IsOptional()
  wantsToReceive?: boolean;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}

export class ClearPresenceDto {
  @IsString()
  venueId: string;
}

export class PresenceResponseDto {
  userId: string;
  displayName: string;
  profileImage?: string;
  venueId: string;
  wantsToBuy: boolean;
  wantsToReceive: boolean;
  distance?: number;
  lastSeen: Date;
}
