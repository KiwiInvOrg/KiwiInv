-- Reverse the initial schema: drop tables in dependency order, then types and functions.

DROP TRIGGER IF EXISTS update_job_structures_updated_at ON job_structures;
DROP TRIGGER IF EXISTS update_structure_templates_updated_at ON structure_templates;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

DROP FUNCTION IF EXISTS update_updated_at_column;

DROP TABLE IF EXISTS job_structures;
DROP TABLE IF EXISTS structure_templates;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

DROP SEQUENCE IF EXISTS job_number_seq;

DROP TYPE IF EXISTS job_structure_status;
DROP TYPE IF EXISTS job_status;
DROP TYPE IF EXISTS user_role;
