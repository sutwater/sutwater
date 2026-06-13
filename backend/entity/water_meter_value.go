package entity

import (
	"time"

	"gorm.io/gorm"
)

type WaterMeterValue struct {
	gorm.Model
	MeterValue      int       `json:"meter_value"`
	Timestamp       time.Time `json:"timestamp"`
	ModelConfidence float64   `json:"model_confidence"`
	Note            string    `json:"note"`
	ImagePath       string    `json:"image_path"`

	// FK สำหรับ Device
	DeviceID uint    `json:"device_id"`
	Device   *Device `gorm:"foreignKey:DeviceID" json:"device"`

	// FK สำหรับ User
	UserID uint  `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	// FK สำหรับ Status
	StatusID uint             `json:"status_id"`
	Status   StatusWaterValue `gorm:"foreignKey:StatusID" json:"status"`
}
