package entity

import (
	"time"

	"gorm.io/gorm"
)

type WaterMeterValue struct {
	gorm.Model

	MeterValue    uint
	Timestamp     time.Time
	OCRConfidence uint

	MacAddress   string
	CameraDevice *CameraDevice `gorm:"foreignKey:MacAddress;references:MacAddress"`

	WaterMeterImageID uint
	WaterMeterImage   *WaterMeterImage `gorm:"foreignKey:WaterMeterImageID"`

	WaterUsageLog []WaterUsageLog `gorm:"foreignKey:WaterMeterValueID"`
}
