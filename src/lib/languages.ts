// Language Academy Data — Arabic, Russian, Chinese
// Vocabulary, phrases, scripts, and quiz questions for each language.

export interface LangWord {
  id: number;
  original: string;   // in target language
  transliteration: string;
  english: string;
  category: string;
  audio_hint?: string; // pronunciation tip
}

export interface LangPhrase {
  id: number;
  original: string;
  transliteration: string;
  english: string;
  context: string;
}

export interface LangLesson {
  id: string;
  title: string;
  description: string;
  words: LangWord[];
  phrases: LangPhrase[];
  script_note: string;
}

// ─── ARABIC ──────────────────────────────────────────────────────────────────

export const ARABIC_LESSONS: LangLesson[] = [
  {
    id: 'ar-greetings',
    title: 'Greetings & Basics',
    description: 'Essential Arabic greetings and everyday expressions.',
    script_note: 'Arabic is written right-to-left. Letters change shape depending on position in a word.',
    words: [
      { id: 1, original: 'مرحبا', transliteration: 'Marhaba', english: 'Hello', category: 'Greeting' },
      { id: 2, original: 'شكراً', transliteration: 'Shukran', english: 'Thank you', category: 'Courtesy' },
      { id: 3, original: 'من فضلك', transliteration: 'Min fadlak', english: 'Please', category: 'Courtesy' },
      { id: 4, original: 'نعم', transliteration: 'Na\'am', english: 'Yes', category: 'Basic' },
      { id: 5, original: 'لا', transliteration: 'La', english: 'No', category: 'Basic' },
      { id: 6, original: 'مع السلامة', transliteration: 'Ma\'a al-salama', english: 'Goodbye', category: 'Greeting' },
      { id: 7, original: 'آسف', transliteration: 'Aasif', english: 'Sorry', category: 'Courtesy' },
      { id: 8, original: 'بخير', transliteration: 'Bikhayr', english: 'Fine / I\'m well', category: 'Basic' },
    ],
    phrases: [
      { id: 1, original: 'كيف حالك؟', transliteration: 'Kayfa halak?', english: 'How are you?', context: 'Common greeting' },
      { id: 2, original: 'أنا بخير، شكراً', transliteration: 'Ana bikhayr, shukran', english: 'I\'m fine, thank you', context: 'Response to "how are you"' },
      { id: 3, original: 'ما اسمك؟', transliteration: 'Ma ismak?', english: 'What is your name?', context: 'Meeting someone new' },
      { id: 4, original: 'اسمي...', transliteration: 'Ismi...', english: 'My name is...', context: 'Introducing yourself' },
    ],
  },
  {
    id: 'ar-numbers',
    title: 'Numbers 1–10',
    description: 'Count in Arabic from one to ten.',
    script_note: 'Arabic numerals (١٢٣) are used in everyday writing. The Western "Arabic numerals" we use came from Arabic!',
    words: [
      { id: 9, original: 'واحد', transliteration: 'Wahid', english: 'One (1)', category: 'Number' },
      { id: 10, original: 'اثنان', transliteration: 'Ithnan', english: 'Two (2)', category: 'Number' },
      { id: 11, original: 'ثلاثة', transliteration: 'Thalatha', english: 'Three (3)', category: 'Number' },
      { id: 12, original: 'أربعة', transliteration: 'Arba\'a', english: 'Four (4)', category: 'Number' },
      { id: 13, original: 'خمسة', transliteration: 'Khamsa', english: 'Five (5)', category: 'Number' },
      { id: 14, original: 'ستة', transliteration: 'Sitta', english: 'Six (6)', category: 'Number' },
      { id: 15, original: 'سبعة', transliteration: 'Sab\'a', english: 'Seven (7)', category: 'Number' },
      { id: 16, original: 'ثمانية', transliteration: 'Thamaniya', english: 'Eight (8)', category: 'Number' },
      { id: 17, original: 'تسعة', transliteration: 'Tis\'a', english: 'Nine (9)', category: 'Number' },
      { id: 18, original: 'عشرة', transliteration: 'Ashara', english: 'Ten (10)', category: 'Number' },
    ],
    phrases: [
      { id: 5, original: 'كم عمرك؟', transliteration: 'Kam \'omrak?', english: 'How old are you?', context: 'Asking age' },
      { id: 6, original: 'عمري عشرون سنة', transliteration: '\'Omri \'ishrun sana', english: 'I am twenty years old', context: 'Stating your age' },
    ],
  },
  {
    id: 'ar-family',
    title: 'Family & People',
    description: 'Words for family members and people.',
    script_note: 'Arabic nouns have gender (masculine/feminine). Family words reflect this.',
    words: [
      { id: 19, original: 'أب', transliteration: 'Ab', english: 'Father', category: 'Family' },
      { id: 20, original: 'أم', transliteration: 'Umm', english: 'Mother', category: 'Family' },
      { id: 21, original: 'أخ', transliteration: 'Akh', english: 'Brother', category: 'Family' },
      { id: 22, original: 'أخت', transliteration: 'Ukht', english: 'Sister', category: 'Family' },
      { id: 23, original: 'صديق', transliteration: 'Sadiq', english: 'Friend', category: 'People' },
      { id: 24, original: 'طالب', transliteration: 'Talib', english: 'Student', category: 'People' },
      { id: 25, original: 'معلم', transliteration: 'Mu\'allim', english: 'Teacher', category: 'People' },
      { id: 26, original: 'بيت', transliteration: 'Bayt', english: 'House / Home', category: 'Places' },
    ],
    phrases: [
      { id: 7, original: 'هذا أخي', transliteration: 'Hatha akhi', english: 'This is my brother', context: 'Introducing family' },
      { id: 8, original: 'أنا طالب', transliteration: 'Ana talib', english: 'I am a student', context: 'Describing yourself' },
    ],
  },
];

