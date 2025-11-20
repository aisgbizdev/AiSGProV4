CREATE TABLE "branches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "ceo_unit_id" uuid NOT NULL,
        "pt_id" uuid,
        "code" varchar(20) NOT NULL,
        "name" text NOT NULL,
        "city" text,
        "region" text,
        "status" varchar(20) DEFAULT 'active' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "branches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ceo_units" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "pt_id" uuid NOT NULL,
        "code" varchar(20) NOT NULL,
        "name" text NOT NULL,
        "status" varchar(20) DEFAULT 'active' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "ceo_units_code_unique" UNIQUE("code"),
        CONSTRAINT "ceo_units_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "employees" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "employee_code" varchar(20) NOT NULL,
        "full_name" text NOT NULL,
        "email" text,
        "phone" varchar(20),
        "date_of_birth" date NOT NULL,
        "pt_id" uuid NOT NULL,
        "branch_id" uuid,
        "position_id" uuid NOT NULL,
        "ceo_unit_id" uuid,
        "manager_id" uuid,
        "join_date" date NOT NULL,
        "status" varchar(20) DEFAULT 'active' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "employees_employee_code_unique" UNIQUE("employee_code"),
        CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "monthly_performances" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "employee_id" uuid NOT NULL,
        "year" integer NOT NULL,
        "month" integer NOT NULL,
        "quarter" integer NOT NULL,
        "margin_personal" numeric(12, 2) DEFAULT '0' NOT NULL,
        "na_personal" integer DEFAULT 0 NOT NULL,
        "lot_settled" integer DEFAULT 0,
        "margin_team" numeric(12, 2) DEFAULT '0',
        "na_team" integer DEFAULT 0,
        "is_team_auto_calculated" boolean DEFAULT true NOT NULL,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_audits" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "period" varchar(7) NOT NULL,
        "nama" text NOT NULL,
        "posisi" text NOT NULL,
        "pillar_scores" jsonb NOT NULL,
        "reality_score" numeric(5, 2),
        "zone" varchar(20),
        "ai_coaching" text,
        "keep_until" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "code" varchar(10) NOT NULL,
        "name" text NOT NULL,
        "level" integer NOT NULL,
        "description" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "positions_code_unique" UNIQUE("code"),
        CONSTRAINT "positions_level_unique" UNIQUE("level")
);
--> statement-breakpoint
CREATE TABLE "pts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "code" varchar(10) NOT NULL,
        "name" text NOT NULL,
        "status" varchar(20) DEFAULT 'active' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "pts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "security_questions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "question_1" text NOT NULL,
        "answer_1" text NOT NULL,
        "question_2" text NOT NULL,
        "answer_2" text NOT NULL,
        "question_3" text NOT NULL,
        "answer_3" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upload_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "branch_id" uuid NOT NULL,
        "uploaded_by" uuid NOT NULL,
        "period" varchar(7) NOT NULL,
        "file_name" varchar(255),
        "total_rows" integer DEFAULT 0 NOT NULL,
        "success_rows" integer DEFAULT 0 NOT NULL,
        "error_rows" integer DEFAULT 0 NOT NULL,
        "errors" jsonb,
        "status" varchar(20) DEFAULT 'success' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "username" text NOT NULL,
        "password" text NOT NULL,
        "employee_id" uuid,
        "name" text NOT NULL,
        "email" text,
        "role" varchar(20) DEFAULT 'employee' NOT NULL,
        "must_change_password" boolean DEFAULT false NOT NULL,
        "last_password_change" timestamp,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "users_username_unique" UNIQUE("username"),
        CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_ceo_unit_id_ceo_units_id_fk" FOREIGN KEY ("ceo_unit_id") REFERENCES "public"."ceo_units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_pt_id_pts_id_fk" FOREIGN KEY ("pt_id") REFERENCES "public"."pts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ceo_units" ADD CONSTRAINT "ceo_units_pt_id_pts_id_fk" FOREIGN KEY ("pt_id") REFERENCES "public"."pts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_pt_id_pts_id_fk" FOREIGN KEY ("pt_id") REFERENCES "public"."pts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_ceo_unit_id_ceo_units_id_fk" FOREIGN KEY ("ceo_unit_id") REFERENCES "public"."ceo_units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_performances" ADD CONSTRAINT "monthly_performances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_audits" ADD CONSTRAINT "personal_audits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_questions" ADD CONSTRAINT "security_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_logs" ADD CONSTRAINT "upload_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_logs" ADD CONSTRAINT "upload_logs_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employees_manager_idx" ON "employees" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "employees_branch_idx" ON "employees" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "employees_position_idx" ON "employees" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "employees_ceo_unit_idx" ON "employees" USING btree ("ceo_unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_performance_unique" ON "monthly_performances" USING btree ("employee_id","year","month");--> statement-breakpoint
CREATE INDEX "personal_audits_user_idx" ON "personal_audits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "personal_audits_period_idx" ON "personal_audits" USING btree ("period");