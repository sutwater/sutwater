package models

type LocationRequest struct {
	BuildingName string  `json:"building_name" validate:"required"`
	Latitude     float64 `json:"latitude"      validate:"required"`
	Longitude    float64 `json:"longitude"     validate:"required"`
}

type LocationResponse struct {
	ID           uint    `json:"id"`
	BuildingName string  `json:"building_name"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}
