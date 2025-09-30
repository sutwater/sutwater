package line

import (
	"log"
	"net/http"

	"github.com/watermeter/suth/services"
	"github.com/gin-gonic/gin"
)

// GetQRCodeHandler handles the request to generate a QR Code for LINE
func GetQRCodeHandler(c *gin.Context) {
	// สร้าง QR Code สำหรับเพิ่มเพื่อนใน LINE
	qrCodeBase64, err := services.GenerateStaticQRCode()
	if err != nil {
		log.Printf("[line] ❌ Failed to generate QR Code: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate QR Code"})
		return
	}

	// เพิ่ม Header CORS
	c.Writer.Header().Set("Access-Control-Allow-Origin", c.Request.Header.Get("Origin"))
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

	// ส่ง QR Code กลับไปยัง Frontend
	c.JSON(http.StatusOK, gin.H{
		"qrCodeBase64": qrCodeBase64,
		"message":      "กรุณาแสกน QR Code เพื่อเพิ่มเพื่อนใน LINE",
	})
}
