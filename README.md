# Prototype Index — Plugin de Figma

Genera automáticamente un índice de todos los prototipos (starting points y frames con interacciones) del proyecto Figma.

## Características

- **Índice completo**: Lista todos los frames con interacciones de prototipo y starting points
- **Modo Watcher**: Detecta cambios en tiempo real cada 2 segundos y actualiza la lista automáticamente
- **Botón Regenerar**: Fuerza una actualización manual del índice
- **URL de prototipo**: Muestra y permite copiar la URL directa de cada prototipo en Figma
- **Thumbnail visual**: Vista previa del tamaño/proporción del frame
- **Metadata**: Muestra dimensiones, número de interacciones y si es Starting Point oficial
- **Multi-página**: Agrupa los prototipos por página del proyecto
- **Navegación**: Click en cualquier card para ir al frame en el canvas
- **Ordenación A–Z / Z–A**

## Instalación

1. Abre Figma Desktop
2. Ve a **Plugins → Development → Import plugin from manifest…**
3. Selecciona el archivo `manifest.json` de esta carpeta
4. El plugin aparecerá en **Plugins → Development → Prototype Index**

## Uso

1. Abre el plugin desde el menú de Plugins
2. Verás la lista de todos los prototipos del proyecto actual
3. **Watcher**: Activa el modo watcher para que la lista se actualice sola cuando hagas cambios
4. **Regenerar**: Pulsa para forzar una actualización manual
5. **Click en una card**: Navega directamente al frame en el canvas
6. **⎘ Copiar**: Copia la URL del prototipo al portapapeles

## Cómo detecta prototipos

El plugin detecta frames como prototipos si:
- Están marcados como **Starting Point** en Figma (`prototypeStartingPoint`)
- Tienen **interacciones directas** (reactions) en el frame
- Tienen **interacciones en hijos** del frame

## Archivos

```
figma-prototype-index/
├── manifest.json   — Configuración del plugin
├── code.js         — Lógica principal (sandbox de Figma)
├── ui.html         — Interfaz de usuario
└── README.md       — Esta documentación
```

## Notas

- La **fecha de última modificación** no está disponible a nivel de nodo individual en la API de Figma (sólo existe a nivel de archivo via REST API). El plugin muestra la hora de la última vez que fue escaneado.
- La URL del prototipo requiere que el archivo esté guardado en la nube (necesita `figma.fileKey`).
- El Watcher comprueba cambios cada **2 segundos** comparando snapshots de nombre, página y número de interacciones.
