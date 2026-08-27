const MESSAGES = {
  en: {
    title: 'Sproutbound — Sunbound climb',
    game: 'Sproutbound',
    area: 'Game area',
    canvas: 'Sproutbound game',
    hud: {
      height: 'Height',
      record: 'Best',
      solar: 'Solar light',
      heightValue: '{value} m',
      solarValue: 'Solar light: {value}',
      playing: 'Game in progress',
      ready: 'Game ready',
      summit: 'Summit reached',
    },
    objective: {
      tap: 'Tap left or right to guide Pip.',
      next: 'Next: {label}',
      summit: 'Summit reached',
    },
    restart: 'Play again',
    ready: {
      label: 'Start of the run',
      eyebrow: 'SUNBOUND CLIMB',
      title: 'Help Pip climb.',
      instructions: 'Tap or use ← → to guide the sprout between the leaves.',
    },
    gameOver: {
      label: 'End of the run',
      eyebrow: 'RUN OVER',
      title: 'Pip needs another try.',
      message: 'All starting visuals unlocked',
      heightRecord: 'Height: {height} m · Best: {record} m',
      next: 'Next: {label}',
      allUnlocked: 'All starting visuals unlocked',
      restart: 'Play again',
    },
    summit: {
      eyebrow: 'SUMMIT REACHED',
      title: 'You reached the summit!',
      message: 'Summit Crown unlocked.',
      reward: 'Reward: Summit Crown',
    },
    milestone: {
      bud: 'Two-leaf sprout',
      bloom: 'Blooming Pip',
      'sun-cape': 'Solar cape',
      'summit-crown': 'Summit Crown',
    },
  },
  pt: {
    title: 'Sproutbound — Salto ao Sol',
    game: 'Salto ao Sol',
    area: 'Área de jogo',
    canvas: 'Jogo Salto ao Sol',
    hud: {
      height: 'Altura',
      record: 'Recorde',
      solar: 'Luz solar',
      heightValue: '{value} m',
      solarValue: 'Luz solar: {value}',
      playing: 'Jogo em andamento',
      ready: 'Jogo pronto',
      summit: 'Cume alcançado',
    },
    objective: {
      tap: 'Toque à esquerda ou à direita para guiar Pip.',
      next: 'Próximo: {label}',
      summit: 'Cume alcançado',
    },
    restart: 'Jogar novamente',
    ready: {
      label: 'Início da partida',
      eyebrow: 'SALTO AO SOL',
      title: 'Ajude Pip a subir.',
      instructions: 'Toque ou use ← → para guiar o broto entre as folhas.',
    },
    gameOver: {
      label: 'Fim da partida',
      eyebrow: 'FIM DA SUBIDA',
      title: 'Pip precisa de mais uma tentativa.',
      message: 'Todos os visuais iniciais desbloqueados',
      heightRecord: 'Altura: {height} m · Recorde: {record} m',
      next: 'Próximo: {label}',
      allUnlocked: 'Todos os visuais iniciais desbloqueados',
      restart: 'Jogar novamente',
    },
    summit: {
      eyebrow: 'CUME ALCANÇADO',
      title: 'Cume alcançado!',
      message: 'Coroa do cume desbloqueada.',
      reward: 'Recompensa: Coroa do cume',
    },
    milestone: {
      bud: 'Broto com duas folhas',
      bloom: 'Pip florescente',
      'sun-cape': 'Capa de luz solar',
      'summit-crown': 'Coroa do cume',
    },
  },
};

function readMessage(messages, key) {
  return key.split('.').reduce((value, part) => value?.[part], messages);
}

export function getLocale(language = 'en') {
  return String(language).toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

export function createTranslator(language = 'en') {
  const locale = getLocale(language);
  const messages = MESSAGES[locale];

  const t = (key, values = {}) => {
    const template = readMessage(messages, key) ?? readMessage(MESSAGES.en, key) ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
  };

  return { locale, t };
}

export function milestoneLabel(translator, milestone) {
  return milestone ? translator.t(`milestone.${milestone.id}`) : '';
}
