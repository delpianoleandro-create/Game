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
**Archivos:** `src/data/ItemDatabase.js`, `Player.js`, `HUD.js` y `DungeonGenerator.js`

El sistema ha evolucionado a una base de datos centralizada (`ItemDatabase.js`). Ya no se usan objetos sueltos creados al vuelo; todo se gestiona mediante identificadores únicos.

### Estructura de un Objeto (ItemDatabase.js):
```javascript
"pocion_vida": { id: "pocion_vida", name: "Poción Vida", value: 15, icon: "🧪", type: "consumable", heal: 25 }
```

### ¿Cómo crear y añadir nuevos Objetos?
1.  Abre `src/data/ItemDatabase.js`.
2.  Añade tu nuevo objeto en el diccionario `items`:
    ```javascript
    "llave_dorada": { id: "llave_dorada", name: "Llave del Jefe", value: 500, icon: "🔑", type: "quest" }
    ```
3.  El motor `DungeonGenerator.js` llama automáticamente a `ItemDatabase.generateLoot()` para llenar los cofres aleatoriamente.
4.  Para aplicar efectos al usarlos (Ej. curar vida), edita `src/entities/Player.js` en la función `useItem(inventoryIndex)` y añade lógica según el `item.type`.

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

---

## 💬 10. Sistema de Diálogos y Eventos Táctiles (Mejoras Recientes)
**Archivos:** `src/ui/DialogueManager.js`, `src/ui/HUD.js`

El sistema ha sido parcheado para garantizar una compatibilidad perfecta con dispositivos móviles y evitar fallos lógicos en la renderización de texto:

1.  **Soporte Multi-táctil en el HUD:** Los botones de la mochila y de control (A, B) ahora escuchan tanto el evento `click` clásico (PC) como `touchstart` (Móviles). Se usa `e.preventDefault()` en los toques para evitar demoras (delays) comunes en los navegadores web móviles de 300ms, y evitar que el Canvas absorba el evento por error.
2.  **Anti-Bleeding de Diálogos:** El efecto de "Máquina de escribir" (Typewriter) en `DialogueManager` ahora maneja asincronía segura mediante recortes de texto (`substring()`) e "IDs de Sesión". Esto aborta limpiamente cualquier hilo de texto huérfano antes de renderizar la siguiente línea de diálogo, evitando sobreescrituras en pantalla.
3.  **Toques Fantasma (Ghost Clicks) y Dobles Eventos:** Al abrir modales como la Mochila, los navegadores emiten eventos táctiles y eventos de ratón superpuestos. Se ha reescrito `HUD.js` para usar la directiva `pointerdown` y "Debounce", impidiendo la ejecución de clics dobles que cerraban instantáneamente los menús o vaciaban accidentalmente los objetos. Adicionalmente, se forzó la "Clonación" profunda de nodos al iniciar nuevas partidas para depurar los *event listeners* viejos que desbordaban la memoria lógica.

---

## 📈 11. Escalabilidad (Añadir NPCs, Tiendas y Oro)
El juego cuenta con un diseño basado en entidades agnósticas (Mundo → Chunk → Interfaz → Base de Datos), lo cual lo hace altamente escalable. Aquí está la hoja de ruta para soportar nuevas mecánicas económicas o enemigos:

### A. Economía y Tiendas (Compra / Venta)
*   **ItemDatabase.js:** Está preparado. Ya todos los objetos tienen su valor asignado en oro (`value`).
*   **Mecánica de Venta:** Ya implementada. Cuando abres la mochila y tocas la etiqueta del precio de un objeto, `Player.sellItem(index)` se encarga de convertirlo en moneda, incrementando tu "Oro". 
*   **Añadir Mercader (NPC):** Para incluir NPCs que vendan objetos:
    1. Crea un modelo 3D estacionario en `DungeonGenerator.js` (como si fuera un cofre que no se abre).
    2. En `Player.js -> checkInteractables`, cuando el jugador esté a < 3.0 de distancia y toque "A", dispara una llamada al HUD: `this.hud.showShop(npc.inventory)`.
    3. Construye un nuevo Modal de Tienda (Copiado exactamente de `#chestModal`), pero añade botones de precio que reduzcan `this.player.gold` antes de pasarlo al inventario.

### B. Salud, Vida y Consumibles (Pociones)
1. Para curar vida o aumentar stats, abre `src/entities/Player.js` y ve a la función `useItem(index)`.
2. Añade un condicional `if (item.type === 'consumable')`.
3. Extrae la curación `this.hp += item.heal;` y retira el objeto llamando a `this.inventory.splice(index, 1);`.

### C. Sistema Expandible de Enemigos y Diamantes
*   **Enemigos:** La clase `src/entities/enemies/BaseEnemy.js` abstrae totalmente la física y vida. Para hacer un Troll Gigante, basta crear un archivo nuevo, extender esa clase, aumentar la `saludBase` y su tamaño de renderizado (`mesh.scaling.set(3, 3, 3)`).
*   **Diamantes/Moneda Premium:** Así como el "Oro" actual se actualiza llamando a `hud.updateGold()`, simplemente añade un nuevo cuadro al HUD HTML (ej. `💎 Diamantes: 0`) e invoca `hud.updateDiamonds()` cuando el jugador recoja objetos valiosos tipo `"valuable"` o `"premium"` creados dentro del `ItemDatabase.js`.