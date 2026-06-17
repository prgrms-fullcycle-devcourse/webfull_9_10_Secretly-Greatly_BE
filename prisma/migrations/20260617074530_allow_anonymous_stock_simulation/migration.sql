/*
  Warnings:

  - Added the required column `stock_id` to the `position_simulations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `position_simulations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "position_simulations" ADD COLUMN     "stock_id" INTEGER NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL,
ALTER COLUMN "position_id" DROP NOT NULL;
