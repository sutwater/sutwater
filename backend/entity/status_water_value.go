package entity

import "gorm.io/gorm"

type StatusWaterValue struct {
	gorm.Model
	StatusValue string `json:"status_value"`
	Description string `json:"description"`

	WaterMeterValue []WaterMeterValue `gorm:"foreignKey:StatusID" json:"water_meter_value,omitempty"`
}
