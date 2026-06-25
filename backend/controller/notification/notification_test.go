package notification

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config/models"
)

type mockNotificationService struct {
	getAllFn       func() ([]models.NotificationResponse, error)
	getByIDFn     func(id uint) (*models.NotificationResponse, error)
	markAsReadFn  func(id uint) (*models.NotificationResponse, error)
	markAllReadFn func() error
	deleteFn      func(id uint) error
	getStatsFn    func() (*models.NotificationStatsResponse, error)
}

func (m *mockNotificationService) GetAll() ([]models.NotificationResponse, error) {
	return m.getAllFn()
}
func (m *mockNotificationService) GetByID(id uint) (*models.NotificationResponse, error) {
	return m.getByIDFn(id)
}
func (m *mockNotificationService) MarkAsRead(id uint) (*models.NotificationResponse, error) {
	return m.markAsReadFn(id)
}
func (m *mockNotificationService) MarkAllAsRead() error {
	return m.markAllReadFn()
}
func (m *mockNotificationService) Delete(id uint) error {
	return m.deleteFn(id)
}
func (m *mockNotificationService) GetStats() (*models.NotificationStatsResponse, error) {
	return m.getStatsFn()
}

func setupRouter(svc *mockNotificationService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
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
		getAllFn: func() ([]models.NotificationResponse, error) {
			return []models.NotificationResponse{sampleNotif}, nil
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetAll_ServiceError(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		getAllFn: func() ([]models.NotificationResponse, error) {
			return nil, errors.New("db error")
		},
	})
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
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications/stats", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetStats_ServiceError(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		getStatsFn: func() (*models.NotificationStatsResponse, error) {
			return nil, errors.New("db error")
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications/stats", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- GetByID ---

func TestGetByID_Success(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		getByIDFn: func(id uint) (*models.NotificationResponse, error) {
			return &sampleNotif, nil
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications/1", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetByID_InvalidID(t *testing.T) {
	r := setupRouter(&mockNotificationService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/notifications/abc", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestGetByID_NotFound(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		getByIDFn: func(id uint) (*models.NotificationResponse, error) {
			return nil, errors.New("not found")
		},
	})
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
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/v1/notifications/1/read", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestMarkAsRead_InvalidID(t *testing.T) {
	r := setupRouter(&mockNotificationService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/v1/notifications/xyz/read", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestMarkAsRead_NotFound(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		markAsReadFn: func(id uint) (*models.NotificationResponse, error) {
			return nil, errors.New("not found")
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/v1/notifications/99/read", nil))
	assertStatus(t, http.StatusNotFound, w.Code)
}

// --- MarkAllAsRead ---

func TestMarkAllAsRead_Success(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		markAllReadFn: func() error { return nil },
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/v1/notifications/read-all", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestMarkAllAsRead_ServiceError(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		markAllReadFn: func() error { return errors.New("db error") },
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/v1/notifications/read-all", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- Delete ---

func TestDelete_Success(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		deleteFn: func(id uint) error { return nil },
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/notifications/1", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestDelete_InvalidID(t *testing.T) {
	r := setupRouter(&mockNotificationService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/notifications/abc", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestDelete_NotFound(t *testing.T) {
	r := setupRouter(&mockNotificationService{
		deleteFn: func(id uint) error { return errors.New("not found") },
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/notifications/99", nil))
	assertStatus(t, http.StatusNotFound, w.Code)
}
