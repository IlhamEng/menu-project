package repository

import (
	"context"
	"database/sql"
	"fmt"

	"backend-menu/internal/model"

	"github.com/jmoiron/sqlx"
)

// MenuRepository defines the interface for menu data operations.
type MenuRepository interface {
	GetAll(ctx context.Context) ([]*model.Menu, error)
	GetByID(ctx context.Context, id uint64) (*model.Menu, error)
	Create(ctx context.Context, req *model.CreateMenuRequest) (*model.Menu, error)
	Update(ctx context.Context, id uint64, req *model.UpdateMenuRequest) (*model.Menu, error)
	Delete(ctx context.Context, id uint64) error
	Move(ctx context.Context, id uint64, parentID *uint64) (*model.Menu, error)
	Reorder(ctx context.Context, id uint64, newSortOrder int) (*model.Menu, error)
	GetChildren(ctx context.Context, parentID *uint64) ([]*model.Menu, error)
	GetMaxSortOrder(ctx context.Context, parentID *uint64) (int, error)
	IsDescendant(ctx context.Context, ancestorID, descendantID uint64) (bool, error)
}

type menuRepository struct {
	db *sqlx.DB
}

// NewMenuRepository creates a new MenuRepository.
func NewMenuRepository(db *sqlx.DB) MenuRepository {
	return &menuRepository{db: db}
}

func (r *menuRepository) GetAll(ctx context.Context) ([]*model.Menu, error) {
	var menus []*model.Menu
	query := `SELECT id, name, description, parent_id, sort_order, created_at, updated_at 
	           FROM menus ORDER BY sort_order ASC, id ASC`
	if err := r.db.SelectContext(ctx, &menus, query); err != nil {
		return nil, fmt.Errorf("failed to get all menus: %w", err)
	}
	return menus, nil
}

func (r *menuRepository) GetByID(ctx context.Context, id uint64) (*model.Menu, error) {
	var menu model.Menu
	query := `SELECT id, name, description, parent_id, sort_order, created_at, updated_at 
	           FROM menus WHERE id = ?`
	if err := r.db.GetContext(ctx, &menu, query, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get menu by id: %w", err)
	}
	return &menu, nil
}

