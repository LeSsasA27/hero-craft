import * as cheerio from 'cheerio'
import {
    mkdir,
    writeFile,
} from 'node:fs/promises'

/* =========================================
   CONFIG
   ========================================= */

const WIKI_BASE_URL =
    'https://herosiege.wiki.gg'

const GENERATED_DIR =
    'src/data/generated'

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

/*
 * Certaines pages du wiki n'utilisent pas
 * exactement le même slug que notre ItemType.
 */
const PAGE_OVERRIDES = {
    'Throwing Weapons': 'Throwing_Weapon',
}


/*
 * Important :
 *
 * Seules ces valeurs peuvent devenir item.rarity.
 *
 * Un heading de Relic comme :
 *
 *   Chance after each kills
 *
 * ne sera donc PAS considéré comme une rareté.
 */
const VALID_RARITIES = [
    'Common',
    'Magic',
    'Rare',
    'Legendary',
    'Mythic',
    'Heroic',
    'Satanic',
    'Angelic',
    'Unholy',
    'Set',
    'Satanic Set',
]


/* =========================================
   ARGUMENT
   ========================================= */

const type =
    process.argv
        .slice(2)
        .join(' ')
        .trim()

if (!type) {
    console.error('')
    console.error(
        'Usage: npm run import:items -- Swords',
    )
    console.error('')

    process.exit(1)
}


/* =========================================
   CATEGORY
   ========================================= */

function getCategory(itemType) {
    for (
        const [category, types]
        of Object.entries(ITEM_CATEGORIES)
        ) {
        if (types.includes(itemType)) {
            return category
        }
    }

    return null
}

const category =
    getCategory(type)

if (!category) {
    console.error('')
    console.error(
        `Unknown item type: ${type}`,
    )
    console.error('')

    console.error(
        'Available types:',
    )

    for (
        const [categoryName, types]
        of Object.entries(ITEM_CATEGORIES)
        ) {
        console.error('')
        console.error(`${categoryName}:`)

        for (const itemType of types) {
            console.error(`  - ${itemType}`)
        }
    }

    process.exit(1)
}


/* =========================================
   PAGE / OUTPUT
   ========================================= */

const pageName =
    PAGE_OVERRIDES[type] ??
    type.replace(/\s+/g, '_')

const pageUrl =
    `${WIKI_BASE_URL}/wiki/${encodeURIComponent(pageName)}`

const fileName =
    type
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')


/* =========================================
   TEXT HELPERS
   ========================================= */

function removeHiddenContent(element, $) {
    const clone =
        $(element).clone()

    clone
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

    return clone
}


function cleanText(value) {
    return String(value ?? '')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\s*\n\s*/g, ' ')
        .trim()
}


function cleanCell(cell, $) {
    if (!cell) {
        return ''
    }

    const clone =
        removeHiddenContent(cell, $)

    return cleanText(
        clone.text(),
    )
}


function cleanHeading(heading, $) {
    if (!heading) {
        return ''
    }

    const clone =
        removeHiddenContent(heading, $)

    clone
        .find(`
      .mw-editsection,
      .mw-headline-number,
      sup.reference
    `)
        .remove()

    return cleanText(
        clone.text(),
    )
}


/* =========================================
   RARITY
   ========================================= */

function normalizeRarity(value) {
    const cleaned =
        cleanText(value)
            .replace(/\s+items?$/i, '')
            .trim()

    if (!cleaned) {
        return ''
    }

    const rarity =
        VALID_RARITIES.find(
            item =>
                item.toLowerCase() ===
                cleaned.toLowerCase(),
        )

    return rarity ?? ''
}


/* =========================================
   LEVEL
   ========================================= */

function parseLevel(value) {
    const text =
        cleanText(value)

    if (!text) {
        return null
    }

    const match =
        text.match(/\d+/)

    if (!match) {
        return null
    }

    const level =
        Number(match[0])

    return Number.isFinite(level)
        ? level
        : null
}


