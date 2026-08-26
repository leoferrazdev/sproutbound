# Plano — Sproutbound campanha de rotas

Especificação: `docs/superpowers/specs/2026-08-26-sproutbound-campaign-design.md`.

## Fase 1 — Espinha da campanha (concluída)

1. Catálogo de 25 rotas em 5 biomas, com semente própria, altura, escala de folga,
   mistura de perigos e objetivo.
2. Gerador aceita a receita da rota, ligando e desligando cada tipo de folha especial.
3. `createRun` recebe a rota; a semente aleatória por partida é removida.
4. Progressão v2: marcos ligados a rotas concluídas, desbloqueio em cadeia, melhor
   tempo e maior número de gotas por rota.
5. Persistência v2 com migração do formato anterior.
6. Objetivos de rota avaliados a partir dos eventos existentes.
7. Gate mede a campanha inteira e o catálogo, em vez de uma partida.

## Fase 2 — Biomas em tela

1. Paleta por bioma aplicada a fundo, folhas, espinho e gota.
2. Silhuetas de fundo com densidade por bioma.
3. Transição de bioma ao trocar de rota.

## Fase 3 — Interface da campanha

1. Tela de seleção de rota com estado por fase: bloqueada, concluída, estrela.
2. Objetivo visível durante a partida.
3. Tela de conclusão com tempo, gotas e objetivo.

## Fase 4 — Itens P1 independentes

1. Menu, pausa e retomada por perda de foco.
2. Áudio com leito musical e mute exposto.
3. Paralaxe de fundo.
4. Envoltória lateral.
5. Ocupação de tela no desktop.

## Fase 5 — Apresentação e gate

1. Recapturar vídeos dentro da especificação.
2. Registrar a evidência manual com data, navegador e commit.
3. `npm run presubmit` verde antes de qualquer envio.
