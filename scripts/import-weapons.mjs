import { execFileSync } from 'node:child_process'

const weaponTypes = [
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
]

console.log('')
console.log('Hero Craft — Weapons Import')
console.log('============================')
console.log('')

for (const type of weaponTypes) {
    console.log('')
    console.log(`Importing ${type}...`)
    console.log('----------------------------')

    try {
        execFileSync(
            process.execPath,
            [
                'scripts/import-items.mjs',
                type,
            ],
            {
                stdio: 'inherit',
            },
        )
    } catch {
        console.error('')
        console.error(`Failed to import ${type}`)
        console.error('Import stopped.')

        process.exit(1)
    }
}

console.log('')
console.log('============================')
console.log('All weapons imported.')