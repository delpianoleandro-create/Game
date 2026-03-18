// ItemDatabase.js - Sistema Centralizado de Objetos
export const ItemDatabase = {
    // Definición de todos los objetos del juego
    items: {
        "espada_basica": { id: "espada_basica", name: "Espada Oxidada", value: 10, icon: "🗡️", type: "weapon", damage: 5 },
        "espada_larga": { id: "espada_larga", name: "Espada Larga", value: 50, icon: "⚔️", type: "weapon", damage: 15 },
        "espada_legendaria": { id: "espada_legendaria", name: "Espada de Elyria", value: 200, icon: "⚔️", type: "weapon", damage: 35 },
        "escudo_madera": { id: "escudo_madera", name: "Escudo de Madera", value: 15, icon: "🛡️", type: "shield", defense: 5 },
        "escudo_hierro": { id: "escudo_hierro", name: "Escudo de Hierro", value: 40, icon: "🛡️", type: "shield", defense: 15 },
        "casco_cuero": { id: "casco_cuero", name: "Casco de Cuero", value: 20, icon: "🪖", type: "helmet", defense: 2 },
        "armadura_malla": { id: "armadura_malla", name: "Cota de Malla", value: 60, icon: "🦺", type: "armor", defense: 10 },
        "botas_velocidad": { id: "botas_velocidad", name: "Botas Ágiles", value: 30, icon: "👢", type: "boots", defense: 2 },
        "anillo_vida": { id: "anillo_vida", name: "Anillo de Vida", value: 100, icon: "💍", type: "accessory" },
        "pocion_vida": { id: "pocion_vida", name: "Poción Vida", value: 15, icon: "🧪", type: "consumable", heal: 30 },
        "pocion_energia": { id: "pocion_energia", name: "Poción Magia", value: 20, icon: "🏺", type: "consumable", energyRestore: 40 },
        "gema": { id: "gema", name: "Gema Preciosa", value: 100, icon: "💎", type: "valuable" },
        "oro_pequeno": { id: "oro_pequeno", name: "Bolsita de Oro", value: 10, icon: "💰", type: "gold" },
        "oro_grande": { id: "oro_grande", name: "Bolsa Llena de Oro", value: 50, icon: "💰", type: "gold" },
        "poder_fuego": { id: "poder_fuego", name: "Aura de Fuego", value: 150, icon: "🔥", type: "companion_power", element: "fire" },
        "poder_hielo": { id: "poder_hielo", name: "Aura de Hielo", value: 150, icon: "❄️", type: "companion_power", element: "ice" }
    },

    // Obtener un objeto completo por su ID
    getItem(id) {
        if (this.items[id]) {
            return { ...this.items[id] }; // Devuelve una copia fresca
        }
        console.warn(`ItemDatabase: Objeto con ID ${id} no encontrado.`);
        return null;
    },

    // Generador de botín aleatorio para los cofres
    generateLoot(forceType = null) {
        let pool = Object.values(this.items);
        
        // Si se fuerza un tipo (ej. "weapon"), filtramos
        if (forceType) {
            pool = pool.filter(item => item.type === forceType);
        }

        // Devolver un elemento al azar de la pool
        const randomItem = pool[Math.floor(Math.random() * pool.length)];
        return { ...randomItem };
    }
};
