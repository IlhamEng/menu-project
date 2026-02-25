package service

import (
	"context"
	"errors"
	"fmt"

	"backend-menu/internal/model"
	"backend-menu/internal/repository"
)

// Custom errors for the service layer.
var (
	ErrMenuNotFound     = errors.New("menu not found")
	ErrCircularRef      = errors.New("cannot move menu item under its own descendant")
	ErrInvalidSortOrder = errors.New("sort_order is out of valid range")
	ErrSelfParent       = errors.New("cannot set menu item as its own parent")
	ErrParentNotFound   = errors.New("parent menu not found")
)

// MenuService defines the interface for menu business logic.
type MenuService interface {
	GetAllMenus(ctx context.Context) ([]*model.MenuResponse, error)
	GetMenuByID(ctx context.Context, id uint64) (*model.MenuResponse, error)
	CreateMenu(ctx context.Context, req *model.CreateMenuRequest) (*model.MenuResponse, error)
	UpdateMenu(ctx context.Context, id uint64, req *model.UpdateMenuRequest) (*model.MenuResponse, error)
	DeleteMenu(ctx context.Context, id uint64) error
	MoveMenu(ctx context.Context, id uint64, req *model.MoveMenuRequest) (*model.MenuResponse, error)
	ReorderMenu(ctx context.Context, id uint64, req *model.ReorderMenuRequest) (*model.MenuResponse, error)
}

type menuService struct {
	repo repository.MenuRepository
}

// NewMenuService creates a new MenuService.
func NewMenuService(repo repository.MenuRepository) MenuService {
	return &menuService{repo: repo}
}

func (s *menuService) GetAllMenus(ctx context.Context) ([]*model.MenuResponse, error) {
	menus, err := s.repo.GetAll(ctx)
	if err != nil {
		return nil, err
	}
	return buildTree(menus), nil
}

func (s *menuService) GetMenuByID(ctx context.Context, id uint64) (*model.MenuResponse, error) {
	menu, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if menu == nil {
		return nil, ErrMenuNotFound
	}

	// Also get children for this menu
	allMenus, err := s.repo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	tree := buildTree(allMenus)
	found := findInTree(tree, id)
	if found == nil {
		return menu.ToResponse(), nil
	}

	return found, nil
}

func (s *menuService) CreateMenu(ctx context.Context, req *model.CreateMenuRequest) (*model.MenuResponse, error) {
	// Verify parent exists if specified
	if req.ParentID != nil {
		parent, err := s.repo.GetByID(ctx, *req.ParentID)
		if err != nil {
			return nil, err
		}
		if parent == nil {
			return nil, ErrParentNotFound
		}
	}

	menu, err := s.repo.Create(ctx, req)
	if err != nil {
		return nil, err
	}

	return menu.ToResponse(), nil
}

func (s *menuService) UpdateMenu(ctx context.Context, id uint64, req *model.UpdateMenuRequest) (*model.MenuResponse, error) {
	menu, err := s.repo.Update(ctx, id, req)
	if err != nil {
		return nil, err
	}
	if menu == nil {
		return nil, ErrMenuNotFound
	}

	return menu.ToResponse(), nil
}

func (s *menuService) DeleteMenu(ctx context.Context, id uint64) error {
	// Verify the menu exists
	menu, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if menu == nil {
		return ErrMenuNotFound
	}

	return s.repo.Delete(ctx, id)
}

func (s *menuService) MoveMenu(ctx context.Context, id uint64, req *model.MoveMenuRequest) (*model.MenuResponse, error) {
	// Verify the menu exists
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrMenuNotFound
	}

	// Cannot make a menu item its own parent
	if req.ParentID != nil && *req.ParentID == id {
		return nil, ErrSelfParent
	}

	// Verify new parent exists
	if req.ParentID != nil {
		parent, err := s.repo.GetByID(ctx, *req.ParentID)
		if err != nil {
			return nil, err
		}
		if parent == nil {
			return nil, ErrParentNotFound
		}

		// Check for circular reference: new parent cannot be a descendant of the menu
		isDesc, err := s.repo.IsDescendant(ctx, id, *req.ParentID)
		if err != nil {
			return nil, err
		}
		if isDesc {
			return nil, ErrCircularRef
		}
	}

	menu, err := s.repo.Move(ctx, id, req.ParentID)
	if err != nil {
		return nil, err
	}
	if menu == nil {
		return nil, ErrMenuNotFound
	}

	return menu.ToResponse(), nil
}

func (s *menuService) ReorderMenu(ctx context.Context, id uint64, req *model.ReorderMenuRequest) (*model.MenuResponse, error) {
	// Verify the menu exists
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrMenuNotFound
	}

	// Validate sort_order bounds
	var parentID *uint64
	if existing.ParentID.Valid {
		pid := uint64(existing.ParentID.Int64)
		parentID = &pid
	}

	maxOrder, err := s.repo.GetMaxSortOrder(ctx, parentID)
	if err != nil {
		return nil, err
	}

	if req.SortOrder > maxOrder {
		return nil, fmt.Errorf("%w: maximum is %d", ErrInvalidSortOrder, maxOrder)
	}

	menu, err := s.repo.Reorder(ctx, id, req.SortOrder)
	if err != nil {
		return nil, err
	}
	if menu == nil {
		return nil, ErrMenuNotFound
	}

	return menu.ToResponse(), nil
}

// buildTree converts a flat list of menus into a tree structure.
func buildTree(menus []*model.Menu) []*model.MenuResponse {
	menuMap := make(map[uint64]*model.MenuResponse)
	var roots []*model.MenuResponse

	// First pass: create all menu response objects
	for _, m := range menus {
		resp := m.ToResponse()
		menuMap[m.ID] = resp
	}

	// Second pass: build the tree
	for _, m := range menus {
		resp := menuMap[m.ID]
		if m.ParentID.Valid {
			parentID := uint64(m.ParentID.Int64)
			if parent, ok := menuMap[parentID]; ok {
				parent.Children = append(parent.Children, resp)
			}
		} else {
			roots = append(roots, resp)
		}
	}

	if roots == nil {
		roots = make([]*model.MenuResponse, 0)
	}

	return roots
}

// findInTree searches for a menu item by ID in the tree.
func findInTree(tree []*model.MenuResponse, id uint64) *model.MenuResponse {
	for _, node := range tree {
		if node.ID == id {
			return node
		}
		if found := findInTree(node.Children, id); found != nil {
			return found
		}
	}
	return nil
}
