---
title: Sproutbound - Copas frageis e movimento de pouso
kind: design-spec
status: approved-design-review-pending
created: 2026-08-21
project: sproutbound
---

# Copas frágeis e movimento de pouso

## Decisão

Adicionar uma variação de plataforma chamada `cracked-leaf`. Algumas folhas de segmentos posteriores serão mais escuras e rachadas. Ao receber o primeiro pouso do Pip, uma `cracked-leaf` inicia uma animação curta de balanço e queda, perde imediatamente a capacidade de colisão e desaparece ao final da animação.

Folhas verdes normais continuam fixas e reutilizáveis. O mundo permanece determinístico pelo seed existente.

## Objetivo de gameplay

A mecânica cria uma decisão simples: folhas normais são pontos seguros e folhas rachadas são suportes temporários. O primeiro pouso continua válido, mas o jogador não poderá permanecer ou retornar à mesma copa. A dificuldade adicional aparece apenas depois da faixa inicial de onboarding.

## Regras

- A geração inicial permanece sem folhas frágeis nos três primeiros segmentos.
- Folhas frágeis aparecem somente nos segmentos posteriores, em uma frequência determinística e legível.
- O pouso em uma folha frágil dispara exatamente um evento de ativação.
- A folha ativada não participa de novas colisões.
- A duração da queda visual será de 0,45 s.
- Durante a queda, a folha balança verticalmente e se desloca para baixo com redução gradual de opacidade.
- Ao fim da animação, a folha deixa de ser renderizada.
- A eliminação do suporte não altera a física do Pip depois do rebote já concedido.

## Arquitetura e fluxo de dados

`world.js` marcará a variação por `kind: 'cracked-leaf'`. `simulation.js` manterá o estado transitório da plataforma (`collapsing`, tempo restante e `collapsed`), excluirá plataformas ativadas da busca de pouso e emitirá eventos de ativação/conclusão. `canvas-renderer.js` desenhará cor mais escura, rachaduras e a animação baseada no tempo restante.

O modelo não dependerá de relógio global, DOM ou plataforma externa. O delta time limitado já usado pela simulação controlará a queda visual, mantendo o comportamento reproduzível e seguro quando a aba perder foco.

## Critérios de aceite

- O mesmo seed produz a mesma posição e classificação de folhas frágeis.
- A folha frágil aparece escura e com rachaduras visíveis.
- O primeiro pouso ainda rebate Pip normalmente.
- A mesma folha não gera um segundo pouso após ser ativada.
- A folha fica abaixo da posição inicial durante a animação e deixa de ser renderizada ao terminar.
- Folhas normais mantêm a colisão e a aparência atuais.
- O início da rodada continua seguro e alcançável.
- A coleta de gotas, a medição de altura e o recorde permanecem inalterados.
- Nenhuma dependência externa, request de rede ou artefato de desenvolvimento é introduzido.

## Testes previstos

- Mundo: classificação determinística e ausência de folhas frágeis na abertura.
- Simulação: ativação no primeiro pouso, rebote único, perda de colisão e expiração da animação.
- Renderização: paleta escura, rachaduras e deslocamento visual durante a queda.
- Regressão: suíte completa, auditoria abaixo de 8 MB e verificação de diff.
