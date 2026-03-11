-- name: GetJob :one
-- Retrieves a single job with its customer name.
SELECT j.*, c.name AS customer_name
FROM jobs j
JOIN customers c ON c.id = j.customer_id
WHERE j.id = $1;

-- name: ListJobs :many
-- Retrieves all jobs with customer names, newest first.
SELECT j.*, c.name AS customer_name
FROM jobs j
JOIN customers c ON c.id = j.customer_id
ORDER BY j.created_at DESC;

-- name: ListJobsByStatus :many
-- Retrieves jobs filtered by status, with customer names.
SELECT j.*, c.name AS customer_name
FROM jobs j
JOIN customers c ON c.id = j.customer_id
WHERE j.status = $1
ORDER BY j.created_at DESC;

-- name: CreateJob :one
-- Creates a new job with an auto-generated job number (KW-0001 format).
INSERT INTO jobs (customer_id, job_number, status, expected_completion, expected_delivery, total_price, notes)
VALUES ($1, 'KW-' || LPAD(nextval('job_number_seq')::text, 4, '0'), $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateJob :one
-- Updates all editable fields on an existing job.
UPDATE jobs
SET customer_id = $2, expected_completion = $3, expected_delivery = $4, total_price = $5, notes = $6
WHERE id = $1
RETURNING *;

-- name: UpdateJobStatus :one
-- Updates only the status of a job (used by kanban drag-drop).
UPDATE jobs SET status = $2 WHERE id = $1 RETURNING *;

-- name: DeleteJob :exec
-- Permanently deletes a job and its structures (CASCADE).
DELETE FROM jobs WHERE id = $1;

-- name: GetKanbanJobs :many
-- Retrieves all jobs with customer names for the kanban board view.
-- Results are ordered by creation date within each status group.
SELECT j.id, j.job_number, j.status, j.expected_completion, j.expected_delivery,
       j.total_price, j.notes, j.created_at, c.name AS customer_name
FROM jobs j
JOIN customers c ON c.id = j.customer_id
ORDER BY j.status, j.created_at;
