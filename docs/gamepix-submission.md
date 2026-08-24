# GamePix — Sproutbound

## Decisão de build

O GamePix recebe o build-base offline do Sproutbound. Não será criada uma variante com SDK, anúncios ou requests externos: o pacote já contém `index.html` na raiz, caminhos relativos e os mesmos arquivos que foram auditados para o MVP.

Artefato definido:

- `submission/sproutbound-basic-launch.zip`

O pacote não deve incluir `submission/`, fontes do projeto, notas internas, credenciais ou ferramentas de desenvolvimento. O mesmo build jogável pode ser distribuído em diferentes portais; apenas metadados, capas, checklist e integrações autorizadas permanecem específicos de cada plataforma.

## Metadados definidos no portal

- Título: `Sproutbound`
- Main tag: `Arcade games`
- Tags adicionais: `Jumping games`, `Platformer games`, `Skill games`, `Casual games`

## Bloqueio de cadastro

O formulário GamePix exige uma descrição original entre 100 e 500 caracteres e informa expressamente que não aceita texto gerado por IA nem cópia de outros sites. O título e as tags podem ser preparados autonomamente, mas a descrição não pode ser inventada ou apresentada como autoral pelo agente.

Enquanto esse campo não for preenchido com texto autoral, o botão `Create` permanece desabilitado e nenhum registro de jogo deve ser criado no portal.

## Checklist operacional

- [x] Conta GamePix autenticada.
- [x] Título definido.
- [x] Categoria principal definida.
- [x] Quatro tags específicas definidas.
- [x] Build-base offline existente e separado das variantes de plataforma.
- [ ] Descrição autoral de 100–500 caracteres.
- [ ] Criar o registro no portal.
- [ ] Upload do ZIP do build-base.
- [ ] Preencher capas, orientação, controles e demais metadados solicitados.
- [ ] Executar o preview/QA disponível no portal.
- [ ] Submeter para revisão.

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
