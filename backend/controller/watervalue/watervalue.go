package watervalue

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetWaterMeterValueStatus(c *gin.Context) {
	var status []entity.StatusWaterValue
	db := config.DB()

	db.Find(&status)

	c.JSON(http.StatusOK, gin.H{
		"status": status,
	})
}

func GetWaterMeterValueByID(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var waterValue entity.WaterMeterValue

	// ✅ ดึงข้อมูลตาม ID พร้อม Preload ความสัมพันธ์
	if err := db.Preload("CameraDevice").
		Preload("CameraDevice.MeterLocation").
		Preload("User").
		Preload("Status").
		First(&waterValue, id).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{"error": "Water meter value not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Water meter value fetched successfully",
		"data":    waterValue,
	})
}

func CreateWaterMeterValue(c *gin.Context) {
	db := config.DB()

	// ✅ ตรวจสอบว่าเป็น multipart/form-data หรือ JSON
	var req struct {
		Date            string  `json:"Date" form:"Date"`
		Time            string  `json:"Time" form:"Time"`
		MeterValue      int     `json:"MeterValue" form:"MeterValue"`
		ModelConfidence float64 `json:"ModelConfidence" form:"ModelConfidence"`
		Note            string  `json:"Note" form:"Note"`
		UserID          uint    `json:"UserID" form:"UserID"`
		CameraDeviceID  uint    `json:"CameraDeviceID" form:"CameraDeviceID"`
	}

	if c.ContentType() == "application/json" {
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
			return
		}
	} else {
		if err := c.Bind(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form-data"})
			return
		}
	}

	// ✅ แปลง timestamp + timezone
	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot load timezone"})
		return
	}

	// ใช้ ParseInLocation แทน
	timestamp, err := time.ParseInLocation("2006-01-02T15:04", req.Date+"T"+req.Time, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid timestamp"})
		return
	}

	timestamp = timestamp.In(loc)

	// ✅ ดึงค่าล่าสุดของ cameraDeviceID
	var lastValue entity.WaterMeterValue
	lastValueFound := false
	err = db.Where("camera_device_id = ? AND timestamp < ?", req.CameraDeviceID, timestamp).
		Order("timestamp desc").
		First(&lastValue).Error
	if err == nil {
		lastValueFound = true
		if req.MeterValue < lastValue.MeterValue {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "ค่ามิเตอร์ไม่ถูกต้อง",
				"message": "ดูเหมือนว่าคุณใส่ค่ามิเตอร์ผิด กรุณาตรวจสอบ แล้วส่งฟอร์มอีกครั้ง",
			})
			return
		}
	}

	// ✅ ดึง MeterLocation
	var camera entity.CameraDevice
	if err := db.Preload("MeterLocation").First(&camera, req.CameraDeviceID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Camera device not found"})
		return
	}
	buildingName := camera.MeterLocation.Name

	// ✅ ตรวจสอบไฟล์รูป
	var imagePath string
	file, err := c.FormFile("ImagePath")
	if err == nil {
		folderPath := fmt.Sprintf("uploads/%s", buildingName)
		if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create folder"})
			return
		}

		ext := filepath.Ext(file.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		timestampStr := timestamp.Format("2006-01-02_15-04")
		fileName := fmt.Sprintf("%s%s", timestampStr, ext)
		uploadPath := fmt.Sprintf("%s/%s", folderPath, fileName)

		if err := c.SaveUploadedFile(file, uploadPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		imagePath = uploadPath
	}

	// ✅ บันทึก WaterMeterValue
	waterValue := entity.WaterMeterValue{
		Timestamp:       timestamp,
		MeterValue:      req.MeterValue,
		ModelConfidence: req.ModelConfidence,
		Note:            req.Note,
		CameraDeviceID:  req.CameraDeviceID,
		UserID:          req.UserID,
		StatusID:        2,
		ImagePath:       imagePath,
	}

	if err := db.Create(&waterValue).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create water meter value"})
		return
	}

	// ✅ DailyWaterUsage
	if lastValueFound && timestamp.Hour() == 8 && timestamp.Minute() == 0 {
		yesterdayDate := timestamp.AddDate(0, 0, -1)
		start := time.Date(yesterdayDate.Year(), yesterdayDate.Month(), yesterdayDate.Day(), 8, 0, 0, 0, loc)
		end := time.Date(yesterdayDate.Year(), yesterdayDate.Month(), yesterdayDate.Day(), 8, 59, 59, 0, loc)

		var yesterdayValue entity.WaterMeterValue
		if err := db.Where("camera_device_id = ? AND timestamp BETWEEN ? AND ?", req.CameraDeviceID, start, end).First(&yesterdayValue).Error; err == nil {
			usage := req.MeterValue - yesterdayValue.MeterValue
			if usage >= 0 {
				dailyUsage := entity.DailyWaterUsage{
					Timestamp:      timestamp,
					Usage:          usage,
					CameraDeviceID: req.CameraDeviceID,
				}
				db.Create(&dailyUsage)
			}

			// หลังจากสร้าง dailyUsage
			var avgUsage float64
			db.Model(&entity.DailyWaterUsage{}).
				Where("camera_device_id = ? AND YEAR(timestamp) = ? AND MONTH(timestamp) = ?",
					req.CameraDeviceID,
					timestamp.Year(),
					int(timestamp.Month()),
				).
				Select("AVG(usage)").Scan(&avgUsage)

			// เปรียบเทียบค่า usage กับค่าเฉลี่ย ±50
			if float64(usage) > avgUsage+50 {
				notification := entity.Notification{
					Message:        "ค่าน้ำสูงกว่าปกติ",
					IsRead:         false,
					CameraDeviceID: req.CameraDeviceID,
				}
				db.Create(&notification)
			} else if float64(usage) < avgUsage-50 {
				notification := entity.Notification{
					Message:        "ค่าน้ำต่ำกว่าปกติ",
					IsRead:         false,
					CameraDeviceID: req.CameraDeviceID,
				}
				db.Create(&notification)
			}

		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Water meter value created",
		"data":    waterValue,
	})
}

