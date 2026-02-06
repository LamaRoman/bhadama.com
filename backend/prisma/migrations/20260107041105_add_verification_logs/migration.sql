-- CreateTable
CREATE TABLE "verification_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "provider" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_logs_user_id_idx" ON "verification_logs"("user_id");

-- CreateIndex
CREATE INDEX "verification_logs_type_idx" ON "verification_logs"("type");

-- CreateIndex
CREATE INDEX "verification_logs_created_at_idx" ON "verification_logs"("created_at");

-- AddForeignKey
ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
