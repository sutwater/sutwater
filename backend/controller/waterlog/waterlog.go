package waterlog

import (
	"net/http"
	"strconv"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

func GetAllWaterUsageValues(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	// Subquery ดึงค่า timestamp ล่าสุดของแต่ละ MacAddress
	// Subquery ดึงค่า timestamp ล่าสุดของแต่ละ CameraDeviceID
	subQuery := db.
		Table("water_meter_values").
		Select("camera_device_id, MAX(timestamp) AS max_timestamp").
		Group("camera_device_id")

	var latestValues []entity.WaterMeterValue

	// Join กับ subQuery เพื่อดึงข้อมูลแถวล่าสุดของแต่ละกล้อง
	err := db.
		Table("water_meter_values AS wm").
		Joins(`
        JOIN (?) AS wm2 
        ON wm.camera_device_id = wm2.camera_device_id 
        AND wm.timestamp = wm2.max_timestamp
    `, subQuery).
		Preload("CameraDevice").
		Preload("CameraDevice.MeterLocation").
		Preload("WaterMeterImage").
		Find(&latestValues).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, latestValues)
}

// GET /api/meterlocation/:id/detail
func GetCameraDeviceWithUsage(c *gin.Context) {
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

	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	var cameraDevice entity.CameraDevice

	query := db.Model(&entity.CameraDevice{}).Preload("MeterLocation")

	if startDate != "" && endDate != "" {
		query = query.
			Preload("DailyWaterUsage", func(db *gorm.DB) *gorm.DB {
				return db.Where("timestamp BETWEEN ? AND ?", startDate, endDate).Order("timestamp DESC")
			}).
			Preload("WaterMeterValue", func(db *gorm.DB) *gorm.DB {
				return db.
					Where("status_id = ?", 2). // ✅ กรองเฉพาะ StatusID = 2
					Where("timestamp BETWEEN ? AND ?", startDate, endDate).
					Order("timestamp DESC").
					Preload("User").
					Preload("WaterMeterImage")
			})
	} else {
		query = query.
			Preload("DailyWaterUsage", func(db *gorm.DB) *gorm.DB {
				return db.Order("timestamp DESC")
			}).
			Preload("WaterMeterValue", func(db *gorm.DB) *gorm.DB {
				return db.
					Where("status_id = ?", 2). // ✅ กรองเฉพาะ StatusID = 2
					Order("timestamp DESC").
					Preload("User").
					Preload("WaterMeterImage")
			})
	}

	err = query.First(&cameraDevice, id).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "CameraDevice not found"})
		return
	}

	c.JSON(http.StatusOK, cameraDevice)
}

func GetAllCameraDevicesWithUsage(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	var cameraDevices []entity.CameraDevice

	// ✅ ดึงข้อมูลทั้งหมด + preload ความสัมพันธ์
	err := db.Model(&entity.CameraDevice{}).
		Preload("MeterLocation").
		Preload("DailyWaterUsage", func(db *gorm.DB) *gorm.DB {
			return db.Order("timestamp DESC")
		}).
		Preload("WaterMeterValue", func(db *gorm.DB) *gorm.DB {
			return db.Order("timestamp DESC").
				Preload("User").
				Preload("WaterMeterImage")
		}).
		Find(&cameraDevices).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cameraDevices)
}
