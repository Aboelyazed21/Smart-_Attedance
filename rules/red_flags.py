# داخل ملف rules/red_flags.py

def generate_flags(student_data):
    """
    تقييم بيانات الطالب أو ميزاته واستخراج العلامات الحمراء (Red Flags).
    """
    flags = []
    
    # مثال على القواعد: معدل غياب مرتفع
    if student_data.get("absence_rate", 0) > 0.25:
        flags.append("High absence rate exceeding 25%")
        
    # مثال: محاولات QR فاشلة متكررة
    if student_data.get("failed_qr_attempts", 0) > 3:
        flags.append("Frequent failed QR scan attempts")
        
    # مثال: تأخير متكرر
    if student_data.get("late_rate", 0) > 0.2:
        flags.append("Frequent late arrivals")
        
    return flags