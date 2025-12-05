# Simple Appwrite Connection Test (PowerShell)
# Run with: .\scripts\test-appwrite-simple.ps1

Write-Host "🔍 Testing Appwrite Connection..." -ForegroundColor Cyan
Write-Host ""

# Read from .env file if it exists
$envFile = ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$endpoint = $env:EXPO_PUBLIC_APPWRITE_ENDPOINT
if (-not $endpoint) {
    Write-Host "⚠️  EXPO_PUBLIC_APPWRITE_ENDPOINT not found in environment" -ForegroundColor Yellow
    Write-Host "Using default: https://sfo.cloud.appwrite.io/v1" -ForegroundColor Yellow
    $endpoint = "https://sfo.cloud.appwrite.io/v1"
}

$projectId = $env:EXPO_PUBLIC_APPWRITE_PROJECT_ID

Write-Host "📍 Endpoint: $endpoint" -ForegroundColor White
Write-Host "📍 Project ID: $projectId" -ForegroundColor White
Write-Host ""

# Test 1: Health Check
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Test 1: Health Check Endpoint" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$healthUrl = "$endpoint/health"
$startTime = Get-Date

try {
    $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 10 -UseBasicParsing
    $duration = ((Get-Date) - $startTime).TotalMilliseconds
    
    Write-Host "✅ Health check PASSED" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor White
    Write-Host "   Response time: $([math]::Round($duration))ms" -ForegroundColor White
    Write-Host "   Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
} catch {
    $duration = ((Get-Date) - $startTime).TotalMilliseconds
    Write-Host "❌ Health check FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Duration: $([math]::Round($duration))ms" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Appwrite appears to be DOWN or unreachable!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Test 2: Account API Endpoint" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if (-not $projectId) {
    Write-Host "⚠️  Project ID not set - skipping account endpoint test" -ForegroundColor Yellow
} else {
    $accountUrl = "$endpoint/account"
    $startTime = Get-Date
    
    try {
        $headers = @{
            "X-Appwrite-Project" = $projectId
        }
        $response = Invoke-WebRequest -Uri $accountUrl -Method GET -Headers $headers -TimeoutSec 10 -UseBasicParsing
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        Write-Host "✅ Account endpoint PASSED" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor White
        Write-Host "   Response time: $([math]::Round($duration))ms" -ForegroundColor White
    } catch {
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq 401) {
            Write-Host "✅ Account endpoint PASSED (401 = not authenticated, which is expected)" -ForegroundColor Green
            Write-Host "   Status: 401" -ForegroundColor White
            Write-Host "   Response time: $([math]::Round($duration))ms" -ForegroundColor White
            Write-Host "   This means Appwrite is reachable!" -ForegroundColor Green
        } else {
            Write-Host "❌ Account endpoint FAILED" -ForegroundColor Red
            Write-Host "   Status: $statusCode" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "   Duration: $([math]::Round($duration))ms" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "If both tests failed, Appwrite may be down." -ForegroundColor White
Write-Host "Check status at: https://status.appwrite.io" -ForegroundColor Cyan
Write-Host "Or try accessing: $endpoint" -ForegroundColor Cyan
