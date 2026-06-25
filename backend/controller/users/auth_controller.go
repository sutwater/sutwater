package users

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/services"
)

type AuthHandler struct {
	authService services.AuthService
	validate    *validator.Validate
}

func NewAuthHandler(router *gin.RouterGroup, authService services.AuthService) *AuthHandler {
	handler := &AuthHandler{
		authService: authService,
		validate:    validator.New(),
	}

	auth := router.Group("auth")
	auth.POST("/register", handler.Register)
	auth.POST("/login", handler.Login)

	return handler
}

func (h *AuthHandler) Register(c *gin.Context) {
	var payload models.RegisterRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}

	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	authResponse, err := h.authService.Register(payload)
	if err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrCreateFailed.Error(), err.Error())
		return
	}

	utils.JSONSuccess(c, http.StatusCreated, authResponse)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var payload models.LoginRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}

	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	authResponse, err := h.authService.Login(payload)
	if err != nil {
		utils.NewError(c, http.StatusUnauthorized, utils.ErrUnauthorized)
		return
	}

	utils.JSONSuccess(c, http.StatusOK, authResponse)
}
