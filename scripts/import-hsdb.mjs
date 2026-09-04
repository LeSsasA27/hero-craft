import {
    readFile,
    writeFile,
    readdir,
} from 'node:fs/promises'

import {
    getHsdbImage,
} from './hsdb-images.mjs'

const RAW_DIR =
    'tmp/herosiegedb-api'

const GENERATED_DIR =
    'src/data/generated'

const OUTPUT_FILE =
    `${GENERATED_DIR}/hsdb-items.json`

/* =========================================
   LOAD JSON
   ========================================= */

async function readJson(path) {
    return JSON.parse(
        await readFile(
            path,
            'utf8',
        ),
    )
}

const rawItems =
    await readJson(
        `${RAW_DIR}/items.json`,
    )

const subclasses =
    await readJson(
        `${RAW_DIR}/subclasses.json`,
    )

const dropAreas =
    await readJson(
        `${RAW_DIR}/drop-areas.json`,
    )

const runes =
    await readJson(
        `${RAW_DIR}/runes.json`,
    )


/* =========================================
   LOOKUPS
   ========================================= */

const subclassesById =
    Object.fromEntries(
        subclasses.map(item => [
            item.id,
            item,
        ]),
    )

const dropAreasById =
    Object.fromEntries(
        dropAreas.map(item => [
            item.id,
            item,
        ]),
    )

const runesById =
    Object.fromEntries(
        runes.map(item => [
            item.id,
            item,
        ]),
    )


/* =========================================
   EXISTING WIKI IMAGES
   ========================================= */

function normalizeName(value) {
    return String(value ?? '')
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
}

const existingImages =
    new Map()

const generatedFiles =
    await readdir(
        GENERATED_DIR,
    )

for (const file of generatedFiles) {
    if (
        !file.endsWith('.json') ||
        file === 'hsdb-items.json'
    ) {
        continue
    }

    try {
        const data =
            await readJson(
                `${GENERATED_DIR}/${file}`,
            )

        if (!Array.isArray(data)) {
            continue
        }

        for (const item of data) {
            if (
                item?.name &&
                item?.image
            ) {
                existingImages.set(
                    normalizeName(item.name),
                    item.image,
                )
            }
        }
    } catch {
        // Ignore malformed/non-item JSON.
    }
}


/* =========================================
   RARITY
   ========================================= */

function formatRarity(value) {
    if (!value) {
        return ''
    }

    const known = {
        heroic: 'Heroic',
        angelic: 'Angelic',
        satanic: 'Satanic',
        unholy: 'Unholy',
        runeword: 'Runeword',
    }

    return (
        known[value.toLowerCase()] ??
        value
            .replace(/_/g, ' ')
            .replace(
                /\b\w/g,
                char =>
                    char.toUpperCase(),
            )
    )
}


/* =========================================
   ITEM TYPE
   ========================================= */

const DIRECT_TYPES = {
    body_armor: {
        category: 'Armor',
        type: 'Body Armors',
    },

    helmet: {
        category: 'Armor',
        type: 'Helmets',
    },

    gloves: {
        category: 'Armor',
        type: 'Gloves',
    },

    boots: {
        category: 'Armor',
        type: 'Boots',
    },

    shield: {
        category: 'Armor',
        type: 'Shield',
    },

    amulet: {
        category: 'Jewellery',
        type: 'Amulets',
    },

    ring: {
        category: 'Jewellery',
        type: 'Rings',
    },

    belt: {
        category: 'Jewellery',
        type: 'Belts',
    },

    charm: {
        category: 'Special Items',
        type: 'Charms',
    },

    relic: {
        category: 'Special Items',
        type: 'Relics',
    },

    glyph: {
        category: 'Special Items',
        type: 'Glyphs',
    },

    potion: {
        category: 'Special Items',
        type: 'Potions',
    },
}


