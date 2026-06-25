package maintainlog

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/services"
)

type MaintainLogHandler struct {
	maintainLogService services.MaintainLogService
	validate           *validator.Validate
}

func NewMaintainLogHandler(router *gin.RouterGroup, maintainLogService services.MaintainLogService) *MaintainLogHandler {
	handler := &MaintainLogHandler{
		maintainLogService: maintainLogService,
		validate:           validator.New(),
	}

	g := router.Group("maintain-logs")
	g.GET("", handler.GetAll)
	g.GET("/statuses", handler.GetStatuses)
	g.GET("/:id", handler.GetByID)
	g.POST("", handler.Create)
	g.PUT("/:id", handler.Update)
	g.DELETE("/:id", handler.Delete)

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
