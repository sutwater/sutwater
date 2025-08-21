package meter

import (
	"net/http"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"

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
	if err := db.Find(&meters).Error; err != nil {
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
