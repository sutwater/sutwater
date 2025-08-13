package waterlog

import (
	"net/http"
	"strconv"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"

	"github.com/gin-gonic/gin"
)

func GetAllWaterUsageValues(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	subQuery := db.
		Table("water_meter_values").
		Select("mac_address_id, MAX(timestamp) AS max_timestamp").
		Group("mac_address_id")

	var latestValues []entity.WaterMeterValue

	err := db.
		Table("water_meter_values AS wm").
		Joins("JOIN (?) AS wm2 ON wm.mac_address_id = wm2.mac_address_id AND wm.timestamp = wm2.max_timestamp", subQuery).
		Preload("CameraDevice").
		Preload("CameraDevice.MeterLocation").
		Preload("WaterUsageLog").
		Preload("WaterMeterImage").
		Find(&latestValues).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, latestValues)
}

// GET /api/meterlocation/:id/detail
func GetMeterLocationWithDevices(c *gin.Context) {
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

	var location entity.MeterLocation

	// preload CameraDevice -> WaterMeterValue -> WaterUsageLog
	err = db.Preload("CameraDevice.WaterMeterValue.WaterUsageLog.Users").
		First(&location, id).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "MeterLocation not found"})
		return
	}

	c.JSON(http.StatusOK, location)
}
