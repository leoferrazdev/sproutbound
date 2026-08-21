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
| Aterrissagem | Alcançar uma folha | Pip rebate automaticamente e a altura sobe. |
| Game Over | Colidir com espinho ou cair | Lifecycle para uma vez; tela informa altura, recorde e próximo desbloqueio. |
| Restart | Clicar em `Jogar novamente` | Volta a Ready; a nova rodada espera o próximo input físico. |
| Landscape | Redimensionar para paisagem | Stage 9:16 centralizado, sem esticar o mundo. |
| Teclado | Tab até o botão e ativar com Enter/Space | Botão tem foco visível e reinicia somente pela ação explícita. |
| Storage bloqueado | Simular `getItem`/`setItem`/`removeItem` lançando erro | A partida continua jogável. |
| Performance | Observar uma viewport DPR 1 por 60 s | Sem crescimento contínuo de listeners e sem travamento ao ocultar a aba. |

## Critério de passagem do MVP

O MVP está tecnicamente pronto para uma rodada de playtest quando todos os testes automatizados passam, a auditoria permanece abaixo de 8 MB e os cenários visuais acima são observados sem bloqueio de input ou perda de legibilidade.
