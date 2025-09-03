import os
import cv2
import numpy as np
import pandas as pd
import ast

DATASET_FOLDER = r"C:\Users\Pre-Capstone\backend\python\dataset\images"
CSV_PATH = r"C:\Users\Pre-Capstone\backend\python\dataset\data.csv"
OUTPUT_X_PATH = "X.npy"
OUTPUT_Y_PATH = "y.npy"
IMG_SIZE = (28, 28)
EXPECTED_DIGITS = 7

# --- Load Data ---
df = pd.read_csv(CSV_PATH)

images = []
labels = []

print("Starting dataset preprocessing with filename-based labels...")

# --- Main Processing Loop ---
for idx, row in df.iterrows():
    photo_name = row['photo_name']
    img_path = os.path.join(DATASET_FOLDER, photo_name)
    
    try:
        parts = photo_name.split('_')
        if len(parts) >= 4 and parts[-3] == 'value':
            val_part1 = parts[-2]
            val_part2 = parts[-1].split('.')[0]
            
            reading_str = (val_part1 + val_part2).zfill(EXPECTED_DIGITS)
            reading_digits = list(reading_str)
        else:
            print(f"Warning: Filename '{photo_name}' doesn't match expected format. Skipping.")
            continue
            
    except Exception as e:
        print(f"Error parsing filename '{photo_name}': {e}. Skipping.")
        continue
    
    # Read image in grayscale
    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print(f"Warning: Could not read {img_path}, skipping...")
        continue
    h, w = img.shape
    
    # --- 1. Extract Region of Interest (ROI) ---
    try:
        polygons = ast.literal_eval(row['location'])['data']
        x_coords = [int(p['x'] * w) for p in polygons]
        y_coords = [int(p['y'] * h) for p in polygons]
        x_min, x_max = max(0, min(x_coords)), min(w, max(x_coords))
        y_min, y_max = max(0, min(y_coords)), min(h, max(y_coords))
        digit_region = img[y_min:y_max, x_min:x_max]
    except Exception as e:
        print(f"Error parsing polygon for {photo_name}: {e}. Skipping.")
        continue

    # --- 2. Robust Digit Segmentation using Contours ---
    inverted_region = cv2.bitwise_not(digit_region)
    _, thresh = cv2.threshold(inverted_region, 128, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        bounding_boxes = [cv2.boundingRect(c) for c in contours]
        h_region, w_region = digit_region.shape[:2]
        bounding_boxes = [b for b in bounding_boxes if (h_region * 0.2) < b[3] < (h_region * 1.1) and (w_region * 0.05) < b[2] < (w_region * 0.25)]
        bounding_boxes = sorted(bounding_boxes, key=lambda b: b[0])

    if len(bounding_boxes) != len(reading_digits):
        print(f"Warning: Mismatch for {photo_name}. Found {len(bounding_boxes)} contours but expected {len(reading_digits)} digits. Skipping.")
        continue

    # --- 3. Process Each Detected Digit ---
    for i, box in enumerate(bounding_boxes):
        x, y, w_box, h_box = box
        digit_img = digit_region[y:y+h_box, x:x+w_box]
        
        if digit_img.size == 0: continue

        pad = int(max(h_box, w_box) * 0.15)
        digit_img = cv2.copyMakeBorder(digit_img, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=[255]) # Pad with white

        digit_img = cv2.resize(digit_img, IMG_SIZE)
        digit_img = cv2.bitwise_not(digit_img)

        digit_img = digit_img / 255.0
        digit_img = np.expand_dims(digit_img, axis=-1)

        images.append(digit_img)
        labels.append(int(reading_digits[i]))

# --- Finalize and Save ---
images = np.array(images, dtype=np.float32)
labels = np.array(labels, dtype=np.int32)

print("\n---------------------------------")
print(f"Preprocessing complete.")
print(f"Total digit images created: {len(images)}")
if len(images) > 0:
    print(f"Image shape: {images[0].shape}")
    print(f"Example labels: {labels[:21]}")

np.save(OUTPUT_X_PATH, images)
np.save(OUTPUT_Y_PATH, labels)
print(f"Data saved to {OUTPUT_X_PATH} and {OUTPUT_Y_PATH}")