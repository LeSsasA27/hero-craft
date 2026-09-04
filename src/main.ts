import './style.css'
import { runewords } from './data/runewords'
import { runewordCard } from './ui/runewordCard'
import { filterRunewords } from './logic/filterRunewords'
import { runes } from './data/runes'
import { runeDetail } from './ui/runeDetail'
import { runeCard } from './ui/runeCard'
import { filterRunes } from './logic/filterRunes'
import { getCraftGroups } from './logic/crafting'
import { craftResultsView } from './ui/craftResults'
import { loadRuneInventory, readRuneInventory, saveRuneInventory } from './logic/inventory'
import { runewordDetail } from './ui/runewordDetail'
import { craftInventoryView } from './ui/craftInventory'
import { getVersion } from '@tauri-apps/api/app'
import { isTauri } from '@tauri-apps/api/core'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { items } from './data/items'
import { itemCard } from './ui/itemCard'
import { itemTypesByCategory } from './data/itemTypes'
import type { ItemCategory } from './types'
import { filterItems, type ItemStatFilter } from './logic/filterItems'
import { itemDetail } from './ui/itemDetails'

function getElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector)

    if (!element) {
        throw new Error(`Element not found: ${selector}`)
    }

    return element
}

const app = getElement<HTMLDivElement>('#app')


