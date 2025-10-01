package notification

import (
	"net/http"

	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/entity"

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
		Order("created_at DESC"). // เรียงจากล่าสุด
		Find(&notifications).Error; err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

func ReadNotificationByID(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var notif entity.Notification
	if err := db.First(&notif, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	// ✅ mark as read
	if !notif.IsRead {
		notif.IsRead = true
		if err := db.Save(&notif).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notification marked as read",
		"data":    notif,
	})
}

// อ่านแจ้งเตือนทั้งหมดและ mark as read
func ReadAllNotifications(c *gin.Context) {
	db := config.DB()

	var notifications []entity.Notification
	if err := db.Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	// ✅ mark all as read
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

	var notif entity.Notification
	if err := db.First(&notif, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	if err := db.Delete(&notif).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notification deleted successfully",
	})
}

// GetNotificationStats - คำนวณสถิติการแจ้งเตือน
func GetNotificationStats(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	var totalNotifications int64
	var readNotifications int64
	var unreadNotifications int64

	// นับจำนวนการแจ้งเตือนทั้งหมด
	db.Model(&entity.Notification{}).Count(&totalNotifications)

	// นับการแจ้งเตือนตามสถานะการอ่าน
	db.Model(&entity.Notification{}).Where("is_read = ?", true).Count(&readNotifications)
	db.Model(&entity.Notification{}).Where("is_read = ?", false).Count(&unreadNotifications)

	// หาการแจ้งเตือนล่าสุด
	var lastNotification entity.Notification
	var lastAlert string = ""
	if err := db.Order("created_at DESC").First(&lastNotification).Error; err == nil {
		lastAlert = lastNotification.CreatedAt.Format("2006-01-02 15:04:05")
	}

	stats := map[string]interface{}{
		"totalNotifications":  totalNotifications,
		"readNotifications":   readNotifications,
		"unreadNotifications": unreadNotifications,
		"lastAlert":           lastAlert,
	}

	c.JSON(http.StatusOK, stats)
}
