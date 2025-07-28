import cv2
import os

# กำหนด path ของโฟลเดอร์ที่เก็บไฟล์ภาพ
input_folder = r"C:\Users\User\Desktop\Pre-Capstone\image processing\image"  # ใช้ path ที่สมบูรณ์
output_folder = r"C:\Users\User\Desktop\Pre-Capstone\image processing\GrayScale"

# ตรวจสอบว่าโฟลเดอร์ input มีอยู่จริงหรือไม่
if not os.path.exists(input_folder):
    print(f"ไม่พบโฟลเดอร์: {input_folder}")
else:
    # สร้างโฟลเดอร์ output ถ้ายังไม่มี
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # ลูปผ่านไฟล์ทั้งหมดในโฟลเดอร์
    for filename in os.listdir(input_folder):
        # ตรวจสอบว่าเป็นไฟล์ภาพหรือไม่
        if filename.endswith(".jpg") or filename.endswith(".png"):  # หรือกำหนดไฟล์ประเภทอื่นๆ
            file_path = os.path.join(input_folder, filename)

            # อ่านภาพและแปลงเป็นขาวดำ (grayscale)
            img = cv2.imread(file_path, 0)

            if img is None:
                print(f"ไม่สามารถโหลดไฟล์ภาพ: {filename}")
            else:
                # บันทึกภาพที่แปลงเป็นขาวดำ
                output_filename = os.path.join(output_folder, f"grayscale_{filename}")
                cv2.imwrite(output_filename, img)

                print(f"บันทึกผลลัพธ์ที่: {output_filename}")
