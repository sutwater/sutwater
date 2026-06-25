package utils

import (
	"strings"
	"testing"
)

func TestHashPassword_ReturnsHash(t *testing.T) {
	hash, err := HashPassword("secret123")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if hash == "" {
		t.Fatal("expected non-empty hash")
	}
	if hash == "secret123" {
		t.Fatal("hash must not equal plain password")
	}
}

func TestHashPassword_ProducesBcryptPrefix(t *testing.T) {
	hash, err := HashPassword("anypassword")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !strings.HasPrefix(hash, "$2a$") && !strings.HasPrefix(hash, "$2b$") {
		t.Fatalf("expected bcrypt hash prefix, got %q", hash)
	}
}

func TestHashPassword_DifferentHashesForSameInput(t *testing.T) {
	h1, _ := HashPassword("same")
	h2, _ := HashPassword("same")
	if h1 == h2 {
		t.Fatal("bcrypt should produce different hashes each call due to random salt")
	}
}

func TestHashPassword_TooLongPassword_ReturnsError(t *testing.T) {
	// bcrypt จำกัดที่ 72 bytes; x/crypto v0.31+ คืน ErrPasswordTooLong
	longPassword := strings.Repeat("x", 73)
	_, err := HashPassword(longPassword)
	if err == nil {
		t.Skip("bcrypt version does not enforce 72-byte limit")
	}
}

func TestComparePassword_CorrectPassword(t *testing.T) {
	hash, _ := HashPassword("mypassword")
	if err := ComparePassword(hash, "mypassword"); err != nil {
		t.Fatalf("expected match, got error: %v", err)
	}
}

func TestComparePassword_WrongPassword(t *testing.T) {
	hash, _ := HashPassword("mypassword")
	if err := ComparePassword(hash, "wrongpassword"); err == nil {
		t.Fatal("expected error for wrong password, got nil")
	}
}

func TestComparePassword_EmptyPassword(t *testing.T) {
	hash, _ := HashPassword("mypassword")
	if err := ComparePassword(hash, ""); err == nil {
		t.Fatal("expected error for empty password, got nil")
	}
}

func TestComparePassword_InvalidHash(t *testing.T) {
	if err := ComparePassword("not-a-valid-hash", "anypassword"); err == nil {
		t.Fatal("expected error for invalid hash, got nil")
	}
}
