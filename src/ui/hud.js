export function createHud(root) {
  const heightValue = root.querySelector('#height-value');
  const recordValue = root.querySelector('#record-value');
  const objective = root.querySelector('#objective');
  const pauseState = root.querySelector('#pause-state');

  const update = (run) => {
    const height = Math.max(0, run.score ?? 0);
    heightValue.textContent = `${height} m`;
    recordValue.textContent = `${Math.max(height, run.bestScore ?? 0)} m`;
    if (run.state === 'playing') pauseState.textContent = 'Jogo em andamento';
    if (run.state === 'ready') pauseState.textContent = 'Jogo pronto';
  };
  const showObjective = (text) => {
    objective.textContent = text;
  };
  const showRecord = (record) => {
    recordValue.textContent = `${Math.max(0, record)} m`;
  };

  return { update, showObjective, showRecord };
}
