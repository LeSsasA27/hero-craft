import { execFileSync } from 'node:child_process'

const armorTypes = [
    'Helmets',
    'Body Armors',
    'Gloves',
    'Boots',
    'Shield',
]

console.log('')
console.log('Hero Craft — Armor Import')
console.log('==========================')
console.log('')

for (const type of armorTypes) {
    console.log('')
    console.log(`Importing ${type}...`)
    console.log('--------------------------')

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
console.log('==========================')
console.log('All armor imported.')