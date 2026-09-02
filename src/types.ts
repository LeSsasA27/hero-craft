export type Runeword = {
    name: string
    runes: string[]
    bases: string[]
    level: number
    effects: string[]
}

export type RuneTier = 'S' | 'A' | 'C' | 'D' | '?'

export type Rune = {
    name: string
    tier: RuneTier
    level: number | null
    effect: string
    leveling?: boolean
}

export type RuneInventory = Record<string, number>