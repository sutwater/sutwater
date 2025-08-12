package entity

import (
	"gorm.io/gorm"
)

type WaterUsageLog struct {
	gorm.Model
	AverageValue float64
	MinValue     float64
	MaxValue     float64
	BrokenAmount uint

	UserID uint
	Users  Users `gorm:"foreignKey:UserID"`

	WaterMeterValueID uint
	WaterMeterValue   *WaterMeterValue `gorm:"foreignKey:WaterMeterValueID"`
}
