import type { Rune } from "../types.ts";
import { runeTierColors } from "../data/runes.ts";
import { getRuneImage } from "../data/runeImages.ts";



export function runeCard(rune: Rune) {
    const color = runeTierColors[rune.tier]
    const imageUrl = getRuneImage(rune.name)

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
        <div class="rune-card-title">
          <img
            class="rune-card-icon"
            src="${imageUrl}"
            alt="${rune.name}"
            loading="lazy"
            onerror="this.style.display='none'"
          >

          <h3>${rune.name}</h3>
        </div>

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