func UpdateWaterMeterValue(c *gin.Context) {
	db := config.DB()

	id := c.Param("id")

	var waterValue entity.WaterMeterValue
	if err := db.First(&waterValue, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Water meter value not found"})
		return
	}

	meterValue := c.PostForm("MeterValue")
	modelConfidence := c.PostForm("ModelConfidence")
	note := c.PostForm("Note")

	if meterValue != "" {
		val, err := strconv.Atoi(meterValue)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid meter value"})
			return
		}
		waterValue.MeterValue = val
	}

	if modelConfidence != "" {
		val, err := strconv.ParseFloat(modelConfidence, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid model confidence"})
			return
		}
		waterValue.ModelConfidence = val
	}

	if note != "" {
		waterValue.Note = note
	}

	file, err := c.FormFile("ImagePath")
	if err == nil {
		// ลบรูปเก่าออกถ้ามี
		if waterValue.ImagePath != "" {
			os.Remove(waterValue.ImagePath)
		}

		// ดึงชื่ออาคารจาก CameraDevice
		var camera entity.CameraDevice
		if err := db.Preload("MeterLocation").First(&camera, waterValue.CameraDeviceID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Camera device not found"})
			return
		}
		buildingName := camera.MeterLocation.Name

		// สร้างโฟลเดอร์
		folderPath := fmt.Sprintf("uploads/%s", buildingName)
		os.MkdirAll(folderPath, os.ModePerm)

		// ดึงนามสกุลไฟล์จริง
		ext := filepath.Ext(file.Filename)
		if ext == "" {
			ext = ".jpg"
		}

		timestampStr := waterValue.Timestamp.Format("2006-01-02_15-04")
		fileName := fmt.Sprintf("%s%s", timestampStr, ext)
		uploadPath := fmt.Sprintf("%s/%s", folderPath, fileName)

		if err := c.SaveUploadedFile(file, uploadPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save new image"})
			return
		}

		// อัปเดต path ใน WaterMeterValue
		waterValue.ImagePath = uploadPath
	}

	// บันทึกทุก field ที่แก้ไข
	if err := db.Save(&waterValue).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update water meter value"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Water meter value updated",
		"data":    waterValue,
	})
}

func DeleteCameraDeviceDataByID(c *gin.Context) {
	db := config.DB()
	cameraIDStr := c.Param("id")
	cameraID, err := strconv.ParseUint(cameraIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid camera device ID"})
		return
	}
	camID := uint(cameraID)

	// 1. ดึง WaterMeterValue ทั้งหมดของ CameraDeviceID เพื่อลบไฟล์รูป
	var waterValues []entity.WaterMeterValue
	if err := db.Where("camera_device_id = ?", camID).Find(&waterValues).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch water meter values"})
		return
	}

	for _, w := range waterValues {
		if w.ImagePath != "" {
			if err := os.Remove(w.ImagePath); err != nil && !os.IsNotExist(err) {
				// ถ้าไฟล์ไม่มีอยู่แล้วก็ไม่เป็นไร
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to delete image: %s", w.ImagePath)})
				return
			}
		}
	}

	// 2. ลบ DailyWaterUsage
	if err := db.Where("camera_device_id = ?", camID).Delete(&entity.DailyWaterUsage{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete daily water usage"})
		return
	}

	// 3. ลบ Notifications
	if err := db.Where("camera_device_id = ?", camID).Delete(&entity.Notification{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notifications"})
		return
	}

	// 4. ลบ WaterMeterValue
	if err := db.Where("camera_device_id = ?", camID).Delete(&entity.WaterMeterValue{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete water meter values"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("All data and images for CameraDeviceID %d deleted", camID),
	})
}

func DeleteAllWaterMeterValues(c *gin.Context) {
	db := config.DB()

	// 1. ดึงค่า WaterMeterValue ทั้งหมดเพื่อเก็บไฟล์รูป
	var waterValues []entity.WaterMeterValue
	db.Find(&waterValues)

	// 2. ลบไฟล์รูปทั้งหมด
	for _, w := range waterValues {
		if w.ImagePath != "" {
			os.Remove(w.ImagePath)
		}
	}

	// 3. ลบข้อมูลทั้งหมดในตาราง
	if err := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&entity.WaterMeterValue{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete all water meter values"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "All water meter values deleted successfully",
	})
}

func UpdateWaterMeterStatusByID(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var waterValue entity.WaterMeterValue
	if err := db.First(&waterValue, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Water meter value not found"})
		return
	}

	// อัปเดต StatusID เป็น 2
	waterValue.StatusID = 2
	if err := db.Save(&waterValue).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update StatusID"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "StatusID updated to 2",
		"data":    waterValue,
	})
}
