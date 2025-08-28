// controller/line/webhook.go
package line

import (
	"log"
	"net/http"

	"example.com/sa-67-example/config"
	"github.com/gin-gonic/gin"
	"github.com/line/line-bot-sdk-go/v7/linebot"
)

// WebhookHandler รับ Event จาก LINE (POST /line/webhook)
func WebhookHandler(c *gin.Context) {
	// สร้าง client จากค่าใน ENV (โหลดแล้วใน main.go ผ่าน config.Load())
	bot, err := linebot.New(config.Cfg.LineChannelSecret, config.Cfg.LineChannelAccessToken)
	if err != nil {
		log.Println("[line] bot init error:", err)
		c.Status(http.StatusInternalServerError)
		return
	}

	// ตรวจลายเซ็น + แปลง event
	events, err := bot.ParseRequest(c.Request)
	if err != nil {
		if err == linebot.ErrInvalidSignature {
			log.Println("[line] invalid signature")
			c.Status(http.StatusBadRequest)
			return
		}
		log.Println("[line] parse error:", err)
		c.Status(http.StatusInternalServerError)
		return
	}

	// วนลูปรับทุก event
	for _, ev := range events {
		switch ev.Type {

		case linebot.EventTypeFollow:
			// ผู้ใช้กดแอดบอท → เก็บ userId จาก log (เอาไปใส่ .env หรือบันทึก DB ภายหลัง)
			log.Println("[line] FOLLOW userID:", ev.Source.UserID)
			_, _ = bot.ReplyMessage(ev.ReplyToken,
				linebot.NewTextMessage("ขอบคุณที่แอดครับ ✅\nพิมพ์: id เพื่อดู userId ของคุณ"),
			).Do()

		case linebot.EventTypeMessage:
			switch m := ev.Message.(type) {
			case *linebot.TextMessage:
				userID := ev.Source.UserID
				log.Printf("[line] MSG from %s: %s\n", userID, m.Text)

				// คำสั่งง่าย ๆ
				switch m.Text {
				case "id", "Id", "ID":
					_, _ = bot.ReplyMessage(ev.ReplyToken,
						linebot.NewTextMessage("👤 userId ของคุณคือ:\n"+userID),
					).Do()

				case "help", "Help":
					_, _ = bot.ReplyMessage(ev.ReplyToken,
						linebot.NewTextMessage("คำสั่งที่มี:\n• id — แสดง userId ของคุณ\n• help — แสดงเมนูช่วยเหลือ"),
					).Do()

				default:
					// ตอบรับปกติ
					_, _ = bot.ReplyMessage(ev.ReplyToken,
						linebot.NewTextMessage("รับข้อความแล้วครับ ✅"),
					).Do()
				}
			}
		}
	}

	// ต้องตอบ 200 เสมอเพื่อให้ LINE ถือว่า success
	c.Status(http.StatusOK)
}
