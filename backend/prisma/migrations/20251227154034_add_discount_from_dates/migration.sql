-- CreateTable
CREATE TABLE "PromotionRequest" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "hostId" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 7,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminId" INTEGER,
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromotionRequest_listingId_idx" ON "PromotionRequest"("listingId");

-- CreateIndex
CREATE INDEX "PromotionRequest_hostId_idx" ON "PromotionRequest"("hostId");

-- CreateIndex
CREATE INDEX "PromotionRequest_status_idx" ON "PromotionRequest"("status");

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
