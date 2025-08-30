import os
import cv2
import numpy as np
from roi_extract import binarize_roi
from digit_segment import find_digits
from tensorflow.keras.models import load_model
import matplotlib.pyplot as plt

IMAGE_FOLDER = r"C:\Users\Pre-Capstone\backend\python\images_resized"
MASK_FOLDER  = r"C:\Users\Pre-Capstone\backend\python\unet_images_masks"
CNN_MODEL_PATH = r"C:\Users\Pre-Capstone\backend\python\cnn_digit_model.keras"

# โหลดโมเดล CNN
cnn_model = load_model(CNN_MODEL_PATH)

# ฟังก์ชัน apply_mask แก้ไขให้ resize และ convert mask
def apply_mask(image, mask):
    if mask.shape != image.shape[:2]:
        mask = cv2.resize(mask, (image.shape[1], image.shape[0]))
    mask = mask.astype(np.uint8)
    roi = cv2.bitwise_and(image, image, mask=mask)
    return roi

# วน loop รูปทั้งหมดในโฟลเดอร์
for filename in sorted(os.listdir(IMAGE_FOLDER)):
    if not filename.lower().endswith((".jpg", ".png", ".jpeg")):
        continue

    image_path = os.path.join(IMAGE_FOLDER, filename)
    mask_filename = os.path.splitext(filename)[0] + "_mask.png"
    mask_path = os.path.join(MASK_FOLDER, mask_filename)

    # ตรวจสอบไฟล์
    if not os.path.isfile(image_path):
        print(f"ไม่พบไฟล์ภาพ: {filename}")
        continue
    if not os.path.isfile(mask_path):
        print(f"ไม่พบไฟล์ mask: {mask_filename}")
        continue

    # โหลดภาพและ mask
    image = cv2.cvtColor(cv2.imread(image_path), cv2.COLOR_BGR2RGB)
    mask  = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)

    #ตัด ROI ตาม mask
    roi = apply_mask(image, mask)
    binary = binarize_roi(roi)

    #แสดง ROI และ Binary Image ด้วย matplotlib
    plt.figure(figsize=(8,4))
    plt.subplot(1,2,1)
    plt.title("ROI")
    plt.imshow(roi)
    plt.axis("off")

    plt.subplot(1,2,2)
    plt.title("Binary")
    plt.imshow(binary, cmap="gray")
    plt.axis("off")

    plt.show()

    #แยกตัวเลขทีละหลัก
    digit_rois = find_digits(binary)
    digit_rois = sorted(digit_rois, key=lambda x: x[0])  # เรียงซ้าย → ขวา

    #ทำนายเลข
    predicted_digits = []
    for idx, (_, digit) in enumerate(digit_rois):
        if digit.size == 0:
            print(f"Digit {idx} empty, skipping")
            continue
        digit_resized = cv2.resize(digit, (128,128))
        digit_norm = digit_resized.astype(np.float32)/255.0
        digit_rgb = cv2.cvtColor(digit_norm, cv2.COLOR_GRAY2RGB)
        d_input = np.expand_dims(digit_rgb, axis=0)
        pred = cnn_model.predict(d_input, verbose=0)
        predicted_digits.append(str(np.argmax(pred)))

    # แสดงผลลัพธ์
    meter_value = "".join(map(str, predicted_digits))
    print(f"{filename} → Meter Reading: {meter_value}")