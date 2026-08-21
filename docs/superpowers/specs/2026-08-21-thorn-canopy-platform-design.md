---
title: Sproutbound - Plataforma copa com espinhos
kind: design-spec
status: approved-design-review-pending
created: 2026-08-21
project: sproutbound
---

# Plataforma copa com espinhos

## Contexto

O obstáculo atual é uma entidade geométrica triangular separada da linguagem visual das copas. A mudança aprovada transforma esse obstáculo em uma plataforma temática: uma copa escura com espinhos integrados. O jogador deve reconhecer a copa como parte do mundo, mas entender imediatamente que pousar ou encostar nela encerra a tentativa.

## Decisão

- Criar o tipo de plataforma `thorn-leaf`.
- Remover a geração de entidades independentes `thorn` do mundo.
- Manter a geração determinística por seed.
- Introduzir `thorn-leaf` somente após 30 m e apenas em faixas dedicadas de perigo.
- Cada faixa dedicada conterá uma `leaf` fixa segura e uma `thorn-leaf` perigosa.
- Faixas com `moving-leaf` continuarão contendo somente uma copa móvel; não receberão `thorn-leaf`.
- Faixas com `cracked-leaf` não receberão `thorn-leaf` na mesma faixa nesta iteração, para preservar leitura e evitar excesso de escolhas.

## Geração do mundo

O gerador usará uma regra determinística de faixa dedicada, derivada do índice da plataforma e da altitude. Em uma faixa perigosa, a copa segura permanecerá na posição da rota principal e a `thorn-leaf` ocupará a posição alternativa lateral já usada pelas copas especiais.

As faixas perigosas usarão somente copas fixas. A posição, largura e composição serão limitadas ao palco lógico. A plataforma segura continuará sendo a referência `previousX`/`previousWidth` da rota seguinte.

## Colisão e lifecycle

- A `thorn-leaf` será incluída em `run.platforms` e terá geometria de plataforma normal.
- A simulação verificará sobreposição entre Pip e plataformas `thorn-leaf` em qualquer direção de movimento, não apenas durante a queda.
- Uma sobreposição emitirá `hazardHit` e `playerDied` na mesma atualização.
- Pip não receberá rebote ao tocar uma `thorn-leaf`.
- A copa perigosa não será removida, colapsada ou reutilizada; a rodada termina imediatamente.
- A regra de colapso das `cracked-leaf`, o impacto das `leaf` fixas e o movimento das `moving-leaf` permanecem inalterados.

## Renderização

O renderer desenhará `thorn-leaf` pela mesma base orgânica das copas, com:

- preenchimento verde escuro ou oliva;
- contorno contrastante;
- espinhos triangulares integrados à borda superior;
- distinção visual suficiente em portrait e landscape;
- nenhum triângulo de obstáculo independente.

A plataforma continuará usando `platform.y` como plano lógico de colisão. Os espinhos serão parte da representação visual da própria plataforma e permanecerão dentro da área aproximada da entidade para que a aparência não contradiga a colisão.

## Critérios de aceitação

1. O mundo não gera entidades com `type === 'thorn'`.
2. O mundo gera `thorn-leaf` somente após 30 m.
3. Toda faixa com `thorn-leaf` contém uma `leaf` fixa segura.
4. Nenhuma faixa com `moving-leaf` contém `thorn-leaf`.
5. O mesmo seed produz a mesma composição, posição e largura das faixas perigosas.
6. Uma sobreposição com `thorn-leaf` emite `hazardHit` e `playerDied` sem emitir `landed` ou rebote.
7. O renderer desenha a copa com espinhos e não desenha o triângulo antigo.
8. Rota inicial, altura, recorde, gotas de sol, copas rachadas, copas móveis e lifecycle continuam funcionando.
9. Testes automatizados, auditoria de build e diff passam sem requests externos, `console.log` ou aumento indevido do bundle.

## Fora de escopo

- Não criar dano parcial, vidas extras ou invulnerabilidade.
- Não tornar a copa com espinhos móvel nesta iteração.
- Não adicionar novos assets, áudio ou partículas.
- Não alterar o limiar de 30 m nem a economia de progressão.
