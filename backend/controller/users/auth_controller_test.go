package users

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config/models"
)

type mockAuthService struct {
	registerFn func(input models.RegisterRequest) (*models.AuthResponse, error)
	loginFn    func(input models.LoginRequest) (*models.AuthResponse, error)
}

func (m *mockAuthService) Register(input models.RegisterRequest) (*models.AuthResponse, error) {
	return m.registerFn(input)
}
func (m *mockAuthService) Login(input models.LoginRequest) (*models.AuthResponse, error) {
	return m.loginFn(input)
}

func setupAuthRouter(svc *mockAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	NewAuthHandler(r.Group("/api/v1"), svc)
	return r
}

func assertStatusAuth(t *testing.T, want, got int) {
	t.Helper()
	if want != got {
		t.Errorf("status: want %d, got %d", want, got)
	}
}

func jsonBodyAuth(t *testing.T, v any) *bytes.Buffer {
	t.Helper()
	b, _ := json.Marshal(v)
	return bytes.NewBuffer(b)
}

func jsonReqAuth(t *testing.T, method, url string, body *bytes.Buffer) *http.Request {
	t.Helper()
	req := httptest.NewRequest(method, url, body)
	req.Header.Set("Content-Type", "application/json")
	return req
}

var sampleAuth = &models.AuthResponse{Token: "tok", User: &models.UserResponse{ID: 1}}

// --- Register ---

func TestRegister_Success(t *testing.T) {
	r := setupAuthRouter(&mockAuthService{
		registerFn: func(input models.RegisterRequest) (*models.AuthResponse, error) {
			return sampleAuth, nil
		},
	})
	body := jsonBodyAuth(t, models.RegisterRequest{
		Name:     "สมชาย ใจดี",
		Email:    "test@example.com",
		Password: "password123",
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqAuth(t, http.MethodPost, "/api/v1/auth/register", body))
	assertStatusAuth(t, http.StatusCreated, w.Code)
}

func TestRegister_InvalidJSON(t *testing.T) {
	r := setupAuthRouter(&mockAuthService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqAuth(t, http.MethodPost, "/api/v1/auth/register", bytes.NewBufferString("{bad}")))
	assertStatusAuth(t, http.StatusBadRequest, w.Code)
}

func TestRegister_ValidationError(t *testing.T) {
	r := setupAuthRouter(&mockAuthService{})
	// password น้อยกว่า 8 ตัวอักษร
	body := jsonBodyAuth(t, map[string]any{
		"name":     "สมชาย",
		"email":    "bad-email",
		"password": "123",
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqAuth(t, http.MethodPost, "/api/v1/auth/register", body))
	assertStatusAuth(t, http.StatusBadRequest, w.Code)
}

func TestRegister_ServiceError(t *testing.T) {
	r := setupAuthRouter(&mockAuthService{
		registerFn: func(input models.RegisterRequest) (*models.AuthResponse, error) {
			return nil, errors.New("email already exist")
		},
	})
	body := jsonBodyAuth(t, models.RegisterRequest{
		Name:     "สมชาย ใจดี",
		Email:    "existing@example.com",
		Password: "password123",
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqAuth(t, http.MethodPost, "/api/v1/auth/register", body))
	assertStatusAuth(t, http.StatusBadRequest, w.Code)
}

// --- Login ---

func TestLogin_Success(t *testing.T) {
	r := setupAuthRouter(&mockAuthService{
		loginFn: func(input models.LoginRequest) (*models.AuthResponse, error) {
			return sampleAuth, nil
		},
	})
	body := jsonBodyAuth(t, models.LoginRequest{
		Email:    "test@example.com",
		Password: "password123",
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqAuth(t, http.MethodPost, "/api/v1/auth/login", body))
	assertStatusAuth(t, http.StatusOK, w.Code)
}

func TestLogin_InvalidJSON(t *testing.T) {
	r := setupAuthRouter(&mockAuthService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqAuth(t, http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString("{bad}")))
	assertStatusAuth(t, http.StatusBadRequest, w.Code)
}

func TestLogin_ValidationError(t *testing.T) {
	r := setupAuthRouter(&mockAuthService{})
	// email format ผิด
	body := jsonBodyAuth(t, map[string]any{"email": "not-an-email", "password": "pass"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqAuth(t, http.MethodPost, "/api/v1/auth/login", body))
	assertStatusAuth(t, http.StatusBadRequest, w.Code)
}

func TestLogin_Unauthorized(t *testing.T) {
	r := setupAuthRouter(&mockAuthService{
		loginFn: func(input models.LoginRequest) (*models.AuthResponse, error) {
			return nil, errors.New("invalid credentials")
		},
	})
	body := jsonBodyAuth(t, models.LoginRequest{
		Email:    "test@example.com",
		Password: "wrongpassword",
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqAuth(t, http.MethodPost, "/api/v1/auth/login", body))
	assertStatusAuth(t, http.StatusUnauthorized, w.Code)
}
