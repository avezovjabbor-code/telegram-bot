/**
 * HARBIYLAR & QUROLLI KUCHLAR AXBOROT PORTALI - CORE ENGINE
 * Interactive Tactical HUD, Radar Canvas, Ranks Explorer, Hardware Specs, Quiz & Fitness Calc.
 */

// ==========================================
// 1. TACTICAL AUDIO SYSTEM (Web Audio API)
// ==========================================
class TacticalAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
  }

  toggle() {
    this.init();
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(freq, type, duration, vol = 0.05) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio context error:', e);
    }
  }

  radarBeep() {
    this.playTone(880, 'sine', 0.15, 0.03);
  }

  buttonClick() {
    this.playTone(1200, 'triangle', 0.08, 0.04);
  }

  successChime() {
    if (!this.enabled || !this.ctx) return;
    setTimeout(() => this.playTone(523.25, 'sine', 0.12, 0.05), 0);
    setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.05), 100);
    setTimeout(() => this.playTone(783.99, 'sine', 0.25, 0.06), 200);
  }
}

const tacticalSound = new TacticalAudio();

// ==========================================
// 2. CANVAS RADAR & TELEMETRY SIMULATION
// ==========================================
class RadarSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.angle = 0;
    this.targets = [
      { r: 0.35, angle: 0.8, size: 4, alpha: 1, label: 'UZ-01' },
      { r: 0.65, angle: 2.4, size: 5, alpha: 1, label: 'UZ-09' },
      { r: 0.50, angle: 4.1, size: 4, alpha: 1, label: 'DEF-4' },
      { r: 0.80, angle: 5.3, size: 6, alpha: 1, label: 'AIR-7' }
    ];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    const size = this.canvas.parentElement.clientWidth;
    this.canvas.width = size;
    this.canvas.height = size;
    this.center = size / 2;
    this.radius = this.center - 10;
  }

  animate() {
    this.draw();
    this.angle = (this.angle + 0.025) % (Math.PI * 2);
    requestAnimationFrame(() => this.animate());
  }

  draw() {
    const ctx = this.ctx;
    const c = this.center;
    const r = this.radius;

    // Clear Canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw concentric circles
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.25)';
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(c, c, (r / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(c - r, c);
    ctx.lineTo(c + r, c);
    ctx.moveTo(c, c - r);
    ctx.lineTo(c, c + r);
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.2)';
    ctx.stroke();

    // Degree ticks
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const x1 = c + Math.cos(rad) * (r - 6);
      const y1 = c + Math.sin(rad) * (r - 6);
      const x2 = c + Math.cos(rad) * r;
      const y2 = c + Math.sin(rad) * r;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.5)';
      ctx.stroke();
    }

    // Draw Sweeping Sector
    const sweepGradient = ctx.createRadialGradient(c, c, 0, c, c, r);
    sweepGradient.addColorStop(0, 'rgba(0, 230, 118, 0.3)');
    sweepGradient.addColorStop(1, 'rgba(0, 230, 118, 0.0)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, r, this.angle - 0.4, this.angle, false);
    ctx.closePath();
    ctx.fillStyle = sweepGradient;
    ctx.fill();

    // Sweep Line
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + Math.cos(this.angle) * r, c + Math.sin(this.angle) * r);
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Targets & Blips
    this.targets.forEach((tgt) => {
      const tx = c + Math.cos(tgt.angle) * (tgt.r * r);
      const ty = c + Math.sin(tgt.angle) * (tgt.r * r);

      // Check sweep collision for ping effect
      const diff = Math.abs(this.angle - tgt.angle);
      if (diff < 0.05) {
        tgt.alpha = 1;
        tacticalSound.radarBeep();
      } else {
        tgt.alpha = Math.max(0.2, tgt.alpha - 0.005);
      }

      ctx.beginPath();
      ctx.arc(tx, ty, tgt.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 193, 7, ${tgt.alpha})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 213, 79, ${tgt.alpha})`;
      ctx.stroke();

      // Target Label
      ctx.font = '10px monospace';
      ctx.fillStyle = `rgba(0, 230, 118, ${tgt.alpha})`;
      ctx.fillText(tgt.label, tx + 8, ty - 4);
    });
  }
}

// ==========================================
// 3. SVG POGON INSIGNIA GENERATOR
// ==========================================
function getPogonSVG(rankKey) {
  // Base Pogon Template (Standard Military Dark Olive/Gold Board)
  const baseBoard = `
    <defs>
      <linearGradient id="pogonBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#182d1c"/>
        <stop offset="50%" stop-color="#243f29"/>
        <stop offset="100%" stop-color="#132416"/>
      </linearGradient>
      <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffd54f"/>
        <stop offset="50%" stop-color="#ffb300"/>
        <stop offset="100%" stop-color="#ff8f00"/>
      </linearGradient>
      <filter id="pogonShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>
    <!-- Shoulder Board Body -->
    <path d="M 15 5 L 85 5 L 95 30 L 95 175 L 5 175 L 5 30 Z" fill="url(#pogonBg)" stroke="url(#goldTrim)" stroke-width="2.5" filter="url(#pogonShadow)"/>
    <!-- Top Button -->
    <circle cx="50" cy="20" r="6" fill="url(#goldTrim)" stroke="#b26a00" stroke-width="1"/>
    <circle cx="50" cy="20" r="2.5" fill="#333"/>
  `;

  // Gold Star SVG Component
  const goldStar = (cx, cy, r = 12) => `
    <polygon points="
      ${cx},${cy - r} 
      ${cx + r * 0.3},${cy - r * 0.35} 
      ${cx + r * 0.95},${cy - r * 0.3} 
      ${cx + r * 0.45},${cy + r * 0.15} 
      ${cx + r * 0.6},${cy + r * 0.8} 
      ${cx},${cy + r * 0.4} 
      ${cx - r * 0.6},${cy + r * 0.8} 
      ${cx - r * 0.45},${cy + r * 0.15} 
      ${cx - r * 0.95},${cy - r * 0.3} 
      ${cx - r * 0.3},${cy - r * 0.35}" 
      fill="url(#goldTrim)" stroke="#fff" stroke-width="0.5" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.5))"/>
  `;

  // Insignia Strip (Chiziq/Prosvyet)
  const verticalStripe = (x) => `<line x1="${x}" y1="35" x2="${x}" y2="175" stroke="#ffb300" stroke-width="3"/>`;
  const horizontalSergeantBar = (y, thick = 6) => `<rect x="15" y="${y}" width="70" height="${thick}" fill="url(#goldTrim)" stroke="#8c5800" stroke-width="0.5" rx="1"/>`;

  let innerContent = '';

  switch (rankKey) {
    // ASKARLAR VA SERJANTLAR
    case 'oddiy-askar':
      innerContent = ``;
      break;
    case 'kichik-serjant':
      innerContent = horizontalSergeantBar(120, 6) + horizontalSergeantBar(132, 6);
      break;
    case 'serjant':
      innerContent = horizontalSergeantBar(108, 6) + horizontalSergeantBar(120, 6) + horizontalSergeantBar(132, 6);
      break;
    case 'katta-serjant':
      innerContent = horizontalSergeantBar(115, 14);
      break;

    // KICHIK OFITSERLAR (1 vertical line)
    case 'leytenant':
      innerContent = verticalStripe(50) + goldStar(30, 130, 9) + goldStar(70, 130, 9);
      break;
    case 'katta-leytenant':
      innerContent = verticalStripe(50) + goldStar(30, 135, 9) + goldStar(70, 135, 9) + goldStar(50, 95, 9);
      break;
    case 'kapitan':
      innerContent = verticalStripe(50) + goldStar(30, 140, 9) + goldStar(70, 140, 9) + goldStar(30, 100, 9) + goldStar(70, 100, 9);
      break;

    // KATTA OFITSERLAR (2 vertical lines)
    case 'mayor':
      innerContent = verticalStripe(35) + verticalStripe(65) + goldStar(50, 115, 13);
      break;
    case 'podpolkovnik':
      innerContent = verticalStripe(35) + verticalStripe(65) + goldStar(30, 130, 13) + goldStar(70, 130, 13);
      break;
    case 'polkovnik':
      innerContent = verticalStripe(35) + verticalStripe(65) + goldStar(30, 135, 13) + goldStar(70, 135, 13) + goldStar(50, 95, 13);
      break;

    // OLIY OFITSERLAR (GENERALS)
    case 'general-mayor':
      innerContent = goldStar(50, 110, 18);
      break;
    case 'general-leytenant':
      innerContent = goldStar(50, 135, 17) + goldStar(50, 85, 17);
      break;
    case 'general-polkovnik':
      innerContent = goldStar(50, 145, 16) + goldStar(50, 105, 16) + goldStar(50, 65, 16);
      break;
    case 'armiya-generali':
      innerContent = goldStar(50, 110, 24) + `<circle cx="50" cy="110" r="28" fill="none" stroke="url(#goldTrim)" stroke-width="1.5" stroke-dasharray="3,3"/>`;
      break;

    default:
      innerContent = '';
  }

  return `<svg viewBox="0 0 100 180" xmlns="http://www.w3.org/2000/svg">${baseBoard}${innerContent}</svg>`;
}

// ==========================================
// 4. DATA REPOSITORIES (UZBEK ARMED FORCES)
// ==========================================

const MILITARY_BRANCHES = [
  {
    id: 'land-forces',
    code: 'QO-01',
    name: "Quruqlikdagi Qo'shinlar",
    icon: 'fa-shield-halved',
    summary: "Qurolli Kuchlarning asosiy va ko'p sonli tarkibiy qismi. Quruqlikdagi dushman tajovuzini daf etish va hududiy yaxlitlikni himoya qiladi.",
    features: [
      "Motouqchi va tank birlashmalari",
      "Raketa qo'shinlari va zamonaviy artilleriya",
      "Muhandislik va kimyoviy himoya bo'linmalari"
    ],
    fullDesc: "Quruqlikdagi qo'shinlar zamonaviy og'ir zirhli texnikalar, tanklar, piyoda jangovar mashinalari (BTR/BMP), o'ziyurar gaubitsalar va reaktiv tizimlar bilan qurollangan. Ular har qanday iqlim va relyef sharoitida jangovar vazifalarni bajarishga shay holatda turadi."
  },
  {
    id: 'air-force',
    code: 'HHM-02',
    name: "Harbiy Havo Kuchlari va HHM",
    icon: 'fa-jet-fighter',
    summary: "O'zbekiston havo sarhadlari daxlsizligini tunu-kun ta'minlaydi, strategik ob'ektlarni havo hujumlaridan ishonchli muhofaza qiladi.",
    features: [
      "Qiruvchi va zarba beruvchi aviatsiya (MiG-29, Su-25)",
      "Zamonaviy dronlar (Bayraktar TB2, Wing Loong)",
      "Zenit-raketa majmualari (HQ-9, Pechora-2M)"
    ],
    fullDesc: "Harbiy havo kuchlari zamonaviy radiolokatsiya stansiyalari (RLS), havo jangovar boshqaruv markazlari va ko'p funksiyali zarbdor uchuvchisiz uchish apparatlari bilan to'liq integratsiyalashgan."
  },
  {
    id: 'special-forces',
    code: 'MOK-03',
    name: "Maxsus Operatsiyalar Kuchlari",
    icon: 'fa-crosshairs',
    summary: "Yuqori darajadagi jismoniy, taktik va merganlik tayyorgarligiga ega elita bo'linmalar. Terrorizmga qarshi kurash va noan'anaviy xavflarni bartaraf etadi.",
    features: [
      "Tog' va cho'l taktik guruhlari",
      "Yuqori aniqlikdagi snayperlik guruhlari",
      "Havo-desant va tezkor harakatlanuvchi otryadlar"
    ],
    fullDesc: "Maxsus operatsiyalar kuchlari xalqaro armiya o'yinlarida (masalan, 'Kembriya patruli' - Buyuk Britaniya) doimiy ravishda faxrli 1-o'rinlarni egallab kelmoqda."
  },
  {
    id: 'border-guard',
    code: 'CHQ-04',
    name: "Chegara Qo'shinlari",
    icon: 'fa-tower-observation',
    summary: "Davlat chegara chizig'i daxlsizligini, noqonuniy kirib kelishlar va kontrabandaga qarshi barqaror mudofaani ta'minlaydi.",
    features: [
      "Optoelektronik kuzatuv tizimlari",
      "Kinolokiya (xizmat itlari) markazi",
      "Tezkor kordon va chegarachilar postlari"
    ],
    fullDesc: "Chegara qo'shinlari respublikamizning barcha perimetri bo'ylab mustaqillik va osoyishtalikning birinchi qalqoni sifatida xizmat o'taydi."
  },
  {
    id: 'national-guard',
    code: 'MG-05',
    name: "Milliy Gvardiya",
    icon: 'fa-building-shield',
    summary: "Jamoat tartibi va xavfsizligini ta'minlash, muhim davlat ob'ektlarini qo'riqlash hamda favqulodda vaziyatlarda qat'iy harakat qiluvchi tuzilma.",
    features: [
      "Jamoat xavfsizligi patrul xizmati",
      "Strategik davlat inshootlari mudofaasi",
      "Faxriy qorovul bataloni"
    ],
    fullDesc: "O'zbekiston Milliy Gvardiyasi yuksak tayyorgarlik va zamonaviy maxsus texnikalar bilan jihozlangan mustaqil huquqni muhofaza qiluvchi harbiy tuzilmadir."
  },
  {
    id: 'cyber-signal',
    code: 'KIB-06',
    name: "Aloqa va Kiberxavfsizlik",
    icon: 'fa-network-wired',
    summary: "Harbiy qo'shinlarni boshqarishda uzluksiz raqamli himoyalangan aloqa, sun'iy yo'ldosh tizimlari va kiberxavfsizlikni kafolatlaydi.",
    features: [
      "Shifrlangan dala aloqa tarmoqlari",
      "Radioelektron kurash (REB) tizimlari",
      "Mudofaa axborot xavfsizligi markazi"
    ],
    fullDesc: "Zamonaviy urushlarda ma'lumotlar va aloqa hal qiluvchi kuchdir. Ushbu bo'linma eng ilg'or axborot texnologiyalari bilan jihozlangan."
  }
];

const MILITARY_RANKS = [
  // Oddiy askar va serjantlar
  { id: 'oddiy-askar', category: 'enlisted', name: "Qatordagi Askar", details: "Harbiy xizmatga chaqirilgan yoki qabul qilingan harbiy xizmatchiga beriladigan boshlang'ich harbiy unvon." },
  { id: 'kichik-serjant', category: 'enlisted', name: "Kichik Serjant", details: "Bo'linma komandiri o'rinbosari yoki guruh komandiri lavozimidagi xizmatchilarga beriladi." },
  { id: 'serjant', category: 'enlisted', name: "Serjant", details: "Guruh komandiri yoki tank/mashina komandiri bo'lib xizmat qiluvchi serjantlar tarkibi unvoni." },
  { id: 'katta-serjant', category: 'enlisted', name: "Katta Serjant", details: "Vzvod komandiri yordamchisi yoki rota boshlig'i lavozimidagi tajribali harbiy xizmatchilar unvoni." },

  // Kichik ofitserlar
  { id: 'leytenant', category: 'junior-officer', name: "Leytenant", details: "Oliy harbiy bilim yurtini tamomlagan bitiruvchilarga beriladigan birinchi ofitserlik unvoni." },
  { id: 'katta-leytenant', category: 'junior-officer', name: "Katta Leytenant", details: "Vzvod yoki rota komandiri o'rinbosari sifatida xizmat o'taydigan ofitserlar unvoni." },
  { id: 'kapitan', category: 'junior-officer', name: "Kapitan", details: "Rota yoki batareya komandiri lavozimlaridagi kichik ofitserlar tarkibining eng yuqori unvoni." },

  // Katta ofitserlar
  { id: 'mayor', category: 'senior-officer', name: "Mayor", details: "Batalon yoki divizion komandiri o'rinbosari lavozimlaridagi katta ofitserlar unvoni." },
  { id: 'podpolkovnik', category: 'senior-officer', name: "Podpolkovnik", details: "Batalon komandiri yoki polk komandiri o'rinbosari lavozimlarida beriladi." },
  { id: 'polkovnik', category: 'senior-officer', name: "Polkovnik", details: "Polk, brigada komandiri yoki qo'mondonlik shtablarida mas'ul lavozimlardagi ofitserlar unvoni." },

  // Oliy ofitserlar
  { id: 'general-mayor', category: 'generals', name: "General-Mayor", details: "Oliy ofitserlar tarkibining boshlang'ich unvoni. Katta harbiy tuzilmalar va birlashmalar qo'mondoni." },
  { id: 'general-leytenant', category: 'generals', name: "General-Leytenant", details: "Harbiy okrug qo'shinlari qo'mondoni yoki vazirlik rahbariyati tarkibidagi unvon." },
  { id: 'general-polkovnik', category: 'generals', name: "General-Polkovnik", details: "Mudofaa vaziri yoki Qurolli Kuchlar Bosh shtabi boshlig'iga beriladigan yuksak unvon." },
  { id: 'armiya-generali', category: 'generals', name: "Armiya Generali", details: "Tinchlik va urush davrida alohida xizmatlari uchun beriladigan eng oliy harbiy unvon." }
];

const MILITARY_HARDWARE = [
  {
    id: 't-72b3',
    type: 'armor',
    typeName: 'Zirhli Texnika',
    name: 'T-72B3 Modernizatsiyalangan Tank',
    iconSVG: `<svg viewBox="0 0 200 100" fill="#4caf50"><path d="M20 70 h160 l-15 15 h-130 z"/><circle cx="45" cy="77" r="6" fill="#111"/><circle cx="70" cy="77" r="6" fill="#111"/><circle cx="95" cy="77" r="6" fill="#111"/><circle cx="120" cy="77" r="6" fill="#111"/><circle cx="145" cy="77" r="6" fill="#111"/><path d="M40 50 h110 l-20 20 h-80 z" fill="#2e7d32"/><path d="M70 35 h50 l-10 15 h-35 z" fill="#1b5e20"/><rect x="110" y="40" width="80" height="5" fill="#333"/></svg>`,
    desc: "125 mm silliq stvolli to'p, 'Sosna-U' ko'p kanalli ko'rish moslamasi va dinamik himoya bloklari bilan jihozlangan asosiy jangovar tank.",
    specs: {
      "Kalibr": "125 mm 2A46M",
      "Tezlik": "70 km/soat",
      "Ekipaj": "3 kishi",
      "Masofa": "500 km (avtonom)"
    }
  },
  {
    id: 'bayraktar-tb2',
    type: 'air',
    typeName: 'Aviatsiya & Dron',
    name: 'Bayraktar TB2 / Wing Loong Zarbdor Dron',
    iconSVG: `<svg viewBox="0 0 200 100" fill="#00e5ff"><path d="M10 50 L90 46 L100 20 L110 46 L190 50 L110 54 L100 80 L90 54 Z" fill="#37474f"/><polygon points="95,45 105,45 102,55 98,55" fill="#00e5ff"/><line x1="40" y1="50" x2="40" y2="60" stroke="#ff9800" stroke-width="3"/><line x1="160" y1="50" x2="160" y2="60" stroke="#ff9800" stroke-width="3"/></svg>`,
    desc: "Yuqori aniqlikdagi lazerli boshqariluvchi MAM-L raketalari va 24+ soat havoda qolish imkoniyatiga ega taktik UUA.",
    specs: {
      "Maksimal balandlik": "8,200 metr",
      "Parvoz davomiyligi": "27 soat",
      "Boshqaruv radiusi": "300+ km",
      "Qurollanish": "4 ta aqlli raketa"
    }
  },
  {
    id: 'btr-82a',
    type: 'armor',
    typeName: 'Zirhli Texnika',
    name: 'BTR-82A Zirhli Transportyori',
    iconSVG: `<svg viewBox="0 0 200 100" fill="#81c784"><path d="M30 65 h140 l-10 15 h-120 z"/><circle cx="50" cy="73" r="8" fill="#222"/><circle cx="80" cy="73" r="8" fill="#222"/><circle cx="110" cy="73" r="8" fill="#222"/><circle cx="140" cy="73" r="8" fill="#222"/><path d="M45 45 h110 l-15 20 h-85 z" fill="#388e3c"/><rect x="95" y="32" width="25" height="15" fill="#1b5e20"/><rect x="110" y="35" width="55" height="4" fill="#111"/></svg>`,
    desc: "30 mm avtomatik to'p 2A72 va 7.62 mm PKTM pulemyoti bilan ta'minlangan tezyurar jangovar g'ildirakli mashina.",
    specs: {
      "To'p kalibri": "30 mm avtomat",
      "Tezlik": "80 km/soat (suvda 10)",
      "Desant sig'imi": "7 nafar jangchi",
      "Zirh turi": "Parchalanuvchi po'lat"
    }
  },
  {
    id: 'hq-9-sam',
    type: 'missile',
    typeName: 'Raketa & HHM',
    name: 'HQ-9 / FD-2000 Uzoq Masofali HHM Majmuasi',
    iconSVG: `<svg viewBox="0 0 200 100"><rect x="30" y="55" width="130" height="25" rx="4" fill="#263238"/><circle cx="50" cy="80" r="7" fill="#111"/><circle cx="80" cy="80" r="7" fill="#111"/><circle cx="120" cy="80" r="7" fill="#111"/><circle cx="145" cy="80" r="7" fill="#111"/><rect x="50" y="35" width="80" height="18" rx="3" fill="#37474f" transform="rotate(-15 50 35)"/><circle cx="125" cy="22" r="5" fill="#ff5722"/></svg>`,
    desc: "Aerodinamik va ballistik nishonlarni 200 km gacha bo'lgan masofada aniqlash va yo'q qilishga mo'ljallangan zenit-raketa tizimi.",
    specs: {
      "Nishonni urish masofasi": "200 km gacha",
      "Nishon balandligi": "30 km gacha",
      "Reaksiya vaqti": "10-15 soniya",
      "Bir vaqtda boshqaruv": "6 ta nishon"
    }
  },
  {
    id: 'su-25',
    type: 'air',
    typeName: 'Aviatsiya & Dron',
    name: 'Su-25 "Grach" Hujumkor Qiruvchi Samolyoti',
    iconSVG: `<svg viewBox="0 0 200 100"><path d="M20 50 L70 42 L80 15 L95 42 L170 48 L170 52 L95 58 L80 85 L70 58 Z" fill="#455a64"/><circle cx="130" cy="50" r="10" fill="#263238"/><rect x="60" y="38" width="10" height="4" fill="#ffd54f"/></svg>`,
    desc: "Quruqlikdagi qo'shinlarni bevosita havodan qo'llab-quvvatlash uchun mo'ljallangan zirhlangan hujumkor samolyot.",
    specs: {
      "Maksimal tezlik": "950 km/soat",
      "Jangovar yuklama": "4,400 kg",
      "To'p": "30 mm GSh-30-2",
      "Amal qilish radiusi": "750 km"
    }
  },
  {
    id: 'sv-98-sniper',
    type: 'firearm',
    typeName: "O'qotar Qurol",
    name: 'SV-98 / Orsis T-5000 Snayper Majmuasi',
    iconSVG: `<svg viewBox="0 0 200 100"><rect x="20" y="48" width="150" height="6" fill="#333"/><rect x="60" y="40" width="35" height="10" fill="#555" rx="2"/><line x1="75" y1="40" x2="75" y2="30" stroke="#00e676" stroke-width="2"/><path d="M20 54 L35 70 L45 70 L40 54 Z" fill="#5d4037"/><rect x="120" y="54" width="30" height="12" fill="#795548"/></svg>`,
    desc: "1500 metrgacha bo'lgan masofada nishonni birinchi o'qdayoq yuqori aniqlikda urish imkonini beruvchi professional snayper quroli.",
    specs: {
      "Kalibr": "7.62x54mmR / .338 LM",
      "Nishonga olish masofasi": "1,500 m",
      "O'qdon sig'imi": "10 dona",
      "Aniqlik darajasi": "0.5 MOA gacha"
    }
  }
];

const HISTORICAL_HEROES = [
  {
    era: "XIV - XV ASRLAR",
    name: "Sohibqiron Amir Temur",
    quote: "Kuch — adolatdadir. Yuz minglab qo'shinni birdek boshqarish qat'iy intizom va strategiyaga tayanadi.",
    desc: "Dunyo harbiy san'ati tarixidagi eng buyuk sarkardalardan biri. 'Temur tuzuklari' harbiy boshqaruv, qo'shin tuzilishi (o'nlik, yuzlik, minglik, tuman) va jangovar taktikaning jahon standartiga aylangan."
  },
  {
    era: "XIII ASR",
    name: "Jaloliddin Manguberdi",
    quote: "Vatan nomusi va erki uchun so'nggi nafasgacha mardona jang qilish — mardlar burchidir.",
    desc: "Chingizxon qo'shinlariga qarshi Parvon jangida ilk bor qaqshatqich zarba bergan milliy qahramon. Uning jasorati va harbiy mahorati dushmanlari tomonidan ham e'tirof etilgan."
  },
  {
    era: "XV - XVI ASRLAR",
    name: "Zahiriddin Muhammad Bobur",
    quote: "Har ishki qilsang, aql ila qil, qo'shin tadbiri mardlikdan ustundir.",
    desc: "Buyuk sarkarda, davlat arbobi va shoir. Panipat jangida o't ochuvchi to'plar va otliqlar uyg'unligi (to'lg'ama usuli) orqali yirik saltanat asosini yaratgan."
  },
  {
    era: "1941 - 1945 YILLAR",
    name: "Sobir Rahimov — General-Mayor",
    quote: "Temir general nomini olgan jasur o'zbek o'g'loni.",
    desc: "Ikkinchi jahon urushida o'zbekistonlik birinchi general-mayor. Qator strategik qal'alarni ozod etishda ko'rsatgan yuksak qo'mondonlik mahorati va mardligi uchun 'Temir general' laqabini olgan."
  }
];

const MILITARY_QUIZ = [
  {
    question: "1. Kutilmagan qiyin vaziyatga tushib qolsangiz, qanday yo'l tutasiz?",
    options: [
      { text: "Barcha texnik vositalarni tahlil qilib, uzoqdan aniq yechim topaman", type: "tech" },
      { text: "Darhol jasorat bilan oldinga intilaman va vaziyatni o'z qo'limga olaman", type: "special" },
      { text: "Baland nuqtadan vaziyatni to'liq nazorat qilib, tezkor qaror qabul qilaman", type: "air" },
      { text: "Guruh bilan birgalikda mustahkam mudofaa chizig'ini tashkil etaman", type: "armor" }
    ]
  },
  {
    question: "2. Sizga qaysi mashg'ulot yoki soha ko'proq qiziqroq?",
    options: [
      { text: "Aviatsiya, uchish apparatlari va eng yuqori tezlik", type: "air" },
      { text: "Tog'larda piyoda yurish, merganlik va ekstremal sport turlari", type: "special" },
      { text: "Og'ir qurollar, kuchli dvigatellar va zirhli himoya", type: "armor" },
      { text: "Kompyuter tarmoqlari, kiberxavfsizlik va radiotexnika", type: "tech" }
    ]
  },
  {
    question: "3. Jamoada qanday rolni yaxshi bajarasiz?",
    options: [
      { text: "Eng oldingi saflarda zarba beruvchi yetakchi", type: "special" },
      { text: "Barcha aloqa va axborot oqimini ta'minlovchi muvofiqlashtiruvchi", type: "tech" },
      { text: "Do'stlarini har qanday zarbadan himoya qiluvchi ishonchli qalqon", type: "armor" },
      { text: "Vaziyatni yuqoridan kuzatib, strategik yo'nalish beruvchi", type: "air" }
    ]
  },
  {
    question: "4. Siz uchun jangovar harakatda eng muhimi nima?",
    options: [
      { text: "Aniqlik va birinchi urinishdayoq nishonga tegish", type: "special" },
      { text: "Tezlik va kutilmagan havo zarbasi", type: "air" },
      { text: "Qudratli o't ochish kuchi va mustahkam zirh", type: "armor" },
      { text: "Dushman aloqasini to'sish va axborot ustunligi", type: "tech" }
    ]
  },
  {
    question: "5. O'zingizda qaysi xislatni eng kuchli deb bilasiz?",
    options: [
      { text: "Sabr-toqat, chidamlilik va sovuqqonlik", type: "special" },
      { text: "Zukkolik, mantiqiy fikrlash va tahlil qobiliyati", type: "tech" },
      { text: "Temir iroda va jismoniy baquvvatlik", type: "armor" },
      { text: "Tezkor reaksiya va keng ko'lamli fazoviy tasavvur", type: "air" }
    ]
  }
];

const QUIZ_RESULTS = {
  special: {
    title: "MAXSUS OPERATSIYALAR KUCHLARI (SNIPER / DESANT)",
    icon: "fa-crosshairs",
    desc: "Sizda nihoyatda kuchli sovuqqonlik, yuksak jasorat va mardlik bor. Siz ekstremal sharoitlarda eng murakkab maxsus topshiriqlarni a'lo darajada bajara olasiz!"
  },
  air: {
    title: "HARBIY HAVO KUCHLARI VA AVIATSIYA",
    icon: "fa-jet-fighter",
    desc: "Siz tezkorlik, baland parvoz va keng strategik ko'lamni sevasiz. Zamonaviy qiruvchi samolyotlar va yuqori texnologiyali dronlar boshqaruvi sizga mos!"
  },
  armor: {
    title: "ZIRHLI TANK VA MOTOUQCHI QO'SHINLARI",
    icon: "fa-shield-halved",
    desc: "Siz yengilmas qudrat, ishonchli mudofaa va kuchli texnikalarga moyilsiz. Tank va zirhli koloniyalarning asosiy zarba kuchi siz bo'lasiz!"
  },
  tech: {
    title: "HARBIY ALOQA VA KIBERXAVFSIZLIK MUTAXASSISI",
    icon: "fa-network-wired",
    desc: "Siz intellektual quvvat, zamonaviy axborot xavfsizligi va yuqori aniqlikdagi texnologiyalarga tayanuvchi strategsiz!"
  }
};

// ==========================================
// 5. APPLICATION CONTROLLER & UI BINDINGS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Radar
  new RadarSimulation('radarCanvas');

  // 2. Audio Toggle
  const audioBtn = document.getElementById('audioToggleBtn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const active = tacticalSound.toggle();
      audioBtn.classList.toggle('active', active);
      audioBtn.innerHTML = active 
        ? '<i class="fa-solid fa-volume-high"></i> <span>Ovoz: YOQILGAN</span>' 
        : '<i class="fa-solid fa-volume-xmark"></i> <span>Ovoz: O\'CHIK</span>';
      if (active) tacticalSound.buttonClick();
    });
  }

  // 3. Render Branches
  renderBranches();

  // 4. Render Ranks
  renderRanks('enlisted');
  setupRankTabs();

  // 5. Render Hardware
  renderHardware('all');
  setupHardwareFilters();

  // 6. Render History Timeline
  renderHistory();

  // 7. Initialize Quiz
  initQuiz();

  // 8. Initialize Fitness Calculator
  initFitnessCalc();

  // 9. Global Tactical Search
  initTacticalSearch();

  // 10. Navigation scroll effects
  setupNavigation();
});

// Render Military Branches
function renderBranches() {
  const container = document.getElementById('branchesGrid');
  if (!container) return;

  container.innerHTML = MILITARY_BRANCHES.map(b => `
    <div class="branch-card" data-title="${b.name.toLowerCase()}">
      <div class="branch-icon-header">
        <div class="branch-icon-box">
          <i class="fa-solid ${b.icon}"></i>
        </div>
        <span class="branch-code">${b.code}</span>
      </div>
      <h3 class="branch-name">${b.name}</h3>
      <p class="branch-summary">${b.summary}</p>
      <ul class="branch-features">
        ${b.features.map(f => `<li><i class="fa-solid fa-angle-right"></i> ${f}</li>`).join('')}
      </ul>
      <button class="btn-card-action" onclick="openBranchModal('${b.id}')">
        <span>Batafsil ma'lumot</span>
        <i class="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  `).join('');
}

