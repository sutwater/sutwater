package upload_image

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/controller/notification"
	"github.com/watermeter/suth/entity"
	"github.com/watermeter/suth/services"
	"gorm.io/gorm"
)

// sanitizeFilename ป้องกันชื่อไฟล์มีตัวอักษรต้องห้าม
func sanitizeFilename(name string) string {
	replacer := strings.NewReplacer(
		"\\", "_", "/", "_", ":", "_",
		"*", "_", "?", "_", "\"", "_",
		"<", "_", ">", "_", "|", "_",
	)
	return replacer.Replace(name)
}

// ส่งไฟล์ไป Python API
func sendToPythonAPI(filePath string) (string, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return "", err
	}
	_, err = io.Copy(part, file)
	if err != nil {
		return "", err
	}
	writer.Close()

	resp, err := http.Post("http://localhost:5000/process", writer.FormDataContentType(), body)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(respBody), nil
}

// UploadMeterImage สำหรับ ESP32
func UploadMeterImage(c *gin.Context) {
	db := config.DB()

	// ตรวจ Authorization Header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(401, gin.H{"error": "Missing or invalid Authorization header"})
		return
	}
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	jwtWrapper := services.JwtWrapper{
		SecretKey: "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
		Issuer:    "AuthService",
	}
	claims, err := jwtWrapper.ValidateToken(tokenString)
	if err != nil {
		c.JSON(401, gin.H{"error": fmt.Sprintf("Invalid token: %v", err)})
		return
	}

	// MAC ของอุปกรณ์
	mac := c.PostForm("mac")
	if mac == "" {
		c.JSON(400, gin.H{"error": "Missing MAC address"})
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(400, gin.H{"error": "Missing image file"})
		return
	}

	macSafe := sanitizeFilename(mac)
	timestamp := time.Now()
	filename := fmt.Sprintf("%s_%s.jpg", macSafe, timestamp.Format("20060102_150405"))

	saveDir := `./uploads`
	if err := os.MkdirAll(saveDir, os.ModePerm); err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to create upload folder: %v", err)})
		return
	}
	savePath := filepath.Join(saveDir, filename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to save image: %v", err)})
		return
	}

	// ส่งไป Python API
	pythonRespStr, err := sendToPythonAPI(savePath)
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed sending to Python: %v", err)})
		return
	}

	// Parse meter_value และ confidence
	var pyResult struct {
		MeterValue        string `json:"meter_value"`
		OverallConfidence struct {
			Average float64 `json:"average"`
		} `json:"overall_confidence"`
	}
	if err := json.Unmarshal([]byte(pythonRespStr), &pyResult); err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed parsing Python response: %v", err)})
		return
	}

	// แปลง meter_value เป็น int
	meterInt, err := strconv.Atoi(pyResult.MeterValue)
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Invalid meter value from Python: %v", err)})
		return
	}

	// หา หรือ สร้าง CameraDevice
	var camera entity.CameraDevice
	if err := db.Where("mac_address = ?", mac).First(&camera).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// สร้างใหม่ โดยไม่กำหนด MeterLocationID (เป็น nil)
			camera = entity.CameraDevice{
				MacAddress:     mac,
				Status:         true,
				BrokenAmount:   0,
				MeterLocationID: nil,
			}
			if err := db.Create(&camera).Error; err != nil {
				c.JSON(500, gin.H{"error": fmt.Sprintf("Failed creating CameraDevice: %v", err)})
				return
			}
		} else {
			c.JSON(500, gin.H{"error": fmt.Sprintf("DB error: %v", err)})
			return
		}
	}

	waterValue := entity.WaterMeterValue{
		CameraDeviceID:  camera.ID,
		Timestamp:       timestamp,
		ImagePath:       filename,
		StatusID:        1,
		MeterValue:      meterInt,
		ModelConfidence: pyResult.OverallConfidence.Average,
	}
	if err := db.Create(&waterValue).Error; err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed creating WaterMeterValue: %v", err)})
		return
	}

	// ตรวจสอบและส่งแจ้งเตือน LINE หากค่าน้ำเปลี่ยนแปลงมากกว่า 15
	notification.SendLineAlertForWaterUsage(db, camera.ID)

	c.JSON(200, gin.H{
		"message":    "Image uploaded, predicted & saved",
		"mac":        mac,
		"filename":   filename,
		"path":       savePath,
		"timestamp":  timestamp,
		"jwtSubject": claims.Email,
		"meterValue": meterInt,
		"confidence": pyResult.OverallConfidence.Average,
	})
}
