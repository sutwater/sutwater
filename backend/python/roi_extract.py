import cv2
import numpy as np

def apply_mask(image, mask):
    """
    ตัดภาพเฉพาะบริเวณที่ mask เป็นขาว (255)
    image: np.ndarray, RGB image
    mask: np.ndarray, binary mask (0/255)
    return: ROI image
    """
    roi = cv2.bitwise_and(image, image, mask=mask)
    return roi

def binarize_roi(roi):
    """
    แปลง ROI เป็นขาวดำ (binary) สำหรับเตรียมแยกตัวเลข
    """
    gray = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary
