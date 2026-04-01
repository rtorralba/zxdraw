# ZXDraw v1.0.19 — Novedades

## Nuevas funcionalidades

### Exportación de datos (ASM / BIN)
Exporta datos de sprites y atributos en formato ensamblador estándar o binario. El diálogo de exportación permite configurar:
- **Datos exportados**: Gfx+Attr, Attr+Gfx, solo Gfx, solo Attr
- **Prioridad de orden de bytes**: lista reordenable con X char, línea de char, Y char, máscara y número de frame
- **Intercalado**: Línea, Carácter, Columna, Frames, Sprite
- Opciones: **Máscara antes que gráfico**, **Máscara de atributo** (Tinta / Papel / Brillo / Flash), **Zig-zag horizontal**, **Info extra z88dk** y **Sin etiqueta ASM**
- Formato de salida: ASM o BIN

### Exportador PutChars
Genera código Boriel BASIC para mostrar gráficos de caracteres en pantalla.

### Exportador GuSprites
Genera tablas de datos de sprites en formato GuSprites para Boriel BASIC.

### Generación de máscaras
Nueva herramienta que genera automáticamente una columna de sprites de transparencia junto a cada sprite de la hoja.

### Preview de animación: navegación por frames
Se añaden los botones **Anterior** y **Siguiente** al panel de animación. Cada pulsación:
- Avanza o retrocede un frame.
- Detiene la reproducción si estaba activa.
- Resalta el sprite correspondiente en el canvas principal con un rectángulo de selección.

### Múltiples instancias
ZXDraw puede abrirse en varias ventanas simultáneamente.

### Copiar y pegar entre instancias
El portapapeles ahora se comparte entre todas las ventanas abiertas de ZXDraw. Copia una selección en una instancia y pégala en cualquier otra, sin archivos intermedios.

### Rejilla de píxel (1×1)
Se añade un nuevo botón de rejilla junto al existente de caracteres. Cuando está activo, superpone una rejilla fina de 1×1 píxel sobre el canvas (en gris semitransparente), facilitando el trabajo a nivel de píxel. Ambas rejillas son independientes y combinables. La rejilla de píxel también se muestra en el visor de animación.

### Editar sprites directamente desde el visor de animación
Ahora es posible pintar píxeles directamente sobre el canvas del visor de animación:
- **Clic izquierdo / arrastrar** — activa el píxel (tinta)
- **Clic derecho / arrastrar** — borra el píxel (papel)
- Los cambios se reflejan inmediatamente en el spriteset del canvas principal en la posición correcta del frame.
- La reproducción se detiene automáticamente al empezar a dibujar.
- Compatible con deshacer/rehacer.

## Otras mejoras
- Suite de pruebas automáticas para los exportadores PutChars, GuSprites y Datos (pruebas de snapshot, ASM + BIN).
- Hook de git pre-push ejecuta todos los tests automáticamente antes de publicar.
- Pulsar la herramienta **Selección** ahora limpia la selección activa y reinicia el visor de animación, listo para una nueva selección.
- La rejilla de caracteres (8×8) y la rejilla de píxel (1×1) se muestran también en el visor de animación, sincronizadas con los botones del canvas principal.

## Agradecimientos

Gracias a **Jaime Tejedor (Metalbrain)** por su editor gráfico **Sevenup**, cuyo exportador ha servido de referencia para comprender las distintas necesidades que los usuarios pueden tener a la hora de exportar datos y código ASM.

---

# ZXDraw v1.0.19 — Changelog

## New features

### Data export (ASM / BIN)
Exports sprite and attribute data in standard assembly or binary format. The export dialog lets you configure:
- **Data outputted**: Gfx+Attr, Attr+Gfx, Gfx only, Attr only
- **Byte sort priority**: reorderable list with X char, Char line, Y char, Mask and Frame number
- **Interleave**: Line, Character, Column, Frames, Sprite
- **Mask before graph**, **Attribute mask** (Ink / Paper / Bright / Flash), **Horizontal zig-zag**, **z88dk extra info** and **No ASM label** options
- Output format: ASM or BIN

### PutChars exporter
Generates Boriel BASIC code to display character graphics on screen.

### GuSprites exporter
Generates Boriel BASIC sprite data tables in GuSprites format.

### Generate masks
New tool that automatically generates a transparency mask sprite column next to each sprite in the sheet.

### Animation preview: frame navigation
Added **Previous** and **Next** buttons to the animation panel. Each click:
- Advances or goes back one frame.
- Stops the playback if running.
- Highlights the corresponding sprite in the main canvas with a selection rectangle.

### Multiple instances
ZXDraw can now be launched in multiple windows simultaneously.

