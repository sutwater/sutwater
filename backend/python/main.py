from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.models import load_model
import os

UNET_MODEL_PATH = r"C:\Users\umdan\Pre-Capstone\backend\python\model\unet_meter_model_cpu_fast.h5"
CNN_MODEL_PATH  = r"C:\Users\umdan\Pre-Capstone\backend\python\model\digit_cnn_best copy.h5"

MASK_THRESHOLD = 0.3
NUM_DIGITS = 7
INPUT_SIZE = 256
DIGIT_SIZE = 64

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
    return clean_mask(cv2.resize(mask, (image_rgb.shape[1], image_rgb.shape[0]), interpolation=cv2.INTER_NEAREST))

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
        x_start, x_end = i * digit_width, (i + 1) * digit_width if i < num_digits - 1 else w
        digit_img = cv2.cvtColor(roi_rgb[:, x_start:x_end], cv2.COLOR_RGB2GRAY)
        _, thresh = cv2.threshold(digit_img, 250, 255, cv2.THRESH_BINARY_INV)
        ys, xs = np.where(thresh > 0)
        if ys.size > 0:
            digit_img = digit_img[ys.min():ys.max()+1, xs.min():xs.max()+1]
        digit_resized = cv2.resize(digit_img, (DIGIT_SIZE, DIGIT_SIZE), interpolation=cv2.INTER_AREA)
        digits.append(digit_resized.astype(np.float32) / 255.0)
    return digits

def predict_digits(digits):
    results = []
    for d in digits:
        if cnn_model.input_shape[-1] == 1:
            input_data = np.expand_dims(d, axis=(0, -1))
        else:
            input_data = np.expand_dims(np.stack([d,d,d], axis=-1), axis=0)
        pred = cnn_model.predict(input_data, verbose=0)[0]
        digit = int(np.argmax(pred))
        confidence = float(np.max(pred))
        results.append((digit, confidence))
    return results

app = FastAPI(title="Meter Reader API", version="2.0")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        img_bytes = await file.read()
        img_array = np.frombuffer(img_bytes, np.uint8)
        img_orig = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img_orig is None:
            raise ValueError("Invalid image")

        img_rgb = cv2.cvtColor(img_orig, cv2.COLOR_BGR2RGB)
        mask = predict_mask(img_rgb)
        roi = extract_roi(mask, img_rgb)
        if roi is None:
            return JSONResponse(content={"error": "NO_DIGITS"})

        digits = split_digits(roi, NUM_DIGITS)
        results = predict_digits(digits)

        meter_value = "".join(str(d[0]) for d in results)
        confidences = [d[1] for d in results]

        return JSONResponse({
            "meter_value": meter_value,
            "confidences": confidences,
            "overall_confidence": {
                "average": float(np.mean(confidences)),
                "minimum": float(np.min(confidences))
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
