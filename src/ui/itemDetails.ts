import type { Item } from "../types.ts";

export function itemDetail(item: Item) {
    return `
    <div class="item-detail">
      ${item.image ? `
        <div class="item-detail-image-wrapper">
          <img
            class="item-detail-image"
            src="${item.image}"
            alt="${item.name}"
            onerror="this.style.display='none'"
          >
        </div>
      ` : ''}

      <div class="item-detail-heading">
        <h3>${item.name}</h3>

        <div class="item-detail-meta">
          <span>${item.rarity}</span>
          <span>·</span>
          <span>${item.type}</span>

          ${item.tier ? `
            <span>· Tier ${item.tier}</span>
          ` : ''}
        </div>
      </div>

      <div class="item-detail-properties">
        ${item.level !== null ? `
          <div class="item-detail-property">
            <span>Level</span>
            <strong>${item.level}</strong>
          </div>
        ` : ''}

        ${Object.entries(item.properties)
        .filter(([, value]) => value)
        .map(([name, value]) => `
            <div class="item-detail-property">
              <span>${name}</span>
              <strong>${value}</strong>
            </div>
          `)
        .join('')}
      </div>

      ${item.stats.length > 0 ? `
        <div class="item-detail-stats">
          <h4>Stats</h4>

          ${item.stats
        .map(stat => `
              <div class="item-detail-stat">
                ${stat}
              </div>
            `)
        .join('')}
        </div>
      ` : ''}
    </div>
  `
}