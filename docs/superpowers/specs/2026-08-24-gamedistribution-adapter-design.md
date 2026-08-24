 # Sproutbound GameDistribution Adapter Design

 **Date:** 2026-08-24
 **Status:** approved for specification
 **Project:** Sproutbound
 **Platform:** GameDistribution

 ## Goal

 Criar uma variante de publicação do Sproutbound compatível com o SDK HTML5 da GameDistribution, sem alterar o comportamento nem a política de rede do build-base offline.

 ## Contexto e decisão

 O portal GameDistribution criou o jogo `Sproutbound` com o Game ID `8ccb967dc0be492c9be5fc5a95f32fd5`, aceitou o build e os assets, mas mantém a integração como `SDK: No` e bloqueia `Request Activation`. A documentação oficial exige `GD_OPTIONS`, carregamento do SDK antes do jogo, tratamento dos eventos de pausa/retomada e uma validação de anúncio no iframe do portal.

 A decisão é manter dois contratos explícitos:

 - `base-offline`: build neutro, sem SDK remoto, analytics, anúncios ou requests externos.
 - `gamedistribution-adapter`: variante específica que carrega o SDK oficial da GameDistribution e implementa o contrato de lifecycle e anúncios do portal.

 O gameplay continuará dependendo apenas da interface interna de plataforma. Nenhum módulo do jogo poderá chamar `gdsdk` diretamente.

 ## Abordagens consideradas

 ### Variante específica com SDK remoto — escolhida

 A variante recebe um entrypoint e um arquivo de configuração próprios. O SDK é carregado apenas no HTML de publicação da GameDistribution. O build-base continua adequado às plataformas que exigem zero requests externos.

 **Vantagens:** segue o fluxo oficial, separa o risco de plataforma, permite validação no portal e preserva o pacote neutro.

 **Custo:** haverá um request externo no pacote GameDistribution, conforme exigência do SDK da plataforma.

 ### SDK copiado localmente

 Manteria o carregamento local, mas diverge do fluxo oficial documentado, cria risco de versão e pode impedir a validação automática do portal. Não será usado.

 ### Manter o rascunho sem SDK

 Preservaria a política offline em todos os builds, mas não desbloqueia a ativação nem a distribuição na GameDistribution. Não atende ao objetivo atual.

 ## Arquitetura

 ### Interface interna

 A factory de plataforma continuará oferecendo:

 - `startGameplay()` e `stopGameplay()` com travas contra eventos duplicados;
 - `requestCommercialBreak()` para o anúncio de intervalo no reinício;
 - `pauseInput()` e `resumeInput()`;
 - estado e histórico observáveis pelos testes.

 A implementação GameDistribution receberá dependências por injeção: referência de janela, SDK, callbacks de pausa, retomada, mute e unmute. Isso permite testar o contrato sem carregar rede ou anúncios durante os testes locais.

 ### Configuração do SDK

 O entrypoint GameDistribution definirá `window.GD_OPTIONS` com o Game ID do portal e o callback `onEvent`. O callback converterá eventos do SDK em eventos internos do adaptador.

 O carregamento do SDK ocorrerá antes do entrypoint do jogo e uma única vez. O `base-offline` não incluirá essa configuração nem o script remoto.

 ### Lifecycle e anúncios

 - `SDK_GAME_PAUSE`: pausar o loop, bloquear input e silenciar áudio.
 - `SDK_GAME_START`: retomar o loop, liberar input e restaurar áudio.
 - `SDK_ERROR`: manter o jogo jogável sem congelamento e registrar estado de indisponibilidade no adaptador.
 - `gdsdk.showAd()`: chamar somente após input físico no botão de reinício e fora do gameplay.
 - ausência de `gdsdk` ou de `showAd`: seguir sem anúncio, sem travar a rodada.

 Como Sproutbound não possui áudio no estado atual, o callback de mute será um no-op documentado, preparado para a futura camada sonora.

 ### Build e entrega

 Será criado um gerador de pacote específico que:

 1. copia os arquivos locais do jogo;
 2. usa o entrypoint GameDistribution;
 3. injeta somente a configuração e o carregamento do SDK no pacote da plataforma;
 4. verifica a presença de `index.html` na raiz;
 5. gera um ZIP identificável e abaixo do limite do portal.

 O pacote `submission/sproutbound-basic-launch.zip` não será substituído pela variante. O novo artefato terá nome próprio e será submetido separadamente.

 ## Testes

 Os testes deverão provar:

 - o adaptador neutro permanece offline e sem anúncios;
 - a variante GameDistribution ignora SDK ausente sem congelar;
 - `SDK_GAME_PAUSE` pausa input/loop uma única vez;
 - `SDK_GAME_START` retoma input/loop uma única vez;
 - `startGameplay()` e `stopGameplay()` não geram duplicações consecutivas;
 - `requestCommercialBreak()` só chama `showAd()` quando o SDK está disponível;
 - o build-base não contém URL do SDK GameDistribution;
 - o pacote GameDistribution contém o Game ID correto, entrypoint próprio e `index.html` na raiz;
 - o ZIP gerado permanece dentro do limite de tamanho definido pelo projeto.

 ## Critérios de aceite

 A implementação será considerada pronta quando:

 1. todos os testes automatizados passarem;
 2. o build-base continuar passando a verificação local sem requests externos;
 3. o novo ZIP for gerado e validado;
 4. o ZIP for carregado no GameDistribution;
 5. o portal detectar `SDK: Yes` após o fluxo de teste do iframe;
 6. o anúncio de teste for visualizado integralmente;
 7. `Request Activation` ficar habilitado e for enviado somente após confirmação de estado no portal.

 ## Fontes oficiais

 - [GameDistribution Quality Guidelines](https://developer.gamedistribution.com/quality-guidelines)
 - [GameDistribution HTML5 SDK](https://github.com/GameDistribution/GD-HTML5)
 - [SDK Implementation](https://github.com/GameDistribution/GD-HTML5/wiki/SDK-Implementation)

 **Revalidação:** requisitos do portal e do SDK devem ser rechecados imediatamente antes do novo upload.
