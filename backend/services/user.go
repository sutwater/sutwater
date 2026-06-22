package services

import (
	"errors"
	"time"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/entity"
	"github.com/watermeter/suth/repositories"
)

type UserService interface {
	GetProfile(userID uint) (*models.UserResponse, error)
	UpdateProfile(userID uint, input models.UpdateUserRequest) (*models.UserResponse, error)
	DeleteUser(userID uint) error
	GetAllUsers() ([]models.UserResponse, error)
}

type userService struct {
	userRepo repositories.UserRepository
}

// NewUserService creates a new user service.
func NewUserService(userRepo repositories.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetProfile(userID uint) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	return mapUserToResponse(user), nil
}

func (s *userService) UpdateProfile(userID uint, input models.UpdateUserRequest) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	if input.Email != "" && input.Email != user.Email {
		existing, err := s.userRepo.FindByEmail(input.Email)
		if err != nil {
			return nil, err
		}
		if existing != nil {
			return nil, errors.New("email already in use")
		}
		user.Email = input.Email
	}

	if input.FirstName != "" {
		user.FirstName = input.FirstName
	}

	if input.LastName != "" {
		user.LastName = input.LastName
	}

	// if input.Password != "" {
	// 	hashedPassword, err := utils.HashPassword(input.Password)
	// 	if err != nil {
	// 		return nil, err
	// 	}
	// 	user.Password = hashedPassword
	// }

	user.UpdatedAt = time.Now().UTC()
	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return mapUserToResponse(user), nil
}

func (s *userService) DeleteUser(userID uint) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}
	return s.userRepo.Delete(user)
}

func (s *userService) GetAllUsers() ([]models.UserResponse, error) {
	users, err := s.userRepo.FetchAll()
	if err != nil {
		return nil, err
	}

	result := make([]models.UserResponse, 0, len(users))
	for _, user := range users {
		result = append(result, *mapUserToResponse(&user))
	}
	return result, nil
}

func mapUserToResponse(user *entity.User) *models.UserResponse {
	return &models.UserResponse{
		ID:        user.ID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		BirthDay:  user.BirthDay,
		Email:     user.Email,
		CreatedAt: user.CreatedAt.Format(time.RFC3339),
		UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
	}
}
