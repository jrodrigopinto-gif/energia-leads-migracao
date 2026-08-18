-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN     "contatoAtualizadoEm" TIMESTAMP(3),
ADD COLUMN     "contatoAtualizadoPor" TEXT,
ADD COLUMN     "contatoFonte" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "telefone1" TEXT,
ADD COLUMN     "telefone2" TEXT,
ADD COLUMN     "telefoneDdd1" TEXT,
ADD COLUMN     "telefoneDdd2" TEXT;
