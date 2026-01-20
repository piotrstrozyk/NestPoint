import { Apartment } from '@/features/apartment-list/types/apartment';

export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roles: string[];
  ownedApartments: Apartment[];
  rentals: Apartment[];
  ownedRentals: Apartment[];
  admin: boolean;
  owner: boolean;
  tenant: boolean;
}
