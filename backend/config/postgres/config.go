package postgres

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/watermeter/suth/config/models"
)

func LoadConfig() (*models.Config, error) {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("No .env file found, using system environment variables")
	}

	port := os.Getenv("API_PORT")
	if port == "" {
		port = ":8000"
	}

	expiresIn := os.Getenv("JWT_EXPIRES_IN")
	if expiresIn == "" {
		expiresIn = "10h"
	}

	duration, err := time.ParseDuration(expiresIn)
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRES_IN: %w", err)
	}

	c := &models.Config{
		DBHost:       os.Getenv("DB_HOST"),
		DBPort:       os.Getenv("DB_PORT"),
		DBUser:       os.Getenv("DB_USER"),
		DBPassword:   os.Getenv("DB_PASSWORD"),
		DBName:       os.Getenv("DB_NAME"),
		JWTSecret:    os.Getenv("JWT_SECRET_KEY"),
		JWTExpiresIn: duration,
		APIPort:      port,
	}

	if c.DBHost == "" || c.DBPort == "" || c.DBUser == "" || c.DBPassword == "" || c.DBName == "" || c.JWTSecret == "" {
		return nil, fmt.Errorf("missing required environment variables")
	}

	return c, nil
}
