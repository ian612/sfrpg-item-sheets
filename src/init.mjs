import { preloadHandlebarsTemplates } from './module/templates.js';

const MODULE_ID = 'sfrpg-item-sheets';
const itemSizeArmorClassModifier = {
    "fine": 8,
    "diminutive": 4,
    "tiny": 2,
    "small": 1,
    "medium": 0,
    "large": 1,
    "huge": 2,
    "gargantuan": 4,
    "colossal": 8
};

function EnhancedItemSheetMixin(SheetClass) {
    const RollContext = game.sfrpg.rolls.RollContext;
    return class EnhancedItemSheetSFRPG extends SheetClass {
        constructor(...args) {
            super(...args);

            /**
             * The tab being browsed
             * @type {string}
             */
            this._sheetTab = null;

            /**
             * The scroll position on the active tab
             * @type {number}
             */
            this._scrollTab = 100;

            this._tooltips = null;
        }

        /* -------------------------------------------- */

        static get defaultOptions() {
            return mergeObject(super.defaultOptions, {
                width: 770,
                height: 600,
                classes: ["sfrpg", "sheet", "item"],
                resizable: true,
                scrollY: [".tab.details"],
                tabs: [
                    {navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"},
                    {navSelector: ".subtabs", contentSelector: ".sheet-details", initial: "properties"},
                    {navSelector: ".descTabs", contentSelector: ".desc-body", initial: "description"}
                ]
            });
        }

        /* -------------------------------------------- */

        /**
         * Return a dynamic reference to the HTML template path used to render this Item Sheet
         * @return {string}
         */
        get template() {
            const path = "systems/sfrpg/templates/items";
            return `${path}/${this.item.type}.hbs`;
        }

        /**
         * Return a dynamic reference to the HTML template path used to render this Item Sheet
         * @return {string}
         */
        get template() {
            const path = "modules/sfrpg-item-sheets/dist/templates/items";
            return `${path}/${this.item.type}.hbs`;
        }

        /**
         * Prepare item sheet data
         * Start with the base item data and extending with additional properties for rendering.
         */
        async getData() {
            const data = await super.getData();
            // Ensure derived data is included
            await this.item.processData();

            data.itemData = this.document.system;
            data.actor = this.document.parent;
            data.labels = this.item.labels;

            // Include CONFIG values
            data.config = CONFIG.SFRPG;

            // Item Type, Status, and Details
            data.itemType = game.i18n.format(`TYPES.Item.${data.item.type}`);
            data.itemStatus = this._getItemStatus();
            data.itemProperties = this._getItemProperties();
            data.isPhysical = data.itemData.hasOwnProperty("quantity");
            data.hasLevel = data.itemData.hasOwnProperty("level") && data.item.type !== "spell";
            data.hasHands = data.itemData.hasOwnProperty("hands");
            data.hasProficiency = data.itemData.proficient === true || data.itemData.proficient === false;
            data.isFeat = data.item.type === "feat";
            data.isActorResource = data.item.type === "actorResource";
            data.isVehicleAttack = data.item.type === "vehicleAttack";
            data.isVehicleSystem = data.item.type === "vehicleSystem";
            data.isGM = game.user.isGM;
            data.isOwner = data.owner;

            // Physical items
            const physicalItems = ["weapon", "equipment", "consumable", "goods", "container", "technological", "magic", "hybrid", "upgrade", "augmentation", "shield", "weaponAccessory"];
            data.isPhysicalItem = physicalItems.includes(data.item.type);

            // Item attributes
            const itemData = this.item.system;
            data.placeholders = this.item.flags.placeholders || {};

            // Only physical items have hardness, hp, and their own saving throw when attacked.
            if (data.isPhysicalItem) {
                if (itemData.attributes) {
                    const itemLevel = this.parseNumber(itemData.level, 1) + (itemData.attributes.customBuilt ? 2 : 0);
                    const sizeModifier = itemSizeArmorClassModifier[itemData.attributes.size];
                    const dexterityModifier = this.parseNumber(itemData.attributes.dex?.mod, -5);

                    data.placeholders.hardness = this.parseNumber(itemData.attributes.hardness, itemData.attributes.sturdy ? 5 + (2 * itemLevel) : 5 + itemLevel);
                    data.placeholders.maxHitpoints = this.parseNumber(itemData.attributes.hp?.max, (itemData.attributes.sturdy ? 15 + 3 * itemLevel : 5 + itemLevel) + (itemLevel >= 15 ? 30 : 0));
                    data.placeholders.armorClass = this.parseNumber(itemData.attributes.ac, 10 + sizeModifier + dexterityModifier);
                    data.placeholders.dexterityModifier = dexterityModifier;
                    data.placeholders.sizeModifier = sizeModifier;

                    data.placeholders.savingThrow = data.placeholders.savingThrow || {};
                    data.placeholders.savingThrow.formula = `@itemLevel + @owner.abilities.dex.mod`;
                    data.placeholders.savingThrow.value = data.placeholders.savingThrow.value ?? 10;

                    this.item.flags.placeholders = data.placeholders;
                    this._computeSavingThrowValue(itemLevel, data.placeholders.savingThrow.formula)
                        .then((total) => this.onPlaceholderUpdated(this.item, total))
                        .catch((reason) => console.log(reason));
                } else {
                    const itemLevel = this.parseNumber(itemData.level, 1);
                    const sizeModifier = 0;
                    const dexterityModifier = -5;

                    data.placeholders.hardness = 5 + itemLevel;
                    data.placeholders.maxHitpoints = (5 + itemLevel) + (itemLevel >= 15 ? 30 : 0);
                    data.placeholders.armorClass = 10 + sizeModifier + dexterityModifier;
                    data.placeholders.dexterityModifier = dexterityModifier;
                    data.placeholders.sizeModifier = sizeModifier;

                    data.placeholders.savingThrow = data.placeholders.savingThrow || {};
                    data.placeholders.savingThrow.formula = `@itemLevel + @owner.abilities.dex.mod`;
                    data.placeholders.savingThrow.value = data.placeholders.savingThrow.value ?? 10;

                    this.item.flags.placeholders = data.placeholders;
                    this._computeSavingThrowValue(itemLevel, data.placeholders.savingThrow.formula)
                        .then((total) => this.onPlaceholderUpdated(this.item, total))
                        .catch((reason) => console.log(reason));
                }
            }

            data.selectedSize = (itemData.attributes && itemData.attributes.size) ? itemData.attributes.size : "medium";

            // Category
            data.category = this._getItemCategory();

            // Armor specific details
            data.isPowerArmor = data.item.system.hasOwnProperty("armor") && data.item.system.armor.type === 'power';

            // Action Details
            data.hasAttackRoll = this.item.hasAttack;
            data.isHealing = data.item.actionType === "heal";

            // Determine whether to show calculated totals for fields with formulas
            if (itemData?.activation?.type || data.item.type === "weapon") {
                data.range = {};

                data.range.hasInput = (() => {
                    // C/M/L on spells requires no input
                    if (this.item.type === "spell") return !(["close", "medium", "long", "none", "personal", "touch", "planetary", "system", "plane", "unlimited"].includes(itemData.range.units));
                    // These ranges require no input
                    else return !(["none", "personal", "touch", "planetary", "system", "plane", "unlimited"].includes(itemData.range.units));
                })();
                data.range.showTotal = !!itemData.range?.total && (String(itemData.range?.total) !== String(itemData.range?.value));

                data.area = {};
                data.area.showTotal = !!itemData.area?.total && (String(itemData.area?.total) !== String(itemData.area?.value));

                data.duration = {};
                data.duration.showTotal = !!itemData.duration?.total && (String(itemData.duration?.total) !== String(itemData.duration?.value));
                data.duration.hasInput = itemData.duration.units !== "instantaneous";

                data.uses = {};
                data.uses.showTotal = !!itemData.uses?.total && (String(itemData.uses?.total) !== String(itemData.uses?.max));

            }

            if (data.isActorResource && itemData.stage === "late") {
                data.range = {};

                data.range.showMinTotal = !!itemData.range.totalMin && (String(itemData.range.totalMin) !== String(itemData.range.min));
                data.range.showMaxTotal = !!itemData.range.totalMax && (String(itemData.range.totalMax) !== String(itemData.range.max));
            }

            // Vehicle Attacks
            if (data.isVehicleAttack) {
                data.placeholders.savingThrow = {};
                data.placeholders.savingThrow.value = data.item.system.save.dc;
            }

            if (data.item.type === "effect") {
                const duration = itemData.activeDuration;

                data.duration = {};
                data.duration.remaining = duration?.remaining?.string || (() => {
                    if (duration.unit === "permanent") return CONFIG.SFRPG.effectDurationTypes[duration.unit];
                    else return `${parseInt(duration.total || duration.value) || duration.value} ${CONFIG.SFRPG.effectDurationTypes[duration.unit]}`;
                })();
                data.duration.showTotal = !!duration.total && (String(duration.value) !== String(duration.total));

                data.expired = duration.remaining?.value <= 0 && !itemData.enabled;

                data.sourceActorChoices = {};
                if (game.combat?.started) {
                    for (const combatant of game.combat.combatants) {
                        if (combatant.actorId === data.item?.actor?.id) continue;
                        data.sourceActorChoices[combatant.actorId] = combatant.name;
                    }
                } else {
                    const PCs = game.actors.filter(i => i.type === "character");
                    for (const PC of PCs) {
                        data.sourceActorChoices[PC.id] = PC.name;
                    }
                }
            }

            data.modifiers = this.item.system.modifiers;

            data.hasSpeed = this.item.system.weaponType === "tracking" || (this.item.system.special && this.item.system.special["limited"]);
            data.hasCapacity = this.item.hasCapacity();

            // Enrich text editors
            const async = true;
            const rollData = RollContext.createItemRollContext(this.item, this.actor).getRollData() ?? {};
            const secrets = this.item.isOwner;

            data.enrichedDescription = await TextEditor.enrichHTML(this.item.system?.description?.value, {
                async,
                rollData,
                secrets
            });
            data.enrichedShortDescription = await TextEditor.enrichHTML(this.item.system?.description?.short, {
                async,
                rollData,
                secrets
            });
            data.enrichedGMNotes = await TextEditor.enrichHTML(this.item.system?.description?.gmNotes, {
                async,
                rollData,
                secrets
            });

            if (data?.item?.type === "starshipAction") {
                data.enrichedEffectNormal = await TextEditor.enrichHTML(this.item.system?.effectNormal, {
                    async,
                    rollData,
                    secrets
                });
                data.enrichedEffectCritical = await TextEditor.enrichHTML(this.item.system?.effectCritical, {
                    async,
                    rollData,
                    secrets
                });

                // Manage Subactions
                if (data?.itemData?.formula?.length > 1) {
                    data.editorInfo = [];
                    let ct = 0;
                    for (const value of data.itemData.formula) {
                        const effect = {};

                        effect.enrichedEffectNormal = await TextEditor.enrichHTML(value.effectNormal, {
                            async,
                            rollData,
                            secrets
                        });
                        effect.targetNormal = `system.formula.${ct}.effectNormal`;

                        effect.enrichedEffectCritical = await TextEditor.enrichHTML(value.effectCritical, {
                            async,
                            rollData,
                            secrets
                        });
                        effect.targetCritical = `system.formula.${ct}.effectCritical`;
                        ct += 1;
                        data.editorInfo.push(effect);
                    }
                }
            }

            return data;
        }

        /**
         * Extend the parent class _updateObject method to ensure that damage ends up in an Array
         * @private
         */
        _updateObject(event, formData) {
            // Handle Damage Array
            const damage = Object.entries(formData).filter(e => e[0].startsWith("system.damage.parts"));
            formData["system.damage.parts"] = damage.reduce((arr, entry) => {
                const [i, key, type] = entry[0].split(".").slice(3);
                if (!arr[i]) arr[i] = { name: "", formula: "", types: {}, group: null, isPrimarySection: false };

                switch (key) {
                    case 'name':
                        arr[i].name = entry[1];
                        break;
                    case 'formula':
                        arr[i].formula = entry[1];
                        break;
                    case 'types':
                        if (type) arr[i].types[type] = entry[1];
                        break;
                    case 'group':
                        arr[i].group = entry[1];
                        break;
                    case 'isPrimarySection':
                        arr[i].isPrimarySection = entry[1];
                        break;
                }

                return arr;
            }, []);

            // Handle Critical Damage Array
            const criticalDamage = Object.entries(formData).filter(e => e[0].startsWith("system.critical.parts"));
            formData["system.critical.parts"] = criticalDamage.reduce((arr, entry) => {
                const [i, key, type] = entry[0].split(".").slice(3);
                if (!arr[i]) arr[i] = { formula: "", types: {}, operator: "" };

                switch (key) {
                    case 'formula':
                        arr[i].formula = entry[1];
                        break;
                    case 'types':
                        if (type) arr[i].types[type] = entry[1];
                        break;
                }

                return arr;
            }, []);

            // Handle Ability Adjustments array
            const abilityMods = Object.entries(formData).filter(e => e[0].startsWith("system.abilityMods.parts"));
            formData["system.abilityMods.parts"] = abilityMods.reduce((arr, entry) => {
                const [i, j] = entry[0].split(".").slice(3);
                if (!arr[i]) arr[i] = [];
                arr[i][j] = entry[1];
                return arr;
            }, []);

            // Handle Starship Action/Subaction Formulas
            if (this.object.type === "starshipAction") {
                const currentFormula = {system: {formula: Object.assign({}, this.item.system.formula)}};
                const formula = Object.entries(formData).filter(e => e[0].startsWith("system.formula"));
                const newFormula = {};

                for (const item of formula) {
                    newFormula[item[0]] = item[1];
                    delete formData[item[0]];
                }

                const expanded = foundry.utils.expandObject(newFormula);
                const final = Object.values(foundry.utils.mergeObject(currentFormula, expanded, {overwrite:true}).system.formula);
                formData["system.formula"] = final;
            }

            // Update the Item
            return super._updateObject(event, formData);
        }

        /**
         * Activate listeners for interactive item sheet events
         */
        activateListeners(html) {
            super.activateListeners(html);

            html.find(".subaction-control").click(this._onSubactionControl.bind(this));
        }

        /* -------------------------------------------- */

        /**
         * Add or remove a subaction from a starship action
         * @param {Event} event     The original click event
         * @return {Promise}
         * @private
         */
        async _onSubactionControl(event) {
            event.preventDefault();
            const a = event.currentTarget;

            // Add a new subaction
            if (a.classList.contains("add-subaction")) {
                await this._onSubmit(event);
                const formula = this.item.system.formula;
                return await this.item.update({
                    "system.formula": formula.concat([
                        { dc: {resolve:false, value:""}, formula: "", name:"", effectNormal:"", effectCritical:"" }
                    ])
                });
            }

            // Remove a subaction
            if (a.classList.contains("delete-subaction")) {
                await this._onSubmit(event); // Submit any unsaved changes
                const li = a.closest(".subaction-part");
                const formula = duplicate(this.item.system.formula);
                console.log(li, formula);
                formula.splice(Number(li.dataset.subactionPart), 1);
                return await this.item.update({
                    "system.formula": formula
                });
            }
        }
    }
}

Hooks.once("init", () => {
    preloadHandlebarsTemplates()
    Items.registerSheet(MODULE_ID, EnhancedItemSheetMixin(game.sfrpg.applications.ItemSheetSFRPG), {makeDefault: true})
})