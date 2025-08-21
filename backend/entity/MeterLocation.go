package entity

import "gorm.io/gorm"

type MeterLocation struct {
	gorm.Model
	Name      string
	Latitude  float64
	Longitude float64

	CameraDevice []CameraDevice `gorm:"foreignKey:MeterLocationID"`
}
