package entity

import "time"

type WaterUsage struct {
	ID         string    `json:"id" bson:"_id,omitempty"`      // หรือใช้ gorm:"primaryKey"
	LocationID string    `json:"locationId" bson:"locationId"`
	Timestamp  time.Time `json:"timestamp" bson:"timestamp"`
	Usage      float64   `json:"usage" bson:"usage"`
	Unit       string    `json:"unit" bson:"unit"` // เช่น "L"
	Source     string    `json:"source" bson:"source"`
}
