package entity

import (
	"time"

	"gorm.io/gorm"
)

type WaterMeterValue struct {
	gorm.Model
	MeterValue      int
	Timestamp       time.Time
	ModelConfidence float64 `json:"OCRConfidence"`
	Note            string

	CameraDeviceID uint
	CameraDevice   *CameraDevice `gorm:"foreignKey:CameraDeviceID"`

	WaterMeterImageID uint
	WaterMeterImage   *WaterMeterImage `gorm:"foreignKey:WaterMeterImageID"`

	UserID uint
	User   Users `gorm:"foreignKey:UserID"`

	StatusID uint
	Status   StatusWaterValue `gorm:"foreignKey:StatusID"`
}
