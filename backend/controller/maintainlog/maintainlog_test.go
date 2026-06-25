package maintainlog

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

type mockMaintainLogService struct {
	getAllFn       func() ([]models.MaintainLogResponse, error)
	getByIDFn     func(id uint) (*models.MaintainLogResponse, error)
	createFn      func(input models.MaintainLogRequest) (*models.MaintainLogResponse, error)
	updateFn      func(id uint, input models.UpdateMaintainLogRequest) (*models.MaintainLogResponse, error)
	deleteFn      func(id uint) error
	getStatusesFn func() ([]models.StatusLogResponse, error)
}

func (m *mockMaintainLogService) GetAll() ([]models.MaintainLogResponse, error) {
	return m.getAllFn()
}
func (m *mockMaintainLogService) GetByID(id uint) (*models.MaintainLogResponse, error) {
	return m.getByIDFn(id)
}
func (m *mockMaintainLogService) Create(input models.MaintainLogRequest) (*models.MaintainLogResponse, error) {
	return m.createFn(input)
}
func (m *mockMaintainLogService) Update(id uint, input models.UpdateMaintainLogRequest) (*models.MaintainLogResponse, error) {
	return m.updateFn(id, input)
}
func (m *mockMaintainLogService) Delete(id uint) error {
	return m.deleteFn(id)
}
func (m *mockMaintainLogService) GetStatuses() ([]models.StatusLogResponse, error) {
	return m.getStatusesFn()
}

func setupRouter(svc *mockMaintainLogService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	NewMaintainLogHandler(r.Group("/api/v1"), svc)
	return r
}

func assertStatus(t *testing.T, want, got int) {
	t.Helper()
	if want != got {
		t.Errorf("status: want %d, got %d", want, got)
	}
}

func jsonBody(t *testing.T, v any) *bytes.Buffer {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	return bytes.NewBuffer(b)
}

func jsonReq(t *testing.T, method, url string, body *bytes.Buffer) *http.Request {
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

var sampleLog = models.MaintainLogResponse{
	ID:           1,
	Title:        "ซ่อมท่อรั่ว",
	LocationText: "ชั้น 3 อาคาร A",
}

// --- GetAll ---

func TestGetAll_Success(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		getAllFn: func() ([]models.MaintainLogResponse, error) {
			return []models.MaintainLogResponse{sampleLog}, nil
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/maintain-logs", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetAll_ServiceError(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		getAllFn: func() ([]models.MaintainLogResponse, error) {
			return nil, errors.New("db error")
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/maintain-logs", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- GetStatuses ---

func TestGetStatuses_Success(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		getStatusesFn: func() ([]models.StatusLogResponse, error) {
			return []models.StatusLogResponse{{ID: 1, StatusLog: "รอดำเนินการ"}}, nil
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/maintain-logs/statuses", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetStatuses_ServiceError(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		getStatusesFn: func() ([]models.StatusLogResponse, error) {
			return nil, errors.New("db error")
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/maintain-logs/statuses", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- GetByID ---

func TestGetByID_Success(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		getByIDFn: func(id uint) (*models.MaintainLogResponse, error) {
			return &sampleLog, nil
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/maintain-logs/1", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetByID_InvalidID(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/maintain-logs/abc", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestGetByID_NotFound(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		getByIDFn: func(id uint) (*models.MaintainLogResponse, error) {
			return nil, errors.New("not found")
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/maintain-logs/99", nil))
	assertStatus(t, http.StatusNotFound, w.Code)
}

// --- Create ---

func TestCreate_Success(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		createFn: func(input models.MaintainLogRequest) (*models.MaintainLogResponse, error) {
			return &sampleLog, nil
		},
	})
	body := jsonBody(t, models.MaintainLogRequest{
		Title:        "ซ่อมท่อ",
		LocationText: "ชั้น 1",
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/maintain-logs", body))
	assertStatus(t, http.StatusCreated, w.Code)
}

func TestCreate_InvalidJSON(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/maintain-logs", bytes.NewBufferString("{bad}")))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestCreate_ValidationError(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{})
	// title และ location_text เป็น required — ส่งแค่ empty object
	body := jsonBody(t, map[string]any{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/maintain-logs", body))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestCreate_ServiceError(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		createFn: func(input models.MaintainLogRequest) (*models.MaintainLogResponse, error) {
			return nil, errors.New("insert failed")
		},
	})
	body := jsonBody(t, models.MaintainLogRequest{
		Title:        "ซ่อมท่อ",
		LocationText: "ชั้น 1",
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/maintain-logs", body))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- Update ---

func TestUpdate_Success(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		updateFn: func(id uint, input models.UpdateMaintainLogRequest) (*models.MaintainLogResponse, error) {
			return &sampleLog, nil
		},
	})
	body := jsonBody(t, models.UpdateMaintainLogRequest{Title: "ซ่อมท่อ (แก้ไข)"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/maintain-logs/1", body))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestUpdate_InvalidID(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/maintain-logs/xyz", bytes.NewBufferString("{}")))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestUpdate_InvalidJSON(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/maintain-logs/1", bytes.NewBufferString("{bad}")))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestUpdate_ServiceError(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		updateFn: func(id uint, input models.UpdateMaintainLogRequest) (*models.MaintainLogResponse, error) {
			return nil, errors.New("update failed")
		},
	})
	body := jsonBody(t, models.UpdateMaintainLogRequest{Title: "แก้ไข"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/maintain-logs/1", body))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

// --- Delete ---

func TestDelete_Success(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		deleteFn: func(id uint) error { return nil },
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/maintain-logs/1", nil))
	assertStatus(t, http.StatusNoContent, w.Code)
}

func TestDelete_InvalidID(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/maintain-logs/abc", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestDelete_ServiceError(t *testing.T) {
	r := setupRouter(&mockMaintainLogService{
		deleteFn: func(id uint) error { return errors.New("delete failed") },
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/maintain-logs/1", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}