/* =========================================
   URL
   ========================================= */

function normalizeUrl(value) {
    if (!value) {
        return undefined
    }

    let url =
        value.trim()

    if (!url) {
        return undefined
    }

    if (url.startsWith('//')) {
        return `https:${url}`
    }

    if (
        url.startsWith('http://') ||
        url.startsWith('https://')
    ) {
        return url
    }

    try {
        return new URL(
            url,
            WIKI_BASE_URL,
        ).href
    } catch {
        return undefined
    }
}


/* =========================================
   IMAGE
   ========================================= */

function getImageUrl(image, $) {
    if (!image?.length) {
        return undefined
    }

    const attributes = [
        'data-src',
        'data-lazy-src',
        'data-original',
        'src',
    ]

    for (const attribute of attributes) {
        const value =
            image.attr(attribute)

        if (
            value &&
            !value.startsWith('data:')
        ) {
            const normalized =
                normalizeUrl(value)

            if (normalized) {
                return normalized
            }
        }
    }

    /*
     * Certains tableaux mettent l'image réelle
     * uniquement dans srcset.
     */
    const srcset =
        image.attr('srcset')

    if (srcset) {
        const candidates =
            srcset
                .split(',')
                .map(entry =>
                    entry
                        .trim()
                        .split(/\s+/)[0],
                )
                .filter(Boolean)

        const candidate =
            candidates.at(-1)

        if (candidate) {
            return normalizeUrl(candidate)
        }
    }

    return undefined
}


function extractImage(
    row,
    itemCell,
    $,
) {
    /*
     * On cherche d'abord dans la cellule Item.
     */
    if (itemCell) {
        const itemImage =
            $(itemCell)
                .find('img')
                .first()

        const url =
            getImageUrl(
                itemImage,
                $,
            )

        if (url) {
            return url
        }
    }

    /*
     * Fallback important pour les Glyphs :
     * leur image peut être dans une autre cellule.
     */
    const rowImage =
        $(row)
            .find('img')
            .first()

    return getImageUrl(
        rowImage,
        $,
    )
}


/* =========================================
   ITEM NAME
   ========================================= */

function extractItemName(
    cell,
    $,
) {
    if (!cell) {
        return ''
    }

    const text =
        cleanCell(cell, $)

    if (text) {
        return text
    }

    /*
     * Fallback si la cellule contient surtout
     * une image ou un lien.
     */
    const linkTitle =
        $(cell)
            .find('a')
            .first()
            .attr('title')

    if (linkTitle) {
        return cleanText(linkTitle)
    }

    const imageAlt =
        $(cell)
            .find('img')
            .first()
            .attr('alt')

    if (imageAlt) {
        return cleanText(
            imageAlt
                .replace(/\.(png|jpg|jpeg|webp)$/i, ''),
        )
    }

    return ''
}


/* =========================================
   STATS
   ========================================= */

function extractStats(
    cell,
    $,
) {
    if (!cell) {
        return []
    }

    const clone =
        removeHiddenContent(
            cell,
            $,
        )

    /*
     * On transforme les éléments visuellement
     * séparés en vraies lignes.
     */
    clone
        .find('br')
        .replaceWith('\n')

    clone
        .find('li')
        .each((_, element) => {
            $(element).append('\n')
        })

    clone
        .find('p')
        .each((_, element) => {
            $(element).append('\n')
        })

    return [
        ...new Set(
            clone
                .text()
                .split('\n')
                .map(cleanText)
                .filter(Boolean),
        ),
    ]
}


/* =========================================
   TABLE HEADERS
   ========================================= */

