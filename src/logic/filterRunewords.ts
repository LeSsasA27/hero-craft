import type { Runeword } from "../types.ts";

export function filterRunewords(
    runewords: Runeword[],
    query: string,
    base: string,
    sockets: string,
): Runeword[] {
    const search = query.trim().toLowerCase()

    return runewords.filter(runeword => {
        const matchesSockets = !sockets || runeword.runes.length === Number(sockets)

        const matchesSearch =
            !search ||
            [
                runeword.name,
                ...runeword.runes,
                ...runeword.bases,
                ...runeword.effects,
            ]
                .join(' ')
                .toLowerCase()
                .includes(search)

        const matchesBase = !base || runeword.bases.includes(base)

        return matchesSearch && matchesBase && matchesSockets
    })
}