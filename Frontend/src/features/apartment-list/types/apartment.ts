export interface Address {
  street: string;
  apartmentNumber: string;
  city: string;
  postalCode: string;
  country: string;
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Apartment {
  id: number;
  title: string;
  description: string;
  address: Address;
  size: number;
  rentalPrice: number;
  numberOfRooms: number;
  numberOfBeds: number;
  furnished: boolean;
  currentlyOccupied: boolean;
  ownerId: number;
  kitchen: 'PRIVATE' | 'SHARED';
  wifi: boolean;
  petsAllowed: boolean;
  parkingSpace: boolean;
  yardAccess: 'NONE' | 'SHARED' | 'PRIVATE';
  poolAccess: 'NONE' | 'SHARED' | 'PRIVATE';
  disabilityFriendly: boolean;
  poolFee: number;
  propertyType: 'APARTMENT' | 'ROOM' | 'PROPERTY';
  availableDateRanges: DateRange[];
  occupiedDateRanges: DateRange[];
  photoUrls: string[] | null;
  coordinates: {
    lat: number;
    lng: number;
  };
}
