package waterlog

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

type mockWaterService struct {
	getAllFn            func(deviceID *uint, statusID *uint) ([]models.WaterMeterValueResponse, error)
	getByIDFn          func(id uint) (*models.WaterMeterValueResponse, error)
	getLatestFn        func() ([]models.WaterMeterValueResponse, error)
	getPendingFn       func() ([]models.WaterMeterValueResponse, error)
	getStatusesFn      func() ([]models.StatusValueResponse, error)
	createFn           func(input models.WaterMeterValueRequest, userID uint) (*models.WaterMeterValueResponse, error)
	updateFn           func(id uint, input models.UpdateWaterMeterValueRequest) (*models.WaterMeterValueResponse, error)
	deleteFn           func(id uint) error
}

func (m *mockWaterService) GetAll(deviceID *uint, statusID *uint) ([]models.WaterMeterValueResponse, error) {
	return m.getAllFn(deviceID, statusID)
}
func (m *mockWaterService) GetByID(id uint) (*models.WaterMeterValueResponse, error) {
	return m.getByIDFn(id)
}
func (m *mockWaterService) GetLatestPerDevice() ([]models.WaterMeterValueResponse, error) {
	return m.getLatestFn()
}
func (m *mockWaterService) GetPending() ([]models.WaterMeterValueResponse, error) {
	return m.getPendingFn()
}
func (m *mockWaterService) GetStatuses() ([]models.StatusValueResponse, error) {
	return m.getStatusesFn()
}
func (m *mockWaterService) Create(input models.WaterMeterValueRequest, userID uint) (*models.WaterMeterValueResponse, error) {
	return m.createFn(input, userID)
}
func (m *mockWaterService) Update(id uint, input models.UpdateWaterMeterValueRequest) (*models.WaterMeterValueResponse, error) {
	return m.updateFn(id, input)
}
func (m *mockWaterService) Delete(id uint) error {
	return m.deleteFn(id)
}

// withUser injects a user ID into every request (simulates JWT middleware)
func setupRouter(svc *mockWaterService, userID *uint) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	if userID != nil {
		uid := *userID
		r.Use(func(c *gin.Context) {
			c.Set(utils.ContextUserIDKey, uid)
			c.Next()
		})
	}
	NewWaterLogHandler(r.Group("/api/v1"), svc)
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
	b, _ := json.Marshal(v)
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

var uid = uint(1)
var sampleValue = models.WaterMeterValueResponse{ID: 1, MeterValue: 100, DeviceID: 1}

// --- GetAll ---

