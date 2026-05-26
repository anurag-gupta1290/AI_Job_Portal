-- ============================================================
-- AI Job Portal — Phase 1 Database Schema
-- MySQL 8.0   |   UTF8MB4   |   Engine: InnoDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS jobportal
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jobportal;

-- ──────────────────────────────────────────────
-- 1. USERS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    full_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(150) NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    role             ENUM('ROLE_JOB_SEEKER','ROLE_JOB_PROVIDER',
                         'ROLE_TRAINING_PROVIDER','ROLE_ADMIN') NOT NULL,
    is_active        TINYINT(1)   NOT NULL DEFAULT 1,
    is_email_verified TINYINT(1)  NOT NULL DEFAULT 0,
    phone            VARCHAR(20),
    last_login       DATETIME,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role),
    KEY idx_users_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 2. REFRESH TOKENS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    token       VARCHAR(512) NOT NULL,
    expires_at  DATETIME     NOT NULL,
    is_revoked  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_refresh_tokens_token (token),
    KEY idx_refresh_tokens_user_id (user_id),
    KEY idx_refresh_tokens_expires_at (expires_at),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 3. SKILLS (canonical taxonomy)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
    id       BIGINT       NOT NULL AUTO_INCREMENT,
    name     VARCHAR(100) NOT NULL,
    category VARCHAR(80),
    PRIMARY KEY (id),
    UNIQUE KEY uq_skills_name (name),
    KEY idx_skills_category (category),
    FULLTEXT KEY ft_skills_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 4. SEEKER PROFILES  (Phase 2 — scaffold only)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seeker_profiles (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    user_id          BIGINT       NOT NULL,
    headline         VARCHAR(200),
    summary          TEXT,
    location         VARCHAR(150),
    visibility       ENUM('PUBLIC','EMPLOYERS_ONLY','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    resume_url       VARCHAR(500),
    completion_score TINYINT      NOT NULL DEFAULT 0,
    is_actively_looking TINYINT(1) NOT NULL DEFAULT 0,
    current_salary   DECIMAL(12,2),
    expected_salary  DECIMAL(12,2),
    years_of_experience DECIMAL(4,1),
    linkedin_url     VARCHAR(300),
    github_url       VARCHAR(300),
    portfolio_url    VARCHAR(300),
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seeker_profiles_user_id (user_id),
    CONSTRAINT fk_seeker_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 5. EXPERIENCES  (Phase 2)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experiences (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    profile_id  BIGINT       NOT NULL,
    company     VARCHAR(150) NOT NULL,
    title       VARCHAR(150) NOT NULL,
    start_date  DATE         NOT NULL,
    end_date    DATE,
    is_current  TINYINT(1)   NOT NULL DEFAULT 0,
    description TEXT,
    PRIMARY KEY (id),
    KEY idx_experiences_profile_id (profile_id),
    CONSTRAINT fk_experiences_profile
        FOREIGN KEY (profile_id) REFERENCES seeker_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 6. EDUCATIONS  (Phase 2)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS educations (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    profile_id  BIGINT       NOT NULL,
    institution VARCHAR(200) NOT NULL,
    degree      VARCHAR(150),
    field       VARCHAR(150),
    start_year  SMALLINT,
    end_year    SMALLINT,
    grade       VARCHAR(20),
    PRIMARY KEY (id),
    KEY idx_educations_profile_id (profile_id),
    CONSTRAINT fk_educations_profile
        FOREIGN KEY (profile_id) REFERENCES seeker_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 7. PROFILE_SKILLS  (Phase 2)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_skills (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    profile_id BIGINT NOT NULL,
    skill_id   BIGINT NOT NULL,
    level      ENUM('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT') NOT NULL DEFAULT 'INTERMEDIATE',
    years      DECIMAL(4,1),
    PRIMARY KEY (id),
    UNIQUE KEY uq_profile_skill (profile_id, skill_id),
    KEY idx_profile_skills_skill_id (skill_id),
    CONSTRAINT fk_profile_skills_profile
        FOREIGN KEY (profile_id) REFERENCES seeker_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_profile_skills_skill
        FOREIGN KEY (skill_id) REFERENCES skills (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 8. COMPANIES  (Phase 3)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    name        VARCHAR(200) NOT NULL,
    logo_url    VARCHAR(500),
    description TEXT,
    industry    VARCHAR(100),
    size        ENUM('1-10','11-50','51-200','201-500','501-1000','1000+'),
    website     VARCHAR(300),
    location    VARCHAR(150),
    is_verified TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_companies_user_id (user_id),
    CONSTRAINT fk_companies_user
        FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 9. JOB_POSTS  (Phase 3)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_posts (
    id               BIGINT        NOT NULL AUTO_INCREMENT,
    company_id       BIGINT        NOT NULL,
    title            VARCHAR(200)  NOT NULL,
    description      LONGTEXT      NOT NULL,
    requirements     TEXT,
    responsibilities TEXT,
    location         VARCHAR(150),
    job_type         ENUM('FULL_TIME','PART_TIME','CONTRACT','INTERNSHIP','REMOTE'),
    experience_level ENUM('ENTRY','MID','SENIOR','LEAD','EXECUTIVE'),
    salary_min       DECIMAL(12,2),
    salary_max       DECIMAL(12,2),
    status           ENUM('DRAFT','ACTIVE','PAUSED','CLOSED') NOT NULL DEFAULT 'DRAFT',
    deadline         DATE,
    max_applicants   INT,
    view_count       INT           NOT NULL DEFAULT 0,
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_job_posts_company_id (company_id),
    KEY idx_job_posts_status (status),
    KEY idx_job_posts_location (location),
    FULLTEXT KEY ft_job_posts_title_desc (title, description),
    CONSTRAINT fk_job_posts_company
        FOREIGN KEY (company_id) REFERENCES companies (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 10. JOB_SKILLS  (Phase 3)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_skills (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    job_id         BIGINT NOT NULL,
    skill_id       BIGINT NOT NULL,
    required_level ENUM('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT'),
    is_mandatory   TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_job_skill (job_id, skill_id),
    KEY idx_job_skills_skill_id (skill_id),
    CONSTRAINT fk_job_skills_job
        FOREIGN KEY (job_id) REFERENCES job_posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_job_skills_skill
        FOREIGN KEY (skill_id) REFERENCES skills (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 11. APPLICATIONS  (Phase 2/3)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
    id               BIGINT NOT NULL AUTO_INCREMENT,
    job_id           BIGINT NOT NULL,
    profile_id       BIGINT NOT NULL,
    status           ENUM('APPLIED','VIEWED','SHORTLISTED','INTERVIEW','OFFERED','REJECTED')
                         NOT NULL DEFAULT 'APPLIED',
    cover_letter     TEXT,
    resume_snapshot  VARCHAR(500),
    match_score      DECIMAL(5,2),
    notes            TEXT,
    applied_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_application (job_id, profile_id),
    KEY idx_applications_job_id (job_id),
    KEY idx_applications_profile_id (profile_id),
    KEY idx_applications_status (status),
    CONSTRAINT fk_applications_job
        FOREIGN KEY (job_id) REFERENCES job_posts (id),
    CONSTRAINT fk_applications_profile
        FOREIGN KEY (profile_id) REFERENCES seeker_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 12. COURSES  (Phase 4)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    trainer_id      BIGINT        NOT NULL,
    title           VARCHAR(200)  NOT NULL,
    description     TEXT,
    syllabus        TEXT,
    fees            DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration_hours  DECIMAL(6,1),
    status          ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    total_enrolled  INT           NOT NULL DEFAULT 0,
    thumbnail_url   VARCHAR(500),
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_courses_trainer_id (trainer_id),
    KEY idx_courses_status (status),
    FULLTEXT KEY ft_courses_title (title),
    CONSTRAINT fk_courses_trainer
        FOREIGN KEY (trainer_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────
-- 13. ENROLMENTS  (Phase 4)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrolments (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    course_id    BIGINT NOT NULL,
    seeker_id    BIGINT NOT NULL,
    progress_pct TINYINT NOT NULL DEFAULT 0,
    enrolled_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    PRIMARY KEY (id),
    UNIQUE KEY uq_enrolment (course_id, seeker_id),
    KEY idx_enrolments_seeker_id (seeker_id),
    CONSTRAINT fk_enrolments_course
        FOREIGN KEY (course_id) REFERENCES courses (id),
    CONSTRAINT fk_enrolments_seeker
        FOREIGN KEY (seeker_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
