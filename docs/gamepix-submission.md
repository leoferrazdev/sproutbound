# GamePix — Sproutbound

## Decisão de build

O GamePix recebe o build-base offline do Sproutbound. Não será criada uma variante com SDK, anúncios ou requests externos: o pacote já contém `index.html` na raiz, caminhos relativos e os mesmos arquivos que foram auditados para o MVP.

Artefato definido:

- `submission/sproutbound-basic-launch.zip`
- Próxima release de qualidade: `submission/sproutbound-quality-0.2.0.zip`

O pacote não deve incluir `submission/`, fontes do projeto, notas internas, credenciais ou ferramentas de desenvolvimento. O mesmo build jogável pode ser distribuído em diferentes portais; apenas metadados, capas, checklist e integrações autorizadas permanecem específicos de cada plataforma.

## Metadados definidos no portal

- Título: `Sproutbound`
- Main tag: `Arcade games`
- Tags adicionais: `Jumping games`, `Platformer games`, `Skill games`, `Casual games`

## Autoria e estado do cadastro

O formulário GamePix exige uma descrição original entre 100 e 500 caracteres e informa expressamente que não aceita texto gerado por IA nem cópia de outros sites. A descrição foi reescrita pelo responsável pelo projeto e salva no portal; o agente não a apresenta como texto autoral próprio.

O registro `my.gamepix.com/games/sproutbound` foi criado, o portal liberou a etapa `Submit for Review` e o envio foi concluído. O cabeçalho passou para `New release REVIEW`; aprovação e publicação continuam pendentes da análise da GamePix.

## Checklist operacional

- [x] Conta GamePix autenticada.
- [x] Título definido.
- [x] Categoria principal definida.
- [x] Quatro tags específicas definidas.
- [x] Build-base offline existente e separado das variantes de plataforma.
- [x] Descrição autoral de 100–500 caracteres.
- [x] Criar o registro no portal.
- [x] Upload do ZIP do build-base.
- [x] Preencher capas, orientação, controles e demais metadados solicitados.
- [ ] Executar o preview/QA disponível no portal.
- [x] Confirmar e submeter para revisão.

## Resultado do envio

- Estado observado no portal: `New release REVIEW`.
- Data do envio: 2026-08-24.
- Aprovação, publicação e métricas de jogadores reais: pendentes.

## Verificações antes do upload

```powershell
cd D:\LEONARDO\Games\sproutbound
npm test
npm run check:build
tar -tf submission\sproutbound-basic-launch.zip
```

O resultado esperado é uma suíte verde, auditoria sem URL externa ou `console.log`, bundle inicial abaixo de 8 MB e `index.html` na raiz do ZIP.

## Relação com outras plataformas

O perfil GamePix segue [[02 - Conhecimento/Diretrizes/Diretrizes multiplataforma para jogos de navegador]] e [[02 - Conhecimento/Manuais/Manual Operacional de Validação, Distribuição e Lançamento de Jogos para Plataformas de Navegador]]. O status do portal é separado dos resultados de CrazyGames e GameDistribution; aprovação, preview, distribuição e métricas reais não devem ser inferidos a partir de outro portal.
