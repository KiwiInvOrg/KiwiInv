-- name: GetStructureTemplate :one
-- Retrieves a single structure template by ID.
SELECT * FROM structure_templates WHERE id = $1;

-- name: ListStructureTemplates :many
-- Retrieves all structure templates ordered by category then name.
SELECT * FROM structure_templates ORDER BY category, name;

-- name: CreateStructureTemplate :one
-- Creates a new structure template in the catalog.
INSERT INTO structure_templates (name, description, base_price, category)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateStructureTemplate :one
-- Updates an existing structure template.
UPDATE structure_templates
SET name = $2, description = $3, base_price = $4, category = $5
WHERE id = $1
RETURNING *;

-- name: DeleteStructureTemplate :exec
-- Permanently deletes a structure template.
-- Will fail if any job structures reference it (FK constraint).
DELETE FROM structure_templates WHERE id = $1;
