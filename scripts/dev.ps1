# PowerShell script to load .env and run dev server

$loadedVars = @()

# Check if .env file exists
if (Test-Path .env) {
    # Load environment variables from .env file
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, 'Process')
            $loadedVars += $name
        }
    }
    
    Write-Host "✓ Loaded $($loadedVars.Count) environment variable(s) from .env" -ForegroundColor Green
    Write-Host "  Variables loaded:" -ForegroundColor Cyan
    foreach ($var in $loadedVars) {
        $displayValue = if ($var -like '*KEY*' -or $var -like '*SECRET*' -or $var -like '*PASSWORD*') {
            "***hidden***"
        } else {
            [Environment]::GetEnvironmentVariable($var, 'Process')
        }
        Write-Host "    - $var = $displayValue" -ForegroundColor Gray
    }
    Write-Host ""
} else {
    Write-Host "⚠ Warning: .env file not found" -ForegroundColor Yellow
    Write-Host ""
}

# Run Next.js dev server
npm run dev

