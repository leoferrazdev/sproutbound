# Sproutbound — Salto ao Sol

MVP vertical de arcade para navegador. Pip é um pequeno broto que salta automaticamente entre folhas, coleta gotas de sol e sobe até encontrar espinhos. A referência estrutural é um jogo de ascensão em retrato; os diferenciais são personagem próprio, progressão visual e tema de copa ensolarada.

## Rodar localmente

O projeto não usa dependências de runtime, CDN, fontes externas, analytics ou requests HTTP.

```powershell
cd D:\LEONARDO\Games\sproutbound
python -m http.server 8080
```

Abra `http://localhost:8080` no navegador. O uso de servidor local evita as restrições de módulos ES quando o arquivo é aberto diretamente.

## Controles

- Toque/clique na metade esquerda ou direita do palco: guia Pip.
- `A` / `←`: esquerda.
- `D` / `→`: direita.
- O primeiro input físico inicia a rodada.
- Após Game Over, somente `Jogar novamente` reinicia a rodada.

## Regras do MVP

- Stage lógico fixo de 360×640, proporção 9:16, contido em retrato e centralizado em paisagem.
- Folhas iniciais seguras e sem espinhos; o perigo aparece depois da leitura inicial.
- A altura é medida pelo ponto mais alto alcançado no mundo, em metros; pousos não são contados como pontos.
- Gotas de sol coletadas atualizam o contador de luz solar e são removidas da rodada uma única vez.
- O percurso inicial já contém uma rota extensa de plataformas; a dificuldade e os espinhos entram mais acima.
- Algumas folhas posteriores são rachadas: após o primeiro pouso, elas balançam, caem e deixam de existir como suporte.
- Até 30 m, as copas são verdes e fixas; depois desse marco, cada faixa especial mantém uma copa fixa segura ao lado da alternativa rachada ou móvel.
- Copas móveis e gotas de sol posteriores a 30 m oscilam lateralmente dentro do palco.
- Progresso usa `localStorage` apenas por meio de um adaptador com `try/catch`; falha de armazenamento não bloqueia o jogo.
- O adaptador de plataforma é neutro: lifecycle idempotente, sem `window.PokiSDK`, sem `fetch` e sem SDK externo no build-base.

## Validação

```powershell
npm test
npm run check:build
```

O build auditado rejeita URLs externas, `console.log` em arquivos de release e qualquer total acima de 8 MB. A rodada visual manual está documentada em [docs/qa.md](docs/qa.md).
