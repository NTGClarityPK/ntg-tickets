-- DropIndex
DROP INDEX "categories_tenantId_name_key";

-- DropIndex
DROP INDEX "email_templates_tenantId_type_key";

-- CreateIndex
CREATE INDEX "email_templates_tenantId_type_isActive_idx" ON "email_templates"("tenantId", "type", "isActive");
