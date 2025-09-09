import cv2
import numpy as np

def find_digits(binary_img, min_height=20, min_width=10):
    contours, _ = cv2.findContours(binary_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    digit_rois = []

    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if h >= min_height and w >= min_width:  # กรอง noise เล็ก
            digit = binary_img[y:y+h, x:x+w]
            digit = cv2.resize(digit, (28,28), interpolation=cv2.INTER_AREA)
            digit = digit.astype("float32") / 255.0
            digit = digit.reshape(28,28,1)  # สำหรับ CNN ที่ใช้ input shape (28,28,1)
            digit_rois.append((x, digit))

    # เรียงจากซ้ายไปขวา
    digit_rois = sorted(digit_rois, key=lambda x: x[0])
    return digit_rois
