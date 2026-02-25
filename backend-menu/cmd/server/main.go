package main

import (
	"fmt"
	"log"

	_ "backend-menu/docs"
	"backend-menu/internal/config"
	"backend-menu/internal/database"
	"backend-menu/internal/handler"
	"backend-menu/internal/repository"
	"backend-menu/internal/router"
	"backend-menu/internal/service"
)


func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	db, err := database.NewMySQL(cfg.DSN())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Println("Connected to MySQL database")

	// Run migrations
	if err := database.RunMigrations(db, "migrations"); err != nil {
		log.Printf("Warning: Migration error: %v", err)
	}

	// Initialize layers
	menuRepo := repository.NewMenuRepository(db)
	menuService := service.NewMenuService(menuRepo)
	menuHandler := handler.NewMenuHandler(menuService)

	// Setup router
	r := router.Setup(menuHandler)

	// Start server
	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("Server starting on %s", addr)
	log.Printf("Swagger UI: http://localhost:%s/swagger/index.html", cfg.ServerPort)

	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
