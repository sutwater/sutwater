package entity

import "gorm.io/gorm"

type CameraDevice struct {
	gorm.Model
	MacAddress   string `gorm:"uniqueIndex"`
	BrokenAmount uint
	Status       bool

	MeterLocationID *uint
	MeterLocation   *MeterLocation `gorm:"foreignKey:MeterLocationID"`

	WaterMeterValue []WaterMeterValue `gorm:"foreignKey:CameraDeviceID"`
	DailyWaterUsage []DailyWaterUsage `gorm:"foreignKey:CameraDeviceID"`
	Notification    []Notification    `gorm:"foreignKey:CameraDeviceID"`

	DeviceCredential DeviceCredential `gorm:"foreignKey:CameraDeviceID"`

}
