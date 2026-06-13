package middlewares

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/watermeter/suth/services"
)

var HashKey = []byte("very-secret")
var BlockKey = []byte("a-lot-secret1234")

// Authorization เป็นฟังก์ชั่นตรวจเช็ค Cookie
func Authorizes() gin.HandlerFunc {

	err := godotenv.Load()
	if err != nil {
		fmt.Println("Cannot load .env file")
	}

	secret_key := os.Getenv("SECRET_KEY")

	return func(c *gin.Context) {
		clientToken := c.Request.Header.Get("Authorization")
		if clientToken == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No Authorization header provided"})
			return
		}

		extractedToken := strings.Split(clientToken, "Bearer ")

		if len(extractedToken) == 2 {
			clientToken = strings.TrimSpace(extractedToken[1])
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Incorrect Format of Authorization Token"})
			return
		}

		jwtWrapper := services.JwtWrapper{
			SecretKey: secret_key,
			Issuer:    "AuthService",
		}

		claims, err := jwtWrapper.ValidateToken(clientToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		// ฝากข้อมูลไว้ใน Context เพื่อใช้ใน Step ถัดไป
		c.Set("userEmail", claims.Email)
		c.Set("userRoleID", claims.RoleID)

		c.Next()
	}

}

func AuthorizesAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		// ดึง RoleID ที่เรา Set ไว้ใน Middleware
		roleID, exists := c.Get("userRoleID")

		if !exists {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Context not found"})
			return
		}

		// ตรวจสอบว่า RoleID ตรงกับ Admin หรือไม่
		const AdminRoleID = 1
		if roleID.(uint) != AdminRoleID {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access denied: Admin only"})
			return
		}

		c.Next()
	}
}
