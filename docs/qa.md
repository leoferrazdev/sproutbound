# Matriz de QA — Sproutbound

## Automatizado

- [x] `npm test`: modelo, mundo determinístico, física, input, renderer, progressão, storage, UI, lifecycle e auditoria.
- [x] `npm run check:build`: sem URL externa, sem `console.log`, total abaixo de 8 MB.
- [x] Primeira plataforma segura e primeiros segmentos sem espinhos.
- [x] `localStorage` ausente, malformado ou bloqueado não interrompe o runtime.
- [x] Start/stop da camada de plataforma são idempotentes.

## Manual no navegador local

Servir a raiz do projeto com `python -m http.server 8080` e testar em `http://localhost:8080`.

| Cenário | Ação | Resultado esperado |
|---|---|---|
| Ready portrait | Abrir em viewport móvel portrait | Pip, HUD e instrução ficam legíveis; o cartão Ready não bloqueia o primeiro toque. |
| Primeiro input | Tocar à esquerda/direita ou pressionar A/D | A rodada começa; nenhum clique em texto/menu inicia por acidente. |
| Steering | Alternar lados durante a queda | Pip acompanha os dois lados sem sair do palco. |
| Aterrissagem | Alcançar uma folha | Pip rebate automaticamente; a altura reflete a posição vertical máxima, não a quantidade de pulos. |
| Gota de sol | Cruzar uma gota com Pip | A gota desaparece, o contador `Luz solar` aumenta uma unidade e a mesma gota não é contada novamente. |
| Subida longa | Continuar após a primeira tela | Ainda existem plataformas válidas; espinhos aparecem somente após a faixa inicial segura. |
| Copa rachada | Alcançar uma folha escura e rachada | A copa balança, começa a cair e não aceita um segundo pouso. |
| Queda da copa | Observar a copa rachada por cerca de meio segundo | A copa desce, perde opacidade e desaparece sem interromper o rebote do Pip. |
| Rota segura após 30 m | Alcançar uma faixa com copa especial | A faixa oferece uma copa verde fixa além da alternativa rachada ou móvel. |
| Copa móvel | Observar uma copa especial posterior a 30 m | A copa oscila lateralmente dentro do palco e a colisão acompanha o movimento. |
| Gota móvel | Tentar coletar uma gota posterior a 30 m | A gota oscila lateralmente e é coletada na posição em que aparece. |
| Game Over | Colidir com espinho ou cair | Lifecycle para uma vez; tela informa altura, recorde e próximo desbloqueio. |
| Restart | Clicar em `Jogar novamente` | Volta a Ready; a nova rodada espera o próximo input físico. |
| Landscape | Redimensionar para paisagem | Stage 9:16 centralizado, sem esticar o mundo. |
| Teclado | Tab até o botão e ativar com Enter/Space | Botão tem foco visível e reinicia somente pela ação explícita. |
| Storage bloqueado | Simular `getItem`/`setItem`/`removeItem` lançando erro | A partida continua jogável. |
| Performance | Observar uma viewport DPR 1 por 60 s | Sem crescimento contínuo de listeners e sem travamento ao ocultar a aba. |

## Critério de passagem do MVP

O MVP está tecnicamente pronto para uma rodada de playtest quando todos os testes automatizados passam, a auditoria permanece abaixo de 8 MB e os cenários visuais acima são observados sem bloqueio de input ou perda de legibilidade.
