package entity

import "gorm.io/gorm"

type Meter struct {
	gorm.Model

	Name       string
	Latitude   float64
	Longtitude float64

	// ความสัมพันธ์: 1 มิเตอร์ -> หลาย log
	WaterUsageLogs []WaterUsageLog `gorm:"foreignKey:MeterID"`
}
