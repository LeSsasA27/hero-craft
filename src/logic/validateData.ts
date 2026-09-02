import type { Runeword } from '../types'

export type ValidationResult = {
    errors: string[]
    warnings: string[]
}

export function validateRunewords(
    runewords: Runeword[],
): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    const names = new Set<string>()

    runewords.forEach(runeword => {
        // Duplicate names
        if (names.has(runeword.name)) {
            errors.push(
                `Duplicate runeword: ${runeword.name}`
            )
        }

        names.add(runeword.name)

        // Name
        if (!runeword.name.trim()) {
            errors.push('Runeword with empty name')
        }

        // Runes
        if (runeword.runes.length === 0) {
            errors.push(
                `${runeword.name}: no runes`
            )
        }

        if (
            runeword.runes.length < 2 ||
            runeword.runes.length > 6
        ) {
            warnings.push(
                `${runeword.name}: unusual socket count (${runeword.runes.length})`
            )
        }

        // Bases
        if (runeword.bases.length === 0) {
            errors.push(
                `${runeword.name}: no base`
            )
        }

        // Level
        if (runeword.level < 1) {
            errors.push(
                `${runeword.name}: invalid level (${runeword.level})`
            )
        }

        // Effects
        if (runeword.effects.length === 0) {
            warnings.push(
                `${runeword.name}: no effects`
            )
        }
    })

    if (runewords.length !== 92) {
        warnings.push(
            `Expected 92 runewords, found ${runewords.length}`
        )
    }

    return {
        errors,
        warnings,
    }
}