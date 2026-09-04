import {
    mkdir,
    readFile,
    writeFile,
} from 'node:fs/promises'

import {
    resolve,
} from 'node:path'

import {
    pathToFileURL,
} from 'node:url'


const LOCAL_FILE =
    'src/data/runewords.ts'

const HSDB_ITEMS_FILE =
    'tmp/herosiegedb-api/items.json'

const HSDB_RUNES_FILE =
    'tmp/herosiegedb-api/runes.json'

const TEMP_FILE =
    'tmp/runewords-compare.mjs'


/* ========================================
   LOAD LOCAL RUNEWORDS
   ======================================== */

const localSource =
    await readFile(
        LOCAL_FILE,
        'utf8',
    )

/*
 * runewords.ts est presque déjà du JS.
 * On retire juste le type TypeScript.
 */
const executableSource =
    localSource
        .replace(
            /^import type .*$/gm,
            '',
        )
        .replace(
            /export const runewords\s*:\s*Runeword\[\]\s*=/,
            'export const runewords =',
        )

await mkdir(
    'tmp',
    {
        recursive: true,
    },
)

await writeFile(
    TEMP_FILE,
    executableSource,
    'utf8',
)

const moduleUrl =
    pathToFileURL(
        resolve(TEMP_FILE),
    ).href

const {
    runewords: localRunewords,
} =
    await import(
        `${moduleUrl}?t=${Date.now()}`
        )


/* ========================================
   LOAD HSDB
   ======================================== */

const rawItems =
    JSON.parse(
        await readFile(
            HSDB_ITEMS_FILE,
            'utf8',
        ),
    )

const rawRunes =
    JSON.parse(
        await readFile(
            HSDB_RUNES_FILE,
            'utf8',
        ),
    )

const hsdbRunewords =
    rawItems.filter(
        item =>
            item.rarity_id ===
            'runeword',
    )


/* ========================================
   RUNE LOOKUP
   ======================================== */

const runeById =
    new Map()

for (
    const rune
    of rawRunes
    ) {
    runeById.set(
        String(rune.id)
            .toLowerCase(),
        rune.name,
    )
}


function getHsdbRunes(
    item,
) {
    return (
        item.runes ?? []
    ).map(id => {
        const key =
            String(id)
                .toLowerCase()

        return (
            runeById.get(key) ??
            String(id)
        )
    })
}


/* ========================================
   NORMALIZATION
   ======================================== */

function normalizeName(
    value,
) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            '',
        )
        .toLowerCase()
        .replace(
            /['’]/g,
            '',
        )
        .replace(
            /[^a-z0-9]+/g,
            ' ',
        )
        .trim()
}


function normalizeRune(
    value,
) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
}


function sameRunes(
    left,
    right,
) {
    if (
        left.length !==
        right.length
    ) {
        return false
    }

    return left.every(
        (rune, index) =>
            normalizeRune(rune) ===
            normalizeRune(
                right[index],
            ),
    )
}


/* ========================================
   MAP BY NAME
   ======================================== */

const localByName =
    new Map(
        localRunewords.map(
            runeword => [
                normalizeName(
                    runeword.name,
                ),
                runeword,
            ],
        ),
    )

const hsdbByName =
    new Map(
        hsdbRunewords.map(
            runeword => [
                normalizeName(
                    runeword.name,
                ),
                runeword,
            ],
        ),
    )


/* ========================================
   COMPARE
   ======================================== */

const onlyLocal = []

const onlyHsdb = []

const runeDifferences = []

const levelDifferences = []

const sameNames = []


for (
    const local
    of localRunewords
    ) {
    const key =
        normalizeName(
            local.name,
        )

    const hsdb =
        hsdbByName.get(key)

    if (!hsdb) {
        onlyLocal.push(local)

        continue
    }

    sameNames.push(
        local.name,
    )

    const hsdbRunes =
        getHsdbRunes(
            hsdb,
        )

    if (
        !sameRunes(
            local.runes,
            hsdbRunes,
        )
    ) {
        runeDifferences.push({
            name:
            local.name,

            local:
            local.runes,

            hsdb:
            hsdbRunes,
        })
    }

    const hsdbLevel =
        hsdb.required_level ??
        null

    if (
        local.level !==
        hsdbLevel
    ) {
        levelDifferences.push({
            name:
            local.name,

            local:
            local.level,

            hsdb:
            hsdbLevel,
        })
    }
}


for (
    const hsdb
    of hsdbRunewords
    ) {
    const key =
        normalizeName(
            hsdb.name,
        )

    if (
        !localByName.has(key)
    ) {
        onlyHsdb.push(
            hsdb,
        )
    }
}


/* ========================================
   REPORT
   ======================================== */

console.log('')
console.log(
    'Hero Craft ↔ HeroSiegeDB Runewords',
)

console.log(
    '==================================',
)

console.log('')

console.log(
    `Hero Craft: ${localRunewords.length}`,
)

console.log(
    `HSDB:       ${hsdbRunewords.length}`,
)

console.log(
    `Same names: ${sameNames.length}`,
)

console.log('')

console.log(
    `Only Hero Craft: ${onlyLocal.length}`,
)

console.log(
    `Only HSDB:       ${onlyHsdb.length}`,
)

console.log(
    `Rune differences: ${runeDifferences.length}`,
)

console.log(
    `Level differences: ${levelDifferences.length}`,
)


console.log('')
console.log(
    'Only Hero Craft:',
)

for (
    const runeword
    of onlyLocal
    ) {
    console.log(
        `  ${runeword.name} | ${runeword.runes.join(' → ')}`,
    )
}


console.log('')
console.log(
    'Only HeroSiegeDB:',
)

for (
    const runeword
    of onlyHsdb
    ) {
    console.log(
        `  ${runeword.name} | ${getHsdbRunes(runeword).join(' → ')}`,
    )
}


console.log('')
console.log(
    'Rune differences:',
)

for (
    const diff
    of runeDifferences
    ) {
    console.log('')
    console.log(
        `  ${diff.name}`,
    )

    console.log(
        `    Hero Craft: ${diff.local.join(' → ')}`,
    )

    console.log(
        `    HSDB:       ${diff.hsdb.join(' → ')}`,
    )
}


console.log('')
console.log(
    'Level differences:',
)

for (
    const diff
    of levelDifferences
    ) {
    console.log(
        `  ${diff.name}: Hero Craft=${diff.local} | HSDB=${diff.hsdb}`,
    )
}


console.log('')
console.log('Done.')