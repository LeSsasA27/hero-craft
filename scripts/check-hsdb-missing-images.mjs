import {
    readFile,
} from 'node:fs/promises'

const BUNDLE_FILE =
    'tmp/herosiegedb/ItemService-CiYzb8kj.js'

const ITEMS_FILE =
    'tmp/herosiegedb-api/items.json'


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
   FIND IMAGE MAPS
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

    const result =
        new Map()

    const entryPattern =
        /(?:"([^"]+)"|'([^']+)'|([^,:{}\s]+)):(\d+)/g

    for (
        const entry
        of match[1].matchAll(
        entryPattern,
    )
        ) {
        const slug =
            entry[1] ??
            entry[2] ??
            entry[3]

        result.set(
            slug,
            Number(entry[4]),
        )
    }

    return result
}


const maps = {
    angelic:
        extractMap(angelicVar),

    satanic:
        extractMap(satanicVar),

    heroic:
        extractMap(heroicVar),
}


/* ========================================
   NORMALIZATION
   ======================================== */

function normalize(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            '',
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            ' ',
        )
        .trim()
}


function words(value) {
    return normalize(value)
        .split(/\s+/)
        .filter(
            word =>
                word.length > 1,
        )
}


function getMap(item) {
    if (
        item.rarity_id ===
        'angelic'
    ) {
        return maps.angelic
    }

    if (
        item.rarity_id ===
        'satanic'
    ) {
        return maps.satanic
    }

    return maps.heroic
}


/* ========================================
   CURRENT MATCHER
   ======================================== */

function currentMatch(item) {
    const map =
        getMap(item)

    const itemWords =
        String(item.name)
            .replace(/['.]/g, '')
            .toLowerCase()
            .split(/\s+/)
            .filter(
                word =>
                    word.length > 1,
            )

    return [...map.keys()]
        .find(slug => {
            const normalized =
                slug
                    .toLowerCase()
                    .replace(
                        /_/g,
                        ' ',
                    )

            return itemWords.every(
                word =>
                    normalized.includes(
                        word,
                    ),
            )
        })
}


/* ========================================
   SCORE CANDIDATES
   ======================================== */

function scoreCandidate(
    itemName,
    slug,
) {
    const itemWords =
        words(itemName)

    const slugWords =
        words(slug)

    let score = 0

    for (
        const itemWord
        of itemWords
        ) {
        for (
            const slugWord
            of slugWords
            ) {
            if (
                itemWord ===
                slugWord
            ) {
                score += 5
                continue
            }

            if (
                itemWord.includes(
                    slugWord,
                ) ||
                slugWord.includes(
                    itemWord,
                )
            ) {
                score += 2
            }
        }
    }

    return score
}


/* ========================================
   MISSING REAL ITEMS
   ======================================== */

const missing =
    items.filter(
        item =>
            item.rarity_id !==
            'runeword' &&
            !currentMatch(item),
    )


console.log('')
console.log(
    'HeroSiegeDB missing image candidates',
)

console.log(
    '====================================',
)

console.log('')

console.log(
    `Missing real items: ${missing.length}`,
)


for (
    const item
    of missing
    ) {
    const map =
        getMap(item)

    const candidates =
        [...map.keys()]
            .map(slug => ({
                slug,

                frames:
                    map.get(slug),

                score:
                    scoreCandidate(
                        item.name,
                        slug,
                    ),
            }))
            .sort(
                (a, b) =>
                    b.score -
                    a.score,
            )
            .slice(
                0,
                5,
            )

    console.log('')
    console.log(
        `=== ${item.name} ===`,
    )

    console.log(
        `${item.rarity_id} | ${item.class_item_id}`,
    )

    for (
        const candidate
        of candidates
        ) {
        console.log(
            `  ${candidate.score.toString().padStart(2)} | ${candidate.frames} frames | ${candidate.slug}`,
        )
    }
}


console.log('')
console.log('Done.')