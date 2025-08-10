package upload_image

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func sanitizeFilename(name string) string {
	replacer := strings.NewReplacer(
		"\\", "_",
		"/", "_",
		":", "_",
		"*", "_",
		"?", "_",
		"\"", "_",
		"<", "_",
		">", "_",
		"|", "_",
	)
	return replacer.Replace(name)
}

func UploadMeterImage(c *gin.Context) {
	mac := c.PostForm("mac")
	header, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing image file"})
		return
	}

	if mac == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing MAC address"})
		return
	}

	// ทำให้ชื่อไฟล์ MAC ปลอดภัย
	macSafe := sanitizeFilename(mac)

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create upload folder: %v", err)})
		return
	}

	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("%s_%s.jpg", macSafe, timestamp)

	filepathFull := filepath.Join(uploadDir, filename)
	fmt.Println("Saving file to:", filepathFull)

	out, err := os.Create(filepathFull)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create file: %v", err)})
		return
	}
	defer out.Close()

	src, err := header.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to open uploaded file: %v", err)})
		return
	}
	defer src.Close()

	written, err := io.Copy(out, src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to write image to disk: %v", err)})
		return
	}

	fmt.Printf("Written %d bytes to %s\n", written, filepathFull)

	c.JSON(http.StatusOK, gin.H{
		"message":  "Image uploaded successfully",
		"filename": filename,
		"mac":      mac,
	})
}
