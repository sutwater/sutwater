package entity

import (
	"gorm.io/gorm"
)

type Message struct {
	gorm.Model
	Message string `json:"message"`
	IsRead  bool   `json:"is_read"`

	TargetUserID *uint `json:"target_user_id"`
	TargetUser   *User `gorm:"foreignKey:TargetUserID" json:"target_user,omitempty"`
}
