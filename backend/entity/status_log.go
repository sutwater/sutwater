package entity
import "gorm.io/gorm"

type StatusLog struct {
	gorm.Model
	StatusLog            string `json:"status_log"`
	Description     string `json:"description"`
	
	MaintainLog []MaintainLog `gorm:"foreignKey:StatusID" json:"maintain_log,omitempty"`
}