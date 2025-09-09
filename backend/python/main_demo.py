# ทดสอบใช้โมเดล


from fastapi import FastAPI, File, UploadFile
import numpy as np
import cv2
import os
import base64
import matplotlib.pyplot as plt
import uvicorn
import tensorflow as tf
from tensorflow.keras.models import load_model

app = FastAPI()

UNET_MODEL_PATH = r"model/unet_mask.h5"
CNN_MODEL_PATH  = r"model/cnn_digit_model.keras"

custom_objects = {
    "dice_coefficient": lambda y_true, y_pred, smooth=1.0: 
        (2 * tf.reduce_sum(y_true * y_pred) + smooth) / (tf.reduce_sum(y_true) + tf.reduce_sum(y_pred) + smooth),
    "iou_metric": lambda y_true, y_pred, smooth=1.0: 
        (tf.reduce_sum(y_true * y_pred) + smooth) / (tf.reduce_sum(y_true) + tf.reduce_sum(y_pred) - tf.reduce_sum(y_true * y_pred) + smooth)
}

unet_model = load_model(UNET_MODEL_PATH, custom_objects=custom_objects, compile=False)
cnn_model = load_model(CNN_MODEL_PATH)
cnn_input_h, cnn_input_w = cnn_model.input_shape[1:3]

def apply_mask(image, mask):
    if mask.shape != image.shape[:2]:
        mask = cv2.resize(mask, (image.shape[1], image.shape[0]))
    mask = mask.astype(np.uint8)
    roi = cv2.bitwise_and(image, image, mask=mask)
    return roi

def encode_image_to_base64(image_np):
    image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    _, buffer = cv2.imencode(".png", image_bgr)
    return base64.b64encode(buffer).decode("utf-8")

def decode_base64_to_image(b64_string):
    img_bytes = base64.b64decode(b64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def predict_from_file(file_path):
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    nparr = np.frombuffer(file_bytes, np.uint8)
    img_orig_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_orig_bgr is None:
        raise ValueError("Cannot decode image")
    img_orig_rgb = cv2.cvtColor(img_orig_bgr, cv2.COLOR_BGR2RGB)

    img_resized = cv2.resize(img_orig_rgb, (256, 256))
    input_data = np.expand_dims(img_resized.astype(np.float32) / 255.0, axis=0)

    pred_mask = unet_model.predict(input_data)[0, :, :, 0]
    mask = (pred_mask > 0.3).astype(np.uint8) * 255
    
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    mask_orig_size = cv2.resize(mask, (img_orig_rgb.shape[1], img_orig_rgb.shape[0]), interpolation=cv2.INTER_NEAREST)

    roi_with_black_bg = apply_mask(img_orig_rgb, mask_orig_size)

    ys, xs = np.where(mask_orig_size > 0)
    if len(xs) == 0 or len(ys) == 0:
        raise ValueError("Mask is empty, no digits detected")
    x_min, x_max = xs.min(), xs.max()
    y_min, y_max = ys.min(), ys.max()
    
    roi_cropped = roi_with_black_bg[y_min:y_max+1, x_min:x_max+1]

    h, w, _ = roi_cropped.shape
    num_digits = 7
    digit_width = w // num_digits
    digit_rois = []

    for i in range(num_digits):
        x_start = i * digit_width
        x_end = (i + 1) * digit_width if i < num_digits - 1 else w
        digit_img = roi_cropped[:, x_start:x_end]
        
        digit_resized = cv2.resize(digit_img, (cnn_input_w, cnn_input_h), interpolation=cv2.INTER_AREA)
        digit_norm = digit_resized.astype(np.float32) / 255.0
        digit_rois.append(digit_norm)

    predicted_digits = []
    predictions_info = []
    for idx, digit_norm in enumerate(digit_rois):
        input_digit = np.expand_dims(digit_norm, axis=0)
        pred = cnn_model.predict(input_digit, verbose=0)
        probs = pred[0]
        digit_idx = int(np.argmax(probs))
        digit_value = str(digit_idx)
        confidence = float(probs[digit_idx])

        predicted_digits.append(digit_value)
        predictions_info.append({
            "digit_index": idx,
            "predicted_value": digit_value,
            "confidence": confidence,
            "probabilities": probs.tolist()
        })

    meter_value = "".join(predicted_digits)

    mask_b64 = encode_image_to_base64(np.stack([mask_orig_size]*3, axis=-1))
    roi_cropped_b64 = encode_image_to_base64(roi_cropped)

    # คำนวณ confidence รวม
    all_confidences = [d["confidence"] for d in predictions_info]
    avg_confidence = float(np.mean(all_confidences))
    min_confidence = float(np.min(all_confidences))

    return {
        "meter_value": meter_value,
        "digits_detected": len(predicted_digits),
        "mask_base64": mask_b64,
        "roi_cropped_base64": roi_cropped_b64,
        "digits_info": predictions_info,
        "overall_confidence": {
            "average": avg_confidence,
            "minimum": min_confidence,
        }
    }

if __name__ == "__main__":
    test_file = r"C:\Users\umdan\Pre-Capstone\backend\python\uploads\test_meter.jpg"
    
    result = predict_from_file(test_file)
    
    print(f"Predicted Meter Value: {result['meter_value']}")
    print("\nDigits detail:")
    for d in result["digits_info"]:
        print(f"  Digit {d['digit_index']+1}: {d['predicted_value']} "
            f"(confidence={d['confidence']:.2f})")

    print("\nOverall confidence:")
    print(f"  Average : {result['overall_confidence']['average']:.2f}")
    print(f"  Minimum : {result['overall_confidence']['minimum']:.2f}")

    mask_image = decode_base64_to_image(result['mask_base64'])
    roi_image = decode_base64_to_image(result['roi_cropped_base64'])

    plt.figure(figsize=(20, 6))

    plt.subplot(2, 5, 1)
    plt.imshow(cv2.cvtColor(mask_image, cv2.COLOR_BGR2RGB))
    plt.title("Predicted Mask")
    plt.axis('off')

    plt.subplot(2, 5, 2)
    plt.imshow(cv2.cvtColor(roi_image, cv2.COLOR_BGR2RGB))
    plt.title("Cropped ROI")
    plt.axis('off')

    h, w, _ = roi_image.shape
    num_digits = 7
    digit_width = w // num_digits

    for i in range(num_digits):
        x_start = i * digit_width
        x_end = (i + 1) * digit_width if i < num_digits - 1 else w
        digit_img = roi_image[:, x_start:x_end]
        plt.subplot(2, 5, i + 3)
        plt.imshow(cv2.cvtColor(digit_img, cv2.COLOR_BGR2RGB))
        plt.title(f"Digit {i+1}")
        plt.axis('off')

    plt.tight_layout()
    plt.show()
