import type { Rune, RuneTier } from "../types.ts";

export const runes: Record<string, Rune> = {
    Del: {
        name: 'Del',
        tier: 'C',
        level: 31,
        effect: 'Arcane Skill Damage increased by 5%',
    },

    Io: {
        name: 'Io',
        tier: 'C',
        level: 35,
        effect: '+10 to Vitality'
    },

    Lum: {
        name: 'Lum',
        tier: 'C',
        level: 37,
        effect: '+10 to Energy',
    },

    Hel: {
        name: 'Hel',
        tier: 'C',
        level: 33,
        effect: 'Cooldown Recovery Increased by 4%',
    },

    Gul: {
        name: 'Gul',
        tier: 'A',
        level: 53,
        effect: '+15% Increased Attack Rating',
    },

    Ert: {
        name: 'Ert',
        tier: 'C',
        level: 21,
        effect: 'Lightning Skill Damage increased by 5%',
        leveling: true,
    },

    Sal: {
        name: 'Sal',
        tier: '?',
        level: null,
        effect: 'Effect not confirmed in current data',
    },

    Ist: {
        name: 'Ist',
        tier: 'A',
        level: 51,
        effect: '+15% Increased Magic Find',
    },

    Vex: {
        name: 'Vex',
        tier: 'A',
        level: 55,
        effect: '+7% Mana stolen per Hit',
    },

    Xo: {
        name: 'Xo',
        tier: 'S',
        level: 59,
        effect: '+25% Chance for a Deadly Blow',
    },

    Ber: {
        name: 'Ber',
        tier: 'S',
        level: 63,
        effect: '+8% Chance for a Crushing Blow',
    },

    Jah: {
        name: 'Jah',
        tier: 'S',
        level: 65,
        effect: 'Life Increased by 10%',
    },

    Co: {
        name: 'Co',
        tier: 'C',
        level: 39,
        effect: '+10 to Dexterity',
    },

    Ymn: {
        name: 'Ymn',
        tier: 'C',
        level: 25,
        effect: '+7% Life stolen per Hit',
        leveling: true,
    },

    Qi: {
        name: 'Qi',
        tier: 'S',
        level: 57,
        effect: 'Attack Damage increased by 20%',
    },

    Drax: {
        name: 'Drax',
        tier: 'S',
        level: 67,
        effect: 'Cannot be Frozen',
    },

    Jol: {
        name: 'Jol',
        tier: '?',
        level: null,
        effect: 'Effect not confirmed in current data',
    },

    Flo: {
        name: 'Flo',
        tier: '?',
        level: null,
        effect: 'Effect not confirmed in current data',
    },

    Fel: {
        name: 'Fel',
        tier: 'C',
        level: 41,
        effect: '+10 to Strength',
    },

    Tul: {
        name: 'Tul',
        tier: 'D',
        level: 17,
        effect: 'Poison Skill Damage increased by 5%',
        leveling: true,
    },

    Naf: {
        name: 'Naf',
        tier: 'D',
        level: 13,
        effect: '+15% Defense vs Missiles',
        leveling: true,
    },

    Nut: {
        name: 'Nut',
        tier: 'C',
        level: 29,
        effect: '+4% Increased Attack Speed',
    },

    Old: {
        name: 'Old',
        tier: 'D',
        level: 11,
        effect: '+25% Enhanced Damage',
        leveling: true,
    },

    Zed: {
        name: 'Zed',
        tier: 'S',
        level: 69,
        effect: 'Magic Skill Damage increased by 13%',
    },

    Tor: {
        name: 'Tor',
        tier: 'D',
        level: 13,
        effect: '+2 Mana After each Kill',
        leveling: true,
    },

    Rex: {
        name: 'Rex',
        tier: 'C',
        level: 19,
        effect: 'Fire Skill Damage increased by 5%',
        leveling: true,
    },

    Sur: {
        name: 'Sur',
        tier: 'S',
        level: 61,
        effect: 'Mana Increased by 10%',
    },

    Eth: {
        name: 'Eth',
        tier: 'D',
        level: 15,
        effect: '+5% of target Defense ignored',
        leveling: true,
    },

    Lem: {
        name: 'Lem',
        tier: 'A',
        level: 43,
        effect: '+5% Extra Gold Dropped From Kills',
    },

    Pul: {
        name: 'Pul',
        tier: 'A',
        level: 45,
        effect: 'Mana Costs decreased by 3%',
    },

    Um: {
        name: 'Um',
        tier: 'A',
        level: 47,
        effect: '+8% to All Resistances',
    },

    Mal: {
        name: 'Mal',
        tier: 'A',
        level: 49,
        effect: 'Magic Damage Taken Reduced by 4%',
    },

    Uth: {
        name: 'Uth',
        tier: 'D',
        level: 15,
        effect: '+15% of Damage Taken goes to Mana',
        leveling: true,
    },

    Ol: {
        name: 'Ol',
        tier: 'D',
        level: 11,
        effect: '+50 to Attack Rating',
        leveling: true,
    },

    Thal: {
        name: 'Thal',
        tier: 'C',
        level: 23,
        effect: 'Cold Skill Damage increased by 5%',
        leveling: true,
    },
}

export const runeTierColors: Record<RuneTier, string> = {
    S: '#e2792a',
    A: '#e8c547',
    C: '#4a90e2',
    D: '#e6e6e6',
    '?': '#b26fe8',
}