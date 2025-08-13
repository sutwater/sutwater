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

	MacAddressID uint
	CameraDevice *CameraDevice `gorm:"foreignKey:MacAddressID;references:MacAddress"`

	WaterMeterImageID uint
	WaterMeterImage   *WaterMeterImage `gorm:"foreignKey:WaterMeterImageID"`

	WaterUsageLog []WaterUsageLog `gorm:"foreignKey:WaterMeterValueID"`
}
