package meter

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/services"
)

type MeterHandler struct {
	locationService services.LocationService
	validate        *validator.Validate
}

func NewMeterHandler(router *gin.RouterGroup, locationService services.LocationService) *MeterHandler {
	handler := &MeterHandler{
		locationService: locationService,
		validate:        validator.New(),
	}

	adminOrEngineer := utils.RequireRole(utils.RoleAdmin, utils.RoleEngineer)

	g := router.Group("meters")
	g.GET("", handler.GetAll)
	g.GET("/:id", handler.GetByID)
	g.POST("", adminOrEngineer, handler.Create)
	g.PUT("/:id", adminOrEngineer, handler.Update)
	g.DELETE("/:id", adminOrEngineer, handler.Delete)

	return handler
}

func (h *MeterHandler) GetAll(c *gin.Context) {
	locations, err := h.locationService.GetAll()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, locations)
}

func (h *MeterHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	loc, err := h.locationService.GetByID(uint(id))
	if err != nil {
		utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, loc)
}

func (h *MeterHandler) Create(c *gin.Context) {
	var payload models.LocationRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}
	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	loc, err := h.locationService.Create(payload)
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrCreateFailed)
		return
	}
	utils.JSONSuccess(c, http.StatusCreated, loc)
}

func (h *MeterHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	var payload models.LocationRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}
	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	loc, err := h.locationService.Update(uint(id), payload)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrUpdateFailed)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, loc)
}

func (h *MeterHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	if err := h.locationService.Delete(uint(id)); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrDeleteFailed)
		return
	}
	utils.JSONSuccess(c, http.StatusNoContent, nil)
}
