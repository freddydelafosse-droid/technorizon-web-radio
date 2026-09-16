(() => {
  'use strict';

  const STORAGE_KEY = 'technorizon-games-v1';
  const ROUNDS = 5;

  let lang = localStorage.getItem('technorizon-lang') === 'en' ? 'en' : 'fr';
  const I18N = {
    fr: {
      title: 'Jeux Technorizon — Blind Test, Hit ou Intox et TechnoQuiz',
      description: 'Jouez au Blind Test, à Hit ou Intox et au TechnoQuiz de Technorizon.fr.',
      home: '⌂ Accueil', info: 'ⓘ Infos', heroTitle: 'Choisis ton jeu.<br><span>Défie tes amis</span>',
      heroText: 'Du son, des défis et des points dans une salle de jeux 100 % Technorizon',
      profileEyebrow: 'PROFIL JOUEUR', profileTitle: 'Ton pseudo', nickname: 'Entre ton pseudo', save: 'Enregistrer',
      points: 'points', streak: 'jours de série', games: 'parties',
      blindTab: '<span>🎧</span> Blind Test', intoxTab: '<span>⚡</span> Hit ou Intox ?', quizTab: '<span>🧠</span> TechnoQuiz',
      blindTitle: 'Blind Test Technorizon', blindLead: 'Écoute l’extrait et retrouve le titre. Cinq morceaux, quatre réponses, une seule bonne.',
      blindIntro: 'Choisis ton mode. Les extraits durent jusqu’à 15 secondes.',
      express: '<span>⚡</span><strong>Partie express</strong><small>5 extraits · partie rapide</small>',
      party: '<span>🎉</span><strong>Soirée entre amis</strong><small>25 extraits · chacun son tour !</small>',
      trueFalse: 'VRAI OU FAUX', intoxLead: 'Une affirmation musicale s’affiche. À toi de décider si c’est un hit… ou une intox.',
      intoxIntro: 'Cinq affirmations pour tester ta culture musicale.', intoxStart: 'Jouer à Hit ou Intox',
      electro: 'CULTURE ÉLECTRO', quizLead: 'Artistes, titres et classiques : cinq questions pour montrer ce que tu sais.',
      quizIntro: 'Une bonne réponse rapporte 75 points.', quizStart: 'Lancer le TechnoQuiz',
      topPlayers: 'TOP JOUEURS', rankingTitle: 'Classement sur cet appareil',
      rankingNote: 'Le classement général en ligne arrivera après validation de cette première version.',
      footer: '© 2026 Technorizon.fr · La musique sans frontières',
      emptyRanking: 'À toi d’ouvrir le classement !', pt: 'pt', pts: 'pts',
      finished: 'Partie terminée !', added: 'Tes points sont ajoutés au profil {name}.', replay: 'Rejouer',
      preparing: 'Préparation de l’extrait…', clip: 'EXTRAIT {number}', whatTitle: 'Quel est ce titre ?',
      listen: '▶ Écouter l’extrait', pause: '❚❚ Mettre en pause', listenAgain: '▶ Réécouter l’extrait',
      audioError: 'Impossible de lire cet extrait. Appuie sur Suivant.',
      unavailable: 'Extrait momentanément indisponible', replaced: 'Ce morceau sera remplacé automatiquement.',
      tryAnother: 'Essayer un autre extrait', correctTrack: 'Bonne réponse ! {artist} — {title}', wasTrack: 'C’était {artist} — {title}',
      statement: 'AFFIRMATION {number}', hitTrue: '🎯 HIT — C’est vrai', intoxFalse: '🚨 INTOX — C’est faux',
      wellDone: 'Bien vu !', missed: 'Raté !', exact: 'Exact : {artist} interprète « {title} ».',
      falseDetail: 'Intox : « {title} » est interprété par {artist}.',
      trackBy: '« {title} » est interprété par {artist}.', whoPerforms: 'Qui interprète « {title} » ?',
      whichTitle: 'Quel titre est interprété par {artist} ?', question: 'QUESTION {number}',
      goodAnswer: 'Bonne réponse !', rightAnswer: 'La bonne réponse était : {answer}', next: 'Question suivante →',
      blindPartyName: 'Blind Test Soirée'
    },
    en: {
      title: 'Technorizon Games — Blind Test, Hit or Myth and TechnoQuiz',
      description: 'Play Technorizon.fr’s Blind Test, Hit or Myth and TechnoQuiz.',
      home: '⌂ Home', info: 'ⓘ Info', heroTitle: 'Choose your game.<br><span>Challenge your friends</span>',
      heroText: 'Music, challenges and points in a 100% Technorizon game room',
      profileEyebrow: 'PLAYER PROFILE', profileTitle: 'Your nickname', nickname: 'Enter your nickname', save: 'Save',
      points: 'points', streak: 'day streak', games: 'games',
      blindTab: '<span>🎧</span> Blind Test', intoxTab: '<span>⚡</span> Hit or Myth?', quizTab: '<span>🧠</span> TechnoQuiz',
      blindTitle: 'Technorizon Blind Test', blindLead: 'Listen to the clip and find the title. Five tracks, four answers, only one is right.',
      blindIntro: 'Choose your mode. Clips last up to 15 seconds.',
      express: '<span>⚡</span><strong>Quick game</strong><small>5 clips · fast round</small>',
      party: '<span>🎉</span><strong>Friends’ night</strong><small>25 clips · take turns!</small>',
      trueFalse: 'TRUE OR FALSE', intoxLead: 'A music statement appears. Decide whether it is a hit… or a myth.',
      intoxIntro: 'Five statements to test your music knowledge.', intoxStart: 'Play Hit or Myth',
      electro: 'ELECTRONIC MUSIC', quizLead: 'Artists, tracks and classics: five questions to show what you know.',
      quizIntro: 'Each correct answer earns 75 points.', quizStart: 'Start TechnoQuiz',
      topPlayers: 'TOP PLAYERS', rankingTitle: 'Leaderboard on this device',
      rankingNote: 'The online global leaderboard will arrive after this first version is approved.',
      footer: '© 2026 Technorizon.fr · Music without borders',
      emptyRanking: 'Be the first on the leaderboard!', pt: 'pt', pts: 'pts',
      finished: 'Game over!', added: 'Your points have been added to {name}’s profile.', replay: 'Play again',
      preparing: 'Preparing the clip…', clip: 'CLIP {number}', whatTitle: 'What is this track?',
      listen: '▶ Play the clip', pause: '❚❚ Pause', listenAgain: '▶ Play the clip again',
      audioError: 'This clip cannot be played. Press Next.',
      unavailable: 'Clip temporarily unavailable', replaced: 'This track will be replaced automatically.',
      tryAnother: 'Try another clip', correctTrack: 'Correct! {artist} — {title}', wasTrack: 'It was {artist} — {title}',
      statement: 'STATEMENT {number}', hitTrue: '🎯 HIT — True', intoxFalse: '🚨 MYTH — False',
      wellDone: 'Well done!', missed: 'Not quite!', exact: 'Correct: {artist} performs “{title}”.',
      falseDetail: 'Myth: “{title}” is performed by {artist}.',
      trackBy: '“{title}” is performed by {artist}.', whoPerforms: 'Who performs “{title}”?',
      whichTitle: 'Which track is performed by {artist}?', question: 'QUESTION {number}',
      goodAnswer: 'Correct!', rightAnswer: 'The correct answer was: {answer}', next: 'Next question →',
      blindPartyName: 'Blind Test Party'
    }
  };
  const t = (key, vars = {}) => (I18N[lang][key] || key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
  const setText = (selector, key) => { const node = document.querySelector(selector); if (node) node.textContent = t(key); };
  const setHtml = (selector, key) => { const node = document.querySelector(selector); if (node) node.innerHTML = t(key); };
  function applyLanguage() {
    document.documentElement.lang = lang;
    document.title = t('title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = t('description');
    const picker = document.querySelector('#game-language');
    if (picker) picker.value = lang;
    setText('.games-home', 'home'); setText('.games-info-link', 'info');
    setHtml('.games-hero h1', 'heroTitle'); setText('.games-hero p', 'heroText');
    setText('.player-card .eyebrow', 'profileEyebrow'); setText('#profile-title', 'profileTitle');
    const nickname = document.querySelector('#player-name'); if (nickname) nickname.placeholder = t('nickname');
    setText('#profile-form button', 'save');
    setText('.profile-stats div:nth-child(1) span', 'points');
    setText('.profile-stats div:nth-child(2) span', 'streak');
    setText('.profile-stats div:nth-child(3) span', 'games');
    setHtml('.game-tab[data-game="blind"]', 'blindTab'); setHtml('.game-tab[data-game="intox"]', 'intoxTab'); setHtml('.game-tab[data-game="quiz"]', 'quizTab');
    setText('#blind-title', 'blindTitle'); setText('#game-blind .game-lead', 'blindLead'); setText('#blind-stage > p', 'blindIntro');
    setHtml('#blind-start', 'express'); setHtml('#blind-party', 'party');
    setText('#game-intox .secondary-badge', 'trueFalse'); setText('#game-intox .game-lead', 'intoxLead'); setText('#intox-stage > p', 'intoxIntro'); setText('#intox-start', 'intoxStart');
    setText('#game-quiz .secondary-badge', 'electro'); setText('#game-quiz .game-lead', 'quizLead'); setText('#quiz-stage > p', 'quizIntro'); setText('#quiz-start', 'quizStart');
    setText('.ranking-card .eyebrow', 'topPlayers'); setText('#ranking-title', 'rankingTitle'); setText('.ranking-note', 'rankingNote'); setText('.games-footer', 'footer');
  }


  const blindTracksLegacy = [
    { artist: 'Gala', title: 'Freed From Desire' },
    { artist: 'Haddaway', title: 'What Is Love' },
    { artist: 'Corona', title: 'The Rhythm of the Night' },
    { artist: 'Eiffel 65', title: 'Blue (Da Ba Dee)' },
    { artist: 'Darude', title: 'Sandstorm' },
    { artist: 'Alice Deejay', title: 'Better Off Alone' },
    { artist: 'SNAP!', title: 'Rhythm Is a Dancer' },
    { artist: 'Technotronic', title: 'Pump Up the Jam' },
    { artist: 'Faithless', title: 'Insomnia' },
    { artist: 'Daft Punk', title: 'Around the World' },
    { artist: '2 Unlimited', title: 'No Limit' },
    { artist: 'La Bouche', title: 'Be My Lover' },
    { artist: 'Robert Miles', title: 'Children' },
    { artist: 'Sash!', title: 'Ecuador' },
    { artist: "Gigi D'Agostino", title: "L'Amour Toujours" },
    { artist: 'Cascada', title: 'Everytime We Touch' },
    { artist: 'Avicii', title: 'Levels' },
    { artist: 'Calvin Harris', title: 'Feel So Close' }
  ];
  const blindTracks = Array.isArray(window.TECHNORIZON_TRACKS) && window.TECHNORIZON_TRACKS.length >= 200
    ? window.TECHNORIZON_TRACKS
    : blindTracksLegacy.map((track, index) => ({ ...track, id: index + 1 }));

  const intoxQuestions = [
    { text: 'Daft Punk était un duo français.', answer: true, detail: 'Thomas Bangalter et Guy-Manuel de Homem-Christo formaient Daft Punk.' },
    { text: '« Freed From Desire » est interprété par Gala.', answer: true, detail: 'Gala a sorti ce classique dance dans les années 1990.' },
    { text: '« What Is Love » est un titre de Haddaway.', answer: true, detail: 'Le titre de Haddaway est devenu un incontournable de l’Eurodance.' },
    { text: '« Sandstorm » est interprété par David Guetta.', answer: false, detail: '« Sandstorm » est un titre du Finlandais Darude.' },
    { text: '« Blue (Da Ba Dee) » est un titre d’Eiffel 65.', answer: true, detail: 'Le groupe italien Eiffel 65 a signé ce tube mondial.' },
    { text: '« Rhythm Is a Dancer » est interprété par Faithless.', answer: false, detail: 'Ce titre est signé SNAP! ; Faithless est notamment connu pour « Insomnia ».' },
    { text: '« Pump Up the Jam » est sorti à la fin des années 1980.', answer: true, detail: 'Technotronic a sorti le titre en 1989.' },
    { text: '« Better Off Alone » est un titre d’Alice Deejay.', answer: true, detail: 'C’est l’un des classiques trance-pop de la fin des années 1990.' },
    { text: 'Robert Miles est l’artiste derrière « Children ».', answer: true, detail: '« Children » est son titre instrumental emblématique.' },
    { text: '« No Limit » est un titre de La Bouche.', answer: false, detail: '« No Limit » est signé 2 Unlimited.' }
  ];

  const quizQuestions = [
    { text: 'Qui interprète « What Is Love » ?', answers: ['Haddaway', 'Dr. Alban', 'Ice MC', 'Captain Hollywood'], correct: 0 },
    { text: 'Quel duo français a créé « Around the World » ?', answers: ['Justice', 'Daft Punk', 'Cassius', 'Air'], correct: 1 },
    { text: 'Quel titre est interprété par Gala ?', answers: ['Freed From Desire', 'Be My Lover', 'No Limit', 'Ecuador'], correct: 0 },
    { text: 'Qui est derrière « Sandstorm » ?', answers: ['Sash!', 'Darude', 'ATB', 'Robert Miles'], correct: 1 },
    { text: 'Quel groupe interprète « Blue (Da Ba Dee) » ?', answers: ['Eiffel 65', 'Aqua', 'Vengaboys', 'Scooter'], correct: 0 },
    { text: 'Quel artiste a sorti « Pump Up the Jam » ?', answers: ['Technotronic', 'SNAP!', '2 Unlimited', 'Culture Beat'], correct: 0 },
    { text: '« Better Off Alone » est un titre de…', answers: ['Cascada', 'Alice Deejay', 'Lasgo', 'Sylver'], correct: 1 },
    { text: 'Quel groupe est connu pour « Insomnia » ?', answers: ['Faithless', 'The Prodigy', 'Underworld', 'Orbital'], correct: 0 },
    { text: 'Qui interprète « The Rhythm of the Night » ?', answers: ['Corona', 'Gala', 'Whigfield', 'La Bouche'], correct: 0 },
    { text: 'Quel artiste est derrière « Levels » ?', answers: ['Avicii', 'Calvin Harris', 'Tiësto', 'Martin Garrix'], correct: 0 }
  ];

  const createHitIntoxBank = () => blindTracks.slice(0, 60).flatMap((track, index, tracks) => {
    const wrongArtist = tracks[(index + 17) % tracks.length].artist;
    return [
      { id: `hit-true-${track.id}`, text: t('trackBy', { title: track.title, artist: track.artist }), answer: true, detail: t('exact', { artist: track.artist, title: track.title }) },
      { id: `hit-false-${track.id}`, text: t('trackBy', { title: track.title, artist: wrongArtist }), answer: false, detail: t('falseDetail', { title: track.title, artist: track.artist }) }
    ];
  });

  const createTechnoQuizBank = () => blindTracks.slice(0, 200).map((track, index, tracks) => {
    if (index % 2 === 0) {
      const alternatives = sample([...new Set(tracks.filter(item => item.artist !== track.artist).map(item => item.artist))], 3);
      const answers = shuffle([track.artist, ...alternatives]);
      return { id: `quiz-artist-${track.id}`, text: t('whoPerforms', { title: track.title }), answers, correct: answers.indexOf(track.artist) };
    }
    const alternatives = sample(tracks.filter(item => item.title !== track.title), 3).map(item => item.title);
    const answers = shuffle([track.title, ...alternatives]);
    return { id: `quiz-title-${track.id}`, text: t('whichTitle', { artist: track.artist }), answers, correct: answers.indexOf(track.title) };
  });

  const $ = selector => document.querySelector(selector);
  const shuffle = list => [...list].sort(() => Math.random() - 0.5);
  const sample = (list, count) => shuffle(list).slice(0, count);
  const hitIntoxBank = createHitIntoxBank();
  const technoQuizBank = createTechnoQuizBank();
  const today = () => new Date().toISOString().slice(0, 10);
  const yesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  const defaultState = () => ({ name: '', points: 0, streak: 0, lastPlayed: '', gamesPlayed: 0, ranking: [], seen: {} });
  function loadState() {
    try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return defaultState(); }
  }
  let player = loadState();

  function drawUnseen(list, count, key) {
    player.seen = player.seen && typeof player.seen === 'object' ? player.seen : {};
    let seen = Array.isArray(player.seen[key]) ? player.seen[key] : [];
    let available = list.filter(item => !seen.includes(item.id));
    if (available.length < count) {
      seen = [];
      available = [...list];
    }
    const chosen = sample(available, count);
    player.seen[key] = [...seen, ...chosen.map(item => item.id)];
    saveState();
    return chosen;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    renderProfile();
  }

  function cleanName(value) {
    return value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 18);
  }

  function ensureProfile() {
    if (player.name) return true;
    $('#player-name').focus();
    $('#profile-form').classList.add('needs-name');
    return false;
  }

  function renderProfile() {
    $('#player-name').value = player.name;
    $('#total-points').textContent = player.points;
    $('#daily-streak').textContent = player.streak;
    $('#games-played').textContent = player.gamesPlayed;
    const rows = [...player.ranking].sort((a, b) => b.score - a.score).slice(0, 5);
    $('#ranking-list').innerHTML = rows.length
      ? rows.map((row, index) => `<li><span class="ranking-rank">${index + 1}</span><span class="ranking-name">${escapeHtml(row.name)}</span><strong class="ranking-points">${row.score} pts · ${escapeHtml(row.game)}</strong></li>`).join('')
      : `<li><span class="ranking-rank">–</span><span class="ranking-name">${escapeHtml(t('emptyRanking'))}</span><strong class="ranking-points">0 ${t('pt')}</strong></li>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function completeGame(game, score) {
    const date = today();
    if (player.lastPlayed !== date) {
      player.streak = player.lastPlayed === yesterday() ? player.streak + 1 : 1;
      player.lastPlayed = date;
    }
    player.points += score;
    player.gamesPlayed += 1;
    player.ranking.push({ name: player.name, score, game, at: Date.now() });
    player.ranking = player.ranking.sort((a, b) => b.score - a.score).slice(0, 20);
    saveState();
  }

  $('#profile-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = cleanName($('#player-name').value);
    if (!name) return;
    player.name = name;
    $('#profile-form').classList.remove('needs-name');
    saveState();
  });

  document.querySelectorAll('.game-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.game-tab').forEach(item => item.classList.toggle('active', item === tab));
      document.querySelectorAll('.game-panel').forEach(panel => {
        const active = panel.id === `game-${tab.dataset.game}`;
        panel.hidden = !active;
        panel.classList.toggle('active', active);
      });
      stopBlindAudio();
    });
  });

  function loading(stage, text) {
    stage.innerHTML = `<div class="loading-ring"></div><p>${escapeHtml(text)}</p>`;
  }

  function result(stage, game, score, restart) {
    completeGame(game, score);
    stage.innerHTML = `<div class="result-score">${score}</div><h3 class="result-title">${escapeHtml(t('finished'))}</h3><p class="result-text">${escapeHtml(t('added', { name: player.name }))}</p><button class="primary-action" type="button">${escapeHtml(t('replay'))}</button>`;
    stage.querySelector('button').addEventListener('click', restart);
  }

  // Blind Test
  const blind = { questions: [], index: 0, score: 0, locked: false, total: ROUNDS };
  const blindStage = $('#blind-stage');
  const blindAudio = $('#blind-audio');
  function stopBlindAudio() {
    blindAudio.pause();
    blindAudio.currentTime = 0;
  }

  async function startBlind(rounds = ROUNDS) {
    if (!ensureProfile()) return;
    stopBlindAudio();
    blind.total = Number(rounds) === 25 ? 25 : ROUNDS;
    blind.questions = drawUnseen(blindTracks, blind.total, 'blind');
    blind.index = 0;
    blind.score = 0;
    $('#blind-score').textContent = '0 pts';
    await loadBlindRound();
  }

  async function loadBlindRound() {
    stopBlindAudio();
    blind.locked = false;
    const track = blind.questions[blind.index];
    $('#blind-round').textContent = `${blind.index + 1} / ${blind.total}`;
    loading(blindStage, t('preparing'));
    try {
      const params = new URLSearchParams({ artist: track.artist, title: track.title });
      const response = await fetch(`/api/game-preview?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('preview');
      const data = await response.json();
      if (!data.previewUrl) throw new Error('preview');
      blindAudio.src = data.previewUrl;
      blindAudio.load();
      const alternatives = sample(blindTracks.filter(item => item.title !== track.title), 3).map(item => item.title);
      const answers = shuffle([track.title, ...alternatives]);
      blindStage.innerHTML = `<div class="question-wrap"><span class="question-label">${escapeHtml(t('clip', { number: blind.index + 1 }))}</span><h3 class="question-title">${escapeHtml(t('whatTitle'))}</h3><button class="audio-action" type="button">${escapeHtml(t('listen'))}</button><div class="answers">${answers.map(answer => `<button class="answer-btn" type="button" data-answer="${escapeHtml(answer)}">${escapeHtml(answer)}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p></div>`;
      const play = blindStage.querySelector('.audio-action');
      play.addEventListener('click', async () => {
        try {
          if (blindAudio.paused) { await blindAudio.play(); play.textContent = t('pause'); play.classList.add('playing'); }
          else { blindAudio.pause(); play.textContent = t('listenAgain'); play.classList.remove('playing'); }
        } catch { blindStage.querySelector('.feedback').textContent = t('audioError'); }
      });
      blindAudio.ontimeupdate = () => {
        if (blindAudio.currentTime >= 15) { blindAudio.pause(); play.textContent = '▶ Réécouter l’extrait'; play.classList.remove('playing'); }
      };
      blindStage.querySelectorAll('.answer-btn').forEach(button => button.addEventListener('click', () => answerBlind(button, track)));
    } catch {
      blindStage.innerHTML = `<div class="question-wrap"><h3 class="question-title">${escapeHtml(t('unavailable'))}</h3><p class="result-text">${escapeHtml(t('replaced'))}</p><button class="primary-action" type="button">${escapeHtml(t('tryAnother'))}</button></div>`;
      blindStage.querySelector('button').addEventListener('click', () => {
        blind.questions[blind.index] = sample(blindTracks.filter(item => !blind.questions.includes(item)), 1)[0] || sample(blindTracks, 1)[0];
        loadBlindRound();
      });
    }
  }

  function answerBlind(button, track) {
    if (blind.locked) return;
    blind.locked = true;
    stopBlindAudio();
    const correct = button.dataset.answer === track.title;
    if (correct) blind.score += 100;
    $('#blind-score').textContent = `${blind.score} pts`;
    blindStage.querySelectorAll('.answer-btn').forEach(item => {
      item.disabled = true;
      if (item.dataset.answer === track.title) item.classList.add('correct');
    });
    if (!correct) button.classList.add('wrong');
    const feedback = blindStage.querySelector('.feedback');
    feedback.className = `feedback ${correct ? 'good' : 'bad'}`;
    feedback.textContent = correct ? t('correctTrack', { artist: track.artist, title: track.title }) : t('wasTrack', { artist: track.artist, title: track.title });
    addNextButton(blindStage.querySelector('.question-wrap'), () => {
      blind.index += 1;
      if (blind.index >= blind.total) result(blindStage, blind.total === 25 ? t('blindPartyName') : 'Blind Test', blind.score, () => startBlind(blind.total));
      else loadBlindRound();
    });
  }

  // Hit ou Intox
  const intox = { questions: [], index: 0, score: 0, locked: false };
  const intoxStage = $('#intox-stage');
  function startIntox() {
    if (!ensureProfile()) return;
    intox.questions = drawUnseen(hitIntoxBank.length === 120 ? hitIntoxBank : intoxQuestions, ROUNDS, 'intox');
    intox.index = 0;
    intox.score = 0;
    $('#intox-score').textContent = '0 pts';
    showIntoxRound();
  }
  function showIntoxRound() {
    intox.locked = false;
    const question = intox.questions[intox.index];
    $('#intox-round').textContent = `${intox.index + 1} / ${ROUNDS}`;
    intoxStage.innerHTML = `<div class="question-wrap"><span class="question-label">${escapeHtml(t('statement', { number: intox.index + 1 }))}</span><h3 class="question-title">${escapeHtml(question.text)}</h3><div class="answers"><button class="answer-btn" type="button" data-value="true">${escapeHtml(t('hitTrue'))}</button><button class="answer-btn" type="button" data-value="false">${escapeHtml(t('intoxFalse'))}</button></div><p class="feedback" aria-live="polite"></p></div>`;
    intoxStage.querySelectorAll('.answer-btn').forEach(button => button.addEventListener('click', () => answerIntox(button, question)));
  }
  function answerIntox(button, question) {
    if (intox.locked) return;
    intox.locked = true;
    const correct = (button.dataset.value === 'true') === question.answer;
    if (correct) intox.score += 75;
    $('#intox-score').textContent = `${intox.score} pts`;
    intoxStage.querySelectorAll('.answer-btn').forEach(item => {
      item.disabled = true;
      if ((item.dataset.value === 'true') === question.answer) item.classList.add('correct');
    });
    if (!correct) button.classList.add('wrong');
    const feedback = intoxStage.querySelector('.feedback');
    feedback.className = `feedback ${correct ? 'good' : 'bad'}`;
    feedback.textContent = `${correct ? t('wellDone') : t('missed')} ${question.detail}`;
    addNextButton(intoxStage.querySelector('.question-wrap'), () => {
      intox.index += 1;
      if (intox.index >= ROUNDS) result(intoxStage, 'Hit ou Intox', intox.score, startIntox);
      else showIntoxRound();
    });
  }

  // TechnoQuiz
  const quiz = { questions: [], index: 0, score: 0, locked: false };
  const quizStage = $('#quiz-stage');
  function startQuiz() {
    if (!ensureProfile()) return;
    quiz.questions = drawUnseen(technoQuizBank.length === 200 ? technoQuizBank : quizQuestions, ROUNDS, 'quiz');
    quiz.index = 0;
    quiz.score = 0;
    $('#quiz-score').textContent = '0 pts';
    showQuizRound();
  }
  function showQuizRound() {
    quiz.locked = false;
    const question = quiz.questions[quiz.index];
    $('#quiz-round').textContent = `${quiz.index + 1} / ${ROUNDS}`;
    quizStage.innerHTML = `<div class="question-wrap"><span class="question-label">${escapeHtml(t('question', { number: quiz.index + 1 }))}</span><h3 class="question-title">${escapeHtml(question.text)}</h3><div class="answers">${question.answers.map((answer, index) => `<button class="answer-btn" type="button" data-index="${index}">${escapeHtml(answer)}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p></div>`;
    quizStage.querySelectorAll('.answer-btn').forEach(button => button.addEventListener('click', () => answerQuiz(button, question)));
  }
  function answerQuiz(button, question) {
    if (quiz.locked) return;
    quiz.locked = true;
    const chosen = Number(button.dataset.index);
    const correct = chosen === question.correct;
    if (correct) quiz.score += 75;
    $('#quiz-score').textContent = `${quiz.score} pts`;
    quizStage.querySelectorAll('.answer-btn').forEach(item => {
      item.disabled = true;
      if (Number(item.dataset.index) === question.correct) item.classList.add('correct');
    });
    if (!correct) button.classList.add('wrong');
    const feedback = quizStage.querySelector('.feedback');
    feedback.className = `feedback ${correct ? 'good' : 'bad'}`;
    feedback.textContent = correct ? t('goodAnswer') : t('rightAnswer', { answer: question.answers[question.correct] });
    addNextButton(quizStage.querySelector('.question-wrap'), () => {
      quiz.index += 1;
      if (quiz.index >= ROUNDS) result(quizStage, 'TechnoQuiz', quiz.score, startQuiz);
      else showQuizRound();
    });
  }

  function addNextButton(container, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'primary-action next-action';
    button.textContent = t('next');
    button.addEventListener('click', action, { once: true });
    container.appendChild(button);
  }

  $('#game-language').addEventListener('change', event => {
    const next = event.target.value === 'en' ? 'en' : 'fr';
    localStorage.setItem('technorizon-lang', next);
    window.location.reload();
  });
  applyLanguage();
  $('#blind-start').addEventListener('click', () => startBlind(5));
  $('#blind-party').addEventListener('click', () => startBlind(25));
  $('#intox-start').addEventListener('click', startIntox);
  $('#quiz-start').addEventListener('click', startQuiz);
  renderProfile();
})();
