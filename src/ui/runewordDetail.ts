import type { Runeword } from "../types.ts";
import { runeBadge } from "./runeBadge.ts";

export function runewordDetail(runeword: Runeword) {
    return `
        <h3>${runeword.name}</h3>

        <div class="runes">
          ${runeword.runes.map(runeBadge).join('')}
        </div>
    
        <p>
          <strong>Level:</strong>
          ${runeword.level}
        </p>
    
        <p>
          <strong>Sockets:</strong>
          ${runeword.runes.length}
        </p>
    
        <p>
          <strong>Bases:</strong>
          ${runeword.bases.join(', ')}
        </p>
    
        <div class="runeword-effects">
          ${runeword.effects
            .map(effect => `
              <span class="effect-tag">
                ${effect}
              </span>
            `)
            .join('')}
        </div>
    `
}