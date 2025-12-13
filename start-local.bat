@echo off
REM Script pour démarrer le serveur avec les variables d'environnement requises

echo.
echo ===================================================
echo  DEMARRAGE DU SERVEUR JEU .IO EN LOCAL
echo ===================================================
echo.

REM Vérifier que Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERREUR: Node.js n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

REM Afficher les informations
echo 🎮 Mode: Développement Local
echo 🔌 Port: 3000
echo 📧 Email: DÉSACTIVÉ (optionnel)
echo 💾 MongoDB: DÉSACTIVÉ (optionnel)
echo.
echo Visitez: http://localhost:3000
echo.

REM Démarrer le serveur
npm start

pause
