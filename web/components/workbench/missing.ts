/**
 * What is still missing, for the lab technician, in French: the page
 * /workbench/missing.
 *
 * Which parts are missing is not decided here. It is read from kit.ts: every
 * part whose status is not "have" or "skip". This file only adds, for each, the
 * words the technician reads, how urgent it is, and a photo. A missing part with
 * no entry here, or an entry for a part that is not missing, fails the build.
 *
 * Photos are either the owner's own (public/workbench/kit/, a part already
 * received: "one more like this one") or freely licensed photos from the web,
 * kept in public/workbench/missing/ with their author and licence, which the
 * page prints under each one. Found 23 October 2026.
 */

import { KIT } from './kit';

export type Urgency = 'blocking' | 'needed' | 'useful' | 'final' | 'optional';

export const URGENCY: Record<Urgency, { label: string; note: string }> = {
  blocking: { label: 'Bloquant', note: 'Sans cette pièce, la balance ne pèse pas.' },
  needed: { label: 'Nécessaire', note: 'Pour monter le prototype complet.' },
  useful: { label: 'Recommandé', note: 'Le prototype démarre sans, mais fonctionne mieux avec.' },
  final: { label: 'Version finale', note: 'Pas tout de suite : pour la balance terminée.' },
  optional: { label: 'Facultatif', note: 'Utile, si vous en avez.' },
};

export type Photo =
  | { kind: 'own'; file: string; caption: string }
  | { kind: 'web'; file: string; caption: string; author: string; licence: string; licenceUrl: string; source: string };

export type Ask = {
  /** The part's id in kit.ts. */
  kit: string;
  urgency: Urgency;
  name: string;
  qty: string;
  /** What it does, in one or two sentences. */
  role: string;
  /** How to recognise it in a drawer. */
  looks: string;
  /** What would do instead. */
  instead?: string;
  photo: Photo;
};

