import {
    readdir,
    readFile,
} from 'node:fs/promises'

const DIR =
    'src/data/generated'

function normalizeName(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
}

const files =
    await readdir(DIR)

const hsdb =
    JSON.parse(
        await readFile(
            `${DIR}/hsdb-items.json`,
            'utf8',
        ),
    )

const wiki = []

for (const file of files) {
    if (
        !file.endsWith('.json') ||
        file === 'hsdb-items.json'
    ) {
        continue
    }

    const data =
        JSON.parse(
            await readFile(
                `${DIR}/${file}`,
                'utf8',
            ),
        )

    if (Array.isArray(data)) {
        wiki.push(...data)
    }
}

const hsdbNames =
    new Map(
        hsdb.map(item => [
            normalizeName(item.name),
            item,
        ]),
    )

const exactNameMatches =
    wiki.filter(item =>
        hsdbNames.has(
            normalizeName(item.name),
        ),
    )

const sameNameDifferentType =
    exactNameMatches.filter(
        wikiItem => {
            const hsdbItem =
                hsdbNames.get(
                    normalizeName(
                        wikiItem.name,
                    ),
                )

            return (
                hsdbItem &&
                hsdbItem.type !==
                wikiItem.type
            )
        },
    )

console.log('')
console.log('Item overlap check')
console.log('==================')
console.log('')

console.log(
    `Wiki items: ${wiki.length}`,
)

console.log(
    `HSDB items: ${hsdb.length}`,
)

console.log(
    `Same name: ${exactNameMatches.length}`,
)

console.log(
    `Same name but different type: ${sameNameDifferentType.length}`,
)

console.log('')
console.log(
    'Different type examples:',
)

for (
    const item
    of sameNameDifferentType.slice(0, 20)
    ) {
    const hsdbItem =
        hsdbNames.get(
            normalizeName(item.name),
        )

    console.log(
        `${item.name}: wiki="${item.type}" | hsdb="${hsdbItem.type}"`,
    )
}