app.innerHTML = `
    <div class="app-shell">
        <aside class="sidebar">
          <div class="sidebar-brand">
            <div>
              <h1>Hero Craft</h1>
              <p>Hero Siege crafting tool</p>
            </div>
          </div>
        
          <nav class="nav">
            <button class="nav-button active" data-view="runewords" type="button">
              <span>Runewords</span>
            </button>
        
            <button class="nav-button" data-view="runes" type="button">
              <span>Runes</span>
            </button>
        
            <button class="nav-button" data-view="craft" type="button">
              <span>Craft Finder</span>
            </button>
            
            <button class="nav-button" data-view="items" type="button">
              <span>Items</span>
            </button>
          </nav>
          
        <div class="app-status">
          <div class="app-status-state">
            <span id="status-dot" class="status-dot"></span>
            <span id="update-status">Checking...</span>
          </div>
        
          <div class="app-version-row">
            <span id="app-version">v...</span>
        
            <button
              id="update-button"
              class="update-button hidden"
              type="button"
            >
              Update
            </button>
          </div>
          
          <div id="update-notes" class="update-notes hidden"></div>
        </div>
        </aside>
        
        <main class="content">
            <section id="view-runewords" class="view">
              <div class="view-header">
                <div>
                  <h2>Runewords</h2>
                  <p id="result-count" class="result-count"></p>
                </div>
            
                <div class="view-controls">
                  <input
                    id="search"
                    class="search"
                    type="text"
                    placeholder="Search runeword, rune, base..."
                  >
            
                  <select id="base-filter" class="base-filter">
                    <option value="">All bases</option>
                  </select>
                  
                  <select id="socket-filter" class="socket-filter">
                    <option value="">All sockets</option>
                  </select>
                  
                  <button id="reset-filters" class="reset-button" type="button">Reset</button>
                </div>
              </div>
            
              <div class="runeword-layout">
                  <div class="runeword-list" id="runeword-list"></div>
                
                  <aside class="detail-panel hidden" id="detail-panel">
                      <div class="detail-panel-header">
                        <span class="detail-panel-title">Details</span>
                    
                        <button
                          id="detail-close"
                          class="detail-close"
                          type="button"
                          aria-label="Close details"
                        >
                          ×
                        </button>
                      </div>
                    
                      <div id="detail-content" class="detail-content">
                        <p>Select a runeword or rune to see details.</p>
                      </div>
                  </aside>
              </div>
            </section>
            
            <section id="view-runes" class="view hidden">
              <div class="view-header">
                <div>
                  <h2>Runes</h2>
                  <p id="rune-count" class="result-count"></p>
                </div>
            
                <div class="view-controls">
                  <input
                    id="rune-search"
                    class="search"
                    type="text"
                    placeholder="Search rune or effect..."
                  >
            
                  <select id="tier-filter" class="tier-filter">
                    <option value="">All tiers</option>
                    <option value="S">Tier S</option>
                    <option value="A">Tier A</option>
                    <option value="C">Tier C</option>
                    <option value="D">Tier D</option>
                    <option value="?">Unconfirmed</option>
                  </select>
                </div>
              </div>
            
              <div id="rune-list" class="rune-list"></div>
            </section>
            
            <section id="view-craft" class="view hidden">
              <div class="view-header">
                <div>
                  <h2>Craft Finder</h2>
                  <p class="result-count">
                    Enter the runes you currently own
                  </p>
                </div>
            
                <div class="view-controls">
                  <button id="clear-inventory" class="reset-button" type="button">
                    Clear inventory
                  </button>
                </div>
              </div>
            
              <div id="craft-inputs"></div>
            
              <div id="craft-results"></div>
            </section>
            
            <section id="view-items" class="view hidden">
              <div class="view-header">
                <div>
                  <h2>Items</h2>
            
                  <p id="item-count" class="result-count">
                    0 items
                  </p>
                </div>
            
                <div class="view-controls">
                  <input
                    id="item-search"
                    class="search"
                    type="text"
                    placeholder="Search item or stat..."
                  >
            
                  <select
                    id="item-category-filter"
                    class="base-filter"
                  >
                    <option value="">All categories</option>
                    <option value="Weapons">Weapons</option>
                    <option value="Armor">Armor</option>
                    <option value="Jewellery">Jewellery</option>
                    <option value="Special Items">Special Items</option>
                  </select>
            
                  <select
                    id="item-type-filter"
                    class="base-filter"
                  >
                    <option value="">All types</option>
                  </select>
            
                  <select
                    id="item-rarity-filter"
                    class="tier-filter"
                  >
                    <option value="">All rarities</option>
                  </select>
                  
                  <button
                    id="reset-item-filters"
                    class="reset-button"
                    type="button"
                  >
                    Reset
                  </button>
                </div>
              </div>
            
              <div class="item-stat-filter-panel">
                <div class="item-stat-filter-header">
                  <span>Stat filters</span>
            
                  <div>
                    <button
                      id="add-stat-filter"
                      class="reset-button"
                      type="button"
                    >
                      + Add stat
                    </button>
            
                    <button
                      id="clear-stat-filters"
                      class="reset-button"
                      type="button"
                    >
                      Clear
                    </button>
                  </div>
                </div>
            
                <div id="item-stat-filters"></div>
              </div>
            
              <div class="item-layout">
                <div
                  id="item-list"
                  class="item-list"
                ></div>
            
                <aside
                  id="item-detail-panel"
                  class="detail-panel hidden"
                >
                  <div class="detail-panel-header">
                    <span class="detail-panel-title">
                      Item details
                    </span>
            
                    <button
                      id="item-detail-close"
                      class="detail-close"
                      type="button"
                      aria-label="Close item details"
                    >
                      ×
                    </button>
                  </div>
            
                  <div
                    id="item-detail-content"
                    class="detail-content"
                  ></div>
                </aside>
              </div>
            </section>
        </main>
    </div>
`
const searchInput = getElement<HTMLInputElement>('#search')
const runewordList = getElement<HTMLDivElement>('#runeword-list')
const resultCount = getElement<HTMLParagraphElement>('#result-count')
const baseFilter = getElement<HTMLSelectElement>('#base-filter')
const allBases = [...new Set(runewords.flatMap(runeword => runeword.bases))].sort()
const navButtons = document.querySelectorAll<HTMLButtonElement>('.nav-button')
const views = document.querySelectorAll<HTMLElement>('.view')
const runeList = getElement<HTMLDivElement>('#rune-list')
const tierFilter = getElement<HTMLSelectElement>('#tier-filter')
const runeSearch = getElement<HTMLInputElement>('#rune-search')
const runeCount = getElement<HTMLParagraphElement>('#rune-count')
const craftResults = getElement<HTMLDivElement>('#craft-results')
const craftInputs = getElement<HTMLDivElement>('#craft-inputs')
const socketFilter = getElement<HTMLSelectElement>('#socket-filter')
const resetFilters = getElement<HTMLButtonElement>('#reset-filters')
const detailContent = getElement<HTMLDivElement>('#detail-content')
const detailClose = getElement<HTMLButtonElement>('#detail-close')
const detailPanel = getElement<HTMLElement>('#detail-panel')
const clearInventory = getElement<HTMLButtonElement>('#clear-inventory')
const appVersion = getElement<HTMLElement>('#app-version')
const updateStatus = getElement<HTMLElement>('#update-status')
const statusDot = getElement<HTMLElement>('#status-dot')
const updateButton = getElement<HTMLButtonElement>('#update-button')
const updateNotes = getElement<HTMLElement>('#update-notes')
const itemList = getElement<HTMLElement>('#item-list')
const itemCount = getElement<HTMLElement>('#item-count')
const itemCategoryFilter = getElement<HTMLSelectElement>('#item-category-filter')
const itemTypeFilter = getElement<HTMLSelectElement>('#item-type-filter')
const itemRarityFilter = getElement<HTMLSelectElement>('#item-rarity-filter')
const itemSearch = getElement<HTMLInputElement>('#item-search')
const itemDetailPanel = getElement<HTMLElement>('#item-detail-panel')
const itemDetailContent = getElement<HTMLElement>('#item-detail-content')
const itemDetailClose = getElement<HTMLButtonElement>('#item-detail-close')
const itemStatFilters = getElement<HTMLElement>('#item-stat-filters')
const addStatFilter = getElement<HTMLButtonElement>('#add-stat-filter')
const clearStatFilters = getElement<HTMLButtonElement>('#clear-stat-filters')
const resetItemFilters = getElement<HTMLButtonElement>('#reset-item-filters')

