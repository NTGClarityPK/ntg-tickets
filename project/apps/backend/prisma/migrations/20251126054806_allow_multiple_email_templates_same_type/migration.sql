-- DropIndex
DROP INDEX "email_templates_type_key";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "email_templates_type_idx" ON "email_templates"("type");
