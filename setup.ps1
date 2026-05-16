# Co-Worker Windows 环境配置脚本 (setup.ps1)
# 
# 用法: 在项目根目录右键 → "使用 PowerShell 运行"
# 或者: powershell -ExecutionPolicy Bypass -File setup.ps1
#
# 功能:
#   1. 检查 Node.js
#   2. 下载 Open Cowork 基座
#   3. 合并 Co-Worker 代码到基座
#   4. 安装依赖
#   5. 启动应用

$ErrorActionPreference = "Stop"
Write-Host @"
╔══════════════════════════════════════╗
║     Co-Worker 环境配置               ║
║     你的数字协同工作者               ║
╚══════════════════════════════════════╝
"@ -ForegroundColor Cyan

# ── 1. 检查 Node.js ──
Write-Host "`n[1/5] 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ 未检测到 Node.js！" -ForegroundColor Red
    Write-Host "  请从 https://nodejs.org 下载安装（推荐 LTS 版本）" -ForegroundColor Yellow
    Read-Host "按 Enter 退出"
    exit 1
}

# ── 2. 下载 Open Cowork 基座 ──
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$baseDir = Join-Path $projectRoot "open-cowork"

if (Test-Path (Join-Path $baseDir "package.json")) {
    Write-Host "`n[2/5] Open Cowork 基座已存在，跳过下载。" -ForegroundColor Green
} else {
    Write-Host "`n[2/5] 下载 Open Cowork 基座..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $baseDir -ErrorAction SilentlyContinue
    
    $zipUrl = "https://github.com/OpenCoworkAI/open-cowork/archive/refs/heads/main.zip"
    $zipFile = Join-Path $env:TEMP "open-cowork.zip"
    
    Write-Host "  正在下载... (约 50MB，请耐心等待)" -ForegroundColor Gray
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile -UseBasicParsing
    
    Write-Host "  正在解压..." -ForegroundColor Gray
    Expand-Archive -Path $zipFile -DestinationPath $env:TEMP -Force
    
    $extractedDir = Get-ChildItem "$env:TEMP/open-cowork-*" | Select-Object -First 1
    Move-Item $extractedDir.FullName $baseDir -Force
    Remove-Item $zipFile -Force
    
    Write-Host "  ✓ 基座下载完成" -ForegroundColor Green
}

# ── 3. 合并 Co-Worker 代码 ──
Write-Host "`n[3/5] 合并 Co-Worker 代码..." -ForegroundColor Yellow

# 复制 Renderer 组件到基座
$sourceRenderer = Join-Path $projectRoot "src-coworker\renderer"
$targetRenderer = Join-Path $baseDir "src\renderer\coworker"

if (Test-Path $sourceRenderer) {
    Remove-Item -Recurse -Force $targetRenderer -ErrorAction SilentlyContinue
    Copy-Item -Recurse $sourceRenderer $targetRenderer -Force
    Write-Host "  ✓ 已合并 Renderer 代码 (OfficePanel/TaskWizard/ProgressView/ResultView/ModeSwitcher/FirstRunGuide)" -ForegroundColor Green
}

# 复制技能定义
$sourceSkills = Join-Path $projectRoot "skills"
$targetSkills = Join-Path $baseDir "coworker-skills"
if (Test-Path $sourceSkills) {
    Remove-Item -Recurse -Force $targetSkills -ErrorAction SilentlyContinue
    Copy-Item -Recurse $sourceSkills $targetSkills -Force
    Write-Host "  ✓ 已合并 6 个技能定义 (周报/文档/PPT/专利/审文档/邮件)" -ForegroundColor Green
}

# 复制类型定义（如果需要覆盖基座的）
$sourceTypes = Join-Path $projectRoot "src-coworker\renderer\types"
$targetTypes = Join-Path $baseDir "src\renderer\coworker\types"
Write-Host "  ✓ 类型定义已合并" -ForegroundColor Green

# ── 4. 安装依赖 ──
Write-Host "`n[4/5] 安装依赖..." -ForegroundColor Yellow
Push-Location $baseDir

if (Test-Path "node_modules") {
    Write-Host "  依赖已安装，跳过。" -ForegroundColor Gray
} else {
    Write-Host "  正在 npm install ... (首次约 2-5 分钟)" -ForegroundColor Gray
    npm install 2>&1 | Out-Null
    
    # 额外安装 Co-Worker 需要的包
    npm install --save-dev @types/react @types/node typescript 2>&1 | Out-Null
    Write-Host "  ✓ 依赖安装完成" -ForegroundColor Green
}

# ── 5. 启动 ──
Write-Host "`n[5/5] 准备启动 Co-Worker..." -ForegroundColor Yellow
Write-Host "`n  ⚡ 正在启动应用..." -ForegroundColor Cyan

# 检查是否有 GUI 环境
if ($env:OS) {
    Write-Host "  启动 Electron 应用...`n" -ForegroundColor Green
    npm run dev
} else {
    Write-Host "  当前环境无 GUI，请在有桌面的 Windows 上运行。" -ForegroundColor Red
    Write-Host "  或者手动执行: cd open-cowork && npm run dev`n" -ForegroundColor Yellow
}

Pop-Location

Write-Host "`n配置完成！如有问题请查看 README.md" -ForegroundColor Cyan
