-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "taskId" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL,
    "rewardToken" TEXT NOT NULL,
    "rewardAmount" TEXT NOT NULL,
    "acceptableDaLayers" TEXT[],
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "winnerOperator" TEXT,
    "daLayer" TEXT,
    "commitment" TEXT,
    "nameSpace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorTaskSubmissionTime" INTEGER,
    "aggregatorSignature" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Task_taskId_key" ON "Task"("taskId");
