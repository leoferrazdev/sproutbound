# GameDistribution — Sproutbound

## Estado operacional

- Game: `Sproutbound`
- GameDistribution game ID: `8ccb967dc0be492c9be5fc5a95f32fd5`
- Registro do portal: `75315`
- Build-base offline: permanece sem SDK, anúncios, analytics ou requisições externas.
- Build da plataforma: usa o adaptador `src/platform-adapters/gamedistribution.js` e o SDK oficial apenas no pacote gerado.

## Checklist

- [x] Game record criado no GameDistribution.
- [x] Build HTML5 inicial enviado.
- [x] Thumbnails obrigatórios enviados.
- [x] Variante GameDistribution gerada localmente.
- [x] Novo ZIP da variante enviado ao portal em 24 Aug 2026.
- [x] SDK detectado como Yes.
- [x] Anúncio interstitial de teste assistido até o fim no iframe, sem skip.
- [x] Request Activation enviado em 24 Aug 2026.

## Estado após o envio

- Portal: `Request activation COMPLETE`
- Status: `In Review`
- Distribuição: `Not Active` enquanto a revisão manual não for concluída.
- SDK: `Yes`

O primeiro upload da variante foi rejeitado pelo parser porque os itens tinham o prefixo `./`. O builder foi corrigido para escrever `index.html`, `styles.css` e `src/` diretamente na raiz; o segundo upload foi aceito e validado pelo portal.

## Gerar o pacote

Na raiz do projeto:

```powershell
npm run build:gamedistribution
```

O comando cria:

- `submission/sproutbound-gamedistribution-build/`
- `submission/sproutbound-gamedistribution.zip`

O pacote contém o SDK remoto oficial da GameDistribution como a única exceção à política de rede do build-base. O jogo continua resiliente se o SDK estiver bloqueado ou indisponível: o anúncio falha aberto e o loop pode continuar.

## Validação no portal

1. Enviar `submission/sproutbound-gamedistribution.zip` como um novo build do registro `75315`.
2. Abrir o iframe de teste e confirmar que o jogo inicia com o primeiro input físico.
3. Usar o controle de anúncio de teste do portal a partir de uma ação do usuário.
4. Confirmar pausa do loop, bloqueio de input e mute durante `SDK_GAME_PAUSE`.
5. Assistir o anúncio até o fim e confirmar retomada no evento `SDK_GAME_START`.
6. Somente quando o checklist mostrar `SDK: Yes` e habilitar `Request Activation`, solicitar uma confirmação imediata antes do clique final.
