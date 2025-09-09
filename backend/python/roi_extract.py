import cv2
import numpy as np

def apply_mask(image, mask):
    roi = cv2.bitwise_and(image, image, mask=mask)
    return roi

def binarize_roi(roi):
    gray = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary
