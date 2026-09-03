import type {ItemCategory, ItemType } from '../types.ts'

export const itemTypesByCategory: Record<
    ItemCategory,
    ItemType[]
> = {
    Weapons: [
        'Swords',
        'Daggers',
        'Maces',
        'Axes',
        'Claws',
        'Polearms',
        'Chainsaws',
        'Staves',
        'Canes',
        'Wands',
        'Books',
        'Spellblades',
        'Bows',
        'Guns',
        'Flasks',
        'Throwing Weapons',
    ],

    Armor: [
        'Helmets',
        'Body Armors',
        'Gloves',
        'Boots',
        'Shield',
    ],

    Jewellery: [
        'Amulets',
        'Rings',
        'Belts',
    ],

    'Special Items': [
        'Charms',
        'Relics',
        'Glyphs',
        'Potions',
    ],
}