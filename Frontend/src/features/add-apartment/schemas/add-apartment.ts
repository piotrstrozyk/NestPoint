import { z } from 'zod';

export const ApartmentSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  address: z.object({
    street: z.string().min(1),
    apartmentNumber: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val?.trim() === '' ? null : val)),
    city: z.string().min(1),
    postalCode: z.string().min(2),
    country: z.string().min(1),
  }),
  size: z.number().min(10),
  rentalPrice: z.number().min(100).max(10000),
  numberOfRooms: z.number().min(1).int(),
  numberOfBeds: z.number().min(1).int(),
  furnished: z.boolean(),
  kitchen: z.enum(['PRIVATE', 'SHARED']),
  wifi: z.boolean(),
  petsAllowed: z.boolean(),
  parkingSpace: z.boolean(),
  yardAccess: z.enum(['NONE', 'SHARED', 'PRIVATE']),
  poolAccess: z.enum(['NONE', 'SHARED', 'PRIVATE']),
  disabilityFriendly: z.boolean(),
  poolFee: z.number().min(0),
  propertyType: z.enum(['APARTMENT', 'ROOM', 'PROPERTY']),
  ownerId: z.number().min(1),
});
export type ApartmentForm = z.infer<typeof ApartmentSchema>;
