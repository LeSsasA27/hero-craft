import type { RuneInventory } from "../types.ts";

export function readRuneInventory(
    container: HTMLElement,
): RuneInventory {
    const inventory: RuneInventory = {}

    const inputs =
        container.querySelectorAll<HTMLInputElement>(
            '[data-inventory-rune]'
        )

    inputs.forEach(input => {
        const runeName = input.dataset.inventoryRune

        if (!runeName) {
            return
        }

        inventory[runeName] = Number(input.value)
    })

    return inventory
}

const INVENTORY_STORAGE_KEY = 'heroCraftInventory'

export function saveRuneInventory(
    inventory: RuneInventory,
) : void {
    localStorage.setItem(
        INVENTORY_STORAGE_KEY,
        JSON.stringify(inventory),
    )
}

export function loadRuneInventory(): RuneInventory {
    const saved = localStorage.getItem(
        INVENTORY_STORAGE_KEY,
    )

    if (!saved) {
        return {}
    }

    try {
        return JSON.parse(saved) as RuneInventory
    } catch {
        return {}
    }
}