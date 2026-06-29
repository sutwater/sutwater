package repositories

import (
	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

type PositionRepository interface {
	FindAll() ([]entity.Position, error)
}

type positionRepository struct {
	db *gorm.DB
}

func NewPositionRepository(db *gorm.DB) PositionRepository {
	return &positionRepository{db: db}
}

func (r *positionRepository) FindAll() ([]entity.Position, error) {
	var positions []entity.Position
	if err := r.db.Find(&positions).Error; err != nil {
		return nil, err
	}
	return positions, nil
}
