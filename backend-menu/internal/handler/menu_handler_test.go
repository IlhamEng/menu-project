package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend-menu/internal/model"
	"backend-menu/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mock Service

type MockMenuService struct {
	mock.Mock
}

func (m *MockMenuService) GetAllMenus(ctx context.Context) ([]*model.MenuResponse, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.MenuResponse), args.Error(1)
}

func (m *MockMenuService) GetMenuByID(ctx context.Context, id uint64) (*model.MenuResponse, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.MenuResponse), args.Error(1)
}

func (m *MockMenuService) CreateMenu(ctx context.Context, req *model.CreateMenuRequest) (*model.MenuResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.MenuResponse), args.Error(1)
}

func (m *MockMenuService) UpdateMenu(ctx context.Context, id uint64, req *model.UpdateMenuRequest) (*model.MenuResponse, error) {
	args := m.Called(ctx, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.MenuResponse), args.Error(1)
}

func (m *MockMenuService) DeleteMenu(ctx context.Context, id uint64) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockMenuService) MoveMenu(ctx context.Context, id uint64, req *model.MoveMenuRequest) (*model.MenuResponse, error) {
	args := m.Called(ctx, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.MenuResponse), args.Error(1)
}

func (m *MockMenuService) ReorderMenu(ctx context.Context, id uint64, req *model.ReorderMenuRequest) (*model.MenuResponse, error) {
	args := m.Called(ctx, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.MenuResponse), args.Error(1)
}

// Helpers

func setupRouter(h *MenuHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	api := r.Group("/api")
	{
		menus := api.Group("/menus")
		{
			menus.GET("", h.GetAllMenus)
			menus.GET("/:id", h.GetMenuByID)
			menus.POST("", h.CreateMenu)
			menus.PUT("/:id", h.UpdateMenu)
			menus.DELETE("/:id", h.DeleteMenu)
			menus.PATCH("/:id/move", h.MoveMenu)
			menus.PATCH("/:id/reorder", h.ReorderMenu)
		}
	}
	return r
}

// Tests

func TestGetAllMenus_Handler_Success(t *testing.T) {
	mockSvc := new(MockMenuService)
	h := NewMenuHandler(mockSvc)
	r := setupRouter(h)

	menus := []*model.MenuResponse{
		{ID: 1, Name: "Menu 1", Children: make([]*model.MenuResponse, 0)},
	}
	mockSvc.On("GetAllMenus", mock.Anything).Return(menus, nil)

	req, _ := http.NewRequest("GET", "/api/menus", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp model.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.True(t, resp.Success)
	mockSvc.AssertExpectations(t)
}

func TestGetMenuByID_Handler_InvalidID(t *testing.T) {
	mockSvc := new(MockMenuService)
	h := NewMenuHandler(mockSvc)
	r := setupRouter(h)

	req, _ := http.NewRequest("GET", "/api/menus/abc", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestGetMenuByID_Handler_NotFound(t *testing.T) {
	mockSvc := new(MockMenuService)
	h := NewMenuHandler(mockSvc)
	r := setupRouter(h)

	mockSvc.On("GetMenuByID", mock.Anything, uint64(999)).Return(nil, service.ErrMenuNotFound)

	req, _ := http.NewRequest("GET", "/api/menus/999", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockSvc.AssertExpectations(t)
}

func TestCreateMenu_Handler_Success(t *testing.T) {
	mockSvc := new(MockMenuService)
	h := NewMenuHandler(mockSvc)
	r := setupRouter(h)

	created := &model.MenuResponse{ID: 1, Name: "New Menu", Children: make([]*model.MenuResponse, 0)}
	mockSvc.On("CreateMenu", mock.Anything, mock.AnythingOfType("*model.CreateMenuRequest")).Return(created, nil)

	body := `{"name": "New Menu"}`
	req, _ := http.NewRequest("POST", "/api/menus", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockSvc.AssertExpectations(t)
}

func TestCreateMenu_Handler_ValidationError(t *testing.T) {
	mockSvc := new(MockMenuService)
	h := NewMenuHandler(mockSvc)
	r := setupRouter(h)

	body := `{"name": ""}`
	req, _ := http.NewRequest("POST", "/api/menus", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateMenu_Handler_InvalidJSON(t *testing.T) {
	mockSvc := new(MockMenuService)
	h := NewMenuHandler(mockSvc)
	r := setupRouter(h)

	body := `{invalid json`
	req, _ := http.NewRequest("POST", "/api/menus", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestDeleteMenu_Handler_Success(t *testing.T) {
	mockSvc := new(MockMenuService)
	h := NewMenuHandler(mockSvc)
	r := setupRouter(h)

	mockSvc.On("DeleteMenu", mock.Anything, uint64(1)).Return(nil)

	req, _ := http.NewRequest("DELETE", "/api/menus/1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockSvc.AssertExpectations(t)
}

func TestDeleteMenu_Handler_NotFound(t *testing.T) {
	mockSvc := new(MockMenuService)
	h := NewMenuHandler(mockSvc)
	r := setupRouter(h)

	mockSvc.On("DeleteMenu", mock.Anything, uint64(999)).Return(service.ErrMenuNotFound)

	req, _ := http.NewRequest("DELETE", "/api/menus/999", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockSvc.AssertExpectations(t)
}

func TestMoveMenu_Handler_InvalidBody(t *testing.T) {
	mockSvc := new(MockMenuService)
	h := NewMenuHandler(mockSvc)
	r := setupRouter(h)

	body := `{invalid`
	req, _ := http.NewRequest("PATCH", "/api/menus/1/move", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestReorderMenu_Handler_Success(t *testing.T) {
	mockSvc := new(MockMenuService)
	h := NewMenuHandler(mockSvc)
	r := setupRouter(h)

	reordered := &model.MenuResponse{ID: 1, Name: "Menu", SortOrder: 2, Children: make([]*model.MenuResponse, 0)}
	mockSvc.On("ReorderMenu", mock.Anything, uint64(1), mock.AnythingOfType("*model.ReorderMenuRequest")).Return(reordered, nil)

	body := `{"sort_order": 2}`
	req, _ := http.NewRequest("PATCH", "/api/menus/1/reorder", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockSvc.AssertExpectations(t)
}
