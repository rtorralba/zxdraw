# ZXDrawer: Edición de fuentes CHR/CH8, Exportación SP1 para z88dk y agradecimientos · v1.0.28

---

## [ES] Español

### Resumen
La versión **1.0.28** amplía la compatibilidad de formatos, añade un nuevo exportador para la librería SP1 de z88dk y mejora la interfaz con la ruta del fichero abierto visible en la barra de estado.

### Novedades y Mejoras

1. **Soporte para fuentes y tiles CHR y CH8**
   ZXDrawer ahora soporta los formatos `.chr` y `.ch8` para trabajar con fuentes y tiles:
   - Abre archivos `.chr` y `.ch8` desde el menú, arrastrándolos sobre la aplicación o desde la lista de recientes.
   - Guarda y exporta directamente en ambos formatos desde el menú **Archivo > Exportar**.
   - Formato raw de bitmaps de caracteres/tiles de 8×8 sin atributos de color.

2. **Exportación CYD Charset (JSON)**
   Nueva opción en el menú **Archivo > Exportar > Exportar CYD Charset (json)…**:
   - Exporta cada tile 8×8 del lienzo como una entrada de carácter en formato JSON compatible con CYD.
   - Configurable: ID del primer carácter y ancho fijo por carácter.
   - Opción de detección automática del ancho proporcional según el contenido de píxeles de cada carácter.

3. **Exportación SP1 para z88dk**
   Nueva opción en el menú **Archivo > Exportar > Exportar Sprite SP1 (z88dk)…**:
   - Genera código ASM compatible con la librería SP1 de z88dk, listo para usar en juegos de ZX Spectrum con C.
   - Cada columna de 8 píxeles de ancho se convierte en una etiqueta `PUBLIC` independiente.
   - Opción de incluir máscara: los píxeles vacíos se tratan como transparentes (`@11111111`).
   - Configurable: nombre del sprite e identificador de sección (p.ej. `rodata_user`, `BANK_2`).
   - Basado en el algoritmo del proyecto [png2sp1sprite](https://github.com/jsmolina/png2sp1sprite).

4. **Ruta del fichero en la barra de estado**
   La barra de estado inferior ahora muestra la ruta completa del archivo abierto en el lado derecho, facilitando saber en todo momento con qué fichero se está trabajando.

### Agradecimientos

Un agradecimiento especial a **[Ariel Endaraues](https://endaraues.itch.io/)** por su apoyo como primer *supporter* del proyecto. ¡Gracias!

---

## [EN] English

### Summary
Version **1.0.28** expands format compatibility, adds a new exporter for the z88dk SP1 library, and improves the interface with the open file path visible in the status bar.

### Features and Improvements

1. **CHR and CH8 Font and Tile Support**
   ZXDrawer now supports both `.chr` and `.ch8` formats for working with fonts and tiles:
   - Open `.chr` and `.ch8` files from the menu, by drag-and-drop, or from the recents list.
   - Save and export directly in both formats via **File > Export**.
   - Raw 8×8 character/tile bitmaps with no colour attributes.

2. **CYD Charset Export (JSON)**
   New option in **File > Export > Export CYD Charset (json)…**:
   - Exports each 8×8 tile as a character entry in CYD-compatible JSON format.
   - Configurable: first character ID and fixed character width.
   - Optional auto-detection of proportional width based on each character's pixel content.

3. **SP1 Export for z88dk**
   New option in **File > Export > Export SP1 Sprite (z88dk)…**:
   - Generates ASM code compatible with the z88dk SP1 library, ready to use in ZX Spectrum C games.
   - Each 8-pixel-wide column becomes an independent `PUBLIC` label.
   - Optional mask support: empty pixels are treated as transparent (`@11111111`).
   - Configurable sprite name and section identifier (e.g. `rodata_user`, `BANK_2`).
   - Based on the algorithm from [png2sp1sprite](https://github.com/jsmolina/png2sp1sprite).

4. **File Path in the Status Bar**
   The bottom status bar now shows the full path of the open file on the right side, making it easy to know which file you are working with at all times.

### Acknowledgements

Special thanks to **[Ariel Endaraues](https://endaraues.itch.io/)** for their support as the project's first *supporter*. Thank you!

---

## [PT] Português

### Resumo
A versão **1.0.28** amplia a compatibilidade de formatos, adiciona um novo exportador para a biblioteca SP1 do z88dk e melhora a interface com o caminho do arquivo aberto visível na barra de estado.

### Novidades e Melhorias

1. **Suporte a fontes e tiles CHR e CH8**
   O ZXDrawer agora suporta os formatos `.chr` e `.ch8` para trabalhar com fontes e tiles:
   - Abra arquivos `.chr` e `.ch8` pelo menu, arrastando-os para a aplicação ou a partir da lista de recentes.
   - Salve e exporte diretamente em ambos os formatos via **Arquivo > Exportar**.
   - Formato raw de bitmaps de caracteres/tiles 8×8 sem atributos de cor.

2. **Exportação CYD Charset (JSON)**
   Nova opção em **Arquivo > Exportar > Exportar CYD Charset (json)…**:
   - Exporta cada tile 8×8 do canvas como uma entrada de carácter em formato JSON compatível com CYD.
   - Configurável: ID do primeiro carácter e largura fixa por carácter.
   - Opção de deteção automática da largura proporcional com base no conteúdo de pixels de cada carácter.

3. **Exportação SP1 para z88dk**
   Nova opção em **Arquivo > Exportar > Exportar Sprite SP1 (z88dk)…**:
   - Gera código ASM compatível com a biblioteca SP1 do z88dk, pronto para usar em jogos de ZX Spectrum em C.
   - Cada coluna de 8 pixels de largura torna-se uma etiqueta `PUBLIC` independente.
   - Opção de incluir máscara: os pixels vazios são tratados como transparentes (`@11111111`).
   - Configurável: nome do sprite e identificador de secção (ex.: `rodata_user`, `BANK_2`).
   - Baseado no algoritmo do projeto [png2sp1sprite](https://github.com/jsmolina/png2sp1sprite).

3. **Caminho do ficheiro na barra de estado**
   A barra de estado inferior agora exibe o caminho completo do arquivo aberto no lado direito, facilitando saber em todo momento com que ficheiro se está a trabalhar.

### Agradecimentos

Um agradecimento especial a **[Ariel Endaraues](https://endaraues.itch.io/)** pelo apoio como primeiro *supporter* do projeto. Obrigado!
