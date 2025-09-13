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
		Preload("WaterMeterImage").
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
		ModelConfidence:   modelConfidenceFloat,
		Note:              note,
		CameraDeviceID:    cameraDeviceIDuInt,
		UserID:            userIDuInt,
		WaterMeterImageID: imageID,
		StatusID:          2, // สมมุติคนสร้างเองผ่านการตรวจสอบแล้ว
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

	// ดึง id จาก URL
	id := c.Param("id")

	// หา record เดิม
	var waterValue entity.WaterMeterValue
	if err := db.Preload("WaterMeterImage").First(&waterValue, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Water meter value not found"})
		return
	}

	// รับค่าจากฟอร์ม (เลือกได้ว่าจะส่งหรือไม่ส่ง)
	meterValue := c.PostForm("MeterValue")
	modelConfidence := c.PostForm("ModelConfidence")
	note := c.PostForm("Note")

	// ถ้าใส่ MeterValue ให้แปลงเป็น int
	if meterValue != "" {
		val, err := strconv.Atoi(meterValue)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid meter value"})
			return
		}
		waterValue.MeterValue = val
	}

	// ถ้าใส่ ModelConfidence ให้แปลงเป็น float
	if modelConfidence != "" {
		val, err := strconv.ParseFloat(modelConfidence, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid model confidence"})
			return
		}
		waterValue.ModelConfidence = val
	}

	// อัปเดต note
	if note != "" {
		waterValue.Note = note
	}

	// ตรวจสอบว่ามีไฟล์อัปโหลดใหม่หรือไม่
	file, err := c.FormFile("ImagePath")
	if err == nil {
		// ถ้ามีรูปเก่า → ลบทิ้ง
		if waterValue.WaterMeterImageID != 0 {
			var oldImage entity.WaterMeterImage
			if err := db.First(&oldImage, waterValue.WaterMeterImageID).Error; err == nil {
				os.Remove(oldImage.ImagePath) // ลบไฟล์เก่า
				db.Delete(&oldImage)          // ลบ record เก่า
			}
		}

		// โหลด camera device เพื่อตั้งชื่อโฟลเดอร์
		var camera entity.CameraDevice
		if err := db.Preload("MeterLocation").First(&camera, waterValue.CameraDeviceID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Camera device not found"})
			return
		}
		buildingName := camera.MeterLocation.Name

		// สร้างโฟลเดอร์ใหม่ถ้าไม่มี
		folderPath := fmt.Sprintf("uploads/%s", buildingName)
		if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create folder"})
			return
		}

		// ตั้งชื่อไฟล์ใหม่ (ใช้ timestamp เดิมเพื่อความต่อเนื่อง)
		timestampStr := waterValue.Timestamp.Format("2006-01-02_15-04")
		fileName := fmt.Sprintf("%s.jpg", timestampStr)
		uploadPath := fmt.Sprintf("%s/%s", folderPath, fileName)

		if err := c.SaveUploadedFile(file, uploadPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save new image"})
			return
		}

		// สร้าง record ใหม่
		newImage := entity.WaterMeterImage{
			ImagePath: uploadPath,
		}
		if err := db.Create(&newImage).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image record"})
			return
		}
		waterValue.WaterMeterImageID = newImage.ID
	}

	// บันทึกการแก้ไข
	if err := db.Save(&waterValue).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update water meter value"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Water meter value updated",
		"data":    waterValue,
	})
}
