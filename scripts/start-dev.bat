@echo off
echo ========================================
echo   Démarrage du serveur de développement
echo ========================================
echo.
echo Configuration CORS:
echo - Mode développement: Utilise le proxy Vite (/api -> backend)
echo - Mode production: Utilise l'URL directe du backend
echo.
echo Redémarrage du serveur...
echo.

npm run dev

pause
