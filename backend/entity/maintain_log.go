package entity

import (
	"time"

	"gorm.io/gorm"
)

type MaintainLog struct {
	gorm.Model
	Title        string    `json:"title"`
	LocationText string    `json:"location_text"`
	CloseAt      time.Time `json:"close_at"`

	LocationID *uint      `json:"location_id"`
	Location   *Location `gorm:"foreignKey:LocationID" json:"location,omitempty"`

	StatusID *uint      `json:"status_id"`
	Status   *StatusLog `gorm:"foreignKey:StatusID" json:"status,omitempty"`
}
