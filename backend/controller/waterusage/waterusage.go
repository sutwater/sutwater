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

	if err := c.ShouldBindJSON(&usage); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	// กำหนดเวลา ณ ตอนบันทึก
	usage.Timestamp = time.Now().UTC()

	if err := services.SaveWaterUsage(usage); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GET /api/water-usage/latest
func GetLatestUsage(c *gin.Context) {
	results, err := services.GetLatestUsageGroupedByLocation()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot fetch usage"})
		return
	}

	c.JSON(http.StatusOK, results)
}

// GET /api/water-usage
func GetAllWaterUsage(c *gin.Context) {
	data, err := services.GetAllWaterUsage()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch data"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calculate daily usage"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"locationId": locationId,
		"date":       today.Format("2006-01-02"),
		"totalUsage": total,
		"unit":       "L",
	})
}
