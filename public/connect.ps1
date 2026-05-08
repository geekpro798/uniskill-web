# UniSkill MCP Connector for Windows (PowerShell) — Local Agent Signing Mode
# Usage: irm https://uniskill.ai/connect.ps1 | iex
# Or:    irm https://uniskill.ai/connect.ps1 -OutFile connect.ps1; .\connect.ps1 -Session .\my_session.json

param(
    [string]$Session = "",
    [string]$Data = ""
)

# ── Colors / Banner ───────────────────────────────────────────────────────────
function Write-Color($Text, $Color = "Cyan") { Write-Host $Text -ForegroundColor $Color }

Write-Host ""
Write-Color "╔══════════════════════════════════════════════════════╗"
Write-Color "║      ⚡  UniSkill MCP Connector  v3.0  (Windows)     ║"
Write-Color "╚══════════════════════════════════════════════════════╝"
Write-Host ""

# ── Find session.json ─────────────────────────────────────────────────────────

if ($Data) {
    Write-Host "🔍 Processing inline Base64 data (Quick Connect)..."
    $uniskillDir = "$env:USERPROFILE\.uniskill"
    if (-not (Test-Path $uniskillDir)) {
        New-Item -ItemType Directory -Force -Path $uniskillDir | Out-Null
    }
    $sessionFile = "$uniskillDir\session.json"
    $bytes = [System.Convert]::FromBase64String($Data)
    $jsonString = [System.Text.Encoding]::UTF8.GetString($bytes)
    $jsonString | Out-File -FilePath $sessionFile -Encoding utf8 -Force
    Write-Color "  ✔ Saved Quick Connect session data." "Green"
} else {
    Write-Host "🔍 Searching for session key..."
    
    $candidates = @(
        $Session,
        ".\uniskill_session.json",
        "$env:USERPROFILE\Downloads\uniskill_session.json",
        "$env:USERPROFILE\.uniskill\session.json"
    )
    
    $sessionFile = ""
    foreach ($f in $candidates) {
        if ([string]::IsNullOrWhiteSpace($f)) { continue }
        if (Test-Path $f -PathType Leaf) {
            $sessionFile = Resolve-Path $f
            break
        }
    }
    
    if (-not $sessionFile) {
        Write-Color "❌ uniskill_session.json not found!" "Red"
        Write-Host ""
        Write-Color "To get a session key:" "White"
        Write-Host "  1. Log in to https://uniskill.ai"
        Write-Host "  2. Go to Settings → Account & Security → Local Agent Access"
        Write-Host "  3. Click `"Generate Session Key`" and download the file."
        Write-Host "  4. Run this script again in the folder where you downloaded it."
        Write-Host ""
        exit 1
    }
    
    Write-Color "  ✔ Found session file at: $sessionFile" "Green"
}

# ── Validate session.json ────────────────────────────────────────────────────
try {
    $sessionData = Get-Content $sessionFile -Raw | ConvertFrom-Json
} catch {
    Write-Color "❌ Invalid session.json (not a valid JSON)" "Red"
    exit 1
}

if (-not $sessionData.expiresAt) {
    Write-Color "❌ Invalid session.json (missing expiresAt)" "Red"
    exit 1
}

$nowMs = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
if ($nowMs -gt $sessionData.expiresAt) {
    Write-Color "❌ This Session Key has expired." "Red"
    Write-Host "Please generate a new one from the UniSkill Dashboard."
    exit 1
}

# ── Check Node.js ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔍 Checking Node.js environment..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Color "❌ Node.js is not installed." "Red"
    Write-Host "UniSkill Local Proxy requires Node.js >= 18."
    Write-Color "Visit: https://nodejs.org to install it." "Cyan"
    exit 1
}

$nodeVerStr = (node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
$nodeVer = [int]$nodeVerStr

if ($nodeVer -lt 18) {
    Write-Color "❌ Node.js version is too old (v$nodeVerStr)." "Red"
    Write-Host "UniSkill Local Proxy requires Node.js >= 18."
    exit 1
}
Write-Color "  ✔ Node.js v$nodeVerStr detected." "Green"

# ── Setup ~/.uniskill directory ───────────────────────────────────────────────
$uniskillDir = "$env:USERPROFILE\.uniskill"
if (-not (Test-Path $uniskillDir)) {
    New-Item -ItemType Directory -Path $uniskillDir -Force | Out-Null
}

$targetSession = "$uniskillDir\session.json"
if ($sessionFile -is [System.Management.Automation.PathInfo]) {
    $srcPath = $sessionFile.Path
} else {
    $srcPath = $sessionFile
}

if ($srcPath -ne $targetSession) {
    Copy-Item -Path $srcPath -Destination $targetSession -Force
    Write-Color "  ✔ Session key saved to $targetSession" "Green"
}

# Clean up old port file if exists
$activePortFile = "$uniskillDir\active_port"
if (Test-Path $activePortFile) {
    Remove-Item $activePortFile -Force
}

# ── Download Proxy Engine ────────────────────────────────────────────────────
Write-Host "`n⬇️  Downloading Proxy Engine..."
$proxyFile = "$uniskillDir\proxy.js"
try {
    Invoke-WebRequest -Uri "https://uniskill.ai/proxy.js" -OutFile $proxyFile -UseBasicParsing -ErrorAction Stop
    Write-Color "  ✔ Proxy engine downloaded successfully." "Green"
} catch {
    Write-Color "❌ Failed to download proxy.js. Please check your network connection." "Red"
    exit 1
}

# ── Setup Autostart via VBS ───────────────────────────────────────────────────
Write-Host "`n⚙️  Configuring autostart..."

$startupFolder = [Environment]::GetFolderPath('Startup')
$vbsPath = Join-Path $startupFolder "UniSkillProxy.vbs"

$nodePath = (Get-Command node).Source
$proxyPath = "$uniskillDir\proxy.js"

$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run `"$nodePath`" `"$proxyPath`"", 0, False
"@
Set-Content -Path $vbsPath -Value $vbsContent -Encoding UTF8

Write-Color "  ✔ User Startup script created (Hidden background process)." "Green"

# Restart proxy: kill existing node instances running proxy.js, then start new one
Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -match "proxy.js" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Process "wscript.exe" -ArgumentList "`"$vbsPath`"" -WindowStyle Hidden
Write-Color "  ✔ Proxy started in background." "Green"

# ── Wait for Active Port ──────────────────────────────────────────────────────
Write-Host "`n⏳ Waiting for proxy to start..." -NoNewline

$maxTries = 30
$tries = 0
$activePort = ""

while ($tries -lt $maxTries) {
    if (Test-Path $activePortFile) {
        $activePort = Get-Content $activePortFile -Raw
        $activePort = $activePort.Trim()
        break
    }
    Start-Sleep -Milliseconds 500
    $tries++
}

if (-not $activePort) {
    Write-Host ""
    Write-Color "❌ Proxy failed to start or write active_port within 15 seconds." "Red"
    Write-Host "Check logs at: $uniskillDir\proxy.log"
    exit 1
}

Write-Color " ✔ Running on port $activePort" "Green"
$PROXY_URL = "http://localhost:$activePort/v1/mcp/sse"

# ── Client Config Injection ───────────────────────────────────────────────────
Write-Host "`n💻 Injecting MCP configs...`n"

function Merge-McpConfig($ConfigPath, $RootKey = "mcpServers", $ClientName = "") {
    $dir = Split-Path $ConfigPath -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    if (-not (Test-Path $ConfigPath)) {
        $cfg = @{ $RootKey = @{ uniskill = @{ url = $PROXY_URL } } }
        Write-Color "   ✔ Created: $ConfigPath ($ClientName)" "Green"
    } else {
        try {
            $cfg = Get-Content $ConfigPath -Raw | ConvertFrom-Json -AsHashtable
        } catch {
            $cfg = @{}
        }
        if (-not $cfg.ContainsKey($RootKey)) { $cfg[$RootKey] = @{} }
        if (-not $cfg[$RootKey].ContainsKey("uniskill")) { $cfg[$RootKey]["uniskill"] = @{} }
        
        $cfg[$RootKey]["uniskill"]["url"] = $PROXY_URL
        
        # Remove legacy headers if they exist
        if ($cfg[$RootKey]["uniskill"].ContainsKey("headers")) {
            $cfg[$RootKey]["uniskill"].Remove("headers")
        }

        Write-Color "   ✔ Updated: $ConfigPath ($ClientName)" "Green"
    }

    $cfg | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath -Encoding UTF8
    return $true
}

$injected = $false

# 1. Claude Desktop
$claudeConfig = "$env:APPDATA\Claude\claude_desktop_config.json"
if (Test-Path "$env:APPDATA\Claude") {
    $injected = Merge-McpConfig $claudeConfig "mcpServers" "Claude Desktop"
}

# 2. Cursor
$cursorConfig = "$env:USERPROFILE\.cursor\mcp.json"
if (Test-Path "$env:USERPROFILE\.cursor") {
    $injected = Merge-McpConfig $cursorConfig "mcpServers" "Cursor"
}

# 3. Windsurf
$windsurfConfig = "$env:APPDATA\Codeium\windsurf\mcp_config.json"
if (Test-Path "$env:APPDATA\Codeium\windsurf") {
    $injected = Merge-McpConfig $windsurfConfig "mcpServers" "Windsurf"
}

# 4. Zed (Windows Data Path)
$zedConfig = "$env:LOCALAPPDATA\Zed\settings.json"
if (Test-Path "$env:LOCALAPPDATA\Zed") {
    # Note: Pass "context_servers" as the root key for Zed
    $injected = Merge-McpConfig $zedConfig "context_servers" "Zed"
}

if (-not $injected) {
    Write-Color "  ⚠️  No desktop AI client detected. Run them once to initialize their config folders." "Yellow"
}

# ── Workspace Local Config (EasyClaw, etc.) ──────────────────────────────────
$workspaceConfig = "$PWD\.mcp.json"
$dummy = Merge-McpConfig $workspaceConfig "mcpServers" "Current Workspace"

# Handle .gitignore to prevent accidental commits
$gitignorePath = "$PWD\.gitignore"
$gitDir = "$PWD\.git"
if (Test-Path $gitignorePath) {
    $content = Get-Content $gitignorePath -Raw
    if ($content -notmatch '(?m)^\.mcp\.json$') {
        Add-Content -Path $gitignorePath -Value ".mcp.json" -Encoding UTF8
        Write-Color "   ✔ Appended .mcp.json to .gitignore" "Green"
    }
} elseif (Test-Path $gitDir) {
    Set-Content -Path $gitignorePath -Value ".mcp.json" -Encoding UTF8
    Write-Color "   ✔ Created .gitignore and added .mcp.json" "Green"
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Color "✅  UniSkill Superbrain is now securely connected!" "Green"
Write-Host ""
Write-Color "🚀 NEXT STEPS:" "Yellow"
Write-Host "  1. Restart your AI client (Claude / Cursor / Windsurf / Zed)."
Write-Host '  2. Ask it: "What is the real-time weather in Tokyo?"'
Write-Host "  3. Watch UniSkill tools appear automatically."
Write-Host ""
Write-Color "══════════════════════════════════════════════════════" "Cyan"
Write-Host ""
