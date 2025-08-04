package entity

import (
	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model

	Message  string
	Resolved bool

	UserResolvedID uint

	MeterID uint
}
