import { z } from 'zod';

export const createAuctionSchema = z.object({
  apartmentId: z.number(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start time',
  }),
  endTime: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end time' }),
  startingPrice: z
    .number({ invalid_type_error: 'Starting price must be a number' })
    .positive('Starting price must be positive'),
  minimumBidIncrement: z
    .number({ invalid_type_error: 'Minimum bid increment must be a number' })
    .positive('Minimum bid increment must be positive'),
  rentalStartDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Rental start date must be valid',
  }),
  rentalEndDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Rental end date must be valid',
  }),
  maxBidders: z
    .number({ invalid_type_error: 'Max bidders must be a number' })
    .int('Max bidders must be an integer')
    .positive('Max bidders must be greater than 0'),
});

export type CreateAuctionData = z.infer<typeof createAuctionSchema>;
