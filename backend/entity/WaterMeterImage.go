package entity

import (
	"gorm.io/gorm"
)

type WaterMeterImage struct {
	gorm.Model
	ImagePath string

	WaterMeterValue []WaterMeterValue `gorm:"foreignKey:WaterMeterImageID"`
}
