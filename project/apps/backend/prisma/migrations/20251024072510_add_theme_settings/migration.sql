-- CreateTable
CREATE TABLE "theme_settings" (
    "id" TEXT NOT NULL,
    "primaryColor" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_settings_pkey" PRIMARY KEY ("id")
);
