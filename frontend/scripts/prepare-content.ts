import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const CONTENT_DIR = path.join(DATA_DIR, 'content');

const TATOEBA_FRA_URL = 'https://downloads.tatoeba.org/exports/per_language/fra/fra_sentences.tsv.bz2';
const TATOEBA_ENG_URL = 'https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2';
const TATOEBA_LINKS_URL = 'https://downloads.tatoeba.org/exports/links.tar.bz2';
const LEXIQUE_URL = 'http://www.lexique.org/databases/Lexique383/Lexique383.tsv';

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
    execSync(`curl -L -o ${bz2Dest} ${url}`);
    console.log(`[Extract] Unzipping ${bz2Dest}...`);
    execSync(`bzip2 -d ${bz2Dest}`);
  } else if (isTarBz2) {
    const tarDest = path.join(RAW_DIR, 'links.tar.bz2');
    if (!fs.existsSync(tarDest)) {
      execSync(`curl -L -o ${tarDest} ${url}`);
    }
    console.log(`[Extract] Un-tarring ${tarDest}...`);
    execSync(`tar -xf ${tarDest} -C ${RAW_DIR}`);
  } else {
    execSync(`curl -L -o ${dest} ${url}`);
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

const getCefrLevel = (difficulty: number) => {
  if (difficulty < 1.5) return 'A1';
  if (difficulty < 3) return 'A2';
  if (difficulty < 5) return 'B1';
  return 'B2';
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
  
  const finalSentences = [];
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
      if (finalSentences.length >= 10000) break;
    }
  }

  console.log(`[Tatoeba] Generated ${finalSentences.length} sentence pairs.`);
  
  // Output JSON
  const outPath = path.join(CONTENT_DIR, 'sentences.json');
  fs.writeFileSync(outPath, JSON.stringify(finalSentences, null, 2));
  console.log(`[Done] Wrote to ${outPath}`);
};

const run = async () => {
  getRawFiles();
  const lex = await loadLexique();
  await processTatoeba(lex);
};

run().catch(console.error);
