import type { Item } from "../types.ts";
import swords from './generated/swords.json'

export const items: Item[] = [
    ...(swords as Item[]),
]