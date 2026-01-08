// server/validation/validator.js
// Valide les données des socket events contre les schémas JSON

const schemas = require('./schemas');

/**
 * Valide les données reçues contre un schéma
 * @param {*} data - Les données à valider
 * @param {string} eventName - Nom de l'événement (clé dans schemas)
 * @returns {{valid: boolean, errors: string[]}} Résultat de validation
 */
function validateSocketData(data, eventName) {
    const schema = schemas[eventName];
    
    if (!schema) {
        return { valid: false, errors: [`Schéma inconnu: ${eventName}`] };
    }

    const errors = [];

    // Vérifier le type
    if (schema.type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
        return { valid: false, errors: ['Données invalides: expected object'] };
    }

    // Vérifier les propriétés requises
    if (schema.required) {
        for (const required of schema.required) {
            if (!(required in data)) {
                errors.push(`Propriété requise manquante: ${required}`);
            }
        }
    }

    // Vérifier les propriétés
    if (schema.properties) {
        for (const key in data) {
            if (!(key in schema.properties)) {
                if (schema.additionalProperties === false) {
                    errors.push(`Propriété non autorisée: ${key}`);
                }
                continue;
            }

            const propSchema = schema.properties[key];
            const value = data[key];

            // Type check
            if (propSchema.type) {
                if (propSchema.type === 'array') {
                    if (!Array.isArray(value)) {
                        errors.push(`${key}: expected array, got ${typeof value}`);
                    } else if (propSchema.items) {
                        for (let i = 0; i < value.length; i++) {
                            const item = value[i];
                            if (typeof item !== propSchema.items.type) {
                                errors.push(`${key}[${i}]: expected ${propSchema.items.type}, got ${typeof item}`);
                            }
                            if (propSchema.items.minimum !== undefined && item < propSchema.items.minimum) {
                                errors.push(`${key}[${i}]: value ${item} is below minimum ${propSchema.items.minimum}`);
                            }
                            if (propSchema.items.maximum !== undefined && item > propSchema.items.maximum) {
                                errors.push(`${key}[${i}]: value ${item} is above maximum ${propSchema.items.maximum}`);
                            }
                        }
                    }
                    if (propSchema.maxItems && value.length > propSchema.maxItems) {
                        errors.push(`${key}: array exceeds maxItems ${propSchema.maxItems}`);
                    }
                } else if (typeof value !== propSchema.type) {
                    if (!(propSchema.type === 'number' && typeof value === 'number')) {
                        errors.push(`${key}: expected ${propSchema.type}, got ${typeof value}`);
                    }
                }
            }

            // Enum check
            if (propSchema.enum && !propSchema.enum.includes(value)) {
                errors.push(`${key}: value "${value}" is not in allowed values: ${propSchema.enum.join(', ')}`);
            }

            // Min/Max for numbers
            if (typeof value === 'number') {
                if (propSchema.minimum !== undefined && value < propSchema.minimum) {
                    errors.push(`${key}: value ${value} is below minimum ${propSchema.minimum}`);
                }
                if (propSchema.maximum !== undefined && value > propSchema.maximum) {
                    errors.push(`${key}: value ${value} is above maximum ${propSchema.maximum}`);
                }
            }

            // Min/Max length for strings
            if (typeof value === 'string') {
                if (propSchema.minLength && value.length < propSchema.minLength) {
                    errors.push(`${key}: length ${value.length} is below minimum ${propSchema.minLength}`);
                }
                if (propSchema.maxLength && value.length > propSchema.maxLength) {
                    errors.push(`${key}: length ${value.length} exceeds maximum ${propSchema.maxLength}`);
                }
            }

            // Nested object validation
            if (propSchema.type === 'object' && typeof value === 'object' && value !== null) {
                if (propSchema.properties) {
                    for (const nestedKey in propSchema.properties) {
                        if (!(nestedKey in value) && propSchema.properties[nestedKey].required) {
                            errors.push(`${key}.${nestedKey}: required property missing`);
                        }
                    }
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateSocketData
};
