---
title: Sproutbound - Salto ao Sol - Design
kind: design-spec
status: review
created: 2026-08-21
updated: 2026-08-21
project: Sproutbound
tags:
  - games/sproutbound
  - games/design
  - games/portrait
---

# Sproutbound - Salto ao Sol

## Estado da decisão

As seções de temática, core loop, curva inicial e arquitetura foram aprovadas. Esta especificação consolida as decisões para revisão escrita antes do plano de implementação.

## Objetivo

Construir um MVP de jogo arcade vertical para navegador, inspirado na estrutura observada nos screenshots de referência: personagem que sobe por plataformas, evita obstáculos, acumula altura e reinicia rapidamente após Game Over.

O projeto será independente do Neon Dodge e usará um build-base offline, leve e neutro em relação a portais.

## Referência e regra 80/20

### 80% preservados

- gameplay vertical de ascensão;
- personagem saltando entre plataformas;
- plataformas distribuídas em diferentes alturas;
- obstáculos letais claramente identificáveis;
- pontuação baseada na altura alcançada;
- dificuldade progressiva;
- recompensa colecionável;
- tela de Game Over;
- reinício rápido;
- recorde e ranking como objetivos posteriores.

### 20% diferenciadores

- personagem original em forma de broto, sem foto real;
- folhas como plataformas;
- espinhos e vinhas como perigo;
- gotas de sol como recompensa;
- crescimento visual do personagem;
- árvore gigante como mundo vertical;
- transições de ambiente e amplitude visual por paralaxe.

Preservar a estrutura não significa reproduzir personagens, nomes, imagens, textos, sons, código ou elementos protegidos da referência.

## Temática

O título de trabalho é **Salto ao Sol** e o slug técnico provisório é `sproutbound`.

O jogador controla Pip, um pequeno broto vivo que sobe por uma árvore gigantesca para alcançar a luz do sol e florescer.

### Personagem

Pip terá corpo vegetal antropomórfico, olhos, braços e pernas. Sua evolução será somente visual:

1. broto inicial;
2. broto com duas folhas;
3. pequena flor;
4. planta luminosa.

Nenhuma transformação fornecerá vantagem mecânica no MVP.

### Plataformas

- folha verde: plataforma segura do protótipo;
- folha dourada: variação futura de recompensa;
- folha azul: variação futura temporária;
- folha seca: variação futura que desaparece após o pouso.

O primeiro protótipo usará somente folhas verdes para manter a leitura do loop.

### Obstáculos

O perigo inicial será composto por espinhos fixos, com silhueta e cor contrastantes. Vinhas pontiagudas, galhos quebrados e flores carnívoras ficam reservados para iterações posteriores.

### Recompensa

As gotas de sol substituem o fogo da referência. Elas são coletáveis, preenchem um medidor de florescimento e ajudam a antecipar o próximo marco sem alterar a física do jogo.

### Mundo

O percurso poderá evoluir por camadas:

1. raízes e chão da floresta;
2. tronco gigante;
3. copa das árvores;
4. jardim nas nuvens;
5. santuário do sol.

O MVP começa pela camada de raízes e tronco. A sensação de mundo amplo será produzida com paralaxe, silhuetas, galhos, nuvens, elementos em primeiro plano e landmarks leves, sem mundo aberto e sem assets pesados.

## Core loop

O jogador move Pip horizontalmente, realiza saltos automáticos, pousa em folhas, evita espinhos, coleta gotas de sol e tenta alcançar uma altura maior antes de cair ou colidir.

Fluxo:

`mover -> pousar -> subir -> receber altura -> escolher o próximo pouso -> evitar perigo -> repetir`

O salto será automático após pousos válidos. Touch, mouse e teclado serão suportados quando a mecânica estiver implementada.

### Falha

Pip perde a rodada ao tocar em espinhos ou cair abaixo da área jogável. A tela de Game Over mostra a altura, o recorde, o próximo desbloqueio e a ação de reinício.

### Curva inicial

- 0-15 m: folhas largas, sem espinhos e saltos previsíveis;
- 15-40 m: folhas menores e alternância horizontal;
- 40-80 m: espinhos fixos, sempre legíveis antes do salto;
- acima de 80 m: maior variação de distância e ritmo.

O primeiro desbloqueio deve ocorrer durante a primeira sessão, sem exigir uma partida longa.

## Progressão e retorno

Meta loop:

`jogar -> alcançar altura -> coletar gotas -> desbloquear transformação -> salvar -> tentar subir mais`

