package maintainlog

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

type MaintainLogHandler struct {
	maintainLogService  services.MaintainLogService
	notificationService services.NotificationService
	validate            *validator.Validate
}

func NewMaintainLogHandler(router *gin.RouterGroup, maintainLogService services.MaintainLogService, notificationService services.NotificationService) *MaintainLogHandler {
	handler := &MaintainLogHandler{
		maintainLogService:  maintainLogService,
		notificationService: notificationService,
		validate:            validator.New(),
	}

	staffNoUser := utils.RequireRole(utils.RoleAdmin, utils.RoleEngineer, utils.RoleTechnician)
	adminOrEngineer := utils.RequireRole(utils.RoleAdmin, utils.RoleEngineer)

	g := router.Group("maintain-logs")
	g.GET("", staffNoUser, handler.GetAll)
	g.GET("/statuses", staffNoUser, handler.GetStatuses)
	g.GET("/:id", staffNoUser, handler.GetByID)
	g.POST("", handler.Create)          // ทุก role ส่งปัญหาได้ (JSON)
	g.POST("/report", handler.CreateReport) // ทุก role ส่งพร้อมรูป (multipart)
	g.PUT("/:id", staffNoUser, handler.Update)
	g.DELETE("/:id", adminOrEngineer, handler.Delete)

	return handler
}

func (h *MaintainLogHandler) GetAll(c *gin.Context) {
	logs, err := h.maintainLogService.GetAll()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, logs)
}

func (h *MaintainLogHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	log, err := h.maintainLogService.GetByID(uint(id))
	if err != nil {
		utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, log)
}

func (h *MaintainLogHandler) Create(c *gin.Context) {
	var payload models.MaintainLogRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}
	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	log, err := h.maintainLogService.Create(payload)
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrCreateFailed)
		return
	}

	// ส่ง system notification ให้ผู้รายงาน (ถ้ามี userID ใน context)
	if userID, ok := utils.GetUserIDFromContext(c); ok {
		_ = h.notificationService.CreateSystemNotification(
			"รายงานปัญหาของคุณถูกบันทึกแล้ว: "+log.Title, userID,
		)
	}

	utils.JSONSuccess(c, http.StatusCreated, log)
}

// CreateReport รับ multipart/form-data พร้อม optional image
func (h *MaintainLogHandler) CreateReport(c *gin.Context) {
	title := c.PostForm("title")
	locationText := c.PostForm("location_text")
	if title == "" || locationText == "" {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}

	payload := models.MaintainLogRequest{
		Title:        title,
		LocationText: locationText,
	}

	if raw := c.PostForm("location_id"); raw != "" {
		if v, err := strconv.ParseUint(raw, 10, 64); err == nil {
			u := uint(v)
			payload.LocationID = &u
		}
	}

	pending := uint(1)
	payload.StatusID = &pending

	if file, header, err := c.Request.FormFile("image"); err == nil {
		defer file.Close()
		ext := filepath.Ext(header.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		filename := fmt.Sprintf("maintain_%s%s", time.Now().Format("20060102_150405"), ext)
		dst := filepath.Join("uploads", filename)
		if saveErr := c.SaveUploadedFile(header, dst); saveErr == nil {
			payload.ImagePath = "uploads/" + filename
		}
	}

	log, err := h.maintainLogService.Create(payload)
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrCreateFailed)
		return
	}

	if userID, ok := utils.GetUserIDFromContext(c); ok {
		_ = h.notificationService.CreateSystemNotification(
			"รายงานปัญหาของคุณถูกบันทึกแล้ว: "+log.Title, userID,
		)
	}

	utils.JSONSuccess(c, http.StatusCreated, log)
}

func (h *MaintainLogHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	var payload models.UpdateMaintainLogRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidPayload)
		return
	}
	if err := h.validate.Struct(payload); err != nil {
		utils.JSONError(c, http.StatusBadRequest, utils.ErrValidation.Error(), err.Error())
		return
	}

	log, err := h.maintainLogService.Update(uint(id), payload)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrUpdateFailed)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, log)
}

func (h *MaintainLogHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	if err := h.maintainLogService.Delete(uint(id)); err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrDeleteFailed)
		return
	}
	utils.JSONSuccess(c, http.StatusNoContent, nil)
}

func (h *MaintainLogHandler) GetStatuses(c *gin.Context) {
	statuses, err := h.maintainLogService.GetStatuses()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, statuses)
}
