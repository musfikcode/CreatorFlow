-- AlterTable
ALTER TABLE "user" ADD COLUMN     "competitorUrls" TEXT[],
ADD COLUMN     "niche" TEXT,
ADD COLUMN     "nicheKeywords" TEXT[],
ADD COLUMN     "researchFrequency" TEXT NOT NULL DEFAULT 'weekly';

-- CreateTable
CREATE TABLE "research_data" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "trendingTopics" JSONB NOT NULL,
    "contentIdeas" JSONB NOT NULL,
    "competitorData" JSONB NOT NULL,
    "keywords" TEXT[],
    "hashtags" TEXT[],
    "scrapedSources" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trend_alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "velocity" TEXT NOT NULL,
    "platforms" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'new',
    "sources" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trend_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "nodeData" JSONB NOT NULL,
    "connectionData" JSONB NOT NULL,
    "authorId" TEXT,
    "cloneCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "estimatedTime" TEXT,
    "timeSavings" TEXT,
    "tags" TEXT[],
    "requiredCredentials" TEXT[],
    "nodeCount" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_review" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformData" JSONB NOT NULL,
    "aggregatedMetrics" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalEngagements" INTEGER NOT NULL DEFAULT 0,
    "totalFollowers" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "research_data_userId_idx" ON "research_data"("userId");

-- CreateIndex
CREATE INDEX "research_data_createdAt_idx" ON "research_data"("createdAt");

-- CreateIndex
CREATE INDEX "trend_alert_userId_status_idx" ON "trend_alert"("userId", "status");

-- CreateIndex
CREATE INDEX "trend_alert_createdAt_idx" ON "trend_alert"("createdAt");

-- CreateIndex
CREATE INDEX "workflow_template_category_idx" ON "workflow_template"("category");

-- CreateIndex
CREATE INDEX "workflow_template_published_idx" ON "workflow_template"("published");

-- CreateIndex
CREATE INDEX "workflow_template_authorId_idx" ON "workflow_template"("authorId");

-- CreateIndex
CREATE INDEX "template_review_templateId_idx" ON "template_review"("templateId");

-- CreateIndex
CREATE INDEX "template_review_userId_idx" ON "template_review"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "template_review_templateId_userId_key" ON "template_review"("templateId", "userId");

-- CreateIndex
CREATE INDEX "analytics_snapshot_userId_idx" ON "analytics_snapshot"("userId");

-- CreateIndex
CREATE INDEX "analytics_snapshot_createdAt_idx" ON "analytics_snapshot"("createdAt");

-- CreateIndex
CREATE INDEX "analytics_snapshot_userId_createdAt_idx" ON "analytics_snapshot"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "research_data" ADD CONSTRAINT "research_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trend_alert" ADD CONSTRAINT "trend_alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_template" ADD CONSTRAINT "workflow_template_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_review" ADD CONSTRAINT "template_review_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "workflow_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_review" ADD CONSTRAINT "template_review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_snapshot" ADD CONSTRAINT "analytics_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
