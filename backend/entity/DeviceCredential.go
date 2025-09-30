package entity

import "gorm.io/gorm"

type DeviceCredential struct{
	gorm.Model
	CameraDeviceID uint
	Username       string `gorm:"uniqueIndex"`
	Password  string
}
