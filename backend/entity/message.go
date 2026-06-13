package entity

import (
	"gorm.io/gorm"
)

type Message struct {
	gorm.Model
	Message string `json:"message"`
	IsRead  bool   `json:"is_read"`

	DeviceID *uint   `json:"device_id"`
	Device   *Device `gorm:"foreignKey:DeviceID" json:"device,omitempty"`
}
