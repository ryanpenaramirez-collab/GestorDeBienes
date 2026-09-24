-- CreateTable
CREATE TABLE "Abogado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreCompleto" TEXT NOT NULL,
    "tarjetaProfesional" TEXT,
    "documentoIdentidad" TEXT,
    "despacho" TEXT,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "ciudad" TEXT,
    "areaEspecialidad" TEXT,
    "paginaWeb" TEXT,
    "fotoPerfilUrl" TEXT,
    "pinHash" TEXT NOT NULL,
    "temaVisual" TEXT NOT NULL DEFAULT 'BLANCO_CORPORATIVO',
    "densidadTablas" TEXT NOT NULL DEFAULT 'COMODA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Ley" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "codigoLey" TEXT,
    "articulo" TEXT,
    "descripcion" TEXT,
    "porcentajeBase" REAL NOT NULL,
    "aplicaA" TEXT,
    "grupo" TEXT NOT NULL,
    "activaPorDefecto" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Proceso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreCaso" TEXT NOT NULL,
    "tipoProceso" TEXT NOT NULL,
    "tipoSucesion" TEXT,
    "viaProceso" TEXT NOT NULL DEFAULT 'NOTARIAL',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notasLitigacion" TEXT,
    "patrimonioBruto" REAL NOT NULL DEFAULT 0,
    "patrimonioNeto" REAL NOT NULL DEFAULT 0,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    "fechaFinalizacion" DATETIME,
    "pdfGeneradoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Bien" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procesoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'OTRO',
    "valorComercial" REAL NOT NULL,
    "esBienPropio" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bien_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procesoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoRelacion" TEXT NOT NULL,
    "parentesco" TEXT,
    "porcentajeEscritura" REAL,
    "esIndigno" BOOLEAN NOT NULL DEFAULT false,
    "esDesheredado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Persona_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcesoLey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procesoId" TEXT NOT NULL,
    "leyId" TEXT NOT NULL,
    "porcentajeCaso" REAL NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "baseCalculoLeyId" TEXT,
    CONSTRAINT "ProcesoLey_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcesoLey_leyId_fkey" FOREIGN KEY ("leyId") REFERENCES "Ley" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostoProceso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procesoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "modalidad" TEXT NOT NULL,
    "porcentaje" REAL,
    "montoFijo" REAL,
    "estadoFijacion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostoProceso_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostoProcesoParte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "costoProcesoId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    CONSTRAINT "CostoProcesoParte_costoProcesoId_fkey" FOREIGN KEY ("costoProcesoId") REFERENCES "CostoProceso" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CostoProcesoParte_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResultadoPersona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procesoId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "montoAsignado" REAL NOT NULL,
    "reglaAplicada" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResultadoPersona_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResultadoPersona_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Abogado_correo_key" ON "Abogado"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "ProcesoLey_procesoId_leyId_key" ON "ProcesoLey"("procesoId", "leyId");

-- CreateIndex
CREATE UNIQUE INDEX "CostoProcesoParte_costoProcesoId_personaId_rol_key" ON "CostoProcesoParte"("costoProcesoId", "personaId", "rol");
