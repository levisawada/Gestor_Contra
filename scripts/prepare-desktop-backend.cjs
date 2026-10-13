const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[desktop-builder] 1/3 Compilando backend TypeScript...');
execSync('npm run build --workspace=backend', { stdio: 'inherit' });

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'frontend', 'src-tauri', 'server');

console.log('[desktop-builder] 2/3 Preparando carpeta de servidor autónomo en:', serverDir);
if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
}

// 1. Copiar node.exe
const nodeExePath = process.execPath;
const targetNodeExe = path.join(serverDir, 'node.exe');
console.log(`[desktop-builder] Copiando runtime Node (${nodeExePath}) -> ${targetNodeExe}`);
fs.copyFileSync(nodeExePath, targetNodeExe);

// 2. Copiar backend/dist
const distSource = path.join(rootDir, 'backend', 'dist');
const distTarget = path.join(serverDir, 'dist');
fs.cpSync(distSource, distTarget, { recursive: true, force: true });

// 3. Copiar backend/package.json e instalar dependencias no-hoisted completas
const pkgSource = path.join(rootDir, 'backend', 'package.json');
const pkgTarget = path.join(serverDir, 'package.json');
fs.copyFileSync(pkgSource, pkgTarget);

console.log('[desktop-builder] Asegurando dependencias de producción completas en server/node_modules...');
execSync(`npm install --omit=dev --prefix "${serverDir}"`, { stdio: 'inherit' });

// Eliminar carpeta .bin para evitar problemas de enlaces simbólicos en Windows
const binDir = path.join(serverDir, 'node_modules', '.bin');
if (fs.existsSync(binDir)) {
    fs.rmSync(binDir, { recursive: true, force: true });
}

// 4. Copiar backend/.env si existe
const envSource = path.join(rootDir, 'backend', '.env');
const envTarget = path.join(serverDir, '.env');
if (fs.existsSync(envSource)) {
    fs.copyFileSync(envSource, envTarget);
}

console.log('[desktop-builder] 3/3 Backend empaquetado listo para Tauri.');
