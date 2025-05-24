package services

import (
	"example.com/sa-67-example/entity"
	"gorm.io/gorm"
	"time"
)

var db *gorm.DB

// เรียกใช้ใน main.go เพื่อ set database connection
func SetDatabase(database *gorm.DB) {
	db = database
}

// ✅ บันทึกข้อมูลการใช้น้ำ
func SaveWaterUsage(usage entity.WaterUsage) error {
	return db.Create(&usage).Error
}

// ✅ ดึงข้อมูลล่าสุดแต่ละจุด (group by LocationID)
func GetLatestUsageGroupedByLocation() ([]entity.WaterUsage, error) {
	var latestUsages []entity.WaterUsage

	subQuery := db.Model(&entity.WaterUsage{}).
		Select("MAX(timestamp) as timestamp, location_id").
		Group("location_id")

	err := db.
		Table("water_usages").
		Joins("JOIN (?) as latest ON water_usages.location_id = latest.location_id AND water_usages.timestamp = latest.timestamp", subQuery).
		Scan(&latestUsages).Error

	return latestUsages, err
}

// ฟังก์ชันดึงข้อมูลการใช้น้ำทั้งหมด
func GetAllWaterUsage() ([]entity.WaterUsage, error) {
	var records []entity.WaterUsage
	err := db.Order("timestamp DESC").Find(&records).Error
	return records, err
}

// ฟังก์ชันดึง ยอดรวมรายวัน
func GetDailyUsageByLocation(locationId string, date time.Time) (float64, error) {
	var total float64
	startOfDay := date.Truncate(24 * time.Hour)
	endOfDay := startOfDay.Add(24 * time.Hour)

	err := db.Model(&entity.WaterUsage{}).
		Where("location_id = ? AND timestamp >= ? AND timestamp < ?", locationId, startOfDay, endOfDay).
		Select("SUM(usage)").Scan(&total).Error

	return total, err
}
