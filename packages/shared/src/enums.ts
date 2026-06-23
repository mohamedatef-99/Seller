// Single source of truth for status values. MUST stay in sync with prisma schema.
//
// Defined as const objects + union types (NOT `enum`) so they're STRUCTURALLY
// compatible with Prisma's generated string-literal enums. A TS `enum` is a
// nominal type, so Prisma's `"NEW" | ...` would not be assignable to it.
// This pattern keeps both value access (OrderStatus.NEW) and the union type.

export const OrderStatus = {
  NEW: 'NEW',
  PENDING: 'PENDING',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const CodStatus = {
  PENDING: 'PENDING',
  COLLECTED: 'COLLECTED',
  SETTLED: 'SETTLED',
} as const;
export type CodStatus = (typeof CodStatus)[keyof typeof CodStatus];

// Egyptian governorates (subset most common for COD; extend as needed).
export const GOVERNORATES = [
  'Cairo',
  'Giza',
  'Alexandria',
  'Qalyubia',
  'Dakahlia',
  'Sharqia',
  'Gharbia',
  'Monufia',
  'Beheira',
  'Kafr El Sheikh',
  'Damietta',
  'Port Said',
  'Ismailia',
  'Suez',
  'Faiyum',
  'Beni Suef',
  'Minya',
  'Asyut',
  'Sohag',
  'Qena',
  'Luxor',
  'Aswan',
  'Red Sea',
  'New Valley',
  'Matrouh',
  'North Sinai',
  'South Sinai',
] as const;

export type Governorate = (typeof GOVERNORATES)[number];
