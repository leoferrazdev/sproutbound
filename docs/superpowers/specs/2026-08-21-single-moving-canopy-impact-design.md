# Copa móvel única por faixa e impacto de copa fixa

## Contexto

O Sproutbound já diferencia copas rachadas e copas móveis após 30 m. A geração atual, porém, mantém uma copa fixa e adiciona uma copa móvel na mesma faixa. Isso cria uma composição visual mais carregada e não comunica com clareza que a faixa móvel representa uma única opção de pouso.

Além disso, a colisão com uma copa fixa é apenas física: a copa não reage visualmente ao peso do Pip. O jogador deve perceber o contato sem que a animação altere a altura lógica da superfície ou a física do salto.

## Decisão

- Faixas normais continuam com uma única copa `leaf` fixa.
- Até 30 m continuam existindo apenas copas `leaf` fixas.
- Faixas especiais de copa rachada continuam com duas opções: uma `leaf` fixa e uma `cracked-leaf` alternativa.
- Faixas especiais de copa móvel passam a ter somente uma `moving-leaf`; a copa fixa primária não será criada nessa faixa.
- A copa móvel será criada a partir da rota principal da faixa, com amplitude lateral moderada e parâmetros determinísticos. A próxima faixa continuará tomando essa copa única como referência de progressão.
- Ao pousar em uma copa `leaf` fixa, a superfície receberá um impacto visual curto: descerá levemente e retornará à posição original por aproximadamente 180 ms.
- O impacto será apenas visual. A coordenada `platform.y` usada pela colisão não mudará, o rebote continuará com a mesma velocidade e a copa não perderá sua função.
- Copas `cracked-leaf` manterão seu balançar, queda, transparência e desaparecimento já existentes.
- O renderer continuará consumindo o snapshot da simulação; não haverá física duplicada no desenho.

## Regras de dados

Cada entidade `platform` continuará identificada por `row`.

- Faixa móvel: exatamente uma plataforma na faixa e `kind === 'moving-leaf'`.
- Faixa rachada: pelo menos uma `leaf` e uma `cracked-leaf` na mesma faixa.
- Faixa inicial: somente `leaf`.
- Impacto de copa fixa: `impactTime` começa em `0.18` segundos após aterrissagem e é reduzido pela simulação até `0`.

## Critérios de aceitação

1. Uma faixa com `moving-leaf` nunca contém simultaneamente uma `leaf` fixa.
2. Uma faixa com `cracked-leaf` continua oferecendo uma `leaf` fixa segura.
3. O mesmo seed produz os mesmos tipos, posições e parâmetros de movimento.
4. A colisão com uma copa móvel usa a posição lateral atualizada da copa.
5. Uma aterrissagem em `leaf` produz `impactTime > 0` sem alterar `platform.y`.
6. O renderer desloca visualmente a copa fixa durante o impacto e volta ao plano normal após o tempo expirar.
7. A rota inicial, o colapso de copas rachadas, gotas móveis, altura, recorde e lifecycle permanecem funcionando.
8. Testes, auditoria de build e verificação de diff passam sem requests externos, `console.log` ou aumento indevido do bundle.

## Fora de escopo

- Não alterar a amplitude, velocidade ou regra de desbloqueio das gotas de sol.
- Não criar uma segunda copa móvel na mesma faixa.
- Não adicionar partículas, áudio ou novos assets.
- Não alterar armazenamento ou lifecycle das plataformas.
