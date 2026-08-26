// Política de pausa, separada da fiação de DOM.
//
// O defeito original era simples de descrever e fácil de repetir: o evento de
// visibilidade apenas limpava o input e a partida continuava correndo, então
// trocar de aba custava a rodada. Os erros aqui são de decisão, não de
// marcação — pausar fora de jogo, pausar duas vezes, pausar com a seleção de
// rota aberta, ou não retomar. Isolar a decisão torna todos testáveis.

export const PAUSE_TRIGGERS = Object.freeze(['button', 'key', 'blur', 'hidden']);

export function shouldPause({ runState, paused = false, campaignOpen = false, trigger = 'button' } = {}) {
  if (!PAUSE_TRIGGERS.includes(trigger)) return false;
  if (paused || campaignOpen) return false;
  return runState === 'playing';
}

export function shouldResume({ paused = false, campaignOpen = false } = {}) {
  return paused && !campaignOpen;
}

// Alternar é a ação do botão e da tecla: pausa se dá, retoma se está pausado.
export function nextPauseState(current = {}, trigger = 'button') {
  const { runState, paused = false, campaignOpen = false } = current;
  if (paused) {
    return shouldResume({ paused, campaignOpen }) ? { paused: false, action: 'resume' } : { paused, action: 'none' };
  }
  return shouldPause({ runState, paused, campaignOpen, trigger })
    ? { paused: true, action: 'pause' }
    : { paused, action: 'none' };
}

// Perda de foco e aba oculta só pausam; nunca retomam sozinhas, porque retomar
// sem o jogador olhando devolveria a partida a uma tela que ele não vê.
export function nextPauseStateFromFocusLoss(current = {}) {
  const { runState, paused = false, campaignOpen = false } = current;
  return shouldPause({ runState, paused, campaignOpen, trigger: 'blur' })
    ? { paused: true, action: 'pause' }
    : { paused, action: 'none' };
}
