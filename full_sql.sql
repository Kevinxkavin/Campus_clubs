<USER_REQUEST>
all roles working ?? -- ============================================================
--  CampusClubs  –  MySQL Schema  (campusclubs_sql)
--  Run this once after creating the database:
--    mysql -u root -p campusclubs_sql < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS campusclubs_sql
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campusclubs_sql;

-- ────────────────────────────────────────────────────────────
-- 1. USERS
--    Core identity table (SQL).
--    Club membership details live in MongoDB (clubs collection).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    name                  VARCHAR(120)  NOT NULL,
    email                 VARCHAR(120)  NOT NULL,
    password_hash         VARCHAR(255)  NOT NULL,
    student_id            VARCHAR(30)   DEFAULT NULL,
    role                  ENUM(
                              'STUDENT',
                              'COORDINATOR',
                              'ADVISOR',
                              'ADMIN'
                          )             NOT NULL DEFAULT 'STUDENT',
    department            VARCHAR(60)   DEFAULT NULL,
    year                  VARCHAR(20)   DEFAULT NULL,   -- e.g. "2nd Year"
    phone                 VARCHAR(20)   DEFAULT NULL,
    skills                VARCHAR(500)  DEFAULT NULL,
    bio                   VARCHAR(500)  DEFAULT NULL,
    avatar_url            VARCHAR(300)  DEFAULT NULL,
    active                TINYINT(1)    NOT NULL DEFAULT 1,

    -- Cross-reference to MongoDB club document
    managed_club_mongo_id VARCHAR(50)   DEFAULT NULL,
    managed_club_name     VARCHAR(120)  DEFAULT NUL
<truncated 6074 bytes>
          'USER', '8'),
(4, 'JOIN_CLUB', 'Requested to join Coding Club',      'CLUB', 'c1'),
(5, 'JOIN_CLUB', 'Requested to join Coding Club',      'CLUB', 'c1'),
(4, 'CREATE_EVENT', 'Submitted Hackathon 2025',        'EVENT', 'e1'),
(5, 'CREATE_EVENT', 'Submitted Web Dev Workshop',      'EVENT', 'e2');


-- ────────────────────────────────────────────────────────────
-- 5. USEFUL VIEWS  (optional – for admin reporting)
-- ────────────────────────────────────────────────────────────

-- Active users per role
CREATE OR REPLACE VIEW vw_users_by_role AS
SELECT
    role,
    COUNT(*) AS total,
    SUM(active = 1) AS active_count,
    SUM(active = 0) AS inactive_count
FROM users
GROUP BY role;

-- Recent activity (last 100 entries) with user names
CREATE OR REPLACE VIEW vw_recent_activity AS
SELECT
    al.id,
    u.name        AS user_name,
    u.email       AS user_email,
    u.role        AS user_role,
    al.action,
    al.detail,
    al.entity_type,
    al.entity_id,
    al.created_at
FROM activity_logs al
JOIN users u ON u.id = al.user_id
ORDER BY al.created_at DESC
LIMIT 100;


-- ────────────────────────────────────────────────────────────
-- 6. VERIFICATION QUERIES
--    Run these to confirm the schema is correct.
-- ────────────────────────────────────────────────────────────

-- SHOW TABLES;
-- SELECT id, name, email, role, active FROM users;
-- SELECT * FROM vw_users_by_role;
-- SELECT * FROM vw_recent_activity LIMIT 10;
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-06-06T07:59:47+05:30.
</ADDITIONAL_METADATA>