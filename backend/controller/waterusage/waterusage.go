package waterusage

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"example.com/sa-67-example/entity"
	"example.com/sa-67-example/services"
)

// POST /api/water-usage
func PostWaterUsage(c *gin.Context) {
	var usage entity.WaterUsage

	// 1) bind JSON
	if err := c.ShouldBindJSON(&usage); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON", "detail": err.Error()})
		return
	}

	// 2) validation เบื้องต้น
	if usage.LocationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "locationId is required"})
		return
	}
	if usage.Usage < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "usage must be >= 0"})
		return
	}

	// 3) กำหนดค่า default
	if usage.Unit == "" {
		usage.Unit = "L"
	}
	if usage.Timestamp.IsZero() {
		usage.Timestamp = time.Now().UTC()
	}

	// 4) บันทึก + ตรวจผิดปกติ + แจ้ง LINE (ต้องมีฟังก์ชันนี้ใน services/waterusage.go)
	if err := services.SaveWaterUsageAndNotify(usage); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "ok"})
}

// GET /api/water-usage/latest
func GetLatestUsage(c *gin.Context) {
	results, err := services.GetLatestUsageGroupedByLocation()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot fetch usage", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, results)
}

// GET /api/water-usage
func GetAllWaterUsage(c *gin.Context) {
	data, err := services.GetAllWaterUsage()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch data", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GET /api/water-usage/daily/:locationId
func GetDailyUsage(c *gin.Context) {
	locationId := c.Param("locationId")
	today := time.Now().UTC()

	total, err := services.GetDailyUsageByLocation(locationId, today)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calculate daily usage", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"locationId": locationId,
		"date":       today.Format("2006-01-02"),
		"totalUsage": total,
		"unit":       "L",
	})
}
