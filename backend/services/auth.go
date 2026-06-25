package services

import (
	"errors"

	"time"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/entity"
	"github.com/watermeter/suth/repositories"
)

// JwtWrapper wraps the signing key and the issuer

type AuthService interface {
	Register(input models.RegisterRequest) (*models.AuthResponse, error)
	Login(input models.LoginRequest) (*models.AuthResponse, error)
}

type authService struct {
	userRepo    repositories.UserRepository
	jwtProvider utils.JWTProvider
}

func NewAuthService(userRepo repositories.UserRepository, jwtProvider utils.JWTProvider) AuthService {
	return &authService{
		userRepo:    userRepo,
		jwtProvider: jwtProvider,
	}
}

func (a *authService) Register(input models.RegisterRequest) (*models.AuthResponse, error) {
	existing, err := a.userRepo.FindByEmail(input.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("email already exist")
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	user := &entity.User{
		Email:    input.Email,
		Password: hashedPassword,
	}

	if err := a.userRepo.Create(user); err != nil {
		return nil, err
	}

	token, err := a.jwtProvider.GenerateToken(user.ID, user.RoleID)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token: token,
		User: &models.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.Format(time.RFC3339),
			UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
		},
	}, nil
}

func (a *authService) Login(input models.LoginRequest) (*models.AuthResponse, error) {
	user, err := a.userRepo.FindByEmail(input.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid email or password")
	}

	if err := utils.ComparePassword(user.Password, input.Password); err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := a.jwtProvider.GenerateToken(user.ID, user.RoleID)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token: token,
		User: &models.UserResponse{
			ID:           user.ID,
			FirstName:    user.FirstName,
			LastName:     user.LastName,
			GenderID:     user.GenderID,
			RoleID:       user.RoleID,
			PositionID:   user.PositionID,
			ProfileImage: user.ProfileImage,
			BirthDay:     user.BirthDay,
			Email:        user.Email,
			CreatedAt:    user.CreatedAt.Format(time.RFC3339),
			UpdatedAt:    user.UpdatedAt.Format(time.RFC3339),
		},
	}, nil
}
