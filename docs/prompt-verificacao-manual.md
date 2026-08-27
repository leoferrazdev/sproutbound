# Prompt para verificação dos itens manuais do gate — rodada 2

Substitui a versão de 2026-08-26. Mudanças em relação à primeira rodada:

- O commit **não vem escrito no prompt**. O agente deriva de `git rev-parse HEAD` e exige
  árvore limpa. A rodada 1 mediu com o código do gate fora do commit, e qualquer commit
  posterior teria jogado fora a evidência.
- `desktop-occupancy` **entra de novo**, mesmo tendo passado. Ele passou contra `33ff560`;
  o commit vai mudar.
- `fps-stable-10min` usa `tools/measure-runtime.html`, que se recusa a reportar leitura
  estrangulada. A rodada 1 devolveu 1 fps numa sessão que concluiu uma rota em 60,5 s.
- `console-clean-10min` passa a exigir **explicitamente** que uma morte ocorra. A rodada 1
  rodou 607 s sem nenhum `game over`, deixando o caminho de morte sem cobertura.
- `playtest-five-strangers` saiu da lista. Ver a última seção.

---

## Prompt (copiar tudo abaixo da linha)

---

Você vai executar quatro verificações manuais de um release gate e devolver as medições.

**Projeto:** `D:\LEONARDO\Games\sproutbound`

### Regra que domina todas as outras

Este gate existe porque um jogo foi submetido duas vezes com itens marcados sem terem sido
executados, e foi recusado nas duas. **Um item que você não conseguiu executar é `false`,
com o motivo escrito.** Reprovar é resultado útil; inventar destrói o gate inteiro.

Na rodada anterior, o instrumento de fps devolveu "1 fps" para um jogo que, na mesma
sessão, concluiu uma fase de plataforma em 60,5 segundos. Os dois fatos não cabem juntos.
**Quando dois números seus se contradizem, o instrumento está errado — reporte a
contradição, não escolha um dos dois.**

Não relate número que você não mediu.

### Passo 0 — congelar o alvo

Antes de qualquer medição:

```bash
cd /d/LEONARDO/Games/sproutbound && git status --porcelain && git rev-parse HEAD
```

- Se `git status --porcelain` devolver **qualquer linha**, **pare**. Medir uma árvore suja
  produz evidência que morre no primeiro commit. Relate que a árvore está suja e liste o
  que apareceu.
- Guarde o hash de 40 caracteres. Ele vai em todos os campos `commit`. Nunca abrevie: o
  gate compara por igualdade estrita, e a mensagem de erro exibe os dois lados abreviados,
  então um hash curto reprova exibindo dois valores aparentemente idênticos.

Confirme também que os pacotes estão em dia:

```bash
node tools/check-gate.mjs
```

`PKG-1` precisa passar. Se reprovar, rode `npm run build:all` **no PowerShell** — sob Git
Bash o empacotador falha, porque delega ao `tar` do sistema, que lê `D:` como host remoto.

### Preparo do ambiente

Servidor local na raiz, aba **visível e em primeiro plano** o tempo todo. O jogo usa ES
modules, então `file://` não funciona, e o navegador estrangula `requestAnimationFrame` em
aba de fundo — foi exatamente isso que corrompeu a medição anterior.

```bash
python -m http.server 8080 --bind 127.0.0.1
```

Abra `http://localhost:8080`. Limpe `localStorage` antes de cada sessão de medição.

### Item 1 — `console-clean-10min`

Sessão contínua de **10 minutos**, com o console aberto, em **Chrome e em Edge**. Registre
a versão de cada um. Se um dos dois for indisponível, o item é `false` — não é "passou no
Chrome".

O roteiro precisa cobrir estes caminhos, e você deve confirmar um a um que cada um ocorreu:

1. Concluir pelo menos duas rotas.
2. **Morrer pelo menos uma vez** e ver a tela de fim de partida. A rodada anterior rodou
   607 segundos sem nenhuma morte, então o caminho de `game over` nunca passou pelo
   console. Se não conseguir morrer jogando, entre numa rota com espinhos e colida de
   propósito.
3. Pausar e despausar, pelo botão e pela tecla `P`.
4. Sair da aba e voltar, para exercitar a pausa por perda de foco.
5. Alternar o mute e recarregar a página, para exercitar a persistência.
6. Voltar ao menu de rotas e entrar em outra.
7. Trocar de bioma, para exercitar a transição de paleta.

