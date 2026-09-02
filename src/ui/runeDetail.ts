import type { Rune } from "../types.ts";

export function runeDetail(
    runeName: string,
    rune?: Rune,
) {
    if (!rune) {
        return `
            <h3>${runeName}</h3>
            <p>No detailed information available.</p>
        `
    }

    return `
        <h3>${rune.name}</h3>
        
        <p>
            <strong>Level:</strong>
            ${rune.level ?? '?'}
        </p>
        
        <p>
            <strong>Tier:</strong>
            ${rune.tier === '?' ? 'Unconfirmed' : rune.tier}
        </p>
        
        ${rune.tier === '?' ? `
                <p class="rune-warning">
                    Data not confirmed.
                </p>
            ` : ''}
        
        <p>
            <strong>Effect:</strong>
            ${rune.effect}
        </p>
    `
}