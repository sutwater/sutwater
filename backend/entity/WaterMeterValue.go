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

	CameraDeviceID uint
	CameraDevice   *CameraDevice `gorm:"foreignKey:CameraDeviceID"`

	WaterMeterImageID uint
	WaterMeterImage   *WaterMeterImage `gorm:"foreignKey:WaterMeterImageID"`

	UserID uint
	Users  Users `gorm:"foreignKey:UserID"`
}
