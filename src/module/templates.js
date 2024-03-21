/**
 * Define a set of template paths to pre-load
 *
 * Pre-loaded templates are compiled and cached for fast access when rendering
 *
 * @returns {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
    const modTemplatePaths = [

        // New Item Sheet Partials
        "modules/sfrpg-item-sheets/dist/templates/items/parts/starship-subactions.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/weapon-properties.hbs",
        "modules/sfrpg-item-sheets/dist/templates/items/parts/damage-sections.hbs"
    ];

    return loadTemplates(modTemplatePaths);
};
