# Arquivo de mídia

Material **fora da submissão**, guardado para registro e para uso editorial — vídeo de
retrospectiva, comparação antes e depois, documentação da evolução do projeto.

Nada aqui vai para portal nenhum. `npm run gate` inspeciona somente `media/videos/`, então
o que está nesta pasta não corre risco de ser enviado por engano.

## 2026-08-preview-drafts

As duas gerações anteriores de vídeo de preview, preservadas porque documentam bem o
estado do jogo em cada momento. Ambas foram recusadas pela especificação da plataforma.

| Arquivo | Data | Resolução | Duração | O que mostra |
| --- | --- | --- | --- | --- |
| `01-2026-08-23-landscape-derivado-da-capa.mp4` | 23/08 | 1920×1080 | 15 s | **Não é gameplay.** Gerado a partir da capa estática. |
| `01-2026-08-23-portrait-derivado-da-capa.mp4` | 23/08 | 1080×1620 | 15 s | Idem, em retrato. |
| `02-2026-08-25-landscape-release-0.2.0.mp4` | 25/08 | 1280×720 | 10 s | Release `0.2.0-quality`, o build da **segunda recusa**. |
| `02-2026-08-25-portrait-release-0.2.0.mp4` | 25/08 | 800×1200 | 10 s | Idem, em retrato. |

A geração atual está em `media/videos/`, gravada em 26/08 a partir do build de campanha.

## O que mudou entre as gerações

Material de comparação para o vídeo de evolução, com os números medidos:

| Dimensão | Geração 02, 25/08 | Atual, 26/08 |
| --- | --- | --- |
| Conteúdo até o fim | 19,4 s | 9,0 min, 25 rotas |
| Biomas | 1 | 5 |
| Fundo | estático | 3 camadas de paralaxe |
| Eventos com retorno visual | 1 de 5 | 5 de 5 |
| Trilha musical | nenhuma | loop por bioma |
| Telas | 2 | 5 |
| Palco no desktop | 405 px de 1280 | 538 px |
| Borda lateral | parede invisível | atravessa |
| Contraste do contador solar | 1,28 a 1,39 : 1 | 7,79 a 8,02 : 1 |

Os dois primeiros vídeos não servem para comparar gameplay, porque não mostram gameplay.
Para o antes e depois, use a geração 02 contra a atual.
