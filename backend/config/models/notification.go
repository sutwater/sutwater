package models

type NotificationResponse struct {
	ID           uint            `json:"id"`
	Message      string          `json:"message"`
	IsRead       bool            `json:"is_read"`
	DeviceID     *uint           `json:"device_id"`
	Device       *DeviceResponse `json:"device,omitempty"`
	TargetUserID *uint           `json:"target_user_id,omitempty"`
	CreatedAt    string          `json:"created_at"`
	UpdatedAt    string          `json:"updated_at"`
}

type NotificationStatsResponse struct {
	Total     int64  `json:"total"`
	Read      int64  `json:"read"`
	Unread    int64  `json:"unread"`
	LastAlert string `json:"last_alert,omitempty"`
}
