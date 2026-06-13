package entity

import "gorm.io/gorm"

type Device struct {
	gorm.Model
	MacAddress string `gorm:"uniqueIndex" json:"mac_address"`

	LocationID *uint      `json:"location_id"`
	Location   *Location `gorm:"foreignKey:LocationID" json:"location,omitempty"`

	WaterMeterValue []WaterMeterValue `gorm:"foreignKey:DeviceID"`
	Message         []Message         `gorm:"foreignKey:DeviceID"`

	DeviceCredential DeviceCredential `gorm:"foreignKey:DeviceID"`
}
