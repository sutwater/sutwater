package entity

import "gorm.io/gorm"

type StatusMeter struct {
	gorm.Model
	Name string
}
