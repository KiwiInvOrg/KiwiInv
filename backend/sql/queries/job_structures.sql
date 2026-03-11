-- name: GetJobStructure :one
-- Retrieves a single job structure by ID.
SELECT js.*, st.name AS template_name
FROM job_structures js
LEFT JOIN structure_templates st ON st.id = js.template_id
WHERE js.id = $1;

-- name: ListJobStructures :many
-- Retrieves all structures for a given job, with template names.
SELECT js.*, st.name AS template_name
FROM job_structures js
LEFT JOIN structure_templates st ON st.id = js.template_id
WHERE js.job_id = $1
ORDER BY js.created_at;

-- name: CreateJobStructure :one
-- Adds a structure to a job, optionally referencing a template.
INSERT INTO job_structures (job_id, template_id, custom_name, quantity, unit_price, notes)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateJobStructure :one
-- Updates fields on an existing job structure.
UPDATE job_structures
SET template_id = $2, custom_name = $3, quantity = $4, unit_price = $5, status = $6, notes = $7
WHERE id = $1
RETURNING *;

-- name: DeleteJobStructure :exec
-- Permanently deletes a job structure.
DELETE FROM job_structures WHERE id = $1;
