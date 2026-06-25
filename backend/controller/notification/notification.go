package notification

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/entity"
)

func GetNotificationsByMeterLocation(c *gin.Context) {
	db := config.DB()
	if db == nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}

	meterLocationID := c.Param("id")

	var notifications []entity.Message

	err := db.
		Joins("JOIN camera_devices ON camera_devices.id = notifications.camera_device_id").
		Where("camera_devices.meter_location_id = ?", meterLocationID).
		Preload("CameraDevice").
		Find(&notifications).Error

	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, utils.ErrInternalServer.Error(), err.Error())
		return
	}

	c.JSON(http.StatusOK, notifications)
}

func GetAllNotifications(c *gin.Context) {
	var notifications []entity.Message

	if err := config.DB().
		Preload("CameraDevice").
		Preload("CameraDevice.MeterLocation").
		Order("created_at DESC").
		Find(&notifications).Error; err != nil {
		utils.JSONError(c, http.StatusInternalServerError, utils.ErrInternalServer.Error(), err.Error())
		return
	}

	c.JSON(http.StatusOK, notifications)
}

func ReadNotificationByID(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var notif entity.Message
	if err := db.First(&notif, id).Error; err != nil {
		utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
		return
	}

	if !notif.IsRead {
		notif.IsRead = true
		if err := db.Save(&notif).Error; err != nil {
			utils.NewError(c, http.StatusInternalServerError, utils.ErrUpdateFailed)
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notification marked as read",
		"data":    notif,
	})
}

func ReadAllNotifications(c *gin.Context) {
	db := config.DB()

	var notifications []entity.Message
	if err := db.Find(&notifications).Error; err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}

	for i := range notifications {
		if !notifications[i].IsRead {
			notifications[i].IsRead = true
			db.Save(&notifications[i])
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "All notifications marked as read",
		"data":    notifications,
	})
}

func DeleteNotificationByID(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var notif entity.Message
	if err := db.First(&notif, id).Error; err != nil {
		utils.NewError(c, http.StatusNotFound, utils.ErrNotFound)
		return
	}

	if err := db.Delete(&notif).Error; err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrDeleteFailed)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted successfully"})
}

func GetNotificationStats(c *gin.Context) {
	db := config.DB()
	if db == nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}

	var totalNotifications int64
	var readNotifications int64
	var unreadNotifications int64

	db.Model(&entity.Message{}).Count(&totalNotifications)
	db.Model(&entity.Message{}).Where("is_read = ?", true).Count(&readNotifications)
	db.Model(&entity.Message{}).Where("is_read = ?", false).Count(&unreadNotifications)

	var lastNotification entity.Message
	var lastAlert string
	if err := db.Order("created_at DESC").First(&lastNotification).Error; err == nil {
		lastAlert = lastNotification.CreatedAt.Format("2006-01-02 15:04:05")
	}

	c.JSON(http.StatusOK, gin.H{
		"totalNotifications":  totalNotifications,
		"readNotifications":   readNotifications,
		"unreadNotifications": unreadNotifications,
		"lastAlert":           lastAlert,
	})
}
