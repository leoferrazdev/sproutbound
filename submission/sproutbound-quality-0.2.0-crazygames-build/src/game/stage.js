// Dimensões lógicas do palco, num único lugar.
//
// A largura estava repetida em doze arquivos: simulação, gerador, jogador,
// renderer, entrada, laço, app e gravador. Alargar o jogo exigia acertar todos,
// e qualquer esquecimento produziria física e desenho discordando em silêncio.
//
// A altura permanece 640. A largura passou de 360 para 480 porque, no desktop, o
// palco 9:16 ocupava 405 px de 1280: uma coluna estreita ao lado de muito fundo.
// Em 3:4 a mesma janela dá 540 px de área jogável.
export const STAGE_WIDTH = 480;
export const STAGE_HEIGHT = 640;
export const STAGE_RATIO = STAGE_WIDTH / STAGE_HEIGHT;
