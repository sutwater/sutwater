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
	"github.com/watermeter/suth/config/utils"
)

type mockUserService struct {
	getProfileFn     func(userID uint) (*models.UserResponse, error)
	updateProfileFn  func(userID uint, input models.UpdateUserRequest) (*models.UserResponse, error)
	changePasswordFn func(userID uint, input models.ChangePasswordRequest) error
	deleteUserFn     func(userID uint) error
	getAllUsersFn     func() ([]models.UserResponse, error)
}

func (m *mockUserService) GetProfile(userID uint) (*models.UserResponse, error) {
	return m.getProfileFn(userID)
}
func (m *mockUserService) UpdateProfile(userID uint, input models.UpdateUserRequest) (*models.UserResponse, error) {
	return m.updateProfileFn(userID, input)
}
func (m *mockUserService) ChangePassword(userID uint, input models.ChangePasswordRequest) error {
	return m.changePasswordFn(userID, input)
}
func (m *mockUserService) DeleteUser(userID uint) error {
	return m.deleteUserFn(userID)
}
func (m *mockUserService) GetAllUsers() ([]models.UserResponse, error) {
	return m.getAllUsersFn()
}

func setupUserRouter(svc *mockUserService, userID *uint) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	if userID != nil {
		uid := *userID
		r.Use(func(c *gin.Context) {
			c.Set(utils.ContextUserIDKey, uid)
			c.Next()
		})
	}
	NewUserHandler(r.Group("/api/v1"), svc)
	return r
}

func assertStatusUser(t *testing.T, want, got int) {
	t.Helper()
	if want != got {
		t.Errorf("status: want %d, got %d", want, got)
	}
}

func jsonBodyUser(t *testing.T, v any) *bytes.Buffer {
	t.Helper()
	b, _ := json.Marshal(v)
	return bytes.NewBuffer(b)
}

func jsonReqUser(t *testing.T, method, url string, body *bytes.Buffer) *http.Request {
	t.Helper()
	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, url, body)
	} else {
		req = httptest.NewRequest(method, url, nil)
	}
	req.Header.Set("Content-Type", "application/json")
	return req
}

var testUID = uint(1)
var sampleUser = &models.UserResponse{ID: 1, FirstName: "สมชาย", Email: "test@example.com"}

// --- GetAllUsers ---

