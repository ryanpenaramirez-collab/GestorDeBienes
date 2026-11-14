-- AddColumn
ALTER TABLE "Abogado" ADD COLUMN "intentosFallidos" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Abogado" ADD COLUMN "bloqueadoHasta" DATETIME;
ALTER TABLE "Abogado" ADD COLUMN "codigoRecuperacionHash" TEXT;
ALTER TABLE "Abogado" ADD COLUMN "codigoRecuperacionPendiente" TEXT;
