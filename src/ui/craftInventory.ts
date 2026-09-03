import { runes } from "../data/runes.ts";
import type { RuneTier} from "../types.ts";
import { getRuneImage } from "../data/runeImages.ts";

const tierOrder: RuneTier[] = ['S', 'A', 'C', 'D', '?']

const tierLabels: Record<RuneTier, string> = {
    S: 'Tier S',
    A: 'Tier A',
    C: 'Tier C',
    D: 'Tier D',
    '?': 'Unconfirmed',
}

export function craftInventoryView(
    runeNames: string[],
) {
    return tierOrder
        .map(tier => {
            const namesForTier = runeNames.filter(runeName => {
                const rune = runes[runeName]

                if (!rune) {
                    return tier === '?'
                }

                return rune.tier === tier
            })

            if (namesForTier.length === 0) {
                return ''
            }

            return `
                <section class="inventory-tier">
                  <h3>${tierLabels[tier]}</h3>
        
                  <div class="craft-inputs">
                    ${namesForTier
                .map(runeName => {
                    const imageUrl = getRuneImage(runeName)
                    const rune = runes[runeName]
                    const isUnknown = !rune

                    return `
                        <label class="craft-input ${isUnknown ? 'unconfirmed' : ''}">
                          <span class="craft-rune-info">
                              <img
                                class="craft-rune-icon"
                                src="${imageUrl}"
                                alt="${runeName}"
                                loading="lazy"
                                onerror="this.style.display='none'"
                              >
                            
                              <span class="craft-rune-name">
                                ${runeName}
                            
                                ${isUnknown ? `
                                  <small>?</small>
                                ` : ''}
                              </span>
                          </span>
                                                
                          <input
                            type="number"
                            min="0"
                            value="0"
                            data-inventory-rune="${runeName}"
                          >
                        </label>
                      `
                })
                .join('')}
                  </div>
                </section>
            `
        })
        .join('')
}