func TestGetAllUsers_Success(t *testing.T) {
	r := setupUserRouter(&mockUserService{
		getAllUsersFn: func() ([]models.UserResponse, error) {
			return []models.UserResponse{*sampleUser}, nil
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/users", nil))
	assertStatusUser(t, http.StatusOK, w.Code)
}

func TestGetAllUsers_ServiceError(t *testing.T) {
	r := setupUserRouter(&mockUserService{
		getAllUsersFn: func() ([]models.UserResponse, error) {
			return nil, errors.New("db error")
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/users", nil))
	assertStatusUser(t, http.StatusInternalServerError, w.Code)
}

// --- GetProfile ---

func TestGetProfile_MissingUserID(t *testing.T) {
	r := setupUserRouter(&mockUserService{}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/users/1", nil))
	assertStatusUser(t, http.StatusUnauthorized, w.Code)
}

func TestGetProfile_Success(t *testing.T) {
	r := setupUserRouter(&mockUserService{
		getProfileFn: func(userID uint) (*models.UserResponse, error) {
			return sampleUser, nil
		},
	}, &testUID)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/users/1", nil))
	assertStatusUser(t, http.StatusOK, w.Code)
}

func TestGetProfile_NotFound(t *testing.T) {
	r := setupUserRouter(&mockUserService{
		getProfileFn: func(userID uint) (*models.UserResponse, error) {
			return nil, errors.New("not found")
		},
	}, &testUID)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/users/1", nil))
	assertStatusUser(t, http.StatusNotFound, w.Code)
}

// --- UpdateProfile ---

func TestUpdateProfile_MissingUserID(t *testing.T) {
	r := setupUserRouter(&mockUserService{}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqUser(t, http.MethodPut, "/api/v1/users/1", jsonBodyUser(t, map[string]any{})))
	assertStatusUser(t, http.StatusUnauthorized, w.Code)
}

func TestUpdateProfile_InvalidJSON(t *testing.T) {
	r := setupUserRouter(&mockUserService{}, &testUID)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqUser(t, http.MethodPut, "/api/v1/users/1", bytes.NewBufferString("{bad}")))
	assertStatusUser(t, http.StatusBadRequest, w.Code)
}

func TestUpdateProfile_ValidationError(t *testing.T) {
	r := setupUserRouter(&mockUserService{}, &testUID)
	// first_name น้อยกว่า 3 ตัวอักษร (min=3)
	body := jsonBodyUser(t, map[string]any{"first_name": "ab", "email": "not-email"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqUser(t, http.MethodPut, "/api/v1/users/1", body))
	assertStatusUser(t, http.StatusBadRequest, w.Code)
}

func TestUpdateProfile_Success(t *testing.T) {
	r := setupUserRouter(&mockUserService{
		updateProfileFn: func(userID uint, input models.UpdateUserRequest) (*models.UserResponse, error) {
			return sampleUser, nil
		},
	}, &testUID)
	body := jsonBodyUser(t, models.UpdateUserRequest{FirstName: "สมหญิง"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqUser(t, http.MethodPut, "/api/v1/users/1", body))
	assertStatusUser(t, http.StatusOK, w.Code)
}

func TestUpdateProfile_ServiceError(t *testing.T) {
	r := setupUserRouter(&mockUserService{
		updateProfileFn: func(userID uint, input models.UpdateUserRequest) (*models.UserResponse, error) {
			return nil, errors.New("update failed")
		},
	}, &testUID)
	body := jsonBodyUser(t, models.UpdateUserRequest{FirstName: "สมหญิง"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqUser(t, http.MethodPut, "/api/v1/users/1", body))
	assertStatusUser(t, http.StatusBadRequest, w.Code)
}

// --- ChangePassword ---

func TestChangePassword_MissingUserID(t *testing.T) {
	r := setupUserRouter(&mockUserService{}, nil)
	body := jsonBodyUser(t, models.ChangePasswordRequest{OldPassword: "old", NewPassword: "newpass123"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqUser(t, http.MethodPut, "/api/v1/users/1/change-password", body))
	assertStatusUser(t, http.StatusUnauthorized, w.Code)
}

func TestChangePassword_InvalidJSON(t *testing.T) {
	r := setupUserRouter(&mockUserService{}, &testUID)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqUser(t, http.MethodPut, "/api/v1/users/1/change-password", bytes.NewBufferString("{bad}")))
	assertStatusUser(t, http.StatusBadRequest, w.Code)
}

func TestChangePassword_ValidationError(t *testing.T) {
	r := setupUserRouter(&mockUserService{}, &testUID)
	// new_password น้อยกว่า 8 ตัวอักษร
	body := jsonBodyUser(t, map[string]any{"old_password": "old", "new_password": "short"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqUser(t, http.MethodPut, "/api/v1/users/1/change-password", body))
	assertStatusUser(t, http.StatusBadRequest, w.Code)
}

func TestChangePassword_WrongPassword(t *testing.T) {
	r := setupUserRouter(&mockUserService{
		changePasswordFn: func(userID uint, input models.ChangePasswordRequest) error {
			return errors.New("old password is incorrect")
		},
	}, &testUID)
	body := jsonBodyUser(t, models.ChangePasswordRequest{OldPassword: "wrong", NewPassword: "newpass123"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqUser(t, http.MethodPut, "/api/v1/users/1/change-password", body))
	assertStatusUser(t, http.StatusBadRequest, w.Code)
}

func TestChangePassword_Success(t *testing.T) {
	r := setupUserRouter(&mockUserService{
		changePasswordFn: func(userID uint, input models.ChangePasswordRequest) error { return nil },
	}, &testUID)
	body := jsonBodyUser(t, models.ChangePasswordRequest{OldPassword: "oldpass", NewPassword: "newpass123"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqUser(t, http.MethodPut, "/api/v1/users/1/change-password", body))
	assertStatusUser(t, http.StatusOK, w.Code)
}

func TestChangePassword_ServiceError(t *testing.T) {
	r := setupUserRouter(&mockUserService{
		changePasswordFn: func(userID uint, input models.ChangePasswordRequest) error {
			return errors.New("hash failed")
		},
	}, &testUID)
	body := jsonBodyUser(t, models.ChangePasswordRequest{OldPassword: "oldpass", NewPassword: "newpass123"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReqUser(t, http.MethodPut, "/api/v1/users/1/change-password", body))
	assertStatusUser(t, http.StatusBadRequest, w.Code)
}

// --- DeleteUser ---

func TestDeleteUser_MissingUserID(t *testing.T) {
	r := setupUserRouter(&mockUserService{}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/users/1", nil))
	assertStatusUser(t, http.StatusUnauthorized, w.Code)
}

func TestDeleteUser_Success(t *testing.T) {
	r := setupUserRouter(&mockUserService{
		deleteUserFn: func(userID uint) error { return nil },
	}, &testUID)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/users/1", nil))
	assertStatusUser(t, http.StatusNoContent, w.Code)
}

func TestDeleteUser_ServiceError(t *testing.T) {
	r := setupUserRouter(&mockUserService{
		deleteUserFn: func(userID uint) error { return errors.New("delete failed") },
	}, &testUID)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/users/1", nil))
	assertStatusUser(t, http.StatusBadRequest, w.Code)
}
