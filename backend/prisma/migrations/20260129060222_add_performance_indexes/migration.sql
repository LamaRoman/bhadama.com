-- CreateIndex
CREATE INDEX "Booking_userId_bookingDate_idx" ON "Booking"("userId", "bookingDate");

-- CreateIndex
CREATE INDEX "Booking_listingId_bookingDate_idx" ON "Booking"("listingId", "bookingDate");

-- CreateIndex
CREATE INDEX "Booking_listingId_status_idx" ON "Booking"("listingId", "status");