const WEAPON_TYPES = [
    {
        keywords: [
            'throwing',
            'throw',
        ],
        type: 'Throwing Weapons',
    },

    {
        keywords: [
            'spellblade',
            'spell blade',
        ],
        type: 'Spellblades',
    },

    {
        keywords: [
            'chainsaw',
        ],
        type: 'Chainsaws',
    },

    {
        keywords: [
            'polearm',
            'pole arm',
        ],
        type: 'Polearms',
    },

    {
        keywords: [
            'dagger',
        ],
        type: 'Daggers',
    },

    {
        keywords: [
            'sword',
        ],
        type: 'Swords',
    },

    {
        keywords: [
            'mace',
        ],
        type: 'Maces',
    },

    {
        keywords: [
            'axe',
        ],
        type: 'Axes',
    },

    {
        keywords: [
            'claw',
        ],
        type: 'Claws',
    },

    {
        keywords: [
            'staff',
            'stave',
        ],
        type: 'Staves',
    },

    {
        keywords: [
            'cane',
        ],
        type: 'Canes',
    },

    {
        keywords: [
            'wand',
        ],
        type: 'Wands',
    },

    {
        keywords: [
            'book',
        ],
        type: 'Books',
    },

    {
        keywords: [
            'bow',
        ],
        type: 'Bows',
    },

    {
        keywords: [
            'gun',
        ],
        type: 'Guns',
    },

    {
        keywords: [
            'flask',
        ],
        type: 'Flasks',
    },
]


function getSubclassText(item) {
    return (
        item.subclass_ids ?? []
    )
        .flatMap(id => {
            const subclass =
                subclassesById[id]

            return [
                id,
                subclass?.id,
                subclass?.name,
            ]
        })
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
}

const WEAPON_TYPE_OVERRIDES = {
    stormfury: 'Claws',
}

function getItemType(item) {
    const classId =
        String(
            item.class_item_id ?? '',
        ).toLowerCase()

    const direct =
        DIRECT_TYPES[classId]

    if (direct) {
        return direct
    }

    if (classId !== 'weapon') {
        return null
    }

    const override =
        WEAPON_TYPE_OVERRIDES[
            String(item.id ?? '').toLowerCase()
            ]

    if (override) {
        return {
            category: 'Weapons',
            type: override,
        }
    }

    const text =
        getSubclassText(item)

    for (
        const weapon
        of WEAPON_TYPES
        ) {
        if (
            weapon.keywords.some(
                keyword =>
                    text.includes(keyword),
            )
        ) {
            return {
                category: 'Weapons',
                type: weapon.type,
            }
        }
    }

    return null
}


/* =========================================
   AFFIX DISPLAY
   ========================================= */

/*
 * HeroSiegeDB fait ceci :
 *
 * template:
 *   value1 TO LIGHTNING SKILLS
 *
 * values:
 *   [4, 6]
 *
 * résultat:
 *   4-6 TO LIGHTNING SKILLS
 *
 * Si le template contient value1 + value2,
 * les valeurs sont utilisées individuellement.
 */
function renderAffix(affix) {
    const template =
        String(
            affix.display_template ??
            affix.affix_name ??
            '',
        )

    const values =
        Array.isArray(affix.value)
            ? affix.value
            : []

    if (!template) {
        return ''
    }

    const placeholders = [
        ...template.matchAll(
            /value(\d+)/gi,
        ),
    ]

    if (
        placeholders.length === 1 &&
        values.length === 2
    ) {
        const min =
            values[0] ?? 0

        const max =
            values[1] ?? 0

        const value =
            min === max
                ? String(min)
                : `${min}-${max}`

        return template.replace(
            /value\d+/i,
            value,
        )
    }

    return template.replace(
        /value(\d+)/gi,
        (
            _,
            index,
        ) => {
            const value =
                values[
                Number(index) - 1
                    ]

            return value !== undefined
                ? String(value)
                : '0'
        },
    )
}


/* =========================================
   PROPERTIES
   ========================================= */

function getSubclassNames(item) {
    return (
        item.subclass_ids ?? []
    )
        .map(id =>
            subclassesById[id]?.name ??
            id,
        )
        .filter(Boolean)
}


function getDropAreaNames(item) {
    return (
        item.droparea ?? []
    )
        .filter(id =>
            id !== 'global',
        )
        .map(id =>
            dropAreasById[id]?.name ??
            id,
        )
}


function getRuneNames(item) {
    return (
        item.runes ?? []
    )
        .map(id =>
            runesById[id]?.name ??
            id,
        )
        .filter(Boolean)
}


