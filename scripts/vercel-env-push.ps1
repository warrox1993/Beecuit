# Pushes 4 Stripe env vars × 3 environments to Vercel.
# Prereq: `npx vercel@latest login` then `npx vercel@latest link` (project = beecuit).
# Reads values from .env.local. BLOB_READ_WRITE_TOKEN excluded (auto-injected by Vercel Blob connection).

$ErrorActionPreference = "Continue"
$VARS = @("STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_TAX_RATE_ID")
$ENVS = @("production", "preview", "development")

if (-not (Test-Path ".vercel")) {
    Write-Host "ERROR: .vercel/ missing. Run ``npx vercel@latest link`` first." -ForegroundColor Red
    exit 1
}

$envMap = @{}
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([A-Z_]+)="(.*)"\s*$') { $envMap[$Matches[1]] = $Matches[2] }
}

foreach ($name in $VARS) {
    if (-not $envMap.ContainsKey($name)) { Write-Host "skip $name (not in .env.local)" -ForegroundColor Yellow; continue }
    $value = $envMap[$name]
    foreach ($env in $ENVS) {
        Write-Host "→ $name [$env]" -ForegroundColor Cyan
        # Remove first (idempotent — ignore failure if var doesn't exist)
        & npx vercel@latest env rm $name $env --yes 2>$null | Out-Null
        # Preview env needs --value + --yes (CLI demands branch otherwise);
        # production/development accept stdin pipe.
        if ($env -eq "preview") {
            & npx vercel@latest env add $name $env --value $value --yes | Out-Null
        } else {
            $value | & npx vercel@latest env add $name $env | Out-Null
        }
        if ($LASTEXITCODE -eq 0) { Write-Host "  ok" -ForegroundColor Green }
        else { Write-Host "  FAILED (exit $LASTEXITCODE)" -ForegroundColor Red }
    }
}

Write-Host "`nDone. Verify with: npx vercel@latest env ls" -ForegroundColor Cyan
