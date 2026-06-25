package waterlog

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/services"
)

type WaterLogHandler struct {
	waterService services.WaterMeterValueService
	validate     *validator.Validate
}

func NewWaterLogHandler(router *gin.RouterGroup, waterService services.WaterMeterValueService) *WaterLogHandler {
	handler := &WaterLogHandler{
		waterService: waterService,
		validate:     validator.New(),
	}

	g := router.Group("water-values")
	g.GET("", handler.GetAll)
	g.GET("/latest", handler.GetLatest)
	g.GET("/pending", handler.GetPending)
	g.GET("/statuses", handler.GetStatuses)
	g.GET("/:id", handler.GetByID)
	g.POST("", handler.Create)
	g.PUT("/:id", handler.Update)
	g.DELETE("/:id", handler.Delete)

	return handler
}

// GetAll รองรับ query params: ?device_id=X&status_id=Y
func (h *WaterLogHandler) GetAll(c *gin.Context) {
	var deviceID *uint
	var statusID *uint

	if raw := c.Query("device_id"); raw != "" {
		if v, err := strconv.ParseUint(raw, 10, 64); err == nil {
			u := uint(v)
			deviceID = &u
		}
	}
	if raw := c.Query("status_id"); raw != "" {
		if v, err := strconv.ParseUint(raw, 10, 64); err == nil {
			u := uint(v)
			statusID = &u
		}
	}

	values, err := h.waterService.GetAll(deviceID, statusID)
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, values)
}

// GetLatest คืนค่ามิเตอร์ล่าสุดของแต่ละอุปกรณ์ (สำหรับ dashboard)
func (h *WaterLogHandler) GetLatest(c *gin.Context) {
	values, err := h.waterService.GetLatestPerDevice()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, values)
}

// GetPending คืนค่าที่รอการอนุมัติ (status=1)
func (h *WaterLogHandler) GetPending(c *gin.Context) {
	values, err := h.waterService.GetPending()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, values)
}

func (h *WaterLogHandler) GetStatuses(c *gin.Context) {
	statuses, err := h.waterService.GetStatuses()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, statuses)
}

func (h *WaterLogHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	value, err := h.waterService.GetByID(uint(id))
	if err != nil {
		utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, value)
}

func (h *WaterLogHandler) Create(c *gin.Context) {
	userID, exists := utils.GetUserIDFromContext(c)
	if !exists {
		utils.NewError(c, http.StatusUnauthorized, utils.ErrMissingID)
		return
	}

	var payload models.WaterMeterValueRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}
	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	value, err := h.waterService.Create(payload, userID)
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrCreateFailed)
		return
	}
	utils.JSONSuccess(c, http.StatusCreated, value)
}

// Update เปลี่ยน status (อนุมัติ/ปฏิเสธ) หรือเพิ่ม note
func (h *WaterLogHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	var payload models.UpdateWaterMeterValueRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}
	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	value, err := h.waterService.Update(uint(id), payload)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrUpdateFailed)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, value)
}

func (h *WaterLogHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	if err := h.waterService.Delete(uint(id)); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrDeleteFailed)
		return
	}
	utils.JSONSuccess(c, http.StatusNoContent, nil)
}
