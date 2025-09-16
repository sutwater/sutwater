package device

import (
	"net/http"
	"strconv"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"
	"github.com/gin-gonic/gin"
)

// GetCameraDevices ดึงข้อมูล CameraDevice ทั้งหมด
func GetCameraDevices(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	var cameras []entity.CameraDevice

	// preload MeterLocation ให้ดึงข้อมูล location มาด้วย
	if err := db.Preload("MeterLocation").Find(&cameras).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cameras)
}

// GetCameraDeviceByID ดึงข้อมูล CameraDevice ตาม ID
func GetCameraDeviceByID(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var camera entity.CameraDevice

	// preload MeterLocation และ WaterMeterValue ด้วย
	if err := db.Preload("MeterLocation").
		Preload("WaterMeterValue").
		Preload("DailyWaterUsage").
		Preload("Notification").
		First(&camera, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "CameraDevice not found"})
		return
	}

	c.JSON(http.StatusOK, camera)
}

func GetMeterLocationsWithoutCamera(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	var locations []entity.MeterLocation

	// วิธีใช้ LEFT JOIN
	if err := db.
		Model(&entity.MeterLocation{}).
		Joins("LEFT JOIN camera_devices ON camera_devices.meter_location_id = meter_locations.id").
		Where("camera_devices.id IS NULL").
		Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, locations)
}
