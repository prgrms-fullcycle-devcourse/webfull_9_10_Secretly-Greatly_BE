/*
  Warnings:

  - You are about to drop the column `expected_avg_price` on the `position_simulations` table. All the data in the column will be lost.
  - Added the required column `calculated_avg_price` to the `position_simulations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `calculated_evaluation_amount` to the `position_simulations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `calculated_evaluation_profit` to the `position_simulations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `calculated_quantity` to the `position_simulations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `calculated_rate_of_return` to the `position_simulations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_price` to the `position_simulations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `formatted_log` to the `position_simulations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "position_simulations" DROP COLUMN "expected_avg_price",
ADD COLUMN     "calculated_avg_price" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "calculated_evaluation_amount" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "calculated_evaluation_profit" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "calculated_quantity" DECIMAL(18,8) NOT NULL,
ADD COLUMN     "calculated_rate_of_return" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "current_price" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "formatted_log" TEXT NOT NULL;
