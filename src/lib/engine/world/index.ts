/* The world across episodes. A document, place, sighting or tier belongs to an
   episode (default 1) and exists from that episode on. */
import { DOCUMENTS, PLACES, PRESSURE } from "./episode-01";
import { DOCUMENTS_02, PLACES_02, PRESSURE_02 } from "./episode-02";
import { DOCUMENTS_03, PLACES_03, PRESSURE_03 } from "./episode-03";
import { SCHEDULED_03 } from "./episode-03-mail";
import { SCHEDULED, type ScheduledItem } from "./episode-01-mail";
import { SCHEDULED_02 } from "./episode-02-mail";
import type { DocumentDef, PlaceDef, PressureTier } from "./types";

const ALL_DOCUMENTS: DocumentDef[] = [...DOCUMENTS, ...DOCUMENTS_02, ...DOCUMENTS_03];
const ALL_PLACES: PlaceDef[] = [...PLACES, ...PLACES_02, ...PLACES_03];
const ALL_PRESSURE: PressureTier[] = [...PRESSURE.map((t) => ({ episode: 1, ...t })), ...PRESSURE_02, ...PRESSURE_03];

export const documentsFor = (episode: number) => ALL_DOCUMENTS.filter((d) => (d.episode ?? 1) <= episode);
export const placesFor = (episode: number) => ALL_PLACES.filter((p) => (p.episode ?? 1) <= episode);
export const pressureFor = (episode: number) => ALL_PRESSURE.filter((t) => (t.episode ?? 1) === episode);
export const scheduledFor = (episode: number): ScheduledItem[] => (episode === 1 ? SCHEDULED : episode === 2 ? SCHEDULED_02 : episode === 3 ? SCHEDULED_03 : []);
export const episodeOf = (roundNumber: number, perEpisode = 14) => Math.floor((roundNumber - 1) / perEpisode) + 1;
