# CRM System Startup Script
# This script helps you start the CRM system easily

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    CRM System - Starting...    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is accessible
Write-Host "Checking MySQL connection..." -ForegroundColor Yellow
$mysqlCheck = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCheck) {
    Write-Host "WARNING: MySQL command not found in PATH" -ForegroundColor Red
    Write-Host "Make sure MySQL is installed and running" -ForegroundColor Yellow
} else {
    Write-Host "✓ MySQL found" -ForegroundColor Green
}
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit
}
$nodeVersion = node --version
Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Create database if needed
Write-Host "Database Setup:" -ForegroundColor Yellow
Write-Host "Make sure you've created the database:" -ForegroundColor White
Write-Host "  CREATE DATABASE crm_db;" -ForegroundColor Gray
Write-Host ""
$createDb = Read-Host "Have you created the database? (y/n)"
if ($createDb -ne 'y') {
    Write-Host "Please create the database first and run this script again." -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

Write-Host "✓ Backend starting on http://localhost:5000" -ForegroundColor Green
Write-Host "  (Opening in new window...)" -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "✓ Frontend starting on http://localhost:5173" -ForegroundColor Green
Write-Host "  (Opening in new window...)" -ForegroundColor Gray
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    CRM System is Starting!    " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser in 5 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Open browser
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "✓ Browser opened!" -ForegroundColor Green
Write-Host ""
Write-Host "To stop the servers:" -ForegroundColor Yellow
Write-Host "  - Close the PowerShell windows" -ForegroundColor Gray
Write-Host "  - Or press Ctrl+C in each window" -ForegroundColor Gray
Write-Host ""
Write-Host "Enjoy your CRM! 🚀" -ForegroundColor Cyan
Write-Host ""
pause