func (r *menuRepository) Create(ctx context.Context, req *model.CreateMenuRequest) (*model.Menu, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Determine sort_order
	sortOrder := 0
	if req.SortOrder != nil {
		sortOrder = *req.SortOrder
		// Shift existing items at or after this sort_order
		shiftQuery := `UPDATE menus SET sort_order = sort_order + 1 
		               WHERE sort_order >= ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))`
		if req.ParentID != nil {
			_, err = tx.ExecContext(ctx, shiftQuery, sortOrder, *req.ParentID, *req.ParentID)
		} else {
			_, err = tx.ExecContext(ctx, shiftQuery, sortOrder, nil, nil)
		}
		if err != nil {
			return nil, fmt.Errorf("failed to shift sort orders: %w", err)
		}
	} else {
		// Get max sort_order + 1
		var maxOrder sql.NullInt64
		maxQuery := `SELECT MAX(sort_order) FROM menus WHERE parent_id = ? OR (parent_id IS NULL AND ? IS NULL)`
		if req.ParentID != nil {
			err = tx.GetContext(ctx, &maxOrder, maxQuery, *req.ParentID, *req.ParentID)
		} else {
			err = tx.GetContext(ctx, &maxOrder, maxQuery, nil, nil)
		}
		if err != nil {
			return nil, fmt.Errorf("failed to get max sort order: %w", err)
		}
		if maxOrder.Valid {
			sortOrder = int(maxOrder.Int64) + 1
		}
	}

	// Insert the menu item
	insertQuery := `INSERT INTO menus (name, description, parent_id, sort_order) VALUES (?, ?, ?, ?)`
	result, err := tx.ExecContext(ctx, insertQuery, req.Name, req.Description, req.ParentID, sortOrder)
	if err != nil {
		return nil, fmt.Errorf("failed to create menu: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return r.GetByID(ctx, uint64(id))
}

func (r *menuRepository) Update(ctx context.Context, id uint64, req *model.UpdateMenuRequest) (*model.Menu, error) {
	setClauses := ""
	args := make([]interface{}, 0)

	if req.Name != nil {
		setClauses += "name = ?, "
		args = append(args, *req.Name)
	}
	if req.Description != nil {
		setClauses += "description = ?, "
		args = append(args, *req.Description)
	}

	if setClauses == "" {
		return r.GetByID(ctx, id)
	}

	// Remove trailing comma and space
	setClauses = setClauses[:len(setClauses)-2]
	args = append(args, id)

	query := fmt.Sprintf("UPDATE menus SET %s WHERE id = ?", setClauses)
	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update menu: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return nil, nil
	}

	return r.GetByID(ctx, id)
}

func (r *menuRepository) Delete(ctx context.Context, id uint64) error {
	query := `DELETE FROM menus WHERE id = ?`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete menu: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *menuRepository) Move(ctx context.Context, id uint64, parentID *uint64) (*model.Menu, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Get the current menu
	var menu model.Menu
	getQuery := `SELECT id, parent_id, sort_order FROM menus WHERE id = ?`
	if err := tx.GetContext(ctx, &menu, getQuery, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get menu: %w", err)
	}

	// Re-order old siblings (close the gap)
	var oldParentID interface{}
	if menu.ParentID.Valid {
		oldParentID = menu.ParentID.Int64
	}
	shiftDownQuery := `UPDATE menus SET sort_order = sort_order - 1 
	                   WHERE sort_order > ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))`
	_, err = tx.ExecContext(ctx, shiftDownQuery, menu.SortOrder, oldParentID, oldParentID)
	if err != nil {
		return nil, fmt.Errorf("failed to shift old siblings: %w", err)
	}

	// Get max sort_order in new parent
	var maxOrder sql.NullInt64
	maxQuery := `SELECT MAX(sort_order) FROM menus WHERE parent_id = ? OR (parent_id IS NULL AND ? IS NULL)`
	if err := tx.GetContext(ctx, &maxOrder, maxQuery, parentID, parentID); err != nil {
		return nil, fmt.Errorf("failed to get max sort order: %w", err)
	}

	newSortOrder := 0
	if maxOrder.Valid {
		newSortOrder = int(maxOrder.Int64) + 1
	}

	// Move the item
	moveQuery := `UPDATE menus SET parent_id = ?, sort_order = ? WHERE id = ?`
	_, err = tx.ExecContext(ctx, moveQuery, parentID, newSortOrder, id)
	if err != nil {
		return nil, fmt.Errorf("failed to move menu: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return r.GetByID(ctx, id)
}

func (r *menuRepository) Reorder(ctx context.Context, id uint64, newSortOrder int) (*model.Menu, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Get current menu
	var menu model.Menu
	getQuery := `SELECT id, parent_id, sort_order FROM menus WHERE id = ?`
	if err := tx.GetContext(ctx, &menu, getQuery, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get menu: %w", err)
	}

	oldSortOrder := menu.SortOrder

	if oldSortOrder == newSortOrder {
		return r.GetByID(ctx, id)
	}

	var parentID interface{}
	if menu.ParentID.Valid {
		parentID = menu.ParentID.Int64
	}

	// Shift siblings
	if newSortOrder < oldSortOrder {
		// Moving up: shift items between [new, old) down by 1
		shiftQuery := `UPDATE menus SET sort_order = sort_order + 1 
		               WHERE sort_order >= ? AND sort_order < ? 
		               AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))
		               AND id != ?`
		_, err = tx.ExecContext(ctx, shiftQuery, newSortOrder, oldSortOrder, parentID, parentID, id)
	} else {
		// Moving down: shift items between (old, new] up by 1
		shiftQuery := `UPDATE menus SET sort_order = sort_order - 1 
		               WHERE sort_order > ? AND sort_order <= ? 
		               AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))
		               AND id != ?`
		_, err = tx.ExecContext(ctx, shiftQuery, oldSortOrder, newSortOrder, parentID, parentID, id)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to shift siblings: %w", err)
	}

	// Set the new sort order
	updateQuery := `UPDATE menus SET sort_order = ? WHERE id = ?`
	_, err = tx.ExecContext(ctx, updateQuery, newSortOrder, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update sort order: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return r.GetByID(ctx, id)
}

func (r *menuRepository) GetChildren(ctx context.Context, parentID *uint64) ([]*model.Menu, error) {
	var menus []*model.Menu
	query := `SELECT id, name, description, parent_id, sort_order, created_at, updated_at 
	          FROM menus WHERE parent_id = ? OR (parent_id IS NULL AND ? IS NULL) 
	          ORDER BY sort_order ASC`
	if err := r.db.SelectContext(ctx, &menus, query, parentID, parentID); err != nil {
		return nil, fmt.Errorf("failed to get children: %w", err)
	}
	return menus, nil
}

func (r *menuRepository) GetMaxSortOrder(ctx context.Context, parentID *uint64) (int, error) {
	var maxOrder sql.NullInt64
	query := `SELECT MAX(sort_order) FROM menus WHERE parent_id = ? OR (parent_id IS NULL AND ? IS NULL)`
	if err := r.db.GetContext(ctx, &maxOrder, query, parentID, parentID); err != nil {
		return 0, fmt.Errorf("failed to get max sort order: %w", err)
	}
	if maxOrder.Valid {
		return int(maxOrder.Int64), nil
	}
	return -1, nil
}

func (r *menuRepository) IsDescendant(ctx context.Context, ancestorID, descendantID uint64) (bool, error) {
	// Traverse up from descendantID to see if we hit ancestorID
	currentID := descendantID
	visited := make(map[uint64]bool)

	for {
		if currentID == ancestorID {
			return true, nil
		}
		if visited[currentID] {
			return false, nil // Prevent infinite loops
		}
		visited[currentID] = true

		var parentID sql.NullInt64
		query := `SELECT parent_id FROM menus WHERE id = ?`
		if err := r.db.GetContext(ctx, &parentID, query, currentID); err != nil {
			if err == sql.ErrNoRows {
				return false, nil
			}
			return false, fmt.Errorf("failed to check descendant: %w", err)
		}

		if !parentID.Valid {
			return false, nil // Reached root
		}
		currentID = uint64(parentID.Int64)
	}
}
