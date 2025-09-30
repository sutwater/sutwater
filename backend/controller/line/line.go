package line

import (
	"bytes"
	"io"
	"log"
	"net/http"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"
	"github.com/gin-gonic/gin"
	"github.com/line/line-bot-sdk-go/v7/linebot"
)

// LinkLineAccount links a LINE userId with a userId
func LinkLineAccount(c *gin.Context) {
	var req struct {
		UserID     uint   `json:"user_id"`
		LineUserID string `json:"line_user_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.LineUserID == "" || req.UserID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing required fields"})
		return
	}

	db := config.DB()
	var user entity.Users
	if err := db.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.LineUserID = &req.LineUserID
	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link account"})
		return
	}

	log.Printf("[line] ✅ Linked userID=%d with lineUserID=%s", req.UserID, req.LineUserID)
	c.JSON(http.StatusOK, gin.H{"message": "Account linked successfully"})
}

// CheckLinkHandler checks if a LINE userId is linked to a userId
func CheckLinkHandler(c *gin.Context) {
	lineUserID := c.Query("line_user_id")
	if lineUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing line_user_id"})
		return
	}

	db := config.DB()
	var user entity.Users
	if err := db.Where("line_user_id = ?", lineUserID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No account linked"})
		return
	}

	log.Printf("[line] ✅ Found userID=%d linked to lineUserID=%s", user.ID, lineUserID)
	c.JSON(http.StatusOK, gin.H{"user_id": user.ID})
}

// SendMessageToUser sends a message to a specific LINE user
func SendMessageToUser(c *gin.Context) {
	var req struct {
		LineUserID string `json:"line_user_id"`
		Message    string `json:"message"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.LineUserID == "" || req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing required fields"})
		return
	}

	bot, err := linebot.New(config.Cfg.LineChannelSecret, config.Cfg.LineChannelAccessToken)
	if err != nil {
		log.Println("[line] ❌ Failed to initialize LINE bot:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize LINE bot"})
		return
	}

	msg := linebot.NewTextMessage(req.Message)
	_, err = bot.PushMessage(req.LineUserID, msg).Do()
	if err != nil {
		log.Println("[line] ❌ Failed to send message:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	log.Printf("[line] ✅ Message sent to lineUserID=%s", req.LineUserID)
	c.JSON(http.StatusOK, gin.H{"message": "Message sent successfully"})
}

// SendNotifications sends a message to multiple LINE users
func SendNotifications(c *gin.Context) {
	var req struct {
		UserIDs []uint `json:"user_ids"`
		Message string `json:"message"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || len(req.UserIDs) == 0 || req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing required fields"})
		return
	}

	db := config.DB()
	var users []entity.Users
	if err := db.Where("id IN ?", req.UserIDs).Where("line_user_id IS NOT NULL").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	bot, err := linebot.New(config.Cfg.LineChannelSecret, config.Cfg.LineChannelAccessToken)
	if err != nil {
		log.Println("[line] ❌ Failed to initialize LINE bot:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize LINE bot"})
		return
	}

	for _, user := range users {
		if user.LineUserID != nil {
			msg := linebot.NewTextMessage(req.Message)
			_, err := bot.PushMessage(*user.LineUserID, msg).Do()
			if err != nil {
				log.Printf("[line] ❌ Failed to send message to lineUserID=%s: %v", *user.LineUserID, err)
			} else {
				log.Printf("[line] ✅ Message sent to lineUserID=%s", *user.LineUserID)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notifications sent successfully"})
}

// SaveLineUserID saves the Line User ID to the database for a specific user
func SaveLineUserID(c *gin.Context) {
	var req struct {
		UserID     uint   `json:"user_id"` // เปลี่ยนเป็น uint
		LineUserID string `json:"line_user_id"`
	}

	// Debug: พิมพ์ค่า Request Body ที่ได้รับ
	body, _ := c.GetRawData()
	log.Printf("Raw Request Body: %s", string(body))

	// คืนค่า body กลับไปยัง Context
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	// ตรวจสอบว่า request body ถูกต้องหรือไม่
	if err := c.ShouldBindJSON(&req); err != nil || req.LineUserID == "" || req.UserID == 0 {
		log.Printf("Bind Error: %v", err) // Debug: พิมพ์ข้อผิดพลาด
		log.Printf("Parsed Request: %+v", req)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing required fields"})
		return
	}

	// ค้นหาผู้ใช้งานในฐานข้อมูล
	db := config.DB()
	var user entity.Users
	if err := db.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// บันทึก Line User ID ลงในฐานข้อมูล
	user.LineUserID = &req.LineUserID
	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save Line User ID"})
		return
	}

	log.Printf("[line] ✅ Saved Line User ID for userID=%d: lineUserID=%s", req.UserID, req.LineUserID)
	c.JSON(http.StatusOK, gin.H{"message": "Line User ID saved successfully"})
}

// LoginWithLine handles user login with LINE
func LoginWithLine(c *gin.Context) {
	var req struct {
		LineUserID string `json:"line_user_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.LineUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing required fields"})
		return
	}

	db := config.DB()
	var user entity.Users

	// ตรวจสอบว่ามีผู้ใช้งานที่เชื่อมโยงกับ Line User ID นี้หรือไม่
	if err := db.Where("line_user_id = ?", req.LineUserID).First(&user).Error; err != nil {
		// หากไม่มีผู้ใช้งาน, สร้างผู้ใช้งานใหม่
		user = entity.Users{
			LineUserID: &req.LineUserID,
		}
		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		log.Printf("[line] ✅ Created new user with lineUserID=%s", req.LineUserID)
	}

	// ส่งข้อมูลผู้ใช้งานกลับไปยัง Frontend
	c.JSON(http.StatusOK, gin.H{
		"user_id": user.ID,
		"message": "Login successful",
	})
}

// SendAlertNotificationToUser ส่งข้อความแจ้งเตือน (Alert) ไปยัง LINE user เมื่อพบข้อผิดพลาดในการใช้งาน
func SendAlertNotificationToUser(c *gin.Context) {
	var req struct {
		LineUserID  string `json:"line_user_id"`
		ErrorDetail string `json:"error_detail"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.LineUserID == "" || req.ErrorDetail == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing required fields"})
		return
	}

	bot, err := linebot.New(config.Cfg.LineChannelSecret, config.Cfg.LineChannelAccessToken)
	if err != nil {
		log.Println("[line] ❌ Failed to initialize LINE bot:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize LINE bot"})
		return
	}

	alertMsg := "แจ้งเตือน: พบข้อผิดพลาดในการใช้งาน\nรายละเอียด: " + req.ErrorDetail
	msg := linebot.NewTextMessage(alertMsg)
	_, err = bot.PushMessage(req.LineUserID, msg).Do()
	if err != nil {
		log.Println("[line] ❌ Failed to send alert message:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send alert notification"})
		return
	}

	log.Printf("[line] ✅ Alert notification sent to lineUserID=%s", req.LineUserID)
	c.JSON(http.StatusOK, gin.H{"message": "Alert notification sent successfully"})
}