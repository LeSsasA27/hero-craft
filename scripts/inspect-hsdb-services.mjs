import {
    readFile,
} from 'node:fs/promises'

const files = [
    'tmp/herosiegedb/ItemService-CiYzb8kj.js',
    'tmp/herosiegedb/AffixService-ClqvAUXQ.js',
]

const patterns = [
    'fetch(',
    'axios',
    '/api/',
    'api/',
    'http://',
    'https://',
    'items',
    'item',
    'affixes',
    'affix',
    'search',
    'filter',
    'page',
    'limit',
]

function showContexts(
    source,
    pattern,
) {
    const lower =
        source.toLowerCase()

    const search =
        pattern.toLowerCase()

    let index =
        lower.indexOf(search)

    let count = 0

    while (
        index !== -1 &&
        count < 10
        ) {
        const start =
            Math.max(
                0,
                index - 300,
            )

        const end =
            Math.min(
                source.length,
                index + 600,
            )

        console.log('')
        console.log(
            `----- ${pattern} -----`,
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

        count += 1

        index =
            lower.indexOf(
                search,
                index + search.length,
            )
    }
}


for (const file of files) {
    console.log('')
    console.log(
        '================================',
    )

    console.log(file)

    console.log(
        '================================',
    )

    const source =
        await readFile(
            file,
            'utf8',
        )

    console.log(
        `Size: ${source.length}`,
    )

    for (
        const pattern
        of patterns
        ) {
        showContexts(
            source,
            pattern,
        )
    }


    /*
     * On extrait aussi toutes les chaînes
     * intéressantes du bundle.
     */
    console.log('')
    console.log(
        'Interesting strings:',
    )

    console.log(
        '--------------------------------',
    )

    const interesting =
        new Set()

    for (
        const match
        of source.matchAll(
        /["'`]([^"'`]{2,250})["'`]/g,
    )
        ) {
        const value =
            match[1]

        const normalized =
            value.toLowerCase()

        if (
            normalized.includes('item') ||
            normalized.includes('affix') ||
            normalized.includes('/api') ||
            normalized.includes('http') ||
            normalized.includes('search') ||
            normalized.includes('limit')
        ) {
            interesting.add(value)
        }
    }

    for (
        const value
        of interesting
        ) {
        console.log(value)
    }
}