const itemRarities = [
    ...new Set(
        items.flatMap(item => item.rarity ? [item.rarity] : []),
    ),
].sort()

itemRarityFilter.innerHTML += itemRarities
    .map(rarity => `
        <option value="${rarity}">
          ${rarity}
        </option>
    `)
    .join('')

function getStatName(stat: string) {
    return stat
        // [20-30], 20-30, +20, -10, 15.5...
        .replace(
            /^[+\-]?\s*\[?\s*\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*\]?\s*%?\s*/i,
            '',
        )
        // "+[2-4] to All Skills" -> "All Skills"
        .replace(/^to\s+/i, '')
        .trim()
}


const availableItemStats = [
    ...new Set(
        items
            .flatMap(item => item.stats)
            .map(getStatName)
            .filter(Boolean),
    ),
].sort((a, b) =>
    a.localeCompare(b),
)

const itemStatDatalist =
    document.createElement('datalist')

itemStatDatalist.id =
    'item-stat-suggestions'

itemStatDatalist.innerHTML =
    availableItemStats
        .map(stat => `
            <option value="${stat}"></option>
        `)
        .join('')

document.body.append(
    itemStatDatalist,
)

function createStatFilterRow() {
    const row = document.createElement('div')

    row.className = 'item-stat-filter-row'

    row.innerHTML = `
        <input
          class="item-stat-name"
          type="text"
          list="item-stat-suggestions"
          autocomplete="off"
          placeholder="Search a stat..."
        >

        <input
          class="item-stat-min"
          type="number"
          step="any"
          placeholder="Min"
        >

        <button
          class="item-stat-remove"
          type="button"
          aria-label="Remove stat filter"
        >
          ×
        </button>
    `

    itemStatFilters.append(row)

    row.addEventListener(
        'input',
        renderItems,
    )

    row
        .querySelector('.item-stat-remove')
        ?.addEventListener('click', () => {
            row.remove()
            renderItems()
        })
}


addStatFilter.addEventListener('click', createStatFilterRow)

clearStatFilters.addEventListener('click', () => {
    itemStatFilters.innerHTML = ''
    renderItems()
})

