package entity

import "gorm.io/gorm"

type StatusWaterValue struct {
	gorm.Model
	Name            string
	Description     string
	WaterMeterValue []WaterMeterValue `gorm:"foreignKey:StatusID"`
}
