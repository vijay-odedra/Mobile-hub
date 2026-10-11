const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sqliteReleaseDir = path.join(rootDir, 'node_modules', 'sqlite3', 'build', 'Release');
const currentSqlite = path.join(sqliteReleaseDir, 'node_sqlite3.node');
const linuxSqliteBackup = path.join(sqliteReleaseDir, 'node_sqlite3.node.linux');
const winSqlite = path.join(rootDir, 'build', 'win32-x64', 'build', 'Release', 'node_sqlite3.node');

console.log('🚀 Starting Windows Setup Installer (.exe) build for Stockly...');

// 1. Build React frontend with Vite
console.log('📦 Building React frontend with Vite...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

// 2. Ensure Windows icon exists
if (!fs.existsSync(path.join(rootDir, 'build', 'icon.ico'))) {
  console.log('🎨 Generating Windows icon...');
  execSync('python3 scripts/build-win-icon.py', { cwd: rootDir, stdio: 'inherit' });
}

// 3. Swap in Windows sqlite3 binary
let swapped = false;
if (fs.existsSync(winSqlite) && fs.existsSync(sqliteReleaseDir)) {
  console.log('🔀 Preparing Windows SQLite3 native binary...');
  if (!fs.existsSync(linuxSqliteBackup) && fs.existsSync(currentSqlite)) {
    fs.copyFileSync(currentSqlite, linuxSqliteBackup);
  }
  fs.copyFileSync(winSqlite, currentSqlite);
  swapped = true;
} else {
  console.warn('⚠️ Windows sqlite3 binary not found at build/win32-x64, building with default modules.');
}

try {
  // 4. Run electron-builder
  console.log('🔨 Packaging Windows NSIS Setup Installer with electron-builder...');
  execSync('npx electron-builder --win nsis --x64', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Electron Builder packaging complete!');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exitCode = 1;
} finally {
  // 5. Restore Linux binary
  if (swapped && fs.existsSync(linuxSqliteBackup)) {
    console.log('🔄 Restoring Linux SQLite3 native binary for local development...');
    fs.copyFileSync(linuxSqliteBackup, currentSqlite);
  }
}

// 6. Check output in release directory and copy to windows-installer
const releaseDir = path.join(rootDir, 'release');
const installerDir = path.join(rootDir, 'windows-installer');
if (!fs.existsSync(installerDir)) fs.mkdirSync(installerDir, { recursive: true });

if (fs.existsSync(releaseDir)) {
  const files = fs.readdirSync(releaseDir);
  const exeFiles = files.filter(f => f.endsWith('.exe') && !f.includes('uninstaller'));
  console.log('\n=============================================');
  console.log('🎉 WINDOWS SETUP INSTALLER BUILD RESULT:');
  console.log('Output Directory:', releaseDir);
  // Copy the single NSIS installer as Stockly-Setup.exe
  const setupExe = exeFiles.find(f => f.includes('Setup') || f.includes('Stockly'));
  if (setupExe) {
    const srcFile = path.join(releaseDir, setupExe);
    const destFile = path.join(installerDir, 'Stockly-Setup.exe');
    fs.copyFileSync(srcFile, destFile);
    // Also keep Stockly-windows.exe as single executable
    fs.copyFileSync(srcFile, path.join(installerDir, 'Stockly-windows.exe'));
    const stats = fs.statSync(destFile);
    console.log(`- File: ${setupExe} -> Copied to windows-installer/Stockly-Setup.exe (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
  }

  // Copy single database-and-config folder
  function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(item => {
      const s = path.join(src, item);
      const d = path.join(dest, item);
      if (fs.lstatSync(s).isDirectory()) copyDir(s, d);
      else fs.copyFileSync(s, d);
    });
  }
  copyDir(path.join(rootDir, 'database-and-config'), path.join(installerDir, 'database-and-config'));
  if (fs.existsSync(path.join(releaseDir, 'Stockly.apk'))) {
    fs.copyFileSync(path.join(releaseDir, 'Stockly.apk'), path.join(installerDir, 'Stockly.apk'));
  }
  if (fs.existsSync(path.join(releaseDir, 'Stockly-Windows-Portable.zip'))) {
    fs.copyFileSync(path.join(releaseDir, 'Stockly-Windows-Portable.zip'), path.join(installerDir, 'Stockly-Windows-Portable.zip'));
  }
  if (fs.existsSync(path.join(releaseDir, 'Start-Stockly.bat'))) {
    fs.copyFileSync(path.join(releaseDir, 'Start-Stockly.bat'), path.join(installerDir, 'Start-Stockly.bat'));
  }
  copyDir(path.join(releaseDir, 'win-unpacked'), path.join(installerDir, 'win-unpacked'));
  console.log('📁 Synchronized database-and-config and Stockly.apk in windows-installer/');
  console.log('=============================================\n');
}
