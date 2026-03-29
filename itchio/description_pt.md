# ZX Draw — Editor de Pixel Art no estilo ZX Spectrum

ZX Draw é um editor leve inspirado no ZX Spectrum para criar gráficos 256×192 com atributos de bloco 8×8.

## Novidades recentes
- Empacotamento multiplataforma: builds para Windows (NSIS), macOS (DMG) e Linux (AppImage) e workflow de CI para releases.
- Importação de `.scr`: carregue dumps de tela do Spectrum e converta para o formato de projeto `.zxp`.
- Importação PNG/JPG: modal interativo com controle de brilho, contraste e saturação e pré-visualização ZX Spectrum antes de importar.
- Ferramenta de texto melhorada: modal mais largo com pré-visualização à direita, controle de limiar, opções de fonte/tamanho/estilo.
- Paleta melhorada: clique para selecionar/desselecionar tinta/papel, e controles Bright/Flash em 3 posições (`keep/on/off`).
- Rotacionar seleção 90°: botão para rotacionar apenas a seleção ativa (blocos e pixels).
- Melhoria de UX: ícones mais claros (inverter pixels/atributos trocados) e remoção do painel de Atributo Atual.
- i18n: UI traduzível com seletor de idioma (English, Español, Português) e menu nativo localizado.

## Recursos principais
- Canvas escalável com grid 8×8 e zoom até 16×.
- Edição por pixel com suporte aos atributos do ZX Spectrum (ink, paper, bright, flash).
- Selecionar / copiar / colar / inverter / flip.
- Salvar/carregar em `.zxp`, importar `.scr`, exportar PNG.

## Teste
Baixe os artefatos do release para sua plataforma.

Para desenvolvimento:

```powershell
npm install
npm start
```

## Capturas
(Adicione capturas em /screenshots)

## Contato
Desenvolvido por Raül Torralba. Issues e contribuições no GitHub.
