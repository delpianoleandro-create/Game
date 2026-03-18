# 📜 Guía Definitiva de Desarrollo: Las Profundidades de Elyria

Esta guía documenta exhaustivamente cómo está construido el juego y cómo puedes modificar o agregar nuevas características (mapas, objetos, personajes, controles, etc.) sin romper la estructura actual.

---

## 🏗️ 1. Arquitectura General del Juego

El juego utiliza **Babylon.js** como motor 3D y una capa de **HTML/CSS** superpuesta para la interfaz de usuario (HUD, Menús, Modales). 

*   **Punto de Entrada:** `index.html` carga el lienzo (Canvas), las pantallas de carga y llama a `src/game.js`.
*   **Bucle Principal (Main Loop):** `src/game.js` orquesta el juego. Enlaza la escena 3D, el menú, y maneja los estados de pausa.
*   **Director de Escena:** `src/scenes/DungeonScene.js`. Es el archivo más importante. Aquí se instancian el mundo, el jugador, las luces principales y se actualizan todos los elementos en cada fotograma (`scene.onBeforeRenderObservable.add`).

---

## 🗺️ 2. Generación del Mundo (Mundo Infinito)
**Archivo:** `src/world/DungeonGenerator.js`

El mundo no se carga de golpe. Se genera proceduralmente usando un sistema de "Chunks" (Parcelas de 30x30 unidades).

### ¿Cómo funciona?
En cada frame, el juego calcula en qué "Chunk" está el jugador y genera un radio de 3x3 Chunks a su alrededor. Si un Chunk no existe, llama a `buildChunk()`.

### ¿Cómo modificar el mapa o añadir biomas?
1.  **Modificar el tamaño de las salas:** Cambia `this.roomSize` y `this.doorSize` en el constructor de `DungeonGenerator`.
2.  **Añadir pilares, trampas o decoración:** Dentro de `buildChunk()`, puedes añadir lógica condicional (RNG con `Math.random()`) para instanciar mallas (`BABYLON.MeshBuilder.CreateBox`, `CreateCylinder`, etc.).
3.  **Iluminación de Antorchas:** El generador llama a `createTorch()`. Estas luces tienen un sistema de parpadeo (Flicker) controlado directamente en `DungeonScene.js`. No abuses de las PointLights (máximo 4-6 afectando una misma malla en WebGL).

---

## 🦸‍♂️ 3. El Jugador y sus Héroes
**Archivo:** `src/entities/Player.js`

El jugador es una malla geométrica de tipo Cápsula (`CreateCapsule`). Su altura en el eje Y es vital (`this.mesh.position.y = 1.0`) para que no traspase el suelo debido al tamaño de su colisionador (Ellipsoid).

### ¿Cómo añadir un nuevo Héroe?
1.  **Añadir en la UI:** Abre `index.html` y añade una nueva `<option>` en el `<select id="heroSelect">`.
    ```html
    <option value="paladin">🛡️ Paladín Sagrado</option>
    ```
2.  **Modelado en Player.js:** En el constructor de `Player`, añade un bloque `else if (heroType === "paladin")`.
3.  **Crear su aspecto:** Usa primitivas de Babylon (ej. Cubos para armaduras). Configura su velocidad (`this.speed`).
4.  **Ataque (Método `attack`):** Decide si es cuerpo a cuerpo (ejecuta una animación y daño de área) o a distancia (como el Mago, que instancia proyectiles en `this.projectiles`).

---

## 🎒 4. Sistema de Inventario y Objetos (Loot)
**Archivos:** `Player.js`, `HUD.js` y `DungeonGenerator.js`

El sistema pasó de usar simples textos (`"espada"`) a usar objetos de JavaScript estructurados. 

### Estructura de un Objeto (Item):
```javascript
{ id: "pocion_curacion", name: "Poción Mayor", value: 50, icon: "🧪" }
```

### ¿Cómo crear y añadir nuevos Objetos?
1.  Ve a `src/world/DungeonGenerator.js`, dentro del método `createChest()`.
2.  Busca el array `allItems` y añade tu nuevo objeto.
    ```javascript
    const allItems = [
        { id: "espada", name: "Espada Larga", value: 50, icon: "⚔️" },
        // ... otros ...
        { id: "llave_dorada", name: "Llave del Jefe", value: 500, icon: "🔑" }
    ];
    ```
3.  El sistema de cofres elegirá aleatoriamente de esta lista (o los predefinidos). Cuando el jugador pulsa "Recoger", el objeto pasa al array `this.inventory` del Jugador y el HUD se actualiza automáticamente.
4.  Para usar un objeto: En `Player.js` o `HUD.js` podrías añadir lógica en la función `sellItem` o crear una nueva función `useItem(index)` que compruebe el `id` y aplique el efecto (ej. sumar vida).

