import type { Item } from '../types.ts'

function getRarityClass(rarity: string) {
    return rarity
        .toLowerCase()
        .replace(/\s+/g, '-')
}

export function itemCard(item: Item) {
    const visibleStats = item.stats.slice(0, 3)
    const remainingStats = item.stats.length - visibleStats.length
    const rarityClass = getRarityClass(item.rarity)

    return `
    <article
      class="item-card"
      data-item="${item.name}"
    >
      <div class="item-card-top">
        <div class="item-card-image-wrapper rarity-${rarityClass}">
          ${item.image ? `
            <img
              class="item-card-image"
              src="${item.image}"
              alt="${item.name}"
              loading="lazy"
              onerror="this.style.display='none'"
            >
          ` : `
            <div class="item-card-image-placeholder">
              ?
            </div>
          `}
        </div>

        <div class="item-card-heading">
          <h3>${item.name}</h3>

          <div class="item-card-meta">
            <span>${item.rarity}</span>
            <span>·</span>
            <span>${item.type}</span>
          </div>
        </div>

        ${item.tier ? `
          <span class="item-tier">
            ${item.tier}
          </span>
        ` : ''}
      </div>

      <div class="item-card-properties">
        ${item.level !== null ? `
          <span class="item-property">
            <small>LV</small>
            ${item.level}
          </span>
        ` : ''}

        ${Object.entries(item.properties)
        .filter(([, value]) => value)
        .map(([name, value]) => `
            <span class="item-property">
              <small>${name}</small>
              ${value}
            </span>
          `)
        .join('')}
      </div>

      ${visibleStats.length > 0 ? `
        <div class="item-card-stats">
          ${visibleStats
        .map(stat => `
              <div class="item-stat">
                ${stat}
              </div>
            `)
        .join('')}

          ${remainingStats > 0 ? `
            <div class="item-more-stats">
              +${remainingStats} more stats
            </div>
          ` : ''}
        </div>
      ` : ''}
    </article>
  `
}