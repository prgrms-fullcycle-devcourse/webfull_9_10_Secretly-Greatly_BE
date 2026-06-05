-- CreateEnum
CREATE TYPE "StealthTheme" AS ENUM ('IDE_DARK', 'TERMINAL', 'EXCEL', 'INBOX');

-- CreateEnum
CREATE TYPE "PanicKey" AS ENUM ('ESC', 'Q', 'CTRL_Q');

-- CreateEnum
CREATE TYPE "PanicScreenType" AS ENUM ('CONFLUENCE', 'GOOGLE_DOCS', 'NOTION', 'CUSTOM_URL');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('STOCK', 'CRYPTO', 'ETF', 'INDEX');

-- CreateEnum
CREATE TYPE "Market" AS ENUM ('KR', 'US', 'CRYPTO');

-- CreateEnum
CREATE TYPE "Exchange" AS ENUM ('KRX', 'NASDAQ', 'NYSE', 'BINANCE', 'UPBIT');

-- CreateEnum
CREATE TYPE "IndicatorType" AS ENUM ('KOSPI', 'NASDAQ', 'NASDAQ_FUTURE', 'USD_KRW', 'US_10Y_BOND', 'VIX_INDEX', 'BTC_USDT');

-- CreateEnum
CREATE TYPE "Country" AS ENUM ('US', 'KR', 'JP', 'EU', 'CN');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('NORMAL', 'SYSTEM', 'NOTICE', 'BOT');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('WARN', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('PRICE_UP', 'PRICE_DOWN', 'VOLUME_SPIKE', 'NEWS', 'ECONOMIC_EVENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "nickname" TEXT NOT NULL,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "password_changed_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "anonymous_uuid" TEXT NOT NULL,
    "expired_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "stealth_theme" "StealthTheme" NOT NULL DEFAULT 'IDE_DARK',
    "panic_key" "PanicKey" NOT NULL DEFAULT 'ESC',
    "panic_screen_type" "PanicScreenType" NOT NULL DEFAULT 'CONFLUENCE',
    "panic_redirect_url" TEXT,
    "reduce_motion" BOOLEAN NOT NULL DEFAULT false,
    "disguise_tabs" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "market" "Market" NOT NULL,
    "exchange" "Exchange" NOT NULL,
    "asset_type" "AssetType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "alias_filename" TEXT,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_snapshots" (
    "id" SERIAL NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "current_price" DECIMAL(18,4) NOT NULL,
    "change_rate" DECIMAL(8,4) NOT NULL,
    "prev_close" DECIMAL(18,4),
    "day_high" DECIMAL(18,4),
    "day_low" DECIMAL(18,4),
    "volume" BIGINT,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_indicators" (
    "id" SERIAL NOT NULL,
    "indicator_type" "IndicatorType" NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "change_rate" DECIMAL(8,4),
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economic_events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "country" "Country" NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "impact_level" "ImpactLevel" NOT NULL,
    "source_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "economic_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "average_price" DECIMAL(18,4) NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "total_invested_amount" DECIMAL(18,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "position_simulations" (
    "id" SERIAL NOT NULL,
    "position_id" INTEGER NOT NULL,
    "buy_price" DECIMAL(18,4) NOT NULL,
    "buy_quantity" DECIMAL(18,8) NOT NULL,
    "expected_avg_price" DECIMAL(18,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "position_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" SERIAL NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "user_id" UUID,
    "message" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'NORMAL',
    "report_count" INTEGER NOT NULL DEFAULT 0,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_reports" (
    "id" SERIAL NOT NULL,
    "chat_message_id" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_logs" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "level" "AlertLevel" NOT NULL,
    "change_rate" DECIMAL(8,4),
    "message" TEXT NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" SERIAL NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "original_url" TEXT NOT NULL,
    "summary" TEXT,
    "source_name" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_sessions_anonymous_uuid_key" ON "anonymous_sessions"("anonymous_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_code_exchange_key" ON "stocks"("code", "exchange");

-- CreateIndex
CREATE INDEX "watchlists_user_id_sort_order_idx" ON "watchlists"("user_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "watchlists_user_id_stock_id_key" ON "watchlists"("user_id", "stock_id");

-- CreateIndex
CREATE INDEX "market_snapshots_stock_id_captured_at_idx" ON "market_snapshots"("stock_id", "captured_at");

-- CreateIndex
CREATE INDEX "market_indicators_indicator_type_recorded_at_idx" ON "market_indicators"("indicator_type", "recorded_at");

-- CreateIndex
CREATE INDEX "economic_events_event_time_idx" ON "economic_events"("event_time");

-- CreateIndex
CREATE INDEX "economic_events_country_impact_level_idx" ON "economic_events"("country", "impact_level");

-- CreateIndex
CREATE UNIQUE INDEX "positions_user_id_stock_id_key" ON "positions"("user_id", "stock_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_stock_id_key" ON "chat_rooms"("stock_id");

-- CreateIndex
CREATE INDEX "chat_messages_room_id_created_at_idx" ON "chat_messages"("room_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_reports_chat_message_id_user_id_key" ON "chat_reports"("chat_message_id", "user_id");

-- CreateIndex
CREATE INDEX "alert_logs_user_id_created_at_idx" ON "alert_logs"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "news_original_url_key" ON "news"("original_url");

-- CreateIndex
CREATE INDEX "news_stock_id_published_at_idx" ON "news"("stock_id", "published_at");

-- AddForeignKey
ALTER TABLE "anonymous_sessions" ADD CONSTRAINT "anonymous_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position_simulations" ADD CONSTRAINT "position_simulations_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_chat_message_id_fkey" FOREIGN KEY ("chat_message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_logs" ADD CONSTRAINT "alert_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_logs" ADD CONSTRAINT "alert_logs_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
