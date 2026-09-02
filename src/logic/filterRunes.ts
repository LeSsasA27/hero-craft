import type { Rune } from "../types.ts";

export function filterRunes(
    runes: Rune[],
    query: string,
    tier: string,
) {
    const normalizedQuery = query.trim().toLowerCase()

    return runes.filter(rune => {
        const matchesTier =
            !tier || rune.tier === tier

        const searchableText = `
      ${rune.name}
      ${rune.effect}
    `.toLowerCase()

        const matchesSearch =
            !normalizedQuery ||
            searchableText.includes(normalizedQuery)

        return matchesTier && matchesSearch
    })
}