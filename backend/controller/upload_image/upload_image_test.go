package upload_image

import (
	"testing"
)

func TestSanitizeFilename_ReplacesSpecialChars(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{`AA\BB`, "AA_BB"},
		{"AA/BB", "AA_BB"},
		{"AA:BB", "AA_BB"},
		{"AA*BB", "AA_BB"},
		{"AA?BB", "AA_BB"},
		{`AA"BB`, "AA_BB"},
		{"AA<BB", "AA_BB"},
		{"AA>BB", "AA_BB"},
		{"AA|BB", "AA_BB"},
		{"normal_filename.jpg", "normal_filename.jpg"},
		{"AA:BB/CC\\DD", "AA_BB_CC_DD"},
	}

	for _, tc := range cases {
		t.Run(tc.input, func(t *testing.T) {
			got := sanitizeFilename(tc.input)
			if got != tc.want {
				t.Errorf("sanitizeFilename(%q): want %q, got %q", tc.input, tc.want, got)
			}
		})
	}
}

func TestUintPtr_ReturnsPointer(t *testing.T) {
	val := uint(42)
	ptr := uintPtr(val)

	if ptr == nil {
		t.Fatal("expected non-nil pointer")
	}
	if *ptr != val {
		t.Errorf("expected %d, got %d", val, *ptr)
	}
}

func TestUintPtr_Zero(t *testing.T) {
	ptr := uintPtr(0)
	if ptr == nil {
		t.Fatal("expected non-nil pointer for zero value")
	}
	if *ptr != 0 {
		t.Errorf("expected 0, got %d", *ptr)
	}
}
