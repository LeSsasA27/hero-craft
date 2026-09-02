import type { RuneInventory, Runeword} from "../types.ts";

export function canCraftRuneword(
    runeword: Runeword,
    inventory: RuneInventory,
): boolean {
    const requiredRunes: Record<string, number> = {}

    runeword.runes.forEach(rune => {
        requiredRunes[rune] = (requiredRunes[rune] ?? 0) + 1
    })

    return Object.entries(requiredRunes).every(([rune, amount]) => {
        return (inventory[rune] ?? 0) >= amount
    })
}

export function getMissingRunes(
    runeword: Runeword,
    inventory: RuneInventory,
): RuneInventory {
    const requiredRunes: RuneInventory = {}

    runeword.runes.forEach(rune => {
        requiredRunes[rune] = (requiredRunes[rune] ?? 0) + 1
    })

    const missing: RuneInventory = {}

    Object.entries(requiredRunes).forEach(([rune, amount]) => {
        const have = inventory[rune] ?? 0
        const missingAmount = amount - have

        if (missingAmount > 0) {
            missing[rune] = missingAmount
        }
    })

    return missing
}

export function getMissingRuneCount(
    runeword: Runeword,
    inventory: RuneInventory,
): number {
    const missing = getMissingRunes(runeword, inventory)

    return Object.values(missing).reduce(
        (total, amount) => total + amount,
        0,
    )
}

export function sortByMissingRunes(
    runewords: Runeword[],
    inventory: RuneInventory,
): Runeword[] {
    return [...runewords].sort((a, b) => {
        return (
            getMissingRuneCount(a, inventory) -
            getMissingRuneCount(b, inventory)
        )
    })
}

export type CraftGroups = {
    craftable: Runeword[]
    almost: Runeword[]
    remaining: Runeword[]
}

export function getCraftGroups(
    runewords: Runeword[],
    inventory: RuneInventory,
): CraftGroups {
    const craftable = runewords.filter(runeword =>
        canCraftRuneword(runeword, inventory)
    )

    const almost = runewords.filter(runeword =>
        getMissingRuneCount(runeword, inventory) === 1
    )

    const remaining = sortByMissingRunes(
        runewords,
        inventory,
    ).filter(runeword =>
        getMissingRuneCount(runeword, inventory) > 1
    )

    return {
        craftable,
        almost,
        remaining,
    }
}