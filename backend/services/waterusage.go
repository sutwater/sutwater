// ...existing code...
package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/line/line-bot-sdk-go/v7/linebot"
	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

// ...existing code...

var db *gorm.DB

// เรียกใช้ใน main.go เพื่อ set database connection
func SetDatabase(database *gorm.DB) {
	db = database
}

// ✅ บันทึกข้อมูลการใช้น้ำ
func SaveWaterUsage(usage entity.WaterMeterValue) error {
	return db.Create(&usage).Error
}

// ดึง LineUserID ของผู้ใช้ที่เลือกไว้สำหรับรับแจ้งเตือน LINE
func getSelectedLineUserIDs() ([]string, error) {
	var users []entity.Users
	err := db.Model(&entity.Users{}).Where("is_selected_for_line = ?", true).Find(&users).Error
	if err != nil {
		return nil, err
	}
	var ids []string
	for _, u := range users {
		if u.LineUserID != nil && *u.LineUserID != "" {
			ids = append(ids, *u.LineUserID)
		}
	}
	return ids, nil
}

// ✅ ดึงข้อมูลล่าสุดแต่ละจุด (group by LocationID)
func GetLatestUsageGroupedByLocation() ([]entity.WaterMeterValue, error) {
	var latestUsages []entity.WaterMeterValue

	subQuery := db.Model(&entity.WaterMeterValue{}).
		Select("MAX(timestamp) as timestamp, location_id").
		Group("location_id")

	err := db.
		Table("water_usages").
		Joins("JOIN (?) as latest ON water_usages.location_id = latest.location_id AND water_usages.timestamp = latest.timestamp", subQuery).
		Scan(&latestUsages).Error

	return latestUsages, err
}

// ฟังก์ชันดึงข้อมูลการใช้น้ำทั้งหมด
func GetAllWaterUsage() ([]entity.WaterMeterValue, error) {
	var records []entity.WaterMeterValue
	err := db.Order("timestamp DESC").Find(&records).Error
	return records, err
}

// ฟังก์ชันดึง ยอดรวมรายวัน
func GetDailyUsageByLocation(locationId string, date time.Time) (float64, error) {
	var total float64
	startOfDay := date.Truncate(24 * time.Hour)
	endOfDay := startOfDay.Add(24 * time.Hour)

	err := db.Model(&entity.WaterMeterValue{}).
		Where("location_id = ? AND timestamp >= ? AND timestamp < ?", locationId, startOfDay, endOfDay).
		Select("SUM(usage)").Scan(&total).Error

	return total, err
}

/* ========== เพิ่ม: บันทึก + ตรวจผิดปกติ + แจ้ง LINE (ไฟล์นี้ไฟล์เดียวจบ) ========== */

// เกณฑ์พื้นฐานสำหรับตรวจความผิดปกติ
type UsageThreshold struct {
	MaxUsagePerRecord int     // ค่าสูงสุดต่อหนึ่งเรคคอร์ด (ลิตร) เช่น > 500 L ถือว่าผิดปกติ
	MaxRateLpm        float64 // อัตราการไหลสูงสุด (ลิตร/นาที) จากช่วงเวลาเดิม
	MinIntervalMin    float64 // ช่วงเวลาต่ำสุดที่ใช้คำนวณอัตรา (กันหารศูนย์) เช่น 0.5 นาที
}

var DefaultUsageThreshold = UsageThreshold{
	MaxUsagePerRecord: 500.0,
	MaxRateLpm:        50.0,
	MinIntervalMin:    0.5,
}

// บันทึกแล้วตรวจความผิดปกติ ถ้าผิดจะยิง LINE หาผู้ดูแลจาก .env
func SaveWaterUsageAndNotify(usage entity.WaterMeterValue) error {
	// 1) บันทึกเหมือนเดิม
	if err := SaveWaterUsage(usage); err != nil {
		return err
	}
	// 2) ตรวจและแจ้งเตือน (ใช้เกณฑ์เริ่มต้นก่อน ปรับทีหลังได้)
	return checkAbnormalAndNotify(usage, DefaultUsageThreshold)
}

/* ---------- Helpers ภายในไฟล์ ---------- */

// ดึงเรคคอร์ดก่อนหน้าของ location เดียวกัน เพื่อคำนวณอัตรา/ช่วงเวลา
func getPrevUsage(locationId any, before time.Time) (*entity.WaterMeterValue, error) {
	if db == nil {
		return nil, errors.New("services.db is nil (did you call services.SetDatabase?)")
	}
	var prev entity.WaterMeterValue
	err := db.Where("location_id = ? AND timestamp < ?", locationId, before).
		Order("timestamp DESC").
		First(&prev).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &prev, err
}

// ส่งข้อความถึงผู้ใช้ที่เลือกไว้ใน DB (is_selected_for_line)
func multicastToSelectedUsers(text string) error {
	ids, err := getSelectedLineUserIDs()
	if err != nil || len(ids) == 0 {
		return err
	}
	bot, err := linebot.New(config.Cfg.LineChannelSecret, config.Cfg.LineChannelAccessToken)
	if err != nil {
		return err
	}
	_, err = bot.Multicast(ids, linebot.NewTextMessage(text)).Do()
	return err
}

// ตรวจความผิดปกติจากค่า usage ล่าสุด เทียบกับค่าเดิม และยิง LINE
func checkAbnormalAndNotify(u entity.WaterMeterValue, th UsageThreshold) error {
	reasons := []string{}

	// 1) ค่าติดลบถือว่าผิดปกติแน่ ๆ
	if u.MeterValue < 0 {
		reasons = append(reasons, "ค่าการใช้น้ำติดลบ")
	}

	// 2) ค่าสูงเกินเกณฑ์ต่อเรคคอร์ด
	if u.MeterValue > th.MaxUsagePerRecord {
		reasons = append(reasons, fmt.Sprintf("Usage %.2f L > %.2f L", u.MeterValue, th.MaxUsagePerRecord))
	}

	// 3) อัตราการไหล (L/min) เทียบกับเรคคอร์ดก่อนหน้า
	prev, err := getPrevUsage(u.CameraDeviceID, u.Timestamp)
	if err != nil {
		return err
	}
	if prev != nil {
		dtMin := u.Timestamp.Sub(prev.Timestamp).Minutes()
		if dtMin < th.MinIntervalMin {
			dtMin = th.MinIntervalMin
		}
		rate := float64(u.MeterValue) / dtMin // L/min
		if rate > th.MaxRateLpm {
			reasons = append(reasons, fmt.Sprintf("อัตราการไหล %.2f L/min > %.2f L/min", rate, th.MaxRateLpm))
		}
	}

	// ไม่พบเหตุผลผิดปกติ → ไม่ต้องแจ้ง
	if len(reasons) == 0 {
		return nil
	}

	// สร้างข้อความแจ้งเตือน
	loc := fmt.Sprintf("%v", u.CameraDeviceID)
	msg := fmt.Sprintf(
		"🚨 น้ำผิดปกติ\nLocation: %s\nUsage: %.2f L\nเวลา: %s\nเหตุผล: %s",
		loc,
		u.MeterValue,
		u.Timestamp.Local().Format("02/01 15:04"),
		strings.Join(reasons, "; "),
	)

	// ยิง LINE เฉพาะผู้ใช้ที่เลือกไว้
	return multicastToSelectedUsers(msg)
}
