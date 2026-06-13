package entity

import "gorm.io/gorm"

type Location struct {
	gorm.Model
	BuildingName string  `json:"building_name"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`

	Device []Device `gorm:"foreignKey:LocationID" json:"device,omitempty"`
}
