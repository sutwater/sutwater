package models

type UserResponse struct {
	ID        uint   `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type UpdateUserRequest struct {
	Name     string `json:"name" validate:"omitempty,min=3,max=100"`
	Email    string `json:"email" validate:"omitempty,email"`
	Password string `json:"password" validate:"omitempty,min=8,max=72"`
}
