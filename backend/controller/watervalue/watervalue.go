package watervalue

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"

	"github.com/gin-gonic/gin"
)

func CreateWaterMeterValue(c *gin.Context) {
	db := config.DB()

	// รับค่าจากฟอร์ม
	date := c.PostForm("Date")
	timestr := c.PostForm("Time")
	meterValue := c.PostForm("MeterValue")
	ocrConfidence := c.PostForm("OCRConfidence")
	note := c.PostForm("Note")
	userID := c.PostForm("UserID")
	cameraDeviceID := c.PostForm("CameraDeviceID")

	// แปลง Timestamp string → time.Time
	timestamp, err := time.Parse("2006-01-02T15:04", date+"T"+timestr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid timestamp"})
		return
	}

	// แปลงค่าอื่น ๆ
	meterValueInt, err := strconv.Atoi(meterValue)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid meter value"})
		return
	}

	ocrConfidenceInt, err := strconv.Atoi(ocrConfidence)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid OCR confidence"})
		return
	}

	userID64, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	userIDuInt := uint(userID64)

	cameraDeviceID64, err := strconv.ParseUint(cameraDeviceID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid camera device ID"})
		return
	}
	cameraDeviceIDuInt := uint(cameraDeviceID64)

	// 2. ดึง MeterLocation
	var camera entity.CameraDevice
	if err := db.Preload("MeterLocation").First(&camera, cameraDeviceIDuInt).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Camera device not found"})
		return
	}
	buildingName := camera.MeterLocation.Name

	var imageID uint = 0

	// 3. ตรวจสอบว่ามีไฟล์รูปหรือไม่
	file, err := c.FormFile("ImagePath")
	if err == nil {
		// 4. สร้างโฟลเดอร์ uploads/ชื่ออาคาร
		folderPath := fmt.Sprintf("uploads/%s", buildingName)
		if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create folder"})
			return
		}

		// 5. ตั้งชื่อไฟล์
		timestampStr := timestamp.Format("2006-01-02_15-04")
		fileName := fmt.Sprintf("%s.jpg", timestampStr)
		uploadPath := fmt.Sprintf("%s/%s", folderPath, fileName)

		// 6. บันทึกไฟล์
		if err := c.SaveUploadedFile(file, uploadPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}

		// 7. สร้าง record ของรูปภาพ
		image := entity.WaterMeterImage{
			ImagePath: uploadPath,
		}
		if err := db.Create(&image).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image record"})
			return
		}

		imageID = image.ID
	}

	// 8. สร้าง WaterMeterValue พร้อม WaterMeterImageID (อาจเป็น 0)
	waterValue := entity.WaterMeterValue{
		Timestamp:         timestamp,
		MeterValue:        meterValueInt,
		OCRConfidence:     ocrConfidenceInt,
		Note:              note,
		CameraDeviceID:    cameraDeviceIDuInt,
		UserID:            userIDuInt,
		WaterMeterImageID: imageID,
	}

	if err := db.Create(&waterValue).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create water meter value"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Water meter value created",
		"data":    waterValue,
	})
}
