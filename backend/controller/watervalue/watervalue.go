package watervalue

import (
	"net/http"
	"time"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"

	"github.com/gin-gonic/gin"
)

type CreateWaterMeterValueInput struct {
	Timestamp      string `json:"Timestamp"`
	MeterValue     int    `json:"MeterValue"`
	Note           string `json:"Note"`
	CameraDeviceID uint   `json:"CameraDeviceID"`
	UserID         uint   `json:"UserID"`
}

func CreateWaterMeterValue(c *gin.Context) {
	var input CreateWaterMeterValueInput

	// Bind JSON จาก frontend
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// แปลง Timestamp string → time.Time
	timestamp, err := time.Parse("2006-01-02T15:04", input.Timestamp)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid timestamp"})
		return
	}

	// ใช้ entity.WaterMeterValue ที่คุณมีอยู่แล้ว
	waterValue := entity.WaterMeterValue{
		Timestamp:      timestamp,
		MeterValue:     input.MeterValue,
		Note:           input.Note,
		CameraDeviceID: input.CameraDeviceID,
		UserID:         input.UserID,
	}

	db := config.DB()
	if err := db.Create(&waterValue).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create water meter value"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Water meter value created",
		"data":    waterValue,
	})
}
