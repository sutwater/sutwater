package entity

import "gorm.io/gorm"

type CameraDevice struct {
	gorm.Model
	MacAddress   string
	Battery      uint
	BrokenAmount uint
	Wifi         bool
	Status       bool

	MeterLocationID uint
	MeterLocation   *MeterLocation `gorm:"foreignKey:MeterLocationID"`

	WaterMeterValue []WaterMeterValue `gorm:"foreignKey:CameraDeviceID"`
	DailyWaterUsage []DailyWaterUsage `gorm:"foreignKey:CameraDeviceID"`
	Notification    []Notification    `gorm:"foreignKey:CameraDeviceID"`
}
