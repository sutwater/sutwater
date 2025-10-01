package waterusage

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/entity"
	"github.com/watermeter/suth/services"
)

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

// GetWaterUsageStats - คำนวณสถิติการใช้น้ำ
func GetWaterUsageStats(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	now := time.Now()
	today := now.Format("2006-01-02")
	yesterday := now.AddDate(0, 0, -1).Format("2006-01-02")

	// คำนวณช่วงสัปดาห์นี้ (7 วันย้อนหลัง)
	weekStart := now.AddDate(0, 0, -6).Format("2006-01-02")
	weekEnd := today

	// คำนวณช่วงสัปดาห์ก่อน (วันที่ 14-8 วันก่อน)
	prevWeekStart := now.AddDate(0, 0, -13).Format("2006-01-02")
	prevWeekEnd := now.AddDate(0, 0, -7).Format("2006-01-02")

	// ดึงข้อมูลการใช้น้ำวันนี้
	var todayUsage int64
	db.Model(&entity.DailyWaterUsage{}).
		Where("DATE(timestamp) = ?", today).
		Select("COALESCE(SUM(usage), 0)").
		Scan(&todayUsage)

	// ดึงข้อมูลการใช้น้ำเมื่อวาน
	var yesterdayUsage int64
	db.Model(&entity.DailyWaterUsage{}).
		Where("DATE(timestamp) = ?", yesterday).
		Select("COALESCE(SUM(usage), 0)").
		Scan(&yesterdayUsage)

	// ดึงข้อมูลการใช้น้ำสัปดาห์นี้
	var thisWeekUsage int64
	db.Model(&entity.DailyWaterUsage{}).
		Where("DATE(timestamp) BETWEEN ? AND ?", weekStart, weekEnd).
		Select("COALESCE(SUM(usage), 0)").
		Scan(&thisWeekUsage)

	// ดึงข้อมูลการใช้น้ำสัปดาห์ก่อน
	var lastWeekUsage int64
	db.Model(&entity.DailyWaterUsage{}).
		Where("DATE(timestamp) BETWEEN ? AND ?", prevWeekStart, prevWeekEnd).
		Select("COALESCE(SUM(usage), 0)").
		Scan(&lastWeekUsage)

	// คำนวณการเปลี่ยนแปลง
	dailyChange := int64(todayUsage) - int64(yesterdayUsage)
	weeklyChange := int64(thisWeekUsage) - int64(lastWeekUsage)

	// คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
	var dailyChangePercent float64
	if yesterdayUsage > 0 {
		dailyChangePercent = (float64(dailyChange) / float64(yesterdayUsage)) * 100
	}

	var weeklyChangePercent float64
	if lastWeekUsage > 0 {
		weeklyChangePercent = (float64(weeklyChange) / float64(lastWeekUsage)) * 100
	}

	stats := map[string]interface{}{
		"daily": map[string]interface{}{
			"current":       todayUsage,
			"previous":      yesterdayUsage,
			"change":        dailyChange,
			"changePercent": dailyChangePercent,
		},
		"weekly": map[string]interface{}{
			"current":       thisWeekUsage,
			"previous":      lastWeekUsage,
			"change":        weeklyChange,
			"changePercent": weeklyChangePercent,
		},
	}

	c.JSON(http.StatusOK, stats)
}
