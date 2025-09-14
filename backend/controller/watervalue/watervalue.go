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

	// รับค่าจากฟอร์ม
	date := c.PostForm("Date")
	timestr := c.PostForm("Time")
	meterValue := c.PostForm("MeterValue")
	modelConfidence := c.PostForm("ModelConfidence")
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

	modelConfidenceFloat, err := strconv.ParseFloat(modelConfidence, 64)
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

	// ดึง MeterLocation
	var camera entity.CameraDevice
	if err := db.Preload("MeterLocation").First(&camera, cameraDeviceIDuInt).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Camera device not found"})
		return
	}
	buildingName := camera.MeterLocation.Name

	var imagePath string = ""

	// ตรวจสอบว่ามีไฟล์รูปหรือไม่
	file, err := c.FormFile("ImagePath")
	if err == nil {
		// สร้างโฟลเดอร์ uploads/ชื่ออาคาร
		folderPath := fmt.Sprintf("uploads/%s", buildingName)
		if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create folder"})
			return
		}

		// ตั้งชื่อไฟล์ตาม timestamp และ extension ของไฟล์จริง
		ext := ""
		if len(file.Filename) > 4 {
			ext = file.Filename[len(file.Filename)-4:] // เช่น ".jpg" หรือ ".png"
		} else {
			ext = ".jpg"
		}
		timestampStr := timestamp.Format("2006-01-02_15-04")
		fileName := fmt.Sprintf("%s%s", timestampStr, ext)
		uploadPath := fmt.Sprintf("%s/%s", folderPath, fileName)

		// บันทึกไฟล์
		if err := c.SaveUploadedFile(file, uploadPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}

		imagePath = uploadPath
	}

	// สร้าง WaterMeterValue พร้อม ImagePath
	waterValue := entity.WaterMeterValue{
		Timestamp:       timestamp,
		MeterValue:      meterValueInt,
		ModelConfidence: modelConfidenceFloat,
		Note:            note,
		CameraDeviceID:  cameraDeviceIDuInt,
		UserID:          userIDuInt,
		StatusID:        2, // สมมุติคนสร้างเองผ่านการตรวจสอบแล้ว
		ImagePath:       imagePath,
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