Critério: **zero erro** e zero aviso relevante. Aviso de extensão do navegador ou de favicon
não conta; qualquer coisa emitida por `src/` conta.

Relate por navegador: versão, duração em ms, contagem de erros, contagem de avisos, o texto
integral de cada ocorrência, e **quais dos sete caminhos acima foram exercitados**.

### Item 2 — `fps-stable-10min`

Use o instrumento do projeto, não o painel de performance:

1. Abra `http://localhost:8080/tools/measure-runtime.html`.
2. Clique em **Iniciar medição de 10 minutos**.
3. Jogue dentro do quadro à esquerda por 10 minutos. **Não troque de aba.**

O jogo roda num iframe de mesma origem e o medidor lê o `requestAnimationFrame` **da janela
do jogo**, não da página do medidor. A saída aparece na própria página, com um bloco JSON
pronto para copiar.

Se aparecer `MEDIÇÃO INVÁLIDA`, a página lista o motivo — registre o item como `false` com
esse motivo e **não** tente contornar a guarda. As guardas existem porque a leitura anterior
era fisicamente impossível.

Ele recusa a leitura se: a aba ficou oculta, a sessão não chegou a 570 s, houve menos de 20
amostras, o fps máximo não passou de 50, ou `performance.memory` não existe.

Relate a saída literal da página, incluindo o caso inválido.

> **Se você dirige um navegador automatizado, headless ou em segundo plano, este item é
> estruturalmente impossível para você.** Verificado em 2026-08-26: num pane automatizado,
> `document.visibilityState` é `hidden` e `requestAnimationFrame` registrou **0 quadros em
> 4011 ms** — não é lentidão, é ausência total de quadros. Foi daí que saiu o "1 fps" da
> rodada anterior.
>
> Nesse caso, o resultado correto e completo é:
> `pass: false`, `notes: "navegador automatizado; visibilityState hidden, rAF não executa.
> Item exige janela real em primeiro plano."` Isso não é falha sua. Não tente compensar com
> `setTimeout`, com o painel de performance, nem com estimativa — nenhum deles mede o que o
> item pede, e um número inventado aqui é pior que nenhum.

### Item 3 — `desktop-occupancy`

Passou na rodada anterior, mas contra outro commit. Refaça.

Com a viewport em `1280×720` e depois em `1920×1080`:

```js
const c = document.querySelector('#game-canvas');
const b = document.querySelector('#backdrop-canvas');
const r = c.getBoundingClientRect();
const rb = b?.getBoundingClientRect();
JSON.stringify({
  viewport: [innerWidth, innerHeight],
  jogo: [Math.round(r.width), Math.round(r.height)],
  fundo: rb ? [Math.round(rb.width), Math.round(rb.height)] : null,
  ocupacaoLargura: +(r.width / innerWidth).toFixed(3),
  razaoPalco: +(r.width / r.height).toFixed(3),
  fundoCobreViewport: rb ? (rb.width >= innerWidth - 1 && rb.height >= innerHeight - 1) : false,
  bufferJogo: [c.width, c.height],
}, null, 1);
```

O que precisa ser verdade, e o que **não** é defeito:

- `fundoCobreViewport` precisa ser `true`. O fundo é que cobre a janela.
- `razaoPalco` precisa ficar em `0,75`. O palco é 3:4 por projeto.
- `ocupacaoLargura` em torno de `0,42` é **correto**. O palco não deve ocupar a largura
  toda; quem cobre é o fundo.
- `bufferJogo` igual a `[300, 150]` é reprovação imediata: significa que o canvas nunca foi
  dimensionado e o jogo desenha no lugar errado. Já aconteceu neste projeto.

Faça uma captura em cada resolução e descreva o que aparece nas laterais do palco.

### Item 4 — `preview-tool`

Preview Tool da CrazyGames com `submission/sproutbound-quality-0.2.0-crazygames.zip`.

Na rodada anterior a ferramenta exibiu `This build has already been sent to QA` e
`Updating QA checks is disabled in Preview. Submit a game update to proceed.` — ou seja,
carregou um build já enviado antes, e nem chegou a avaliar o pacote local.

Portanto: **antes de medir, confirme que o Preview está servindo o pacote atual.** Se a
ferramenta continuar exibindo aquelas mensagens, o item é `false` com o motivo
"Preview serve build anterior; exige submeter atualização primeiro", e isso é um resultado
correto, não uma falha sua.

