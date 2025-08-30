package entity

import (
	"time"

	"gorm.io/gorm"
)

type DailyWaterUsage struct {
	gorm.Model

	Timestamp time.Time
	Usage     int

	CameraDeviceID uint
	CameraDevice   *CameraDevice `gorm:"foreignKey:CameraDeviceID"`
}
