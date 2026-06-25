package notification

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/config/utils"
)

type mockNotificationService struct {
	getAllFn              func(roleID, userID uint) ([]models.NotificationResponse, error)
	getByIDFn            func(id uint) (*models.NotificationResponse, error)
	markAsReadFn         func(id uint) (*models.NotificationResponse, error)
	markAllReadFn        func(roleID, userID uint) error
	deleteFn             func(id uint) error
	getStatsFn           func() (*models.NotificationStatsResponse, error)
	createSystemNotifFn  func(message string, targetUserID uint) error
}

func (m *mockNotificationService) GetAll(roleID, userID uint) ([]models.NotificationResponse, error) {
	return m.getAllFn(roleID, userID)
}
func (m *mockNotificationService) GetByID(id uint) (*models.NotificationResponse, error) {
	return m.getByIDFn(id)
}
func (m *mockNotificationService) MarkAsRead(id uint) (*models.NotificationResponse, error) {
	return m.markAsReadFn(id)
}
func (m *mockNotificationService) MarkAllAsRead(roleID, userID uint) error {
	return m.markAllReadFn(roleID, userID)
}
func (m *mockNotificationService) Delete(id uint) error {
	return m.deleteFn(id)
}
func (m *mockNotificationService) GetStats() (*models.NotificationStatsResponse, error) {
	return m.getStatsFn()
}
func (m *mockNotificationService) CreateSystemNotification(message string, targetUserID uint) error {
	if m.createSystemNotifFn != nil {
		return m.createSystemNotifFn(message, targetUserID)
	}
	return nil
}

// injectRole adds roleID and userID to gin context for routes protected by RequireRole
func setupRouter(svc *mockNotificationService, roleID uint) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(utils.ContextUserIDKey, uint(1))
		c.Set(utils.ContextRoleIDKey, roleID)
		c.Next()
	})
	NewNotificationHandler(r.Group("/api/v1"), svc)
	return r
}

func assertStatus(t *testing.T, want, got int) {
	t.Helper()
	if want != got {
		t.Errorf("status: want %d, got %d", want, got)
	}
}

var sampleNotif = models.NotificationResponse{ID: 1, Message: "ค่าผิดปกติ", IsRead: false}

// --- GetAll ---

func TestGetAll_Success(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		getAllFn: func(roleID, userID uint) ([]models.NotificationResponse, error) {
			return []models.NotificationResponse{sampleNotif}, nil
		},
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetAll_ServiceError(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		getAllFn: func(roleID, userID uint) ([]models.NotificationResponse, error) {
			return nil, errors.New("db error")
		},
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- GetStats ---

func TestGetStats_Success(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		getStatsFn: func() (*models.NotificationStatsResponse, error) {
			return &models.NotificationStatsResponse{Total: 10, Unread: 3}, nil
		},
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications/stats", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetStats_ServiceError(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		getStatsFn: func() (*models.NotificationStatsResponse, error) {
			return nil, errors.New("db error")
		},
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications/stats", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

func TestGetStats_Forbidden_UserRole(t *testing.T) {
	r := setupRouter(&mockNotificationService{}, utils.RoleUser)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications/stats", nil))
	assertStatus(t, http.StatusForbidden, w.Code)
}

// --- GetByID ---

func TestGetByID_Success(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		getByIDFn: func(id uint) (*models.NotificationResponse, error) {
			return &sampleNotif, nil
		},
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications/1", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetByID_InvalidID(t *testing.T) {
	r := setupRouter(&mockNotificationService{}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications/abc", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestGetByID_NotFound(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		getByIDFn: func(id uint) (*models.NotificationResponse, error) {
			return nil, errors.New("not found")
		},
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications/99", nil))
	assertStatus(t, http.StatusNotFound, w.Code)
}

// --- MarkAsRead ---

func TestMarkAsRead_Success(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		markAsReadFn: func(id uint) (*models.NotificationResponse, error) {
			n := sampleNotif
			n.IsRead = true
			return &n, nil
		},
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/v1/notifications/1/read", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestMarkAsRead_InvalidID(t *testing.T) {
	r := setupRouter(&mockNotificationService{}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/v1/notifications/xyz/read", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestMarkAsRead_NotFound(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		markAsReadFn: func(id uint) (*models.NotificationResponse, error) {
			return nil, errors.New("not found")
		},
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/v1/notifications/99/read", nil))
	assertStatus(t, http.StatusNotFound, w.Code)
}

// --- MarkAllAsRead ---

func TestMarkAllAsRead_Success(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		markAllReadFn: func(roleID, userID uint) error { return nil },
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/v1/notifications/read-all", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestMarkAllAsRead_ServiceError(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		markAllReadFn: func(roleID, userID uint) error { return errors.New("db error") },
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/v1/notifications/read-all", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- Delete ---

func TestDelete_Success(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		deleteFn: func(id uint) error { return nil },
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/notifications/1", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestDelete_InvalidID(t *testing.T) {
	r := setupRouter(&mockNotificationService{}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/notifications/abc", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestDelete_NotFound(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		deleteFn: func(id uint) error { return errors.New("not found") },
	}, utils.RoleAdmin)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/notifications/99", nil))
	assertStatus(t, http.StatusNotFound, w.Code)
}

func TestDelete_Forbidden_UserRole(t *testing.T) {
	r := setupRouter(&mockNotificationService{}, utils.RoleUser)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/notifications/1", nil))
	assertStatus(t, http.StatusForbidden, w.Code)
}
