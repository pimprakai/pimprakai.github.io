@echo off
chcp 65001 > nul
echo =========================================
echo  กำลังอัปโหลดสื่อการเรียนรู้แบบรูป ป.3 ขึ้น GitHub
echo =========================================
echo.

:: 1. Initialize git if not already initialized
if not exist .git (
    echo [1/4] เริ่มต้น Git Repository...
    git init
    git remote add origin https://github.com/pimprakai/pimprakai.github.io.git
) else (
    echo [1/4] Git Repository ถูกเริ่มต้นไว้แล้ว...
)

:: 2. Add files
echo [2/4] กำลังเตรียมไฟล์อัปโหลด...
git add .

:: 3. Commit files
echo [3/4] กำลังบันทึกประวัติการพัฒนา (Commit)...
git commit -m "Initial commit: สื่อการเรียนรู้แบบรูป ป.3"

:: 4. Push to Main branch
echo [4/4] กำลังอัปโหลดไฟล์ขึ้น GitHub...
git branch -M main
git push -u origin main

echo.
echo =========================================
echo  อัปโหลดสำเร็จแล้ว! กรุณาตรวจสอบหน้าเว็บที่:
echo  https://pimprakai.github.io/
echo =========================================
echo.
pause
