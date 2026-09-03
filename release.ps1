param(
    [Parameter(Mandatory = $true)]
    [string]$Version,

    [Parameter(Mandatory = $true)]
    [string]$Notes
)

$ErrorActionPreference = "Stop"

function Write-Utf8NoBom {
    param(
        [string]$Path,
        [string]$Content
    )

    $Encoding = [System.Text.UTF8Encoding]::new($false)

    [System.IO.File]::WriteAllText(
        [System.IO.Path]::GetFullPath($Path),
        $Content,
        $Encoding
    )
}

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
Write-Utf8NoBom $ReleaseNotesFile $Notes

Write-Host "Release notes -> $ReleaseNotesFile"

# Change la version Tauri
$Content = Get-Content $TauriConfig -Raw

$Content = $Content -replace `
    '"version"\s*:\s*"[^"]+"', `
    "`"version`": `"$Version`""

Write-Utf8NoBom $TauriConfig $Content

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