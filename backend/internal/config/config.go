// Package config handles application configuration loaded from environment variables.
package config

import (
	"bufio"
	"log"
	"os"
	"strings"
)

// Config holds all application configuration values.
type Config struct {
	Port        string // HTTP server port (default: "8080")
	DatabaseURL string // PostgreSQL connection string
	FrontendURL string // Frontend origin for CORS (default: "http://localhost:3000")
	Environment string // "development" or "production" (default: "development")

	// Google OAuth
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	// JWT
	JWTSecret string
}

// Load reads configuration from a .env file (if present) and environment variables.
// Environment variables take precedence over .env values.
func Load() *Config {
	loadEnvFile(".env")

	return &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:3000"),
		Environment:        getEnv("ENVIRONMENT", "development"),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/auth/google/callback"),
		JWTSecret:          getEnv("JWT_SECRET", ""),
	}
}

// loadEnvFile reads a .env file and sets environment variables for any keys
// not already present in the environment. This ensures real env vars take precedence.
func loadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		// .env file is optional; skip silently if not found
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, found := strings.Cut(line, "=")
		if !found {
			continue
		}

		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)

		// Only set if not already present in environment
		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, value)
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("warning: error reading .env file: %v", err)
	}
}

// getEnv returns the value of an environment variable, or a fallback default.
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
