@echo off
echo Démarrage de Chrome avec CORS désactivé...
start chrome.exe --user-data-dir="C:/chrome-dev-session" --disable-web-security --disable-features=VizDisplayCompositor --allow-running-insecure-content --disable-site-isolation-trials
echo Chrome démarré avec CORS désactivé
echo Vous pouvez maintenant ouvrir http://localhost:3000
