package entity

import "gorm.io/gorm"

type WaterMeterImage struct {
	gorm.Model
	ImagePath string
}
