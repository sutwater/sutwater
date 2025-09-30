package line

import (
	"log"
	"net/http"

	"github.com/watermeter/suth/config"
	"github.com/gin-gonic/gin"
	"github.com/line/line-bot-sdk-go/v7/linebot"
)

// WebhookHandler handles incoming LINE webhook events
func WebhookHandler(c *gin.Context) {
	bot, err := linebot.New(config.Cfg.LineChannelSecret, config.Cfg.LineChannelAccessToken)
	if err != nil {
		log.Println("[line] ❌ bot init error:", err)
		c.Status(http.StatusInternalServerError)
		return
	}

	events, err := bot.ParseRequest(c.Request)
	if err != nil {
		if err == linebot.ErrInvalidSignature {
			log.Println("[line] ❌ invalid signature")
			c.Status(http.StatusBadRequest)
			return
		}
		log.Println("[line] ❌ parse error:", err)
		c.Status(http.StatusInternalServerError)
		return
	}

	for _, ev := range events {
		if ev.Source.Type != linebot.EventSourceTypeUser {
			continue
		}

		lineUserID := ev.Source.UserID

		switch ev.Type {
		case linebot.EventTypeFollow:
			log.Printf("[line] ✅ FOLLOW: lineUserID=%s\n", lineUserID)

			// ส่งข้อความต้อนรับและ LINE User ID
			message1 := linebot.NewTextMessage("ขอบคุณที่เพิ่มเราเป็นเพื่อน! 🎉\nกรุณานำ LINE User ID ด้านล่างไปกรอกบนเว็บไซต์เพื่อเชื่อมบัญชี:")
			message2 := linebot.NewTextMessage(lineUserID)
			_, err = bot.ReplyMessage(ev.ReplyToken, message1, message2).Do()
			if err != nil {
				log.Println("[line] ❌ reply error:", err)
			}

		case linebot.EventTypeMessage:
			switch m := ev.Message.(type) {
			case *linebot.TextMessage:
				log.Printf("[line] 💬 MSG from %s: %s\n", lineUserID, m.Text)

				switch m.Text {
				case "id", "ID", "Id", "iD":
					// แยกข้อความ LINE User ID ออกเป็น 2 ข้อความ
					message1 := linebot.NewTextMessage("LINE User ID ของคุณคือ:")
					message2 := linebot.NewTextMessage(lineUserID)
					_, err = bot.ReplyMessage(ev.ReplyToken, message1, message2).Do()
					if err != nil {
						log.Println("[line] ❌ reply error:", err)
					}

				case "help", "Help", "HELP":
					help := "📌 คำสั่งที่สามารถใช้งานได้:\n• id — ดู LINE User ID ของคุณ\n• help — ดูคำแนะนำการใช้งาน"
					_, err = bot.ReplyMessage(ev.ReplyToken, linebot.NewTextMessage(help)).Do()
					if err != nil {
						log.Println("[line] ❌ reply error:", err)
					}

				default:
					unknown := "❓ ขออภัย ระบบไม่เข้าใจคำสั่งของคุณ\nกรุณาพิมพ์ 'help' เพื่อดูคำสั่งที่สามารถใช้งานได้"
					_, err = bot.ReplyMessage(ev.ReplyToken, linebot.NewTextMessage(unknown)).Do()
					if err != nil {
						log.Println("[line] ❌ reply error:", err)
					}
				}
			}
		}
	}

	c.Status(http.StatusOK)
}
