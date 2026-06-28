package entity

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email" gorm:"uniqueIndex"`
	Password  string    `json:"-"`
	BirthDay  time.Time `json:"birthday"`

	ProfileImage string `json:"profile_image"`

	// เอาไว้เก็บข้อมูลจาก google
	Provider   string `json:"provider"`
	ProviderID string `json:"provider_id"`

	// FK สำหรับเพศ (nullable — ไม่บังคับตอน register)
	GenderID *uint    `json:"gender_id" gorm:"default:null"`
	Gender   *Genders `gorm:"foreignKey:GenderID" json:"gender"`

	// FK สำหรับบทบาท (default 4 = ผู้ใช้)
	RoleID uint  `json:"role_id" gorm:"default:4"`
	Role   *Role `gorm:"foreignKey:RoleID" json:"role"`

	// FK สำหรับตำแหน่ง (nullable — ไม่บังคับตอน register)
	PositionID *uint     `json:"position_id" gorm:"default:null"`
	Position   *Position `gorm:"foreignKey:PositionID" json:"position"`
}
