(() => {
  'use strict';

  const STORAGE_KEY = 'technorizon-games-v1';
  const ROUNDS = 5;

  const REGION_LANGUAGES = { fr:'fr', be:'fr', ch:'fr', gb:'en', us:'en', ca:'fr', de:'de', es:'es', it:'it', pt:'pt', nl:'nl' };
  const REGION_LOCALES = { fr:'fr-FR', be:'fr-BE', ch:'fr-CH', gb:'en-GB', us:'en-US', ca:'fr-CA', de:'de-DE', es:'es-ES', it:'it-IT', pt:'pt-PT', nl:'nl-NL' };
  const SUPPORTED_REGIONS = Object.keys(REGION_LANGUAGES);
  const savedLanguage = localStorage.getItem('technorizon-games-lang');
  let region = savedLanguage === 'en' ? 'gb' : savedLanguage;
  if (!SUPPORTED_REGIONS.includes(region)) region = 'fr';
  let lang = REGION_LANGUAGES[region];
  const I18N = {
    fr: {
      title: 'Jeux Technorizon — Blind Test, Hit ou Intox et TechnoQuiz',
      description: 'Jouez au Blind Test, à Hit ou Intox et au TechnoQuiz de Technorizon.fr.',
      home: "← Retour à l'accueil", info: 'ⓘ Infos', heroTitle: 'Choisis ton jeu.<br><span>Défie tes amis</span>',
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
      topPlayers: 'TOP JOUEURS', rankingTitle: 'Classements en ligne',
      rankingNote: '',
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
      blindPartyName: 'Blind Test Soirée', intoxGameName: 'Hit ou Intox'
    },
    en: {
      title: 'Technorizon Games — Blind Test, Hit or Myth and TechnoQuiz',
      description: 'Play Technorizon.fr’s Blind Test, Hit or Myth and TechnoQuiz.',
      home: '← Back to home', info: 'ⓘ Info', heroTitle: 'Choose your game.<br><span>Challenge your friends</span>',
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
      blindPartyName: 'Blind Test Party', intoxGameName: 'Hit or Myth'
    },
    de: {
      title: 'Technorizon Spiele — Blind Test, Hit oder Mythos und TechnoQuiz',
      description: 'Spiele den Blind Test, Hit oder Mythos und das TechnoQuiz von Technorizon.fr.',
      home: '← Zurück zur Startseite', info: 'ⓘ Infos', heroTitle: 'Wähle dein Spiel.<br><span>Fordere deine Freunde heraus</span>',
      heroText: 'Musik, Herausforderungen und Punkte in einer Spielhalle 100 % Technorizon',
      profileEyebrow: 'SPIELERPROFIL', profileTitle: 'Dein Benutzername', nickname: 'Benutzernamen eingeben', save: 'Speichern',
      points: 'Punkte', streak: 'Tage in Folge', games: 'Spiele',
      blindTab: '<span>🎧</span> Blind Test', intoxTab: '<span>⚡</span> Hit oder Mythos?', quizTab: '<span>🧠</span> TechnoQuiz',
      blindTitle: 'Technorizon Blind Test', blindLead: 'Höre den Ausschnitt und finde den Titel. Fünf Songs, vier Antworten, nur eine ist richtig.',
      blindIntro: 'Wähle deinen Modus. Die Ausschnitte dauern bis zu 15 Sekunden.',
      express: '<span>⚡</span><strong>Schnelles Spiel</strong><small>5 Ausschnitte · schnelle Runde</small>',
      party: '<span>🎉</span><strong>Abend mit Freunden</strong><small>25 Ausschnitte · der Reihe nach!</small>',
      trueFalse: 'WAHR ODER FALSCH', intoxLead: 'Eine Aussage über Musik erscheint. Entscheide, ob sie ein Hit… oder ein Mythos ist.',
      intoxIntro: 'Fünf Aussagen testen dein Musikwissen.', intoxStart: 'Hit oder Mythos spielen',
      electro: 'ELEKTRONISCHE MUSIK', quizLead: 'Künstler, Titel und Klassiker: fünf Fragen, um dein Wissen zu zeigen.',
      quizIntro: 'Jede richtige Antwort bringt 75 Punkte.', quizStart: 'TechnoQuiz starten',
      topPlayers: 'TOP-SPIELER', rankingTitle: 'Bestenliste auf diesem Gerät',
      rankingNote: 'Die globale Online-Bestenliste folgt nach der Freigabe dieser ersten Version.',
      footer: '© 2026 Technorizon.fr · Musik ohne Grenzen',
      emptyRanking: 'Sei der Erste in der Bestenliste!', pt: 'Pkt.', pts: 'Pkt.',
      finished: 'Spiel beendet!', added: 'Deine Punkte wurden dem Profil {name} hinzugefügt.', replay: 'Noch einmal spielen',
      preparing: 'Ausschnitt wird vorbereitet…', clip: 'AUSSCHNITT {number}', whatTitle: 'Wie heißt dieser Titel?',
      listen: '▶ Ausschnitt abspielen', pause: '❚❚ Pause', listenAgain: '▶ Ausschnitt erneut abspielen',
      audioError: 'Dieser Ausschnitt kann nicht abgespielt werden. Drücke auf Weiter.',
      unavailable: 'Ausschnitt vorübergehend nicht verfügbar', replaced: 'Dieser Titel wird automatisch ersetzt.',
      tryAnother: 'Anderen Ausschnitt versuchen', correctTrack: 'Richtig! {artist} — {title}', wasTrack: 'Es war {artist} — {title}',
      statement: 'AUSSAGE {number}', hitTrue: '🎯 HIT — Wahr', intoxFalse: '🚨 MYTHOS — Falsch',
      wellDone: 'Gut gemacht!', missed: 'Leider falsch!', exact: 'Richtig: {artist} spielt „{title}“.',
      falseDetail: 'Mythos: „{title}“ ist von {artist}.',
      trackBy: '„{title}“ ist von {artist}.', whoPerforms: 'Wer spielt „{title}“?',
      whichTitle: 'Welcher Titel ist von {artist}?', question: 'FRAGE {number}',
      goodAnswer: 'Richtige Antwort!', rightAnswer: 'Die richtige Antwort war: {answer}', next: 'Nächste Frage →',
      blindPartyName: 'Blind Test Party', intoxGameName: 'Hit oder Mythos'
    },
    es: {
      title: 'Juegos Technorizon — Blind Test, Hit o Mito y TechnoQuiz',
      description: 'Juega al Blind Test, Hit o Mito y TechnoQuiz de Technorizon.fr.',
      home: '← Volver al inicio', info: 'ⓘ Información', heroTitle: 'Elige tu juego.<br><span>Desafía a tus amigos</span>',
      heroText: 'Música, retos y puntos en una sala de juegos 100 % Technorizon',
      profileEyebrow: 'PERFIL DEL JUGADOR', profileTitle: 'Tu apodo', nickname: 'Escribe tu apodo', save: 'Guardar',
      points: 'puntos', streak: 'días seguidos', games: 'partidas',
      blindTab: '<span>🎧</span> Blind Test', intoxTab: '<span>⚡</span> ¿Hit o Mito?', quizTab: '<span>🧠</span> TechnoQuiz',
      blindTitle: 'Blind Test Technorizon', blindLead: 'Escucha el fragmento y encuentra el título. Cinco canciones, cuatro respuestas y solo una correcta.',
      blindIntro: 'Elige tu modo. Los fragmentos duran hasta 15 segundos.',
      express: '<span>⚡</span><strong>Partida rápida</strong><small>5 fragmentos · ronda rápida</small>',
      party: '<span>🎉</span><strong>Noche entre amigos</strong><small>25 fragmentos · ¡por turnos!</small>',
      trueFalse: 'VERDADERO O FALSO', intoxLead: 'Aparece una afirmación musical. Decide si es un hit… o un mito.',
      intoxIntro: 'Cinco afirmaciones para poner a prueba tu cultura musical.', intoxStart: 'Jugar a Hit o Mito',
      electro: 'CULTURA ELECTRÓNICA', quizLead: 'Artistas, títulos y clásicos: cinco preguntas para demostrar lo que sabes.',
      quizIntro: 'Cada respuesta correcta suma 75 puntos.', quizStart: 'Iniciar TechnoQuiz',
      topPlayers: 'MEJORES JUGADORES', rankingTitle: 'Clasificación en este dispositivo',
      rankingNote: 'La clasificación general en línea llegará tras validar esta primera versión.',
      footer: '© 2026 Technorizon.fr · La música sin fronteras',
      emptyRanking: '¡Sé el primero en la clasificación!', pt: 'pto.', pts: 'pts',
      finished: '¡Partida terminada!', added: 'Tus puntos se han añadido al perfil de {name}.', replay: 'Volver a jugar',
      preparing: 'Preparando el fragmento…', clip: 'FRAGMENTO {number}', whatTitle: '¿Cuál es este título?',
      listen: '▶ Escuchar el fragmento', pause: '❚❚ Pausa', listenAgain: '▶ Volver a escuchar',
      audioError: 'No se puede reproducir este fragmento. Pulsa Siguiente.',
      unavailable: 'Fragmento no disponible temporalmente', replaced: 'Esta canción se sustituirá automáticamente.',
      tryAnother: 'Probar otro fragmento', correctTrack: '¡Correcto! {artist} — {title}', wasTrack: 'Era {artist} — {title}',
      statement: 'AFIRMACIÓN {number}', hitTrue: '🎯 HIT — Verdadero', intoxFalse: '🚨 MITO — Falso',
      wellDone: '¡Bien visto!', missed: '¡Incorrecto!', exact: 'Correcto: {artist} interpreta «{title}».',
      falseDetail: 'Mito: «{title}» está interpretada por {artist}.',
      trackBy: '«{title}» está interpretada por {artist}.', whoPerforms: '¿Quién interpreta «{title}»?',
      whichTitle: '¿Qué canción interpreta {artist}?', question: 'PREGUNTA {number}',
      goodAnswer: '¡Respuesta correcta!', rightAnswer: 'La respuesta correcta era: {answer}', next: 'Siguiente pregunta →',
      blindPartyName: 'Blind Test Fiesta', intoxGameName: 'Hit o Mito'
    },
    it: {
      title: 'Giochi Technorizon — Blind Test, Hit o Mito e TechnoQuiz',
      description: 'Gioca al Blind Test, Hit o Mito e TechnoQuiz di Technorizon.fr.',
      home: '← Torna alla home', info: 'ⓘ Info', heroTitle: 'Scegli il tuo gioco.<br><span>Sfida i tuoi amici</span>',
      heroText: 'Musica, sfide e punti in una sala giochi 100% Technorizon',
      profileEyebrow: 'PROFILO GIOCATORE', profileTitle: 'Il tuo nickname', nickname: 'Inserisci il nickname', save: 'Salva',
      points: 'punti', streak: 'giorni di serie', games: 'partite',
      blindTab: '<span>🎧</span> Blind Test', intoxTab: '<span>⚡</span> Hit o Mito?', quizTab: '<span>🧠</span> TechnoQuiz',
      blindTitle: 'Blind Test Technorizon', blindLead: 'Ascolta l’estratto e trova il titolo. Cinque brani, quattro risposte, una sola corretta.',
      blindIntro: 'Scegli la modalità. Gli estratti durano fino a 15 secondi.',
      express: '<span>⚡</span><strong>Partita rapida</strong><small>5 estratti · sfida veloce</small>',
      party: '<span>🎉</span><strong>Serata tra amici</strong><small>25 estratti · a turno!</small>',
      trueFalse: 'VERO O FALSO', intoxLead: 'Appare un’affermazione musicale. Decidi se è un hit… o un mito.',
      intoxIntro: 'Cinque affermazioni per mettere alla prova la tua cultura musicale.', intoxStart: 'Gioca a Hit o Mito',
      electro: 'CULTURA ELETTRONICA', quizLead: 'Artisti, titoli e classici: cinque domande per mostrare ciò che sai.',
      quizIntro: 'Ogni risposta corretta vale 75 punti.', quizStart: 'Avvia TechnoQuiz',
      topPlayers: 'MIGLIORI GIOCATORI', rankingTitle: 'Classifica su questo dispositivo',
      rankingNote: 'La classifica generale online arriverà dopo la convalida di questa prima versione.',
      footer: '© 2026 Technorizon.fr · La musica senza frontiere',
      emptyRanking: 'Sii il primo in classifica!', pt: 'pt', pts: 'pt',
      finished: 'Partita terminata!', added: 'I tuoi punti sono stati aggiunti al profilo di {name}.', replay: 'Gioca ancora',
      preparing: 'Preparazione dell’estratto…', clip: 'ESTRATTO {number}', whatTitle: 'Qual è questo titolo?',
      listen: '▶ Ascolta l’estratto', pause: '❚❚ Pausa', listenAgain: '▶ Riascolta l’estratto',
      audioError: 'Impossibile riprodurre questo estratto. Premi Avanti.',
      unavailable: 'Estratto temporaneamente non disponibile', replaced: 'Questo brano verrà sostituito automaticamente.',
      tryAnother: 'Prova un altro estratto', correctTrack: 'Corretto! {artist} — {title}', wasTrack: 'Era {artist} — {title}',
      statement: 'AFFERMAZIONE {number}', hitTrue: '🎯 HIT — Vero', intoxFalse: '🚨 MITO — Falso',
      wellDone: 'Ben fatto!', missed: 'Sbagliato!', exact: 'Esatto: {artist} interpreta «{title}».',
      falseDetail: 'Mito: «{title}» è interpretato da {artist}.',
      trackBy: '«{title}» è interpretato da {artist}.', whoPerforms: 'Chi interpreta «{title}»?',
      whichTitle: 'Quale brano è interpretato da {artist}?', question: 'DOMANDA {number}',
      goodAnswer: 'Risposta corretta!', rightAnswer: 'La risposta corretta era: {answer}', next: 'Domanda successiva →',
      blindPartyName: 'Blind Test Serata', intoxGameName: 'Hit o Mito'
    },
    pt: {
      title: 'Jogos Technorizon — Blind Test, Hit ou Mito e TechnoQuiz',
      description: 'Jogue o Blind Test, Hit ou Mito e TechnoQuiz da Technorizon.fr.',
      home: '← Voltar ao início', info: 'ⓘ Informações', heroTitle: 'Escolhe o teu jogo.<br><span>Desafia os teus amigos</span>',
      heroText: 'Música, desafios e pontos numa sala de jogos 100% Technorizon',
      profileEyebrow: 'PERFIL DO JOGADOR', profileTitle: 'O teu nome', nickname: 'Introduz o teu nome', save: 'Guardar',
      points: 'pontos', streak: 'dias seguidos', games: 'partidas',
      blindTab: '<span>🎧</span> Blind Test', intoxTab: '<span>⚡</span> Hit ou Mito?', quizTab: '<span>🧠</span> TechnoQuiz',
      blindTitle: 'Blind Test Technorizon', blindLead: 'Ouve o excerto e encontra o título. Cinco músicas, quatro respostas e apenas uma correta.',
      blindIntro: 'Escolhe o modo. Os excertos duram até 15 segundos.',
      express: '<span>⚡</span><strong>Partida rápida</strong><small>5 excertos · ronda rápida</small>',
      party: '<span>🎉</span><strong>Noite entre amigos</strong><small>25 excertos · cada um na sua vez!</small>',
      trueFalse: 'VERDADEIRO OU FALSO', intoxLead: 'Surge uma afirmação musical. Decide se é um hit… ou um mito.',
      intoxIntro: 'Cinco afirmações para testar a tua cultura musical.', intoxStart: 'Jogar Hit ou Mito',
      electro: 'CULTURA ELETRÓNICA', quizLead: 'Artistas, títulos e clássicos: cinco perguntas para mostrares o que sabes.',
      quizIntro: 'Cada resposta correta vale 75 pontos.', quizStart: 'Iniciar TechnoQuiz',
      topPlayers: 'MELHORES JOGADORES', rankingTitle: 'Classificação neste dispositivo',
      rankingNote: 'A classificação geral online chegará após a validação desta primeira versão.',
      footer: '© 2026 Technorizon.fr · A música sem fronteiras',
      emptyRanking: 'Sê o primeiro na classificação!', pt: 'pt', pts: 'pts',
      finished: 'Partida terminada!', added: 'Os teus pontos foram adicionados ao perfil de {name}.', replay: 'Jogar novamente',
      preparing: 'A preparar o excerto…', clip: 'EXCERTO {number}', whatTitle: 'Qual é este título?',
      listen: '▶ Ouvir o excerto', pause: '❚❚ Pausa', listenAgain: '▶ Ouvir novamente',
      audioError: 'Não foi possível reproduzir este excerto. Carrega em Seguinte.',
      unavailable: 'Excerto temporariamente indisponível', replaced: 'Esta música será substituída automaticamente.',
      tryAnother: 'Tentar outro excerto', correctTrack: 'Correto! {artist} — {title}', wasTrack: 'Era {artist} — {title}',
      statement: 'AFIRMAÇÃO {number}', hitTrue: '🎯 HIT — Verdadeiro', intoxFalse: '🚨 MITO — Falso',
      wellDone: 'Muito bem!', missed: 'Errado!', exact: 'Correto: {artist} interpreta «{title}».',
      falseDetail: 'Mito: «{title}» é interpretado por {artist}.',
      trackBy: '«{title}» é interpretado por {artist}.', whoPerforms: 'Quem interpreta «{title}»?',
      whichTitle: 'Que música é interpretada por {artist}?', question: 'PERGUNTA {number}',
      goodAnswer: 'Resposta correta!', rightAnswer: 'A resposta correta era: {answer}', next: 'Pergunta seguinte →',
      blindPartyName: 'Blind Test Festa', intoxGameName: 'Hit ou Mito'
    },
    nl: {
      title: 'Technorizon Games — Blind Test, Hit of Mythe en TechnoQuiz',
      description: 'Speel de Blind Test, Hit of Mythe en TechnoQuiz van Technorizon.fr.',
      home: '← Terug naar home', info: 'ⓘ Info', heroTitle: 'Kies je spel.<br><span>Daag je vrienden uit</span>',
      heroText: 'Muziek, uitdagingen en punten in een 100% Technorizon-speelhal',
      profileEyebrow: 'SPELERS PROFIEL', profileTitle: 'Je bijnaam', nickname: 'Vul je bijnaam in', save: 'Opslaan',
      points: 'punten', streak: 'dagen op rij', games: 'spellen',
      blindTab: '<span>🎧</span> Blind Test', intoxTab: '<span>⚡</span> Hit of Mythe?', quizTab: '<span>🧠</span> TechnoQuiz',
      blindTitle: 'Technorizon Blind Test', blindLead: 'Luister naar het fragment en vind de titel. Vijf nummers, vier antwoorden, slechts één is juist.',
      blindIntro: 'Kies je modus. Fragmenten duren maximaal 15 seconden.',
      express: '<span>⚡</span><strong>Snel spel</strong><small>5 fragmenten · snelle ronde</small>',
      party: '<span>🎉</span><strong>Avond met vrienden</strong><small>25 fragmenten · om de beurt!</small>',
      trueFalse: 'WAAR OF ONWAAR', intoxLead: 'Er verschijnt een muziekstelling. Bepaal of het een hit… of een mythe is.',
      intoxIntro: 'Vijf stellingen om je muziekkennis te testen.', intoxStart: 'Speel Hit of Mythe',
      electro: 'ELEKTRONISCHE MUZIEK', quizLead: 'Artiesten, titels en klassiekers: vijf vragen om je kennis te tonen.',
      quizIntro: 'Elk goed antwoord levert 75 punten op.', quizStart: 'Start TechnoQuiz',
      topPlayers: 'TOPSPELERS', rankingTitle: 'Ranglijst op dit apparaat',
      rankingNote: 'De algemene online ranglijst volgt na goedkeuring van deze eerste versie.',
      footer: '© 2026 Technorizon.fr · Muziek zonder grenzen',
      emptyRanking: 'Wees de eerste in de ranglijst!', pt: 'pt', pts: 'pt',
      finished: 'Spel afgelopen!', added: 'Je punten zijn toegevoegd aan het profiel van {name}.', replay: 'Opnieuw spelen',
      preparing: 'Fragment voorbereiden…', clip: 'FRAGMENT {number}', whatTitle: 'Welk nummer is dit?',
      listen: '▶ Fragment afspelen', pause: '❚❚ Pauze', listenAgain: '▶ Fragment opnieuw afspelen',
      audioError: 'Dit fragment kan niet worden afgespeeld. Druk op Volgende.',
      unavailable: 'Fragment tijdelijk niet beschikbaar', replaced: 'Dit nummer wordt automatisch vervangen.',
      tryAnother: 'Probeer een ander fragment', correctTrack: 'Juist! {artist} — {title}', wasTrack: 'Het was {artist} — {title}',
      statement: 'STELLING {number}', hitTrue: '🎯 HIT — Waar', intoxFalse: '🚨 MYTHE — Onwaar',
      wellDone: 'Goed gezien!', missed: 'Helaas fout!', exact: 'Juist: {artist} voert “{title}” uit.',
      falseDetail: 'Mythe: “{title}” wordt uitgevoerd door {artist}.',
      trackBy: '“{title}” wordt uitgevoerd door {artist}.', whoPerforms: 'Wie voert “{title}” uit?',
      whichTitle: 'Welk nummer wordt uitgevoerd door {artist}?', question: 'VRAAG {number}',
      goodAnswer: 'Goed antwoord!', rightAnswer: 'Het juiste antwoord was: {answer}', next: 'Volgende vraag →',
      blindPartyName: 'Blind Test Feest', intoxGameName: 'Hit of Mythe'
    }
  };
  const JAYA_HOST = {
    fr: { label: 'JAYA · MAÎTRESSE DE JEU', blindAsk: 'Écoute bien cet extrait… Sauras-tu retrouver le titre ?', correct: 'Bien joué ! Tu as trouvé 😎', wrong: 'Presque ! Regarde bien la bonne réponse 😉', finished: 'Partie terminée ! Voyons ton score.' },
    en: { label: 'JAYA · GAME HOST', blindAsk: 'Listen carefully… Can you name this track?', correct: 'Well played! You got it 😎', wrong: 'Almost! Take a look at the correct answer 😉', finished: 'Game over! Let’s see your score.' },
    de: { label: 'JAYA · SPIELLEITERIN', blindAsk: 'Hör gut zu… Erkennst du diesen Titel?', correct: 'Gut gespielt! Das ist richtig 😎', wrong: 'Fast! Schau dir die richtige Antwort an 😉', finished: 'Spiel beendet! Sehen wir uns deinen Punktestand an.' },
    es: { label: 'JAYA · PRESENTADORA', blindAsk: 'Escucha bien… ¿Sabrás reconocer este tema?', correct: '¡Bien jugado! Has acertado 😎', wrong: '¡Casi! Mira la respuesta correcta 😉', finished: '¡Partida terminada! Veamos tu puntuación.' },
    it: { label: 'JAYA · CONDUTTRICE', blindAsk: 'Ascolta bene… Riconoscerai questo brano?', correct: 'Ottimo! Hai indovinato 😎', wrong: 'Quasi! Guarda la risposta corretta 😉', finished: 'Partita terminata! Vediamo il tuo punteggio.' },
    pt: { label: 'JAYA · APRESENTADORA', blindAsk: 'Ouve com atenção… Consegues reconhecer este título?', correct: 'Muito bem! Acertaste 😎', wrong: 'Quase! Vê a resposta correta 😉', finished: 'Jogo terminado! Vamos ver a tua pontuação.' },
    nl: { label: 'JAYA · SPELLEIDER', blindAsk: 'Luister goed… Herken jij dit nummer?', correct: 'Goed gespeeld! Dat is juist 😎', wrong: 'Bijna! Bekijk het juiste antwoord 😉', finished: 'Spel afgelopen! Laten we je score bekijken.' }
  };
  const jayaCopy = key => (JAYA_HOST[lang] || JAYA_HOST.fr)[key];
  const jayaHost = (message, mood = 'ask') => `<div class="jaya-game-host ${mood}"><img class="jaya-game-avatar" src="/JayaV2.jpg" alt="Jaya"><div class="jaya-game-bubble"><span class="jaya-game-name">${escapeHtml(jayaCopy('label'))}</span><p class="jaya-game-text">${escapeHtml(message)}</p></div></div>`;
  function setJayaReaction(stage, correct) {
    const host = stage.querySelector('.jaya-game-host');
    if (!host) return;
    host.classList.remove('ask', 'correct', 'wrong');
    host.classList.add(correct ? 'correct' : 'wrong');
    const message = host.querySelector('.jaya-game-text');
    if (message) message.textContent = jayaCopy(correct ? 'correct' : 'wrong');
  }

  const t = (key, vars = {}) => (I18N[lang][key] || key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
  const setText = (selector, key) => { const node = document.querySelector(selector); if (node) node.textContent = t(key); };
  const setHtml = (selector, key) => { const node = document.querySelector(selector); if (node) node.innerHTML = t(key); };
  function applyLanguage() {
    document.documentElement.lang = REGION_LOCALES[region];
    document.title = t('title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = t('description');
    const picker = document.querySelector('#game-language');
    if (picker) picker.value = region;
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

  const createHitIntoxBank = () => blindTracks.flatMap((track, index, tracks) => {
    const sameDecade = tracks.filter(item => decadeOf(item) === decadeOf(track) && item.id !== track.id);
    const wrongArtist = (sameDecade[(index + 7) % Math.max(1, sameDecade.length)] || tracks[(index + 17) % tracks.length]).artist;
    const wrongTitle = (sameDecade[(index + 13) % Math.max(1, sameDecade.length)] || tracks[(index + 29) % tracks.length]).title;
    const decade = decadeOf(track);
    const otherDecades = DECADES.filter(item => item !== 'all' && item !== decade);
    const wrongDecade = otherDecades[index % otherDecades.length];
    return [
      { id: `hit-artist-true-${track.id}`, decade, text: `« ${track.title} » est interprété par ${track.artist}.`, answer: true, detail: `Exact : « ${track.title} » est bien interprété par ${track.artist}.` },
      { id: `hit-artist-false-${track.id}`, decade, text: `« ${track.title} » est interprété par ${wrongArtist}.`, answer: false, detail: `Intox : « ${track.title} » est interprété par ${track.artist}.` },
      { id: `hit-title-false-${track.id}`, decade, text: `${track.artist} interprète « ${wrongTitle} ».`, answer: false, detail: `Intox : le titre retenu ici est « ${track.title} » de ${track.artist}.` },
      { id: `hit-decade-true-${track.id}`, decade, text: `Cette version de « ${track.title} » de ${track.artist} appartient aux ${decadeLabel(decade)}.`, answer: true, detail: `Exact : cette version est classée dans les ${decadeLabel(decade)}.` },
      { id: `hit-decade-false-${track.id}`, decade, text: `Cette version de « ${track.title} » de ${track.artist} appartient aux ${decadeLabel(wrongDecade)}.`, answer: false, detail: `Intox : cette version est classée dans les ${decadeLabel(decade)}.` }
    ];
  });

  const makeQuiz = (id, decade, text, correctAnswer, alternatives) => {
    const answers = shuffle([correctAnswer, ...alternatives.filter(item => item !== correctAnswer).slice(0, 3)]);
    return { id, decade, text, answers, correct: answers.indexOf(correctAnswer) };
  };

  const createTechnoQuizBank = () => blindTracks.flatMap((track, index, tracks) => {
    const decade = decadeOf(track);
    const sameDecade = tracks.filter(item => decadeOf(item) === decade && item.id !== track.id);
    const artists = [...new Set(sameDecade.map(item => item.artist).filter(item => item !== track.artist))];
    const titles = [...new Set(sameDecade.map(item => item.title).filter(item => item !== track.title))];
    const otherDecades = DECADES.filter(item => item !== 'all' && item !== decade);
    const artistAlts = sample(artists, 3);
    const titleAlts = sample(titles, 3);
    const decadeAlts = sample(otherDecades, 3);
    const reverseTitleAlts = sample(titles.slice().reverse(), 3);
    return [
      makeQuiz(`quiz-artist-${track.id}`, decade, `Qui interprète « ${track.title} » ?`, track.artist, artistAlts),
      makeQuiz(`quiz-title-${track.id}`, decade, `Quel titre de ${track.artist} figure dans la sélection Technorizon ?`, track.title, titleAlts),
      makeQuiz(`quiz-decade-${track.id}`, decade, `À quelle décennie appartient cette version de « ${track.title} » ?`, decadeLabel(decade), decadeAlts.map(decadeLabel)),
      makeQuiz(`quiz-match-${track.id}`, decade, `Lequel de ces titres correspond à ${track.artist} ?`, track.title, reverseTitleAlts)
    ];
  });

  const $ = selector => document.querySelector(selector);
  const shuffle = list => [...list].sort(() => Math.random() - 0.5);
  const sample = (list, count) => shuffle(list).slice(0, count);
  const DECADES = ['all', '80s', '90s', '2000s', '2010s', '2020s'];
  const decadeState = { blind: 'all', intox: 'all', quiz: 'all' };
  const decadeOf = track => track.decade || 'all';
  const tracksForDecade = decade => decade === 'all' ? blindTracks : blindTracks.filter(track => decadeOf(track) === decade);
  const questionsForDecade = (bank, decade) => decade === 'all' ? bank : bank.filter(question => question.decade === decade);
  const decadeLabel = decade => ({ all: 'Toutes époques', '80s': '80’s', '90s': '90’s', '2000s': '2000’s', '2010s': '2010’s', '2020s': '2020’s' }[decade] || decade);
  function setDecade(game, decade) {
    if (!DECADES.includes(decade)) return;
    decadeState[game] = decade;
    document.querySelectorAll(`[data-decade-game="${game}"] .decade-btn`).forEach(button => {
      const active = button.dataset.decade === decade;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  document.querySelectorAll('.decade-picker').forEach(picker => picker.addEventListener('click', event => {
    const button = event.target.closest('.decade-btn');
    if (button) setDecade(picker.dataset.decadeGame, button.dataset.decade);
  }));
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

  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  const GAME_KEYS = { 'Blind Test': 'blind', 'Blind Test Soirée': 'blind', 'Blind Test Party': 'blind', 'Hit ou Intox': 'intox', 'Hit or Myth': 'intox', 'TechnoQuiz': 'quiz' };

  function rankingRow(row, index) {
    const medals = ['🥇','🥈','🥉'];
    return `<li><span class="ranking-rank">${medals[index] || index + 1}</span><span class="ranking-name">${escapeHtml(row.player_name)}</span><strong class="ranking-points">${Number(row.score) || 0} pts</strong></li>`;
  }

  async function loadOnlineRankings() {
    const status = $('#ranking-status');
    try {
      const games = ['blind', 'intox', 'quiz'];
      const results = await Promise.all(games.map(async game => {
        const response = await fetch(`/api/game-leaderboard?game=${game}&limit=10`, { cache: 'no-store' });
        if (!response.ok) throw new Error('leaderboard');
        return [game, await response.json()];
      }));
      results.forEach(([game, data]) => {
        const list = $(`#ranking-${game}`);
        const rows = Array.isArray(data.items) ? data.items : [];
        list.innerHTML = rows.length
          ? rows.map(rankingRow).join('')
          : `<li><span class="ranking-rank">–</span><span class="ranking-name">${escapeHtml(t('emptyRanking'))}</span><strong class="ranking-points">0 ${t('pt')}</strong></li>`;
      });
      if (status) status.textContent = '';
    } catch {
      if (status) status.textContent = 'Classements momentanément indisponibles.';
    }
  }

  let fullRankingGame = 'blind';
  let fullRankingOffset = 0;
  const FULL_RANKING_PAGE = 50;

  function fullRankingRow(row) {
    const rank = Number(row.rank) || 0;
    const medals = ['🥇','🥈','🥉'];
    const mine = player.name && String(row.player_name).toLocaleLowerCase() === player.name.toLocaleLowerCase();
    return `<li class="${mine ? 'is-me' : ''}"><span class="ranking-rank">${medals[rank - 1] || rank}</span><span class="ranking-name">${escapeHtml(row.player_name)}</span><strong class="ranking-points">${Number(row.score) || 0} pts</strong></li>`;
  }

  async function fetchFullRanking({ reset = false, search = '' } = {}) {
    const list = $('#full-ranking-list');
    const status = $('#full-ranking-status');
    const more = $('#load-more-ranking');
    if (reset) { fullRankingOffset = 0; list.innerHTML = ''; }
    status.textContent = 'Chargement…';
    try {
      const params = new URLSearchParams({ game: fullRankingGame, limit: String(FULL_RANKING_PAGE), offset: String(fullRankingOffset), full: '1' });
      if (player.name) params.set('me', player.name);
      if (search) params.set('search', search);
      const response = await fetch('/api/game-leaderboard?' + params, { cache: 'no-store' });
      if (!response.ok) throw new Error('leaderboard');
      const data = await response.json();
      const rows = Array.isArray(data.items) ? data.items : [];
      if (reset && !rows.length) list.innerHTML = '<li><span class="ranking-rank">–</span><span class="ranking-name">Aucun joueur trouvé</span><strong class="ranking-points">0 pt</strong></li>';
      else list.insertAdjacentHTML('beforeend', rows.map(fullRankingRow).join(''));
      fullRankingOffset += rows.length;
      more.hidden = Boolean(search) || rows.length < FULL_RANKING_PAGE;
      status.textContent = data.total ? `${data.total} joueur${data.total > 1 ? 's' : ''} classé${data.total > 1 ? 's' : ''}` : '';
      const mine = $('#my-ranking-position');
      if (data.me && data.me.rank) mine.textContent = `🏁 Ma position : ${data.me.rank}e sur ${data.total} · ${data.me.score} pts`;
      else mine.textContent = '';
    } catch {
      status.textContent = 'Classement momentanément indisponible.';
    }
  }

  $('#open-full-ranking')?.addEventListener('click', () => {
    $('#full-ranking').hidden = false;
    $('#full-ranking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    fetchFullRanking({ reset: true });
  });
  $('#close-full-ranking')?.addEventListener('click', () => { $('#full-ranking').hidden = true; });
  document.querySelectorAll('.full-ranking-tab').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.full-ranking-tab').forEach(item => item.classList.toggle('active', item === button));
    fullRankingGame = button.dataset.rankingGame;
    $('#ranking-search').value = '';
    fetchFullRanking({ reset: true });
  }));
  $('#ranking-search-form')?.addEventListener('submit', event => {
    event.preventDefault();
    fetchFullRanking({ reset: true, search: cleanName($('#ranking-search').value) });
  });
  $('#load-more-ranking')?.addEventListener('click', () => fetchFullRanking());

  async function submitOnlineScore(gameName, score) {
    const game = GAME_KEYS[gameName] || (String(gameName).toLowerCase().includes('blind') ? 'blind' : null);
    if (!game || !player.name || !score) return;
    try {
      const response = await fetch('/api/game-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: player.name, game, score })
      });
      if (response.ok) await loadOnlineRankings();
    } catch {}
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
    submitOnlineScore(game, score);
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
    stage.innerHTML = `${jayaHost(jayaCopy('finished'), 'finish')}<div class="result-score">${score}</div><h3 class="result-title">${escapeHtml(t('finished'))}</h3><p class="result-text">${escapeHtml(t('added', { name: player.name }))}</p><button class="primary-action" type="button">${escapeHtml(t('replay'))}</button>`;
    stage.querySelector('button').addEventListener('click', restart);
  }

  // Chronomètre anti-triche : 10 secondes par question
  let questionTimer = null;
  function stopQuestionTimer() {
    if (questionTimer) clearInterval(questionTimer);
    questionTimer = null;
  }
  function startQuestionTimer(stage, onTimeout) {
    stopQuestionTimer();
    const wrap = stage.querySelector('.question-wrap');
    if (!wrap) return;
    const timer = document.createElement('div');
    timer.className = 'question-timer';
    timer.innerHTML = '<span class="timer-label">⏱ <strong>10</strong>s</span><span class="timer-track"><span class="timer-fill"></span></span>';
    wrap.insertBefore(timer, wrap.firstChild);
    const value = timer.querySelector('strong');
    const fill = timer.querySelector('.timer-fill');
    let remaining = 10;
    questionTimer = setInterval(() => {
      remaining -= 1;
      if (value) value.textContent = String(Math.max(0, remaining));
      if (fill) fill.style.width = Math.max(0, remaining * 10) + '%';
      if (remaining <= 0) {
        stopQuestionTimer();
        onTimeout();
      }
    }, 1000);
  }
  function timeoutRound(stage, state, correctSelector, feedbackText, nextAction) {
    if (state.locked) return;
    state.locked = true;
    stage.querySelectorAll('.answer-btn').forEach(item => {
      item.disabled = true;
      if (correctSelector(item)) item.classList.add('correct');
    });
    const feedback = stage.querySelector('.feedback');
    if (feedback) {
      feedback.className = 'feedback bad';
      feedback.textContent = feedbackText;
    }
    setJayaReaction(stage, false);
    addNextButton(stage.querySelector('.question-wrap'), nextAction);
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
    const pool = tracksForDecade(decadeState.blind);
    if (pool.length < blind.total) return;
    blind.questions = drawUnseen(pool, blind.total, `blind-${decadeState.blind}`);
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
      const alternatives = sample(tracksForDecade(decadeState.blind).filter(item => item.title !== track.title), 3).map(item => item.title);
      const answers = shuffle([track.title, ...alternatives]);
      blindStage.innerHTML = `<div class="question-wrap"><span class="question-label">${escapeHtml(t('clip', { number: blind.index + 1 }))}</span>${jayaHost(jayaCopy('blindAsk'))}<button class="audio-action" type="button">${escapeHtml(t('listen'))}</button><div class="answers">${answers.map(answer => `<button class="answer-btn" type="button" data-answer="${escapeHtml(answer)}">${escapeHtml(answer)}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p></div>`;
      const play = blindStage.querySelector('.audio-action');
      let timerStarted = false;
      const startBlindTimer = () => {
        if (timerStarted) return;
        timerStarted = true;
        startQuestionTimer(blindStage, () => {
          stopBlindAudio();
          timeoutRound(blindStage, blind, item => item.dataset.answer === track.title, 'Temps écoulé !', () => {
            blind.index += 1;
            if (blind.index >= blind.total) result(blindStage, blind.total === 25 ? t('blindPartyName') : 'Blind Test', blind.score, () => startBlind(blind.total));
            else loadBlindRound();
          });
        });
      };
      play.addEventListener('click', async () => {
        try {
          if (blindAudio.paused) {
            await blindAudio.play();
            startBlindTimer();
            play.textContent = t('pause');
            play.classList.add('playing');
          } else {
            blindAudio.pause();
            play.textContent = t('listenAgain');
            play.classList.remove('playing');
          }
        } catch { blindStage.querySelector('.feedback').textContent = t('audioError'); }
      });
      blindAudio.ontimeupdate = () => {
        if (blindAudio.currentTime >= 15) { blindAudio.pause(); play.textContent = t('listenAgain'); play.classList.remove('playing'); }
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
    stopQuestionTimer();
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
    setJayaReaction(blindStage, correct);
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
    const pool = questionsForDecade(hitIntoxBank, decadeState.intox);
    intox.questions = drawUnseen(pool.length >= ROUNDS ? pool : intoxQuestions, ROUNDS, `intox-${decadeState.intox}`);
    intox.index = 0;
    intox.score = 0;
    $('#intox-score').textContent = '0 pts';
    showIntoxRound();
  }
  function showIntoxRound() {
    intox.locked = false;
    const question = intox.questions[intox.index];
    $('#intox-round').textContent = `${intox.index + 1} / ${ROUNDS}`;
    intoxStage.innerHTML = `<div class="question-wrap"><span class="question-label">${escapeHtml(t('statement', { number: intox.index + 1 }))}</span>${jayaHost(question.text)}<div class="answers"><button class="answer-btn" type="button" data-value="true">${escapeHtml(t('hitTrue'))}</button><button class="answer-btn" type="button" data-value="false">${escapeHtml(t('intoxFalse'))}</button></div><p class="feedback" aria-live="polite"></p></div>`;
    intoxStage.querySelectorAll('.answer-btn').forEach(button => button.addEventListener('click', () => answerIntox(button, question)));
    startQuestionTimer(intoxStage, () => timeoutRound(intoxStage, intox, item => (item.dataset.value === 'true') === question.answer, 'Temps écoulé ! ' + question.detail, () => {
      intox.index += 1;
      if (intox.index >= ROUNDS) result(intoxStage, t('intoxGameName'), intox.score, startIntox);
      else showIntoxRound();
    }));
  }
  function answerIntox(button, question) {
    if (intox.locked) return;
    stopQuestionTimer();
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
    setJayaReaction(intoxStage, correct);
    addNextButton(intoxStage.querySelector('.question-wrap'), () => {
      intox.index += 1;
      if (intox.index >= ROUNDS) result(intoxStage, t('intoxGameName'), intox.score, startIntox);
      else showIntoxRound();
    });
  }

  // TechnoQuiz
  const quiz = { questions: [], index: 0, score: 0, locked: false };
  const quizStage = $('#quiz-stage');
  function startQuiz() {
    if (!ensureProfile()) return;
    const pool = questionsForDecade(technoQuizBank, decadeState.quiz);
    quiz.questions = drawUnseen(pool.length >= ROUNDS ? pool : quizQuestions, ROUNDS, `quiz-${decadeState.quiz}`);
    quiz.index = 0;
    quiz.score = 0;
    $('#quiz-score').textContent = '0 pts';
    showQuizRound();
  }
  function showQuizRound() {
    quiz.locked = false;
    const question = quiz.questions[quiz.index];
    $('#quiz-round').textContent = `${quiz.index + 1} / ${ROUNDS}`;
    quizStage.innerHTML = `<div class="question-wrap"><span class="question-label">${escapeHtml(t('question', { number: quiz.index + 1 }))}</span>${jayaHost(question.text)}<div class="answers">${question.answers.map((answer, index) => `<button class="answer-btn" type="button" data-index="${index}">${escapeHtml(answer)}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p></div>`;
    quizStage.querySelectorAll('.answer-btn').forEach(button => button.addEventListener('click', () => answerQuiz(button, question)));
    startQuestionTimer(quizStage, () => timeoutRound(quizStage, quiz, item => Number(item.dataset.index) === question.correct, 'Temps écoulé ! ' + t('rightAnswer', { answer: question.answers[question.correct] }), () => {
      quiz.index += 1;
      if (quiz.index >= ROUNDS) result(quizStage, 'TechnoQuiz', quiz.score, startQuiz);
      else showQuizRound();
    }));
  }
  function answerQuiz(button, question) {
    if (quiz.locked) return;
    stopQuestionTimer();
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
    setJayaReaction(quizStage, correct);
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
    const next = SUPPORTED_REGIONS.includes(event.target.value) ? event.target.value : 'fr';
    localStorage.setItem('technorizon-games-lang', next);
    window.location.reload();
  });
  applyLanguage();
  $('#blind-start').addEventListener('click', () => startBlind(5));
  $('#blind-party').addEventListener('click', () => startBlind(25));
  $('#intox-start').addEventListener('click', startIntox);
  $('#quiz-start').addEventListener('click', startQuiz);
  renderProfile();
  loadOnlineRankings();
})();
