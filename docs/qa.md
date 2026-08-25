# Matriz de QA — Sproutbound

The release language baseline is English. When the browser locale starts with `pt-`, the game keeps the Portuguese experience; unsupported locales fall back to English.

## Automatizado

- [x] `npm test`: modelo, mundo determinístico, física, input, renderer, progressão, storage, UI, lifecycle e auditoria.
- [x] A suíte final da release `0.2.0-quality` cobre 69 testes automatizados.
- [x] `npm run check:build`: sem URL externa, sem `console.log`, total abaixo de 8 MB.
- [x] Primeira plataforma segura e primeiros segmentos sem espinhos.
- [x] `localStorage` ausente, malformado ou bloqueado não interrompe o runtime.
- [x] Start/stop da camada de plataforma são idempotentes.

## Manual no navegador local

Servir a raiz do projeto com `python -m http.server 8080` e testar em `http://localhost:8080`.

| Cenário | Ação | Resultado esperado |
|---|---|---|
| Ready portrait | Abrir em viewport móvel portrait | Pip, HUD e instrução ficam legíveis; o cartão Ready não bloqueia o primeiro toque. |
| Primeiro input | Tocar à esquerda/direita ou pressionar A/D, Q/Z ou setas | A rodada começa; nenhum clique em texto/menu inicia por acidente. |
| Steering | Alternar lados durante a queda | Pip acompanha os dois lados sem sair do palco. |
| Aterrissagem | Alcançar uma folha | Pip rebate automaticamente; a altura reflete a posição vertical máxima, não a quantidade de pulos. |
| Gota de sol | Cruzar uma gota com Pip | A gota desaparece, o contador `Luz solar` aumenta uma unidade e a mesma gota não é contada novamente. |
| Escudo solar | Coletar cinco gotas na mesma rodada | A carga chega a 5/5, o HUD informa que o escudo está pronto e Pip recebe um pulso visual/sonoro. |
| Subida longa | Continuar após a primeira tela | Ainda existem plataformas válidas; espinhos aparecem somente após a faixa inicial segura. |
| Copa rachada | Alcançar uma folha escura e rachada | A copa balança, começa a cair e não aceita um segundo pouso. |
| Queda da copa | Observar a copa rachada por cerca de meio segundo | A copa desce, perde opacidade e desaparece sem interromper o rebote do Pip. |
| Rota após 30 m | Alcançar uma faixa especial rachada e uma faixa móvel | A faixa rachada oferece uma copa verde fixa além da rachada; a faixa móvel apresenta somente uma copa móvel. |
| Impacto da copa fixa | Pousar em uma copa verde normal | A copa desce levemente e retorna sem alterar o rebote ou o plano de colisão. |
| Copa com espinhos | Alcançar uma faixa perigosa após 30 m | A faixa contém uma copa segura e uma copa escura com espinhos; tocar a copa perigosa encerra a rodada. |
| Escudo contra espinhos | Colidir com a copa perigosa com o escudo pronto | O escudo é consumido uma única vez, Pip é relançado e a rodada continua; uma segunda colisão encerra a rodada. |
| Rota móvel preservada | Alcançar uma faixa móvel | A faixa móvel continua contendo somente uma copa móvel, sem copa perigosa adicional. |
| Copa móvel | Observar uma copa especial posterior a 30 m | A copa oscila lateralmente dentro do palco e a colisão acompanha o movimento. |
| Gota móvel | Tentar coletar uma gota posterior a 30 m | A gota oscila lateralmente e é coletada na posição em que aparece. |
| Progressão visual | Reabrir o jogo após alcançar 10 m, 25 m ou 60 m | Pip reaparece com o visual persistente do maior marco desbloqueado. |
| Cume | Alcançar a altura máxima da rota | A partida congela em `Cume alcançado`, mostra a recompensa `Coroa do cume` e para o gameplay uma vez. |
| Cume persistente | Alcançar o cume e iniciar uma nova rodada | A recompensa permanece desbloqueada quando o storage está disponível; falha de storage não congela o jogo. |
| Game Over | Tocar uma copa com espinhos ou cair | Lifecycle para uma vez; tela informa altura, recorde e próximo desbloqueio. |
| Restart | Clicar em `Jogar novamente` | Volta a Ready; a nova rodada espera o próximo input físico. |
| Landscape | Redimensionar para paisagem | Stage 9:16 centralizado, sem esticar o mundo. |
| Guia desktop | Abrir em landscape largo | Painel lateral explica objetivo, escudo e cume sem duplicar nem cobrir o HUD. |
| Teclado | Tab até o canvas ou botão e ativar com Enter/Space | Canvas recebe foco; controles Q/Z, A/D e setas funcionam; botão tem foco visível e reinicia somente pela ação explícita. |
| Áudio | Jogar após o primeiro input e simular pausa de plataforma | Feedback sintetizado é local, inicializa sob interação e fica mudo durante pausa/anúncio. |
| Storage bloqueado | Simular `getItem`/`setItem`/`removeItem` lançando erro | A partida continua jogável. |
| Performance | Observar uma viewport DPR 1 por 60 s | Sem crescimento contínuo de listeners e sem travamento ao ocultar a aba. |

## Critério de passagem da release `0.2.0-quality`

A release está tecnicamente pronta para uma nova rodada de validação quando todos os 69 testes automatizados passam, a auditoria permanece abaixo de 8 MB e os cenários visuais acima são observados sem bloqueio de input, perda de legibilidade ou regressão no fluxo solar.
