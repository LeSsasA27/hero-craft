import * as cheerio from 'cheerio'
import { mkdir, writeFile } from 'node:fs/promises'

const WIKI_BASE_URL = 'https://herosiege.wiki.gg'
const GENERATED_DIR = 'src/data/generated'

/* =========================================
   Item configuration
========================================= */

const ITEM_CATEGORIES = {
    Weapons: [
        'Swords',
        'Daggers',
        'Maces',
        'Axes',
        'Claws',
        'Polearms',
        'Chainsaws',
        'Staves',
        'Canes',
        'Wands',
        'Books',
        'Spellblades',
        'Bows',
        'Guns',
        'Flasks',
        'Throwing Weapons',
    ],

    Armor: [
        'Helmets',
        'Body Armors',
        'Gloves',
        'Boots',
        'Shield',
    ],

    Jewellery: [
        'Amulets',
        'Rings',
        'Belts',
    ],

    'Special Items': [
        'Charms',
        'Relics',
        'Glyphs',
        'Potions',
    ],
}

/**
 * Le nom affiché dans Hero Craft n'est pas toujours
 * exactement le slug utilisé par le wiki.
 */
const PAGE_OVERRIDES = {
    'Throwing Weapons': 'Throwing_Weapon',
}

/* =========================================
   Arguments
========================================= */

const type = process.argv[2]

if (!type) {
    console.error('')
    console.error('Missing item type.')
    console.error('')
    console.error('Example:')
    console.error('  npm run import:items -- Swords')
    console.error('')

    process.exit(1)
}

function getCategory(type) {
    for (const [category, types] of Object.entries(
        ITEM_CATEGORIES,
    )) {
        if (types.includes(type)) {
            return category
        }
    }

    return null
}

const category = getCategory(type)

if (!category) {
    console.error(`Unsupported item type: ${type}`)
    process.exit(1)
}

const pageName =
    PAGE_OVERRIDES[type] ??
    type.replace(/\s+/g, '_')

const fileName = type
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const URL =
    `${WIKI_BASE_URL}/wiki/${encodeURIComponent(pageName)}`

const OUTPUT_FILE =
    `${GENERATED_DIR}/${fileName}.json`

/* =========================================
   Text helpers
========================================= */

function removeHiddenContent(element, $) {
    element
        .find(`
      .sortkey,
      .mw-sortkey,
      .sorttext,
      .nomobile,
      script,
      style,
      [aria-hidden="true"],
      [style*="display:none"],
      [style*="display: none"]
    `)
        .remove()

    return element
}

