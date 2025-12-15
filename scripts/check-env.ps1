# PowerShell script to check if .env variables are loaded

Write-Host "Checking environment variables..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (Test-Path .env) {
    Write-Host "✓ .env file found" -ForegroundColor Green
    Write-Host ""
    
    # Read and display variables from .env file
    $vars = @{}
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            $vars[$name] = $value
        }
    }
    
    Write-Host "Variables in .env file ($($vars.Count) found):" -ForegroundColor Yellow
    foreach ($var in $vars.Keys) {
        $displayValue = if ($var -like '*KEY*' -or $var -like '*SECRET*' -or $var -like '*PASSWORD*') {
            "***hidden***"
        } else {
            $vars[$var]
        }
        Write-Host "  $var = $displayValue" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Check which variables are actually loaded in the environment
    Write-Host "Variables loaded in environment:" -ForegroundColor Yellow
    $loadedCount = 0
    foreach ($var in $vars.Keys) {
        $envValue = [Environment]::GetEnvironmentVariable($var, 'Process')
        if ($envValue) {
            $displayValue = if ($var -like '*KEY*' -or $var -like '*SECRET*' -or $var -like '*PASSWORD*') {
                "***hidden***"
            } else {
                $envValue
            }
            Write-Host "  ✓ $var = $displayValue" -ForegroundColor Green
            $loadedCount++
        } else {
            Write-Host "  ✗ $var = (not loaded)" -ForegroundColor Red
        }
    }
    Write-Host ""
    Write-Host "Summary: $loadedCount of $($vars.Count) variables are loaded in environment" -ForegroundColor Cyan
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create a .env file in the project root." -ForegroundColor Yellow
}

