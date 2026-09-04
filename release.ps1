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

# Toujours travailler depuis le dossier contenant release.ps1
$ProjectRoot = $PSScriptRoot

$Tag = "v$Version"

$TauriConfig = Join-Path `
    $ProjectRoot `
    "src-tauri\tauri.conf.json"

$ReleaseNotesFile = Join-Path `
    $ProjectRoot `
    "release-notes.md"

Write-Host ""
Write-Host "Hero Craft release $Tag"
Write-Host "---------------------------"

# Vérifie le format 0.5.6
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "Version invalide. Exemple attendu : 0.5.6"
    exit 1
}

# Vérifie que les fichiers attendus existent
if (-not (Test-Path $TauriConfig)) {
    Write-Error "Fichier Tauri introuvable : $TauriConfig"
    exit 1
}

Push-Location $ProjectRoot

try {
    # Vérifie que Git est propre AVANT de modifier des fichiers
    $GitStatus = git status --porcelain

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Impossible de lire le statut Git."
        exit 1
    }

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
    Write-Utf8NoBom `
        $ReleaseNotesFile `
        $Notes

    Write-Host "Release notes -> release-notes.md"

    # Change la version Tauri
    $Content = Get-Content `
        $TauriConfig `
        -Raw

    $Content = $Content -replace `
        '"version"\s*:\s*"[^"]+"', `
        "`"version`": `"$Version`""

    Write-Utf8NoBom `
        $TauriConfig `
        $Content

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
    git add "src-tauri/tauri.conf.json"
    git add "release-notes.md"

    git commit -m "Release $Tag"

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Le commit de release a echoue."
        exit 1
    }

    # Création du tag
    git tag $Tag

    if ($LASTEXITCODE -ne 0) {
        Write-Error "La creation du tag a echoue."
        exit 1
    }

    # Push du commit et du tag
    git push origin main

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Le push de main a echoue."
        exit 1
    }

    git push origin $Tag

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Le push du tag a echoue."
        exit 1
    }

    Write-Host ""
    Write-Host "Release $Tag envoyee."
    Write-Host "GitHub Actions va maintenant construire et publier Hero Craft."
}
finally {
    Pop-Location
}