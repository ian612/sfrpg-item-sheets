import { preloadHandlebarsTemplates } from './module/templates.js';
import { EnhancedItemSheetSFRPG } from './module/item/sheet.js'

const MODULE_ID = 'sfrpg-item-sheets';



Hooks.once('init', async () => {
    console.warn(`${MODULE_ID} | Initializing Module`)
    preloadHandlebarsTemplates()

    DocumentSheetConfig.registerSheet(ItemSheet, MODULE_ID, EnhancedItemSheetSFRPG, {
      label: 'SFRPGItemSheets.SheetLabel',
      makeDefault: true
    });
  });