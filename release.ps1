param(
    [Parameter(Mandatory = $true)]
    [string]$Version,

    [Parameter(Mandatory = $true)]
    [string]$Notes
)

$ErrorActionPreference = "Stop"

$Tag = "v$Version"
$TauriConfig = "src-tauri\tauri.conf.json"
$ReleaseNotesFile = "release-notes.md"

Write-Host ""
Write-Host "Hero Craft release $Tag"
Write-Host "---------------------------"

# Vérifie le format 0.4.0
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "Version invalide. Exemple attendu : 0.4.0"
    exit 1
}

# Vérifie que Git est propre AVANT de modifier des fichiers
$GitStatus = git status --porcelain

if ($GitStatus) {
    Write-Error "Le repository contient des modifications non committees."
    exit 1
}

# Empêche d'écraser un tag existant
$ExistingTag = git tag --list $Tag

if ($ExistingTag) {
    Write-Error "Le tag $Tag existe deja."
    exit 1
}

# Écrit les notes de release
Set-Content $ReleaseNotesFile $Notes -Encoding UTF8

Write-Host "Release notes -> $ReleaseNotesFile"

# Change la version Tauri
$Content = Get-Content $TauriConfig -Raw

$Content = $Content -replace `
    '"version"\s*:\s*"[^"]+"', `
    "`"version`": `"$Version`""

Set-Content $TauriConfig $Content -Encoding UTF8

Write-Host "Version Tauri -> $Version"

# Vérifie que le frontend compile
Write-Host ""
Write-Host "Verification du build frontend..."

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Le build a echoue."
    exit 1
}

# Commit de release
git add $TauriConfig
git add $ReleaseNotesFile

git commit -m "Release $Tag"

# Création du tag
git tag $Tag

# Push du commit et du tag
git push origin main
git push origin $Tag

Write-Host ""
Write-Host "Release $Tag envoyee."
Write-Host "GitHub Actions va maintenant construire et publier Hero Craft."