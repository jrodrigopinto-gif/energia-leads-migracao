-- AddTable: PharmacyProduct
CREATE TABLE "PharmacyProduct" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PharmacyProduct_pkey" PRIMARY KEY ("id")
);

-- AddTable: PharmacyConversation
CREATE TABLE "PharmacyConversation" (
    "id" TEXT NOT NULL,
    "waId" TEXT NOT NULL,
    "customerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PharmacyConversation_pkey" PRIMARY KEY ("id")
);

-- AddTable: PharmacyMessage
CREATE TABLE "PharmacyMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PharmacyMessage_pkey" PRIMARY KEY ("id")
);

-- AddTable: PharmacyOrder
CREATE TABLE "PharmacyOrder" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent_to_cashier',
    "deliveryType" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "address" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "cashierSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PharmacyOrder_pkey" PRIMARY KEY ("id")
);

-- AddTable: PharmacyOrderItem
CREATE TABLE "PharmacyOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "PharmacyOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: PharmacyProduct
CREATE UNIQUE INDEX "PharmacyProduct_code_key" ON "PharmacyProduct"("code");
CREATE INDEX "PharmacyProduct_name_idx" ON "PharmacyProduct"("name");
CREATE INDEX "PharmacyProduct_category_idx" ON "PharmacyProduct"("category");

-- CreateIndex: PharmacyConversation
CREATE UNIQUE INDEX "PharmacyConversation_waId_key" ON "PharmacyConversation"("waId");

-- CreateIndex: PharmacyMessage
CREATE INDEX "PharmacyMessage_conversationId_idx" ON "PharmacyMessage"("conversationId");

-- CreateIndex: PharmacyOrder
CREATE UNIQUE INDEX "PharmacyOrder_orderNumber_key" ON "PharmacyOrder"("orderNumber");
CREATE INDEX "PharmacyOrder_conversationId_idx" ON "PharmacyOrder"("conversationId");
CREATE INDEX "PharmacyOrder_status_idx" ON "PharmacyOrder"("status");
CREATE INDEX "PharmacyOrder_cashierSentAt_idx" ON "PharmacyOrder"("cashierSentAt");

-- AddForeignKey: PharmacyMessage -> PharmacyConversation
ALTER TABLE "PharmacyMessage" ADD CONSTRAINT "PharmacyMessage_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "PharmacyConversation"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: PharmacyOrder -> PharmacyConversation
ALTER TABLE "PharmacyOrder" ADD CONSTRAINT "PharmacyOrder_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "PharmacyConversation"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: PharmacyOrderItem -> PharmacyOrder
ALTER TABLE "PharmacyOrderItem" ADD CONSTRAINT "PharmacyOrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "PharmacyOrder"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: PharmacyOrderItem -> PharmacyProduct
ALTER TABLE "PharmacyOrderItem" ADD CONSTRAINT "PharmacyOrderItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "PharmacyProduct"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
