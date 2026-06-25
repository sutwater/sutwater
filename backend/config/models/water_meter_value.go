package models

import "time"

type WaterMeterValueRequest struct {
	MeterValue      int        `json:"meter_value"       validate:"required"`
	Timestamp       *time.Time `json:"timestamp"`
	ModelConfidence float64    `json:"model_confidence"`
	Note            string     `json:"note"`
	ImagePath       string     `json:"image_path"`
	DeviceID        uint       `json:"device_id"         validate:"required"`
}

type UpdateWaterMeterValueRequest struct {
	StatusID uint   `json:"status_id" validate:"omitempty"`
	Note     string `json:"note"      validate:"omitempty"`
}

type StatusValueResponse struct {
	ID          uint   `json:"id"`
	StatusValue string `json:"status_value"`
	Description string `json:"description"`
}

type WaterMeterValueUserInfo struct {
	ID        uint   `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type WaterMeterValueResponse struct {
	ID              uint                     `json:"id"`
	MeterValue      int                      `json:"meter_value"`
	Timestamp       string                   `json:"timestamp"`
	ModelConfidence float64                  `json:"model_confidence"`
	Note            string                   `json:"note"`
	ImagePath       string                   `json:"image_path"`
	DeviceID        uint                     `json:"device_id"`
	Device          *DeviceResponse          `json:"device,omitempty"`
	UserID          uint                     `json:"user_id"`
	User            *WaterMeterValueUserInfo `json:"user,omitempty"`
	StatusID        uint                     `json:"status_id"`
	Status          *StatusValueResponse     `json:"status,omitempty"`
	CreatedAt       string                   `json:"created_at"`
	UpdatedAt       string                   `json:"updated_at"`
}
