import { PrismaClient, OrderStatus, CodStatus, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@cod.eg';
const DEMO_PASSWORD = 'password123';

// Helper: build an order with items + a consistent COD ledger row.
type SeedItem = { productKey: string; quantity: number };
type SeedOrder = {
  customerName: string;
  customerPhone: string;
  addressLine: string;
  governorate: string;
  status: OrderStatus;
  shippingFee: number;
  items: SeedItem[];
  trackingNumber?: string;
  // ledger intent
  cod: CodStatus;
  daysAgo: number;
};

async function main() {
  console.log('Resetting demo data...');
  // Clean slate for the demo seller (idempotent reseed).
  const existing = await prisma.seller.findUnique({
    where: { email: DEMO_EMAIL },
  });
  if (existing) {
    await prisma.seller.delete({ where: { id: existing.id } });
  }

  const passwordHash = await argon2.hash(DEMO_PASSWORD);
  const seller = await prisma.seller.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash,
      businessName: 'Nour Boutique',
      phone: '+201001234567',
    },
  });
  console.log(`Seller: ${seller.email} (pw: ${DEMO_PASSWORD})`);

  // ---- Products ----
  const productSeed = [
    { key: 'abaya', name: 'Abaya — Black', price: 650, sku: 'AB-BLK' },
    { key: 'hijab', name: 'Hijab Set (3pc)', price: 220, sku: 'HJ-3PC' },
    { key: 'dress', name: 'Summer Dress', price: 480, sku: 'DR-SUM' },
    { key: 'bag', name: 'Tote Bag', price: 350, sku: 'BG-TOT' },
    { key: 'perfume', name: 'Oud Perfume 50ml', price: 540, sku: 'PF-OUD' },
    { key: 'sneakers', name: 'Canvas Sneakers', price: 720, sku: 'SN-CAN' },
  ];

  const products: Record<string, { id: string; price: number; name: string }> =
    {};
  for (const p of productSeed) {
    const created = await prisma.product.create({
      data: {
        sellerId: seller.id,
        name: p.name,
        price: new Prisma.Decimal(p.price),
        sku: p.sku,
      },
    });
    products[p.key] = { id: created.id, price: p.price, name: created.name };
  }
  console.log(`Products: ${productSeed.length}`);

  // ---- Orders (15, spread across statuses + COD states) ----
  const orders: SeedOrder[] = [
    // Fresh, not yet shipped — money still pending
    { customerName: 'Mariam Adel', customerPhone: '01112223344', addressLine: '12 Tahrir St, Apt 4', governorate: 'Cairo', status: 'NEW', shippingFee: 60, items: [{ productKey: 'hijab', quantity: 2 }], cod: 'PENDING', daysAgo: 0 },
    { customerName: 'Salma Hassan', customerPhone: '01223334455', addressLine: '5 Gameat St', governorate: 'Giza', status: 'NEW', shippingFee: 60, items: [{ productKey: 'dress', quantity: 1 }], cod: 'PENDING', daysAgo: 1 },

    // Pushed to courier, awaiting pickup — out, owed
    { customerName: 'Aya Mostafa', customerPhone: '01034445566', addressLine: '88 Corniche', governorate: 'Alexandria', status: 'PENDING', shippingFee: 70, items: [{ productKey: 'abaya', quantity: 1 }], cod: 'PENDING', daysAgo: 2, trackingNumber: 'BOSTA-100231' },
    { customerName: 'Hana Tarek', customerPhone: '01156667788', addressLine: '3 Nile View', governorate: 'Qalyubia', status: 'PENDING', shippingFee: 65, items: [{ productKey: 'perfume', quantity: 1 }, { productKey: 'hijab', quantity: 1 }], cod: 'PENDING', daysAgo: 2, trackingNumber: 'BOSTA-100232' },

    // In transit — out, owed
    { customerName: 'Nada Sami', customerPhone: '01267778899', addressLine: '21 El Horreya', governorate: 'Dakahlia', status: 'IN_TRANSIT', shippingFee: 70, items: [{ productKey: 'sneakers', quantity: 1 }], cod: 'PENDING', daysAgo: 3, trackingNumber: 'BOSTA-100233' },
    { customerName: 'Reem Fouad', customerPhone: '01089990011', addressLine: '7 Geish St', governorate: 'Sharqia', status: 'IN_TRANSIT', shippingFee: 70, items: [{ productKey: 'bag', quantity: 2 }], cod: 'PENDING', daysAgo: 4, trackingNumber: 'BOSTA-100234' },
    { customerName: 'Yasmin Ali', customerPhone: '01101112233', addressLine: '14 Mahatta Sq', governorate: 'Gharbia', status: 'IN_TRANSIT', shippingFee: 65, items: [{ productKey: 'dress', quantity: 1 }, { productKey: 'hijab', quantity: 1 }], cod: 'PENDING', daysAgo: 4, trackingNumber: 'BOSTA-100235' },

    // Delivered, courier collected cash but NOT yet settled — this is the "owed to you right now" money
    { customerName: 'Dina Magdy', customerPhone: '01212223344', addressLine: '9 Sudan St', governorate: 'Giza', status: 'DELIVERED', shippingFee: 60, items: [{ productKey: 'abaya', quantity: 1 }], cod: 'COLLECTED', daysAgo: 5, trackingNumber: 'BOSTA-100236' },
    { customerName: 'Farida Nabil', customerPhone: '01033344556', addressLine: '2 Roxy Sq', governorate: 'Cairo', status: 'DELIVERED', shippingFee: 60, items: [{ productKey: 'perfume', quantity: 2 }], cod: 'COLLECTED', daysAgo: 6, trackingNumber: 'BOSTA-100237' },
    { customerName: 'Malak Sherif', customerPhone: '01155566778', addressLine: '40 Port Said St', governorate: 'Damietta', status: 'DELIVERED', shippingFee: 75, items: [{ productKey: 'sneakers', quantity: 1 }, { productKey: 'bag', quantity: 1 }], cod: 'COLLECTED', daysAgo: 7, trackingNumber: 'BOSTA-100238' },

    // Delivered AND settled — money already in the seller's hand
    { customerName: 'Habiba Khaled', customerPhone: '01266677889', addressLine: '6 Salah Salem', governorate: 'Cairo', status: 'DELIVERED', shippingFee: 60, items: [{ productKey: 'dress', quantity: 2 }], cod: 'SETTLED', daysAgo: 12, trackingNumber: 'BOSTA-100239' },
    { customerName: 'Layla Ahmed', customerPhone: '01088899900', addressLine: '18 Gomhoreya', governorate: 'Beheira', status: 'DELIVERED', shippingFee: 70, items: [{ productKey: 'abaya', quantity: 1 }, { productKey: 'hijab', quantity: 2 }], cod: 'SETTLED', daysAgo: 14, trackingNumber: 'BOSTA-100240' },

    // Returned — failed delivery, no money
    { customerName: 'Jana Wael', customerPhone: '01199900011', addressLine: '11 Suez Rd', governorate: 'Ismailia', status: 'RETURNED', shippingFee: 70, items: [{ productKey: 'sneakers', quantity: 1 }], cod: 'PENDING', daysAgo: 8, trackingNumber: 'BOSTA-100241' },

    // Cancelled before shipping — no money
    { customerName: 'Rana Emad', customerPhone: '01244455566', addressLine: '30 Faisal St', governorate: 'Giza', status: 'CANCELLED', shippingFee: 0, items: [{ productKey: 'bag', quantity: 1 }], cod: 'PENDING', daysAgo: 9 },
  ];

  const now = Date.now();
  let count = 0;

  for (const o of orders) {
    const itemsData = o.items.map((it) => {
      const p = products[it.productKey];
      return {
        productId: p.id,
        productName: p.name,
        unitPrice: new Prisma.Decimal(p.price),
        quantity: it.quantity,
      };
    });

    const itemsTotal = o.items.reduce(
      (sum, it) => sum + products[it.productKey].price * it.quantity,
      0,
    );
    const codAmount = itemsTotal + o.shippingFee;
    const createdAt = new Date(now - o.daysAgo * 24 * 60 * 60 * 1000);

    // Derive ledger money columns from intent.
    const collectedAmount = o.cod === 'PENDING' ? 0 : codAmount;
    const settledAmount = o.cod === 'SETTLED' ? codAmount : 0;

    await prisma.order.create({
      data: {
        sellerId: seller.id,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        addressLine: o.addressLine,
        governorate: o.governorate,
        status: o.status,
        codAmount: new Prisma.Decimal(codAmount),
        shippingFee: new Prisma.Decimal(o.shippingFee),
        trackingNumber: o.trackingNumber ?? null,
        courierName: o.trackingNumber ? 'bosta' : null,
        createdAt,
        items: { create: itemsData },
        codLedger: {
          create: {
            expectedAmount: new Prisma.Decimal(codAmount),
            collectedAmount: new Prisma.Decimal(collectedAmount),
            settledAmount: new Prisma.Decimal(settledAmount),
            status: o.cod,
            collectedAt: o.cod !== 'PENDING' ? createdAt : null,
            settledAt: o.cod === 'SETTLED' ? createdAt : null,
          },
        },
      },
    });
    count++;
  }

  console.log(`Orders: ${count}`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
