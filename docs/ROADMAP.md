# Hoja de Ruta: El Mundo Infinito de Elyria

Para transformar el prototipo en una aventura de mundo abierto y mazmorras interminables (Endless Dungeon Crawler / Roguelike), implementaremos la siguiente arquitectura a largo plazo:

## 1. Generación Procedural Infinita (Sistema de "Chunks" o Habitaciones)
Actualmente, el mapa es una caja estática de 40x40. Para que sea infinito:
* **Habitaciones Conectadas:** El `DungeonGenerator` ya no creará un cuadrado cerrado. En su lugar, creará "Habitaciones" prefabricadas o generadas al azar (Ej: Sala de Tesoro, Pasillo, Sala de Jefe).
* **Streaming en Tiempo Real:** Cuando el jugador se acerque a una puerta o al borde de su habitación actual, el motor calculará y dibujará automáticamente la siguiente habitación en esa dirección.
* **Semillas Matemáticas (Seeds):** Usaremos una semilla inicial (ej. "Aventura123") para que la generación aleatoria tenga sentido. Si dos jugadores usan la misma semilla, jugarán exactamente el mismo nivel infinito.

## 2. Gestión de Memoria (Culling y Pooling)
Un mapa infinito colapsaría la memoria de cualquier celular.
* **Destrucción de Zonas Viejas:** A medida que el jugador avanza hacia el norte, las habitaciones que quedan muy al sur (fuera del alcance visual y del radar) serán destruidas de la memoria (`mesh.dispose()`).
* **Object Pooling:** En lugar de crear y destruir a los enemigos y proyectiles mágicos todo el tiempo (lo que causa lag), crearemos un "pool" oculto de, por ejemplo, 50 ratas. Cuando una rata muere, simplemente se oculta y se recicla más adelante cuando se necesite otra rata en una nueva sala.

## 3. Biomas Dinámicos (El Descenso)
Para que el mundo no se vuelva aburrido visualmente al ser infinito:
* **Capas de Profundidad:** El juego medirá qué tan lejos o profundo has llegado (Ej: Nivel de Profundidad: 15).
* **Cambio de Texturas:** El `AssetManager` entrará en acción. 
    * De la habitación 1 a la 10: *Ruinas de Piedra Oscura* (Bioma actual).
    * De la habitación 11 a 20: *Cavernas de Lava* (Las antorchas se vuelven rojas, el suelo emite luz).
    * De la habitación 21 a 30: *Ciudad Sumergida* (Niebla azul espesa, pilares de cristal).

## 4. Evolución de Enemigos y Botín (Escalado)
El mundo infinito necesita desafíos infinitos.
* **Niveles de Monstruos:** La `ShadowRat` pasará a ser Nivel 1. A más profundidad, aparecerán `EliteShadowRat` (más grandes, más rápidas, con daño de veneno).
* **Rareza de Objetos:** Los cofres usarán un sistema de probabilidades (RNG):
    * 70% Común (Madera)
    * 25% Raro (Plata - Da armas con más daño)
    * 5% Épico (Oro - Da artefactos mágicos para el aura)

## 5. El Árbol de Habilidades y el Campamento Base (Hub)
* Aunque el nivel sea infinito, el jugador tarde o temprano morirá.
* Implementaremos un **"Campamento Base"** en la superficie (fuera de la mazmorra). Aquí gastarás el Oro recolectado para mejorar permanentemente a tu héroe (Más velocidad, empezar con una espada de hierro en vez de madera, etc.) antes de lanzarte de nuevo al abismo infinito.