resetItemFilters.addEventListener(
    'click',
    () => {
        itemSearch.value = ''
        itemCategoryFilter.value = ''
        itemTypeFilter.value = ''
        itemRarityFilter.value = ''

        itemStatFilters.innerHTML = ''

        updateItemTypeOptions()
        renderItems()
    },
)


function readItemStatFilters(): ItemStatFilter[] {
    return [
        ...itemStatFilters.querySelectorAll<HTMLElement>(
            '.item-stat-filter-row',
        ),
    ]
        .map(row => {
            const query =
                row
                    .querySelector<HTMLInputElement>(
                        '.item-stat-name',
                    )
                    ?.value
                    .trim() ?? ''

            const minInput =
                row.querySelector<HTMLInputElement>(
                    '.item-stat-min',
                )

            const min =
                minInput &&
                minInput.value !== ''
                    ? Number(minInput.value)
                    : null

            return {
                query,
                min,
            }
        })
        .filter(filter => filter.query)
}

function clearItemSelection() {
    itemList
        .querySelectorAll('.item-card')
        .forEach(card => {
            card.classList.remove('selected')
        })
}

function resetItemDetailPanel() {
    clearItemSelection()

    itemDetailContent.innerHTML = ''
    itemDetailPanel.classList.add('hidden')
}

itemList.addEventListener('click', event => {
    const target = event.target as HTMLElement

    const card = target.closest<HTMLElement>('[data-item]')

    if (!card) {
        return
    }

    const itemName = card.dataset.item

    if (!itemName) {
        return
    }

    const item = items.find(
        item => item.name === itemName
    )

    if (!item) {
        return
    }

    clearItemSelection()

    card.classList.add('selected')

    itemDetailContent.innerHTML = itemDetail(item)

    itemDetailPanel.classList.remove('hidden')
})

itemDetailClose.addEventListener('click', resetItemDetailPanel)

function renderItems() {
    resetItemDetailPanel()

    const statFilters = readItemStatFilters()

    const filteredItems = filterItems(
        items,
        itemSearch.value,
        itemCategoryFilter.value,
        itemTypeFilter.value,
        itemRarityFilter.value,
        statFilters,
    )

    itemCount.textContent =
        `${filteredItems.length} item${
            filteredItems.length !== 1
                ? 's'
                : ''
        }`

    if (filteredItems.length === 0) {
        itemList.innerHTML = `
          <div class="empty-state">
            No items found.
          </div>
        `

        return
    }

    itemList.innerHTML =
        filteredItems
            .map(item =>
                itemCard(
                    item,
                    statFilters,
                ),
            )
            .join('')
}

renderItems()

itemSearch.addEventListener('input', renderItems)

itemCategoryFilter.addEventListener('change', () => {
    updateItemTypeOptions()
    renderItems()
})

itemTypeFilter.addEventListener('change', renderItems)
itemRarityFilter.addEventListener('change', renderItems)

function updateItemTypeOptions() {
    const category = itemCategoryFilter.value as ItemCategory | ''

    itemTypeFilter.innerHTML = `
        <option value="">All types</option>
    `

    if (!category) {
        return
    }

    const types = itemTypesByCategory[category] ?? []

    itemTypeFilter.innerHTML += types
        .map(type => `
            <option value="${type}">
             ${type}
            </option>
        `)
        .join('')
}

updateItemTypeOptions()

const allSocketCounts = [
    ...new Set(
        runewords.map(runeword => runeword.runes.length)
    ),
].sort((a, b) => a - b)

allSocketCounts.forEach(socketCount => {
    const option = document.createElement('option')

    option.value = String(socketCount)
    option.textContent = `${socketCount} sockets`

    socketFilter.appendChild(option)
})

let availableUpdate: Update | null = null

