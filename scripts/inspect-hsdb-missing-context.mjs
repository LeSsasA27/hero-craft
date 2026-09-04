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


const TARGETS = [
    'RIMSKIN ASSASSINS',
    'STRANDED BOOT',
    'Crown of the North',
    'F4-Tactical Rifle',
    'Pla-Yer\'s Choice',
    'Ring of the Cowraven',
    'Sassy\'s Dislocated Foot',
    'Shield of Shattered Elements',
    'Signet of Bifröst',
]


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
            '',
        )
}


function showContexts(
    label,
    searchValue,
) {
    if (!searchValue) {
        return
    }

    const lowerSource =
        source.toLowerCase()

    const lowerSearch =
        searchValue.toLowerCase()

    let index =
        lowerSource.indexOf(
            lowerSearch,
        )

    let count = 0

    while (
        index !== -1 &&
        count < 5
        ) {
        const start =
            Math.max(
                0,
                index - 250,
            )

        const end =
            Math.min(
                source.length,
                index + lowerSearch.length + 500,
            )

        console.log('')
        console.log(
            `--- ${label}: ${searchValue} ---`,
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
            lowerSource.indexOf(
                lowerSearch,
                index + lowerSearch.length,
            )
    }
}


console.log('')
console.log(
    'HeroSiegeDB missing item contexts',
)

console.log(
    '=================================',
)


for (
    const targetName
    of TARGETS
    ) {
    const item =
        items.find(
            item =>
                item.name ===
                targetName,
        )

    if (!item) {
        console.log('')
        console.log(
            `NOT FOUND: ${targetName}`,
        )

        continue
    }

    console.log('')
    console.log('')
    console.log(
        `================================`,
    )

    console.log(
        item.name,
    )

    console.log(
        `id: ${item.id}`,
    )

    console.log(
        `rarity: ${item.rarity_id}`,
    )

    console.log(
        `class: ${item.class_item_id}`,
    )

    console.log(
        `subclasses: ${(item.subclass_ids ?? []).join(', ')}`,
    )

    console.log(
        `================================`,
    )


    /*
     * Exact display name.
     */
    showContexts(
        'NAME',
        item.name,
    )


    /*
     * API item ID.
     */
    showContexts(
        'ID',
        String(item.id),
    )


    /*
     * Normalized ID/name.
     */
    const normalizedName =
        normalize(
            item.name,
        )

    if (
        normalizedName !==
        normalize(item.id)
    ) {
        showContexts(
            'NORMALIZED NAME',
            normalizedName,
        )
    }


    /*
     * Individual meaningful words.
     */
    const words =
        item.name
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                '',
            )
            .replace(
                /[^a-zA-Z0-9]+/g,
                ' ',
            )
            .split(/\s+/)
            .filter(
                word =>
                    word.length >= 5,
            )

    for (
        const word
        of words
        ) {
        showContexts(
            'WORD',
            word,
        )
    }
}


console.log('')
console.log('')
console.log('Done.')