// Render Ranks
function renderRanks(category = 'enlisted') {
  const container = document.getElementById('ranksGrid');
  if (!container) return;

  const filtered = category === 'all' 
    ? MILITARY_RANKS 
    : MILITARY_RANKS.filter(r => r.category === category);

  container.innerHTML = filtered.map(r => `
    <div class="rank-card" data-title="${r.name.toLowerCase()}">
      <div class="pogon-container">
        ${getPogonSVG(r.id)}
      </div>
      <span class="rank-category-tag">${getCategoryName(r.category)}</span>
      <h4 class="rank-name">${r.name}</h4>
      <p class="rank-details">${r.details}</p>
    </div>
  `).join('');
}

function getCategoryName(cat) {
  switch (cat) {
    case 'enlisted': return 'Askarlar va Serjantlar';
    case 'junior-officer': return 'Kichik Ofitserlar';
    case 'senior-officer': return 'Katta Ofitserlar';
    case 'generals': return 'Oliy Ofitserlar (Generallar)';
    default: return 'Harbiy Tarkib';
  }
}

function setupRankTabs() {
  const tabBtns = document.querySelectorAll('.rank-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');
      renderRanks(cat);
      tacticalSound.buttonClick();
    });
  });
}

// Render Hardware
function renderHardware(type = 'all') {
  const container = document.getElementById('hardwareGrid');
  if (!container) return;

  const filtered = type === 'all' 
    ? MILITARY_HARDWARE 
    : MILITARY_HARDWARE.filter(h => h.type === type);

  container.innerHTML = filtered.map(h => `
    <div class="hardware-card" data-title="${h.name.toLowerCase()}">
      <div class="hardware-media">
        ${h.iconSVG}
        <span class="hardware-type-badge">${h.typeName}</span>
      </div>
      <div class="hardware-body">
        <h3 class="hardware-title">${h.name}</h3>
        <p class="hardware-desc">${h.desc}</p>
        <div class="hardware-specs-preview">
          ${Object.entries(h.specs).slice(0, 4).map(([k, v]) => `
            <div class="spec-mini-item">
              <span class="spec-mini-label">${k}</span>
              <span class="spec-mini-val">${v}</span>
            </div>
          `).join('')}
        </div>
        <button class="btn-card-action" onclick="openHardwareModal('${h.id}')">
          <i class="fa-solid fa-list-check"></i>
          <span>To'liq Texnik Xususiyatlar</span>
        </button>
      </div>
    </div>
  `).join('');
}

