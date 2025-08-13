package entity

import "gorm.io/gorm"

type CameraDevice struct {
	gorm.Model
	MacAddress uint `gorm:"uniqueIndex"`
	Battery    uint
	Wifi       bool
	Status     bool

	MeterLocationID uint
	MeterLocation   *MeterLocation `gorm:"foreignKey:MeterLocationID"`

	WaterMeterValue []WaterMeterValue `gorm:"foreignKey:MacAddressID;references:MacAddress"`
	Notification    []Notification    `gorm:"foreignKey:CameraDeviceID"`
}
