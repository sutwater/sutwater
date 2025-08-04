package entity

import (
	"time"

	"gorm.io/gorm"
)

type WaterUsageLog struct {
	gorm.Model

	EditDate time.Time
	Amount   float64

	UpdatedByID uint
	UpdatedBy   Users `gorm:"foreignKey:UpdatedByID"`

	MeterID uint
	Meter   Meter `gorm:"foreignKey:MeterID"`
}
