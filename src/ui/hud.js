export function createHud(root) {
  const heightValue = root.querySelector('#height-value');
  const recordValue = root.querySelector('#record-value');
  const objective = root.querySelector('#objective');
  const sunCounter = root.querySelector('#sun-counter');
  const pauseState = root.querySelector('#pause-state');

  const update = (run) => {
    const height = Math.max(0, run.score ?? 0);
    heightValue.textContent = `${height} m`;
    recordValue.textContent = `${Math.max(height, run.bestScore ?? 0)} m`;
    if (sunCounter) sunCounter.textContent = `Luz solar: ${Math.max(0, run.sunCount ?? 0)}`;
    if (run.state === 'playing') pauseState.textContent = 'Jogo em andamento';
    if (run.state === 'ready') pauseState.textContent = 'Jogo pronto';
    if (run.state === 'summit') pauseState.textContent = 'Cume alcançado';
  };
  const showObjective = (text) => {
    objective.textContent = text;
  };
  const showRecord = (record) => {
    recordValue.textContent = `${Math.max(0, record)} m`;
  };

  return { update, showObjective, showRecord };
}
