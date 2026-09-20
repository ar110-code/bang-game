import { Card, CardName, CardSuit, CardRank, Character, Role } from './types';

export const CHARACTERS: Character[] = [
  {
    name: 'bart_cassidy',
    nameFa: 'بارت کسیدی',
    titleFa: 'جان‌سخت غرب',
    descFa: 'هر بار صدمه می‌خوره یک کارت می‌کشه.',
    baseHp: 4,
  },
  {
    name: 'black_jack',
    nameFa: 'بلک جک',
    titleFa: 'قمارباز کارکشته',
    descFa: 'کارت دوم دل یا خشت بود یک کارت بیشتر می‌کشه.',
    baseHp: 4,
  },
  {
    name: 'calamity_janet',
    nameFa: 'کالامیتی جنت',
    titleFa: 'بانوی چابک‌دست',
    descFa: 'می‌تونه BANG! رو زپلشک! و زپلشک! رو BANG! بازی کنه.',
    baseHp: 4,
  },
  {
    name: 'el_gringo',
    nameFa: 'ال گرینگو',
    titleFa: 'کینه‌توز مکزیکی',
    descFa: 'هر بازیکنی بهش صدمه بزنه یک کارت از دستش می‌کشه.',
    baseHp: 3,
  },
  {
    name: 'jesse_jones',
    nameFa: 'جسی جونز',
    titleFa: 'راهزن چیره‌دست',
    descFa: 'می‌تونه کارت اولش رو از دست یک بازیکن دیگه برداره.',
    baseHp: 4,
  },
  {
    name: 'jourdonnais',
    nameFa: 'ژوقدونه',
    titleFa: 'سپر انسانی',
    descFa: 'می‌تونه هر وقت که هدف یه BANG! قرار گرفت بشکه‌ها و اگه دل اومد جون سالم به در ببره!',
    baseHp: 4,
  },
  {
    name: 'kit_carlson',
    nameFa: 'کیت کارلسون',
    titleFa: 'دیده‌بان تیزبین',
    descFa: 'در مرحله ۱ کارت کشیدن ۳ کارت رو می‌کنه و ۲ تا رو برمی‌داره و سومی رو می‌ذاره سر جاش.',
    baseHp: 4,
  },
  {
    name: 'lucky_duke',
    nameFa: 'دوک خوش‌شانس',
    titleFa: 'خوش‌شانس ابدی',
    descFa: 'هر وقت لازمه که «کارت رو کنه» ۲ کارت رو می‌کنه و بهترین رو انتخاب می‌کنه.',
    baseHp: 4,
  },
  {
    name: 'paul_regret',
    nameFa: 'پل ریگرت',
    titleFa: 'شبح دست‌نیافتنی',
    descFa: 'همه‌ی بازیکن‌ها اونو ۱ فرسنگ دورتر می‌بینن (+۱ فاصله).',
    baseHp: 3,
  },
  {
    name: 'pedro_ramirez',
    nameFa: 'پدرو رامیرز',
    titleFa: 'لاشخور بیابان',
    descFa: 'می‌تونه اولین کارتشو از دسته‌ی کارت‌های سوخته برداره!',
    baseHp: 4,
  },
  {
    name: 'rose_doolan',
    nameFa: 'رز دولان',
    titleFa: 'تک‌تیرانداز مخوف',
    descFa: 'همه‌ی بازیکنا رو ۱ فرسنگ نزدیک‌تر می‌بینه (-۱ فاصله).',
    baseHp: 4,
  },
  {
    name: 'sid_ketchum',
    nameFa: 'سید کچم',
    titleFa: 'طبیب هفت‌تیرکش',
    descFa: 'با سوزاندن ۲ کارت ۱ جون پر می‌کنه.',
    baseHp: 4,
  },
  {
    name: 'slab_the_killer',
    nameFa: 'اسلب قاتل',
    titleFa: 'هیولای بی‌رحم',
    descFa: 'برای بی‌اثر کردن BANG! اون به ۲ تا کارت زپلشک! نیازه!',
    baseHp: 4,
  },
  {
    name: 'suzy_lafayette',
    nameFa: 'سوزی لافایت',
    titleFa: 'تیرباران بی‌پایان',
    descFa: 'به محض این‌که بدون کارت شد از دسته‌ی کارت‌ها یک کارت می‌کشه.',
    baseHp: 4,
  },
  {
    name: 'vulture_sam',
    nameFa: 'سم لاشخور',
    titleFa: 'وارث مرگ',
    descFa: 'هر بازیکنی که از بازی حذف بشه تمام کارت‌های دستش و کارت‌های بازی رو خودش رو می‌کشه.',
    baseHp: 4,
  },
  {
    name: 'willy_the_kid',
    nameFa: 'ویلی کوچیکه',
    titleFa: 'مسلسل متحرک',
    descFa: 'می‌تونه هر چند تا کارت BANG! خواست بازی کنه.',
    baseHp: 4,
  },
];

