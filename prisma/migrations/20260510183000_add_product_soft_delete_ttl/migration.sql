-- AlterTable
ALTER TABLE "products"
ADD COLUMN "deleted_at" TIMESTAMP(3),
ADD COLUMN "delete_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "products_deleted_at_idx" ON "products"("deleted_at");

-- CreateIndex
CREATE INDEX "products_delete_expires_at_idx" ON "products"("delete_expires_at");
