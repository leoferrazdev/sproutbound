import { createTranslator, objectiveText, routeLabel, biomeLabel } from '../i18n.js';
import { getRoutes, getBiome } from '../game/campaign.js';
import { getRouteState, isRouteUnlocked, countRoutesCleared } from '../game/progression.js';

// Tela de seleção de rota. Sem ela o jogador não vê que existem 25 rotas nem qual
// é o objetivo da fase — o mesmo defeito de objetivo invisível que a auditoria
// apontou, agora um nível acima.

function countStars(progress) {
  return getRoutes().filter((route) => getRouteState(progress, route.id).objectiveMet).length;
}

export function createCampaignScreen(root, {
  translator = createTranslator(),
  onSelect = () => {},
  onClose = () => {},
} = {}) {
  const documentRef = root.ownerDocument;
  const panel = root.querySelector('#campaign-screen');
  const list = root.querySelector('#route-list');
  const progressLabel = root.querySelector('#campaign-progress');
  const closeButton = root.querySelector('#campaign-close');

  if (panel) panel.setAttribute('aria-label', translator.t('campaign.label'));
  const eyebrow = root.querySelector('#campaign-eyebrow');
  if (eyebrow) eyebrow.textContent = translator.t('campaign.eyebrow');
  const title = root.querySelector('#campaign-title');
  if (title) title.textContent = translator.t('campaign.title');
  if (closeButton) closeButton.textContent = translator.t('campaign.close');

  closeButton?.addEventListener('click', () => onClose());

  const render = (progress, currentRouteId) => {
    if (!list) return;
    list.replaceChildren();
    const routes = getRoutes();

    if (progressLabel) {
      progressLabel.textContent = translator.t('campaign.progress', {
        cleared: countRoutesCleared(progress),
        total: routes.length,
        stars: countStars(progress),
      });
    }

    let lastBiome = null;
    for (const route of routes) {
      if (route.biome !== lastBiome) {
        lastBiome = route.biome;
        const heading = documentRef.createElement('h2');
        heading.className = 'route-group';
        heading.textContent = biomeLabel(translator, route.biome);
        heading.style.setProperty('--biome-accent', getBiome(route.biome).leaf);
        list.append(heading);
      }

      const state = getRouteState(progress, route.id);
      const unlocked = isRouteUnlocked(progress, route);
      const card = documentRef.createElement('button');
      card.type = 'button';
      card.className = 'route-card';
      card.dataset.routeId = route.id;
      card.dataset.state = unlocked ? (state.cleared ? 'cleared' : 'open') : 'locked';
      card.dataset.current = String(route.id === currentRouteId);
      card.style.setProperty('--biome-accent', getBiome(route.biome).leaf);
      card.setAttribute('role', 'listitem');

      const order = documentRef.createElement('span');
      order.className = 'route-order';
      order.textContent = String(route.order);

      const body = documentRef.createElement('span');
      body.className = 'route-body';
      const name = documentRef.createElement('span');
      name.className = 'route-name';
      name.textContent = translator.t('campaign.routeName', { order: route.order });
      const goal = documentRef.createElement('span');
      goal.className = 'route-goal';
      goal.textContent = unlocked
        ? objectiveText(translator, route.objective)
        : translator.t('campaign.locked');
      const best = documentRef.createElement('span');
      best.className = 'route-best';
      // a linha existe sempre, vazia quando não há tempo: card de altura uniforme
      best.textContent = state.bestSeconds ? translator.t('campaign.best', { seconds: state.bestSeconds.toFixed(1) }) : '';
      body.append(name, goal, best);

      const badge = documentRef.createElement('span');
      badge.className = 'route-badge';
      if (!unlocked) {
        badge.textContent = '';
        badge.dataset.kind = 'locked';
      } else if (state.objectiveMet) {
        badge.textContent = '★';
        badge.dataset.kind = 'star';
      } else if (state.cleared) {
        badge.textContent = '✓';
        badge.dataset.kind = 'cleared';
      } else {
        badge.textContent = '';
        badge.dataset.kind = 'open';
      }

      card.append(order, body, badge);

      if (unlocked) {
        card.setAttribute('aria-label', `${routeLabel(translator, route)}. ${objectiveText(translator, route.objective)}`);
        card.addEventListener('click', () => onSelect(route.id));
      } else {
        card.disabled = true;
        card.setAttribute('aria-disabled', 'true');
        card.setAttribute('aria-label', `${routeLabel(translator, route)}. ${translator.t('campaign.locked')}`);
      }

      list.append(card);
    }
  };

  return {
    render,
    show(progress, currentRouteId) {
      render(progress, currentRouteId);
      if (panel) panel.hidden = false;
    },
    hide() {
      if (panel) panel.hidden = true;
    },
    isOpen: () => Boolean(panel && !panel.hidden),
  };
}
