package users

import (
	"errors"
	"log"
	"net/http"
	"strings"
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
		Email		string `json:"email"`
		Username    string `json:"username"`
		Password 	string `json:"password"`
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

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var jwtSubject string
	var tokenID uint

	if payload.Username != "" {
		var device entity.DeviceCredential
		if err := config.DB().Raw("SELECT * FROM device_credentials WHERE username = ?", payload.Username).Scan(&device).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "device not found"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(device.Password), []byte(payload.Password)); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "password incorrect"})
			return
		}

		jwtSubject = device.Username
		tokenID = device.ID

	} else if payload.Email != "" {
		var user entity.Users
		email := strings.ToLower(payload.Email)

		if err := config.DB().Raw("SELECT * FROM users WHERE email = ?", email).Scan(&user).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(payload.Password)); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "password incorrect"})
			return
		}

		jwtSubject = user.Email
		tokenID = user.ID

	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email or username required"})
		return
	}

	// สร้าง JWT token
	jwtWrapper := services.JwtWrapper{
		SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}

	signedToken, err := jwtWrapper.GenerateToken(jwtSubject)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error signing token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token_type": "Bearer",
		"token":      signedToken,
		"id":         tokenID,
	})
}