function setupHardwareFilters() {
  const filterBtns = document.querySelectorAll('.hardware-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.getAttribute('data-type');
      renderHardware(type);
      tacticalSound.buttonClick();
    });
  });
}

// Render History
function renderHistory() {
  const container = document.getElementById('historyTimeline');
  if (!container) return;

  container.innerHTML = HISTORICAL_HEROES.map((h, i) => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <span class="commander-era">${h.era}</span>
        <h3 class="commander-name">${h.name}</h3>
        <p class="commander-quote">"${h.quote}"</p>
        <p class="commander-desc">${h.desc}</p>
      </div>
    </div>
  `).join('');
}

// ==========================================
// 6. QUIZ LOGIC
// ==========================================
let currentQuestionIndex = 0;
let quizScores = { special: 0, air: 0, armor: 0, tech: 0 };

function initQuiz() {
  loadQuestion(0);
}

function loadQuestion(index) {
  const qTitle = document.getElementById('quizQuestionTitle');
  const optList = document.getElementById('quizOptionsList');
  const qMeta = document.getElementById('quizMetaNumber');
  const fill = document.getElementById('quizProgressFill');

  if (!qTitle || !optList) return;

  const currentQ = MILITARY_QUIZ[index];
  qTitle.innerText = currentQ.question;
  qMeta.innerText = `SAVOL 0${index + 1} / 05`;
  fill.style.width = `${((index + 1) / MILITARY_QUIZ.length) * 100}%`;

  const letters = ['A', 'B', 'C', 'D'];
  optList.innerHTML = currentQ.options.map((opt, i) => `
    <button class="quiz-option-btn" onclick="handleQuizAnswer('${opt.type}')">
      <span class="option-letter">${letters[i]}</span>
      <span>${opt.text}</span>
    </button>
  `).join('');
}

function handleQuizAnswer(type) {
  tacticalSound.buttonClick();
  quizScores[type] = (quizScores[type] || 0) + 1;
  currentQuestionIndex++;

  if (currentQuestionIndex < MILITARY_QUIZ.length) {
    loadQuestion(currentQuestionIndex);
  } else {
    showQuizResult();
  }
}

function showQuizResult() {
  const questionView = document.getElementById('quizQuestionView');
  const resultView = document.getElementById('quizResultView');

  if (questionView) questionView.style.display = 'none';
  if (resultView) resultView.style.display = 'block';

  // Determine highest score
  let maxType = 'special';
  let maxVal = -1;
  for (const [k, v] of Object.entries(quizScores)) {
    if (v > maxVal) {
      maxVal = v;
      maxType = k;
    }
  }

  const res = QUIZ_RESULTS[maxType] || QUIZ_RESULTS.special;
  document.getElementById('resultBadgeIcon').innerHTML = `<i class="fa-solid ${res.icon}"></i>`;
  document.getElementById('resultBadgeTitle').innerText = res.title;
  document.getElementById('resultBadgeDesc').innerText = res.desc;

  tacticalSound.successChime();
}

function restartQuiz() {
  tacticalSound.buttonClick();
  currentQuestionIndex = 0;
  quizScores = { special: 0, air: 0, armor: 0, tech: 0 };
  document.getElementById('quizResultView').style.display = 'none';
  document.getElementById('quizQuestionView').style.display = 'block';
  loadQuestion(0);
}

// ==========================================
// 7. FITNESS CALCULATOR
// ==========================================
function initFitnessCalc() {
  const pullupsInput = document.getElementById('calcPullups');
  const sprintInput = document.getElementById('calcSprint');
  const runInput = document.getElementById('calcRun');

  if (!pullupsInput || !sprintInput || !runInput) return;

  const inputs = [pullupsInput, sprintInput, runInput];
  inputs.forEach(input => {
    input.addEventListener('input', calculateFitnessScore);
  });

  calculateFitnessScore();
}

function calculateFitnessScore() {
  const pullups = parseFloat(document.getElementById('calcPullups').value) || 0;
  const sprint = parseFloat(document.getElementById('calcSprint').value) || 0;
  const run = parseFloat(document.getElementById('calcRun').value) || 0;

  // Pull-ups evaluation (Max 35 points)
  let pullupScore = 0;
  if (pullups >= 15) pullupScore = 35;
  else if (pullups >= 12) pullupScore = 30;
  else if (pullups >= 10) pullupScore = 25;
  else if (pullups >= 8) pullupScore = 20;
  else if (pullups >= 5) pullupScore = 15;
  else pullupScore = pullups * 2;

  // 100m sprint evaluation (Max 30 points)
  let sprintScore = 0;
  if (sprint > 0) {
    if (sprint <= 13.0) sprintScore = 30;
    else if (sprint <= 13.6) sprintScore = 26;
    else if (sprint <= 14.2) sprintScore = 22;
    else if (sprint <= 15.0) sprintScore = 16;
    else sprintScore = 10;
  }

  // 3000m running evaluation (Max 35 points)
  let runScore = 0;
  if (run > 0) {
    if (run <= 12.0) runScore = 35;
    else if (run <= 12.45) runScore = 30;
    else if (run <= 13.3) runScore = 25;
    else if (run <= 14.2) runScore = 20;
    else runScore = 12;
  }

  const totalScore = Math.min(100, Math.round(pullupScore + sprintScore + runScore));

  const scoreValEl = document.getElementById('calcScoreValue');
  const gradeBadgeEl = document.getElementById('calcGradeBadge');
  const evalDescEl = document.getElementById('calcEvalDesc');

  if (scoreValEl) scoreValEl.innerText = totalScore;

  if (gradeBadgeEl && evalDescEl) {
    gradeBadgeEl.className = 'score-grade-badge';
    if (totalScore >= 85) {
      gradeBadgeEl.classList.add('grade-excellent');
      gradeBadgeEl.innerText = "A'LO DARAJA (1-TOIFA)";
      evalDescEl.innerText = "Siz harbiy xizmat va maxsus bo'linmalar uchun to'liq mos yuksak jismoniy tayyorgarlikka egasiz!";
    } else if (totalScore >= 70) {
      gradeBadgeEl.classList.add('grade-good');
      gradeBadgeEl.innerText = "YAXSHI DARAJA (2-TOIFA)";
      evalDescEl.innerText = "Jismoniy ko'rsatkichlaringiz yaxshi. Kichik qo'shimcha mashqlar bilan a'lo natijaga erishish mumkin.";
    } else if (totalScore >= 55) {
      gradeBadgeEl.classList.add('grade-fair');
      gradeBadgeEl.innerText = "QONIQARLI DARAJA";
      evalDescEl.innerText = "Boshlang'ich talablarga javob beradi. Turnik va kross bo'yicha chidamlilikni oshirish tavsiya etiladi.";
    } else {
      gradeBadgeEl.classList.add('grade-fail');
      gradeBadgeEl.innerText = "YETARLI EMAS";
      evalDescEl.innerText = "Harbiy xizmat normativlarini topshirish uchun intensiv jismoniy mashg'ulotlar talab etiladi.";
    }
  }
}

// ==========================================
// 8. TACTICAL MODALS
// ==========================================
function openBranchModal(branchId) {
  tacticalSound.buttonClick();
  const branch = MILITARY_BRANCHES.find(b => b.id === branchId);
  if (!branch) return;

  const modal = document.getElementById('tacticalModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  if (!modal || !title || !body) return;

  title.innerHTML = `<i class="fa-solid ${branch.icon}" style="color: var(--accent-neon-green); margin-right: 10px;"></i> ${branch.name}`;
  body.innerHTML = `
    <div style="margin-bottom: 20px;">
      <span class="branch-code" style="font-size: 0.9rem;">KODI: ${branch.code}</span>
    </div>
    <p style="font-size: 1.05rem; line-height: 1.8; color: var(--text-muted); margin-bottom: 24px;">
      ${branch.fullDesc}
    </p>
    <h4 style="font-family: 'Cinzel', serif; color: var(--accent-gold); margin-bottom: 14px;">Asosiy Funksional Vazifalari:</h4>
    <ul style="list-style: none; margin-bottom: 24px;">
      ${branch.features.map(f => `
        <li style="padding: 10px 14px; background: rgba(10,13,14,0.6); border-radius: 6px; margin-bottom: 8px; border-left: 3px solid var(--accent-neon-green); color: var(--text-main);">
          <i class="fa-solid fa-check" style="color: var(--accent-neon-green); margin-right: 8px;"></i> ${f}
        </li>
      `).join('')}
    </ul>
    <div style="background: rgba(61,106,69,0.15); border: 1px solid var(--accent-green-bright); padding: 16px; border-radius: 8px;">
      <h5 style="color: var(--accent-neon-green); margin-bottom: 6px;"><i class="fa-solid fa-shield"></i> Jangovar Shaylik</h5>
      <p style="font-size: 0.88rem; color: var(--text-muted); margin: 0;">
        Ushbu qo'shin turi O'zbekiston Respublikasi Mudofaa Vazirligi strategik rejasi doirasida 24/7 doimiy yuqori jangovar shay holatida faoliyat yuritadi.
      </p>
    </div>
  `;

  modal.classList.add('open');
}

function openHardwareModal(hwId) {
  tacticalSound.buttonClick();
  const hw = MILITARY_HARDWARE.find(h => h.id === hwId);
  if (!hw) return;

  const modal = document.getElementById('tacticalModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  if (!modal || !title || !body) return;

  title.innerText = hw.name;
  body.innerHTML = `
    <div style="width: 100%; height: 180px; background: #0c1412; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border: 1px solid var(--border-color);">
      <div style="width: 70%;">${hw.iconSVG}</div>
    </div>
    <p style="font-size: 1rem; color: var(--text-muted); line-height: 1.7; margin-bottom: 24px;">
      ${hw.desc}
    </p>
    <h4 style="font-family: 'Cinzel', serif; color: var(--accent-cyan); margin-bottom: 14px;">Batafsil Taktik-Texnik Ko'rsatkichlar (TTX):</h4>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.95rem;">
      ${Object.entries(hw.specs).map(([k, v]) => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 12px; color: var(--text-muted); font-weight: 600; width: 45%;">${k}</td>
          <td style="padding: 12px; color: var(--accent-neon-green); font-weight: 700;">${v}</td>
        </tr>
      `).join('')}
    </table>
  `;

  modal.classList.add('open');
}

function closeTacticalModal() {
  tacticalSound.buttonClick();
  const modal = document.getElementById('tacticalModal');
  if (modal) modal.classList.remove('open');
}

// Close modal on backdrop click
window.addEventListener('click', (e) => {
  const modal = document.getElementById('tacticalModal');
  if (e.target === modal) {
    closeTacticalModal();
  }
});

// ==========================================
// 9. LIVE TACTICAL SEARCH
// ==========================================
function initTacticalSearch() {
  const searchInput = document.getElementById('tacticalSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.branch-card, .hardware-card, .rank-card');

    cards.forEach(card => {
      const title = card.getAttribute('data-title') || '';
      const text = card.innerText.toLowerCase();
      if (text.includes(query) || title.includes(query)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// ==========================================
// 10. NAVIGATION & SMOOTH SCROLL
// ==========================================
function setupNavigation() {
  const header = document.querySelector('.site-header');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      mobileToggle.innerHTML = navMenu.classList.contains('open') 
        ? '<i class="fa-solid fa-xmark"></i>' 
        : '<i class="fa-solid fa-bars"></i>';
    });
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu) navMenu.classList.remove('open');
      if (mobileToggle) mobileToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });
}

// Expose globals for HTML inline events
window.openBranchModal = openBranchModal;
window.openHardwareModal = openHardwareModal;
window.closeTacticalModal = closeTacticalModal;
window.handleQuizAnswer = handleQuizAnswer;
window.restartQuiz = restartQuiz;
