@echo off
chcp 65001 >nul
echo.
echo 📱 התקנת אתר משלחת דנמרק למובייל
echo =====================================
echo.

REM יצירת תיקייה במסמכים
set INSTALL_DIR=%USERPROFILE%\Documents\משלחת-דנמרק
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo העתקת קבצים...
xcopy /E /I /Y "%~dp0*" "%INSTALL_DIR%\" >nul

REM יצירת קיצור דרך על שולחן העבודה
set DESKTOP=%USERPROFILE%\Desktop
echo יצירת קיצור דרך על שולחן העבודה...

echo [InternetShortcut] > "%DESKTOP%\משלחת דנמרק.url"
echo URL=file:///%INSTALL_DIR:\=/%/index.html >> "%DESKTOP%\משלחת דנמרק.url"
echo IconFile=%INSTALL_DIR%\image\מאני טיים- לוגו-דנמרק.png >> "%DESKTOP%\משלחת דנמרק.url"

echo.
echo ✅ ההתקנה הושלמה בהצלחה!
echo.
echo 📂 האתר הותקן ב: %INSTALL_DIR%
echo 🖥️ קיצור דרך נוצר על שולחן העבודה
echo.
echo לפתיחת האתר:
echo 1. לחץ על "משלחת דנמרק" בשולחן העבודה
echo 2. או פתח את התיקייה ולחץ על index.html
echo.
echo 📱 למובייל: העבר את התיקייה לטלפון ופתח את index.html
echo.
pause