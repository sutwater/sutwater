package entity

import "gorm.io/gorm"

type CameraDevice struct {
	gorm.Model
	Name       string
	MacAddress uint
	Battery    uint
	Wifi       bool
	Status     bool

	MeterLocationID uint
	MeterLocation   *MeterLocation `gorm:"foreignKey:MeterLocationID"`

	WaterMeterValue []WaterMeterValue `gorm:"foreignKey:MacAddressID"`
	Notification    []Notification    `gorm:"foreignKey:CameraDeviceID"`
}
