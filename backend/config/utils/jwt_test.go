package utils

import (
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

const testSecret = "test-jwt-secret"

func TestGenerateToken_ReturnsToken(t *testing.T) {
	p := NewJWTProvider(testSecret, time.Hour)
	tok, err := p.GenerateToken(42, 1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if tok == "" {
		t.Fatal("expected non-empty token")
	}
}

func TestParseToken_ValidToken(t *testing.T) {
	os.Setenv("JWT_SECRET_KEY", testSecret)
	defer os.Unsetenv("JWT_SECRET_KEY")

	p := NewJWTProvider(testSecret, time.Hour)
	tok, _ := p.GenerateToken(7, 2)

	claims, err := ParseToken(tok)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if claims.UserID != 7 {
		t.Errorf("expected UserID 7, got %d", claims.UserID)
	}
	if claims.RoleID != 2 {
		t.Errorf("expected RoleID 2, got %d", claims.RoleID)
	}
}

func TestParseToken_MissingEnv(t *testing.T) {
	os.Unsetenv("JWT_SECRET_KEY")
	_, err := ParseToken("any.token.here")
	if err == nil {
		t.Fatal("expected error when JWT_SECRET_KEY is not set")
	}
}

func TestParseToken_InvalidToken(t *testing.T) {
	os.Setenv("JWT_SECRET_KEY", testSecret)
	defer os.Unsetenv("JWT_SECRET_KEY")

	_, err := ParseToken("this.is.not.a.valid.jwt")
	if err == nil {
		t.Fatal("expected error for invalid token")
	}
}

func TestParseToken_ExpiredToken(t *testing.T) {
	os.Setenv("JWT_SECRET_KEY", testSecret)
	defer os.Unsetenv("JWT_SECRET_KEY")

	// สร้าง token ที่หมดอายุทันที
	p := NewJWTProvider(testSecret, -time.Second)
	tok, _ := p.GenerateToken(1, 1)

	_, err := ParseToken(tok)
	if err == nil {
		t.Fatal("expected error for expired token")
	}
}

func TestGetUserIDFromContext_Found(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(nil)
	c.Set(ContextUserIDKey, uint(99))

	id, ok := GetUserIDFromContext(c)
	if !ok {
		t.Fatal("expected ok=true")
	}
	if id != 99 {
		t.Errorf("expected 99, got %d", id)
	}
}

func TestGetUserIDFromContext_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(nil)

	_, ok := GetUserIDFromContext(c)
	if ok {
		t.Fatal("expected ok=false when key not set")
	}
}

func TestGetUserIDFromContext_WrongType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(nil)
	c.Set(ContextUserIDKey, "not-a-uint")

	_, ok := GetUserIDFromContext(c)
	if ok {
		t.Fatal("expected ok=false for wrong type")
	}
}
