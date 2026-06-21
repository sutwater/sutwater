package users

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/services"
)

// AuthHandler handles authentication routes.
type AuthHandler struct {
	authService services.AuthService
	validate    *validator.Validate
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(authService services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validate:    validator.New(),
	}
}

// Register creates a new user account.
func (h *AuthHandler) Register(c *gin.Context) {
	var payload models.RegisterRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "invalid request payload", err.Error())
		return
	}

	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "validation error", err.Error())
		return
	}

	authResponse, err := h.authService.Register(payload)
	if err != nil {
		utils.JSONError(c, http.StatusBadRequest, "registration failed", err.Error())
		return
	}

	utils.JSONSuccess(c, http.StatusCreated, authResponse)
}

// Login authenticates a user and returns a JWT token.
func (h *AuthHandler) Login(c *gin.Context) {
	var payload models.LoginRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "invalid request payload", err.Error())
		return
	}

	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "validation error", err.Error())
		return
	}

	authResponse, err := h.authService.Login(payload)
	if err != nil {
		utils.JSONError(c, http.StatusUnauthorized, "login failed", err.Error())
		return
	}

	utils.JSONSuccess(c, http.StatusOK, authResponse)
}
