# Sproutbound — Campanha de rotas

## Decisão

O jogo deixa de ser uma corrida única de 249 m e passa a ser uma **campanha de 25 rotas
desenhadas**, distribuídas em 5 biomas, cada uma com objetivo próprio. Escolhido em
2026-08-26 sobre a alternativa de modo infinito, porque campanha entrega variedade real e é
o formato dominante na seção New games da plataforma.

Resolve o P0-1 do [[Diagnóstico da segunda recusa]], o único item que decide a aprovação:
o jogo hoje entrega 19,4 segundos de conteúdo.

## Consequência que reverte uma decisão anterior

O commit `5d72740` introduziu semente aleatória por partida para resolver o P0-2, mundo
idêntico a cada run. **Campanha desenhada é incompatível com isso, e por bom motivo:** uma
fase precisa ser a mesma toda vez que o jogador a repete, senão ela não pode ser desenhada
nem ter objetivo justo.

A variedade passa a vir de outro lugar:

| Antes | Agora |
| --- | --- |
| 1 rota, semente aleatória por partida | 25 rotas fixas, cada uma com semente própria |
| Variedade por aleatoriedade | Variedade por autoria |
| Repetir = mundo diferente | Repetir = mesma fase, tempo melhor |

O critério do gate muda junto: deixa de ser "cada partida gera um mundo diferente" e passa a
ser "a campanha contém pelo menos 20 rotas distintas, todas completáveis". A garantia de
alcançabilidade derivada da física, também do `5d72740`, **permanece** e passa a validar as
25 rotas em vez de sementes aleatórias.

## Modelo de dados

Uma rota é uma **receita autoral**, não um posicionamento manual de plataformas. Cada rota
declara bioma, semente, altura, sequência de segmentos, mistura de perigos e objetivo; a
geração determinística já existente produz o traçado a partir disso. Isso dá controle de
design sem exigir a colocação manual de milhares de folhas, e mantém tudo testável.

```
{
  id: 'canopy-3',
  biome: 'canopy',
  seed: 10403,
  height: 168,
  reachScale: 0.72,
  hazards: { cracked: true, moving: false, thorn: false },
  objective: { type: 'collect', value: 6 },
  order: 3
}
```

### Biomas

Cinco biomas, cinco rotas cada. Cada bioma declara paleta própria para fundo, folha, folha
rachada, folha móvel, espinho e gota solar, além da densidade de silhuetas de fundo.

| Bioma | Identidade | Rotas |
| --- | --- | --- |
| `canopy` | Copa diurna, verde e âmbar | 1 a 5 |
| `dusk` | Entardecer, laranja e violeta | 6 a 10 |
| `crystal` | Túnel de cristal, ciano e branco | 11 a 15 |
| `storm` | Tempestade, cinza e elétrico | 16 a 20 |
| `summit` | Alta altitude, ouro e céu profundo | 21 a 25 |

### Objetivos

Todos deriváveis dos eventos que a simulação já emite. **Nenhuma mecânica nova**, que é a
condição para o custo caber em três a quatro semanas.

| Tipo | Condição | Evento de origem |
| --- | --- | --- |
| `reach` | Alcançar o topo | `summitReached` |
| `collect` | Alcançar o topo com N gotas coletadas | `collectedSun` |
| `flawless` | Alcançar o topo sem tocar espinho | `hazardHit` |
| `swift` | Alcançar o topo abaixo de N segundos | tempo decorrido |
| `frugal` | Alcançar o topo sem gastar o escudo | `solarShieldUsed` |

Alcançar o topo **sempre** conclui a rota e libera a seguinte. O objetivo é uma segunda
camada opcional, que rende a estrela da rota. Isso evita bloquear o jogador num objetivo
difícil e preserva a progressão contínua.

## Progressão da campanha

- A rota 1 nasce liberada. Concluir a rota N libera a N+1.
- Cada rota guarda: concluída, objetivo cumprido, melhor tempo, maior número de gotas.
- Os marcos cosméticos de Pip passam a ser vinculados a **rotas concluídas**, não a metros,
  o que corrige o P1-3: hoje três dos quatro disparam nos primeiros 4,6 segundos.
- Persistência migra de `sproutbound.progress.v1` para `v2`, preservando o recorde de altura
  do jogador antigo como conclusão da primeira rota.

## Orçamento de conteúdo

Alturas escalam de 120 m na rota 1 a 400 m na rota 25, somando cerca de 6.200 m. A um ritmo
de aproximadamente 12,8 m/s para um agente perfeito e sem mortes, o piso teórico é de cerca
de 8 minutos. Jogadores reais, com mortes e repetições por objetivo, ficam bem acima disso.

O limiar do gate é 6 minutos. A medição passa a ser a **campanha inteira**, não uma partida.

## Invariantes

- Nenhuma mecânica nova: sem inimigos, sem armas, sem novos verbos de controle.
- Toda rota é completável pelo agente determinístico do gate.
- A folga entre linhas nunca ultrapassa o alcance lateral derivado da física.
- Cada rota é idêntica a cada repetição; a semente é da rota, não da partida.
- Nenhuma requisição de rede, nenhum asset externo.
- Falha de armazenamento não impede jogar; a campanha cai para memória.

## Fora de escopo desta especificação

- Renderização dos biomas, que é a fase seguinte.
- Tela de seleção de rota, que é a fase seguinte.
- Áudio, menu, pausa e paralaxe, que são itens P1 independentes.

## Critério de aceite

- 25 rotas declaradas, 5 por bioma, todas com objetivo.
- 100% das rotas completáveis pelo agente do gate.
- Soma do tempo do agente acima de 360 segundos.
- No máximo 2 marcos cosméticos no primeiro minuto de jogo.
- Migração de `v1` para `v2` preserva o progresso antigo.
- `npm test` e `npm run check:build` verdes; `npm run gate` avança nos itens P0-1 e P0-2.
