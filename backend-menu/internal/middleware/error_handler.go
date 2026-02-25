package middleware

import (
	"log"
	"net/http"

	"backend-menu/internal/model"

	"github.com/gin-gonic/gin"
)

// ErrorHandler is middleware that recovers from panics and returns a structured JSON error.
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic recovered: %v", err)
				c.AbortWithStatusJSON(http.StatusInternalServerError, model.ErrorResponse{
					Success: false,
					Message: "Internal server error",
				})
			}
		}()
		c.Next()
	}
}

// RequestLogger logs incoming requests.
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("[%s] %s", c.Request.Method, c.Request.URL.Path)
		c.Next()
	}
}
