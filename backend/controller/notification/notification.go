package notification

import (
	"net/http"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"

	"github.com/gin-gonic/gin"
)

func GetNotificationsByMeterLocation(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	// อ่าน MeterLocationID จาก URL param
	meterLocationID := c.Param("id")

	var notifications []entity.Notification

	err := db.
		Joins("JOIN camera_devices ON camera_devices.id = notifications.camera_device_id").
		Where("camera_devices.meter_location_id = ?", meterLocationID).
		Preload("CameraDevice").
		Find(&notifications).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

func GetAllNotifications(c *gin.Context) {
	var notifications []entity.Notification

	if err := config.DB().
		Preload("CameraDevice").
		Preload("CameraDevice.MeterLocation").
		Find(&notifications).Error; err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notifications)
}
