package handler

import (
	"errors"
	"net/http"
	"strconv"

	"backend-menu/internal/model"
	"backend-menu/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// MenuHandler handles HTTP requests for menu management.
type MenuHandler struct {
	service  service.MenuService
	validate *validator.Validate
}

// NewMenuHandler creates a new MenuHandler.
func NewMenuHandler(svc service.MenuService) *MenuHandler {
	return &MenuHandler{
		service:  svc,
		validate: validator.New(),
	}
}

// GetAllMenus godoc
// @Summary      Get all menu items
// @Description  Returns all menu items organized in a tree structure
// @Tags         menus
// @Produce      json
// @Success      200  {object}  model.APIResponse{data=[]model.MenuResponse}
// @Failure      500  {object}  model.ErrorResponse
// @Router       /api/menus [get]
func (h *MenuHandler) GetAllMenus(c *gin.Context) {
	menus, err := h.service.GetAllMenus(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Failed to retrieve menus",
		})
		return
	}

	c.JSON(http.StatusOK, model.APIResponse{
		Success: true,
		Data:    menus,
	})
}

// GetMenuByID godoc
// @Summary      Get a menu item by ID
// @Description  Returns a single menu item with its children
// @Tags         menus
// @Produce      json
// @Param        id   path      int  true  "Menu ID"
// @Success      200  {object}  model.APIResponse{data=model.MenuResponse}
// @Failure      400  {object}  model.ErrorResponse
// @Failure      404  {object}  model.ErrorResponse
// @Failure      500  {object}  model.ErrorResponse
// @Router       /api/menus/{id} [get]
func (h *MenuHandler) GetMenuByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Invalid menu ID",
		})
		return
	}

	menu, err := h.service.GetMenuByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrMenuNotFound) {
			c.JSON(http.StatusNotFound, model.ErrorResponse{
				Success: false,
				Message: "Menu not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Failed to retrieve menu",
		})
		return
	}

	c.JSON(http.StatusOK, model.APIResponse{
		Success: true,
		Data:    menu,
	})
}

// CreateMenu godoc
func (h *MenuHandler) CreateMenu(c *gin.Context) {
	var req model.CreateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Invalid request body",
		})
		return
	}

	if err := h.validate.Struct(req); err != nil {
		validationErrors := err.(validator.ValidationErrors)
		fieldErrors := make(map[string]string)
		for _, e := range validationErrors {
			fieldErrors[e.Field()] = formatValidationError(e)
		}
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Errors:  fieldErrors,
		})
		return
	}

	menu, err := h.service.CreateMenu(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, service.ErrParentNotFound) {
			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Success: false,
				Message: "Parent menu not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Failed to create menu",
		})
		return
	}

	c.JSON(http.StatusCreated, model.APIResponse{
		Success: true,
		Message: "Menu created successfully",
		Data:    menu,
	})
}

// UpdateMenu godoc
func (h *MenuHandler) UpdateMenu(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Invalid menu ID",
		})
		return
	}

	var req model.UpdateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Invalid request body",
		})
		return
	}

	if err := h.validate.Struct(req); err != nil {
		validationErrors := err.(validator.ValidationErrors)
		fieldErrors := make(map[string]string)
		for _, e := range validationErrors {
			fieldErrors[e.Field()] = formatValidationError(e)
		}
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Errors:  fieldErrors,
		})
		return
	}

	menu, err := h.service.UpdateMenu(c.Request.Context(), id, &req)
	if err != nil {
		if errors.Is(err, service.ErrMenuNotFound) {
			c.JSON(http.StatusNotFound, model.ErrorResponse{
				Success: false,
				Message: "Menu not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Failed to update menu",
		})
		return
	}

	c.JSON(http.StatusOK, model.APIResponse{
		Success: true,
		Message: "Menu updated successfully",
		Data:    menu,
	})
}

// DeleteMenu godoc
func (h *MenuHandler) DeleteMenu(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Invalid menu ID",
		})
		return
	}

	if err := h.service.DeleteMenu(c.Request.Context(), id); err != nil {
		if errors.Is(err, service.ErrMenuNotFound) {
			c.JSON(http.StatusNotFound, model.ErrorResponse{
				Success: false,
				Message: "Menu not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Failed to delete menu",
		})
		return
	}

	c.JSON(http.StatusOK, model.APIResponse{
		Success: true,
		Message: "Menu deleted successfully",
	})
}

// MoveMenu godoc
func (h *MenuHandler) MoveMenu(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Invalid menu ID",
		})
		return
	}

	var req model.MoveMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Invalid request body",
		})
		return
	}

	menu, err := h.service.MoveMenu(c.Request.Context(), id, &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrMenuNotFound):
			c.JSON(http.StatusNotFound, model.ErrorResponse{
				Success: false,
				Message: "Menu not found",
			})
		case errors.Is(err, service.ErrCircularRef):
			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Success: false,
				Message: err.Error(),
			})
		case errors.Is(err, service.ErrSelfParent):
			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Success: false,
				Message: err.Error(),
			})
		case errors.Is(err, service.ErrParentNotFound):
			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Success: false,
				Message: "Parent menu not found",
			})
		default:
			c.JSON(http.StatusInternalServerError, model.ErrorResponse{
				Success: false,
				Message: "Failed to move menu",
			})
		}
		return
	}

	c.JSON(http.StatusOK, model.APIResponse{
		Success: true,
		Message: "Menu moved successfully",
		Data:    menu,
	})
}

// ReorderMenu godoc
func (h *MenuHandler) ReorderMenu(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Invalid menu ID",
		})
		return
	}

	var req model.ReorderMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Invalid request body",
		})
		return
	}

	if err := h.validate.Struct(req); err != nil {
		validationErrors := err.(validator.ValidationErrors)
		fieldErrors := make(map[string]string)
		for _, e := range validationErrors {
			fieldErrors[e.Field()] = formatValidationError(e)
		}
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Errors:  fieldErrors,
		})
		return
	}

	menu, err := h.service.ReorderMenu(c.Request.Context(), id, &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrMenuNotFound):
			c.JSON(http.StatusNotFound, model.ErrorResponse{
				Success: false,
				Message: "Menu not found",
			})
		case errors.Is(err, service.ErrInvalidSortOrder):
			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Success: false,
				Message: err.Error(),
			})
		default:
			c.JSON(http.StatusInternalServerError, model.ErrorResponse{
				Success: false,
				Message: "Failed to reorder menu",
			})
		}
		return
	}

	c.JSON(http.StatusOK, model.APIResponse{
		Success: true,
		Message: "Menu reordered successfully",
		Data:    menu,
	})
}

// formatValidationError converts a validator.FieldError to a human-readable message.
func formatValidationError(e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return "This field is required"
	case "min":
		return "Value is too short (minimum: " + e.Param() + ")"
	case "max":
		return "Value is too long (maximum: " + e.Param() + ")"
	default:
		return "Invalid value"
	}
}
