package meter

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

// mockLocationService implements services.LocationService via structural typing
type mockLocationService struct {
	getAllFn   func() ([]models.LocationResponse, error)
	getByIDFn func(id uint) (*models.LocationResponse, error)
	createFn  func(input models.LocationRequest) (*models.LocationResponse, error)
	updateFn  func(id uint, input models.LocationRequest) (*models.LocationResponse, error)
	deleteFn  func(id uint) error
}

func (m *mockLocationService) GetAll() ([]models.LocationResponse, error) {
	return m.getAllFn()
}
func (m *mockLocationService) GetByID(id uint) (*models.LocationResponse, error) {
	return m.getByIDFn(id)
}
func (m *mockLocationService) Create(input models.LocationRequest) (*models.LocationResponse, error) {
	return m.createFn(input)
}
func (m *mockLocationService) Update(id uint, input models.LocationRequest) (*models.LocationResponse, error) {
	return m.updateFn(id, input)
}
func (m *mockLocationService) Delete(id uint) error {
	return m.deleteFn(id)
}

func setupRouter(svc *mockLocationService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(utils.ContextUserIDKey, uint(1))
		c.Set(utils.ContextRoleIDKey, uint(1)) // Admin
		c.Next()
	})
	NewMeterHandler(r.Group("/api/v1"), svc)
	return r
}

func assertStatus(t *testing.T, want, got int) {
	t.Helper()
	if want != got {
		t.Errorf("status: want %d, got %d", want, got)
	}
}

func assertSuccess(t *testing.T, body []byte, wantTrue bool) {
	t.Helper()
	var resp map[string]interface{}
	if err := json.Unmarshal(body, &resp); err != nil {
		t.Fatalf("unmarshal body: %v", err)
	}
	got, _ := resp["success"].(bool)
	if got != wantTrue {
		t.Errorf("success field: want %v, got %v — body: %s", wantTrue, got, body)
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

var sampleLocation = models.LocationResponse{
	ID:           1,
	BuildingName: "อาคาร A",
	Latitude:     13.7563,
	Longitude:    100.5018,
}

// --- GetAll ---

func TestGetAll_Success(t *testing.T) {
	r := setupRouter(&mockLocationService{
		getAllFn: func() ([]models.LocationResponse, error) {
			return []models.LocationResponse{sampleLocation}, nil
		},
	})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/meters", nil))

	assertStatus(t, http.StatusOK, w.Code)
	assertSuccess(t, w.Body.Bytes(), true)
}

func TestGetAll_ServiceError(t *testing.T) {
	r := setupRouter(&mockLocationService{
		getAllFn: func() ([]models.LocationResponse, error) {
			return nil, errors.New("db error")
		},
	})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/meters", nil))

	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- GetByID ---

func TestGetByID_Success(t *testing.T) {
	r := setupRouter(&mockLocationService{
		getByIDFn: func(id uint) (*models.LocationResponse, error) {
			return &sampleLocation, nil
		},
	})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/meters/1", nil))

	assertStatus(t, http.StatusOK, w.Code)
	assertSuccess(t, w.Body.Bytes(), true)
}

func TestGetByID_InvalidID(t *testing.T) {
	r := setupRouter(&mockLocationService{})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/meters/abc", nil))

	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestGetByID_NotFound(t *testing.T) {
	r := setupRouter(&mockLocationService{
		getByIDFn: func(id uint) (*models.LocationResponse, error) {
			return nil, errors.New("not found")
		},
	})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/meters/99", nil))

	assertStatus(t, http.StatusNotFound, w.Code)
}

// --- Create ---

func TestCreate_Success(t *testing.T) {
	r := setupRouter(&mockLocationService{
		createFn: func(input models.LocationRequest) (*models.LocationResponse, error) {
			return &sampleLocation, nil
		},
	})

	body := jsonBody(t, models.LocationRequest{
		BuildingName: "อาคาร B",
		Latitude:     13.0,
		Longitude:    100.0,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/meters", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assertStatus(t, http.StatusCreated, w.Code)
	assertSuccess(t, w.Body.Bytes(), true)
}

func TestCreate_InvalidJSON(t *testing.T) {
	r := setupRouter(&mockLocationService{})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/meters", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestCreate_ValidationError(t *testing.T) {
	r := setupRouter(&mockLocationService{})

	// building_name missing, latitude/longitude are zero (fail required)
	body := jsonBody(t, map[string]any{})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/meters", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestCreate_ServiceError(t *testing.T) {
	r := setupRouter(&mockLocationService{
		createFn: func(input models.LocationRequest) (*models.LocationResponse, error) {
			return nil, errors.New("insert failed")
		},
	})

	body := jsonBody(t, models.LocationRequest{
		BuildingName: "อาคาร C",
		Latitude:     13.0,
		Longitude:    100.0,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/meters", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- Update ---

func TestUpdate_Success(t *testing.T) {
	r := setupRouter(&mockLocationService{
		updateFn: func(id uint, input models.LocationRequest) (*models.LocationResponse, error) {
			return &sampleLocation, nil
		},
	})

	body := jsonBody(t, models.LocationRequest{
		BuildingName: "อาคาร A2",
		Latitude:     14.0,
		Longitude:    101.0,
	})
	req := httptest.NewRequest(http.MethodPut, "/api/v1/meters/1", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assertStatus(t, http.StatusOK, w.Code)
	assertSuccess(t, w.Body.Bytes(), true)
}

func TestUpdate_InvalidID(t *testing.T) {
	r := setupRouter(&mockLocationService{})

	req := httptest.NewRequest(http.MethodPut, "/api/v1/meters/xyz", bytes.NewBufferString("{}"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestUpdate_InvalidJSON(t *testing.T) {
	r := setupRouter(&mockLocationService{})

	req := httptest.NewRequest(http.MethodPut, "/api/v1/meters/1", bytes.NewBufferString("{bad}"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestUpdate_ValidationError(t *testing.T) {
	r := setupRouter(&mockLocationService{})

	body := jsonBody(t, map[string]any{})
	req := httptest.NewRequest(http.MethodPut, "/api/v1/meters/1", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestUpdate_ServiceError(t *testing.T) {
	r := setupRouter(&mockLocationService{
		updateFn: func(id uint, input models.LocationRequest) (*models.LocationResponse, error) {
			return nil, errors.New("update failed")
		},
	})

	body := jsonBody(t, models.LocationRequest{
		BuildingName: "อาคาร A",
		Latitude:     13.0,
		Longitude:    100.0,
	})
	req := httptest.NewRequest(http.MethodPut, "/api/v1/meters/1", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assertStatus(t, http.StatusBadRequest, w.Code)
}

// --- Delete ---

func TestDelete_Success(t *testing.T) {
	r := setupRouter(&mockLocationService{
		deleteFn: func(id uint) error { return nil },
	})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/meters/1", nil))

	assertStatus(t, http.StatusNoContent, w.Code)
}

func TestDelete_InvalidID(t *testing.T) {
	r := setupRouter(&mockLocationService{})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/meters/abc", nil))

	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestDelete_ServiceError(t *testing.T) {
	r := setupRouter(&mockLocationService{
		deleteFn: func(id uint) error { return errors.New("delete failed") },
	})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/meters/1", nil))

	assertStatus(t, http.StatusBadRequest, w.Code)
}
