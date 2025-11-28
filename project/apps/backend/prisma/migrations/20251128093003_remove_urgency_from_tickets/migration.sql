/*
  Warnings:

  - You are about to drop the column `urgency` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "urgency";

-- DropEnum
DROP TYPE "TicketUrgency";
