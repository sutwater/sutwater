package entity

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username  string    `json:"username"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email" gorm:"uniqueIndex"`
	Age       uint8     `json:"age"`
	Password  string    `json:"-"`
	BirthDay  time.Time `json:"birthday"`

	ProfileImage string `json:"profile_image"`

	// เอาไว้เก็บข้อมูลจาก google
	Provider   string `json:"provider"`
	ProviderID string `json:"provider_id"`

	// FK สำหรับเพศ
	GenderID uint     `json:"gender_id"`
	Gender   *Genders `gorm:"foreignKey: GenderID" json:"gender"`

	// FK สำหรับบทบาท
	RoleID uint  `json:"role_id"`
	Role   *Role `gorm:"foreignKey: RoleID" json:"role"`

	// FK สำหรับตำแหน่ง
	PositionID uint      `json:"position_id"`
	Position   *Position `gorm:"foreignKey: PositionID" json:"position"`
}
