package services

import (
	"bytes"
	"encoding/base64"
	"errors"
	"log"

	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/entity"
	"github.com/line/line-bot-sdk-go/v7/linebot"
	"github.com/skip2/go-qrcode"
)

// LinkLineAccount ใช้สำหรับผูก lineUserId กับ userId ที่กำหนด
func LinkLineAccount(userID uint, lineUserID string) error {
	db := config.DB()

	var user entity.Users
	if err := db.First(&user, userID).Error; err != nil {
		return err
	}

	// อัปเดตค่า lineUserId ใน record
	user.LineUserID = &lineUserID
	if err := db.Save(&user).Error; err != nil {
		return err
	}

	log.Printf("[line] ✅ Linked userID=%d with lineUserID=%s", userID, lineUserID)
	return nil
}

// CheckLink ใช้สำหรับตรวจสอบว่า lineUserID ถูกเชื่อมกับ userID หรือไม่
func CheckLink(lineUserID string) (*entity.Users, error) {
	db := config.DB()

	var user entity.Users
	if err := db.Where("line_user_id = ?", lineUserID).First(&user).Error; err != nil {
		log.Printf("[line] ❌ ไม่พบการเชื่อมบัญชีสำหรับ lineUserID=%s: %v\n", lineUserID, err)
		return nil, errors.New("no account linked")
	}

	log.Printf("[line] ✅ พบการเชื่อมบัญชี userID=%d ↔ lineUserID=%s", user.ID, lineUserID)
	return &user, nil
}

// SendMessageToUser ใช้สำหรับส่งข้อความไปยัง LINE user เฉพาะบุคคล
func SendMessageToUser(lineUserID string, message string) error {
	bot, err := linebot.New(config.Cfg.LineChannelSecret, config.Cfg.LineChannelAccessToken)
	if err != nil {
		log.Printf("[line] ❌ bot init error: %v\n", err)
		return errors.New("failed to initialize LINE bot")
	}

	msg := linebot.NewTextMessage(message)
	_, err = bot.PushMessage(lineUserID, msg).Do()
	if err != nil {
		log.Printf("[line] ❌ push message error: %v\n", err)
		return errors.New("failed to send message")
	}

	log.Printf("[line] ✅ ส่งข้อความสำเร็จไปยัง lineUserID=%s", lineUserID)
	return nil
}

// GenerateStaticQRCode สร้าง QR Code สถิติเพื่อเพิ่มเพื่อนใน LINE
func GenerateStaticQRCode() (string, error) {
	// URL สำหรับเพิ่มเพื่อนใน LINE
	addFriendUrl := "https://line.me/R/ti/p/@504xabge"

	// สร้าง QR Code
	qrCode, err := qrcode.New(addFriendUrl, qrcode.Medium)
	if err != nil {
		log.Printf("[line] ❌ สร้าง QR Code ไม่สำเร็จ: %v\n", err)
		return "", err
	}

	// บันทึก QR Code ลงในบัฟเฟอร์และแปลงเป็น Base64
	var buffer bytes.Buffer
	err = qrCode.Write(256, &buffer)
	if err != nil {
		log.Printf("[line] ❌ Failed to write QR Code to buffer: %v\n", err)
		return "", err
	}

	qrCodeBase64 := base64.StdEncoding.EncodeToString(buffer.Bytes())
	log.Printf("[line] ✅ สร้าง QR Code สำเร็จ")
	return qrCodeBase64, nil
}

func UpdateLineUserIDByUserID(userID uint, lineUserID string) error {
	db := config.DB()

	var user entity.Users
	if err := db.First(&user, userID).Error; err != nil {
		log.Printf("[line] ❌ ไม่พบ userID=%d: %v\n", userID, err)
		return err
	}

	// อัปเดต lineUserID ใน record
	user.LineUserID = &lineUserID
	if err := db.Save(&user).Error; err != nil {
		log.Printf("[line] ❌ Failed to update lineUserID for userID=%d: %v\n", userID, err)
		return err
	}

	log.Printf("[line] ✅ Updated lineUserID=%s for userID=%d", lineUserID, userID)
	return nil
}

// SendAlertNotificationToUser ใช้สำหรับส่งข้อความแจ้งเตือน (Alert) ไปยัง LINE user เมื่อพบข้อผิดพลาดหรือ usage ผิดปกติ
func SendAlertNotificationToUser(lineUserID string, errorDetail string) error {
	bot, err := linebot.New(config.Cfg.LineChannelSecret, config.Cfg.LineChannelAccessToken)
	if err != nil {
		log.Printf("[line] ❌ bot init error: %v\n", err)
		return errors.New("failed to initialize LINE bot")
	}

	alertMsg := "แจ้งเตือน: " + errorDetail
	msg := linebot.NewTextMessage(alertMsg)
	_, err = bot.PushMessage(lineUserID, msg).Do()
	if err != nil {
		log.Printf("[line] ❌ push alert message error: %v\n", err)
		return errors.New("failed to send alert notification")
	}

	log.Printf("[line] ✅ ส่งแจ้งเตือนไปยัง lineUserID=%s", lineUserID)
	return nil
}
