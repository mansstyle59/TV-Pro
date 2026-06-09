import { EpgProgramme } from "../types";

// Dynamic French EPG program templates mapped by core stream keyword or name
const TEMPLATES: Record<string, { title: string; category: string; desc: string }[]> = {
  tf1: [
    { title: "TF1 Matin & Téléachat", category: "Magazine", desc: "Toute l'actualité de votre réveil suivie de votre émission favorite de shopping." },
    { title: "Les Feux de l'Amour", category: "Série", desc: "Épisode inédit de votre saga quotidienne préférée dans la ville de Genoa City." },
    { title: "Les 12 Coups de Midi !", category: "Jeu", desc: "Jean-Luc Reichmann anime ce jeu de questions-réponses pour démasquer le mystérieux Maître de Midi." },
    { title: "Le Journal de 13 Heures", category: "Actualités", desc: "Toute l'actualité nationale, le terroir français, l'Europe et la météo complète du jour." },
    { title: "Familles Nombreuses : La Vie en XXL", category: "Documentaire", desc: "Plongez dans le quotidien hors normes de mamans et papas à la tête de familles extraordinaires." },
    { title: "Ici Tout Commence", category: "Série", desc: "Les intrigues amoureuses, culinaires et professionnelles des élèves de l'institut Auguste Armand." },
    { title: "Demain Nous Appartient", category: "Série", desc: "Le quotidien mouvementé et policier des habitants de la ville portuaire de Sète." },
    { title: "Le Journal de 20 Heures", category: "Actualités", desc: "L'édition phare de l'information présentée avec rigueur, reportages immersifs et invités de prestige." },
    { title: "Koh-Lanta : Les Armes Secrètes", category: "Divertissement", desc: "Les aventuriers s'affrontent sur l'île dans des épreuves d'immunité et de confort mémorables." },
    { title: "Vendredi Tout Est Permis", category: "Divertissement", desc: "Émission d'humour et d'improvisation avec des invités du cinéma, de la scène et du web." },
    { title: "Nuit de Musique TF1", category: "Musique", desc: "Sélection des meilleurs clips français et internationaux pour finir la nuit en douceur." }
  ],
  france2: [
    { title: "Télématin", category: "Magazine", desc: "La première matinale de France avec des journaux toutes les demi-heures, des invités et de la culture." },
    { title: "Maison Lumni", category: "Éducation", desc: "Cours académiques interactifs présentés par des professeurs de l'Éducation Nationale." },
    { title: "Tout le Monde Veut Prendre Sa Place", category: "Jeu", desc: "Un grand jeu de culture générale où des challengers tentent de détrôner le champion assis sur son fauteuil." },
    { title: "Journal de 13 Heures", category: "Actualités", desc: "Le point complet sur l'actualité en France et à l'étranger présenté par la rédaction de France Télévisions." },
    { title: "Ça Commence Aujourd'hui", category: "Débat", desc: "Faustine Bollaert donne la parole à des invités venus témoigner de parcours de vie singuliers ou inspirants." },
    { title: "Affaire Conclue : Tout le monde a quelque chose à vendre", category: "Magazine", desc: "Des propriétaires font expertiser leurs objets par des commissaires-priseurs avant d'affronter des acheteurs exigeants." },
    { title: "N'oubliez pas les paroles !", category: "Jeu", desc: "Tarif et orchestre en live ! Des passionnés de chanson s'affrontent en karaoké pour remporter le micro d'argent." },
    { title: "Le Journal de 20 Heures", category: "Actualités", desc: "Le grand rendez-vous d'information nationale et internationale avec enquêtes exclusives et grand angle de la rédaction." },
    { title: "Un Si Grand Soleil", category: "Série", desc: "Les destins croisés de familles montpelliéraines entre secrets criminels, amours de jeunesse et affaires de cœur." },
    { title: "Les Petits Meurtres d'Agatha Christie", category: "Série", desc: "Des enquêtes policières rétro pleines d'humour inspirées des célèbres romans de la reine du crime." },
    { title: "On n'est pas couché : Le Best-of", category: "Talk-Show", desc: "Revue insolite et piquante de l'actualité culturelle et politique française de la semaine passée." }
  ],
  france3: [
    { title: "Okoo Animation", category: "Jeunesse", desc: "Le meilleur des dessins animés éducatifs et funs pour le réveil des plus jeunes." },
    { title: "Météo à la Carte", category: "Magazine", desc: "Une émission interactive qui décrypte l'impact de la météo sur notre santé, nos habitudes et notre patrimoine gastronome." },
    { title: "Rex : Chien Flic", category: "Série", desc: "Le célèbre berger allemand Rex et son coéquipier policier résolvent les affaires criminelles les plus coriaces de Vienne." },
    { title: "Slam", category: "Jeu", desc: "Cyril Féraud anime ce jeu de grilles de mots croisés dynamique associant dictionnaire et culture." },
    { title: "Questions pour un Champion", category: "Jeu", desc: "Le jeu mythique de culture générale et de buzzers ultra-rapides présenté par Samuel Étienne." },
    { title: "Le 19/20 National & Régional", category: "Actualités", desc: "Toute l'actualité de votre région suivie des informations nationales et économiques." },
    { title: "Plus Belle La Vie, Encore Plus Belle", category: "Série", desc: "Les histoires d'amour, de mystère et d'amitié des habitants du quartier du Mistral à Marseille." },
    { title: "La Carte aux Trésors", category: "Divertissement", desc: "Deux candidats s'affrontent en hélicoptère pour résoudre des énigmes culturelles au cœur de départements somptueux." },
    { title: "Soir 3 et Débat", category: "Actualités", desc: "Le journal de fin de soirée décryptant en profondeur les grands enjeux européens et internationaux du jour." }
  ],
  m6: [
    { title: "M6 Boutique", category: "Magazine", desc: "Le téléachat de référence vous présente les dernières innovations mode, beauté, cuisine et high-tech." },
    { title: "Scènes de Ménages", category: "Série", desc: "Rires garantis avec le quotidien décalé de couples de générations différentes confrontés à la routine." },
    { title: "Le 12:45 de M6", category: "Actualités", desc: "Le journal télévisé de la mi-journée privilégiant réactivité, proximité avec les téléspectateurs et images choc." },
    { title: "Un Jour, Une Histoire : Téléfilm de l'après-midi", category: "Cinéma", desc: "Suspense familial intense ou grande fresque romantique pour votre pause douceur de l'après-midi." },
    { title: "La Meilleure Boulangerie de France", category: "Documentaire", desc: "Un tour de France gourmand des artisans boulangers à la recherche du meilleur pain et des meilleures créations." },
    { title: "Le 19:45 de M6", category: "Actualités", desc: "Le grand journal du soir avec décryptages infographiques 3D exclusifs de l'actualité internationale." },
    { title: "Top Chef : Le Choc des Brigades", category: "Divertissement", desc: "De jeunes chefs professionnels s'affrontent sous l'œil exigeant d'un jury multi-étoilé de la gastronomie." },
    { title: "Cauchemar en Cuisine", category: "Divertissement", desc: "Philippe Etchebest vient en aide à des restaurateurs au bord de la faillite avec sa méthode musclée." },
    { title: "Enquête Exclusive", category: "Documentaire", desc: "Investigation de terrain en immersion sur les zones de conflit, les réseaux criminels et les secrets sociétaux mondiaux." }
  ],
  arte: [
    { title: "Arte Journal Junior", category: "Jeunesse", desc: "L'actualité mondiale décryptée de manière simple, ludique et interactive pour les pré-adolescents." },
    { title: "Invitation au Voyage", category: "Magazine", desc: "Une escapade culturelle quotidienne à la découverte d'un lieu qui a inspiré un artiste, un écrivain ou un peuple." },
    { title: "Documentaire Nature Sauvage", category: "Documentaire", desc: "Images féeriques de la faune et de la flore préservées au cœur des parcs naturels les plus reculés du monde." },
    { title: "Arte 28 Minutes", category: "Débat", desc: "L'actualité intellectuelle et géopolitique décryptée avec recul, humour et esprit critique par Elisabeth Quin." },
    { title: "Cinéma d'Auteur International", category: "Cinéma", desc: "Une œuvre majeure du septième art, récompensée dans les plus grands festivals mondiaux de cinéma." },
    { title: "Metropolis : Journal Culturel", category: "Magazine", desc: "Les tendances créatives, l'architecture d'avant-garde, la pop-culture et les expositions phares européennes." }
  ],
  c8: [
    { title: "William à Midi", category: "Magazine", desc: "William Leymergie et son équipe de chroniqueurs répondent à vos questions conso, santé, jardinage et animaux." },
    { title: "Inspecteur Barnaby", category: "Série", desc: "L'inspecteur Barnaby résout avec flegme des meurtres sophistiqués dans le comté très pittoresque de Midsomer." },
    { title: "Touche Pas à Mon Poste (TPMP) !", category: "Divertissement", desc: "Cyril Hanouna et sa bande de chroniqueurs débattent de la télévision, des médias et des sujets de société chauds de la journée." },
    { title: "Enquêtes Paranormales", category: "Documentaire", desc: "Retour sur des phénomènes inexpliqués, apparitions mystérieuses et légendes urbaines passées au crible par des experts." }
  ],
  lequipe: [
    { title: "L'Équipe de Greg", category: "Sports", desc: "Grégory Ascher et ses consultants débattent avec piquant de l'actualité du football mondial et des prochains matchs." },
    { title: "L'Équipe du Soir", category: "Sports", desc: "Olivier Ménard anime la table ronde sportive la plus célèbre de France avec ferveur, punchlines et dossiers chauds." },
    { title: "MotoGP / Multi-Sports Live", category: "Sports", desc: "Événements sportifs majeurs diffusés en direct avec analyses des consultants et commentaires enflammés." }
  ],
  actualites: [
    { title: "La Matinale Info Non-Stop", category: "Actualités", desc: "Les titres du matin, l'édito politique, la météo, la bourse et l'invité politique en direct." },
    { title: "Le Fil Info Continu", category: "Actualités", desc: "L'actualité brute décryptée en temps réel avec envoyés spéciaux sur le terrain et experts en studio." },
    { title: "Le Grand Journal de l'Info", category: "Actualités", desc: "Chaque heure, un journal complet suivi de débats contradictoires sur les grands sujets de l'actualité du jour." },
    { title: "Le Débat du Soir", category: "Actualités", desc: "Analyses croisées et points de vue percutants avec des éditorialistes de la presse papier et web." }
  ],
  musique: [
    { title: "Hit List : Consécration", category: "Musique", desc: "Le classement officiel des 50 morceaux les plus diffusés et streamés en France cette semaine." },
    { title: "Clubbing Essentials", category: "Musique", desc: "Les plus grands DJs mondiaux mixent de l'électro et de la house en haute définition visuelle." },
    { title: "Latitude Latino", category: "Musique", desc: "Sélection festive de sons reggaeton, pop et salsa des charts caribéens et d'Amérique du Sud." },
    { title: "Late Night Club live", category: "Musique", desc: "Vivez l'expérience clubbing depuis les plus prestigieux dancefloors d'Ibiza, Paris, Berlin et New-York." }
  ]
};

