import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import registerPairsJson from '../../data/content/register-pairs.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const CONTENT_DIR = path.join(DATA_DIR, 'content');

const TATOEBA_FRA_URL = 'https://downloads.tatoeba.org/exports/per_language/fra/fra_sentences.tsv.bz2';
const TATOEBA_ENG_URL = 'https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2';
const TATOEBA_LINKS_URL = 'https://downloads.tatoeba.org/exports/links.tar.bz2';
const LEXIQUE_URL = 'http://www.lexique.org/databases/Lexique383/Lexique383.tsv';
const RELEASE_VERSION = '2026.08.2';
const RELEASED_AT = '2026-08-13T00:00:00.000Z';
const MAX_SENTENCES = 10_000;

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';
type PreparedSentence = {
  id: string;
  french: string;
  english: string;
  difficulty: number;
  cefrLevel: CefrLevel;
  source: 'tatoeba';
  spokenForm: string | null;
  audioText: string;
};
type RegisterPair = { formal: string; spoken: string; note: string };

const STOP_WORDS = new Set([
  'ai', 'au', 'aux', 'avec', 'ce', 'ces', 'cette', 'de', 'des', 'du', 'elle', 'en', 'et', 'eux', 'il', 'ils', 'je',
  'la', 'le', 'les', 'leur', 'lui', 'ma', 'mais', 'me', 'mes', 'moi', 'mon', 'ne', 'nos', 'notre', 'nous', 'on', 'ou',
  'par', 'pas', 'pour', 'que', 'qui', 'sa', 'se', 'ses', 'son', 'sur', 'ta', 'te', 'tes', 'toi', 'ton', 'tu', 'un', 'une',
  'vos', 'votre', 'vous', 'y', 'a', 'à', 'ça', 'est', 'sont', 'était', 'être', 'fait', 'faire', 'dans', 'plus', 'très',
]);

const ensureDirs = () => {
  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
  if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });
};

const downloadFile = (url: string, dest: string, isBz2 = false, isTarBz2 = false) => {
  if (fs.existsSync(dest)) {
    console.log(`[Cache] ${dest} already exists.`);
    return;
  }
  console.log(`[Download] Fetching ${url}...`);
  if (isBz2) {
    const bz2Dest = dest + '.bz2';
    execFileSync('curl', ['--fail', '--location', '--retry', '3', '--output', bz2Dest, url], { stdio: 'inherit' });
    if (fs.statSync(bz2Dest).size === 0) throw new Error(`Downloaded file is empty: ${url}`);
    console.log(`[Extract] Unzipping ${bz2Dest}...`);
    execFileSync('bzip2', ['-d', bz2Dest], { stdio: 'inherit' });
  } else if (isTarBz2) {
    const tarDest = path.join(RAW_DIR, 'links.tar.bz2');
    if (!fs.existsSync(tarDest)) {
      execFileSync('curl', ['--fail', '--location', '--retry', '3', '--output', tarDest, url], { stdio: 'inherit' });
    }
    console.log(`[Extract] Un-tarring ${tarDest}...`);
    execFileSync('tar', ['-xf', tarDest, '-C', RAW_DIR], { stdio: 'inherit' });
  } else {
    execFileSync('curl', ['--fail', '--location', '--retry', '3', '--output', dest, url], { stdio: 'inherit' });
  }
};

const getRawFiles = () => {
  ensureDirs();
  downloadFile(TATOEBA_FRA_URL, path.join(RAW_DIR, 'fra_sentences.tsv'), true);
  downloadFile(TATOEBA_ENG_URL, path.join(RAW_DIR, 'eng_sentences.tsv'), true);
  downloadFile(TATOEBA_LINKS_URL, path.join(RAW_DIR, 'links.csv'), false, true);
  downloadFile(LEXIQUE_URL, path.join(RAW_DIR, 'Lexique383.tsv'), false);
};

const loadLexique = async () => {
  console.log('[Lexique] Loading frequency data...');
  const freqs = new Map<string, number>();
  
  const fileStream = fs.createReadStream(path.join(RAW_DIR, 'Lexique383.tsv'));
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isHeader = true;
  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    const cols = line.split('\t');
    if (cols.length < 10) continue;
    
    const word = cols[0].toLowerCase();
    const freq = parseFloat(cols[9]) || 0; // freqlivres
    
    if (!freqs.has(word) || freq > freqs.get(word)!) {
      freqs.set(word, freq);
    }
  }
  return freqs;
};

