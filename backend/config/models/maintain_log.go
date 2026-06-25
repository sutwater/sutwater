package models

import "time"

type MaintainLogRequest struct {
	Title        string     `json:"title"         validate:"required"`
	LocationText string     `json:"location_text" validate:"required"`
	CloseAt      *time.Time `json:"close_at"`
	LocationID   *uint      `json:"location_id"`
	StatusID     *uint      `json:"status_id"`
}

type UpdateMaintainLogRequest struct {
	Title        string     `json:"title"         validate:"omitempty"`
	LocationText string     `json:"location_text" validate:"omitempty"`
	CloseAt      *time.Time `json:"close_at"`
	LocationID   *uint      `json:"location_id"`
	StatusID     *uint      `json:"status_id"`
}

type StatusLogResponse struct {
	ID          uint   `json:"id"`
	StatusLog   string `json:"status_log"`
	Description string `json:"description"`
}

type MaintainLogResponse struct {
	ID           uint               `json:"id"`
	Title        string             `json:"title"`
	LocationText string             `json:"location_text"`
	CloseAt      string             `json:"close_at,omitempty"`
	LocationID   *uint              `json:"location_id"`
	Location     *LocationResponse  `json:"location,omitempty"`
	StatusID     *uint              `json:"status_id"`
	Status       *StatusLogResponse `json:"status,omitempty"`
	CreatedAt    string             `json:"created_at"`
	UpdatedAt    string             `json:"updated_at"`
}
