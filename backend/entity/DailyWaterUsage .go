package entity

import (
	"time"

	"gorm.io/gorm"
)

type DailyWaterUsage struct {
	gorm.Model

	Timestamp time.Time
	Usage     uint

	CameraDeviceID uint
	CameraDevice   *CameraDevice `gorm:"foreignKey:CameraDeviceID"`
}