const computeDifficulty = (frenchSentence: string, lexique: Map<string, number>) => {
  const words = frenchSentence.toLowerCase().replace(/[^a-zàâçéèêëîïôûùüÿœæ-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;

  let totalScore = 0;
  for (const word of words) {
    const freq = lexique.get(word) || 0;
    // Lower frequency means higher difficulty. Max out at some threshold.
    // E.g., frequency is per million words. 
    // Freq > 1000 => easy
    // Freq < 1 => very hard
    let wordDiff = 0;
    if (freq === 0) wordDiff = 10;
    else if (freq < 1) wordDiff = 8;
    else if (freq < 10) wordDiff = 5;
    else if (freq < 100) wordDiff = 3;
    else if (freq < 1000) wordDiff = 1;
    
    totalScore += wordDiff;
  }
  
  const avgDifficulty = totalScore / words.length;
  // Factor in length
  const lengthPenalty = Math.max(0, (words.length - 10) * 0.1);
  return Math.min(10, avgDifficulty + lengthPenalty);
};

const getCefrLevel = (difficulty: number): CefrLevel => {
  if (difficulty < 1.5) return 'A1';
  if (difficulty < 3) return 'A2';
  if (difficulty < 5) return 'B1';
  return 'B2';
};

const tokenize = (text: string) => text.toLowerCase().match(/[a-zàâçéèêëîïôûùüÿœæ-]+/g) ?? [];

const vocabularyFor = (sentence: PreparedSentence, lexique: Map<string, number>) => new Set(
  tokenize(sentence.french).filter((word) => !STOP_WORDS.has(word) && (lexique.get(word) ?? 0) >= 5),
);

const applyRegisterPairs = (sentences: PreparedSentence[]) => {
  const pairs = (registerPairsJson as RegisterPair[]).toSorted((a, b) => b.formal.length - a.formal.length);
  let transformed = 0;
  for (const sentence of sentences) {
    let spoken = sentence.french;
    let changed = false;
    for (const pair of pairs) {
      const replacement = pair.spoken.split('/')[0].trim();
      const lower = spoken.toLocaleLowerCase('fr');
      const needle = pair.formal.toLocaleLowerCase('fr');
      const index = lower.indexOf(needle);
      if (index < 0 || replacement.toLocaleLowerCase('fr') === needle) continue;
      const before = index === 0 ? '' : spoken[index - 1];
      const after = spoken[index + pair.formal.length] ?? '';
      if (/\p{L}/u.test(before) || /\p{L}/u.test(after)) continue;
      spoken = `${spoken.slice(0, index)}${replacement}${spoken.slice(index + pair.formal.length)}`;
      changed = true;
    }
    if (changed) {
      sentence.spokenForm = spoken;
      transformed += 1;
    }
  }
  return transformed;
};

const groupIntoStories = (sentences: PreparedSentence[], lexique: Map<string, number>) => {
  const remaining = sentences
    .map((sentence) => ({ sentence, vocabulary: vocabularyFor(sentence, lexique) }))
    .toSorted((a, b) => a.sentence.difficulty - b.sentence.difficulty || a.sentence.id.localeCompare(b.sentence.id));
  const stories = [];
  let storyNumber = 1;

  while (remaining.length > 0) {
    const groupSize = remaining.length <= 8 ? remaining.length : 6;
    const group = [remaining.shift()!];
    while (group.length < groupSize) {
      const shared = new Set(group.flatMap(({ vocabulary }) => [...vocabulary]));
      let bestIndex = 0;
      let bestScore = Number.NEGATIVE_INFINITY;
      for (let index = 0; index < Math.min(remaining.length, 120); index += 1) {
        const candidate = remaining[index];
        const overlap = [...candidate.vocabulary].filter((word) => shared.has(word)).length;
        const difficultyGap = Math.abs(candidate.sentence.difficulty - group[0].sentence.difficulty);
        const score = overlap * 10 - difficultyGap;
        if (score > bestScore) { bestScore = score; bestIndex = index; }
      }
      group.push(remaining.splice(bestIndex, 1)[0]);
    }

    const themeCounts = new Map<string, number>();
    for (const { vocabulary } of group) for (const word of vocabulary) themeCounts.set(word, (themeCounts.get(word) ?? 0) + 1);
    const theme = [...themeCounts].toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
    const storySentences = group.map(({ sentence }) => sentence);
    const difficulty = Number((storySentences.reduce((sum, sentence) => sum + sentence.difficulty, 0) / storySentences.length).toFixed(2));
    stories.push({
      id: `tatoeba-passage-${String(storyNumber).padStart(4, '0')}`,
      title: theme ? `Autour de « ${theme} »` : `Passage ${String(storyNumber).padStart(4, '0')}`,
      difficulty,
      sentences: storySentences,
    });
    storyNumber += 1;
  }
  return stories;
};

const writePreparedContent = (sentences: PreparedSentence[], lexique: Map<string, number>) => {
  const registerCount = applyRegisterPairs(sentences);
  const stories = groupIntoStories(sentences, lexique);
  const release = {
    schemaVersion: 1,
    releaseVersion: RELEASE_VERSION,
    releasedAt: RELEASED_AT,
    attribution: [
      { name: 'Tatoeba French-English sentence pairs', license: 'CC BY 2.0 FR', url: 'https://tatoeba.org/en/terms_of_use' },
      { name: 'Lexique 3.83 frequency database', license: 'CC BY-SA 4.0', url: 'http://www.lexique.org/' },
    ],
    stories,
  };
  fs.writeFileSync(path.join(CONTENT_DIR, 'sentences.json'), `${JSON.stringify(sentences, null, 2)}\n`);
  fs.writeFileSync(path.join(CONTENT_DIR, 'content-release.json'), `${JSON.stringify(release, null, 2)}\n`);
  console.log(`[Register] Applied curated spoken forms to ${registerCount} eligible sentences.`);
  console.log(`[Stories] Grouped ${sentences.length} sentences into ${stories.length} passages of 4-8 sentences.`);
};

const processTatoeba = async (lexique: Map<string, number>) => {
  console.log('[Tatoeba] Loading English sentences...');
  const engMap = new Map<string, string>();
  const engStream = fs.createReadStream(path.join(RAW_DIR, 'eng_sentences.tsv'));
  const engRl = readline.createInterface({ input: engStream, crlfDelay: Infinity });
  for await (const line of engRl) {
    const [id, lang, text] = line.split('\t');
    if (lang === 'eng') engMap.set(id, text);
  }

  console.log('[Tatoeba] Loading French sentences...');
  const fraMap = new Map<string, string>();
  const fraStream = fs.createReadStream(path.join(RAW_DIR, 'fra_sentences.tsv'));
  const fraRl = readline.createInterface({ input: fraStream, crlfDelay: Infinity });
  for await (const line of fraRl) {
    const [id, lang, text] = line.split('\t');
    if (lang === 'fra') fraMap.set(id, text);
  }

  console.log(`[Tatoeba] Found ${fraMap.size} French and ${engMap.size} English sentences.`);
  console.log('[Tatoeba] Matching links...');

  const linksStream = fs.createReadStream(path.join(RAW_DIR, 'links.csv'));
  const linksRl = readline.createInterface({ input: linksStream, crlfDelay: Infinity });
  
  const finalSentences: PreparedSentence[] = [];
  const usedFra = new Set<string>();

  for await (const line of linksRl) {
    const [id1, id2] = line.split('\t');
    // Check if id1 is Fra and id2 is Eng
    if (fraMap.has(id1) && engMap.has(id2) && !usedFra.has(id1)) {
      const fraText = fraMap.get(id1)!;
      const engText = engMap.get(id2)!;
      usedFra.add(id1);
      
      const diff = computeDifficulty(fraText, lexique);
      finalSentences.push({
        id: `tatoeba-${id1}`,
        french: fraText,
        english: engText,
        difficulty: parseFloat(diff.toFixed(2)),
        cefrLevel: getCefrLevel(diff),
        source: 'tatoeba',
        spokenForm: null,
        audioText: fraText
      });
      // Cap at 10,000 for realistic client side data payload
      if (finalSentences.length >= MAX_SENTENCES) break;
    }
  }

  console.log(`[Tatoeba] Generated ${finalSentences.length} sentence pairs.`);
  
  writePreparedContent(finalSentences, lexique);
  console.log(`[Done] Wrote prepared corpus and release to ${CONTENT_DIR}`);
};

const run = async () => {
  getRawFiles();
  const lex = await loadLexique();
  await processTatoeba(lex);
};

run().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 });
