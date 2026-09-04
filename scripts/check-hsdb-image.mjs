import {
    readFile,
} from 'node:fs/promises'

const FILE =
    'tmp/herosiegedb/ItemService-CiYzb8kj.js'

const ITEM_NAME =
    'AIR MELON'

const source =
    await readFile(
        FILE,
        'utf8',
    )

const words =
    ITEM_NAME
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)

const matches = [
    ...source.matchAll(
        /["']?([A-Za-z0-9_]+)["']?\s*:\s*(\d+)/g,
    ),
]
    .map(match => ({
        slug: match[1],
        frames: Number(match[2]),
    }))
    .filter(item => {
        const normalized =
            item.slug
                .toLowerCase()
                .replace(/_/g, ' ')

        return words.every(
            word =>
                normalized.includes(word),
        )
    })

console.log('')
console.log(
    `Image matches for "${ITEM_NAME}"`,
)

console.log(
    '==============================',
)

console.log('')

if (matches.length === 0) {
    console.log(
        'No image slug found.',
    )
} else {
    for (const match of matches) {
        console.log(
            `Slug:   ${match.slug}`,
        )

        console.log(
            `Frames: ${match.frames}`,
        )

        console.log('')
    }
}