// Generic fallback template for any undefined channel
const GENERIC_SHOWS: { title: string; category: string; desc: string }[] = [
  { title: "La Matinale Grand Matin", category: "Magazine", desc: "Émissions d'information, d'ambiance locale et de chroniques pratiques au saut du lit." },
  { title: "Série Policière Allemande", category: "Série", desc: "Une enquête haletante menée d'une main de maître dans les rues de Munich." },
  { title: "Jeu de Midi d'Antan", category: "Jeu", desc: "Divertissez-vous avec des affrontements amicaux sur l'orthographe et la chanson française." },
  { title: "Journal Régional & Météo", category: "Actualités", desc: "Un point complet sur la vie locale de nos régions et le ciel de votre département." },
  { title: "Documentaire Découverte Sauvage", category: "Documentaire", desc: "Escapade magnifique au cœur des forêts primaires et des océans pacifiques préservés." },
  { title: "Talk d'Après-Midi Convivial", category: "Divertissement", desc: "De la bonne humeur, des astuces bricolage, culinaires et couture au quotidien." },
  { title: "Série Mystère du Soir", category: "Série", desc: "Des révélations troublantes bousculent la paisible routine d'une petite ville balnéaire." },
  { title: "Débat d'idées de 20h", category: "Talk-Show", desc: "Des philosophes et journalistes s'expriment sur les défis écologiques et démographiques de demain." },
  { title: "Le Grand Divertissement du Prime", category: "Divertissement", desc: "Cascades d'humour, chansons de légende en karaoké et spectacles comiques en direct." },
  { title: "Cinéma Classique Remasterisé", category: "Cinéma", desc: "Le chef-d'œuvre restauré en 4K d'un grand maître de la Nouvelle Vague française." },
  { title: "Playlist Acoustique Relax", category: "Musique", desc: "Des sessions intimistes guitare-voix pour passer une fin de nuit paisible." }
];

