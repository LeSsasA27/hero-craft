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

export type ItemCategory =
    | 'Weapons'
    | 'Armor'
    | 'Jewellery'
    | 'Special Items'

export type ItemType =
    | 'Swords'
    | 'Daggers'
    | 'Maces'
    | 'Axes'
    | 'Claws'
    | 'Polearms'
    | 'Chainsaws'
    | 'Staves'
    | 'Canes'
    | 'Wands'
    | 'Books'
    | 'Spellblades'
    | 'Bows'
    | 'Guns'
    | 'Flasks'
    | 'Throwing Weapons'
    | 'Helmets'
    | 'Body Armors'
    | 'Gloves'
    | 'Boots'
    | 'Shield'
    | 'Amulets'
    | 'Rings'
    | 'Belts'
    | 'Charms'
    | 'Relics'
    | 'Glyphs'
    | 'Potions'

export type Item = {
    name: string
    category: ItemCategory
    type: ItemType

    rarity: string
    tier: string
    level: number | null

    image?: string

    properties: Record<string, string>
    stats: string[]
}