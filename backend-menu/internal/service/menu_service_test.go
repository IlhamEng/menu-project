package service

import (
	"context"
	"database/sql"
	"testing"

	"backend-menu/internal/model"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mock Repository

type MockMenuRepository struct {
	mock.Mock
}

func (m *MockMenuRepository) GetAll(ctx context.Context) ([]*model.Menu, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.Menu), args.Error(1)
}

func (m *MockMenuRepository) GetByID(ctx context.Context, id uint64) (*model.Menu, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Menu), args.Error(1)
}

func (m *MockMenuRepository) Create(ctx context.Context, req *model.CreateMenuRequest) (*model.Menu, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Menu), args.Error(1)
}

func (m *MockMenuRepository) Update(ctx context.Context, id uint64, req *model.UpdateMenuRequest) (*model.Menu, error) {
	args := m.Called(ctx, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Menu), args.Error(1)
}

func (m *MockMenuRepository) Delete(ctx context.Context, id uint64) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockMenuRepository) Move(ctx context.Context, id uint64, parentID *uint64) (*model.Menu, error) {
	args := m.Called(ctx, id, parentID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Menu), args.Error(1)
}

func (m *MockMenuRepository) Reorder(ctx context.Context, id uint64, newSortOrder int) (*model.Menu, error) {
	args := m.Called(ctx, id, newSortOrder)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Menu), args.Error(1)
}

func (m *MockMenuRepository) GetChildren(ctx context.Context, parentID *uint64) ([]*model.Menu, error) {
	args := m.Called(ctx, parentID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.Menu), args.Error(1)
}

func (m *MockMenuRepository) GetMaxSortOrder(ctx context.Context, parentID *uint64) (int, error) {
	args := m.Called(ctx, parentID)
	return args.Int(0), args.Error(1)
}

func (m *MockMenuRepository) IsDescendant(ctx context.Context, ancestorID, descendantID uint64) (bool, error) {
	args := m.Called(ctx, ancestorID, descendantID)
	return args.Bool(0), args.Error(1)
}

// Tests

func TestGetAllMenus_EmptyList(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	mockRepo.On("GetAll", ctx).Return([]*model.Menu{}, nil)

	result, err := svc.GetAllMenus(ctx)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result, 0)
	mockRepo.AssertExpectations(t)
}

func TestGetAllMenus_BuildsTree(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	parentID := sql.NullInt64{Int64: 1, Valid: true}
	menus := []*model.Menu{
		{ID: 1, Name: "Root", SortOrder: 0},
		{ID: 2, Name: "Child 1", ParentID: parentID, SortOrder: 0},
		{ID: 3, Name: "Child 2", ParentID: parentID, SortOrder: 1},
	}

	mockRepo.On("GetAll", ctx).Return(menus, nil)

	result, err := svc.GetAllMenus(ctx)

	assert.NoError(t, err)
	assert.Len(t, result, 1) // Only root at top level
	assert.Equal(t, "Root", result[0].Name)
	assert.Len(t, result[0].Children, 2)
	assert.Equal(t, "Child 1", result[0].Children[0].Name)
	assert.Equal(t, "Child 2", result[0].Children[1].Name)
	mockRepo.AssertExpectations(t)
}

func TestGetMenuByID_NotFound(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	mockRepo.On("GetByID", ctx, uint64(999)).Return(nil, nil)

	result, err := svc.GetMenuByID(ctx, 999)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, ErrMenuNotFound)
	mockRepo.AssertExpectations(t)
}

func TestGetMenuByID_Found(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	menu := &model.Menu{ID: 1, Name: "Test Menu", SortOrder: 0}
	mockRepo.On("GetByID", ctx, uint64(1)).Return(menu, nil)
	mockRepo.On("GetAll", ctx).Return([]*model.Menu{menu}, nil)

	result, err := svc.GetMenuByID(ctx, 1)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Test Menu", result.Name)
	mockRepo.AssertExpectations(t)
}

func TestCreateMenu_Success(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	req := &model.CreateMenuRequest{Name: "New Menu"}
	created := &model.Menu{ID: 1, Name: "New Menu", SortOrder: 0}

	mockRepo.On("Create", ctx, req).Return(created, nil)

	result, err := svc.CreateMenu(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "New Menu", result.Name)
	mockRepo.AssertExpectations(t)
}

func TestCreateMenu_ParentNotFound(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	parentID := uint64(999)
	req := &model.CreateMenuRequest{Name: "Child", ParentID: &parentID}

	mockRepo.On("GetByID", ctx, uint64(999)).Return(nil, nil)

	result, err := svc.CreateMenu(ctx, req)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, ErrParentNotFound)
	mockRepo.AssertExpectations(t)
}

func TestDeleteMenu_NotFound(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	mockRepo.On("GetByID", ctx, uint64(999)).Return(nil, nil)

	err := svc.DeleteMenu(ctx, 999)

	assert.Error(t, err)
	assert.ErrorIs(t, err, ErrMenuNotFound)
	mockRepo.AssertExpectations(t)
}

