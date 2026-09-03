import { execFileSync } from 'node:child_process'

const jewelleryTypes = [
    'Amulets',
    'Rings',
    'Belts',
]

console.log('')
console.log('Hero Craft — Jewellery Import')
console.log('==============================')
console.log('')

for (const type of jewelleryTypes) {
    console.log('')
    console.log(`Importing ${type}...`)
    console.log('------------------------------')

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
console.log('==============================')
console.log('All jewellery imported.')