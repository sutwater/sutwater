package models

type DeviceRequest struct {
	MacAddress string `json:"mac_address" validate:"required"`
	Password   string `json:"password"    validate:"required,min=6"`
	LocationID uint   `json:"location_id" validate:"required"`
}

type UpdateDeviceRequest struct {
	MacAddress string `json:"mac_address" validate:"omitempty"`
	LocationID *uint  `json:"location_id" validate:"omitempty"`
}

type DeviceResponse struct {
	ID         uint              `json:"id"`
	MacAddress string            `json:"mac_address"`
	LocationID *uint             `json:"location_id"`
	Location   *LocationResponse `json:"location,omitempty"`
	CreatedAt  string            `json:"created_at"`
	UpdatedAt  string            `json:"updated_at"`
}
