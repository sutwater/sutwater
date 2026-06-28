package repositories

import (
	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

type GenderRepository interface {
	FindAll() ([]entity.Genders, error)
}

type genderRepository struct {
	db *gorm.DB
}

func NewGenderRepository(db *gorm.DB) GenderRepository {
	return &genderRepository{db: db}
}

func (r *genderRepository) FindAll() ([]entity.Genders, error) {
	var genders []entity.Genders
	if err := r.db.Find(&genders).Error; err != nil {
		return nil, err
	}
	return genders, nil
}
