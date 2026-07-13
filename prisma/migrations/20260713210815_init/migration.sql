-- CreateTable
CREATE TABLE "CandidateCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cnpj" TEXT NOT NULL,
    "cnpjRaiz" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnae" TEXT NOT NULL,
    "cnaeDescricao" TEXT,
    "uf" TEXT NOT NULL,
    "municipio" TEXT,
    "porte" TEXT,
    "situacaoCadastral" TEXT,
    "dataAbertura" TEXT,
    "capitalSocial" REAL,
    "source" TEXT NOT NULL DEFAULT 'RFB',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MigratedConsumer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cnpj" TEXT NOT NULL,
    "cnpjRaiz" TEXT NOT NULL,
    "nomeConsumidor" TEXT NOT NULL,
    "agenteVarejista" TEXT,
    "submercado" TEXT,
    "perfil" TEXT,
    "dataReferencia" TEXT,
    "source" TEXT NOT NULL DEFAULT 'CCEE',
    "rawData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'running',
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateCompany_cnpj_key" ON "CandidateCompany"("cnpj");

-- CreateIndex
CREATE INDEX "CandidateCompany_cnpjRaiz_idx" ON "CandidateCompany"("cnpjRaiz");

-- CreateIndex
CREATE INDEX "CandidateCompany_uf_idx" ON "CandidateCompany"("uf");

-- CreateIndex
CREATE INDEX "CandidateCompany_cnae_idx" ON "CandidateCompany"("cnae");

-- CreateIndex
CREATE INDEX "MigratedConsumer_cnpjRaiz_idx" ON "MigratedConsumer"("cnpjRaiz");

-- CreateIndex
CREATE UNIQUE INDEX "MigratedConsumer_cnpj_dataReferencia_key" ON "MigratedConsumer"("cnpj", "dataReferencia");
