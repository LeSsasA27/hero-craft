import {
    readFile,
} from 'node:fs/promises'

const BASE_URL =
    'https://herosiegedb.com'

const BUNDLE_FILE =
    'tmp/herosiegedb/ItemService-CiYzb8kj.js'

const source =
    await readFile(
        BUNDLE_FILE,
        'utf8',
    )

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
            `Could not extract image map: ${variableName}`,
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


const imageMaps = {
    angelic:
        extractMap(angelicVar),

    satanic:
        extractMap(satanicVar),

    heroic:
        extractMap(heroicVar),
}


function getWords(name) {
    return String(name ?? '')
        .replace(/['.]/g, '')
        .toLowerCase()
        .split(/\s+/)
        .filter(
            word =>
                word.length > 1,
        )
}


function normalizeSlug(slug) {
    return slug
        .toLowerCase()
        .replace(/_/g, ' ')
}


function getFolder(item) {
    const rarity =
        String(
            item.rarity_id ?? '',
        ).toLowerCase()

    if (rarity === 'angelic') {
        return 'angelic'
    }

    if (rarity === 'satanic') {
        return 'satanic'
    }

    return 'heroic'
}

const IMAGE_OVERRIDES = {
    'st. nimo\'s lightbringer':
        'Weapon_Cane_Nimos_Lightbringer',

    'pagan gop\'s blasphemy':
        'Weapon_Cane_Pagan_Gods_Blasphemy',
}

export function getHsdbImage(
    item,
) {
    const folder =
        getFolder(item)

    const map =
        imageMaps[folder]

    const words =
        getWords(item.name)

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

    const frameCount =
        map.get(slug) ?? 0

    /*
     * Static sprite.
     */
    if (frameCount === 0) {
        return {
            image:
                `${BASE_URL}/assets/${folder}/${slug}_spr.png`,

            imageFrames:
            undefined,
        }
    }

    /*
     * HeroSiegeDB utilise _spr_0.png
     * même lorsqu'il n'y a qu'une frame.
     */
    const frames =
        Array.from(
            {
                length:
                frameCount,
            },
            (_, index) =>
                `${BASE_URL}/assets/${folder}/${slug}_spr_${index}.png`,
        )

    return {
        image: frames[0],

        /*
         * Une seule frame = pas besoin
         * d'un système d'animation.
         */
        imageFrames:
            frames.length > 1
                ? frames
                : undefined,
    }
}