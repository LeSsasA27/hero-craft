import { execFileSync } from 'node:child_process'

const specialItemTypes = [
    'Charms',
    'Relics',
    'Glyphs',
    'Potions',
]

console.log('')
console.log('Hero Craft — Special Items Import')
console.log('=================================')
console.log('')

for (const type of specialItemTypes) {
    console.log('')
    console.log(`Importing ${type}...`)
    console.log('---------------------------------')

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
console.log('=================================')
console.log('All special items imported.')