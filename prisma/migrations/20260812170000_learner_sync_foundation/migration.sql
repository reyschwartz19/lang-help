CREATE TYPE "learner_record_type" AS ENUM (
    'CARD',
    'PHRASE',
    'READING_PROGRESS',
    'USER_STATS'
);

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "login_throttles" (
    "key" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "window_started" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocked_until" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "login_throttles_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "sync_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_devices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "learner_records" (
    "user_id" TEXT NOT NULL,
    "record_type" "learner_record_type" NOT NULL,
    "record_id" TEXT NOT NULL,
    "payload" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "last_device_id" TEXT NOT NULL,
    "last_change_sequence" BIGINT NOT NULL,
    CONSTRAINT "learner_records_pkey" PRIMARY KEY ("user_id", "record_type", "record_id"),
    CONSTRAINT "learner_records_tombstone_check" CHECK (
        ("deleted_at" IS NULL AND "payload" IS NOT NULL)
        OR ("deleted_at" IS NOT NULL AND "payload" IS NULL)
    )
);

CREATE TABLE "learner_changes" (
    "sequence" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "record_type" "learner_record_type" NOT NULL,
    "record_id" TEXT NOT NULL,
    "payload" JSONB,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "device_id" TEXT NOT NULL,
    CONSTRAINT "learner_changes_pkey" PRIMARY KEY ("sequence"),
    CONSTRAINT "learner_changes_tombstone_check" CHECK (
        ("deleted_at" IS NULL AND "payload" IS NOT NULL)
        OR ("deleted_at" IS NOT NULL AND "payload" IS NULL)
    )
);

CREATE TABLE "sync_mutations" (
    "user_id" TEXT NOT NULL,
    "mutation_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sequence" BIGINT NOT NULL,
    CONSTRAINT "sync_mutations_pkey" PRIMARY KEY ("user_id", "mutation_id")
);

CREATE UNIQUE INDEX "sync_devices_user_id_id_key" ON "sync_devices"("user_id", "id");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE INDEX "login_throttles_updated_at_idx" ON "login_throttles"("updated_at");
CREATE INDEX "sync_devices_user_id_idx" ON "sync_devices"("user_id");
CREATE INDEX "learner_records_user_id_last_change_sequence_idx" ON "learner_records"("user_id", "last_change_sequence");
CREATE INDEX "learner_records_updated_at_idx" ON "learner_records"("updated_at");
CREATE INDEX "learner_changes_user_id_sequence_idx" ON "learner_changes"("user_id", "sequence");
CREATE INDEX "sync_mutations_user_id_sequence_idx" ON "sync_mutations"("user_id", "sequence");

ALTER TABLE "learner_records" ADD CONSTRAINT "learner_records_user_id_last_device_id_fkey"
FOREIGN KEY ("user_id", "last_device_id") REFERENCES "sync_devices"("user_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "learner_changes" ADD CONSTRAINT "learner_changes_user_id_device_id_fkey"
FOREIGN KEY ("user_id", "device_id") REFERENCES "sync_devices"("user_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sync_mutations" ADD CONSTRAINT "sync_mutations_user_id_device_id_fkey"
FOREIGN KEY ("user_id", "device_id") REFERENCES "sync_devices"("user_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sync_devices" ADD CONSTRAINT "sync_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learner_records" ADD CONSTRAINT "learner_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learner_changes" ADD CONSTRAINT "learner_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sync_mutations" ADD CONSTRAINT "sync_mutations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