O progresso será local, cosmético e tolerante à indisponibilidade do armazenamento. A ausência de `localStorage` não poderá congelar ou impedir o gameplay.

O primeiro MVP terá um desbloqueio visual simples. A árvore de personagens, múltiplos mundos, coleção extensa e ranking online ficarão para ciclos posteriores, depois de validar compreensão, diversão e repetição.

## Arquitetura técnica

### Projeto e build

- pasta: `D:\LEONARDO\Games\sproutbound`;
- repositório previsto: `leoferrazdev/sproutbound`;
- HTML5, JavaScript e Canvas/WebGL local;
- build-base `base-offline`;
- zero requests externos no build-base;
- nenhuma biblioteca, fonte, analytics ou anúncio de CDN;
- bundle inicial inferior a 8 MB.

### Módulos

- `src/game.js`: máquina de estados e ciclo principal;
- `src/world.js`: plataformas, câmera e cenário;
- `src/player.js`: Pip, física e colisão;
- `src/progression.js`: altura, gotas, marcos e desbloqueios;
- `src/input.js`: toque, mouse e teclado;
- `src/storage.js`: persistência protegida;
- `src/platform-adapter.js`: contrato neutro para integrações futuras.

### Orientação

O gameplay será nativo em portrait, aproximadamente 9:16. Em landscape e desktop, o quadro vertical será centralizado e preservado, sem esticar a cena. As laterais poderão exibir cenário, altura, objetivo e recorde, mas nenhuma informação essencial dependerá delas.

O código será preparado para suporte a ambas as orientações; a declaração final de orientação de cada portal dependerá do QA correspondente.

### Plataforma

O gameplay não conhecerá APIs da Poki ou da CrazyGames. O adaptador neutro deverá expor contratos para:

- iniciar gameplay;
- interromper gameplay;
- pausar e retomar input;
- solicitar pausa comercial;
- salvar progresso.

SDKs, anúncios e analytics reais somente serão adicionados em perfis separados de publicação, depois da validação do build-base.

## Assets e identidade

Pip, folhas, espinhos, gotas de sol e cenário serão desenhados com formas locais leves, Canvas/WebGL ou SVG local. Não serão reutilizadas as fotos, screenshots ou elementos visuais da referência como assets do jogo.

## Tratamento de falhas

- armazenamento local envolvido em `try/catch`;
- fallback para progresso em memória;
- jogo continua jogável sem persistência;
- ausência de áudio não bloqueia o loop;
- erro de integração de plataforma não bloqueia o build-base;
- colisões e física independem de taxa de atualização por meio de delta time limitado;
- pausas e retomadas não duplicam eventos nem acumulam loops de animação.

## Validação

### Critérios funcionais

- primeira ação compreensível;
- movimento horizontal responsivo;
- salto automático consistente;
- pouso em folhas detectado corretamente;
- espinhos eliminam o jogador;
- gotas de sol são coletadas;
- altura e recorde são atualizados;
- Game Over e reinício funcionam;
- desbloqueio visual aparece no marco;
- persistência falha com segurança.

### Critérios de plataforma

- portrait em mobile;
- landscape em mobile;
- desktop em viewport 16:9;
- touch, mouse e teclado;
- safe areas;
- sem requests externos;
- bundle inicial abaixo de 8 MB;
- texto preparado para localização;
- nenhuma dependência de login ou anúncio no protótipo.

### Ordem de validação

1. bugs, input e carregamento;
2. clareza do primeiro toque;
3. integridade do core loop;
4. justiça da dificuldade;
5. satisfação e feedback;
6. progressão e persistência;
7. adaptação de plataforma;
8. polimento e submissão.

## Fora do escopo inicial

- multiplayer;
- ranking online;
- conta de usuário;
- loja ou moeda premium;
- anúncios;
- SDK real de portal;
- múltiplos personagens jogáveis;
- cinco mundos completos;
- habilidades com vantagem competitiva;
- narrativa longa ou cutscenes.

## Fontes de decisão

- [[02 - Conhecimento/Manuais/Manual Operacional para Jogos de Navegador]]
- [[02 - Conhecimento/Diretrizes/Diretriz de referências 80-20 e escala de mundo]]
- [[02 - Conhecimento/Diretrizes/Diretrizes multiplataforma para jogos de navegador]]
- screenshots de referência em `D:\LEONARDO\Leo Ferraz\jogos\01`
