import {
    mkdir,
    writeFile,
} from 'node:fs/promises'

const BASE_URL =
    'https://herosiegedb.com'

const OUTPUT_DIR =
    'tmp/herosiegedb-api'

const endpoints = {
    items: '/api/items.php',
    affixes: '/api/affixes.php',
    dropAreas: '/api/drop_area.php',
    subclasses: '/api/subclass_items.php',
    runes: '/api/rune.php',
}

await mkdir(
    OUTPUT_DIR,
    {
        recursive: true,
    },
)

async function fetchJson(
    name,
    endpoint,
) {
    const url =
        `${BASE_URL}${endpoint}`

    console.log(
        `Fetching ${name}...`,
    )

    const response =
        await fetch(
            url,
            {
                headers: {
                    Accept: 'application/json',
                    'User-Agent':
                        'HeroCraft Data Importer',
                },
            },
        )

    if (!response.ok) {
        throw new Error(
            `${name}: HTTP ${response.status}`,
        )
    }

    const data =
        await response.json()

    await writeFile(
        `${OUTPUT_DIR}/${name}.json`,
        `${JSON.stringify(
            data,
            null,
            2,
        )}\n`,
        'utf8',
    )

    console.log(
        `${name}: ${
            Array.isArray(data)
                ? data.length
                : Object.keys(data).length
        } records`,
    )

    return data
}

console.log('')
console.log(
    'Hero Craft — HeroSiegeDB Raw Import',
)
console.log(
    '===================================',
)
console.log('')

const items =
    await fetchJson(
        'items',
        endpoints.items,
    )

const affixes =
    await fetchJson(
        'affixes',
        endpoints.affixes,
    )

await fetchJson(
    'drop-areas',
    endpoints.dropAreas,
)

await fetchJson(
    'subclasses',
    endpoints.subclasses,
)

await fetchJson(
    'runes',
    endpoints.runes,
)

console.log('')
console.log(
    '===================================',
)

console.log(
    `Items:   ${items.length}`,
)

console.log(
    `Affixes: ${affixes.length}`,
)

console.log('')

if (items.length > 0) {
    console.log(
        'First item:',
    )

    console.log(
        JSON.stringify(
            items[0],
            null,
            2,
        ),
    )
}

console.log('')
console.log(
    `Saved to ${OUTPUT_DIR}`,
)

console.log('')
console.log('Done.')