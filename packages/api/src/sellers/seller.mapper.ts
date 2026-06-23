import type { BostaEnv, SellerDto } from '@cod/shared';

export interface SellerRow {
  id: string;
  email: string;
  businessName: string;
  phone: string | null;
  bostaApiKeyEnc: string | null;
  bostaEnv: string;
  bostaConnectedAt: Date | null;
}

export function toSellerDto(s: SellerRow): SellerDto {
  return {
    id: s.id,
    email: s.email,
    businessName: s.businessName,
    phone: s.phone,
    bosta: {
      connected: !!s.bostaApiKeyEnc,
      env: (s.bostaEnv as BostaEnv) ?? 'staging',
      connectedAt: s.bostaConnectedAt ? s.bostaConnectedAt.toISOString() : null,
    },
  };
}

// Fields to select when building a SellerDto.
export const SELLER_DTO_SELECT = {
  id: true,
  email: true,
  businessName: true,
  phone: true,
  bostaApiKeyEnc: true,
  bostaEnv: true,
  bostaConnectedAt: true,
} as const;
