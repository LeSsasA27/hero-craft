import type { RuneInventory, Runeword} from "../types.ts";
import { getMissingRunes, getMissingRuneCount } from "../logic/crafting.ts";
import { runewordCard } from "./runewordCard.ts";

export function craftResultsView(
    craftable: Runeword[],
    almost: Runeword[],
    remaining: Runeword[],
    inventory: RuneInventory,
) {
    return `
    <section>
      <h3>Craftable now</h3>

      ${
        craftable.length > 0
            ? `
            <div class="runeword-list">
              ${craftable.map(runewordCard).join('')}
            </div>
          `
            : `<p class="empty-state">Nothing craftable yet.</p>`
    }
    </section>

    <section class="almost-section">
      <h3>Almost craftable</h3>

      ${
        almost.length > 0
            ? almost.map(runeword => {
                const missing = getMissingRunes(
                    runeword,
                    inventory,
                )

                const missingText = Object.entries(missing)
                    .map(([rune, amount]) => `${amount}× ${rune}`)
                    .join(', ')

                return `
                <div class="almost-card">
                  <strong>${runeword.name}</strong>
                  <span>Missing: ${missingText}</span>
                </div>
              `
            }).join('')
            : `<p class="empty-state">Nothing close yet.</p>`
    }
    </section>

    <section class="remaining-section">
      <h3>Other runewords</h3>

      ${
        remaining.length > 0
            ? remaining.map(runeword => {
                const missingCount =
                    getMissingRuneCount(runeword, inventory)

                const missing =
                    getMissingRunes(runeword, inventory)

                const missingText = Object.entries(missing)
                    .map(([rune, amount]) => `${amount}× ${rune}`)
                    .join(', ')

                return `
                <div class="almost-card">
                  <strong>${runeword.name}</strong>

                  <span>
                    ${missingCount} runes missing
                    — ${missingText}
                  </span>
                </div>
              `
            }).join('')
            : `<p class="empty-state">No other runewords.</p>`
    }
    </section>
  `
}