function normalizeHeader(value) {
    return cleanText(value)
        .replace(/[†*]+$/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase()
}


function getHeaders(
    table,
    $,
) {
    let result = null

    $(table)
        .find('tr')
        .each((_, row) => {
            if (result) {
                return
            }

            const headerCells =
                $(row)
                    .children('th')
                    .toArray()

            if (
                headerCells.length === 0
            ) {
                return
            }

            const headers =
                headerCells.map(cell =>
                    cleanCell(cell, $),
                )

            result = {
                row,
                headers,
            }
        })

    return result
}


function findColumn(
    headers,
    names,
) {
    const normalizedHeaders =
        headers.map(
            normalizeHeader,
        )

    const normalizedNames =
        names.map(
            normalizeHeader,
        )

    /*
     * Exact match d'abord.
     */
    for (
        const name
        of normalizedNames
        ) {
        const index =
            normalizedHeaders.indexOf(name)

        if (index !== -1) {
            return index
        }
    }

    /*
     * Puis fallback pour des headers comme :
     * "Required Level"
     * "Item Name"
     */
    for (
        let index = 0;
        index < normalizedHeaders.length;
        index += 1
    ) {
        const header =
            normalizedHeaders[index]

        const matches =
            normalizedNames.some(name =>
                header.includes(name),
            )

        if (matches) {
            return index
        }
    }

    return -1
}


/* =========================================
   TABLE LOCATION
   ========================================= */

function findTableAfterHeading(
    heading,
    $,
) {
    let current =
        $(heading).next()

    while (current.length) {
        /*
         * Nouveau heading :
         * le tableau ne dépend plus du heading initial.
         */
        if (
            current.is(
                'h2, h3, h4',
            )
        ) {
            return null
        }

        if (current.is('table')) {
            return current.first()
        }

        const nestedTable =
            current
                .find('table')
                .first()

        if (nestedTable.length) {
            return nestedTable
        }

        current =
            current.next()
    }

    return null
}


/* =========================================
   FETCH
   ========================================= */

console.log('')
console.log(
    'Hero Craft — Item Import',
)
console.log(
    '==========================',
)
console.log(`Type:     ${type}`)
console.log(`Category: ${category}`)
console.log(`Source:   ${pageUrl}`)
console.log('')


const response =
    await fetch(
        pageUrl,
        {
            headers: {
                'User-Agent':
                    'HeroCraft Item Importer',
            },
        },
    )

if (!response.ok) {
    throw new Error(
        `Failed to fetch ${type} page: ${response.status} ${response.statusText}`,
    )
}

const html =
    await response.text()

const $ =
    cheerio.load(html)


/* =========================================
   IMPORT
   ========================================= */

const items = []

/*
 * Empêche le même tableau d'être importé
 * plusieurs fois lorsqu'il est proche de
 * plusieurs headings.
 */
const seenTables =
    new Set()

function isNavigationTable(table, $) {
    if (!table?.length) {
        return true
    }

    return table.closest(`
    .navbox,
    .navbox-container,
    .navigation-not-searchable,
    .mw-navigation
  `).length > 0
}

function importTable(
    table,
    inheritedRarity = '',
) {
    if (!table?.length) {
        return
    }

    if (isNavigationTable(table, $)) {
        return
    }

    const tableNode =
        table.get(0)

    if (!tableNode) {
        return
    }

    if (
        seenTables.has(tableNode)
    ) {
        return
    }

    seenTables.add(tableNode)

    const headerData =
        getHeaders(
            table,
            $,
        )

    if (!headerData) {
        return
    }

    const {
        row: headerRow,
        headers,
    } = headerData


    const itemIndex =
        findColumn(
            headers,
            [
                'Item',
                'Item Name',
                'Name',
                'Relic',
                'Glyph',
                'Charm',
                'Potion',
            ],
        )

    if (itemIndex === -1) {
        return
    }


    const tierIndex =
        findColumn(
            headers,
            [
                'Tier',
            ],
        )


    const levelIndex =
        findColumn(
            headers,
            [
                'Level',
                'Lvl',
                'Required Level',
                'Level Requirement',
            ],
        )


    const rarityIndex =
        findColumn(
            headers,
            [
                'Rarity',
                'Quality',
            ],
        )


    const statsIndex =
        findColumn(
            headers,
            [
                'Stats',
                'Stat',
                'Effects',
                'Effect',
                'Bonuses',
                'Bonus',
            ],
        )


    $(table)
        .find('tr')
        .each((_, row) => {
            if (row === headerRow) {
                return
            }

            const cells =
                $(row)
                    .children('td')
                    .toArray()

            if (
                cells.length === 0
            ) {
                return
            }

            const itemCell =
                cells[itemIndex]

            if (!itemCell) {
                return
            }

            const name =
                extractItemName(
                    itemCell,
                    $,
                )

            if (!name) {
                return
            }

            const navigationItemTypes = [
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
                'Throwing Weapon',
                'Helmets',
                'Body Armors',
                'Gloves',
                'Boots',
                'Shields',
                'Amulets',
                'Rings',
                'Belts',
                'Charms',
                'Relics',
                'Glyphs',
                'Potions',
            ]

            const looksLikeNavigation =
                navigationItemTypes.filter(itemType =>
                    name.includes(itemType),
                ).length >= 2

            if (looksLikeNavigation) {
                return
            }


            const tier =
                tierIndex !== -1
                    ? cleanCell(
                        cells[tierIndex],
                        $,
                    )
                    : ''


            const level =
                levelIndex !== -1
                    ? parseLevel(
                        cleanCell(
                            cells[levelIndex],
                            $,
                        ),
                    )
                    : null


            /*
             * Priorité à une vraie colonne Rarity.
             *
             * Sinon on utilise la rareté héritée
             * du heading.
             */
            const rowRarity =
                rarityIndex !== -1
                    ? normalizeRarity(
                        cleanCell(
                            cells[rarityIndex],
                            $,
                        ),
                    )
                    : ''

            const rarity =
                rowRarity ||
                inheritedRarity


            const image =
                extractImage(
                    row,
                    itemCell,
                    $,
                )


            const stats =
                statsIndex !== -1
                    ? extractStats(
                        cells[statsIndex],
                        $,
                    )
                    : []


            const ignoredIndexes =
                new Set([
                    itemIndex,
                    tierIndex,
                    levelIndex,
                    rarityIndex,
                    statsIndex,
                ])


            const properties = {}

            headers.forEach(
                (
                    header,
                    index,
                ) => {
                    if (
                        ignoredIndexes.has(index)
                    ) {
                        return
                    }

                    if (!header) {
                        return
                    }

                    const cell =
                        cells[index]

                    if (!cell) {
                        return
                    }

                    const value =
                        cleanCell(
                            cell,
                            $,
                        )

                    if (!value) {
                        return
                    }

                    properties[header] =
                        value
                },
            )


            items.push({
                name,
                category,
                type,
                rarity,
                tier,
                level,
                image,
                properties,
                stats,
            })
        })
}


/* =========================================
   HEADINGS
   ========================================= */

/*
 * On conserve la rareté des headings parents.
 *
 * Exemple :
 *
 * H2 Satanic
 *   H3 Chance after each kills
 *     table
 *
 * Le H3 n'est PAS une rareté,
 * mais la table peut quand même hériter
 * de "Satanic" depuis le H2.
 */
const rarityByLevel =
    new Map()


$('h2, h3, h4')
    .each(
        (
            _,
            heading,
        ) => {
            const tagName =
                heading.tagName
                    ?.toLowerCase()

            const level =
                Number(
                    tagName
                        ?.replace('h', ''),
                )

            if (
                !Number.isFinite(level)
            ) {
                return
            }


            /*
             * Lorsqu'on arrive à un nouveau heading,
             * on supprime les niveaux identiques
             * ou inférieurs précédents.
             */
            for (
                const existingLevel
                of [
                ...rarityByLevel.keys(),
            ]
                ) {
                if (
                    existingLevel >= level
                ) {
                    rarityByLevel.delete(
                        existingLevel,
                    )
                }
            }


            const headingText =
                cleanHeading(
                    heading,
                    $,
                )

            const directRarity =
                normalizeRarity(
                    headingText,
                )


            let inheritedRarity = ''

            const parentLevels =
                [
                    ...rarityByLevel.keys(),
                ]
                    .filter(
                        parentLevel =>
                            parentLevel < level,
                    )
                    .sort(
                        (a, b) =>
                            b - a,
                    )

            for (
                const parentLevel
                of parentLevels
                ) {
                const parentRarity =
                    rarityByLevel.get(
                        parentLevel,
                    )

                if (parentRarity) {
                    inheritedRarity =
                        parentRarity

                    break
                }
            }


            const rarity =
                directRarity ||
                inheritedRarity


            rarityByLevel.set(
                level,
                rarity,
            )


            const table =
                findTableAfterHeading(
                    heading,
                    $,
                )

            if (!table) {
                return
            }


            /*
             * IMPORTANT :
             *
             * On importe le tableau même si rarity === ''.
             *
             * C'est ce qui corrige les Relics.
             */
            importTable(
                table,
                rarity,
            )
        },
    )


/* =========================================
   FALLBACK TABLES
   ========================================= */

/*
 * Certaines pages pourraient avoir des tableaux
 * qui ne sont pas directement précédés d'un
 * h2/h3/h4.
 *
 * On tente donc tous les tableaux restants.
 */
$('table.wikitable')
    .each((_, table) => {
        const wrapped = $(table)

        importTable(
            wrapped,
            '',
        )
    })


/* =========================================
   REMOVE EXACT DUPLICATES
   ========================================= */

const uniqueItems = []

const uniqueKeys =
    new Set()

for (const item of items) {
    const key =
        JSON.stringify({
            name: item.name,
            category: item.category,
            type: item.type,
            rarity: item.rarity,
            tier: item.tier,
            level: item.level,
            image: item.image,
            properties: item.properties,
            stats: item.stats,
        })

    if (
        uniqueKeys.has(key)
    ) {
        continue
    }

    uniqueKeys.add(key)

    uniqueItems.push(item)
}


/* =========================================
   VALIDATION
   ========================================= */

if (
    uniqueItems.length === 0
) {
    throw new Error(
        `No ${type} were imported. The wiki table structure may have changed.`,
    )
}


/* =========================================
   SORT
   ========================================= */

uniqueItems.sort(
    (
        a,
        b,
    ) =>
        a.name.localeCompare(
            b.name,
        ),
)


/* =========================================
   WRITE JSON
   ========================================= */

await mkdir(
    GENERATED_DIR,
    {
        recursive: true,
    },
)

const outputPath =
    `${GENERATED_DIR}/${fileName}.json`

await writeFile(
    outputPath,
    `${JSON.stringify(
        uniqueItems,
        null,
        2,
    )}\n`,
    'utf8',
)


/* =========================================
   REPORT
   ========================================= */

const imagesCount =
    uniqueItems.filter(
        item => item.image,
    ).length

const rarityCounts = {}

for (
    const item
    of uniqueItems
    ) {
    const rarity =
        item.rarity ||
        'No rarity'

    rarityCounts[rarity] =
        (
            rarityCounts[rarity] ??
            0
        ) + 1
}


console.log(
    `Imported: ${uniqueItems.length}`,
)

console.log(
    `Images:   ${imagesCount}/${uniqueItems.length}`,
)

console.log('')

console.log('Rarities:')

for (
    const [rarity, count]
    of Object.entries(rarityCounts)
    ) {
    console.log(
        `  ${rarity}: ${count}`,
    )
}

console.log('')

console.log(
    `Output: ${outputPath}`,
)

console.log('')
console.log('Done.')