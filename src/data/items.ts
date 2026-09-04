import type { Item } from '../types.ts'

const modules = import.meta.glob(
    './generated/*.json',
    {
        eager: true,
        import: 'default',
    },
) as Record<string, Item[]>

function normalizeName(
    value: string,
) {
    return value
        .trim()
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
}

function getItemKey(
    item: Item,
) {
    return normalizeName(
        item.name,
    )
}


/* =========================
   OLD WIKI DATA
   ========================= */

const wikiItems =
    Object.entries(modules)
        .filter(
            ([path]) =>
                !path.endsWith(
                    '/hsdb-items.json',
                ),
        )
        .flatMap(
            ([, fileItems]) =>
                fileItems,
        )


/* =========================
   HERO SIEGE DB DATA
   ========================= */

const hsdbItems =
    modules[
        './generated/hsdb-items.json'
        ] ?? []


/* =========================
   MERGE
   ========================= */

const itemMap =
    new Map<string, Item>()


/*
 * Wiki en premier.
 */
for (const item of wikiItems) {
    itemMap.set(
        getItemKey(item),
        item,
    )
}


/*
 * HeroSiegeDB ensuite.
 *
 * HSDB remplace les données wiki,
 * mais on conserve l'image wiki
 * lorsqu'elle existe.
 */
for (const hsdbItem of hsdbItems) {
    const key =
        getItemKey(hsdbItem)

    const existing =
        itemMap.get(key)

    if (!existing) {
        itemMap.set(
            key,
            hsdbItem,
        )

        continue
    }

    itemMap.set(
        key,
        {
            ...existing,
            ...hsdbItem,

            image:
                hsdbItem.image ??
                existing.image,

            properties: {
                ...existing.properties,
                ...hsdbItem.properties,
            },

            stats:
                hsdbItem.stats.length > 0
                    ? hsdbItem.stats
                    : existing.stats,
        },
    )
}


/* =========================
   FINAL ITEMS
   ========================= */

export const items: Item[] = [
    ...itemMap.values(),
].sort(
    (a, b) => {
        const typeCompare =
            a.type.localeCompare(
                b.type,
            )

        if (typeCompare !== 0) {
            return typeCompare
        }

        return a.name.localeCompare(
            b.name,
        )
    },
)