func TestGetAll_NoParams(t *testing.T) {
	r := setupRouter(&mockWaterService{
		getAllFn: func(deviceID *uint, statusID *uint) ([]models.WaterMeterValueResponse, error) {
			if deviceID != nil || statusID != nil {
				t.Error("expected nil params")
			}
			return []models.WaterMeterValueResponse{sampleValue}, nil
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetAll_WithQueryParams(t *testing.T) {
	r := setupRouter(&mockWaterService{
		getAllFn: func(deviceID *uint, statusID *uint) ([]models.WaterMeterValueResponse, error) {
			if deviceID == nil || *deviceID != 2 {
				t.Errorf("expected deviceID=2, got %v", deviceID)
			}
			if statusID == nil || *statusID != 3 {
				t.Errorf("expected statusID=3, got %v", statusID)
			}
			return nil, nil
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values?device_id=2&status_id=3", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetAll_ServiceError(t *testing.T) {
	r := setupRouter(&mockWaterService{
		getAllFn: func(deviceID *uint, statusID *uint) ([]models.WaterMeterValueResponse, error) {
			return nil, errors.New("db error")
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- GetLatest ---

func TestGetLatest_Success(t *testing.T) {
	r := setupRouter(&mockWaterService{
		getLatestFn: func() ([]models.WaterMeterValueResponse, error) {
			return []models.WaterMeterValueResponse{sampleValue}, nil
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values/latest", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetLatest_ServiceError(t *testing.T) {
	r := setupRouter(&mockWaterService{
		getLatestFn: func() ([]models.WaterMeterValueResponse, error) {
			return nil, errors.New("db error")
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values/latest", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- GetPending ---

func TestGetPending_Success(t *testing.T) {
	r := setupRouter(&mockWaterService{
		getPendingFn: func() ([]models.WaterMeterValueResponse, error) {
			return []models.WaterMeterValueResponse{sampleValue}, nil
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values/pending", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetPending_ServiceError(t *testing.T) {
	r := setupRouter(&mockWaterService{
		getPendingFn: func() ([]models.WaterMeterValueResponse, error) {
			return nil, errors.New("db error")
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values/pending", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- GetStatuses ---

func TestGetStatuses_Success(t *testing.T) {
	r := setupRouter(&mockWaterService{
		getStatusesFn: func() ([]models.StatusValueResponse, error) {
			return []models.StatusValueResponse{{ID: 1, StatusValue: "รอ"}}, nil
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values/statuses", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetStatuses_ServiceError(t *testing.T) {
	r := setupRouter(&mockWaterService{
		getStatusesFn: func() ([]models.StatusValueResponse, error) {
			return nil, errors.New("db error")
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values/statuses", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- GetByID ---

func TestGetByID_Success(t *testing.T) {
	r := setupRouter(&mockWaterService{
		getByIDFn: func(id uint) (*models.WaterMeterValueResponse, error) {
			return &sampleValue, nil
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values/1", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetByID_InvalidID(t *testing.T) {
	r := setupRouter(&mockWaterService{}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values/abc", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestGetByID_NotFound(t *testing.T) {
	r := setupRouter(&mockWaterService{
		getByIDFn: func(id uint) (*models.WaterMeterValueResponse, error) {
			return nil, errors.New("not found")
		},
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/water-values/99", nil))
	assertStatus(t, http.StatusNotFound, w.Code)
}

// --- Create ---

func TestCreate_MissingUserID(t *testing.T) {
	r := setupRouter(&mockWaterService{}, nil) // no userID middleware
	body := jsonBody(t, models.WaterMeterValueRequest{MeterValue: 100, DeviceID: 1})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/water-values", body))
	assertStatus(t, http.StatusUnauthorized, w.Code)
}

func TestCreate_InvalidJSON(t *testing.T) {
	r := setupRouter(&mockWaterService{}, &uid)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/water-values", bytes.NewBufferString("{bad}")))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestCreate_ValidationError(t *testing.T) {
	r := setupRouter(&mockWaterService{}, &uid)
	// meter_value=0 (zero → fails required) and device_id missing
	body := jsonBody(t, map[string]any{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/water-values", body))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestCreate_Success(t *testing.T) {
	r := setupRouter(&mockWaterService{
		createFn: func(input models.WaterMeterValueRequest, userID uint) (*models.WaterMeterValueResponse, error) {
			return &sampleValue, nil
		},
	}, &uid)
	body := jsonBody(t, models.WaterMeterValueRequest{MeterValue: 100, DeviceID: 1})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/water-values", body))
	assertStatus(t, http.StatusCreated, w.Code)
}

func TestCreate_ServiceError(t *testing.T) {
	r := setupRouter(&mockWaterService{
		createFn: func(input models.WaterMeterValueRequest, userID uint) (*models.WaterMeterValueResponse, error) {
			return nil, errors.New("insert failed")
		},
	}, &uid)
	body := jsonBody(t, models.WaterMeterValueRequest{MeterValue: 100, DeviceID: 1})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/water-values", body))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- Update ---

func TestUpdate_InvalidID(t *testing.T) {
	r := setupRouter(&mockWaterService{}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/water-values/xyz", bytes.NewBufferString("{}")))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestUpdate_InvalidJSON(t *testing.T) {
	r := setupRouter(&mockWaterService{}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/water-values/1", bytes.NewBufferString("{bad}")))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestUpdate_Success(t *testing.T) {
	r := setupRouter(&mockWaterService{
		updateFn: func(id uint, input models.UpdateWaterMeterValueRequest) (*models.WaterMeterValueResponse, error) {
			return &sampleValue, nil
		},
	}, nil)
	body := jsonBody(t, models.UpdateWaterMeterValueRequest{StatusID: 2})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/water-values/1", body))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestUpdate_ServiceError(t *testing.T) {
	r := setupRouter(&mockWaterService{
		updateFn: func(id uint, input models.UpdateWaterMeterValueRequest) (*models.WaterMeterValueResponse, error) {
			return nil, errors.New("update failed")
		},
	}, nil)
	body := jsonBody(t, models.UpdateWaterMeterValueRequest{StatusID: 2})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/water-values/1", body))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

// --- Delete ---

func TestDelete_Success(t *testing.T) {
	r := setupRouter(&mockWaterService{
		deleteFn: func(id uint) error { return nil },
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/water-values/1", nil))
	assertStatus(t, http.StatusNoContent, w.Code)
}

func TestDelete_InvalidID(t *testing.T) {
	r := setupRouter(&mockWaterService{}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/water-values/abc", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestDelete_ServiceError(t *testing.T) {
	r := setupRouter(&mockWaterService{
		deleteFn: func(id uint) error { return errors.New("delete failed") },
	}, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/water-values/1", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}