// ─── RUSSIAN ─────────────────────────────────────────────────────────────────

export const RUSSIAN_LESSONS: LangLesson[] = [
  {
    id: 'ru-alphabet',
    title: 'Cyrillic Alphabet Basics',
    description: 'Learn the Russian Cyrillic alphabet and basic sounds.',
    script_note: 'Russian uses the Cyrillic alphabet (33 letters). Many letters look like English but sound different!',
    words: [
      { id: 1, original: 'А а', transliteration: 'A', english: 'Like "a" in father', category: 'Alphabet', audio_hint: '"Ah"' },
      { id: 2, original: 'Б б', transliteration: 'B', english: 'Like English "B"', category: 'Alphabet', audio_hint: '"Beh"' },
      { id: 3, original: 'В в', transliteration: 'V', english: 'Like English "V"', category: 'Alphabet', audio_hint: '"Veh"' },
      { id: 4, original: 'Г г', transliteration: 'G', english: 'Like "G" in go', category: 'Alphabet', audio_hint: '"Geh"' },
      { id: 5, original: 'Д д', transliteration: 'D', english: 'Like English "D"', category: 'Alphabet', audio_hint: '"Deh"' },
      { id: 6, original: 'Е е', transliteration: 'Ye', english: 'Like "ye" in yes', category: 'Alphabet', audio_hint: '"Yeh"' },
      { id: 7, original: 'Ж ж', transliteration: 'Zh', english: 'Like "s" in measure', category: 'Alphabet', audio_hint: '"Zheh"' },
      { id: 8, original: 'З з', transliteration: 'Z', english: 'Like English "Z"', category: 'Alphabet', audio_hint: '"Zeh"' },
    ],
    phrases: [
      { id: 1, original: 'Привет!', transliteration: 'Privet!', english: 'Hi! (informal)', context: 'Casual greeting' },
      { id: 2, original: 'Меня зовут...', transliteration: 'Menya zovut...', english: 'My name is...', context: 'Introducing yourself' },
    ],
  },
  {
    id: 'ru-greetings',
    title: 'Greetings & Phrases',
    description: 'Essential Russian phrases for everyday conversations.',
    script_note: 'Russian has 6 grammatical cases. For now, focus on memorizing phrases as whole units.',
    words: [
      { id: 9, original: 'Привет', transliteration: 'Privet', english: 'Hello (informal)', category: 'Greeting' },
      { id: 10, original: 'Здравствуйте', transliteration: 'Zdravstvuyte', english: 'Hello (formal)', category: 'Greeting' },
      { id: 11, original: 'Спасибо', transliteration: 'Spasibo', english: 'Thank you', category: 'Courtesy' },
      { id: 12, original: 'Пожалуйста', transliteration: 'Pozhaluysta', english: 'Please / You\'re welcome', category: 'Courtesy' },
      { id: 13, original: 'Да', transliteration: 'Da', english: 'Yes', category: 'Basic' },
      { id: 14, original: 'Нет', transliteration: 'Net', english: 'No', category: 'Basic' },
      { id: 15, original: 'До свидания', transliteration: 'Do svidaniya', english: 'Goodbye', category: 'Greeting' },
      { id: 16, original: 'Извините', transliteration: 'Izvinite', english: 'Excuse me / Sorry', category: 'Courtesy' },
    ],
    phrases: [
      { id: 3, original: 'Как дела?', transliteration: 'Kak dela?', english: 'How are you?', context: 'Common greeting' },
      { id: 4, original: 'Хорошо, спасибо', transliteration: 'Khorosho, spasibo', english: 'Good, thank you', context: 'Responding to "how are you"' },
      { id: 5, original: 'Как вас зовут?', transliteration: 'Kak vas zovut?', english: 'What is your name? (formal)', context: 'Meeting someone' },
      { id: 6, original: 'Я не понимаю', transliteration: 'Ya ne ponimayu', english: 'I don\'t understand', context: 'When confused' },
    ],
  },
  {
    id: 'ru-numbers',
    title: 'Numbers & Colors',
    description: 'Numbers 1-10 and common colors in Russian.',
    script_note: 'Russian numbers change form based on what they\'re counting. Learn the base forms first.',
    words: [
      { id: 17, original: 'Один', transliteration: 'Odin', english: 'One', category: 'Number' },
      { id: 18, original: 'Два', transliteration: 'Dva', english: 'Two', category: 'Number' },
      { id: 19, original: 'Три', transliteration: 'Tri', english: 'Three', category: 'Number' },
      { id: 20, original: 'Четыре', transliteration: 'Chetyre', english: 'Four', category: 'Number' },
      { id: 21, original: 'Пять', transliteration: 'Pyat\'', english: 'Five', category: 'Number' },
      { id: 22, original: 'Красный', transliteration: 'Krasny', english: 'Red', category: 'Color' },
      { id: 23, original: 'Синий', transliteration: 'Siniy', english: 'Blue', category: 'Color' },
      { id: 24, original: 'Зелёный', transliteration: 'Zelony', english: 'Green', category: 'Color' },
    ],
    phrases: [
      { id: 7, original: 'Сколько стоит?', transliteration: 'Skol\'ko stoit?', english: 'How much does it cost?', context: 'Shopping' },
      { id: 8, original: 'Один кофе, пожалуйста', transliteration: 'Odin kofe, pozhaluysta', english: 'One coffee, please', context: 'Ordering food/drinks' },
    ],
  },
];

