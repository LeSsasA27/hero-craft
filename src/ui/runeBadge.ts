import { runes, runeTierColors } from "../data/runes.ts";

export function  runeBadge(runeName: string) {
    const rune = runes[runeName]

    if (!rune) {
        return `
            <button 
                class="rune"
                type="button"
                data-rune="${runeName}"
            >
                ${runeName}
            </button>
        `
    }

    const color = runeTierColors[rune.tier]

    return `
        <button
            class="rune"
            type="button"
            data-rune="${rune.name}"
            style="border-color: ${color}; color: ${color};"
        >
            ${rune.name}
            <small>Lv ${rune.level ?? '?'}</small>
        </button>
    `
}