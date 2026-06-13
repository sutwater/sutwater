package entity

import "gorm.io/gorm"

type DeviceCredential struct{
	gorm.Model
	DeviceID uint
	Username       string `gorm:"uniqueIndex"`
	Password  string
}
