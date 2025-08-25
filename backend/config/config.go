package config

import (
	"log"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"github.com/joho/godotenv"
)

type AppConfig struct {
	LineChannelSecret      string
	LineChannelAccessToken string
	LineAdminUserIDs       []string
	DashboardURL           string
}

var Cfg AppConfig

// Load อ่านค่า ENV จากไฟล์ .env (ถ้ามี) และจากตัวแปรแวดล้อมของระบบ
func Load() {
	// ถ้าไม่มีไฟล์ .env ก็ไม่เป็นไร จะใช้ค่า ENV จากระบบแทน
	if err := godotenv.Load(); err != nil {
		log.Println("[config] No .env file found, using system environment variables")
	}

	Cfg = AppConfig{
		LineChannelSecret:      os.Getenv("LINE_CHANNEL_SECRET"),
		LineChannelAccessToken: os.Getenv("LINE_CHANNEL_ACCESS_TOKEN"),
		DashboardURL:           os.Getenv("DASHBOARD_URL"),
	}

	if v := os.Getenv("LINE_ADMIN_USER_IDS"); v != "" {
		Cfg.LineAdminUserIDs = strings.Split(v, ",")
	}
}

// hashPassword เป็น function สำหรับการแปลง password

func HashPassword(password string) (string, error) {

	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)

	return string(bytes), err

}

// checkPasswordHash เป็น function สำหรับ check password ที่ hash แล้ว ว่าตรงกันหรือไม่

func CheckPasswordHash(password, hash []byte) bool {

	err := bcrypt.CompareHashAndPassword(hash, password)

	return err == nil

}
