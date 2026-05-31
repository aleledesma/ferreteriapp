-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "trace_id" TEXT,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "supplier_names" TEXT NOT NULL,
    "files_count" INTEGER NOT NULL DEFAULT 0,
    "products_created" INTEGER NOT NULL DEFAULT 0,
    "products_updated" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_by_user_id" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "import_jobs_trace_id_key" ON "import_jobs"("trace_id");

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");

-- CreateIndex
CREATE INDEX "import_jobs_created_at_idx" ON "import_jobs"("created_at");

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
