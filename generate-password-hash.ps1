# Generate Bcrypt Password Hash
# This script helps you generate bcrypt hashes for user passwords

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Bcrypt Password Hash Generator" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Get password input
$password = Read-Host -Prompt "Enter password to hash"

if ([string]::IsNullOrWhiteSpace($password)) {
    Write-Host "Error: Password cannot be empty" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Generating bcrypt hash..." -ForegroundColor Yellow

# Change to backend directory and generate hash
Push-Location -Path "$PSScriptRoot\backend"

try {
    # Generate the hash using Node.js
    $hash = node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('$password', 10));"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Success! Your bcrypt hash:" -ForegroundColor Green
        Write-Host "==================================" -ForegroundColor Cyan
        Write-Host $hash -ForegroundColor White
        Write-Host "==================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Use this hash in your SQL INSERT statement:" -ForegroundColor Yellow
        Write-Host "password = '$hash'" -ForegroundColor White
        Write-Host ""
        
        # Copy to clipboard if available
        try {
            $hash | Set-Clipboard
            Write-Host "Hash copied to clipboard!" -ForegroundColor Green
        } catch {
            Write-Host "Note: Could not copy to clipboard automatically" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Error: Failed to generate hash" -ForegroundColor Red
        Write-Host "Make sure you have run 'npm install' in the backend directory" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "1. Node.js is installed" -ForegroundColor Yellow
    Write-Host "2. You're in the CRM project root directory" -ForegroundColor Yellow
    Write-Host "3. You've run 'npm install' in backend directory" -ForegroundColor Yellow
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
