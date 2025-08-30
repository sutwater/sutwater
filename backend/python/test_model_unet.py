import os
import cv2
import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.models import load_model
import tensorflow as tf
from pathlib import Path

MODEL_PATHS = ["unet_final.h5"]
IMAGES_DIR = "images_unet_test"
IMAGE_SIZE = (256, 256)
THRESHOLD = 0.3
KERNEL_SIZE = (3,3)
OUTPUT_DIR = "unet_images_masks"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# หาไฟล์โมเดลที่มีอยู่จริง
MODEL_PATH = next((path for path in MODEL_PATHS if os.path.exists(path)), None)
if MODEL_PATH is None:
    raise FileNotFoundError(f"ไม่พบไฟล์โมเดล! ตรวจสอบไฟล์: {MODEL_PATHS}")

def dice_coefficient(y_true, y_pred, smooth=1.0):
    y_true_f = tf.reshape(y_true, [-1])
    y_pred_f = tf.reshape(y_pred, [-1])
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    return (2. * intersection + smooth) / (tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) + smooth)

def iou_metric(y_true, y_pred, smooth=1.0):
    y_true_f = tf.reshape(y_true, [-1])
    y_pred_f = tf.reshape(y_pred, [-1])
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    union = tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) - intersection
    return (intersection + smooth) / (union + smooth)

model = load_model(MODEL_PATH, 
                   custom_objects={"dice_coefficient": dice_coefficient,
                                   "iou_metric": iou_metric},
                   compile=False)
print(f"Loaded model from {MODEL_PATH}")

image_files = sorted(Path(IMAGES_DIR).glob("*.*"))

for img_path in image_files:
    img = cv2.imread(str(img_path))
    if img is None:
        print(f"ไม่สามารถอ่านไฟล์: {img_path}")
        continue

    # RGB + CLAHE
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    l = clahe.apply(l)
    lab = cv2.merge((l,a,b))
    img = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

    # Resize + normalize
    img_resized = cv2.resize(img, IMAGE_SIZE)
    img_norm = img_resized.astype(np.float32)/255.0
    input_data = np.expand_dims(img_norm, axis=0)

    # Predict mask
    pred = model.predict(input_data)[0,:,:,0]
    mask = (pred > THRESHOLD).astype(np.uint8) * 255

    # Morphology
    kernel = np.ones(KERNEL_SIZE, np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    # Save mask
    output_path = os.path.join(OUTPUT_DIR, f"{img_path.stem}_mask.png")
    cv2.imwrite(output_path, mask)
    print(f"Saved mask for {img_path.name} → {output_path}")

print("Processing done.")