// ─── CHINESE (MANDARIN) ───────────────────────────────────────────────────────

export const CHINESE_LESSONS: LangLesson[] = [
  {
    id: 'zh-tones',
    title: 'Tones & Pinyin Basics',
    description: 'Mandarin Chinese has 4 tones. The same syllable means different things!',
    script_note: 'Chinese is written in characters (汉字). Pinyin is the romanization system. Tones are marked with symbols above vowels.',
    words: [
      { id: 1, original: 'mā (1st tone)', transliteration: 'mā', english: 'Mother (flat high)', category: 'Tones', audio_hint: 'High, flat pitch' },
      { id: 2, original: 'má (2nd tone)', transliteration: 'má', english: 'Hemp / numb (rising)', category: 'Tones', audio_hint: 'Rising pitch like a question' },
      { id: 3, original: 'mǎ (3rd tone)', transliteration: 'mǎ', english: 'Horse (dipping)', category: 'Tones', audio_hint: 'Dips down then rises' },
      { id: 4, original: 'mà (4th tone)', transliteration: 'mà', english: 'Scold (falling)', category: 'Tones', audio_hint: 'Sharp, falling pitch' },
      { id: 5, original: '你 Nǐ', transliteration: 'Nǐ', english: 'You (3rd tone)', category: 'Pinyin', audio_hint: 'Dipping tone' },
      { id: 6, original: '好 Hǎo', transliteration: 'Hǎo', english: 'Good (3rd tone)', category: 'Pinyin', audio_hint: 'Dipping tone' },
      { id: 7, original: '是 Shì', transliteration: 'Shì', english: 'Is / am / are (4th tone)', category: 'Pinyin', audio_hint: 'Falling tone' },
      { id: 8, original: '我 Wǒ', transliteration: 'Wǒ', english: 'I / me (3rd tone)', category: 'Pinyin', audio_hint: 'Dipping tone' },
    ],
    phrases: [
      { id: 1, original: '你好！', transliteration: 'Nǐ hǎo!', english: 'Hello!', context: 'Universal greeting' },
      { id: 2, original: '谢谢', transliteration: 'Xièxiè', english: 'Thank you', context: 'Showing gratitude' },
    ],
  },
  {
    id: 'zh-greetings',
    title: 'Greetings & Common Words',
    description: 'Essential Mandarin words and phrases for daily use.',
    script_note: 'Chinese characters are logographic — each character represents a morpheme. Most words are 1-2 characters.',
    words: [
      { id: 9, original: '你好', transliteration: 'Nǐ hǎo', english: 'Hello', category: 'Greeting' },
      { id: 10, original: '再见', transliteration: 'Zàijiàn', english: 'Goodbye', category: 'Greeting' },
      { id: 11, original: '谢谢', transliteration: 'Xièxiè', english: 'Thank you', category: 'Courtesy' },
      { id: 12, original: '不客气', transliteration: 'Bùkèqi', english: 'You\'re welcome', category: 'Courtesy' },
      { id: 13, original: '对不起', transliteration: 'Duìbuqǐ', english: 'Sorry', category: 'Courtesy' },
      { id: 14, original: '没关系', transliteration: 'Méi guānxi', english: 'No problem / It\'s fine', category: 'Courtesy' },
      { id: 15, original: '是', transliteration: 'Shì', english: 'Yes / Is / Are', category: 'Basic' },
      { id: 16, original: '不', transliteration: 'Bù', english: 'No / Not', category: 'Basic' },
    ],
    phrases: [
      { id: 3, original: '你好吗？', transliteration: 'Nǐ hǎo ma?', english: 'How are you?', context: 'Common greeting' },
      { id: 4, original: '我很好', transliteration: 'Wǒ hěn hǎo', english: 'I am very good', context: 'Responding to "how are you"' },
      { id: 5, original: '你叫什么名字？', transliteration: 'Nǐ jiào shénme míngzi?', english: 'What is your name?', context: 'Meeting someone new' },
      { id: 6, original: '我叫...', transliteration: 'Wǒ jiào...', english: 'My name is...', context: 'Introducing yourself' },
    ],
  },
  {
    id: 'zh-numbers',
    title: 'Numbers 1–10',
    description: 'The simplest Chinese numbers — very regular and logical!',
    script_note: 'Chinese numbers are beautifully logical: 11 = ten-one (十一), 20 = two-ten (二十). Very easy!',
    words: [
      { id: 17, original: '一', transliteration: 'Yī', english: 'One', category: 'Number' },
      { id: 18, original: '二', transliteration: 'Èr', english: 'Two', category: 'Number' },
      { id: 19, original: '三', transliteration: 'Sān', english: 'Three', category: 'Number' },
      { id: 20, original: '四', transliteration: 'Sì', english: 'Four', category: 'Number' },
      { id: 21, original: '五', transliteration: 'Wǔ', english: 'Five', category: 'Number' },
      { id: 22, original: '六', transliteration: 'Liù', english: 'Six', category: 'Number' },
      { id: 23, original: '七', transliteration: 'Qī', english: 'Seven', category: 'Number' },
      { id: 24, original: '八', transliteration: 'Bā', english: 'Eight', category: 'Number' },
      { id: 25, original: '九', transliteration: 'Jiǔ', english: 'Nine', category: 'Number' },
      { id: 26, original: '十', transliteration: 'Shí', english: 'Ten', category: 'Number' },
    ],
    phrases: [
      { id: 7, original: '多少钱？', transliteration: 'Duōshǎo qián?', english: 'How much money?', context: 'Asking price when shopping' },
      { id: 8, original: '一杯水，谢谢', transliteration: 'Yī bēi shuǐ, xièxiè', english: 'One glass of water, please', context: 'Ordering at a restaurant' },
    ],
  },
];

export type LangCode = 'arabic' | 'russian' | 'chinese';

export const LANG_META: Record<LangCode, {
  name: string;
  nativeName: string;
  flag: string;
  color: string;
  lessons: LangLesson[];
  funFact: string;
}> = {
  arabic: {
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    color: '#00AA44',
    lessons: ARABIC_LESSONS,
    funFact: 'Arabic is spoken by 400 million people across 22 countries. It\'s one of the 6 official UN languages!',
  },
  russian: {
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    color: '#CC0000',
    lessons: RUSSIAN_LESSONS,
    funFact: 'Russian is written in the Cyrillic script and is spoken by 260 million people worldwide.',
  },
  chinese: {
    name: 'Chinese (Mandarin)',
    nativeName: '普通话',
    flag: '🇨🇳',
    color: '#FF4444',
    lessons: CHINESE_LESSONS,
    funFact: 'Mandarin is spoken by 1 billion+ people, making it the most spoken language in the world by native speakers!',
  },
};
