package waterlog

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

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

	staffOnly := utils.RequireRole(utils.RoleAdmin, utils.RoleEngineer, utils.RoleTechnician)
	adminOrEngineer := utils.RequireRole(utils.RoleAdmin, utils.RoleEngineer)

	g := router.Group("water-values")
	g.GET("", staffOnly, handler.GetAll)
	g.GET("/latest", staffOnly, handler.GetLatest)
	g.GET("/pending", staffOnly, handler.GetPending)
	g.GET("/statuses", staffOnly, handler.GetStatuses)
	g.GET("/:id", staffOnly, handler.GetByID)
	g.POST("", adminOrEngineer, handler.Create)
	g.POST("/manual", adminOrEngineer, handler.CreateManual)
	g.PUT("/:id", adminOrEngineer, handler.Update)
	g.DELETE("/:id", adminOrEngineer, handler.Delete)

	return handler
}

// GetAll รองรับ query params: ?device_id=X&status_id=Y&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
func (h *WaterLogHandler) GetAll(c *gin.Context) {
	var deviceID *uint
	var statusID *uint
	var startDate *time.Time
	var endDate *time.Time

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
	if raw := c.Query("start_date"); raw != "" {
		if t, err := time.ParseInLocation("2006-01-02", raw, time.Local); err == nil {
			startDate = &t
		}
	}
	if raw := c.Query("end_date"); raw != "" {
		if t, err := time.ParseInLocation("2006-01-02", raw, time.Local); err == nil {
			end := time.Date(t.Year(), t.Month(), t.Day(), 23, 59, 59, 0, time.Local)
			endDate = &end
		}
	}

	values, err := h.waterService.GetAll(deviceID, statusID, startDate, endDate)
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

// CreateManual รับ multipart/form-data พร้อม optional image file
func (h *WaterLogHandler) CreateManual(c *gin.Context) {
	userID, exists := utils.GetUserIDFromContext(c)
	if !exists {
		utils.NewError(c, http.StatusUnauthorized, utils.ErrMissingID)
		return
	}

	meterValueStr := c.PostForm("meter_value")
	meterValue, err := strconv.Atoi(meterValueStr)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}

	deviceIDStr := c.PostForm("device_id")
	deviceID64, err := strconv.ParseUint(deviceIDStr, 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}

	payload := models.WaterMeterValueRequest{
		MeterValue: meterValue,
		DeviceID:   uint(deviceID64),
		Note:       c.PostForm("note"),
		StatusID:   2, // manual entry → approve ทันที
	}

	if tsStr := c.PostForm("timestamp"); tsStr != "" {
		if t, err := time.Parse(time.RFC3339, tsStr); err == nil {
			payload.Timestamp = &t
		}
	}

	if file, header, ferr := c.Request.FormFile("image"); ferr == nil {
		defer file.Close()
		ext := filepath.Ext(header.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		filename := fmt.Sprintf("manual_%d_%s%s", userID, time.Now().Format("20060102_150405"), ext)
		dst := filepath.Join("uploads", filename)
		if saveErr := c.SaveUploadedFile(header, dst); saveErr == nil {
			payload.ImagePath = "uploads/" + filename
		}
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