export const ROLE_DISTRIBUTION: Record<number, Role[]> = {
  4: ['sheriff', 'renegade', 'outlaw', 'outlaw'],
  5: ['sheriff', 'renegade', 'outlaw', 'outlaw', 'deputy'],
  6: ['sheriff', 'renegade', 'outlaw', 'outlaw', 'outlaw', 'deputy'],
  7: ['sheriff', 'renegade', 'outlaw', 'outlaw', 'outlaw', 'deputy', 'deputy'],
};

// 78 Card Deck blueprint
interface CardTemplate {
  name: CardName;
  titleFa: string;
  descFa: string;
  border: 'brown' | 'blue';
  suit: CardSuit;
  rank: CardRank;
  range?: number;
}

export const BASE_CARDS_BLUEPRINT: CardTemplate[] = [
  // 25x BANG! cards
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'spades', rank: 'A' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: '2' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: '3' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: '4' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: '5' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: '6' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: '7' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: '8' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: '9' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: '10' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: 'J' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: 'Q' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: 'K' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'diamonds', rank: 'A' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'clubs', rank: '2' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'clubs', rank: '3' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'clubs', rank: '4' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'clubs', rank: '5' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'clubs', rank: '6' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'clubs', rank: '7' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'clubs', rank: '8' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'clubs', rank: '9' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'hearts', rank: 'A' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'hearts', rank: 'Q' },
  { name: 'bang', titleFa: 'بنگ!', descFa: 'شلیک به یک بازیکن در برد سلاح', border: 'brown', suit: 'hearts', rank: 'K' },

  // 12x MISSED! cards (زپلشک!)
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'clubs', rank: '10' },
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'clubs', rank: 'J' },
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'clubs', rank: 'Q' },
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'clubs', rank: 'K' },
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'clubs', rank: 'A' },
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'spades', rank: '2' },
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'spades', rank: '3' },
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'spades', rank: '4' },
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'spades', rank: '5' },
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'spades', rank: '6' },
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'spades', rank: '7' },
  { name: 'missed', titleFa: 'زپلشک!', descFa: 'دفاع در برابر شلیک و جلوگیری از کاهش جان', border: 'brown', suit: 'spades', rank: '8' },

  // 6x BEER cards
  { name: 'beer', titleFa: 'نوشیدنی', descFa: 'بازیابی ۱ واحد جان (در حالت دو نفره بی‌اثر است)', border: 'brown', suit: 'hearts', rank: '6' },
  { name: 'beer', titleFa: 'نوشیدنی', descFa: 'بازیابی ۱ واحد جان (در حالت دو نفره بی‌اثر است)', border: 'brown', suit: 'hearts', rank: '7' },
  { name: 'beer', titleFa: 'نوشیدنی', descFa: 'بازیابی ۱ واحد جان (در حالت دو نفره بی‌اثر است)', border: 'brown', suit: 'hearts', rank: '8' },
  { name: 'beer', titleFa: 'نوشیدنی', descFa: 'بازیابی ۱ واحد جان (در حالت دو نفره بی‌اثر است)', border: 'brown', suit: 'hearts', rank: '9' },
  { name: 'beer', titleFa: 'نوشیدنی', descFa: 'بازیابی ۱ واحد جان (در حالت دو نفره بی‌اثر است)', border: 'brown', suit: 'hearts', rank: '10' },
  { name: 'beer', titleFa: 'نوشیدنی', descFa: 'بازیابی ۱ واحد جان (در حالت دو نفره بی‌اثر است)', border: 'brown', suit: 'hearts', rank: 'J' },

  // 1x SALOON (کافه)
  { name: 'saloon', titleFa: 'کافه', descFa: 'افزایش ۱ جان به تمام بازیکنان زنده در بازی', border: 'brown', suit: 'hearts', rank: '5' },

  // 1x WELLS FARGO
  { name: 'wells_fargo', titleFa: 'ولز فارگو', descFa: 'کشیدن فوری ۳ کارت از مخزن', border: 'brown', suit: 'hearts', rank: '3' },

  // 2x GENERAL STORE (فروشگاه)
  { name: 'general_store', titleFa: 'فروشگاه', descFa: 'رو کردن کارت به تعداد بازیکنان و تقسیم ساعت‌گرد بین همه', border: 'brown', suit: 'clubs', rank: '9' },
  { name: 'general_store', titleFa: 'فروشگاه', descFa: 'رو کردن کارت به تعداد بازیکنان و تقسیم ساعت‌گرد بین همه', border: 'brown', suit: 'spades', rank: '10' },

  // 4x PANIC! (تهدید!)
  { name: 'panic', titleFa: 'تهدید!', descFa: 'دزدیدن ۱ کارت از دست یا تجهیزات بازیکنی در فاصله ۱ فرسخ', border: 'brown', suit: 'hearts', rank: 'J' },
  { name: 'panic', titleFa: 'تهدید!', descFa: 'دزدیدن ۱ کارت از دست یا تجهیزات بازیکنی در فاصله ۱ فرسخ', border: 'brown', suit: 'hearts', rank: 'Q' },
  { name: 'panic', titleFa: 'تهدید!', descFa: 'دزدیدن ۱ کارت از دست یا تجهیزات بازیکنی در فاصله ۱ فرسخ', border: 'brown', suit: 'hearts', rank: 'A' },
  { name: 'panic', titleFa: 'تهدید!', descFa: 'دزدیدن ۱ کارت از دست یا تجهیزات بازیکنی در فاصله ۱ فرسخ', border: 'brown', suit: 'diamonds', rank: '8' },

  // 4x CAT BALOU
  { name: 'cat_balou', titleFa: 'کت بالو', descFa: 'سوزاندن ۱ کارت از دست یا تجهیزات هر بازیکنی در هر فاصله‌ای', border: 'brown', suit: 'hearts', rank: 'K' },
  { name: 'cat_balou', titleFa: 'کت بالو', descFa: 'سوزاندن ۱ کارت از دست یا تجهیزات هر بازیکنی در هر فاصله‌ای', border: 'brown', suit: 'diamonds', rank: '9' },
  { name: 'cat_balou', titleFa: 'کت بالو', descFa: 'سوزاندن ۱ کارت از دست یا تجهیزات هر بازیکنی در هر فاصله‌ای', border: 'brown', suit: 'diamonds', rank: '10' },
  { name: 'cat_balou', titleFa: 'کت بالو', descFa: 'سوزاندن ۱ کارت از دست یا تجهیزات هر بازیکنی در هر فاصله‌ای', border: 'brown', suit: 'diamonds', rank: 'J' },

  // 1x GATLING (مسلسل)
  { name: 'gatling', titleFa: 'مسلسل', descFa: 'شلیک به تمام بازیکنان دیگر؛ هرکس باید ۱ زپلشک! رد کند', border: 'brown', suit: 'hearts', rank: '10' },

  // 2x INDIANS!
  { name: 'indians', titleFa: 'سرخ‌پوست‌ها', descFa: 'حمله سرخ‌پوست‌ها! هر بازیکن دیگر باید یک کارت بنگ بیندازد یا ۱ جان بدهد', border: 'brown', suit: 'diamonds', rank: 'K' },
  { name: 'indians', titleFa: 'سرخ‌پوست‌ها', descFa: 'حمله سرخ‌پوست‌ها! هر بازیکن دیگر باید یک کارت بنگ بیندازد یا ۱ جان بدهد', border: 'brown', suit: 'diamonds', rank: 'A' },

  // 3x DUEL
  { name: 'duel', titleFa: 'دوئل', descFa: 'چلنج تک‌به‌تک؛ بازیکنان نوبتی بنگ می‌اندازند تا بالاخره یکی نتواند و آسیب ببیند', border: 'brown', suit: 'clubs', rank: '8' },
  { name: 'duel', titleFa: 'دوئل', descFa: 'چلنج تک‌به‌تک؛ بازیکنان نوبتی بنگ می‌اندازند تا بالاخره یکی نتواند و آسیب ببیند', border: 'brown', suit: 'spades', rank: 'J' },
  { name: 'duel', titleFa: 'دوئل', descFa: 'چلنج تک‌به‌تک؛ بازیکنان نوبتی بنگ می‌اندازند تا بالاخره یکی نتواند و آسیب ببیند', border: 'brown', suit: 'diamonds', rank: 'Q' },

  // WEAPONS (BLUE)
  { name: 'volcanic', titleFa: 'ولکانو', descFa: 'اسلحه با برد ۱ فرسخ، با قابلیت شلیک بنگ نامحدود در نوبت', border: 'blue', suit: 'spades', rank: '10', range: 1 },
  { name: 'volcanic', titleFa: 'ولکانو', descFa: 'اسلحه با برد ۱ فرسخ، با قابلیت شلیک بنگ نامحدود در نوبت', border: 'blue', suit: 'clubs', rank: '10', range: 1 },
  { name: 'schofield', titleFa: 'اسکوفیلد', descFa: 'اسلحه با برد شلیک ۲ فرسخ', border: 'blue', suit: 'clubs', rank: 'J', range: 2 },
  { name: 'schofield', titleFa: 'اسکوفیلد', descFa: 'اسلحه با برد شلیک ۲ فرسخ', border: 'blue', suit: 'clubs', rank: 'Q', range: 2 },
  { name: 'schofield', titleFa: 'اسکوفیلد', descFa: 'اسلحه با برد شلیک ۲ فرسخ', border: 'blue', suit: 'spades', rank: 'K', range: 2 },
  { name: 'remington', titleFa: 'رمینگتون', descFa: 'اسلحه با برد شلیک ۳ فرسخ', border: 'blue', suit: 'clubs', rank: 'K', range: 3 },
  { name: 'rev_carabine', titleFa: 'کارابین', descFa: 'اسلحه با برد شلیک ۴ فرسخ', border: 'blue', suit: 'clubs', rank: 'A', range: 4 },
  { name: 'winchester', titleFa: 'وینچستر', descFa: 'قدرتمندترین اسلحه با برد شلیک ۵ فرسخ', border: 'blue', suit: 'spades', rank: '8', range: 5 },

  // HORSES & OPTICS (BLUE)
  { name: 'mustang', titleFa: 'اسب وحشی', descFa: 'فاصله تمام بازیکنان دیگر با شما ۱ فرسخ دورتر دیده می‌شود', border: 'blue', suit: 'hearts', rank: '8' },
  { name: 'mustang', titleFa: 'اسب وحشی', descFa: 'فاصله تمام بازیکنان دیگر با شما ۱ فرسخ دورتر دیده می‌شود', border: 'blue', suit: 'hearts', rank: '9' },
  { name: 'appaloosa', titleFa: 'وسعت دید', descFa: 'فاصله دید شما به تمام بازیکنان دیگر ۱ فرسخ نزدیک‌تر می‌شود', border: 'blue', suit: 'spades', rank: 'A' },

  // BARRELS (BLUE)
  { name: 'barrel', titleFa: 'بشکه', descFa: 'دل آوردی؟ تیر بهت نخورده! (دفاع با زپلشک!)', border: 'blue', suit: 'spades', rank: 'Q' },
  { name: 'barrel', titleFa: 'بشکه', descFa: 'دل آوردی؟ تیر بهت نخورده! (دفاع با زپلشک!)', border: 'blue', suit: 'spades', rank: 'K' },

  // JAILS (BLUE)
  { name: 'jail', titleFa: 'هلفدونی', descFa: 'انداختن یک بازیکن (به جز کلانتر) به هلفدونی؛ برای فرار باید در شروع نوبتش دل بیاورد', border: 'blue', suit: 'spades', rank: 'J' },
  { name: 'jail', titleFa: 'هلفدونی', descFa: 'انداختن یک بازیکن (به جز کلانتر) به هلفدونی؛ برای فرار باید در شروع نوبتش دل بیاورد', border: 'blue', suit: 'hearts', rank: '4' },
  { name: 'jail', titleFa: 'هلفدونی', descFa: 'انداختن یک بازیکن (به جز کلانتر) به هلفدونی؛ برای فرار باید در شروع نوبتش دل بیاورد', border: 'blue', suit: 'spades', rank: '10' },

  // DYNAMITE (BLUE)
  { name: 'dynamite', titleFa: 'دینامیت', descFa: 'بین بازیکنان می‌چرخد؛ اگر تست بین ۲ تا ۹ پیک باشد، منفجر شده و ۳ جان می‌برد!', border: 'blue', suit: 'hearts', rank: '2' },
];
