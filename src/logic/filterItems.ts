import type { Item } from '../types.ts'

export function filterItems(
    items: Item[],
    query: string,
    category: string,
    type: string,
) {
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter(item => {
        const matchesCategory =
            !category || item.category === category

        const matchesType =
            !type || item.type === type

        const searchableText = `
      ${item.name}
      ${item.rarity}
      ${item.tier}
      ${item.type}
      ${Object.entries(item.properties)
            .map(([key, value]) => `${key} ${value}`)
            .join(' ')}
      ${item.stats.join(' ')}
    `.toLowerCase()

        const matchesSearch =
            !normalizedQuery ||
            searchableText.includes(normalizedQuery)

        return (
            matchesCategory &&
            matchesType &&
            matchesSearch
        )
    })
}