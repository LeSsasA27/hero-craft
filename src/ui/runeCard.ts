import type { Rune } from "../types.ts";
import { runeTierColors } from "../data/runes.ts";

export function runeCard(rune: Rune) {
    const color = runeTierColors[rune.tier]

    const tierLabel =
        rune.tier === '?'
            ? 'Unconfirmed'
            : `Tier ${rune.tier}`

    return `
        <article
            class="rune-card"
            style="--rune-tier-color: ${color}"
        >
            <div class="rune-card-header">
                <h3>
                    ${rune.name}
                </h3>

                <span
                    class="rune-tier"
                    style="color: ${color}"
                >
                    ${tierLabel}
                </span>
            </div>

            <p>
                <strong>Level:</strong>
                ${rune.level ?? '?'}
            </p>

            <p>
                ${rune.effect}
            </p>

            ${rune.tier === '?' ? `
                <p class="rune-warning">
                    Data not confirmed.
                </p>
            ` : ''}
        </article>
    `
}