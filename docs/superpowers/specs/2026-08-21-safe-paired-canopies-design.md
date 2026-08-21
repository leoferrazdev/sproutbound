---
title: Sproutbound - Rotas seguras e entidades moveis
kind: design-spec
status: approved-design-review-pending
created: 2026-08-21
project: sproutbound
---

> **Status vigente:** esta especificação foi substituída por [Copa móvel única por faixa e impacto de copa fixa](2026-08-21-single-moving-canopy-impact-design.md). A regra atual mantém a copa fixa nas faixas rachadas, mas usa somente uma copa móvel nas faixas móveis.

# Rotas seguras e entidades móveis

## Decisão

Reorganizar a progressão vertical para que o jogador nunca dependa exclusivamente de uma copa rachada. Até 30 m, o percurso terá somente copas verdes, fixas e reutilizáveis. A partir de 30 m, cada faixa vertical relevante terá pelo menos uma copa verde fixa e uma segunda copa especial, que poderá ser rachada ou móvel.

As copas móveis deslocarão sua posição horizontal dentro de limites determinísticos. As gotas de sol também terão movimento lateral após 30 m. Antes desse marco, as gotas permanecerão estáveis para preservar o onboarding.

## Objetivo de gameplay

Introduzir escolha e ritmo sem criar bloqueio injusto. A copa fixa mantém uma rota segura de subida; a copa rachada oferece risco de suporte temporário; a copa móvel exige leitura de timing. O jogador poderá escolher segurança ou oportunidade sem ficar preso por uma única colisão.

## Regras de progressão

- A altura será calculada pelo mesmo sistema atual de metros.
- A faixa de 0 a 30 m conterá apenas `leaf` fixas.
- A partir de 30 m, cada faixa gerada conterá uma copa fixa segura.
- As faixas posteriores também receberão uma variação especial de forma determinística.
- A variação especial poderá ser `cracked-leaf` ou `moving-leaf`.
- Combinações com duas copas especiais na mesma faixa ficam reservadas para uma etapa posterior.
- O posicionamento horizontal das alternativas será alcançável pelo envelope atual de salto e direção.
- Um suporte rachado que desaparece não removerá a copa fixa da mesma faixa nem a próxima rota segura.

## Movimento das copas

Copas `moving-leaf` terão `baseX`, `motionRange`, `motionPhase` e `motionSpeed`. A simulação atualizará `x` com uma função senoidal limitada, mantendo a copa dentro da largura lógica do palco. A colisão usará a posição atualizada, e o renderer consumirá o mesmo snapshot para que a aparência e a física permaneçam sincronizadas.

O movimento começará somente após 30 m. A primeira faixa móvel usará velocidade e amplitude moderadas; faixas posteriores poderão variar dentro de limites definidos, sem teleportes ou deslocamentos impossíveis.

## Movimento das gotas de sol

Gotas abaixo de 30 m permanecerão no ponto gerado. Gotas posteriores receberão os mesmos campos de movimento lateral das copas, mas com amplitude menor. A posição será atualizada na simulação antes da verificação de coleta, garantindo que Pip colete a gota onde ela realmente está desenhada.

## Arquitetura e dados

`world.js` será responsável por gerar faixas e pares de copas, classificar entidades e atribuir parâmetros determinísticos de movimento. `simulation.js` atualizará posições móveis antes de resolver pousos e coletas. `canvas-renderer.js` continuará apenas desenhando o snapshot, sem recalcular a posição de gameplay.

As copas rachadas manterão o estado de colapso já implementado. Copas móveis normais não perderão colisão após o pouso. Nenhuma mudança será feita no lifecycle de plataforma, armazenamento local ou integração de portais.

## Critérios de aceite

- Nenhuma faixa entre 0 e 30 m contém copa móvel ou rachada.
- Toda faixa posterior que contém uma copa especial também contém uma copa fixa segura.
- O mesmo seed produz as mesmas faixas, tipos, amplitudes, fases e velocidades.
- Copas móveis permanecem dentro do palco e a colisão acompanha seu deslocamento.
- Gotas posteriores a 30 m deslocam-se lateralmente e são coletadas na posição atual.
- Gotas iniciais continuam estáveis.
- Uma copa rachada pode desaparecer sem bloquear a subida.
- A primeira plataforma e os primeiros saltos permanecem inalterados.
- Altura, recorde, progressão, espinhos, coleta e lifecycle continuam funcionando.
- O build continua offline, sem requests externos e abaixo de 8 MB.

## Testes previstos

- Mundo: limiar de 30 m, pares seguro/especial e determinismo dos parâmetros.
- Simulação: movimento lateral, limites de palco, colisão na posição atual e coleta de gotas móveis.
- Regressão: colapso de copas rachadas, rota inicial, altura, recorde e lifecycle.
- Renderização: copa móvel e gota desenhadas na posição do snapshot.
- Release: suíte completa, auditoria de tamanho e diff limpo.
