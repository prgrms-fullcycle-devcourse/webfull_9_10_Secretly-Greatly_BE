-- DropForeignKey
ALTER TABLE "daily_bars" DROP CONSTRAINT "daily_bars_stock_id_fkey";

-- DropForeignKey
ALTER TABLE "daily_bars" DROP CONSTRAINT "daily_bars_user_id_fkey";

-- DropForeignKey
ALTER TABLE "minute_bars" DROP CONSTRAINT "minute_bars_stock_id_fkey";

-- DropForeignKey
ALTER TABLE "minute_bars" DROP CONSTRAINT "minute_bars_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ticks" DROP CONSTRAINT "ticks_stock_id_fkey";

-- DropForeignKey
ALTER TABLE "ticks" DROP CONSTRAINT "ticks_user_id_fkey";

-- AddForeignKey
ALTER TABLE "ticks" ADD CONSTRAINT "ticks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticks" ADD CONSTRAINT "ticks_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minute_bars" ADD CONSTRAINT "minute_bars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minute_bars" ADD CONSTRAINT "minute_bars_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_bars" ADD CONSTRAINT "daily_bars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_bars" ADD CONSTRAINT "daily_bars_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