func TestDeleteMenu_Success(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	menu := &model.Menu{ID: 1, Name: "Test"}
	mockRepo.On("GetByID", ctx, uint64(1)).Return(menu, nil)
	mockRepo.On("Delete", ctx, uint64(1)).Return(nil)

	err := svc.DeleteMenu(ctx, 1)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestMoveMenu_SelfParent(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	menu := &model.Menu{ID: 1, Name: "Test"}
	selfID := uint64(1)
	req := &model.MoveMenuRequest{ParentID: &selfID}

	mockRepo.On("GetByID", ctx, uint64(1)).Return(menu, nil)

	result, err := svc.MoveMenu(ctx, 1, req)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, ErrSelfParent)
	mockRepo.AssertExpectations(t)
}

func TestMoveMenu_CircularReference(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	parent := &model.Menu{ID: 1, Name: "Parent"}
	child := &model.Menu{ID: 2, Name: "Child", ParentID: sql.NullInt64{Int64: 1, Valid: true}}
	childID := uint64(2)
	req := &model.MoveMenuRequest{ParentID: &childID}

	mockRepo.On("GetByID", ctx, uint64(1)).Return(parent, nil)
	mockRepo.On("GetByID", ctx, uint64(2)).Return(child, nil)
	mockRepo.On("IsDescendant", ctx, uint64(1), uint64(2)).Return(true, nil)

	result, err := svc.MoveMenu(ctx, 1, req)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, ErrCircularRef)
	mockRepo.AssertExpectations(t)
}

func TestMoveMenu_Success(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	menu := &model.Menu{ID: 1, Name: "Item"}
	newParent := &model.Menu{ID: 5, Name: "New Parent"}
	moved := &model.Menu{ID: 1, Name: "Item", ParentID: sql.NullInt64{Int64: 5, Valid: true}}
	newParentID := uint64(5)
	req := &model.MoveMenuRequest{ParentID: &newParentID}

	mockRepo.On("GetByID", ctx, uint64(1)).Return(menu, nil)
	mockRepo.On("GetByID", ctx, uint64(5)).Return(newParent, nil)
	mockRepo.On("IsDescendant", ctx, uint64(1), uint64(5)).Return(false, nil)
	mockRepo.On("Move", ctx, uint64(1), &newParentID).Return(moved, nil)

	result, err := svc.MoveMenu(ctx, 1, req)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, uint64(5), *result.ParentID)
	mockRepo.AssertExpectations(t)
}

func TestReorderMenu_InvalidSortOrder(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	menu := &model.Menu{ID: 1, Name: "Test", SortOrder: 0}
	req := &model.ReorderMenuRequest{SortOrder: 10}

	mockRepo.On("GetByID", ctx, uint64(1)).Return(menu, nil)
	// No parentID, so pass nil
	var nilPtr *uint64
	mockRepo.On("GetMaxSortOrder", ctx, nilPtr).Return(2, nil)

	result, err := svc.ReorderMenu(ctx, 1, req)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, ErrInvalidSortOrder)
	mockRepo.AssertExpectations(t)
}

func TestReorderMenu_Success(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	svc := NewMenuService(mockRepo)
	ctx := context.Background()

	menu := &model.Menu{ID: 1, Name: "Test", SortOrder: 0}
	reordered := &model.Menu{ID: 1, Name: "Test", SortOrder: 2}
	req := &model.ReorderMenuRequest{SortOrder: 2}

	mockRepo.On("GetByID", ctx, uint64(1)).Return(menu, nil)
	var nilPtr *uint64
	mockRepo.On("GetMaxSortOrder", ctx, nilPtr).Return(3, nil)
	mockRepo.On("Reorder", ctx, uint64(1), 2).Return(reordered, nil)

	result, err := svc.ReorderMenu(ctx, 1, req)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 2, result.SortOrder)
	mockRepo.AssertExpectations(t)
}

func TestBuildTree_NestedStructure(t *testing.T) {
	menus := []*model.Menu{
		{ID: 1, Name: "Root 1", SortOrder: 0},
		{ID: 2, Name: "Root 2", SortOrder: 1},
		{ID: 3, Name: "Child 1.1", ParentID: sql.NullInt64{Int64: 1, Valid: true}, SortOrder: 0},
		{ID: 4, Name: "Child 1.2", ParentID: sql.NullInt64{Int64: 1, Valid: true}, SortOrder: 1},
		{ID: 5, Name: "Grandchild 1.1.1", ParentID: sql.NullInt64{Int64: 3, Valid: true}, SortOrder: 0},
	}

	tree := buildTree(menus)

	assert.Len(t, tree, 2)
	assert.Equal(t, "Root 1", tree[0].Name)
	assert.Len(t, tree[0].Children, 2)
	assert.Equal(t, "Grandchild 1.1.1", tree[0].Children[0].Children[0].Name)
	assert.Equal(t, "Root 2", tree[1].Name)
	assert.Len(t, tree[1].Children, 0)
}
