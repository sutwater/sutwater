package users

import (
	"errors"
	"log"
	"net/http"
	"strings" // ✅ เพิ่ม import นี้
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/entity"
	"github.com/watermeter/suth/services"
)

type (
	Authen struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	signUp struct {
		FirstName string    `json:"first_name"`
		LastName  string    `json:"last_name"`
		Email     string    `json:"email"`
		Age       uint8     `json:"age"`
		Password  string    `json:"password"`
		BirthDay  time.Time `json:"birthday"`
		GenderID  uint      `json:"gender_id"`
	}
)

func SignUp(c *gin.Context) {
	var payload signUp

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ Convert email to lowercase
	payload.Email = strings.ToLower(payload.Email)

	log.Printf("📦 Payload: %+v\n", payload)

	if payload.GenderID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาเลือกเพศ"})
		return
	}

	db := config.DB()
	var userCheck entity.Users

	result := db.Where("email = ?", payload.Email).First(&userCheck)
	if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if userCheck.ID != 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Email is already registered"})
		return
	}

	hashedPassword, _ := config.HashPassword(payload.Password)

	user := entity.Users{
		FirstName: payload.FirstName,
		LastName:  payload.LastName,
		Email:     payload.Email,
		Age:       payload.Age,
		Password:  hashedPassword,
		BirthDay:  payload.BirthDay,
		GenderID:  payload.GenderID,
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Sign-up successful"})
}

func SignIn(c *gin.Context) {
	var payload Authen
	var user entity.Users

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ Convert email to lowercase
	email := strings.ToLower(payload.Email)

	if err := config.DB().Raw("SELECT * FROM users WHERE email = ?", email).Scan(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(payload.Password))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password is incorrect"})
		return
	}

	jwtWrapper := services.JwtWrapper{
		SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}

	signedToken, err := jwtWrapper.GenerateToken(user.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error signing token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token_type": "Bearer",
		"token":      signedToken,
		"id":         user.ID,
		"user": gin.H{
			"role_id":              user.RoleID,
			"email":                user.Email,
			"first_name":           user.FirstName,
			"last_name":            user.LastName,
			"line_user_id":         user.LineUserID,
			"is_selected_for_line": user.IsSelectedForLine,
		},
	})
}
