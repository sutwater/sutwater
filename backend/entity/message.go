package entity

import (
	"gorm.io/gorm"
)

type Message struct {
	gorm.Model
	Message string `json:"message"`
	IsRead  bool   `json:"is_read"`

	// DeviceID ตั้งค่า = แจ้งเตือนจากมิเตอร์, nil = system notification
	DeviceID *uint   `json:"device_id"`
	Device   *Device `gorm:"foreignKey:DeviceID" json:"device,omitempty"`

	// TargetUserID ตั้งค่า = แจ้งเตือนเฉพาะ user นั้น (เช่น login, รายงานปัญหา)
	TargetUserID *uint `json:"target_user_id"`
	TargetUser   *User `gorm:"foreignKey:TargetUserID" json:"target_user,omitempty"`
}
