import cv2

def find_digits(binary_img, min_height=20, min_width=10):
    """
    แยกตัวเลขจาก binary image
    return: list ของ (x, digit_image)
    """
    contours, _ = cv2.findContours(binary_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    digit_rois = []

    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if h >= min_height and w >= min_width:  # กรอง noise เล็ก
            digit = binary_img[y:y+h, x:x+w]
            digit = cv2.resize(digit, (28,28))  # ปรับขนาดสำหรับ CNN
            digit = digit.astype("float32") / 255.0
            digit_rois.append((x, digit))

    # เรียงจากซ้ายไปขวา
    digit_rois = sorted(digit_rois, key=lambda x: x[0])
    return digit_rois
