import type { Item } from '../types.ts'

const modules = import.meta.glob(
    './generated/*.json',
    {
        eager: true,
        import: 'default',
    },
) as Record<string, Item[]>

export const items: Item[] = Object
    .values(modules)
    .flat()
    .sort((a, b) => {
        const typeCompare =
            a.type.localeCompare(b.type)

        if (typeCompare !== 0) {
            return typeCompare
        }

        return a.name.localeCompare(b.name)
    })