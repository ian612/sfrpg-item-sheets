/**
 * Define a set of template paths to pre-load
 *
 * Pre-loaded templates are compiled and cached for fast access when rendering
 *
 * @returns {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
    const modTemplatePaths = [

        // Item Sheet Partials
        "modules/sfrpg-item-sheets/dist/templates/items/parts/item-action.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/item-activation.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/item-description.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/item-capacity.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/item-modifiers.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/item-header.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/item-special-materials.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/item-descriptors.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/item-status.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/physical-item-details.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/starship-subactions.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/starship-component.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/container-details.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/weapon-properties.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/damage-sections.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/item-duration.hbs"
    ];

    return loadTemplates(modTemplatePaths);
};
