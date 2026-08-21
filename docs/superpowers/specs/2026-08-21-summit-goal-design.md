---
title: Sproutbound - Meta explícita de cume
kind: design-spec
status: approved-design-review-pending
created: 2026-08-21
project: sproutbound
---

# Meta explícita de cume

## Contexto

O mundo atual termina após 36 plataformas, com um teto observado próximo de 249 m. Sem um estado próprio, o jogador pode interpretar o fim da rota como uma queda ou como conteúdo incompleto. O cume deve ser uma meta compreensível, recompensadora e compatível com o lifecycle de plataformas.

## Decisão

- Derivar `summitHeight` na criação da rodada a partir da última plataforma gerada, com margem determinística de 1 m.
- Quando a altura atingir `summitHeight`, emitir `summitReached` uma única vez e mudar o estado da rodada para `summit`.
- O estado `summit` congela a simulação até o jogador reiniciar explicitamente.
- O cume não emitirá `playerDied` nem fará Pip rebater ou cair.
- A camada de plataforma receberá `gameplayStop()` ao evento `summitReached`, exatamente como no Game Over.
- A tela final reutilizará o cartão de encerramento, mas exibirá “Cume alcançado”, altura, recorde e recompensa desbloqueada.
- A recompensa persistente será `summit-crown`, adicionada à mesma lista de marcos visuais já validada pelo storage seguro.
- O marco `summit-crown` será exibido como próximo objetivo após o desbloqueio de 60 m e será salvo quando o cume for alcançado.
- O botão `Jogar novamente` continuará sendo a única forma de sair do estado final e seguirá usando o commercial break mock existente.

## Fluxo de estado

`ready → playing → summit → ready`

O fluxo de morte permanece separado:

`ready → playing → gameOver → ready`

O evento `summitReached` terá prioridade somente quando a rodada não tiver morrido na mesma atualização. Rodadas em `summit` não avançam física, movimento, coleta ou eventos duplicados.

## UI e acessibilidade

- O cartão final exibirá o título `Cume alcançado!`.
- A mensagem explicará que Pip concluiu a subida e identificará `Coroa do cume` como recompensa.
- A altura e o recorde continuarão visíveis.
- O botão de reinício existente permanecerá focável e acionável por teclado.
- O HUD anunciará `Cume alcançado` no estado final.

## Critérios de aceitação

1. `createRun()` expõe um `summitHeight` coerente com a última plataforma.
2. Atingir o cume emite `summitReached` uma vez e muda o estado para `summit`.
3. Uma rodada em `summit` permanece estável em chamadas posteriores de `stepRun`.
4. O cume não emite `playerDied` nem `landed` artificialmente.
5. `summit-crown` é desbloqueada e persistida com o adaptador seguro.
6. A UI mostra “Cume alcançado” e a recompensa sem quebrar Game Over ou Restart.
7. `gameplayStop()` continua idempotente e é acionado no cume.
8. A primeira rota, altura, espinhos, copas especiais, comercial break e auditoria de build permanecem funcionando.

## Fora de escopo

- Não aumentar ainda o número de plataformas.
- Não criar uma segunda região ou bioma.
- Não alterar a física de salto, a curva de obstáculos ou o limite de 249 m observado.
- Não adicionar anúncios reais, novos assets ou dependências externas.
