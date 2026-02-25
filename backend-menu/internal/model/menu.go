package model

import (
	"database/sql"
	"time"
)

// Menu represents a menu item in the database.
type Menu struct {
	ID          uint64          `json:"id" db:"id"`
	Name        string          `json:"name" db:"name"`
	Description sql.NullString  `json:"-" db:"description"`
	ParentID    sql.NullInt64   `json:"-" db:"parent_id"`
	SortOrder   int             `json:"sort_order" db:"sort_order"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at" db:"updated_at"`
	Children    []*MenuResponse `json:"children,omitempty" db:"-"`
}

// MenuResponse is the API response representation of a menu item.
type MenuResponse struct {
	ID          uint64          `json:"id"`
	Name        string          `json:"name"`
	Description *string         `json:"description"`
	ParentID    *uint64         `json:"parent_id"`
	SortOrder   int             `json:"sort_order"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	Children    []*MenuResponse `json:"children,omitempty"`
}

// ToResponse converts a Menu entity to a MenuResponse.
func (m *Menu) ToResponse() *MenuResponse {
	resp := &MenuResponse{
		ID:        m.ID,
		Name:      m.Name,
		SortOrder: m.SortOrder,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
		Children:  make([]*MenuResponse, 0),
	}

	if m.Description.Valid {
		resp.Description = &m.Description.String
	}

	if m.ParentID.Valid {
		pid := uint64(m.ParentID.Int64)
		resp.ParentID = &pid
	}

	return resp
}

// CreateMenuRequest represents the request body for creating a menu item.
type CreateMenuRequest struct {
	Name        string  `json:"name" validate:"required,min=1,max=255"`
	Description *string `json:"description" validate:"omitempty,max=1000"`
	ParentID    *uint64 `json:"parent_id" validate:"omitempty"`
	SortOrder   *int    `json:"sort_order" validate:"omitempty,min=0"`
}

// UpdateMenuRequest represents the request body for updating a menu item.
type UpdateMenuRequest struct {
	Name        *string `json:"name" validate:"omitempty,min=1,max=255"`
	Description *string `json:"description" validate:"omitempty,max=1000"`
}

// MoveMenuRequest represents the request body for moving a menu item.
type MoveMenuRequest struct {
	ParentID *uint64 `json:"parent_id"` // nil means move to root
}

// ReorderMenuRequest represents the request body for reordering a menu item.
type ReorderMenuRequest struct {
	SortOrder int `json:"sort_order" validate:"min=0"`
}

// APIResponse is a standard envelope for all API responses.
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// ErrorResponse is a standard envelope for error responses.
type ErrorResponse struct {
	Success bool              `json:"success"`
	Message string            `json:"message"`
	Errors  map[string]string `json:"errors,omitempty"`
}
