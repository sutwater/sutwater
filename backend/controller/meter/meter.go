package meter

import (
	"net/http"

	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/entity"

	"github.com/gin-gonic/gin"
)

// ดึงข้อมูลมิเตอร์
func GetAllMeters(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	var meters []entity.MeterLocation

	// join กับ camera_devices โดยเช็ค MeterLocationID
	if err := db.
		Joins("JOIN camera_devices ON camera_devices.meter_location_id = meter_locations.id").
		Group("meter_locations.id").
		Find(&meters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, meters)
}

// สร้างมิเตอร์ใหม่
func CreateMeter(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	var input entity.MeterLocation
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newMeter := entity.MeterLocation{
		Name:      input.Name,
		Latitude:  input.Latitude,
		Longitude: input.Longitude,
	}

	if err := db.Create(&newMeter).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, newMeter)
}

func GetAllMeterLocations(c *gin.Context) {
	db := config.DB()
	var locations []entity.MeterLocation
	if err := db.Find(&locations).Error; err != nil {
		c.JSON(500, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}
	c.JSON(200, locations)
}

func UpdateMeterLocation(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var input entity.MeterLocation
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	var location entity.MeterLocation
	if err := db.First(&location, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "ไม่พบจุดมิเตอร์"})
		return
	}

	location.Name = input.Name
	location.Latitude = input.Latitude
	location.Longitude = input.Longitude

	if err := db.Save(&location).Error; err != nil {
		c.JSON(500, gin.H{"error": "ไม่สามารถอัปเดตได้"})
		return
	}

	c.JSON(200, location)
}

func DeleteMeterLocation(c *gin.Context) {
	db := config.DB()
	meterLocationID := c.Param("id")

	tx := db.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			c.JSON(500, gin.H{"error": "เกิดข้อผิดพลาดในการลบ"})
		}
	}()

	// หา CameraDevice ที่เชื่อมกับ MeterLocation
	var cameraDevices []entity.CameraDevice
	if err := tx.Where("MeterLocationID = ?", meterLocationID).Find(&cameraDevices).Error; err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "ไม่สามารถดึง CameraDevice ได้"})
		return
	}

	// เก็บ ID ของ CameraDevice
	var cameraIDs []uint
	for _, cam := range cameraDevices {
		cameraIDs = append(cameraIDs, cam.ID)
	}

	// ลบ WaterMeterValue ที่เกี่ยวข้องกับ CameraDevice
	if len(cameraIDs) > 0 {
		if err := tx.Where("CameraDeviceID IN ?", cameraIDs).Delete(&entity.WaterMeterValue{}).Error; err != nil {
			tx.Rollback()
			c.JSON(500, gin.H{"error": "ไม่สามารถลบ WaterMeterValue ได้"})
			return
		}

		// ลบ DailyWaterUsage ที่เกี่ยวข้องกับ CameraDevice
		if err := tx.Where("CameraDeviceID IN ?", cameraIDs).Delete(&entity.DailyWaterUsage{}).Error; err != nil {
			tx.Rollback()
			c.JSON(500, gin.H{"error": "ไม่สามารถลบ DailyWaterUsage ได้"})
			return
		}

		// ลบ Notification ที่เกี่ยวข้องกับ CameraDevice
		if err := tx.Where("CameraDeviceID IN ?", cameraIDs).Delete(&entity.Notification{}).Error; err != nil {
			tx.Rollback()
			c.JSON(500, gin.H{"error": "ไม่สามารถลบ Notification ได้"})
			return
		}
	}

	// ลบ CameraDevice
	if err := tx.Where("MeterLocationID = ?", meterLocationID).Delete(&entity.CameraDevice{}).Error; err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "ไม่สามารถลบ CameraDevice ได้"})
		return
	}

	// ลบ MeterLocation
	if err := tx.Delete(&entity.MeterLocation{}, meterLocationID).Error; err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "ไม่สามารถลบ MeterLocation ได้"})
		return
	}

	// commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(500, gin.H{"error": "เกิดข้อผิดพลาดในการลบ"})
		return
	}

	c.JSON(200, gin.H{"message": "ลบ MeterLocation และข้อมูลที่เกี่ยวข้องเรียบร้อยแล้ว"})
}

func GetMeterLocationByID(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var meterLocation entity.MeterLocation
	if err := db.First(&meterLocation, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "ไม่พบข้อมูล MeterLocation",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "MeterLocation retrieved successfully",
		"data":    meterLocation,
	})
}