### Copy & paste between instances
Clipboard data is now shared across all open ZXDraw windows. Copy a selection in one instance and paste it in any other — no intermediate file needed.

### Pixel grid (1×1)
A new grid button has been added next to the existing character grid toggle. When active, it overlays a fine 1×1 pixel grid on the canvas (rendered in semi-transparent grey), making it easier to work at the pixel level. Both grids are independent and can be combined. The pixel grid is also shown in the animation preview.

### Edit sprites directly from the animation preview
You can now paint pixels directly on the animation preview canvas:
- **Left click / drag** — set pixel (ink)
- **Right click / drag** — erase pixel (paper)
- Changes are immediately reflected on the main spriteset canvas at the correct frame position.
- Playback stops automatically when you start drawing.
- Supports undo/redo normally.

## Other improvements
- Automated test suite covering PutChars, GuSprites and Data export (snapshot tests, ASM + BIN).
- Pre-push git hook runs all tests automatically before pushing.
- Clicking the **Select** tool now clears the current selection and resets the animation preview, ready for a new selection.
- Character grid (8×8) and pixel grid (1×1) are both rendered in the animation preview, in sync with the main canvas toggle buttons.

## Acknowledgements

Thanks to **Jaime Tejedor (Metalbrain)** for his graphic editor **Sevenup**, whose exporter served as a reference to understand the wide range of options users may need when exporting sprite data and ASM code.

---

# ZXDraw v1.0.19 — Novidades

## Novas funcionalidades

### Exportação de dados (ASM / BIN)
Exporta dados de sprites e atributos em formato assemblador padrão ou binário. O diálogo de exportação permite configurar:
- **Dados exportados**: Gfx+Attr, Attr+Gfx, apenas Gfx, apenas Attr
- **Prioridade de ordenação de bytes**: lista reordenável com X char, linha de char, Y char, máscara e número de frame
- **Intercalação**: Linha, Carácter, Coluna, Frames, Sprite
- Opções: **Máscara antes do gráfico**, **Máscara de atributo** (Tinta / Papel / Brilho / Flash), **Zig-zag horizontal**, **Info extra z88dk** e **Sem etiqueta ASM**
- Formato de saída: ASM ou BIN

### Exportador PutChars
Gera código Boriel BASIC para exibir gráficos de caracteres no ecrã.

### Exportador GuSprites
Gera tabelas de dados de sprites no formato GuSprites para Boriel BASIC.

### Geração de máscaras
Nova ferramenta que gera automaticamente uma coluna de sprites de transparência junto a cada sprite da folha.

### Pré-visualização de animação: navegação por frames
Adicionados os botões **Anterior** e **Próximo** ao painel de animação. Cada clique:
- Avança ou recua um frame.
- Para a reprodução se estiver ativa.
- Destaca o sprite correspondente no canvas principal com um retângulo de seleção.

### Múltiplas instâncias
O ZXDraw pode agora ser aberto em várias janelas em simultâneo.

### Copiar e colar entre instâncias
A área de transferência é agora partilhada entre todas as janelas abertas do ZXDraw. Copie uma seleção numa instância e cole-a noutra — sem ficheiros intermediários.

### Grelha de pixel (1×1)
Adicionado um novo botão de grelha junto ao existente de caracteres. Quando ativo, sobrepõe uma grelha fina de 1×1 pixel sobre o canvas (em cinzento semitransparente), facilitando o trabalho ao nível do pixel. Ambas as grelhas são independentes e combináveis. A grelha de pixel também é mostrada no visualizador de animação.

### Editar sprites diretamente a partir do visualizador de animação
Agora é possível pintar pixels diretamente sobre o canvas do visualizador de animação:
- **Clique esquerdo / arrastar** — ativar pixel (tinta)
- **Clique direito / arrastar** — apagar pixel (papel)
- As alterações refletem-se imediatamente no spriteset do canvas principal na posição correta do frame.
- A reprodução para automaticamente ao começar a desenhar.
- Compatível com desfazer/refazer.

## Outras melhorias
- Suite de testes automáticos para os exportadores PutChars, GuSprites e Dados (testes de snapshot, ASM + BIN).
- Hook git pre-push executa todos os testes automaticamente antes de publicar.
- Clicar na ferramenta **Seleção** limpa agora a seleção ativa e reinicia o visualizador de animação, pronto para uma nova seleção.
- A grelha de caracteres (8×8) e a grelha de pixel (1×1) são também mostradas no visualizador de animação, sincronizadas com os botões do canvas principal.

## Agradecimentos

Obrigado a **Jaime Tejedor (Metalbrain)** pelo seu editor gráfico **Sevenup**, cujo exportador serviu de referência para compreender as diferentes necessidades que os utilizadores podem ter ao exportar dados de sprites e código ASM.