async function checkAppVersion() {
    if (!isTauri()) {
        appVersion.textContent = 'Web dev'
        updateStatus.textContent = 'Development'
        statusDot.className = 'status-dot development'
        return
    }

    try {
        const version = await getVersion()

        appVersion.textContent = `v${version}`
        updateStatus.textContent = 'Checking...'
        statusDot.className = 'status-dot checking'

        const update = await check()

        if (!update) {
            updateStatus.textContent = 'Up to date'
            statusDot.className = 'status-dot success'
            return
        }

        availableUpdate = update

        if (update.body) {
            updateNotes.textContent = update.body
            updateNotes.classList.remove('hidden')
        }

        updateStatus.textContent = `v${update.version} available`
        statusDot.className = 'status-dot update'

        updateButton.classList.remove('hidden')
    } catch (error) {
        console.error('Update check failed:', error)

        updateStatus.textContent = 'Update check unavailable'
        statusDot.className = 'status-dot error'
    }
}

checkAppVersion()

updateButton.addEventListener('click', async () => {
    if (!availableUpdate) {
        return
    }

    updateButton.disabled = true
    updateButton.textContent = 'Updating...'

    updateStatus.textContent = 'Downloading...'
    statusDot.className = 'status-dot checking'

    let downloaded = 0
    let contentLength = 0

    try {
        await availableUpdate.downloadAndInstall(event => {
            switch (event.event) {
                case 'Started':
                    contentLength = event.data.contentLength ?? 0
                    break

                case 'Progress':
                    downloaded += event.data.chunkLength

                    if (contentLength > 0) {
                        const progress = Math.round(
                            (downloaded / contentLength) * 100
                        )

                        updateStatus.textContent =
                            `Downloading ${progress}%`
                    }
                    break

                case 'Finished':
                    updateStatus.textContent = 'Installing...'
                    break
            }
        })

        updateStatus.textContent = 'Restarting...'

        await relaunch()
    } catch (error) {
        console.error('Update failed:', error)

        updateStatus.textContent = 'Update failed'
        statusDot.className = 'status-dot error'

        updateButton.disabled = false
        updateButton.textContent = 'Retry'
    }
})

type ViewName = 'runewords' | 'runes' | 'craft' | 'items'

function isViewName(value: string | undefined | null): value is ViewName {
    return value === 'runewords' ||
        value === 'runes' ||
        value === 'craft' ||
        value === 'items'
}

function showView(viewName: ViewName) {
    navButtons.forEach(button => {
        button.classList.toggle(
            'active',
            button.dataset.view === viewName
        )
    })

    views.forEach(view => {
        view.classList.toggle(
            'hidden',
            view.id !== `view-${viewName}`,
        )
    })

    sessionStorage.setItem('activeView', viewName)
}

const savedView = sessionStorage.getItem('activeView')

showView(isViewName(savedView) ? savedView : 'runewords')

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const viewName = button.dataset.view

        if (!isViewName(viewName)) {
            return
        }

        showView(viewName)
    })
})

allBases.forEach(base => {
    const option = document.createElement('option')

    option.value = base
    option.textContent = base

    baseFilter.appendChild(option)
})

const craftRuneNames = [
    ...new Set(
        runewords.flatMap(runeword => runeword.runes)
    ),
].sort()

craftInputs.innerHTML = craftInventoryView(craftRuneNames)

const savedInventory = loadRuneInventory()

craftInputs.querySelectorAll<HTMLInputElement>('[data-inventory-rune]').forEach(input => {
    const runeName = input.dataset.inventoryRune

    if (!runeName) {
        return
    }

    input.value = String(
        savedInventory[runeName] ?? 0
    )
})

const allRuneNames = [
    ...new Set([
        ...Object.keys(runes),
        ...runewords.flatMap(runeword => runeword.runes),
    ]),
].sort()

const runeArray = allRuneNames.map(runeName => {
    const rune = runes[runeName]

    if (rune) {
        return rune
    }

    return {
        name: runeName,
        tier: '?' as const,
        level: null,
        effect: 'No confirmed data available.',
    }
})

