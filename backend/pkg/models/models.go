package models

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBUser     string
	DBPassword string
	DBName     string
	DBPort     string
	DBTimezone string
	DBSslmode  string
	APIPort    string
}

func LoadConfig() *Config {
	godotenv.Load()

	return &Config{
		DBHost:     os.Getenv("POSTGRES_DB_HOST"),
		DBUser:     os.Getenv("POSTGRES_DB_USER"),
		DBPassword: os.Getenv("POSTGRES_DB_PASSWORD"),
		DBName:     os.Getenv("POSTGRES_DB_NAME"),
		DBPort:     os.Getenv("POSTGRES_DB_PORT"),
		DBTimezone: os.Getenv("POSTGRES_DB_TIMEZONE"),
		DBSslmode:  os.Getenv("POSTGRES_DB_SSLMODE"),
		APIPort:    os.Getenv("API_PORT"),
	}
}
