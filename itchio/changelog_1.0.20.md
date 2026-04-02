# ZXDraw v1.0.20 — Novedades

## Nuevas funcionalidades

### Editor de máscaras
Nueva herramienta que permite editar los píxeles de máscara de forma manual sobre el propio sprite. Para usarla, selecciona un área que contenga el sprite y su columna de máscara, y pulsa el botón "Editar Máscara":
- El overlay **rojo** indica las zonas transparentes (máscara activa).
- **Clic izquierdo** — marca el píxel como transparente.
- **Clic derecho** — marca el píxel como opaco.
- Se incluye rejilla 8×8 como referencia de caracteres.
- Compatible con deshacer/rehacer.

## Correcciones

### Pegado clampeado al canvas
Al pegar una selección ancha (por ejemplo, 8 sprites de 16×16) cerca del borde derecho o inferior del canvas, el cursor de pegado ahora se limita automáticamente para que el contenido completo quepa dentro. Ya no se pierden sprites al pegar.

### Copiar y pegar entre instancias: clipboard siempre actualizado
Al pulsar Ctrl+V en una instancia que ya había pegado algo antes, ahora siempre se utiliza el contenido más reciente del portapapeles compartido, en lugar del clipboard local anterior. Garantiza que lo que se copia en una ventana sea exactamente lo que se pega en cualquier otra.

---

# ZXDraw v1.0.20 — Changelog

## New features

### Mask editor
New tool for manually editing mask pixels directly on the sprite. Select an area containing the sprite and its mask column, then click "Edit Mask":
- The **red** overlay marks transparent pixels (active mask).
- **Left click** — set pixel as transparent.
- **Right click** — set pixel as opaque.
- An 8×8 character grid is shown for reference.
- Supports undo/redo.

## Bug fixes

### Paste clamped to canvas bounds
When pasting a wide selection (e.g. 8 sprites of 16×16) near the right or bottom edge of the canvas, the paste cursor is now automatically clamped so the full content fits within bounds. No more sprites getting cut off when pasting.

### Cross-instance paste always reads latest clipboard
Pressing Ctrl+V in an instance that had previously pasted something would reuse its stale local clipboard instead of the shared one. Now `startPaste` always reads the shared clipboard file, so whatever was copied in any window is exactly what gets pasted in any other.

---

# ZXDraw v1.0.20 — Novidades

## Novas funcionalidades

### Editor de máscaras
Nova ferramenta que permite editar os pixels de máscara manualmente sobre o próprio sprite. Para usá-la, selecione uma área que contenha o sprite e a sua coluna de máscara, e clique no botão "Editar Máscara":
- O overlay **vermelho** indica as zonas transparentes (máscara ativa).
- **Clique esquerdo** — marca o pixel como transparente.
- **Clique direito** — marca o pixel como opaco.
- Inclui grelha 8×8 como referência de caracteres.
- Compatível com desfazer/refazer.

## Correções

### Colagem limitada aos limites do canvas
Ao colar uma seleção larga (por exemplo, 8 sprites de 16×16) perto da borda direita ou inferior do canvas, o cursor de colagem agora é limitado automaticamente para que o conteúdo completo caiba dentro. Não perderá mais sprites ao colar.

### Copiar e colar entre instâncias: clipboard sempre atualizado
Ao pressionar Ctrl+V numa instância que já tinha colado algo antes, agora utiliza sempre o conteúdo mais recente da área de transferência partilhada, em vez do clipboard local anterior. Garante que o que é copiado numa janela é exatamente o que é colado em qualquer outra.

