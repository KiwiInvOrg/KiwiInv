-- name: GetUserByID :one
-- Retrieves a single user by their unique ID.
SELECT * FROM users WHERE id = $1;

-- name: GetUserByGoogleID :one
-- Retrieves a user by their Google OAuth ID (used during login).
SELECT * FROM users WHERE google_id = $1;

-- name: GetUserByEmail :one
-- Retrieves a user by their email address.
SELECT * FROM users WHERE email = $1;

-- name: CreateUser :one
-- Creates a new user account from Google OAuth data.
INSERT INTO users (email, name, google_id, role)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateUser :one
-- Updates a user's name and role.
UPDATE users
SET name = $2, role = $3
WHERE id = $1
RETURNING *;

-- name: DeactivateUser :exec
-- Marks a user as inactive (soft delete).
UPDATE users SET is_active = false WHERE id = $1;
