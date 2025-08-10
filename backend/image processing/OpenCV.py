import cv2
import os
import pytesseract

input_folder = r"C:\Users\Pre-Capstone\backend\uploads"
output_folder = r"C:\Users\Pre-Capstone\backend\image processing\after_process"

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
digit_config = r'--oem 3 --psm 10 -c tessedit_char_whitelist=0123456789'

if not os.path.exists(input_folder):
    print(f"ไม่พบโฟลเดอร์: {input_folder}")
else:
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    for filename in os.listdir(input_folder):
        if not filename.lower().endswith((".jpg", ".png")):
            continue

        file_path = os.path.join(input_folder, filename)
        img = cv2.imread(file_path)

        if img is None:
            print(f"ไม่สามารถโหลดไฟล์ภาพ: {filename}")
            continue

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        digit_w, digit_h = 30, 40
        y = 118

        start_x = 332
        shift = digit_w + 10

        digit_count = 7
        result = ""

        for i in range(digit_count):
            x = start_x - (i * shift)
            digit_roi = gray[y:y+digit_h, x:x+digit_w]

            # 1. Denoise with Gaussian blur
            blur = cv2.GaussianBlur(digit_roi, (3, 3), 0)

            # 2. Adaptive threshold
            thresh = cv2.adaptiveThreshold(
                blur, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV,
                11, 2
            )

            # 3. Morphological dilation to strengthen strokes
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
            morph = cv2.dilate(thresh, kernel, iterations=1)

            # 4. Optional: resize to enlarge digit for better OCR
            resized = cv2.resize(morph, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)

            # Save processed ROI for debugging
            digit_filename = f"{os.path.splitext(filename)[0]}_digit_{i}.png"
            cv2.imwrite(os.path.join(output_folder, digit_filename), resized)

            # OCR
            digit_text = pytesseract.image_to_string(resized, config=digit_config).strip()
            if digit_text == "":
                digit_text = "?"

            result = digit_text + result

        print(f"ผลลัพธ์จาก OCR ของภาพ {filename}: {result}")
