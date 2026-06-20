package models

import "time"

type Config struct {
	DBHost       string
	DBUser       string
	DBPassword   string
	DBName       string
	DBPort       string
	APIPort      string
	JWTSecret    string
	JWTExpiresIn time.Duration
}
