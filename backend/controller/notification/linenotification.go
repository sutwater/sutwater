package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

// SendLineAlertForWaterUsage - ตรวจสอบและส่งแจ้งเตือน LINE เมื่อค่าน้ำผิดปกติ
func SendLineAlertForWaterUsage(db *gorm.DB, cameraDeviceID uint) {
	// หาค่าน้ำล่าสุด 2 records จาก camera_device_id เดียวกันเท่านั้น
	var waterValues []entity.WaterMeterValue
	err := db.Where("camera_device_id = ?", cameraDeviceID).
		Order("timestamp DESC").
		Limit(2).
		Find(&waterValues).Error

	if err != nil {
		fmt.Printf("[ERROR] Failed to get water meter values: %v\n", err)
		return
	}

	// ต้องมีอย่างน้อย 2 records เพื่อเปรียบเทียบ
	if len(waterValues) < 2 {
		fmt.Printf("[INFO] Not enough water meter values for camera %d (need at least 2 records), skipping alert\n", cameraDeviceID)
		return
	}

	// เปรียบเทียบค่าล่าสุดกับค่าก่อนหน้า
	currentMeterValue := waterValues[0].MeterValue
	previousMeterValue := waterValues[1].MeterValue
	usageDiff := currentMeterValue - previousMeterValue

	fmt.Printf("[DEBUG] Camera %d - Current: %d, Previous: %d, Difference: %d units\n",
		cameraDeviceID, currentMeterValue, previousMeterValue, usageDiff)

	// ถ้าเปลี่ยนแปลงมากกว่า 15 หน่วย
	if math.Abs(float64(usageDiff)) > 15 {
		// ดึงข้อมูล CameraDevice พร้อม MeterLocation
		var camera entity.CameraDevice
		if err := db.Preload("MeterLocation").Where("id = ?", cameraDeviceID).First(&camera).Error; err != nil {
			fmt.Printf("[ERROR] Failed to get camera location: %v\n", err)
			return
		}

		// กำหนดชื่อสถานที่
		locationName := "ไม่ระบุ"
		if camera.MeterLocation != nil {
			locationName = camera.MeterLocation.Name
		}

		// สร้างข้อความแจ้งเตือนแบบเป็นทางการ
		message := createAlertMessage(locationName, currentMeterValue, usageDiff)

		// ส่งแจ้งเตือนไป LINE
		sendToLineUsers(db, message, locationName)
	} else {
		fmt.Printf("[INFO] Water usage difference (%d units) is within normal range for camera %d\n", usageDiff, cameraDeviceID)
	}
}

// createAlertMessage - สร้างข้อความแจ้งเตือน
func createAlertMessage(locationName string, currentMeterValue int, usageDiff int) string {
	currentTime := time.Now().Format("02/01/2006 15:04")

	if usageDiff > 0 {
		return fmt.Sprintf("การแจ้งเตือนระบบตรวจวัดน้ำ\n"+
			"การตรวจพบ: ค่าการใช้น้ำสูงกว่าปกติ\n"+
			"สถานที่: %s\n"+
			"ค่าที่วัดได้: %d หน่วย\n"+
			"เพิ่มขึ้น: +%d หน่วย\n"+
			"เวลาตรวจพบ: %s\n"+
			"กรุณาตรวจสอบระบบประปา",
			locationName, currentMeterValue, usageDiff, currentTime)
	} else {
		return fmt.Sprintf("การแจ้งเตือนระบบตรวจวัดน้ำ\n"+
			"การตรวจพบ: ค่าการใช้น้ำต่ำกว่าปกติ\n"+
			"สถานที่: %s\n"+
			"ค่าที่วัดได้: %d หน่วย\n"+
			"ลดลง: %d หน่วย\n"+
			"เวลาตรวจพบ: %s\n"+
			"กรุณาตรวจสอบระบบประปา",
			locationName, currentMeterValue, usageDiff, currentTime)
	}
}

// sendToLineUsers - ส่งแจ้งเตือนไป LINE ให้ผู้ใช้ที่เลือกรับ
func sendToLineUsers(db *gorm.DB, message string, locationName string) {
	// หาผู้ใช้ที่เปิดแจ้งเตือน LINE
	var users []entity.Users
	if err := db.Where("is_selected_for_line = ?", true).Find(&users).Error; err != nil {
		fmt.Printf("[ERROR] Failed to find users for LINE alert: %v\n", err)
		return
	}

	// ตรวจสอบว่ามีผู้ใช้ที่เปิดรับแจ้งเตือน LINE หรือไม่
	if len(users) == 0 {
		fmt.Printf("[INFO] No users selected for LINE alerts, skipping LINE notification for location: %s\n", locationName)
		return
	}

	// ส่งแจ้งเตือนไป LINE สำหรับแต่ละผู้ใช้ที่เปิดรับ
	for _, user := range users {
		if user.LineUserID != nil && *user.LineUserID != "" {
			if err := SendLineMessage(*user.LineUserID, message); err != nil {
				fmt.Printf("[ERROR] Failed to send LINE message to user %d: %v\n", user.ID, err)
			} else {
				fmt.Printf("[INFO] LINE alert sent to user %d (%s) for location: %s\n", user.ID, user.Email, locationName)
			}
		} else {
			fmt.Printf("[WARNING] User %d (%s) has is_selected_for_line=true but no LINE User ID\n", user.ID, user.Email)
		}
	}
}

// SendLineMessage - ส่งข้อความไป LINE Bot API
func SendLineMessage(lineUserID string, message string) error {
	// LINE Bot API endpoint
	url := "https://api.line.me/v2/bot/message/push"

	// สร้าง payload
	payload := map[string]interface{}{
		"to": lineUserID,
		"messages": []map[string]interface{}{
			{
				"type": "text",
				"text": message,
			},
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %v", err)
	}

	// สร้าง HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// ใส่ LINE Bot Token จาก config
	lineToken := config.Cfg.LineChannelAccessToken
	if lineToken == "" {
		return fmt.Errorf("LINE_CHANNEL_ACCESS_TOKEN not configured in .env file")
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+lineToken)

	// ส่ง request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("LINE API error: status %d", resp.StatusCode)
	}

	return nil
}
