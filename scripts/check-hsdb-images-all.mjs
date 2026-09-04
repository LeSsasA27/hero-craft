import {
    readFile,
} from 'node:fs/promises'

const BUNDLE_FILE =
    'tmp/herosiegedb/ItemService-CiYzb8kj.js'

const ITEMS_FILE =
    'tmp/herosiegedb-api/items.json'


/* ========================================
   LOAD DATA
   ======================================== */

const source =
    await readFile(
        BUNDLE_FILE,
        'utf8',
    )

const items =
    JSON.parse(
        await readFile(
            ITEMS_FILE,
            'utf8',
        ),
    )


/* ========================================
   FIND IMAGE MAP VARIABLE NAMES
   ======================================== */

const selectorMatch =
    source.match(
        /\.rarity===`angelic`\?([A-Za-z_$][\w$]*):[A-Za-z_$][\w$]*\.rarity===`satanic`\?([A-Za-z_$][\w$]*):([A-Za-z_$][\w$]*)/,
    )

if (!selectorMatch) {
    throw new Error(
        'Could not find HeroSiegeDB image maps.',
    )
}

const [
    ,
    angelicVar,
    satanicVar,
    heroicVar,
] = selectorMatch


console.log('')
console.log(
    'HeroSiegeDB image maps',
)

console.log(
    '======================',
)

console.log('')

console.log(
    `Angelic: ${angelicVar}`,
)

console.log(
    `Satanic: ${satanicVar}`,
)

console.log(
    `Heroic:  ${heroicVar}`,
)


/* ========================================
   EXTRACT IMAGE MAP
   ======================================== */

function escapeRegex(value) {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
    )
}


function extractMap(
    variableName,
) {
    const pattern =
        new RegExp(
            `\\b${escapeRegex(variableName)}=\\{([^}]*)\\}`,
        )

    const match =
        source.match(pattern)

    if (!match) {
        throw new Error(
            `Could not extract map ${variableName}`,
        )
    }

    const body =
        match[1]

    const result =
        new Map()

    const entryPattern =
        /(?:"([^"]+)"|'([^']+)'|([^,:{}\s]+)):(\d+)/g

    for (
        const entry
        of body.matchAll(
        entryPattern,
    )
        ) {
        const slug =
            entry[1] ??
            entry[2] ??
            entry[3]

        const frames =
            Number(
                entry[4],
            )

        result.set(
            slug,
            frames,
        )
    }

    return result
}


const imageMaps = {
    angelic:
        extractMap(
            angelicVar,
        ),

    satanic:
        extractMap(
            satanicVar,
        ),

    heroic:
        extractMap(
            heroicVar,
        ),
}


console.log('')

console.log(
    `Angelic images: ${imageMaps.angelic.size}`,
)

console.log(
    `Satanic images: ${imageMaps.satanic.size}`,
)

console.log(
    `Heroic images:  ${imageMaps.heroic.size}`,
)


/* ========================================
   ITEM NAME MATCHING
   ======================================== */

function getWords(name) {
    return String(
        name ?? '',
    )
        .replace(
            /['.]/g,
            '',
        )
        .toLowerCase()
        .split(/\s+/)
        .filter(
            word =>
                word.length > 1,
        )
}


function normalizeSlug(
    slug,
) {
    return slug
        .toLowerCase()
        .replace(
            /_/g,
            ' ',
        )
}


function getImageMap(
    item,
) {
    const rarity =
        String(
            item.rarity_id ?? '',
        ).toLowerCase()

    if (
        rarity ===
        'angelic'
    ) {
        return imageMaps.angelic
    }

    if (
        rarity ===
        'satanic'
    ) {
        return imageMaps.satanic
    }

    return imageMaps.heroic
}

const IMAGE_OVERRIDES = {
    'st. nimo\'s lightbringer':
        'Weapon_Cane_Nimos_Lightbringer',

    'pagan gop\'s blasphemy':
        'Weapon_Cane_Pagan_Gods_Blasphemy',
}

function findImage(
    item,
) {
    const map =
        getImageMap(
            item,
        )

    const words =
        getWords(
            item.name,
        )

    const override =
        IMAGE_OVERRIDES[
            String(item.name)
                .trim()
                .toLowerCase()
            ]

    const slug =
        override ??
        [...map.keys()]
            .find(key => {
                const normalized =
                    normalizeSlug(key)

                return words.every(
                    word =>
                        normalized.includes(word),
                )
            })

    if (!slug) {
        return null
    }

    return {
        slug,

        frames:
            map.get(
                slug,
            ) ?? 0,
    }
}


/* ========================================
   ANALYZE ITEMS
   ======================================== */

const matched = []

const missing = []

const staticImages = []

const singleFrameImages = []

const animated = []


for (
    const item
    of items
    ) {
    const image =
        findImage(
            item,
        )

    if (!image) {
        missing.push(
            item,
        )

        continue
    }

    matched.push({
        ...item,
        ...image,
    })

    /*
     * 0:
     * slug_spr.png
     */
    if (
        image.frames === 0
    ) {
        staticImages.push({
            name:
            item.name,

            rarity:
            item.rarity_id,

            slug:
            image.slug,

            frames: 0,
        })

        continue
    }

    /*
     * 1:
     * slug_spr_0.png
     *
     * Technically frame-based,
     * but not animated.
     */
    if (
        image.frames === 1
    ) {
        singleFrameImages.push({
            name:
            item.name,

            rarity:
            item.rarity_id,

            slug:
            image.slug,

            frames: 1,
        })

        continue
    }

    /*
     * 2+:
     * real animation.
     */
    animated.push({
        name:
        item.name,

        rarity:
        item.rarity_id,

        slug:
        image.slug,

        frames:
        image.frames,
    })
}


/* ========================================
   SPLIT MISSING ITEMS
   ======================================== */

const missingRunewords =
    missing.filter(
        item =>
            item.rarity_id ===
            'runeword',
    )

const missingItems =
    missing.filter(
        item =>
            item.rarity_id !==
            'runeword',
    )


/* ========================================
   REPORT
   ======================================== */

console.log('')
console.log(
    'Results',
)

console.log(
    '======================',
)

console.log('')

console.log(
    `Items:        ${items.length}`,
)

console.log(
    `Matched:      ${matched.length}`,
)

console.log(
    `Static:       ${staticImages.length}`,
)

console.log(
    `Single frame: ${singleFrameImages.length}`,
)

console.log(
    `Animated:     ${animated.length}`,
)

console.log(
    `Missing:      ${missing.length}`,
)


console.log('')

console.log(
    `Missing runewords: ${missingRunewords.length}`,
)

console.log(
    `Missing real items: ${missingItems.length}`,
)


console.log('')
console.log(
    'Animated examples:',
)

for (
    const item
    of animated.slice(
    0,
    15,
)
    ) {
    console.log(
        `  ${item.name} | ${item.rarity} | ${item.frames} frames | ${item.slug}`,
    )
}


console.log('')
console.log(
    'Single-frame examples:',
)

for (
    const item
    of singleFrameImages.slice(
    0,
    10,
)
    ) {
    console.log(
        `  ${item.name} | ${item.rarity} | ${item.slug}`,
    )
}


console.log('')
console.log(
    'Missing real item examples:',
)

for (
    const item
    of missingItems.slice(
    0,
    30,
)
    ) {
    console.log(
        `  ${item.name} | ${item.rarity_id} | ${item.class_item_id}`,
    )
}


console.log('')
console.log(
    'Done.',
)