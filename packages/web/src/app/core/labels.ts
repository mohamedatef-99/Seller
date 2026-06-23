import { CodStatus, OrderStatus } from '@cod/shared';

// Arabic labels + Tailwind chip classes per status.

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: 'جديد',
  [OrderStatus.PENDING]: 'بانتظار الشحن',
  [OrderStatus.IN_TRANSIT]: 'في الطريق',
  [OrderStatus.DELIVERED]: 'تم التسليم',
  [OrderStatus.RETURNED]: 'مرتجع',
  [OrderStatus.CANCELLED]: 'ملغي',
};

export const ORDER_STATUS_CHIP: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: 'bg-slate-100 text-slate-700',
  [OrderStatus.PENDING]: 'bg-amber-100 text-amber-800',
  [OrderStatus.IN_TRANSIT]: 'bg-blue-100 text-blue-800',
  [OrderStatus.DELIVERED]: 'bg-emerald-100 text-emerald-800',
  [OrderStatus.RETURNED]: 'bg-rose-100 text-rose-800',
  [OrderStatus.CANCELLED]: 'bg-slate-200 text-slate-500',
};

export const COD_STATUS_LABEL: Record<CodStatus, string> = {
  [CodStatus.PENDING]: 'لم يُحصّل',
  [CodStatus.COLLECTED]: 'محصّل لدى الشحن',
  [CodStatus.SETTLED]: 'وصلك',
};

export const COD_STATUS_CHIP: Record<CodStatus, string> = {
  [CodStatus.PENDING]: 'bg-slate-100 text-slate-600',
  [CodStatus.COLLECTED]: 'bg-amber-100 text-amber-800',
  [CodStatus.SETTLED]: 'bg-emerald-100 text-emerald-800',
};

// Arabic display names for governorates (values stay the English @cod/shared keys).
export const GOVERNORATE_LABEL_AR: Record<string, string> = {
  Cairo: 'القاهرة',
  Giza: 'الجيزة',
  Alexandria: 'الإسكندرية',
  Qalyubia: 'القليوبية',
  Dakahlia: 'الدقهلية',
  Sharqia: 'الشرقية',
  Gharbia: 'الغربية',
  Monufia: 'المنوفية',
  Beheira: 'البحيرة',
  'Kafr El Sheikh': 'كفر الشيخ',
  Damietta: 'دمياط',
  'Port Said': 'بورسعيد',
  Ismailia: 'الإسماعيلية',
  Suez: 'السويس',
  Faiyum: 'الفيوم',
  'Beni Suef': 'بني سويف',
  Minya: 'المنيا',
  Asyut: 'أسيوط',
  Sohag: 'سوهاج',
  Qena: 'قنا',
  Luxor: 'الأقصر',
  Aswan: 'أسوان',
  'Red Sea': 'البحر الأحمر',
  'New Valley': 'الوادي الجديد',
  Matrouh: 'مطروح',
  'North Sinai': 'شمال سيناء',
  'South Sinai': 'جنوب سيناء',
};

export function governorateAr(key: string): string {
  return GOVERNORATE_LABEL_AR[key] ?? key;
}

const EGP = new Intl.NumberFormat('en-EG', {
  maximumFractionDigits: 0,
});

// Keep digits Latin (sellers read prices in Latin numerals); unit in Arabic.
export function egp(value: number): string {
  return `${EGP.format(value)} ج.م`;
}
