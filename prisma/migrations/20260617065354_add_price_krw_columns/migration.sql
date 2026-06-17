-- AlterTable
ALTER TABLE "daily_bars" ADD COLUMN     "close_krw" DECIMAL(18,4);

-- AlterTable
ALTER TABLE "minute_bars" ADD COLUMN     "close_krw" DECIMAL(18,4);

-- AlterTable
ALTER TABLE "ticks" ADD COLUMN     "price_krw" DECIMAL(18,4);