Se você não tiver acesso autenticado, `false` com esse motivo. Não crie conta, não use
credenciais, e não submeta nada ao QA — submeter é decisão de quem roda o gate, não sua.

Relate cada apontamento com texto integral, e se o jogo chegou ao gameplay.

### Formato da resposta

Antes do JSON, escreva os números brutos de cada item, para que a medição possa ser
conferida sem confiar no seu veredito.

Termine com este bloco, com `<HASH>` substituído pelo hash de 40 caracteres do passo 0:

```json
{
  "console-clean-10min": { "pass": false, "date": "AAAA-MM-DD", "browser": "", "commit": "<HASH>", "notes": "" },
  "fps-stable-10min":    { "pass": false, "date": "AAAA-MM-DD", "browser": "", "commit": "<HASH>", "notes": "" },
  "desktop-occupancy":   { "pass": false, "date": "AAAA-MM-DD", "browser": "", "commit": "<HASH>", "notes": "" },
  "preview-tool":        { "pass": false, "date": "AAAA-MM-DD", "browser": "", "commit": "<HASH>", "notes": "" }
}
```

### Registro no cofre

Grave a medição como nota no cofre Obsidian:

**Caminho:** `D:\LEONARDO\Games\cofre-games\03 - Projetos\Sproutbound\04 - Validação\Verificação manual do gate - <hash curto>.md`

Existe uma nota da rodada anterior, `Verificação manual do gate - 33ff560.md`. **Não a
altere.** Ela é o registro de outro commit e o histórico entre rodadas é o que mostra o que
mudou.

Frontmatter obrigatório:

```yaml
---
title: Verificação manual do gate - <hash curto>
kind: validation
scope: project
project: sproutbound
domain: games
platform: crazygames
status: active
created: AAAA-MM-DD
updated: AAAA-MM-DD
tags:
  - games/projetos/sproutbound
  - games/crazygames
  - games/validação
  - games/qualidade
---
```

Corpo, nesta ordem:

1. O commit medido, 40 caracteres, e a data.
2. Tabela dos quatro itens: item, veredito, e **o número que sustenta o veredito** — nunca
   a palavra "ok". Console mostra contagem por navegador; fps mostra mínimo, mediana e
   tendência de heap; ocupação mostra os retângulos nas duas resoluções.
3. Seção **"O que reprovou e por quê"**. Se nada reprovou, escreva "nada reprovou" — não
   omita a seção.
4. Seção **"Limitações desta medição"**: o que não foi executado, por quê, e o que
   precisaria para executar.
5. Seção **"Comparação com a rodada anterior"**, com link `[[Verificação manual do gate - 33ff560]]`.
6. O bloco JSON.
7. Referências: `[[Execução do backlog da segunda recusa]]`,
   `[[Padrão mínimo de produto para portais de jogos de navegador]]`.

Acrescente **uma linha** ao índice
`D:\LEONARDO\Games\cofre-games\03 - Projetos\Sproutbound\00 - Índice.md`, seção Validação.
Não reorganize o índice.

Não edite nenhuma outra nota, e não escreva `docs/gate-manual-evidence.json` — quem grava a
evidência é quem roda o gate.

---

## Sobre o quinto item

`playtest-five-strangers` não está neste prompt porque exige cinco pessoas fora do projeto,
e ficou decidido não fazer teste com pessoas.

Ele continua sendo item do gate. Enquanto estiver na lista e não executado, o gate nunca
sai com código 0, e a regra de bloqueio impede submissão. As únicas saídas honestas são
revogá-lo por escrito ou executá-lo — **não** marcá-lo como aprovado.

A revogação é defensável, e a razão está na separação de autoridades registrada em
[[Padrão mínimo de produto para portais de jogos de navegador]]: o playtest pertence à
autoridade de **desempenho**, não à de aprovação. Nenhuma exigência publicada pela
plataforma pede playtest externo. Abrir mão dele não muda a chance de ser aprovado — muda
apenas de onde virão os primeiros números de R.E.T.E.R.: do Basic Launch, com jogadores
reais e o painel da própria plataforma, em vez de cinco pessoas antes.

O custo real é que um problema de clareza ou de retenção só aparece depois de gastar os
primeiros plays, e corrigir depois custa mais do que corrigir antes.
