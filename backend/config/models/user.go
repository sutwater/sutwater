package models

import "time"

type UserResponse struct {
	ID        uint      `json:"id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	BirthDay  time.Time `json:"birthday"`
	CreatedAt string    `json:"created_at"`
	UpdatedAt string    `json:"updated_at"`
}

type UpdateUserRequest struct {
	FirstName string    `json:"first_name" validate:"omitempty,min=3,max=100"`
	LastName  string    `json:"last_name" validate:"omitempty,min=3,max=100"`
	BirthDay  time.Time `json:"birthday" validate:"omitempty,datetime=2006-01-02"` // บังคับ format YYYY-MM-DD
	Email     string    `json:"email" validate:"omitempty,email"`
	// Password  string  `json:"password" validate:"omitempty,min=8,max=72"`
}
