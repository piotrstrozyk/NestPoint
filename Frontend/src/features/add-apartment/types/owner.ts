export interface Address {
  street: string;
  apartmentNumber: null;
  city: string;
  postalCode: string;
  country: string;
  fullAddress: string;
}

export interface OwnedApartment {
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
  yardAccess: 'NONE' | 'PRIVATE' | 'SHARED';
  poolAccess: 'NONE' | 'PRIVATE' | 'SHARED';
  disabilityFriendly: boolean;
  poolFee: number;
  propertyType: 'APARTMENT' | 'HOUSE' | string;
  availableDateRanges: { start: string; end: string }[];
  occupiedDateRanges: { start: string; end: string }[];
}

export interface Owner {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roles: string[];
  ownedApartments: OwnedApartment[];
  rentals: unknown[];
}
