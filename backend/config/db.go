package config

import (
	"fmt"
	"time"

	"example.com/sa-67-example/entity"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {
	database, err := gorm.Open(sqlite.Open("watermeter.db?cache=shared"), &gorm.Config{})

	if err != nil {
		panic("failed to connect database")
	}

	fmt.Println("connected database")
	db = database
}

func SetupDatabase() {

	db.AutoMigrate(
		&entity.Users{},
		&entity.Genders{},
		&entity.Meter{},
	)

	GenderMale := entity.Genders{Gender: "Male"}
	GenderFemale := entity.Genders{Gender: "Female"}

	db.FirstOrCreate(&GenderMale, &entity.Genders{Gender: "Male"})
	db.FirstOrCreate(&GenderFemale, &entity.Genders{Gender: "Female"})

	MeterExample := entity.Meter{
		Name:       "อาคารรัตนเวชพัฒน์",
		Latitude:   14.86412,
		Longtitude: 102.03557,
	}

	MeterExample1 := entity.Meter{
		Name:       "โรงอาหาร",
		Latitude:   14.86447,
		Longtitude: 102.03611,
	}

	db.FirstOrCreate(&MeterExample, &entity.Meter{Name: "อาคารรัตนเวชพัฒน์"})
	db.FirstOrCreate(&MeterExample1, &entity.Meter{Name: "โรงอาหาร"})

	hashedPassword, _ := HashPassword("123456")
	BirthDay, _ := time.Parse("2006-01-02", "1988-11-12")

	User := &entity.Users{

		FirstName: "Software",
		LastName:  "Analysis",
		Email:     "sa@gmail.com",
		Age:       80,
		Password:  hashedPassword,
		BirthDay:  BirthDay,
		GenderID:  1,
	}

	db.FirstOrCreate(User, &entity.Users{
		Email: "sa@gmail.com",
	})

}
