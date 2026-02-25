package router

import (
	"backend-menu/internal/handler"
	"backend-menu/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// Setup creates and configures the Gin router with all routes.
func Setup(menuHandler *handler.MenuHandler) *gin.Engine {
	r := gin.Default()

	// Middleware
	r.Use(middleware.ErrorHandler())
	r.Use(middleware.RequestLogger())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := r.Group("/api")
	{
		menus := api.Group("/menus")
		{
			menus.GET("", menuHandler.GetAllMenus)
			menus.GET("/:id", menuHandler.GetMenuByID)
			menus.POST("", menuHandler.CreateMenu)
			menus.PUT("/:id", menuHandler.UpdateMenu)
			menus.DELETE("/:id", menuHandler.DeleteMenu)
			menus.PATCH("/:id/move", menuHandler.MoveMenu)
			menus.PATCH("/:id/reorder", menuHandler.ReorderMenu)
		}
	}

	return r
}
