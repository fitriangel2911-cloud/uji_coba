@echo off
echo.
echo =======================================================
echo          IQ-RA SYSTEM - AUTO COMMIT ^& PUSH
echo =======================================================
echo.
echo Menambahkan seluruh perubahan...
git add .
echo.
echo Melakukan commit...
git commit -am "Fix modal scrolling, button cursor pointer, and duplicate unique code rendering in admin"
echo.
echo Melakukan push ke GitHub...
git push
echo.
echo =======================================================
echo          BERHASIL! Semua perubahan disimpan.
echo =======================================================
echo.
pause
