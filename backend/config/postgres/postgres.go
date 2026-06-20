package postgres

import (
	"fmt"

	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/config/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Setup() (*gorm.DB, error) {
	c, err := LoadConfig()
	if err != nil {
		return nil, err
	}

	postgres, err := ConnectDB(c)
	if err != nil {
		return nil, err
	}

	fmt.Println("Successfully connected to PostgreSQL!")
	return postgres, nil
}

func ConnectDB(c *models.Config) (*gorm.DB, error) {

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Bangkok",
		c.DBHost, c.DBUser, c.DBPassword, c.DBName, c.DBPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = config.SetupDatabase(db)
	if err != nil {
		return nil, err
	}

	return db, nil
}
