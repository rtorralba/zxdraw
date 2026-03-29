# ZX Draw — Editor de pixel art estilo ZX Spectrum

ZX Draw es un editor ligero inspirado en el ZX Spectrum para crear gráficos de 256×192 con atributos de bloque 8×8.

## Novedades recientes
- Exportadores multiplataforma y empaquetado: builds para Windows (NSIS), macOS (DMG) y Linux (AppImage) y flujo de CI para releases.
- Importación de `.scr`: carga dumps de pantalla del Spectrum y conviértelos a proyecto `.zxp`.
- Importación de imágenes PNG/JPG: modal interactivo con controles de brillo, contraste y saturación y vista previa ZX Spectrum antes de importar.
- Herramienta de texto mejorada: modal más ancho con previsualización a la derecha y ajuste de umbral, tamaño y estilos.
- Paleta mejorada: clic para seleccionar/deseleccionar tinta/papel, soporte para Bright/Flash en modo `keep/on/off`.
- Rotar selección 90°: nuevo botón para rotar únicamente la selección activa.
- Mejora de accesibilidad/UX: iconos más claros (se intercambiaron los iconos de invertir píxeles/atributos), y panel de Atributo Actual eliminado para simplificar la UI.
- Internacionalización (i18n): UI traducible con selector de idioma (es/en/pt) y menú nativo traducido.

## Características principales
- Lienzo a escala con grid 8×8 y zoom hasta 16×
- Edición por píxel con manejo de atributos de bloque (ink/paper/bright/flash)
- Selección, copiar/pegar, invertir, flip horizontal/vertical
- Guardado y carga en formato `.zxp` propio y compatibilidad con `.scr`
- Exportar PNG

## Cómo probar
Descarga los artefactos del release para tu plataforma y ejecuta la app. Para desarrolladores:

```powershell
npm install
npm start
```

## Capturas
(Agrega capturas aquí: /screenshots)

## Contacto
Desarrollado por Raül Torralba. Issues y contribuciones en el repositorio GitHub.
