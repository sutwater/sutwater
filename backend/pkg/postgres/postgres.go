package postgres

import (
	"fmt"
	"log"

	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/pkg/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Setup() *gorm.DB {
	c := config.LoadConfig()
	postgres, err := ConnectDB(c)
	if err != nil {
		log.Fatal("Failed to connect to the database: ", err)
	}

	fmt.Println("Successfully connected to PostgreSQL!")
	return postgres
}

func ConnectDB(c *models.Config) (*gorm.DB, error) {
	fmt.Printf("Connecting to PostgreSQL with config: %+v\n", c)
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		c.DBHost, c.DBUser, c.DBPassword, c.DBName, c.DBPort, c.DBSslmode, c.DBTimezone)

	db, _ := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	return db, nil
}
