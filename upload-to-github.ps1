# Script de subida a GitHub para contractOS
# Ejecutar este script desde la carpeta raíz del proyecto

# 1. Inicializar repositorio
git init

# 2. Añadir archivos (respetando .gitignore)
git add .

# 3. Primer commit
git commit -m "Initial commit: Contract Management System with Premium UI and Firebase Integration"

# 4. Configurar rama principal y remoto
git branch -M main
git remote add origin https://github.com/JuanjoPrada/contractOS.git

# 5. Subir código (requiere autenticación)
git push -u origin main
