-- name: GetCustomer :one
-- Retrieves a single customer by ID.
SELECT * FROM customers WHERE id = $1;

-- name: ListCustomers :many
-- Retrieves all customers ordered alphabetically by name.
SELECT * FROM customers ORDER BY name;

-- name: SearchCustomers :many
-- Searches customers by name using case-insensitive pattern matching.
SELECT * FROM customers WHERE name ILIKE '%' || $1 || '%' ORDER BY name;

-- name: CreateCustomer :one
-- Creates a new customer record.
INSERT INTO customers (name, email, phone, address)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateCustomer :one
-- Updates all fields on an existing customer.
UPDATE customers
SET name = $2, email = $3, phone = $4, address = $5
WHERE id = $1
RETURNING *;

-- name: DeleteCustomer :exec
-- Permanently deletes a customer by ID.
-- Will fail if the customer has associated jobs (FK constraint).
DELETE FROM customers WHERE id = $1;
