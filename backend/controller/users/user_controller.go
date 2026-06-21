package users

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/services"
)

// UserHandler handles user-related routes.
type UserHandler struct {
	userService services.UserService
	validate    *validator.Validate
}

// NewUserHandler constructs a new UserHandler.
func NewUserHandler(router *gin.RouterGroup, userService services.UserService) *UserHandler {

	handler := &UserHandler{
		userService: userService,
		validate:    validator.New(),
	}

	user := router.Group("users")
	user.GET("", handler.GetAllUsers)
	user.GET("/:id", handler.GetProfile)
	user.PUT("/:id", handler.UpdateProfile)
	user.DELETE("/:id", handler.DeleteUser)

	return handler
}

// GetProfile returns the current user's profile.
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := utils.GetUserIDFromContext(c)
	if !exists {
		utils.JSONError(c, http.StatusUnauthorized, "authorization required", "user id missing from token")
		return
	}

	user, err := h.userService.GetProfile(userID)
	if err != nil {
		utils.JSONError(c, http.StatusNotFound, "profile not found", err.Error())
		return
	}

	utils.JSONSuccess(c, http.StatusOK, user)
}

// UpdateProfile updates the current user's profile.
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := utils.GetUserIDFromContext(c)
	if !exists {
		utils.JSONError(c, http.StatusUnauthorized, "authorization required", "user id missing from token")
		return
	}

	var payload models.UpdateUserRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "invalid request payload", err.Error())
		return
	}

	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "validation error", err.Error())
		return
	}

	updatedUser, err := h.userService.UpdateProfile(userID, payload)
	if err != nil {
		utils.JSONError(c, http.StatusBadRequest, "update failed", err.Error())
		return
	}

	utils.JSONSuccess(c, http.StatusOK, updatedUser)
}

// DeleteUser deletes the current user account.
func (h *UserHandler) DeleteUser(c *gin.Context) {
	userID, exists := utils.GetUserIDFromContext(c)
	if !exists {
		utils.JSONError(c, http.StatusUnauthorized, "authorization required", "user id missing from token")
		return
	}

	if err := h.userService.DeleteUser(userID); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "delete failed", err.Error())
		return
	}

	utils.JSONSuccess(c, http.StatusNoContent, nil)
}

// GetAllUsers returns a list of all users.
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	users, err := h.userService.GetAllUsers()
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load users", err.Error())
		return
	}

	utils.JSONSuccess(c, http.StatusOK, users)
}
