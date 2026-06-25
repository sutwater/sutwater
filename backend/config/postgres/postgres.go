package postgres

import (
	"flag"
	"fmt"

	"github.com/watermeter/suth/config/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Setup() (*gorm.DB, error) {
	// พิมพ์ -reset เพื่อล้างข้อมูล
	resetDB := flag.Bool("reset", false, "Reset the database schema before running")
	flag.Parse()

	c, err := LoadConfig()
	if err != nil {
		return nil, err
	}

	db, err := ConnectDB(c, *resetDB)
	if err != nil {
		return nil, err
	}

	fmt.Println("Successfully connected to PostgreSQL!")
	return db, nil
}

func ConnectDB(c *models.Config, resetDB bool) (*gorm.DB, error) {

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Bangkok",
		c.DBHost, c.DBUser, c.DBPassword, c.DBName, c.DBPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = SetupDatabase(db, resetDB)
	if err != nil {
		return nil, err
	}

	return db, nil
}
