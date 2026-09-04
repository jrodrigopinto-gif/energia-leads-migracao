-- AlterTable
ALTER TABLE "CandidateCompany" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logradouro" TEXT,
ADD COLUMN     "naturezaJuridica" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "tipoLogradouro" TEXT;

-- CreateTable
CREATE TABLE "SelfGenerationConsumer" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "cnpjRaiz" TEXT NOT NULL,
    "nomeConsumidor" TEXT NOT NULL,
    "uf" TEXT,
    "municipio" TEXT,
    "distribuidora" TEXT,
    "fonteGeracao" TEXT,
    "tipoGeracao" TEXT,
    "potenciaKw" DOUBLE PRECISION,
    "dataConexao" TEXT,
    "dataReferencia" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ANEEL_SIGA_GD',
    "rawData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelfGenerationConsumer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SelfGenerationConsumer_cnpjRaiz_idx" ON "SelfGenerationConsumer"("cnpjRaiz");

-- CreateIndex
CREATE UNIQUE INDEX "SelfGenerationConsumer_cnpj_dataConexao_potenciaKw_key" ON "SelfGenerationConsumer"("cnpj", "dataConexao", "potenciaKw");

-- CreateIndex
CREATE INDEX "CandidateCompany_cep_idx" ON "CandidateCompany"("cep");
