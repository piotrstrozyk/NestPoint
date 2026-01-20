import { createAuctionSchema } from '@/features/auctions/schemas/create-auction-schema';
import { describe, expect, it } from 'vitest';

describe('createAuctionSchema', () => {
  const validAuctionData = {
    apartmentId: 123,
    startTime: '2025-07-01T12:00:00Z',
    endTime: '2025-07-02T12:00:00Z',
    startingPrice: 1000,
    minimumBidIncrement: 50,
    rentalStartDate: '2025-08-01T00:00:00Z',
    rentalEndDate: '2026-08-01T00:00:00Z',
    maxBidders: 10,
  };

  it('should validate correct data', () => {
    const result = createAuctionSchema.safeParse(validAuctionData);
    expect(result.success).toBe(true);
  });

  // apartmentId tests
  it('should reject when apartmentId is not a number', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      apartmentId: 'not-a-number',
    });
    expect(result.success).toBe(false);
  });

  // startTime tests
  it('should reject invalid startTime format', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      startTime: 'invalid-date',
    });
    expect(result.success).toBe(false);
  });

  // endTime tests
  it('should reject invalid endTime format', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      endTime: 'invalid-date',
    });
    expect(result.success).toBe(false);
  });

  // startingPrice tests
  it('should reject when startingPrice is not a number', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      startingPrice: 'not-a-number',
    });
    expect(result.success).toBe(false);
  });

  it('should reject when startingPrice is negative', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      startingPrice: -100,
    });
    expect(result.success).toBe(false);
  });

  // minimumBidIncrement tests
  it('should reject when minimumBidIncrement is not a number', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      minimumBidIncrement: 'not-a-number',
    });
    expect(result.success).toBe(false);
  });

  it('should reject when minimumBidIncrement is negative', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      minimumBidIncrement: -10,
    });
    expect(result.success).toBe(false);
  });

  // rentalStartDate tests
  it('should reject invalid rentalStartDate format', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      rentalStartDate: 'invalid-date',
    });
    expect(result.success).toBe(false);
  });

  // rentalEndDate tests
  it('should reject invalid rentalEndDate format', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      rentalEndDate: 'invalid-date',
    });
    expect(result.success).toBe(false);
  });

  // maxBidders tests
  it('should reject when maxBidders is not a number', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      maxBidders: 'not-a-number',
    });
    expect(result.success).toBe(false);
  });

  it('should reject when maxBidders is not an integer', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      maxBidders: 5.5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject when maxBidders is negative', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      maxBidders: -5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject when maxBidders is zero', () => {
    const result = createAuctionSchema.safeParse({
      ...validAuctionData,
      maxBidders: 0,
    });
    expect(result.success).toBe(false);
  });
});
