-- Insert default ADMIN user (password is 'password')
INSERT INTO users (name, email, password_hash, role, active, email_verified)
VALUES ('System Admin', 'admin@campusclubs.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HCGKKf24s.w3lM5C5KOWq', 'ADMIN', 1, 1);

-- Insert default STUDENT user (password is 'password')
INSERT INTO users (name, email, password_hash, role, active, email_verified)
VALUES ('Test Student', 'student@campusclubs.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HCGKKf24s.w3lM5C5KOWq', 'STUDENT', 1, 1);
