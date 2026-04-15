-- Initial Auth.js schema with Google OAuth support and simple app roles.

create type "UserRole" as enum ('INACTIVE', 'ACTIVE', 'ADMIN');

create table "users" (
  "id" text not null,
  "name" text,
  "email" text,
  "email_verified" timestamptz,
  "image" text,
  "role" "UserRole" not null default 'INACTIVE',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null,

  constraint "users_pkey" primary key ("id")
);

create unique index "users_email_key" on "users" ("email");

create table "accounts" (
  "id" text not null,
  "user_id" text not null,
  "type" text not null,
  "provider" text not null,
  "provider_account_id" text not null,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null,

  constraint "accounts_pkey" primary key ("id")
);

create unique index "accounts_provider_provider_account_id_key"
  on "accounts" ("provider", "provider_account_id");

create index "accounts_user_id_idx" on "accounts" ("user_id");

create table "sessions" (
  "id" text not null,
  "session_token" text not null,
  "user_id" text not null,
  "expires" timestamptz not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null,

  constraint "sessions_pkey" primary key ("id")
);

create unique index "sessions_session_token_key" on "sessions" ("session_token");
create index "sessions_user_id_idx" on "sessions" ("user_id");

create table "verification_tokens" (
  "identifier" text not null,
  "token" text not null,
  "expires" timestamptz not null
);

create unique index "verification_tokens_token_key" on "verification_tokens" ("token");
create unique index "verification_tokens_identifier_token_key"
  on "verification_tokens" ("identifier", "token");

alter table "accounts"
  add constraint "accounts_user_id_fkey"
  foreign key ("user_id") references "users"("id") on delete cascade on update cascade;

alter table "sessions"
  add constraint "sessions_user_id_fkey"
  foreign key ("user_id") references "users"("id") on delete cascade on update cascade;
