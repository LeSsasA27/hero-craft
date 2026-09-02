import type { Runeword } from "../types.ts";
import { runeBadge } from "./runeBadge.ts";

export function runewordCard(runeword: Runeword) {
    return `
        <article class="runeword-card" data-runeword="${runeword.name}">
            <header class="rune-card-header">
                <h3>${runeword.name}</h3>
                
                <span class="runeword-level">
                    Lv ${runeword.level}
                </span>
            </header>
            
            <div class="runes">
                ${runeword.runes.map(runeBadge).join('')}
            </div>
            
            <div class="runeword-meta">
                <span>
                    ${runeword.bases.join(' . ')}
                </span>
                
                <span>
                    ${runeword.runes.length} sockets
                </span>
            </div>
            
            <div class="runeword-effects">
                ${runeword.effects.map(effect => `
                    <span class="effect-tag">
                        ${effect}
                    </span>
                `).join('')}
            </div>
        </article>
    `
}