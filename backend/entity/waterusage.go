package entity

import "time"

type WaterUsage struct {
	ID         uint      `json:"id" gorm:"primaryKey"` // ← เปลี่ยนเป็น uint
	LocationID string    `json:"locationId"`
	Timestamp  time.Time `json:"timestamp"`
	Usage      float64   `json:"usage"`
	Unit       string    `json:"unit"`
	Source     string    `json:"source"`
}
