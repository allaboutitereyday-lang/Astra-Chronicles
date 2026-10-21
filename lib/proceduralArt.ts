/**
 * Procedural Art & Vector SVG Engine for Astra Chronicles
 * 
 * Provides crisp, high-resolution procedural SVG assets for offline resilience,
 * dynamic loot drops, monster anomalies, and custom companion avatars.
 */

export interface ProceduralLootOptions {
  name: string;
  type?: string; // "weapon" | "armor" | "relic" | "consumable" | "tech" | "tome"
  rarity?: "common" | "uncommon" | "rare" | "epic" | "relic" | "cursed" | string;
  genre?: string;
}

export interface ProceduralMonsterOptions {
  name: string;
  rank?: "D" | "C" | "B" | "A" | "S" | string;
  genre?: string; // "fantasy" | "cyberpunk" | "cosmic"
  modifier?: string;
  element?: string;
}

export interface ProceduralCompanionOptions {
  name: string;
  role?: string;
  gender?: "female" | "male" | string;
  seed?: number;
  palette?: string;
}

/**
 * Escapes characters for inline SVG embedding.
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

/**
 * Simple string hash to generate deterministic numeric seeds.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates an SVG Data URL for a procedural RPG loot item icon.
 */
export function generateProceduralLootSvg(options: ProceduralLootOptions): string {
  const name = escapeXml(options.name || "Artifact");
  const rarity = (options.rarity || "rare").toLowerCase();
  const type = (options.type || "relic").toLowerCase();

  // Rarity color palettes
  const colorMaps: Record<string, { border: string; glow: string; bg1: string; bg2: string; text: string }> = {
    common: { border: "#64748b", glow: "#94a3b8", bg1: "#1e293b", bg2: "#0f172a", text: "#e2e8f0" },
    uncommon: { border: "#10b981", glow: "#34d399", bg1: "#064e3b", bg2: "#022c22", text: "#a7f3d0" },
    rare: { border: "#0ea5e9", glow: "#38bdf8", bg1: "#0c4a6e", bg2: "#082f49", text: "#bae6fd" },
    epic: { border: "#a855f7", glow: "#c084fc", bg1: "#581c87", bg2: "#3b0764", text: "#e9d5ff" },
    relic: { border: "#f59e0b", glow: "#fbbf24", bg1: "#78350f", bg2: "#451a03", text: "#fde68a" },
    cursed: { border: "#f43f5e", glow: "#fb7185", bg1: "#881337", bg2: "#4c0519", text: "#fecdd3" },
  };

  const c = colorMaps[rarity] || colorMaps.rare;

  // Center silhouette depending on item type
  let iconGraphic = "";
  if (type.includes("weapon") || type.includes("sword") || type.includes("blade")) {
    iconGraphic = `
      <!-- Sword / Blade Silhouette -->
      <path d="M128 36 L138 52 L132 176 L148 184 L148 196 L132 196 L132 216 L124 216 L124 196 L108 196 L108 184 L124 176 L118 52 Z" fill="${c.text}" filter="url(#glowFilter)" />
      <line x1="128" y1="46" x2="128" y2="174" stroke="${c.glow}" stroke-width="2" />
      <circle cx="128" cy="222" r="5" fill="${c.border}" />
    `;
  } else if (type.includes("shield") || type.includes("armor") || type.includes("guard")) {
    iconGraphic = `
      <!-- Shield / Crest Silhouette -->
      <path d="M78 60 L178 60 L178 130 Q178 195 128 218 Q78 195 78 130 Z" fill="none" stroke="${c.glow}" stroke-width="5" filter="url(#glowFilter)" />
      <path d="M88 70 L168 70 L168 128 Q168 182 128 202 Q88 182 88 128 Z" fill="${c.bg1}" fill-opacity="0.8" />
      <path d="M128 80 L128 192 M96 112 L160 112" stroke="${c.text}" stroke-width="3" />
    `;
  } else if (type.includes("tech") || type.includes("deck") || type.includes("matrix") || type.includes("core")) {
    iconGraphic = `
      <!-- Cyberdeck / Data Matrix -->
      <rect x="74" y="74" width="108" height="108" rx="14" fill="${c.bg1}" stroke="${c.glow}" stroke-width="4" filter="url(#glowFilter)" />
      <circle cx="128" cy="128" r="28" fill="none" stroke="${c.text}" stroke-width="3" stroke-dasharray="6 4" />
      <circle cx="128" cy="128" r="10" fill="${c.glow}" />
      <line x1="90" y1="128" x2="100" y2="128" stroke="${c.glow}" stroke-width="3" />
      <line x1="156" y1="128" x2="166" y2="128" stroke="${c.glow}" stroke-width="3" />
      <line x1="128" y1="90" x2="128" y2="100" stroke="${c.glow}" stroke-width="3" />
      <line x1="128" y1="156" x2="128" y2="166" stroke="${c.glow}" stroke-width="3" />
    `;
  } else if (type.includes("tome") || type.includes("scroll") || type.includes("book")) {
    iconGraphic = `
      <!-- Grimoire / Tome -->
      <path d="M72 68 Q128 80 184 68 L184 188 Q128 200 72 188 Z" fill="${c.bg1}" stroke="${c.glow}" stroke-width="4" filter="url(#glowFilter)" />
      <path d="M128 80 L128 198" stroke="${c.border}" stroke-width="3" />
      <!-- Arcana Rune -->
      <circle cx="128" cy="138" r="20" fill="none" stroke="${c.text}" stroke-width="2" />
      <polygon points="128,122 142,146 114,146" fill="none" stroke="${c.glow}" stroke-width="2" />
    `;
  } else if (type.includes("potion") || type.includes("elixir") || type.includes("flask")) {
    iconGraphic = `
      <!-- Flask / Potion -->
      <rect x="120" y="52" width="16" height="20" rx="3" fill="${c.border}" />
      <path d="M116 72 L140 72 L164 168 Q168 196 128 196 Q88 196 92 168 Z" fill="${c.bg1}" stroke="${c.glow}" stroke-width="4" filter="url(#glowFilter)" />
      <path d="M96 150 Q128 160 160 150 L162 170 Q164 190 128 190 Q92 190 94 170 Z" fill="${c.glow}" fill-opacity="0.8" />
      <circle cx="120" cy="165" r="4" fill="#ffffff" />
      <circle cx="134" cy="155" r="2.5" fill="#ffffff" />
    `;
  } else {
    // Default: Relic / Amulet / Runic Eye
    iconGraphic = `
      <!-- Relic Orb / Core -->
      <circle cx="128" cy="128" r="54" fill="none" stroke="${c.border}" stroke-width="4" stroke-dasharray="8 6" />
      <polygon points="128,68 180,158 76,158" fill="none" stroke="${c.glow}" stroke-width="3" filter="url(#glowFilter)" />
      <polygon points="128,188 76,98 180,98" fill="none" stroke="${c.glow}" stroke-width="3" filter="url(#glowFilter)" />
      <circle cx="128" cy="128" r="16" fill="${c.text}" />
      <circle cx="128" cy="128" r="8" fill="${c.bg2}" />
    `;
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="${c.bg1}" />
      <stop offset="100%" stop-color="${c.bg2}" />
    </radialGradient>
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.glow}" />
      <stop offset="50%" stop-color="${c.border}" />
      <stop offset="100%" stop-color="${c.bg1}" />
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect x="6" y="6" width="244" height="244" rx="20" fill="url(#bgGrad)" stroke="url(#frameGrad)" stroke-width="3" />
  
  <!-- Corner Tech/Arcane Ornaments -->
  <path d="M16 36 L36 16 M240 36 L220 16 M16 220 L36 240 M240 220 L220 240" stroke="${c.border}" stroke-width="2" stroke-linecap="round" />

  <!-- Themed Graphic -->
  ${iconGraphic}

  <!-- Rarity Ribbon Top Badge -->
  <rect x="76" y="14" width="104" height="20" rx="10" fill="${c.bg2}" stroke="${c.border}" stroke-width="1.5" />
  <text x="128" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="${c.glow}" text-anchor="middle" letter-spacing="1.5">${rarity.toUpperCase()}</text>

  <!-- Bottom Name Banner -->
  <rect x="18" y="218" width="220" height="26" rx="6" fill="${c.bg2}" fill-opacity="0.9" stroke="${c.border}" stroke-width="1" />
  <text x="128" y="235" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="${c.text}" text-anchor="middle">${name}</text>
</svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an SVG Data URL for a procedural Boss/Anomaly portrait.
 */
export function generateProceduralMonsterSvg(options: ProceduralMonsterOptions): string {
  const name = escapeXml(options.name || "Planar Glitch Entity");
  const rank = (options.rank || "A").toUpperCase();
  const genre = (options.genre || "fantasy").toLowerCase();
  const modifier = escapeXml(options.modifier || "Spacetime Fracture");

  const isCyber = genre.includes("cyber") || genre.includes("tech") || genre.includes("neon");
  const isCosmic = genre.includes("cosmic") || genre.includes("sci-fi") || genre.includes("space");

  // Palette by rank & genre
  const rankColors: Record<string, { aura: string; core: string; bg1: string; bg2: string; frame: string }> = {
    D: { aura: "#10b981", core: "#34d399", bg1: "#064e3b", bg2: "#022c22", frame: "#059669" },
    C: { aura: "#0284c7", core: "#38bdf8", bg1: "#0c4a6e", bg2: "#082f49", frame: "#0369a1" },
    B: { aura: "#8b5cf6", core: "#a78bfa", bg1: "#4c1d95", bg2: "#2e1065", frame: "#7c3aed" },
    A: { aura: "#f59e0b", core: "#fcd34d", bg1: "#78350f", bg2: "#451a03", frame: "#d97706" },
    S: { aura: "#f43f5e", core: "#fda4af", bg1: "#881337", bg2: "#4c0519", frame: "#e11d48" },
  };

  const p = rankColors[rank] || rankColors.A;
  const hash = hashString(name);

  // Genre stylized elements
  const creatureSilhouette = isCyber
    ? `
      <!-- Cyber Mech / Rogue AI Mesh -->
      <polygon points="128,40 190,80 170,160 128,190 86,160 66,80" fill="${p.bg1}" stroke="${p.core}" stroke-width="3" filter="url(#monsterGlow)" />
      <!-- Ocular Visor -->
      <line x1="94" y1="104" x2="162" y2="104" stroke="${p.core}" stroke-width="6" stroke-linecap="round" />
      <circle cx="128" cy="104" r="5" fill="#ffffff" />
      <!-- Data Vents -->
      <line x1="104" y1="130" x2="152" y2="130" stroke="${p.aura}" stroke-width="3" stroke-dasharray="4 3" />
      <line x1="112" y1="142" x2="144" y2="142" stroke="${p.aura}" stroke-width="3" stroke-dasharray="4 3" />
    `
    : isCosmic
    ? `
      <!-- Voidborn / Cosmic Graviton -->
      <circle cx="128" cy="115" r="50" fill="${p.bg1}" stroke="${p.core}" stroke-width="3" filter="url(#monsterGlow)" />
      <ellipse cx="128" cy="115" rx="75" ry="24" fill="none" stroke="${p.aura}" stroke-width="3" transform="rotate(-25 128 115)" stroke-dasharray="10 6" />
      <ellipse cx="128" cy="115" rx="75" ry="24" fill="none" stroke="${p.core}" stroke-width="2" transform="rotate(35 128 115)" />
      <circle cx="128" cy="115" r="14" fill="#000000" stroke="${p.core}" stroke-width="3" />
      <circle cx="128" cy="115" r="4" fill="#ffffff" />
    `
    : `
      <!-- Dark Fantasy Archon / Abyssal Entity -->
      <!-- Horns / Crest -->
      <path d="M96 90 Q80 40 50 34 Q80 60 92 84 Z" fill="${p.frame}" />
      <path d="M160 90 Q176 40 206 34 Q176 60 164 84 Z" fill="${p.frame}" />
      <!-- Main Mask/Face -->
      <polygon points="128,55 174,105 156,165 128,185 100,165 82,105" fill="${p.bg1}" stroke="${p.core}" stroke-width="3" filter="url(#monsterGlow)" />
      <!-- Glowing Eyes -->
      <ellipse cx="110" cy="112" rx="7" ry="4" transform="rotate(-15 110 112)" fill="${p.core}" />
      <ellipse cx="146" cy="112" rx="7" ry="4" transform="rotate(15 146 112)" fill="${p.core}" />
      <circle cx="110" cy="112" r="2" fill="#ffffff" />
      <circle cx="146" cy="112" r="2" fill="#ffffff" />
      <!-- Forehead Runic Sigil -->
      <polygon points="128,72 134,84 128,96 122,84" fill="${p.core}" />
    `;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="monsterBg" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="${p.bg1}" />
      <stop offset="70%" stop-color="${p.bg2}" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <filter id="monsterGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Frame Background -->
  <rect x="4" y="4" width="248" height="248" rx="16" fill="url(#monsterBg)" stroke="${p.frame}" stroke-width="3" />

  <!-- Ambient Rift Particles -->
  <circle cx="48" cy="70" r="${(hash % 3) + 2}" fill="${p.core}" opacity="0.6" />
  <circle cx="210" cy="90" r="${(hash % 4) + 2}" fill="${p.core}" opacity="0.7" />
  <circle cx="60" cy="170" r="${(hash % 3) + 2}" fill="${p.aura}" opacity="0.5" />
  <circle cx="195" cy="165" r="${(hash % 4) + 2}" fill="${p.aura}" opacity="0.6" />

  <!-- Creature Centerpiece -->
  ${creatureSilhouette}

  <!-- Threat Rank Seal -->
  <circle cx="34" cy="34" r="18" fill="#0f172a" stroke="${p.core}" stroke-width="2.5" />
  <text x="34" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="${p.core}" text-anchor="middle">${rank}</text>

  <!-- Anomaly Modifier Top Tag -->
  <rect x="70" y="16" width="160" height="20" rx="10" fill="#0f172a" fill-opacity="0.85" stroke="${p.frame}" stroke-width="1" />
  <text x="150" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="bold" fill="${p.core}" text-anchor="middle" letter-spacing="1">${modifier.toUpperCase()}</text>

  <!-- Bottom Name Banner -->
  <rect x="14" y="214" width="228" height="28" rx="8" fill="#020617" fill-opacity="0.95" stroke="${p.frame}" stroke-width="1.5" />
  <text x="128" y="233" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">${name}</text>
</svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an SVG Data URL for a procedural companion avatar.
 */
export function generateProceduralCompanionAvatarSvg(options: ProceduralCompanionOptions): string {
  const name = escapeXml(options.name || "Companion");
  const role = escapeXml(options.role || "Adventurer");
  const gender = (options.gender || "female").toLowerCase();
  const seed = options.seed || hashString(name);

  // Palette schemes
  const palettes = [
    { hair: "#38bdf8", eyes: "#0284c7", skin: "#fed7aa", mantle: "#1e293b", trim: "#38bdf8" }, // Azure Frost
    { hair: "#ec4899", eyes: "#be185d", skin: "#ffedd5", mantle: "#4c0519", trim: "#f43f5e" }, // Rose Ember
    { hair: "#a855f7", eyes: "#7e22ce", skin: "#fae8ff", mantle: "#3b0764", trim: "#c084fc" }, // Nether Void
    { hair: "#fbbf24", eyes: "#d97706", skin: "#fef3c7", mantle: "#1c1917", trim: "#f59e0b" }, // Solar Aurum
    { hair: "#34d399", eyes: "#059669", skin: "#dcfce7", mantle: "#064e3b", trim: "#10b981" }, // Jade Warden
  ];
  const p = palettes[seed % palettes.length];

  const isFemale = gender === "female";

  const hairStyle = isFemale
    ? `
      <!-- Female Flowing Anime Hair -->
      <path d="M70 120 Q55 170 50 200 Q75 185 85 155 Z" fill="${p.hair}" />
      <path d="M186 120 Q201 170 206 200 Q181 185 171 155 Z" fill="${p.hair}" />
      <!-- Top Crown and Bangs -->
      <path d="M76 115 Q128 40 180 115 Q158 90 128 100 Q98 90 76 115 Z" fill="${p.hair}" />
      <path d="M100 95 L110 125 L120 100 L136 125 L146 95 Z" fill="${p.hair}" />
    `
    : `
      <!-- Male Styled Anime Hair -->
      <path d="M72 105 Q65 60 128 45 Q191 60 184 105 L170 85 L145 105 L128 75 L111 105 L86 85 Z" fill="${p.hair}" />
    `;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="avatarBg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${p.mantle}" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <linearGradient id="trimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.trim}" />
      <stop offset="100%" stop-color="${p.eyes}" />
    </linearGradient>
  </defs>

  <!-- Frame Background -->
  <rect x="4" y="4" width="248" height="248" rx="124" fill="url(#avatarBg)" stroke="url(#trimGrad)" stroke-width="4" />

  <!-- Mantle / Shoulders -->
  <path d="M60 240 Q128 200 196 240 L196 256 L60 256 Z" fill="${p.mantle}" stroke="${p.trim}" stroke-width="2" />

  <!-- Neck -->
  <rect x="116" y="160" width="24" height="24" rx="4" fill="${p.skin}" />

  <!-- Face Contour -->
  <path d="M88 115 Q88 175 128 185 Q168 175 168 115 Q168 75 128 75 Q88 75 88 115 Z" fill="${p.skin}" />

  <!-- Eyes -->
  <ellipse cx="110" cy="130" rx="8" ry="11" fill="${p.eyes}" />
  <ellipse cx="146" cy="130" rx="8" ry="11" fill="${p.eyes}" />
  <circle cx="108" cy="127" r="3" fill="#ffffff" />
  <circle cx="144" cy="127" r="3" fill="#ffffff" />

  <!-- Eyebrows & Soft Smile -->
  <path d="M102 116 Q112 112 120 116" stroke="${p.hair}" stroke-width="2" fill="none" stroke-linecap="round" />
  <path d="M136 116 Q144 112 154 116" stroke="${p.hair}" stroke-width="2" fill="none" stroke-linecap="round" />
  <path d="M122 156 Q128 162 134 156" stroke="#b91c1c" stroke-width="2" fill="none" stroke-linecap="round" />

  <!-- Hair Render -->
  ${hairStyle}

  <!-- Bottom Mini Role Ribbon -->
  <rect x="58" y="218" width="140" height="24" rx="12" fill="#0f172a" fill-opacity="0.9" stroke="${p.trim}" stroke-width="1.5" />
  <text x="128" y="234" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="${p.trim}" text-anchor="middle" letter-spacing="0.5">${role.toUpperCase()}</text>
</svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

