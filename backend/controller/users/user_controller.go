package users

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/services"
)

type UserHandler struct {
	userService services.UserService
	validate    *validator.Validate
}

func NewUserHandler(router *gin.RouterGroup, userService services.UserService) *UserHandler {

	handler := &UserHandler{
		userService: userService,
		validate:    validator.New(),
	}

	user := router.Group("users")
	user.GET("", handler.GetAllUsers)
	user.GET("/:id", handler.GetProfile)
	user.PUT("/:id", handler.UpdateProfile)
	user.PUT("/:id/change-password", handler.ChangePassword)
	user.DELETE("/:id", handler.DeleteUser)

	return handler
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := utils.GetUserIDFromContext(c)
	if !exists {
		utils.NewError(c, http.StatusUnauthorized, utils.ErrMissingID)
		return
	}

	user, err := h.userService.GetProfile(userID)
	if err != nil {
		utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
		return
	}

	utils.JSONSuccess(c, http.StatusOK, user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := utils.GetUserIDFromContext(c)
	if !exists {
		utils.NewError(c, http.StatusUnauthorized, utils.ErrMissingID)
		return
	}

	var payload models.UpdateUserRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}

	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	updatedUser, err := h.userService.UpdateProfile(userID, payload)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrUpdateFailed)
		return
	}

	utils.JSONSuccess(c, http.StatusOK, updatedUser)
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID, exists := utils.GetUserIDFromContext(c)
	if !exists {
		utils.NewError(c, http.StatusUnauthorized, utils.ErrMissingID)
		return
	}

	var payload models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}

	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	if err := h.userService.ChangePassword(userID, payload); err != nil {
		if err.Error() == "old password is incorrect" {
			utils.NewError(c, http.StatusBadRequest, utils.ErrWrongPassword)
			return
		}
		utils.NewError(c, http.StatusBadRequest, utils.ErrUpdateFailed)
		return
	}

	utils.JSONSuccess(c, http.StatusOK, gin.H{"message": "password changed successfully"})
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	userID, exists := utils.GetUserIDFromContext(c)
	if !exists {
		utils.NewError(c, http.StatusUnauthorized, utils.ErrMissingID)
		return
	}

	if err := h.userService.DeleteUser(userID); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrDeleteFailed)
		return
	}

	utils.JSONSuccess(c, http.StatusNoContent, nil)
}

func (h *UserHandler) GetAllUsers(c *gin.Context) {
	users, err := h.userService.GetAllUsers()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}

	utils.JSONSuccess(c, http.StatusOK, users)
}
