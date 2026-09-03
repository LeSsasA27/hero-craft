import * as cheerio from 'cheerio'
import { mkdir, writeFile } from 'node:fs/promises'

const URL = 'https://herosiege.wiki.gg/wiki/Swords'
const OUTPUT_FILE = 'src/data/generated/swords.json'
const WIKI_BASE_URL = 'https://herosiege.wiki.gg'

function cleanCell(cell, $) {
    if (!cell) {
        return ''
    }

    const clone = $(cell).clone()

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
        .text()
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function extractStats(cell, $) {
    if (!cell) {
        return []
    }

    const clone = $(cell).clone()

    clone
        .find(`
      .sortkey,
      .mw-sortkey,
      .sorttext,
      script,
      style,
      [aria-hidden="true"],
      [style*="display:none"],
      [style*="display: none"]
    `)
        .remove()

    clone.find('br').replaceWith('\n')

    clone.find('li').each((_, element) => {
        $(element).append('\n')
    })

    clone.find('p').each((_, element) => {
        $(element).append('\n')
    })

    const text = clone
        .text()
        .replace(/\u00a0/g, ' ')

    return text
        .split('\n')
        .map(stat =>
            stat
                .replace(/\s+/g, ' ')
                .trim()
        )
        .filter(Boolean)
}

function cleanRarity(value) {
    return value
        .replace(/\[edit\]/gi, '')
        .trim()
}

function parseLevel(value) {
    const match = value.match(/\d+/)

    if (!match) {
        return null
    }

    return Number(match[0])
}

function normalizeImageUrl(url) {
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

function extractImage(cell, $) {
    if (!cell) {
        return undefined
    }

    const image = $(cell)
        .find('img')
        .first()

    if (!image.length) {
        return undefined
    }

    const url =
        image.attr('src') ||
        image.attr('data-src') ||
        image.attr('data-original')

    return normalizeImageUrl(url)
}

console.log(`Fetching ${URL}...`)

const response = await fetch(URL, {
    headers: {
        'User-Agent': 'HeroCraft Item Importer',
        'Accept': 'text/html',
    },
})

if (!response.ok) {
    throw new Error(
        `Failed to fetch Swords page: ${response.status} ${response.statusText}`
    )
}

const html = await response.text()
const $ = cheerio.load(html)

const items = []
const seenItems = new Set()

$('h2, h3').each((_, heading) => {
    const rarityElement =
        $(heading).find('.mw-headline')

    const rarity = cleanRarity(
        rarityElement.length
            ? rarityElement.text()
            : $(heading).text()
    )

    if (!rarity) {
        return
    }

    let current = $(heading).next()
    let table = null

    while (current.length) {
        if (current.is('h2, h3')) {
            break
        }

        if (current.is('table')) {
            table = current
            break
        }

        const nestedTable =
            current.find('table').first()

        if (nestedTable.length) {
            table = nestedTable
            break
        }

        current = current.next()
    }

    if (!table || !table.length) {
        return
    }

    table.find('tr').each((_, row) => {
        const cells = $(row).find('td')

        if (cells.length < 7) {
            return
        }

        const name =
            cleanCell(cells[0], $)

        if (!name) {
            return
        }

        const image =
            extractImage(cells[0], $)

        const tier =
            cleanCell(cells[1], $)

        const levelText =
            cleanCell(cells[2], $)

        const damage =
            cleanCell(cells[3], $)

        const aps =
            cleanCell(cells[4], $)

        const dps =
            cleanCell(cells[5], $)

        const stats =
            extractStats(cells[6], $)

        const uniqueKey =
            `${rarity}:${name}`

        if (seenItems.has(uniqueKey)) {
            return
        }

        seenItems.add(uniqueKey)

        items.push({
            name,

            category: 'Weapons',
            type: 'Swords',

            rarity,
            tier,

            level: parseLevel(levelText),

            image,

            properties: {
                Damage: damage,
                APS: aps,
                DPS: dps,
            },

            stats,
        })
    })
})

if (items.length === 0) {
    throw new Error(
        'No swords were imported. The wiki HTML structure may have changed.'
    )
}

await mkdir(
    'src/data/generated',
    {
        recursive: true,
    }
)

await writeFile(
    OUTPUT_FILE,
    `${JSON.stringify(items, null, 2)}\n`,
    'utf8',
)

const itemsWithImages =
    items.filter(item => item.image).length

console.log('')
console.log(`Imported ${items.length} swords`)
console.log(
    `Images found: ${itemsWithImages}/${items.length}`
)
console.log(`Output: ${OUTPUT_FILE}`)