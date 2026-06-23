-- AlterTable
ALTER TABLE "Seller" ADD COLUMN     "bostaApiKeyEnc" TEXT,
ADD COLUMN     "bostaConnectedAt" TIMESTAMP(3),
ADD COLUMN     "bostaEnv" TEXT NOT NULL DEFAULT 'staging';