function cleanText(value) {
    return value
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function cleanCell(cell, $) {
    if (!cell) {
        return ''
    }

    const clone = $(cell).clone()

    removeHiddenContent(clone, $)

    return cleanText(clone.text())
}

function cleanHeading(heading, $) {
    const headline = $(heading)
        .find('.mw-headline')
        .first()

    const text = headline.length
        ? headline.text()
        : $(heading).text()

    return cleanText(
        text.replace(/\[edit\]/gi, ''),
    )
}

/* =========================================
   Level
========================================= */

function parseLevel(value) {
    if (!value) {
        return null
    }

    const match = value.match(/\d+/)

    return match
        ? Number(match[0])
        : null
}

/* =========================================
   Images
========================================= */

function normalizeUrl(url) {
    if (!url) {
        return undefined
    }

    if (url.startsWith('//')) {
        return `https:${url}`
    }

    if (url.startsWith('/')) {
        return `${WIKI_BASE_URL}${url}`
    }

    return url
}

function extractImage(row, $) {
    if (!row) {
        return undefined
    }

    const image = $(row)
        .find('img')
        .first()

    if (!image.length) {
        return undefined
    }

    let url =
        image.attr('data-src') ??
        image.attr('data-lazy-src') ??
        image.attr('src')

    // Certains wikis ne mettent l'image réelle que dans srcset
    if (!url) {
        const srcset = image.attr('srcset')

        if (srcset) {
            url = srcset
                .split(',')
                .at(-1)
                ?.trim()
                .split(' ')[0]
        }
    }

    return normalizeUrl(url)
}

/* =========================================
   Stats
========================================= */

function extractStats(cell, $) {
    if (!cell) {
        return []
    }

    const clone = $(cell).clone()

    removeHiddenContent(clone, $)

    /*
     * Transforme les éléments servant de séparateurs
     * en vraies nouvelles lignes.
     */
    clone.find('br').replaceWith('\n')

    clone.find('li').each((_, element) => {
        $(element).append('\n')
    })

    clone.find('p').each((_, element) => {
        $(element).append('\n')
    })

    return clone
        .text()
        .replace(/\u00a0/g, ' ')
        .split('\n')
        .map(cleanText)
        .filter(Boolean)
}

/* =========================================
   Table helpers
========================================= */

function getHeaders(table, $) {
    const headerRow = table
        .find('tr')
        .filter((_, row) => {
            return $(row).find('th').length > 0
        })
        .first()

    if (!headerRow.length) {
        return []
    }

    return headerRow
        .find('th')
        .map((_, cell) => {
            return cleanCell(cell, $)
        })
        .get()
}

function findColumn(headers, names) {
    const normalizedNames = names.map(name =>
        name.toLowerCase(),
    )

    return headers.findIndex(header =>
        normalizedNames.includes(
            header.toLowerCase(),
        ),
    )
}

function findTableAfterHeading(heading, $) {
    let current = $(heading).next()

    while (current.length) {
        /*
         * Dès qu'on rencontre une nouvelle section,
         * on arrête la recherche.
         */
        if (current.is('h2, h3')) {
            return null
        }

        if (current.is('table')) {
            return current
        }

        const nestedTable = current
            .find('table')
            .first()

        if (nestedTable.length) {
            return nestedTable
        }

        current = current.next()
    }

    return null
}

/* =========================================
   Import
========================================= */

console.log('')
console.log('Hero Craft — Item Import')
console.log('==========================')
console.log(`Type:     ${type}`)
console.log(`Category: ${category}`)
console.log(`Source:   ${URL}`)
console.log('')

const response = await fetch(URL, {
    headers: {
        'User-Agent': 'HeroCraft Item Importer',
        Accept: 'text/html',
    },
})

if (!response.ok) {
    throw new Error(
        `Failed to fetch ${type} page: ` +
        `${response.status} ${response.statusText}`,
    )
}

const html = await response.text()
const $ = cheerio.load(html)

const items = []
const seenItems = new Set()

$('h2, h3').each((_, heading) => {
    const rarity = cleanHeading(heading, $)

    if (!rarity) {
        return
    }

    const table =
        findTableAfterHeading(heading, $)

    if (!table?.length) {
        return
    }

    const headers = getHeaders(table, $)

    if (headers.length === 0) {
        return
    }

    /*
     * Les tableaux intéressants doivent au minimum
     * contenir Item + Tier + Level.
     */
    const itemIndex = findColumn(
        headers,
        ['Item', 'Name'],
    )

    const tierIndex = findColumn(
        headers,
        ['Tier'],
    )

    const levelIndex = findColumn(
        headers,
        ['Level', 'Lvl'],
    )

    const statsIndex = findColumn(
        headers,
        ['Stats', 'Stat'],
    )

    if (itemIndex === -1) {
        return
    }

    table.find('tr').each((_, row) => {
        const cells = $(row).find('td')

        if (!cells.length) {
            return
        }

        /*
         * Les indexes des headers doivent correspondre
         * aux cellules de la ligne.
         */
        if (cells.length < headers.length) {
            return
        }

        const name = cleanCell(
            cells[itemIndex],
            $,
        )

        if (!name) {
            return
        }

        const uniqueKey =
            `${type}:${rarity}:${name}`

        if (seenItems.has(uniqueKey)) {
            return
        }

        const tier =
            tierIndex >= 0
                ? cleanCell(cells[tierIndex], $)
                : ''

        const levelText =
            levelIndex >= 0
                ? cleanCell(cells[levelIndex], $)
                : ''

        const image = extractImage(
            row,
            $,
        )

        const stats =
            statsIndex >= 0
                ? extractStats(
                    cells[statsIndex],
                    $,
                )
                : []

        /*
         * Toutes les colonnes autres que :
         *
         * Item
         * Tier
         * Level
         * Stats
         *
         * deviennent automatiquement des properties.
         *
         * Sword :
         * Damage / APS / DPS
         *
         * Armor :
         * Defense
         *
         * etc.
         */
        const ignoredIndexes = new Set([
            itemIndex,
            tierIndex,
            levelIndex,
            statsIndex,
        ])

        const properties = {}

        headers.forEach((header, index) => {
            if (ignoredIndexes.has(index)) {
                return
            }

            if (!header) {
                return
            }

            const value = cleanCell(
                cells[index],
                $,
            )

            if (!value) {
                return
            }

            properties[header] = value
        })

        seenItems.add(uniqueKey)

        items.push({
            name,
            category,
            type,
            rarity,
            tier,
            level: parseLevel(levelText),
            image,
            properties,
            stats,
        })
    })
})

/* =========================================
   Validation
========================================= */

if (items.length === 0) {
    throw new Error(
        `No ${type} were imported. ` +
        'The wiki table structure may have changed.',
    )
}

/* =========================================
   Output
========================================= */

await mkdir(
    GENERATED_DIR,
    {
        recursive: true,
    },
)

await writeFile(
    OUTPUT_FILE,
    `${JSON.stringify(items, null, 2)}\n`,
    'utf8',
)

const imagesFound =
    items.filter(item => item.image).length

console.log('')
console.log('Import completed')
console.log('==========================')
console.log(`Items:  ${items.length}`)
console.log(
    `Images: ${imagesFound}/${items.length}`,
)
console.log(`Output: ${OUTPUT_FILE}`)
console.log('')