function buildProperties(item) {
    const properties = {}

    const subclasses =
        getSubclassNames(item)

    if (subclasses.length > 0) {
        properties.Subclass =
            subclasses.join(', ')
    }

    if (item.class_name) {
        properties.Class =
            item.class_name
    }

    if (item.class_nd_name) {
        properties['ND Class'] =
            item.class_nd_name
    }

    if (
        Array.isArray(item.handness) &&
        item.handness.length > 0
    ) {
        properties.Hand =
            item.handness.join(', ')
    }

    if (
        Array.isArray(item.size) &&
        item.size.length === 2
    ) {
        properties.Size =
            `${item.size[0]} × ${item.size[1]}`
    }

    if (
        item.droprate !== null &&
        item.droprate !== undefined
    ) {
        properties['Drop Rate'] =
            String(item.droprate)
    }

    const dropAreas =
        getDropAreaNames(item)

    if (dropAreas.length > 0) {
        properties.Drop =
            dropAreas.join(', ')
    }

    if (item.inferno) {
        properties.Inferno =
            'Yes'
    }

    const runeNames =
        getRuneNames(item)

    if (runeNames.length > 0) {
        properties.Runes =
            runeNames.join(' → ')
    }

    return properties
}


/* =========================================
   CONVERSION
   ========================================= */

const converted = []

const unmapped = []

for (const rawItem of rawItems) {
    const itemType =
        getItemType(rawItem)

    if (!itemType) {
        unmapped.push({
            id: rawItem.id,
            name: rawItem.name,
            class_item_id:
            rawItem.class_item_id,
            subclass_ids:
            rawItem.subclass_ids,
            subclassText:
                getSubclassText(rawItem),
        })

        continue
    }

    const stats =
        (
            rawItem.affixes ?? []
        )
            .sort(
                (a, b) =>
                    (a.order_index ?? 0) -
                    (b.order_index ?? 0),
            )
            .map(renderAffix)
            .filter(Boolean)

    const hsdbImage =
        getHsdbImage(
            rawItem,
        )

    const wikiImage =
        existingImages.get(
            normalizeName(
                rawItem.name,
            ),
        )

    const image =
        hsdbImage?.image ??
        wikiImage

    converted.push({
        name: rawItem.name,
        category:
        itemType.category,
        type:
        itemType.type,
        rarity:
            formatRarity(
                rawItem.rarity_id,
            ),
        tier: '',
        level:
            rawItem.required_level ??
            null,
        image,
        imageFrames:
        hsdbImage?.imageFrames,
        properties:
            buildProperties(rawItem),
        stats,
    })
}


/* =========================================
   SORT
   ========================================= */

converted.sort(
    (a, b) => {
        const typeCompare =
            a.type.localeCompare(
                b.type,
            )

        if (typeCompare !== 0) {
            return typeCompare
        }

        return a.name.localeCompare(
            b.name,
        )
    },
)


/* =========================================
   WRITE
   ========================================= */

await writeFile(
    OUTPUT_FILE,
    `${JSON.stringify(
        converted,
        null,
        2,
    )}\n`,
    'utf8',
)

await writeFile(
    'tmp/herosiegedb-api/unmapped-items.json',
    `${JSON.stringify(
        unmapped,
        null,
        2,
    )}\n`,
    'utf8',
)


/* =========================================
   REPORT
   ========================================= */

const byType = {}

for (const item of converted) {
    byType[item.type] =
        (
            byType[item.type] ??
            0
        ) + 1
}

console.log('')
console.log(
    'Hero Craft — HeroSiegeDB Import',
)

console.log(
    '================================',
)

console.log('')

console.log(
    `Raw:      ${rawItems.length}`,
)

console.log(
    `Imported: ${converted.length}`,
)

console.log(
    `Unmapped: ${unmapped.length}`,
)

console.log('')

console.log('By type:')

for (
    const [type, count]
    of Object.entries(byType)
    .sort(
        ([a], [b]) =>
            a.localeCompare(b),
    )
    ) {
    console.log(
        `  ${type}: ${count}`,
    )
}

if (unmapped.length > 0) {
    console.log('')
    console.log(
        'Unmapped examples:',
    )

    for (
        const item
        of unmapped.slice(0, 20)
        ) {
        console.log(
            `  ${item.name} | ${item.class_item_id} | ${item.subclass_ids?.join(', ')}`,
        )
    }

    console.log('')
    console.log(
        'See tmp/herosiegedb-api/unmapped-items.json',
    )
}

console.log('')

console.log(
    `Output: ${OUTPUT_FILE}`,
)

console.log('')
console.log('Done.')