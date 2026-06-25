package device

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/services"
)

type DeviceHandler struct {
	deviceService services.DeviceService
	validate      *validator.Validate
}

func NewDeviceHandler(router *gin.RouterGroup, deviceService services.DeviceService) *DeviceHandler {
	handler := &DeviceHandler{
		deviceService: deviceService,
		validate:      validator.New(),
	}

	adminOrEngineer := utils.RequireRole(utils.RoleAdmin, utils.RoleEngineer)

	g := router.Group("devices")
	g.GET("", adminOrEngineer, handler.GetAll)
	g.GET("/available-locations", adminOrEngineer, handler.GetAvailableLocations)
	g.GET("/:id", adminOrEngineer, handler.GetByID)
	g.POST("", adminOrEngineer, handler.Create)
	g.PUT("/:id", adminOrEngineer, handler.Update)
	g.DELETE("/:id", adminOrEngineer, handler.Delete)

	return handler
}

func (h *DeviceHandler) GetAll(c *gin.Context) {
	devices, err := h.deviceService.GetAll()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, devices)
}

func (h *DeviceHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	device, err := h.deviceService.GetByID(uint(id))
	if err != nil {
		utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, device)
}

func (h *DeviceHandler) Create(c *gin.Context) {
	var payload models.DeviceRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}
	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	device, err := h.deviceService.Create(payload)
	if err != nil {
		if err.Error() == "mac address already exists" {
			utils.NewError(c, http.StatusConflict, utils.ErrConflict)
			return
		}
		if err.Error() == "location not found" {
			utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
			return
		}
		utils.NewError(c, http.StatusInternalServerError, utils.ErrCreateFailed)
		return
	}
	utils.JSONSuccess(c, http.StatusCreated, device)
}

func (h *DeviceHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	var payload models.UpdateDeviceRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}
	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	device, err := h.deviceService.Update(uint(id), payload)
	if err != nil {
		if err.Error() == "mac address already exists" {
			utils.NewError(c, http.StatusConflict, utils.ErrConflict)
			return
		}
		if err.Error() == "location not found" {
			utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
			return
		}
		utils.NewError(c, http.StatusBadRequest, utils.ErrUpdateFailed)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, device)
}

func (h *DeviceHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	if err := h.deviceService.Delete(uint(id)); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrDeleteFailed)
		return
	}
	utils.JSONSuccess(c, http.StatusNoContent, nil)
}

func (h *DeviceHandler) GetAvailableLocations(c *gin.Context) {
	locations, err := h.deviceService.GetAvailableLocations()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, locations)
}