// Resolves which template to use based on channel name
function getTemplateKey(channelName: string): string {
  const n = channelName.toLowerCase();
  if (n.includes("tf1")) return "tf1";
  if (n.includes("france 2")) return "france2";
  if (n.includes("france 3")) return "france3";
  if (n.includes("france 5") || n.includes("fr5")) return "france2"; // similar profile
  if (n.includes("m6")) return "m6";
  if (n.includes("arte")) return "arte";
  if (n.includes("c8")) return "c8";
  if (n.includes("lequipe") || n.includes("l'equipe") || n.includes("sport")) return "lequipe";
  if (n.includes("bfm") || n.includes("cnews") || n.includes("lci") || n.includes("info") || n.includes("europe") || n.includes("actualit")) return "actualites";
  if (n.includes("trace") || n.includes("nrj hits") || n.includes("music") || n.includes("clubbing") || n.includes("musique")) return "musique";
  return "generic";
}

// Builds a precise 24-hour timeline of EPG programs dynamically for the given day
export function generateFallbackEpg(channelName: string): EpgProgramme[] {
  const key = getTemplateKey(channelName);
  const shows = key === "generic" ? GENERIC_SHOWS : (TEMPLATES[key] || GENERIC_SHOWS);
  
  const programmes: EpgProgramme[] = [];
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0); // Midnight today
  
  // Set durations for shows (in minutes) to tile exactly 24 hours (1440 minutes)
  // We distribute hours sequentially
  let currentStart = new Date(startOfDay.getTime());
  
  // Custom durations for shows based on slots (each day has 10 show blocks in our template)
  const durations = [
    120, // After midnight show: 12am - 2am
    240, // Bedtime show: 2am - 6am
    180, // Breakfast: 6am - 9am
    180, // Morning soap/mag: 9am - 12pm
    60,  // Game mid-day: 12pm - 1pm
    60,  // News: 1pm - 2pm
    120, // Post-midday document/mag: 2pm - 4pm
    120, // Evening soap/talk: 4pm - 6pm
    120, // Access show: 6pm - 8pm
    60,  // Prime lead: 8pm - 9pm
    120, // Prime show: 9pm - 11pm
    60   // Late night: 11pm - midnight
  ];
  
  for (let i = 0; i < durations.length; i++) {
    const show = shows[i % shows.length];
    const durationMs = durations[i] * 60 * 1000;
    const stopTime = new Date(currentStart.getTime() + durationMs);
    
    // Add real images matching template styles to have gorgeous UI
    let image = "";
    if (show.category === "Cinéma") {
      image = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop";
    } else if (show.category === "Sports") {
      image = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=300&auto=format&fit=crop";
    } else if (show.category === "Actualités") {
      image = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=300&auto=format&fit=crop";
    } else if (show.category === "Jeunesse") {
      image = "https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=300&auto=format&fit=crop";
    } else if (show.category === "Musique") {
      image = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop";
    } else {
      image = "https://images.unsplash.com/photo-1593789198777-f29bc259780e?q=80&w=300&auto=format&fit=crop";
    }
    
    programmes.push({
      start: currentStart.toISOString(),
      stop: stopTime.toISOString(),
      title: show.title,
      category: show.category,
      desc: show.desc,
      image: image
    });
    
    currentStart = stopTime;
  }
  
  return programmes;
}

// Helper to pull just the current active and next upcoming show for instantaneous Home/Grid displays
export function getFallbackEpgCurrentAndNext(channelName: string): { current: EpgProgramme | null; next: EpgProgramme | null } {
  try {
    const fullList = generateFallbackEpg(channelName);
    const now = Date.now();
    
    let current: EpgProgramme | null = null;
    let next: EpgProgramme | null = null;
    
    for (let i = 0; i < fullList.length; i++) {
      const prog = fullList[i];
      const s = new Date(prog.start).getTime();
      const e = new Date(prog.stop).getTime();
      
      if (now >= s && now <= e) {
        current = prog;
        if (i + 1 < fullList.length) {
          next = fullList[i + 1];
        } else {
          next = fullList[0]; // Loop around
        }
        break;
      }
    }
    
    return { current, next };
  } catch (err) {
    return { current: null, next: null };
  }
}
