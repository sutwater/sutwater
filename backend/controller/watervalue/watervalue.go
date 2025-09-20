package watervalue

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"

	"github.com/gin-gonic/gin"
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

	// ✅ ตรวจสอบว่าเป็น multipart/form-data หรือ JSON
	var req struct {
		Date            string  `json:"Date" form:"Date"`
		Time            string  `json:"Time" form:"Time"`
		MeterValue      int     `json:"MeterValue" form:"MeterValue"`
		ModelConfidence float64 `json:"ModelConfidence" form:"ModelConfidence"`
		Note            string  `json:"Note" form:"Note"`
		StatusID        uint    `json:"StatusID" form:"StatusID"`
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

	loc, _ := time.LoadLocation("Asia/Bangkok")

	// ✅ อัปเดต timestamp ถ้ามี
	if req.Date != "" && req.Time != "" {
		timestamp, err := time.ParseInLocation("2006-01-02T15:04", req.Date+"T"+req.Time, loc)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid timestamp"})
			return
		}
		waterValue.Timestamp = timestamp
	}

	// ✅ อัปเดต MeterValue
	if req.MeterValue != 0 {
		// ตรวจสอบค่าล่าสุดก่อนวันนั้น
		var lastValue entity.WaterMeterValue
		if err := db.Where("camera_device_id = ? AND timestamp < ?", waterValue.CameraDeviceID, waterValue.Timestamp).
			Order("timestamp desc").
			First(&lastValue).Error; err == nil {
			if req.MeterValue < lastValue.MeterValue {
				c.JSON(http.StatusBadRequest, gin.H{
					"error":   "ค่ามิเตอร์ไม่ถูกต้อง",
					"message": "ดูเหมือนว่าคุณใส่ค่ามิเตอร์ผิด กรุณาตรวจสอบ",
				})
				return
			}
		}
		waterValue.MeterValue = req.MeterValue
	}

	// ✅ อัปเดต ModelConfidence
	if req.ModelConfidence != 0 {
		waterValue.ModelConfidence = req.ModelConfidence
	}

	// ✅ อัปเดต Note
	if req.Note != "" {
		waterValue.Note = req.Note
	}

	// ✅ อัปเดต StatusID
	if req.StatusID != 0 {
		waterValue.StatusID = req.StatusID
	}

	// ✅ อัปเดตรูปภาพ
	file, err := c.FormFile("ImagePath")
	if err == nil {
		if waterValue.ImagePath != "" {
			os.Remove(waterValue.ImagePath)
		}
		var camera entity.CameraDevice
		if err := db.Preload("MeterLocation").First(&camera, waterValue.CameraDeviceID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Camera device not found"})
			return
		}
		buildingName := camera.MeterLocation.Name
		folderPath := fmt.Sprintf("uploads/%s", buildingName)
		os.MkdirAll(folderPath, os.ModePerm)

		ext := filepath.Ext(file.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		timestampStr := waterValue.Timestamp.Format("2006-01-02_15-04")
		fileName := fmt.Sprintf("%s%s", timestampStr, ext)
		uploadPath := fmt.Sprintf("%s/%s", folderPath, fileName)
		c.SaveUploadedFile(file, uploadPath)
		waterValue.ImagePath = uploadPath
	}

	// ✅ บันทึก WaterMeterValue
	if err := db.Save(&waterValue).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update water meter value"})
		return
	}

	// ✅ DailyWaterUsage + Notification
	if waterValue.Timestamp.Hour() == 8 && waterValue.Timestamp.Minute() == 0 {
		yesterdayDate := waterValue.Timestamp.AddDate(0, 0, -1)
		start := time.Date(yesterdayDate.Year(), yesterdayDate.Month(), yesterdayDate.Day(), 8, 0, 0, 0, loc)
		end := time.Date(yesterdayDate.Year(), yesterdayDate.Month(), yesterdayDate.Day(), 8, 59, 59, 0, loc)

		var yesterdayValue entity.WaterMeterValue
		if err := db.Where("camera_device_id = ? AND timestamp BETWEEN ? AND ?", waterValue.CameraDeviceID, start, end).
			First(&yesterdayValue).Error; err == nil {

			usage := waterValue.MeterValue - yesterdayValue.MeterValue
			if usage >= 0 {
				dailyUsage := entity.DailyWaterUsage{
					Timestamp:      waterValue.Timestamp,
					Usage:          usage,
					CameraDeviceID: waterValue.CameraDeviceID,
				}
				db.Create(&dailyUsage)

				// ค่าเฉลี่ยเดือน
				var avgUsage float64
				db.Model(&entity.DailyWaterUsage{}).
					Where("camera_device_id = ? AND YEAR(timestamp) = ? AND MONTH(timestamp) = ?",
						waterValue.CameraDeviceID,
						waterValue.Timestamp.Year(),
						int(waterValue.Timestamp.Month()),
					).
					Select("AVG(usage)").Scan(&avgUsage)

				if float64(usage) > avgUsage+50 {
					db.Create(&entity.Notification{
						Message:        "ค่าน้ำสูงกว่าปกติ",
						IsRead:         false,
						CameraDeviceID: waterValue.CameraDeviceID,
					})
				} else if float64(usage) < avgUsage-50 {
					db.Create(&entity.Notification{
						Message:        "ค่าน้ำต่ำกว่าปกติ",
						IsRead:         false,
						CameraDeviceID: waterValue.CameraDeviceID,
					})
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Water meter value updated",
		"data":    waterValue,
	})
}
