import {
    mkdir,
    writeFile,
} from 'node:fs/promises'

const PAGE_URL =
    'https://herosiegedb.com/items'

const OUTPUT_DIR =
    'tmp/herosiegedb'

const KEYWORDS = [
    'item',
    'items',
    'affix',
    'affixes',
    'rarity',
    'angelic',
    'satanic',
    'heroic',
    'unholy',
    'drop',
    'drops',
    'stat',
    'stats',
    'supabase',
    'firebase',
    'graphql',
    'fetch(',
    'axios',
    '/api/',
]

await mkdir(
    OUTPUT_DIR,
    {
        recursive: true,
    },
)

function normalizeUrl(
    value,
    base,
) {
    if (!value) {
        return null
    }

    try {
        return new URL(
            value,
            base,
        ).href
    } catch {
        return null
    }
}

async function fetchText(url) {
    const response =
        await fetch(
            url,
            {
                headers: {
                    'User-Agent':
                        'HeroCraft Data Inspector',
                },
            },
        )

    if (!response.ok) {
        throw new Error(
            `${response.status} ${response.statusText}`,
        )
    }

    return response.text()
}

function extractAssetUrls(
    source,
    baseUrl,
) {
    const urls =
        new Set()

    const patterns = [
        /["'`](\/assets\/[^"'`\\\s]+)["'`]/g,
        /["'`](assets\/[^"'`\\\s]+)["'`]/g,
        /["'`]([^"'`\\\s]+\.(?:json|csv|js|mjs|txt))["'`]/g,
    ]

    for (const pattern of patterns) {
        for (
            const match
            of source.matchAll(pattern)
            ) {
            const url =
                normalizeUrl(
                    match[1],
                    baseUrl,
                )

            if (url) {
                urls.add(url)
            }
        }
    }

    return [
        ...urls,
    ]
}

function printKeywordContexts(
    source,
    label,
) {
    console.log('')
    console.log(
        `Keyword scan: ${label}`,
    )
    console.log(
        '--------------------------------',
    )

    const lower =
        source.toLowerCase()

    let found = false

    for (
        const keyword
        of KEYWORDS
        ) {
        const search =
            keyword.toLowerCase()

        let index =
            lower.indexOf(search)

        if (index === -1) {
            continue
        }

        found = true

        console.log('')
        console.log(
            `[${keyword}]`,
        )

        let shown = 0

        while (
            index !== -1 &&
            shown < 3
            ) {
            const start =
                Math.max(
                    0,
                    index - 180,
                )

            const end =
                Math.min(
                    source.length,
                    index +
                    keyword.length +
                    300,
                )

            console.log(
                source
                    .slice(
                        start,
                        end,
                    )
                    .replace(
                        /\s+/g,
                        ' ',
                    ),
            )

            console.log('---')

            shown += 1

            index =
                lower.indexOf(
                    search,
                    index + search.length,
                )
        }
    }

    if (!found) {
        console.log(
            'No interesting keywords found.',
        )
    }
}

console.log('')
console.log(
    'Hero Craft — HeroSiegeDB Deep Inspector',
)
console.log(
    '========================================',
)
console.log('')

const html =
    await fetchText(
        PAGE_URL,
    )

await writeFile(
    `${OUTPUT_DIR}/items-page.html`,
    html,
    'utf8',
)

console.log(
    `HTML: ${html.length} chars`,
)

const initialAssets =
    extractAssetUrls(
        html,
        PAGE_URL,
    )

console.log(
    `Initial assets: ${initialAssets.length}`,
)

const queue = [
    ...initialAssets,
]

const visited =
    new Set()

const discovered =
    new Set(
        initialAssets,
    )

while (queue.length) {
    const url =
        queue.shift()

    if (
        !url ||
        visited.has(url)
    ) {
        continue
    }

    visited.add(url)

    console.log('')
    console.log(
        `Inspecting: ${url}`,
    )

    try {
        const source =
            await fetchText(url)

        console.log(
            `Size: ${source.length} chars`,
        )

        const safeName =
            url
                .split('/')
                .at(-1)
                ?.replace(
                    /[^a-zA-Z0-9._-]/g,
                    '_',
                ) ??
            `asset-${visited.size}.txt`

        await writeFile(
            `${OUTPUT_DIR}/${safeName}`,
            source,
            'utf8',
        )

        printKeywordContexts(
            source,
            safeName,
        )

        const childAssets =
            extractAssetUrls(
                source,
                url,
            )

        for (
            const child
            of childAssets
            ) {
            if (
                discovered.has(child)
            ) {
                continue
            }

            discovered.add(child)

            /*
             * On limite l'inspection
             * au domaine HeroSiegeDB.
             */
            if (
                child.startsWith(
                    'https://herosiegedb.com/',
                )
            ) {
                queue.push(child)
            }
        }
    } catch (error) {
        console.warn(
            `Failed: ${url}`,
        )

        console.warn(
            error instanceof Error
                ? error.message
                : error,
        )
    }
}

console.log('')
console.log(
    '========================================',
)

console.log(
    `Assets discovered: ${discovered.size}`,
)

console.log(
    `Assets inspected:  ${visited.size}`,
)

console.log('')
console.log(
    'Discovered URLs:',
)

for (
    const url
    of discovered
    ) {
    console.log(url)
}

console.log('')
console.log(
    `Files saved to: ${OUTPUT_DIR}`,
)

console.log('')
console.log('Done.')