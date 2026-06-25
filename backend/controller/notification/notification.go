package notification

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/services"
)

type notificationHandler struct {
	service services.NotificationService
}

func NewNotificationHandler(router *gin.RouterGroup, service services.NotificationService) {
	h := &notificationHandler{service: service}

	g := router.Group("/notifications")
	g.GET("", h.GetAll)
	g.GET("/stats", h.GetStats)
	g.PUT("/read-all", h.MarkAllAsRead)
	g.GET("/:id", h.GetByID)
	g.PUT("/:id/read", h.MarkAsRead)
	g.DELETE("/:id", h.Delete)
}

func (h *notificationHandler) GetAll(c *gin.Context) {
	data, err := h.service.GetAll()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, data)
}

func (h *notificationHandler) GetStats(c *gin.Context) {
	stats, err := h.service.GetStats()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, stats)
}

func (h *notificationHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	data, err := h.service.GetByID(uint(id))
	if err != nil {
		utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, data)
}

func (h *notificationHandler) MarkAsRead(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	data, err := h.service.MarkAsRead(uint(id))
	if err != nil {
		utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, data)
}

func (h *notificationHandler) MarkAllAsRead(c *gin.Context) {
	if err := h.service.MarkAllAsRead(); err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, gin.H{"message": "all notifications marked as read"})
}

func (h *notificationHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.NewError(c, http.StatusBadRequest, utils.ErrInvalidID)
		return
	}

	if err := h.service.Delete(uint(id)); err != nil {
		utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
		return
	}
	utils.JSONSuccess(c, http.StatusOK, gin.H{"message": "notification deleted"})
}
