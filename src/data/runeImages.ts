const RUNE_IMAGE_BASE_URL =
    'https://herosiege.wiki.gg/wiki/Special:Redirect/file'

export function getRuneImage(runeName: string): string {
    const filename = `Rune_${runeName}.png`

    return `${RUNE_IMAGE_BASE_URL}/${encodeURIComponent(filename)}`
}