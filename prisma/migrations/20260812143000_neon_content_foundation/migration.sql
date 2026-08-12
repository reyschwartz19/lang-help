CREATE TABLE "content_releases" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "released_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "content_releases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "content_release_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" INTEGER NOT NULL,
    "cefr_level" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sentences" (
    "id" TEXT NOT NULL,
    "french" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "spoken_form" TEXT,
    "difficulty" INTEGER NOT NULL,
    "cefr_level" TEXT,
    "grammar" JSONB,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sentences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "story_sentences" (
    "story_id" TEXT NOT NULL,
    "sentence_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "story_sentences_pkey" PRIMARY KEY ("story_id", "sentence_id")
);

CREATE UNIQUE INDEX "content_releases_version_key" ON "content_releases"("version");
CREATE INDEX "stories_content_release_id_idx" ON "stories"("content_release_id");
CREATE INDEX "story_sentences_sentence_id_idx" ON "story_sentences"("sentence_id");
CREATE UNIQUE INDEX "story_sentences_story_id_position_key" ON "story_sentences"("story_id", "position");

ALTER TABLE "stories" ADD CONSTRAINT "stories_content_release_id_fkey"
FOREIGN KEY ("content_release_id") REFERENCES "content_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "story_sentences" ADD CONSTRAINT "story_sentences_story_id_fkey"
FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "story_sentences" ADD CONSTRAINT "story_sentences_sentence_id_fkey"
FOREIGN KEY ("sentence_id") REFERENCES "sentences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