export const ASKS: Ask[] = [
  {
    kit: 'hx711',
    urgency: 'blocking',
    name: 'Module amplificateur HX711',
    qty: '1',
    role: 'Il lit la cellule de charge. La cellule ne donne que quelques millivolts : la carte ne sait pas les lire seule, il faut ce convertisseur entre les deux.',
    looks: 'Petite carte d’environ 3 × 2 cm, souvent verte, avec une puce marquée HX711. D’un côté E+, E−, A−, A+ (les 4 fils de la cellule) ; de l’autre GND, DT, SCK, VCC. Souvent vendue avec la cellule, dans le même sachet.',
    instead: 'Tout module HX711, quelle que soit la couleur de la carte.',
    photo: {
      kind: 'web',
      file: 'hx711.jpg',
      caption: 'Un HX711 (version SparkFun, rouge). Le modèle courant est vert, même puce, mêmes broches.',
      author: 'SparkFun Electronics',
      licence: 'CC BY 2.0',
      licenceUrl: 'https://creativecommons.org/licenses/by/2.0/',
      source: 'https://www.flickr.com/photos/41898857@N04/18334776264',
    },
  },
  {
    kit: 'push-button',
    urgency: 'optional',
    name: 'Bouton poussoir',
    qty: '1 de plus',
    role: 'Un seul bouton suffit : un clic prend la photo, un appui de 5 secondes remet à zéro (TARE). Un deuxième, pour la photo seule, est un confort.',
    looks: 'Comme celui que nous avons reçu : un bouton carré à quatre pattes.',
    instead: '6 × 6 mm ou 12 × 12 mm, les deux conviennent.',
    photo: { kind: 'own', file: 'push-button.jpg', caption: 'Celui que nous avons reçu. Un deuxième est facultatif.' },
  },
  {
    kit: 'cap-ceramic',
    urgency: 'useful',
    name: 'Condensateurs céramiques 100 nF',
    qty: '4',
    role: 'Un près de chaque carte, pour filtrer l’alimentation. Les mesures de poids sont plus stables avec.',
    looks: 'Petites pastilles jaunes, orange ou bleues à deux pattes, marquées « 104 ».',
    instead: 'Toute valeur entre 47 nF (473) et 220 nF (224).',
    photo: {
      kind: 'web',
      file: 'cap-100n.jpg',
      caption: 'Un condensateur céramique de 100 nF.',
      author: 'oomlout',
      licence: 'CC BY-SA 2.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
      source: 'https://commons.wikimedia.org/wiki/File:100_nF_Capacitor.jpg',
    },
  },
  {
    kit: 'cap-1000u',
    urgency: 'final',
    name: 'Condensateurs électrolytiques 1000 µF, 16 V ou plus',
    qty: '2',
    role: 'Une réserve d’énergie pour la caméra. Sans eux, l’ESP32-CAM peut redémarrer au moment où elle prend la photo.',
    looks: 'Le même genre que celui que nous avons reçu, en plus gros : cylindre noir ou bleu, une bande claire du côté de la patte −.',
    instead: 'De 470 µF à 2200 µF, 10 V ou plus. Deux 470 µF côte à côte font le même travail.',
    photo: { kind: 'own', file: 'cap-100u.jpg', caption: 'Celui que nous avons reçu (100 µF). Il nous faut le même en 1000 µF.' },
  },
  {
    kit: 'header-pins',
    urgency: 'optional',
    name: 'Barrette de broches mâles, pas 2,54 mm',
    qty: '1',
    role: 'Seulement si le HX711 arrive sans ses broches soudées : il faut alors les souder pour le brancher sur la plaque d’essai.',
    looks: 'Une rangée de broches dorées tenues par du plastique noir, qui se coupe à la longueur voulue.',
    photo: {
      kind: 'web',
      file: 'header-pins.jpg',
      caption: 'Un morceau de barrette (3 broches). Il en faut au moins 4.',
      author: 'oomlout',
      licence: 'CC BY-SA 2.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
      source: 'https://commons.wikimedia.org/wiki/File:3_Pin_Header_-_HEAD-03_(4150701608).jpg',
    },
  },
  {
    kit: 'charger',
    urgency: 'final',
    name: 'Chargeur USB 5 V, 2 A',
    qty: '1',
    role: 'Pour faire marcher la balance sans ordinateur. Au labo, le port USB du PC suffit.',
    looks: 'Un chargeur de téléphone ordinaire, marqué 5 V et 2 A (ou plus) sur son étiquette.',
    instead: 'Tout chargeur de téléphone de 2 A ou plus. Pas une batterie externe.',
    photo: {
      kind: 'web',
      file: 'charger.jpg',
      caption: 'Un chargeur USB. Un seul port suffit.',
      author: 'Almanta',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      source: 'https://commons.wikimedia.org/wiki/File:USB_mobile_phone_charger_with_four_ports_and_Quick_Charge_3.0_(HC-376).jpg',
    },
  },
  {
    kit: 'microsd',
    urgency: 'optional',
    name: 'Carte microSD',
    qty: '1',
    role: 'Garde les photos des repas quand le Wi-Fi est coupé, et les envoie plus tard.',
    looks: 'N’importe quelle carte jusqu’à 32 Go.',
    photo: {
      kind: 'web',
      file: 'microsd.jpg',
      caption: 'Des cartes microSD. Une seule suffit.',
      author: 'Afrank99',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      source: 'https://commons.wikimedia.org/wiki/File:MicroSD_cards_2GB_4GB_8GB.jpg',
    },
  },
];

/** What received in place of what was asked, in French, for the "no need to swap" list. */
export const GIVEN_FR: Record<string, string> = {
  devkit: 'Nous avons reçu un ESP8266 NodeMCU à la place de l’ESP32 DevKit. Nous avons adapté le programme : pas besoin de l’échanger.',
  'cap-10u': 'Nous avons reçu un 100 µF au lieu du 10 µF. Il fait le même travail.',
};

/** Instruments the build needs in the lab itself. Names start parts in bom.ts. */
export const ON_SITE: { bom: string; name: string; why: string }[] = [
  { bom: 'Multimeter', name: 'Multimètre', why: 'Pour repérer les pattes du transistor et tester le buzzer.' },
  { bom: 'Soldering station', name: 'Fer à souder', why: 'Pour souder les broches du HX711, s’il arrive sans.' },
];

// --- checks: the list above must match kit.ts --------------------------------

const missing = KIT.filter((item) => item.status !== 'have' && item.status !== 'skip').map((item) => item.id);
for (const id of missing) {
  if (!ASKS.some((ask) => ask.kit === id)) throw new Error(`"${id}" is missing in kit.ts but has no French entry in missing.ts.`);
}
for (const ask of ASKS) {
  if (!missing.includes(ask.kit)) throw new Error(`missing.ts asks for "${ask.kit}", which kit.ts does not list as missing.`);
}
for (const id of Object.keys(GIVEN_FR)) {
  if (!KIT.find((item) => item.id === id)?.given) throw new Error(`GIVEN_FR names "${id}", which kit.ts does not mark as given in place of another part.`);
}

/** Missing parts, most urgent first, in the order above within each level. */
export const MISSING = (Object.keys(URGENCY) as Urgency[]).flatMap((urgency) => ASKS.filter((ask) => ask.urgency === urgency));
