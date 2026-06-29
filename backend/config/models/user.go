package models

import "time"

type UserResponse struct {
	ID           uint   `json:"id"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Email        string `json:"email"`
	ProfileImage string `json:"profile_image"`
	GenderID     *uint  `json:"gender_id"`
	RoleID       uint   `json:"role_id"`
	PositionID   *uint  `json:"position_id"`

	BirthDay  time.Time `json:"birthday"`
	CreatedAt string    `json:"created_at"`
	UpdatedAt string    `json:"updated_at"`
}

type UpdateUserRequest struct {
	FirstName    string    `json:"first_name"    validate:"omitempty,min=1,max=100"`
	LastName     string    `json:"last_name"     validate:"omitempty,min=1,max=100"`
	Email        string    `json:"email"         validate:"omitempty,email"`
	BirthDay     time.Time `json:"birthday"      validate:"omitempty"`
	GenderID     *uint     `json:"gender_id"`
	ProfileImage string    `json:"profile_image"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8,max=72"`
}

type UpdateRolePositionRequest struct {
	RoleID     uint  `json:"role_id"     validate:"required,min=1"`
	PositionID *uint `json:"position_id"`
}
