package entity

import (
	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model
	Message string
	IsRead  bool

	CameraDeviceID uint
	CameraDevice   *CameraDevice `gorm:"foreignKey:CameraDeviceID"`
}
