import type { Item } from '../types.ts'

export type ItemStatFilter = {
    query: string
    min: number | null
}

function getStatMinimumValue(
    stat: string,
): number | null {
    const rangeMatch = stat.match(
        /\[?\s*(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)\s*\]?/,
    )

    if (rangeMatch) {
        return Number(rangeMatch[1])
    }

    const numberMatch = stat.match(
        /-?\d+(?:\.\d+)?/,
    )

    if (!numberMatch) {
        return null
    }

    return Number(numberMatch[0])
}

function matchesStatFilters(
    item: Item,
    filters: ItemStatFilter[],
) {
    return filters.every(filter => {
        const query =
            filter.query
                .trim()
                .toLowerCase()

        if (!query) {
            return true
        }

        const matchingStats =
            item.stats.filter(stat =>
                stat.toLowerCase().includes(query),
            )

        if (matchingStats.length === 0) {
            return false
        }

        if (filter.min === null) {
            return true
        }

        return matchingStats.some(stat => {
            const value =
                getStatMinimumValue(stat)

            return (
                value !== null &&
                value >= filter.min!
            )
        })
    })
}

export function filterItems(
    items: Item[],
    query: string,
    category: string,
    type: string,
    rarity: string,
    statFilters: ItemStatFilter[],
) {
    const normalizedQuery =
        query
            .trim()
            .toLowerCase()

    return items.filter(item => {
        const matchesCategory =
            !category ||
            item.category === category

        const matchesType =
            !type ||
            item.type === type

        const matchesRarity =
            !rarity ||
            item.rarity === rarity

        const searchableText = `
      ${item.name}
      ${item.category}
      ${item.type}
      ${item.rarity}
      ${item.tier}
      ${item.level ?? ''}
      ${Object.entries(item.properties)
            .map(([key, value]) =>
                `${key} ${value}`
            )
            .join(' ')}
      ${item.stats.join(' ')}
    `.toLowerCase()

        const matchesSearch =
            !normalizedQuery ||
            searchableText.includes(
                normalizedQuery,
            )

        const matchesStats =
            matchesStatFilters(
                item,
                statFilters,
            )

        return (
            matchesCategory &&
            matchesType &&
            matchesRarity &&
            matchesSearch &&
            matchesStats
        )
    })
}