function renderRunes() {
    const filteredRunes = filterRunes(
        runeArray,
        runeSearch.value,
        tierFilter.value,
    )

    runeCount.textContent =
        `${filteredRunes.length} rune${filteredRunes.length !== 1 ? 's' : ''}`

    if (filteredRunes.length === 0) {
        runeList.innerHTML = `
      <div class="empty-state">
        No runes found.
      </div>
    `

        return
    }

    runeList.innerHTML = filteredRunes
        .map(runeCard)
        .join('')
}

function renderRunewords() {
    const filtered = filterRunewords(
        runewords,
        searchInput.value,
        baseFilter.value,
        socketFilter.value,
    )

    resetDetailPanel()

    resultCount.textContent =
        `${filtered.length} runeword${filtered.length === 1 ? '' : 's'}`

    if (filtered.length === 0) {
        runewordList.innerHTML = `
      <p class="empty-state">
        No runewords found.
      </p>
    `
        return
    }

    runewordList.innerHTML = filtered
        .map(runewordCard)
        .join('')
}
searchInput.addEventListener('input', renderRunewords)
baseFilter.addEventListener('change', renderRunewords)
tierFilter.addEventListener('change', renderRunes)
socketFilter.addEventListener('change', renderRunewords)
resetFilters.addEventListener('click', () => {
    searchInput.value = ''
    baseFilter.value = ''
    socketFilter.value = ''

    renderRunewords()
})
runeSearch.addEventListener('input', renderRunes)

detailClose.addEventListener('click', resetDetailPanel)

function clearSelection() {
    runewordList
        .querySelectorAll('.runeword-card')
        .forEach(card => {
            card.classList.remove('selected')
        })

    runewordList
        .querySelectorAll('.rune')
        .forEach(rune => {
            rune.classList.remove('selected')
        })
}

function resetDetailPanel() {
    detailContent.innerHTML = `
    <p>Select a runeword or rune to see details.</p>
  `

    clearSelection()

    detailPanel.classList.add('hidden')
}

function showRuneDetail(runeName: string) {
    const rune = runes[runeName]

    detailPanel.classList.remove('hidden')

    detailContent.innerHTML = runeDetail(
        runeName,
        rune,
    )
}

function showRunewordDetail(runewordName: string) {
    const runeword = runewords.find(
        item => item.name === runewordName
    )

    if (!runeword) {
        return
    }

    detailPanel.classList.remove('hidden')

    detailContent.innerHTML = runewordDetail(runeword)
}

runewordList.addEventListener('click', event => {
    const target = event.target as HTMLElement

    const runeButton =
        target.closest<HTMLButtonElement>('[data-rune]')

    if (runeButton) {
        clearSelection()

        runeButton.classList.add('selected')

        const runeName = runeButton.dataset.rune

        if (!runeName) {
            return
        }

        showRuneDetail(runeName)

        return
    }

    const runewordCardElement =
        target.closest<HTMLElement>('[data-runeword]')

    if (!runewordCardElement) {
        return
    }

    clearSelection()

    runewordCardElement.classList.add('selected')

    const runewordName =
        runewordCardElement.dataset.runeword

    if (!runewordName) {
        return
    }

    showRunewordDetail(runewordName)
})

detailContent.addEventListener('click', event => {
    const target = event.target as HTMLElement

    const runeButton = target.closest<HTMLButtonElement>('[data-rune]')

    if (!runeButton) {
        return
    }

    const runeName = runeButton.dataset.rune

    if (!runeName) {
        return
    }

    showRuneDetail(runeName)
})

clearInventory.addEventListener('click', () => {
    craftInputs.querySelectorAll<HTMLInputElement>('[data-inventory-rune]').forEach(input => {
        input.value = '0'
    })

    renderCraftResults()
})

function renderCraftResults() {
    const inventory = readRuneInventory(craftInputs)

    saveRuneInventory(inventory)

    const groups = getCraftGroups(
        runewords,
        inventory,
    )

    craftResults.innerHTML = craftResultsView(
        groups.craftable,
        groups.almost,
        groups.remaining,
        inventory,
    )
}

craftInputs.addEventListener('input', renderCraftResults)

renderRunes()
renderRunewords()
renderCraftResults()
