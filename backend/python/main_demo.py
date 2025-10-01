import os
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.models import load_model
import matplotlib.pyplot as plt

# ---------------- Config ----------------
UNET_MODEL_PATH = r"C:\Users\umdan\Pre-Capstone\backend\python\model\unet_meter_model_cpu_fast.h5"
CNN_MODEL_PATH  = r"C:\Users\umdan\Pre-Capstone\backend\python\model\digit_cnn_best copy.h5"
TEST_IMAGE = r"C:\Users\umdan\Pre-Capstone\backend\python\uploadss\test.jpg"

MASK_THRESHOLD = 0.3
NUM_DIGITS = 7
INPUT_SIZE = 256  # U-Net input size
DIGIT_SIZE = 64   # CNN input size

# ---------------- Load Models ----------------
def load_unet():
    custom_objects = {
        "dice_coefficient": lambda y_true, y_pred, smooth=1.0:
            (2 * tf.reduce_sum(y_true * y_pred) + smooth) /
            (tf.reduce_sum(y_true) + tf.reduce_sum(y_pred) + smooth),
        "iou_metric": lambda y_true, y_pred, smooth=1.0:
            (tf.reduce_sum(y_true * y_pred) + smooth) /
            (tf.reduce_sum(y_true) + tf.reduce_sum(y_pred) - tf.reduce_sum(y_true * y_pred) + smooth)
    }
    return load_model(UNET_MODEL_PATH, custom_objects=custom_objects, compile=False)

def load_cnn():
    return load_model(CNN_MODEL_PATH)

unet_model = load_unet()
cnn_model  = load_cnn()

# ---------------- Utils ----------------
def clean_mask(mask):
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if num_labels <= 1:
        return mask
    largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    clean = np.zeros_like(mask, dtype=np.uint8)
    clean[labels == largest_label] = 255
    return clean

def predict_mask(image_rgb):
    img_resized = cv2.resize(image_rgb, (INPUT_SIZE, INPUT_SIZE), interpolation=cv2.INTER_AREA)
    input_data = np.expand_dims(img_resized.astype(np.float32) / 255.0, axis=0)
    pred_mask = unet_model.predict(input_data, verbose=0)[0, :, :, 0]
    mask = (pred_mask > MASK_THRESHOLD).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.resize(mask, (image_rgb.shape[1], image_rgb.shape[0]), interpolation=cv2.INTER_NEAREST)
    return clean_mask(mask)

def extract_roi(mask, image_rgb):
    ys, xs = np.where(mask > 0)
    if ys.size == 0:
        return None
    return image_rgb[ys.min():ys.max()+1, xs.min():xs.max()+1]

def split_digits(roi_rgb, num_digits):
    h, w, _ = roi_rgb.shape
    digit_width = max(1, w // num_digits)
    digits = []

    for i in range(num_digits):
        x_start = i * digit_width
        x_end = (i + 1) * digit_width if i < num_digits - 1 else w
        digit_img = roi_rgb[:, x_start:x_end]

        gray = cv2.cvtColor(digit_img, cv2.COLOR_RGB2GRAY)
        _, thresh = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)

        ys, xs = np.where(thresh > 0)
        if ys.size > 0 and xs.size > 0:
            digit_img = gray[ys.min():ys.max()+1, xs.min():xs.max()+1]
            digit_img_resized = cv2.resize(digit_img, (DIGIT_SIZE, DIGIT_SIZE), interpolation=cv2.INTER_AREA)
            digit_img_resized = digit_img_resized.astype(np.float32) / 255.0
            digits.append(digit_img_resized)
        else:
            digits.append(np.zeros((DIGIT_SIZE, DIGIT_SIZE), dtype=np.float32))

    return digits

def predict_digits(digits):
    results = []
    for d in digits:
        input_data = np.expand_dims(d, axis=(0, -1))  # shape (1,64,64,1)
        pred = cnn_model.predict(input_data, verbose=0)
        results.append(int(np.argmax(pred)))
    return results

# ---------------- Process Single Image ----------------
img_orig = cv2.imread(TEST_IMAGE, cv2.IMREAD_COLOR)
if img_orig is None:
    raise FileNotFoundError(f"Cannot read {TEST_IMAGE}")

img_rgb = cv2.cvtColor(img_orig, cv2.COLOR_BGR2RGB)
mask = predict_mask(img_rgb)
roi_cropped = extract_roi(mask, img_rgb)

if roi_cropped is None:
    print("❌ No digits detected.")
else:
    digits = split_digits(roi_cropped, NUM_DIGITS)
    predicted = predict_digits(digits)
    print(f"✅ Predicted digits: {predicted}")

    # ---------------- Display ROI and digits using matplotlib ----------------
    plt.figure(figsize=(10, 4))
    plt.imshow(roi_cropped)
    plt.title("ROI (masked digits)")
    plt.axis('off')
    plt.show()

    for idx, d in enumerate(digits):
        plt.figure(figsize=(2, 2))
        plt.imshow(d, cmap='gray')
        plt.title(f"Digit {idx+1} -> Predicted: {predicted[idx]}")
        plt.axis('off')
        plt.show()
