# UniSkill MCP Connector for Windows (PowerShell)
# Usage: $env:UNISKILL_KEY="us-xxx"; irm https://uniskill.ai/connect.ps1 | iex
# Or:    irm https://uniskill.ai/connect.ps1 -OutFile connect.ps1; .\connect.ps1 <YOUR_KEY>

param(
    [string]$ApiKey = $env:UNISKILL_KEY
)

$MCP_SSE_URL = "https://api.uniskill.ai/v1/mcp/sse"
$DASHBOARD_URL = "https://uniskill.ai/dashboard"

# ── Colors / Banner ───────────────────────────────────────────────────────────
function Write-Color($Text, $Color = "Cyan") { Write-Host $Text -ForegroundColor $Color }

Write-Host ""
Write-Color "╔══════════════════════════════════════════════════════╗"
Write-Color "║      ⚡  UniSkill MCP Connector  v2.0  (Windows)     ║"
Write-Color "╚══════════════════════════════════════════════════════╝"
Write-Host ""

# ── API Key Check ─────────────────────────────────────────────────────────────
if (-not $ApiKey) {
    Write-Color "📋 No API Key provided — please enter it now." "Cyan"
    Write-Host "   (Find it at: $DASHBOARD_URL)"
    $ApiKey = Read-Host "🔑 Enter your UniSkill API Key"
    if (-not $ApiKey) {
        Write-Color "❌ No API Key entered. Aborting." "Red"
        exit 1
    }
}

$maskedKey = "$($ApiKey.Substring(0, [Math]::Min(7, $ApiKey.Length)))...$($ApiKey.Substring([Math]::Max(0, $ApiKey.Length - 4)))"

# ── Key Validation ────────────────────────────────────────────────────────────
Write-Host "🔐 Verifying API Key $maskedKey... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://api.uniskill.ai/v1/auth/verify" `
        -Headers @{ "Authorization" = "Bearer $ApiKey" } `
        -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
    Write-Color "SUCCESS ✅" "Green"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Color "FAILED ❌" "Red"
        Write-Color "⚠️  Invalid API Key. Get yours at: $DASHBOARD_URL" "Yellow"
        exit 1
    } else {
        Write-Color "⚠️  Network timeout — proceeding anyway." "Yellow"
    }
}

# ── MCP Config Block ──────────────────────────────────────────────────────────
$mcpEntry = @{
    url     = $MCP_SSE_URL
    headers = @{ Authorization = "Bearer $ApiKey" }
}

function Merge-McpConfig($ConfigPath) {
    $dir = Split-Path $ConfigPath -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    if (-not (Test-Path $ConfigPath)) {
        $cfg = @{ mcpServers = @{ uniskill = $mcpEntry } }
    } else {
        try {
            $cfg = Get-Content $ConfigPath -Raw | ConvertFrom-Json -AsHashtable
        } catch {
            $cfg = @{}
        }
        if (-not $cfg.ContainsKey("mcpServers")) { $cfg["mcpServers"] = @{} }
        $cfg["mcpServers"]["uniskill"] = $mcpEntry
    }

    $cfg | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath -Encoding UTF8
    Write-Color "   ✔ Updated: $ConfigPath" "Green"
    return $true
}

# ── Client Detection ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔍 Scanning for AI clients..."
Write-Host ""
$injected = $false

# Claude Desktop
$claudeConfig = "$env:APPDATA\Claude\claude_desktop_config.json"
if (Test-Path "$env:APPDATA\Claude") {
    Write-Color "  → Claude Desktop detected" "Cyan"
    $injected = Merge-McpConfig $claudeConfig
}

# Cursor
$cursorConfig = "$env:USERPROFILE\.cursor\mcp.json"
if (Test-Path "$env:USERPROFILE\.cursor") {
    Write-Color "  → Cursor detected" "Cyan"
    $injected = Merge-McpConfig $cursorConfig
}

# Windsurf
$windsurfConfig = "$env:APPDATA\Codeium\windsurf\mcp_config.json"
if (Test-Path "$env:APPDATA\Codeium\windsurf") {
    Write-Color "  → Windsurf detected" "Cyan"
    $injected = Merge-McpConfig $windsurfConfig
}

# Fallback: write .env in current directory
if (-not $injected) {
    Write-Color "  ⚠️  No AI client detected. Writing to .env as fallback." "Yellow"
    $envContent = "UNISKILL_MCP_URL=`"$MCP_SSE_URL`"`nUNISKILL_API_KEY=`"$ApiKey`""
    Set-Content ".env" $envContent -Encoding UTF8
    Write-Color "   ✔ Written to: .\.env" "Green"
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Color "✅  UniSkill Superbrain is now connected!" "Green"
Write-Host ""
Write-Color "🚀 NEXT STEPS:" "Yellow"
Write-Host "  1. Restart your AI client (Claude / Cursor / Windsurf etc.)."
Write-Host '  2. Ask it: "What is the real-time weather in Tokyo?"'
Write-Host "  3. Watch UniSkill tools appear automatically."
Write-Host ""
Write-Host "📊 Dashboard: $DASHBOARD_URL"
Write-Color "══════════════════════════════════════════════════════" "Cyan"
Write-Host ""