---

## 📦 5. Cofres (Diseño y Animación)
**Archivo:** `src/world/DungeonGenerator.js`

El cofre está compuesto por dos mallas:
1.  **Base:** Un cubo recortado (`height: 0.8`).
2.  **Tapa (Lid):** Un cubo delgado (`height: 0.2`) anclado (`setPivotPoint`) a la parte trasera de la base.
La animación de rotar la tapa -90 grados (-Math.PI / 2) se dispara en `Player.js -> openChest()`.

---

## 🎮 6. Controles y Joysticks
**Archivos:** `src/utils/InputController.js`, `src/controllers/TopDownController.js` y `ShooterController.js`

### InputController (El Cerebro de las Teclas/Toques)
*   **Teclado:** Mapea WASD o Flechas a vectores (X, Z).
*   **Joystick Virtual:** Captura eventos táctiles en el área inferior izquierda de la pantalla (`#joystick` en HTML) y calcula un ángulo y magnitud.
*   **Botones de Acción:** Mapea clics/toques en `#actionA` (Espada/Disparo) y `#actionB` (Escudo).

### Controladores de Cámara (Los Paradigmas)
*   **TopDownController:** El movimiento es absoluto (Arriba siempre es Norte). Ideal para mandos.
*   **ShooterController:** El movimiento es relativo a la cámara. Si rotas la cámara, "Arriba" es hacia donde miras. La cámara gira rozando la pantalla (pointer drag).

### ¿Cómo añadir nuevas acciones (ej. Botón de Esquivar)?
1.  Añade un botón HTML (`#actionC`) en `index.html`.
2.  En `InputController.js`, escucha los eventos `pointerdown` y `pointerup` para `#actionC` y crea un booleano `this.actionC = true/false`.
3.  En `Player.js -> update()`, añade una condición `if (this.input.actionC)` y ejecuta tu función de esquive (Dash).

---

## 🎨 7. Gráficos, Texturas y Luces (AssetManager)
**Archivo:** `src/utils/AssetManager.js`

El juego soporta "Packs de Texturas". Los materiales se guardan en un Mapa (Diccionario) para no clonarlos inútilmente.
*   **StandardMaterial:** Rápido, ideal para móviles (Pack Clásico, Neón).
*   **PBRMaterial:** Realista, reacciona a los reflejos y la rugosidad (Pack Realista). Utiliza una textura procedural de ruido matemático (`NoiseProceduralTexture`) para simular relieve sin coste de red.

### ¿Cómo cambiar los colores del mapa?
Abre `AssetManager.js`. Si estás en el pack Clásico, busca `floorMat.diffuseColor = new BABYLON.Color3(R, G, B)`. (Nota: En Babylon.js, los colores RGB van de 0.0 a 1.0, no de 0 a 255).

### Linterna del Jugador (Flashlight)
En `DungeonScene.js`, el jugador tiene un `SpotLight` atado a su pecho.
*   Para cambiar el alcance: `flashlight.range = 60;`
*   Para cambiar la apertura: Modifica el ángulo en su constructor (ej. `Math.PI / 2`).

---

## 👾 8. Enemigos e Inteligencia Artificial
**Archivos:** `src/entities/enemies/BaseEnemy.js` y `ShadowRat.js`

El generador de mazmorras crea un array de coordenadas (`this.enemiesData`) cuando construye una sala. La escena principal lee ese array y hace un `new ShadowRat(...)`.

### ¿Cómo crear un nuevo monstruo (Ej. Esqueleto)?
1.  Crea el archivo `src/entities/enemies/Skeleton.js` importando `BaseEnemy`.
2.  En su constructor, configura su malla (ej. un cubo blanco más alto), vida, velocidad y daño.
3.  Si quieres que dispare (como el mago), sobreescribe la función `update()` para añadir lógica de proyectiles, copiando la estructura de las matemáticas de vectores de `Player.js -> updateProjectiles`.
4.  Imórtalo en `DungeonScene.js` y espawnéalo condicionalmente en el bucle donde se instancian las ratas.

---

## 🔧 9. Modales y HTML (La Interfaz del Futuro)
Todo el sistema HTML flotante (Cofres, Mochila, Ajustes) tiene la propiedad `pointer-events: auto` en CSS para permitir clicks sin que la cámara del juego los robe, mientras que la capa `#ui-layer` global tiene `pointer-events: none` para no bloquear los giros de cámara del modo Acción.

Si añades paneles nuevos, asegúrate de añadirles `class="game-modal" style="pointer-events: auto"`.