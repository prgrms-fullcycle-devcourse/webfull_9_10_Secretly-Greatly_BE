-- AlterTable
ALTER TABLE "users" ADD COLUMN     "kis_app_key_enc" TEXT,
ADD COLUMN     "kis_app_secret_enc" TEXT,
ADD COLUMN     "kis_credential_registered_at" TIMESTAMP(3);
