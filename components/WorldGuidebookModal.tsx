"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  BookOpen,
  Users,
  MapPin,
  Shield,
  Sparkles,
  Swords,
  Zap,
  Heart,
  Search,
  Layers,
  Scale,
  Crown,
  Flame,
  AlertTriangle,
  Play,
  Compass,
} from "lucide-react";
import { StoryContext } from "@/types/story";
import {
  SOVEREIGN_ORIGIN_PRESETS,
  SOVEREIGN_CONDUIT_PRESETS,
  SOVEREIGN_HEROINE_DOSSIERS,
} from "@/types/sovereign_spire";
import {
  PORT_SOLARIS_ORIGIN_PRESETS,
  PORT_SOLARIS_CONDUIT_PRESETS,
  PORT_SOLARIS_HEROINE_DOSSIERS,
} from "@/types/port_solaris";
import { sanitizeImageUrl, DEFAULT_AVATAR, DEFAULT_BG } from "@/lib/imageUtils";
import { soundEffects } from "@/lib/audioEngine";

interface WorldGuidebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: StoryContext;
  onPlayStory?: () => void;
}

interface GlossaryEntry {
  term: string;
  category: "Magic & Combat" | "Politics & Economy" | "World & Lore" | "System Mechanics";
  summary: string;
}

const SOVEREIGN_SPIRE_GLOSSARY: GlossaryEntry[] = [
  {
    term: "Astra & Astra-Miasma",
    category: "Magic & Combat",
    summary:
      "The volatile primeval energy leaking upward from the Abyssal Breach beneath the Spire. Filtered in the upper towers into clean Aether, it pools in the Under-Vaults as toxic violet-gold Astra-Miasma.",
  },
  {
    term: "Somatic Tempering (Path A)",
    category: "Magic & Combat",
    summary:
      "Internal Astra cultivation favored by the Iron Chancellery and Whispering Veil. Pulls Astra into bone marrow, muscle fibers, and nerves to execute Micro-Burst Reinforcement, Nerve-Accel time dilation, and Edge-Resonance weapon binds.",
  },
  {
    term: "Aetherial Projection (Path B)",
    category: "Magic & Combat",
    summary:
      "External Astra manipulation favored by the Obsidian Choir and Gilded Loom. Treats the body as a hollow lens to weave geometric Sigil-Matrices, gravity shears, blood-crystal lances, and construct threads.",
  },
  {
    term: "Kinetic Pulse & Aether Flux",
    category: "System Mechanics",
    summary:
      "Dual combat resources. Somatic fighters build Kinetic Pulse (0 → 100) by striking, parrying, and dodging; Aetherial casters spend Aether Flux (100 → 0) to weave high-tier matrices and must vent or ground to recharge.",
  },
  {
    term: "Resonance Strain & The Brink (50%–85%)",
    category: "Magic & Combat",
    summary:
      "Channeling high-density Astra or delving deep into the Under-Vaults builds Resonance Strain (0–100%). Between 50% and 85% Strain, you enter 'The Brink'—unlocking +30% overcharged damage and lethal dialogue overrides at the risk of cellular crystallization.",
  },
  {
    term: "Calcification Lock (100% Strain)",
    category: "Magic & Combat",
    summary:
      "At 100% Resonance Strain, Astra crystallizes inside blood vessels and nerve endings. Triggers an immediate medical emergency or forced Soul-Grounding scene with your tethered Dyad partner to prevent permanent crystallization.",
  },
  {
    term: "Dyad Tether & Soul-Grounding",
    category: "System Mechanics",
    summary:
      "Two-person combat and survival bond required for Under-Vault delves. Synchronizing heartbeats and nervous systems with a Heroine unlocks her Dyad Passive in combat and allows skin-to-skin Soul-Grounding to purge lethal Resonance Strain.",
  },
  {
    term: "Matriculation Rank (#500 to #1)",
    category: "Politics & Economy",
    summary:
      "The Spire's zero-sum hierarchy: Sovereign Circle (#1–#10), High Castes (#11–#100), The Body (#101–#450), and The Dross (#451–#500). Your rank dictates housing, rations, Lift-Gate access, and immunity from reclamation.",
  },
  {
    term: "Blood-Ledger Contract & Reclamation",
    category: "Politics & Economy",
    summary:
      "Predatory enrollment debt audited by Proctor Malakor Sallow. Initiates in 'The Dross' (#451–#500) at semester's end face Foreclosure—having their Astra conduits and nervous systems harvested as living batteries for the Second Stratum mines.",
  },
  {
    term: "Aether Cores & Imperial Crowns",
    category: "Politics & Economy",
    summary:
      "Aether Cores are crystallized monster/construct hearts harvested in the Under-Vaults to pay semester tuition quotas; Imperial Crowns are minted gold-alloy currency used for bribes, Velvet Spill wagers, and Gilded Loom artificer gear.",
  },
  {
    term: "Relic Sockets & Whisper Flaws",
    category: "System Mechanics",
    summary:
      "Ancient Abyssal artifacts socketed into 5 anatomical nodes (Crown, Heart, Spine, Hands, Armament). Every Relic carries a 'Whisper Flaw'—echoing memories of its dead owner that grant huge stat spikes while testing your Willpower.",
  },
  {
    term: "The Crucible & Midnight Tribunal",
    category: "Politics & Economy",
    summary:
      "The Crucible is the Spire's official arena for Rank-Wager Duels. Beneath the Velvet Spill tavern lies the Midnight Tribunal—an unsanctioned, no-rules blood-pit run by the Whispering Veil where grudges and illegal debts are settled.",
  },
  {
    term: "The Four Strata & The First Seal",
    category: "World & Lore",
    summary:
      "The Under-Vaults descend through four layers: Stratum I (Sunken Catacombs), Stratum II (Weeping Caverns), Stratum III (The Calcified Necropolis), and Stratum IV (The First Seal—where Headmaster Vane feeds defaulted students to a slumbering god-corpse).",
  },
];

const ASTRA_CONTINENT_GLOSSARY: GlossaryEntry[] = [
  {
    term: "Causal Plausibility (0%–100%)",
    category: "System Mechanics",
    summary:
      "Measures how much the world's spacetime fabric accepts your actions. Grounded tactical actions preserve Plausibility; invoking impossible cosmic miracles burns Plausibility and draws Reality Rejection.",
  },
  {
    term: "The Causal Covenant (Reality Severance)",
    category: "Magic & Combat",
    summary:
      "An emergency spacetime override that shatters a fatal outcome or forces an impossible breakthrough—at the permanent cost of -15% Maximum Plausibility Cap and an indelible Timeline Scar.",
  },
  {
    term: "Regression Loop #84",
    category: "World & Lore",
    summary:
      "The hidden truth of the Astra Continent: certain individuals (such as Evelyn Vance) retain fragmented memories across 84 failed timeline regressions before the Void Eclipse consumes the Imperial Capital.",
  },
  {
    term: "Leyline Resonance & Mana Pulse",
    category: "Magic & Combat",
    summary:
      "The lifeblood of the Baltia Empire's magic and Magitek infrastructure. Channeling Leyline energy fuels Active and Ultimate combat techniques.",
  },
  {
    term: "Camp Ultimatums & Ideological Friction",
    category: "System Mechanics",
    summary:
      "Travelling with companions of opposing factions builds ideological friction. When friction peaks, you must mediate a Camp Ultimatum—either forging a Triad synergy or siding with one heroine's doctrine.",
  },
  {
    term: "Affection Milestones & Romance Arcs",
    category: "System Mechanics",
    summary:
      "Choices, gifts, and shared combat victories shift heroine Affection (0–100%). High bond tiers unlock personal backstory confessions, duo combo attacks, and bespoke CG illustrations.",
  },
];

const SOVEREIGN_ANTAGONISTS = [
  {
    name: "High Sovereign Caelen Vane",
    role: "Headmaster of the Sovereign Spire",
    faction: "The Spire Directorate",
    threat: "Arch-Sovereign (Apex)",
    description:
      "An ageless arch-mage wrapped in levitating chains of Gold-Astra who has ruled the Spire for 300 years. Views students as raw carbon pressed into diamonds—or fuel for the Fourth Stratum's First Seal.",
  },
  {
    name: "Proctor Malakor Sallow",
    role: "Chief Auditor & Warden of the Ledger",
    faction: "The Gilded Loom / Directorate",
    threat: "Faculty Executioner",
    description:
      "A cadaverous inquisitor with brass ocular lenses and mechanical spider-quills. Tracks every student's tuition debt down to the second and oversees 'Reclamation' harvesting.",
  },
  {
    name: "Magistra Evelyne Cross",
    role: "Dean of Combat & The Crucible",
    faction: "The Iron Chancellery",
    threat: "Faculty Grandmaster",
    description:
      "A scarred war-veteran whose left arm is entirely purple-black Calcified Astra-Crystal. Ruthlessly pragmatic; despises noble nepotism and respects only bloody survival.",
  },
  {
    name: "Corwin Baines (Rank #184)",
    role: "Gatekeeper Enforcer",
    faction: "The Gilded Loom",
    threat: "Act I Mid-Boss (Rank #184)",
    description:
      "A hulking 2nd-year Somatic vanguard wielding a Pneumatic Riot-Halberd. Extorts 1st-year Dross initiates at the Stratum I Lift-Gate by demanding 50% of their Aether Cores.",
  },
  {
    name: "Julian Thorne-Vex (Rank #42)",
    role: "The Porcelain Viper",
    faction: "The Gilded Loom / Chancellery",
    threat: "Act I Boss (Rank #42)",
    description:
      "An aristocratic 2nd-year duelist who bought Cassia Valen's family mortgage. Fights with an Aether-Conductive Rapier and two leased Choir Barrier-Acolytes.",
  },
  {
    name: "Silas Krowe (Rank #19)",
    role: "The Houndmaster",
    faction: "The Whispering Veil",
    threat: "Upperclassman Enforcer (Rank #19)",
    description:
      "Holder of Kestrel Hollow's predatory Blood-Ledger leash. Fights with sensory-deprivation traps, neurotoxin whips, and collared syndicate hounds.",
  },
  {
    name: "Lukas Castell (Rank #9)",
    role: "The Choir's Scalpel",
    faction: "The Obsidian Choir",
    threat: "Sovereign Circle (#9)",
    description:
      "Ysolde Kaelen's cold-blooded academic rival who seeks to expose her crystal calcification so he can claim her research and her seat in the Sovereign Circle.",
  },
  {
    term: "Aldric Drakon (Rank #1)",
    role: "The First Sword",
    faction: "The Iron Chancellery",
    threat: "Sovereign #1",
    description:
      "Unbeaten 3rd-year commander of the Student Sovereign Council, Beatrix Valorian's benchmark rival, and the man behind the Third-Stratum betrayal of Valeria Noctis's squad.",
  },
];

const PORT_SOLARIS_GLOSSARY: GlossaryEntry[] = [
  {
    term: "The Solaris Star Ledger (0★ to 5★)",
    category: "Politics & Economy",
    summary:
      "Governed by Solaris University and the Platinum Hospitality Conglomerate, every café, club, and boardwalk establishment is ranked from 0 to 5 Stars, dictating beachfront access, festival budgets, and island prestige.",
  },
  {
    term: "The 30-Day Eviction Rule & The Stray Anchor",
    category: "Politics & Economy",
    summary:
      "Establishments sitting at 0 Stars at the end of the 30-day seasonal audit have their leases revoked and are bulldozed for the Vane-Valorian Luxury Resort Expansion. You inherited the deed and debt to The Stray Anchor in Driftwood Cove.",
  },
  {
    term: "The Boarding House Proximity Engine",
    category: "World & Lore",
    summary:
      "To pay the bills and staff the café, you rent The Stray Anchor's six upstairs bedrooms to disgraced heiresses, rival bakers, beach athletes, and nocturnal arcade savants—creating thin walls, shared-bath collisions, and rooftop confessions.",
  },
  {
    term: "Island Charter Article 9 (Turf Showdowns)",
    category: "Magic & Combat",
    summary:
      "Lawsuits and violent sabotage are banned on Port Solaris; all lease disputes, supplier monopolies, and romantic rivalries are settled via sanctioned public Turf Showdowns (gourmet cook-offs, mixology rushes, beach volleyball, kendo).",
  },
  {
    term: "Physical Tempo (Path A) & Hype (0–100)",
    category: "Magic & Combat",
    summary:
      "Action-driven showdown style covering high-heat culinary prep, mixology flair, volleyball spikes, and kendo. Builds Hype (0 → 100); at 80+ Hype you can unleash a Crowd-Pleaser Finisher that wins over the spectators.",
  },
  {
    term: "Social Panache (Path B) & Cool (100%–0%)",
    category: "Magic & Combat",
    summary:
      "Wit-driven showdown style covering legal negotiation, VIP hosting, sommelier banter, and paparazzi counter-spins. Spends Cool (100% → 0%) to execute Table-Turn Counters and Audacious Gambits.",
  },
  {
    term: "Composure / Heart-Rate Gauge (0%–100% BPM)",
    category: "System Mechanics",
    summary:
      "Tracks how flustered you or your rival are. 0–49% BPM is Composed; 50–85% BPM enters 'The Blush Zone' (-25% Social Defense, flustered portraits, and unlocked bold romantic choices); 100% BPM triggers a Short-Circuit / Flustered Break.",
  },
  {
    term: "Keepsake Slots & 'Caught Red-Handed' Tag-Flaws",
    category: "System Mechanics",
    summary:
      "Equip 5 lifestyle slots (Timepiece, Attire, Tool of the Trade, Pocket Charm, House Emblem). Personal Keepsakes gifted by a heroine grant big bonuses with her, but carry +40% BPM jealousy risk if worn on a date with a rival heroine.",
  },
  {
    term: "Heart-to-Heart Moments (Cooldown Recovery)",
    category: "System Mechanics",
    summary:
      "To lower your BPM from 100% Short-Circuit, step away to the Rooftop Terrace or Sunset Pier with your partner for a quiet one-on-one scene (sharing a drink, wiping flour off her cheek, or bandaging a scraped knee).",
  },
  {
    term: "Solar Crowns & Weekly Rent Ledger",
    category: "Politics & Economy",
    summary:
      "Island currency earned from café shifts, boarding-house rent, and Article 9 Showdown pots. Used to upgrade The Stray Anchor's kitchen, patio, and upstairs bedrooms.",
  },
];

const PORT_SOLARIS_ANTAGONISTS = [
  {
    name: "Chairman Alistair Vane",
    role: "Patriarch of the Vane Resort Conglomerate",
    faction: "The Platinum Board",
    threat: "5★ Conglomerate Titan",
    description:
      "Seraphina's stern billionaire father who froze her black cards and wants to bulldoze Driftwood Cove for a private superyacht marina unless The Stray Anchor proves its worth.",
  },
  {
    name: "Julian Sterling",
    role: "Yacht Club Commodore & Exclusivity Broker",
    faction: "The Platinum Board",
    threat: "Act I Audit Rival",
    description:
      "A smug upperclassman resort heir who tries to buy up Sunset Rambla ingredient suppliers and rig the seasonal Star Audit against 0-Star independents.",
  },
  {
    name: "Chef Marcello Vance-Moretti",
    role: "Executive Celebrity Chef of Le Soleil d'Or",
    faction: "The Boardwalk Guild",
    threat: "4★ Culinary Gatekeeper",
    description:
      "Colette's former tyrannical boss on the Platinum Cliffs who challenges The Stray Anchor and Mia's patisserie to televised Article 9 cook-offs.",
  },
  {
    name: "Captain Zane 'Riptide' Kurosawa",
    role: "Varsity Surf & Volleyball Reigning MVP",
    faction: "The Breakers Union",
    threat: "South Beach Turf Boss",
    description:
      "Pippa and Kaede's boastful beach-court rival who hogs the prime boardwalk festival booths until challenged under Article 9.",
  },
];

export function WorldGuidebookModal({
  isOpen,
  onClose,
  story,
  onPlayStory,
}: WorldGuidebookModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "characters" | "locations" | "mechanics"
  >("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWingFilter, setSelectedWingFilter] = useState<string>("ALL");

  const isSovereignSpire = story.id === "sovereign-spire";
  const isPortSolaris = story.id === "port-solaris";

  const glossaryItems = useMemo(() => {
    const base = isSovereignSpire
      ? SOVEREIGN_SPIRE_GLOSSARY
      : isPortSolaris
      ? PORT_SOLARIS_GLOSSARY
      : ASTRA_CONTINENT_GLOSSARY;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
    );
  }, [isSovereignSpire, isPortSolaris, searchQuery]);

  const filteredCompanions = useMemo(() => {
    const list = story.companions || [];
    return list.filter((comp) => {
      const dossier =
        SOVEREIGN_HEROINE_DOSSIERS[comp.name] || PORT_SOLARIS_HEROINE_DOSSIERS[comp.name];
      if (selectedWingFilter !== "ALL") {
        if (dossier && dossier.wing !== selectedWingFilter) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        comp.name.toLowerCase().includes(q) ||
        (comp.title || "").toLowerCase().includes(q) ||
        (comp.role || "").toLowerCase().includes(q) ||
        (comp.personality || "").toLowerCase().includes(q) ||
        (dossier?.actOneConflict || "").toLowerCase().includes(q) ||
        (dossier?.epithet || "").toLowerCase().includes(q) ||
        (dossier?.combatDoctrine || "").toLowerCase().includes(q)
      );
    });
  }, [story.companions, selectedWingFilter, searchQuery]);

  const filteredLocations = useMemo(() => {
    const list = story.worldContext?.locations || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.zone.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q)
    );
  }, [story.worldContext?.locations, searchQuery]);

  if (!isOpen) return null;

  const wingBadgeColor = (wing?: string) => {
    switch (wing) {
      case "IRON_CHANCELLERY":
      case "BOARDWALK_GUILD":
        return "bg-rose-500/15 border-rose-500/40 text-rose-300";
      case "OBSIDIAN_CHOIR":
      case "DRIFTWOOD_SYNDICATE":
        return "bg-purple-500/15 border-purple-500/40 text-purple-300";
      case "GILDED_LOOM":
      case "PLATINUM_BOARD":
        return "bg-amber-500/15 border-amber-500/40 text-amber-300";
      case "WHISPERING_VEIL":
      case "BREAKERS_UNION":
        return "bg-sky-500/15 border-sky-500/40 text-sky-300";
      default:
        return "bg-white/10 border-white/20 text-zinc-300";
    }
  };

  const formatWingName = (wing?: string) => {
    switch (wing) {
      case "IRON_CHANCELLERY":
        return "Iron Chancellery";
      case "OBSIDIAN_CHOIR":
        return "Obsidian Choir";
      case "GILDED_LOOM":
        return "Gilded Loom";
      case "WHISPERING_VEIL":
        return "Whispering Veil";
      case "PLATINUM_BOARD":
        return "Platinum Board";
      case "BOARDWALK_GUILD":
        return "Boardwalk Guild";
      case "BREAKERS_UNION":
        return "Breakers Union";
      case "DRIFTWOOD_SYNDICATE":
        return "Driftwood Syndicate";
      default:
        return wing || "Independent";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-xl flex items-center max-sm:items-end justify-center p-2 max-sm:p-0 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[92dvh] max-sm:h-[92dvh] bg-zinc-950 border border-white/15 rounded-3xl max-sm:rounded-b-none max-sm:rounded-t-3xl shadow-[0_0_70px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner with Cover Image Backdrop */}
        <div className="relative px-4 sm:px-7 pt-3 sm:pt-5 pb-3.5 sm:pb-4 border-b border-white/10 overflow-hidden shrink-0">
          {/* Mobile Drag Handle */}
          <div className="sm:hidden w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-2.5" />
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 brightness-50 pointer-events-none"
            style={{
              backgroundImage: `url("${sanitizeImageUrl(story.coverImage, DEFAULT_BG)}")`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/75 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <BookOpen className="w-3 h-3 text-amber-400" />
                    Realm Lore & Tactical Guidebook
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                    {story.genre}
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-white">
                  {story.title}
                </h2>
                <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed line-clamp-2 sm:line-clamp-none">
                  {story.tagline || story.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onPlayStory && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playIntroBell();
                      onClose();
                      onPlayStory();
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Enter Realm</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Guidebook"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs + Quick Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-1">
              <div className="grid grid-cols-2 sm:flex items-center gap-1.5">
                {[
                  {
                    id: "overview" as const,
                    label: "World & Factions",
                    icon: Layers,
                    count: story.worldContext?.factions?.length || 4,
                  },
                  {
                    id: "characters" as const,
                    label: "Heroines & Cast",
                    icon: Users,
                    count: story.companions?.length || 0,
                  },
                  {
                    id: "locations" as const,
                    label: "Locations & Strata",
                    icon: MapPin,
                    count: story.worldContext?.locations?.length || 0,
                  },
                  {
                    id: "mechanics" as const,
                    label: "Stats & Keywords",
                    icon: Scale,
                    count: isSovereignSpire
                      ? SOVEREIGN_SPIRE_GLOSSARY.length
                      : isPortSolaris
                      ? PORT_SOLARIS_GLOSSARY.length
                      : ASTRA_CONTINENT_GLOSSARY.length,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setActiveTab(tab.id);
                      }}
                      className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold flex items-center justify-center sm:justify-start gap-2 border transition-all cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-rose-600/90 to-amber-600/80 border-rose-400/60 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                          : "bg-zinc-900/85 hover:bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          isActive
                            ? "bg-black/35 text-amber-200"
                            : "bg-white/5 text-zinc-400"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter characters, locations, terms..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-zinc-900/90 border border-white/15 focus:border-rose-500/60 focus:outline-none text-xs font-mono text-white placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 space-y-6">
          {/* ===============================================================
              TAB 1: WORLD LORE, LAWS, RANK HIERARCHY & FACTIONS
             =============================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Setting & Core Premise */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap border-b border-white/10 pb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 shrink-0" />
                      <span>Setting Overview: {story.worldContext?.settingName || story.title}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                      Tone: {story.narrationStyle || "Dark Fantasy"}
                    </span>
                  </div>

                  {isSovereignSpire ? (
                    <div className="space-y-4">
                      <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                        Built directly into the throat of a mile-wide abyssal fissure known as{" "}
                        <strong className="text-white">The Pale Maw</strong>, the{" "}
                        <strong className="text-rose-300">Sovereign Spire</strong> is both an elite Imperial military academy and a vertical containment plug. Five hundred initiates compete each semester to harvest Aether Cores from the Under-Vault below—where standing is a zero-sum ladder from{" "}
                        <span className="font-mono text-amber-300">Rank #1</span> down to{" "}
                        <span className="font-mono text-rose-300">Rank #500</span>.
                      </p>

                      {/* 2x2 Grid for the Four Foundational Truths */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 block">
                          The Four Foundational Truths of the Spire
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            {
                              num: "01",
                              title: "Hostages & Blood-Ledgers",
                              badge: "Politics & Debt",
                              color: "border-rose-500/30 bg-rose-950/20 text-rose-300",
                              desc: "Highborn scions are held as political hostages, while Commoners sign predatory Blood-Ledger Contracts that foreclose on their bodies if they fall into The Dross (#451–#500).",
                            },
                            {
                              num: "02",
                              title: "The Calcification Threshold",
                              badge: "Age 25 Limit",
                              color: "border-purple-500/30 bg-purple-950/20 text-purple-300",
                              desc: "'Vault-Lung' turns anyone over age 25 to crystal below the First Seal—making young Academy initiates the Empire's only viable miners of Astra-Miasma Relics.",
                            },
                            {
                              num: "03",
                              title: "The 10% Sovereign Charter",
                              badge: "Zero-Sum Ladder",
                              color: "border-amber-500/30 bg-amber-950/20 text-amber-300",
                              desc: "Only the top 10% earn autonomous Sovereign Charters upon graduation; the remaining 90% become expendable Imperial vanguard or indentured syndicate retainers.",
                            },
                            {
                              num: "04",
                              title: "Lawless Below the First Seal",
                              badge: "The Under-Vault",
                              color: "border-cyan-500/30 bg-cyan-950/20 text-cyan-300",
                              desc: "Once the Great Lift drops past the First Seal, Imperial law ceases to exist—student murders and syndicate executions are logged simply as 'spatial anomalies.'",
                            },
                          ].map((truth) => (
                            <div
                              key={truth.num}
                              className="p-3 rounded-xl bg-black/55 border border-white/10 space-y-1.5 flex flex-col justify-between"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-mono font-bold text-white">
                                    <span className="text-rose-400 mr-1.5">{truth.num}.</span>
                                    {truth.title}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${truth.color}`}
                                  >
                                    {truth.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-300 leading-relaxed">
                                  {truth.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3-Column Astra Conduit & Strain Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <div className="p-3 rounded-xl bg-rose-950/25 border border-rose-500/30 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-rose-300 block">
                            ⚔️ Path A: Somatic Tempering
                          </span>
                          <p className="text-[11px] text-zinc-300 leading-snug">
                            Internal cultivation via <strong>Pulse-Breathing</strong>,{" "}
                            <strong>Kinetic Pulse</strong>, <strong>Edge-Resonance</strong>, and{" "}
                            <strong>Nerve-Accel</strong> reflexes.
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-950/25 border border-purple-500/30 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-purple-300 block">
                            🔮 Path B: Aetherial Projection
                          </span>
                          <p className="text-[11px] text-zinc-300 leading-snug">
                            External weaving via geometric <strong>Sigil-Matrices</strong>,{" "}
                            <strong>Aether Flux</strong>, gravity shears, and blood-crystal wards.
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-amber-300 block">
                            🔥 Strain & Soul-Grounding
                          </span>
                          <p className="text-[11px] text-zinc-300 leading-snug">
                            <strong>0–49%</strong> Stable • <strong>50–85%</strong>{" "}
                            <em>The Brink</em> (+30% dmg) • <strong>100%</strong>{" "}
                            <em>Calcification Lock</em> (purged via skin-to-skin{" "}
                            <strong>Soul-Grounding</strong>).
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : isPortSolaris ? (
                    <div className="space-y-4">
                      <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                        Welcome to <strong className="text-amber-300">Port Solaris</strong>, a sun-drenched Mediterranean-style university resort island where social influence, beach culture, and booming small businesses dictate who runs the boardwalk. After inheriting the deed—and massive debt—to{" "}
                        <strong className="text-white">The Stray Anchor</strong>, a 0-Star beachfront café and six-room boarding house in{" "}
                        <span className="font-mono text-sky-300">Driftwood Cove</span>, you have{" "}
                        <span className="font-mono text-rose-300">30 days</span> to climb the{" "}
                        <span className="font-mono text-amber-300">Solaris Star Ledger (0★ → 5★)</span> or watch the Vane-Valorian Luxury Resort Expansion bulldoze your home.
                      </p>

                      {/* 2x2 Grid for the Four Foundational Truths of Port Solaris */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 block">
                          The Four Foundational Truths of Port Solaris
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            {
                              num: "01",
                              title: "The Solaris Star Ledger (0★ to 5★)",
                              badge: "Island Prestige",
                              color: "border-amber-500/30 bg-amber-950/20 text-amber-300",
                              desc: "Governed by Solaris University and the Platinum Hospitality Conglomerate, every café, club, and student crew is ranked 0 to 5 Stars, dictating beachfront access and festival budgets.",
                            },
                            {
                              num: "02",
                              title: "The 30-Day Eviction Rule",
                              badge: "Lease Countdown",
                              color: "border-rose-500/30 bg-rose-950/20 text-rose-300",
                              desc: "Establishments sitting at 0 Stars at the seasonal audit have their leases revoked and are bulldozed for the Vane-Valorian Luxury Marina Expansion.",
                            },
                            {
                              num: "03",
                              title: "Boarding House Proximity Engine",
                              badge: "6 Upstairs Rooms",
                              color: "border-sky-500/30 bg-sky-950/20 text-sky-300",
                              desc: "To pay the bills and staff the café, you rent your six upstairs bedrooms to exiled heiresses, rival bakers, and beach athletes—creating nonstop domestic rom-com tension.",
                            },
                            {
                              num: "04",
                              title: "Island Charter Article 9",
                              badge: "Turf Showdowns",
                              color: "border-emerald-500/30 bg-emerald-950/20 text-emerald-300",
                              desc: "Lawsuits and sabotage are banned. All lease disputes, supply monopolies, and romantic rivalries are settled in public culinary, mixology, and beach Turf Showdowns.",
                            },
                          ].map((truth) => (
                            <div
                              key={truth.num}
                              className="p-3 rounded-xl bg-black/55 border border-white/10 space-y-1.5 flex flex-col justify-between"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-mono font-bold text-white">
                                    <span className="text-amber-400 mr-1.5">{truth.num}.</span>
                                    {truth.title}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${truth.color}`}
                                  >
                                    {truth.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-300 leading-relaxed">
                                  {truth.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3-Column Flair Conduit & Composure Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-amber-300 block">
                            🍳 Path A: Physical Tempo
                          </span>
                          <p className="text-[11px] text-zinc-300 leading-snug">
                            Brawn, Reflex & Craft. Builds <strong>Hype (0 → 100)</strong> via{" "}
                            <strong>Flow-State Reflex</strong> to unleash{" "}
                            <strong>Crowd-Pleaser Finishers</strong> at 80+ Hype.
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-sky-950/25 border border-sky-500/30 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-sky-300 block">
                            🥂 Path B: Social Panache
                          </span>
                          <p className="text-[11px] text-zinc-300 leading-snug">
                            Charm, Wit & Audacity. Spends <strong>Cool (100% → 0%)</strong> to execute{" "}
                            <strong>Table-Turn Counters</strong> and{" "}
                            <strong>Audacious Gambits</strong>.
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-rose-950/25 border border-rose-500/30 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-rose-300 block">
                            💓 Composure & Blush Zone (BPM)
                          </span>
                          <p className="text-[11px] text-zinc-300 leading-snug">
                            <strong>0–49%</strong> Composed • <strong>50–85%</strong>{" "}
                            <em>The Blush Zone</em> (-25% Social Def, bold romance choices) •{" "}
                            <strong>100%</strong> <em>Short-Circuit</em>.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(story.worldContext?.loreSummary || story.description || "")
                        .split(/\n\n|\r\n\r\n/)
                        .filter(Boolean)
                        .map((para, pIdx) => (
                          <p
                            key={pIdx}
                            className="text-xs sm:text-sm text-zinc-200 leading-relaxed"
                          >
                            {para}
                          </p>
                        ))}
                    </div>
                  )}
                </div>

                {/* World Laws Card */}
                <div className="lg:col-span-4 bg-gradient-to-br from-rose-950/30 via-zinc-900/80 to-zinc-950 border border-rose-500/30 rounded-2xl p-5 space-y-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Immutable World Laws
                  </span>
                  <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                    {(isSovereignSpire
                      ? [
                          "Zero-Sum Matriculation (#500 to #1): Bottom 50 initiates ('The Dross') face biological Reclamation at semester's end.",
                          "Resonance Strain & Calcification: Channeling Astra builds Strain (0–100%). 50–85% triggers The Brink (+30% power); 100% triggers lethal crystal lock.",
                          "Mandatory Dyad Tethers: Under-Vault delves require a synchronized partner for combat passives and skin-to-skin Soul-Grounding.",
                        ]
                      : isPortSolaris
                      ? [
                          "Solaris Star Ledger (0★ to 5★): Establishments sitting at 0 Stars at the 30-day audit are bulldozed for the Vane-Valorian Marina.",
                          "Article 9 Turf Showdowns: All lease disputes, supplier feuds, and romantic rivalries are settled in public culinary, mixology, or beach showdowns.",
                          "Composure & The Blush Zone (BPM): 50–85% BPM triggers flustered expressions and bold romance options; 100% BPM triggers a Short-Circuit break.",
                        ]
                      : [
                          `System Authority: Governed by ${story.rpgRules?.systemName || "The Celestial System"} and ${story.rpgRules?.causalAnchorName || "Causal Plausibility"}.`,
                          "Causal Plausibility (0–100%): Grounded tactics preserve spacetime stability; impossible miracles risk Reality Rejection.",
                          "Sanctioned Regression & Covenants: Fatalities or Reality Severance leave permanent Timeline Scars across loops.",
                        ]
                    ).map((rule: string, idx: number) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-start gap-2"
                      >
                        <span className="text-rose-400 font-mono font-bold shrink-0">
                          0{idx + 1}.
                        </span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sovereign Spire Specific: Matriculation Rank Tiers & Origins */}
              {isSovereignSpire && (
                <div className="space-y-4">
                  <div className="bg-zinc-900/60 border border-amber-500/25 rounded-2xl p-5 space-y-3.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        The Zero-Sum Matriculation Hierarchy (Ranks #1 – #500)
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Standing is updated dynamically via Vault Delves, Crucible Wagers & Patron Favor
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        {
                          tier: "The Sovereign Circle",
                          ranks: "Ranks #1 – #10",
                          badge: "bg-amber-500/20 border-amber-400/50 text-amber-300",
                          desc: "Above Academy law. Enjoy private Sky-Crown villas, pure Aether rations, and immunity from semester reclamation.",
                        },
                        {
                          tier: "The High Castes",
                          ranks: "Ranks #11 – #100",
                          badge: "bg-purple-500/20 border-purple-400/50 text-purple-300",
                          desc: "Upperclassmen officers, Wing enforcers, and favored scions who command expedition rights and Lift-Gate priority.",
                        },
                        {
                          tier: "The Body",
                          ranks: "Ranks #101 – #450",
                          badge: "bg-sky-500/20 border-sky-400/50 text-sky-300",
                          desc: "Rank-and-file initiates fighting each week to harvest enough Aether Cores to stay above the foreclosure cutoff.",
                        },
                        {
                          tier: "The Dross",
                          ranks: "Ranks #451 – #500",
                          badge: "bg-rose-500/20 border-rose-400/50 text-rose-300",
                          desc: "Marked for Reclamation. If still in the bottom 50 at semester's end, their nervous systems are harvested for the mines.",
                        },
                      ].map((r) => (
                        <div
                          key={r.tier}
                          className="p-3.5 rounded-xl bg-black/55 border border-white/10 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-white">
                              {r.tier}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${r.badge}`}
                            >
                              {r.ranks}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {r.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Three Playable Matriculation Origins */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Playable Matriculation Origins (Act I Starting Conditions)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {SOVEREIGN_ORIGIN_PRESETS.map((origin) => (
                        <div
                          key={origin.id}
                          className="p-4 rounded-2xl bg-zinc-900/75 border border-white/10 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-mono font-bold text-white">
                                {origin.icon} {origin.name}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300">
                                {origin.rankTierLabel}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300">
                                Quota: {origin.semesterDebtQuota} Cores
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                {origin.startingCrowns} Crowns
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed">
                              {origin.defaultDetails}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-white/10 space-y-1">
                            <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 block">
                              Natural Dyad Affinities
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {origin.highResonanceHeroines.map((h) => (
                                <span
                                  key={h}
                                  className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-200"
                                >
                                  ★ {h}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Port Solaris Specific: Star Ledger Tiers & Playable Backgrounds */}
              {isPortSolaris && (
                <div className="space-y-4">
                  <div className="bg-zinc-900/60 border border-amber-500/25 rounded-2xl p-5 space-y-3.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        The Solaris Star Ledger Hierarchy (0★ Probation → 5★ Island Sovereign)
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Star Rating rises via Café Revenue, Boarding House Upgrades & Article 9 Showdowns
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        {
                          tier: "0★ – 1★ Probation",
                          ranks: "0★ – 1★ Rating",
                          badge: "bg-rose-500/20 border-rose-400/50 text-rose-300",
                          desc: "Eviction danger zone. 30 days to pass Seraphina Vane's provisional audit and recruit live-in staff before the bulldozers arrive.",
                        },
                        {
                          tier: "2★ Local Favorite",
                          ranks: "2★ Rating",
                          badge: "bg-sky-500/20 border-sky-400/50 text-sky-300",
                          desc: "Unlocks Sunset Rambla artisan ingredient suppliers, South Beach promotional booths, and evening cocktail lounge hours.",
                        },
                        {
                          tier: "3★ – 4★ Island Hotspot",
                          ranks: "3★ – 4★ Rating",
                          badge: "bg-purple-500/20 border-purple-400/50 text-purple-300",
                          desc: "Front-page features in The Solaris Siren, Campus Terrace festival sponsorship, and eligibility for Platinum Cliffs VIP galas.",
                        },
                        {
                          tier: "5★ Island Sovereign",
                          ranks: "5★ Flagship",
                          badge: "bg-amber-500/20 border-amber-400/50 text-amber-300",
                          desc: "Permanent deed immunity, supreme island prestige, and the legendary summer festival fireworks confession on your rooftop terrace.",
                        },
                      ].map((r) => (
                        <div
                          key={r.tier}
                          className="p-3.5 rounded-xl bg-black/55 border border-white/10 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-white">
                              {r.tier}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${r.badge}`}
                            >
                              {r.ranks}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {r.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Three Playable Port Solaris Backgrounds */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Playable Proprietor Backgrounds (Act I Starting Conditions)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {PORT_SOLARIS_ORIGIN_PRESETS.map((origin) => (
                        <div
                          key={origin.id}
                          className="p-4 rounded-2xl bg-zinc-900/75 border border-white/10 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-mono font-bold text-white">
                                {origin.icon} {origin.name}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300">
                                {origin.starTierLabel}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300">
                                Lease Debt: {origin.outstandingDebt} Crowns ({origin.daysUntilAudit}d Audit)
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                {origin.startingSolarCrowns} Crowns
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed">
                              {origin.defaultDetails}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-white/10 space-y-1">
                            <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 block">
                              Natural Housemate Chemistry
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {origin.highResonanceHeroines.map((h) => (
                                <span
                                  key={h}
                                  className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-200"
                                >
                                  ★ {h}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Factions & Patron Wings */}
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-400" />
                  {isSovereignSpire
                    ? "The Four Patron Wings & Ruling Factions"
                    : "Major World Factions & Powers"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(story.worldContext?.factions || []).map((fac) => (
                    <div
                      key={fac.name}
                      className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-mono font-bold text-white">
                            {fac.name}
                          </h4>
                          {fac.influence && (
                            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-[10px] font-mono text-amber-300 shrink-0">
                              {fac.influence}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {fac.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 2: HEROINES, CAST DOSSIERS & RIVAL BOSSES
             =============================================================== */}
          {activeTab === "characters" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Patron Wing / Island Faction Filter Pills */}
              {(isSovereignSpire || isPortSolaris) && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {(isPortSolaris
                    ? [
                        { id: "ALL", label: "All 10 Heroines" },
                        { id: "PLATINUM_BOARD", label: "🥂 Platinum Board" },
                        { id: "BOARDWALK_GUILD", label: "🥐 Boardwalk Guild" },
                        { id: "BREAKERS_UNION", label: "🏐 Breakers Union" },
                        { id: "DRIFTWOOD_SYNDICATE", label: "📸 Driftwood Syndicate" },
                      ]
                    : [
                        { id: "ALL", label: "All 8 Heroines" },
                        { id: "IRON_CHANCELLERY", label: "⚔️ Iron Chancellery" },
                        { id: "OBSIDIAN_CHOIR", label: "🔮 Obsidian Choir" },
                        { id: "GILDED_LOOM", label: "⚙️ Gilded Loom" },
                        { id: "WHISPERING_VEIL", label: "🗡️ Whispering Veil" },
                      ]
                  ).map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setSelectedWingFilter(w.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer shrink-0 border ${
                        selectedWingFilter === w.id
                          ? "bg-rose-600 border-rose-400 text-white font-bold"
                          : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Heroines Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredCompanions.map((comp) => {
                  const portSolarisDossier = PORT_SOLARIS_HEROINE_DOSSIERS[comp.name];
                  const dossier =
                    SOVEREIGN_HEROINE_DOSSIERS[comp.name] || portSolarisDossier;
                  const portrait = sanitizeImageUrl(
                    comp.baseImageUrl || comp.expressions?.neutral,
                    DEFAULT_AVATAR
                  );
                  return (
                    <div
                      key={comp.id || comp.name}
                      className="rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-rose-500/40 transition-all p-4 sm:p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={portrait}
                          alt={comp.name}
                          className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl object-cover object-top border border-white/15 bg-zinc-950 shrink-0 shadow-lg"
                        />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {dossier && (
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${wingBadgeColor(
                                  dossier.wing
                                )}`}
                              >
                                {formatWingName(dossier.wing)}
                              </span>
                            )}
                            {dossier && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                                {dossier.conduit.replace(/_/g, " ")}
                              </span>
                            )}
                            {portSolarisDossier && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                {portSolarisDossier.isBoardingHouseTenant &&
                                portSolarisDossier.assignedRoomNumber
                                  ? `Room 20${portSolarisDossier.assignedRoomNumber}`
                                  : "Island Resident"}{" "}
                                • {portSolarisDossier.preferredShopRole.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>

                          <h4 className="text-base sm:text-lg font-bold font-mono text-white leading-tight">
                            {comp.name}{" "}
                            <span className="text-xs font-normal text-rose-300">
                              • {dossier?.epithet || comp.title}
                            </span>
                          </h4>

                          <p className="text-[11px] font-mono text-amber-300">
                            {dossier?.combatDoctrine || comp.role}
                          </p>

                          {dossier?.actOneConflict ? (
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {dossier.actOneConflict}
                            </p>
                          ) : (
                            comp.values &&
                            comp.values.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {comp.values.map((v) => (
                                  <span
                                    key={v}
                                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-300"
                                  >
                                    ✦ {v}
                                  </span>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-3 border-t border-white/10 text-xs">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
                            Personality & Demeanor
                          </span>
                          <p className="text-[11px] text-zinc-300 leading-relaxed">
                            {comp.personality}
                          </p>
                        </div>

                        {dossier && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30">
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-300 block">
                                ★ Dyad Passive: {dossier.dyadPassiveName}
                              </span>
                              <p className="text-[11px] text-zinc-200 mt-0.5 leading-snug">
                                {dossier.dyadPassiveDescription}
                              </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-950/25 border border-amber-500/30">
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-300 block">
                                ⚔️ Act I Conflict & Rival Tie-In
                              </span>
                              <p className="text-[11px] text-zinc-200 mt-0.5 leading-snug">
                                {dossier.rivalBossTieIn}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sovereign Spire / Port Solaris Rivals Dossier */}
              {(isSovereignSpire || isPortSolaris) && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                      <Swords className="w-4 h-4 text-rose-400" />
                      {isPortSolaris
                        ? "Island Power Brokers & Article 9 Showdown Rivals"
                        : "Directorate Faculty & Act I Upperclassman Rivals"}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {isPortSolaris
                        ? "Conglomerate titans, celebrity chefs, and turf champions standing in your way"
                        : "Key power brokers, inquisitors, and ranked duelists you will confront in Act I"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(isPortSolaris ? PORT_SOLARIS_ANTAGONISTS : SOVEREIGN_ANTAGONISTS).map((npc) => (
                      <div
                        key={npc.name}
                        className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 inline-block">
                            {npc.threat}
                          </span>
                          <h4 className="text-xs font-mono font-bold text-white pt-0.5">
                            {npc.name}
                          </h4>
                          <p className="text-[10px] font-mono text-amber-300">
                            {npc.role}
                          </p>
                          <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                            {npc.description}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-500">
                          Affiliation: <span className="text-zinc-300">{npc.faction}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===============================================================
              TAB 3: LOCATIONS, SECTORS & STRATA
             =============================================================== */}
          {activeTab === "locations" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLocations.map((loc) => {
                  const dangerText = loc.danger || "Moderate";
                  const dangerLower = dangerText.toLowerCase();
                  const dangerColor =
                    dangerLower.includes("lethal") ||
                    dangerLower.includes("extreme") ||
                    dangerLower.includes("deadly")
                      ? "bg-red-500/20 border-red-500/50 text-red-300"
                      : dangerLower.includes("high") || dangerLower.includes("danger")
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : dangerLower.includes("low") || dangerLower.includes("safe")
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-sky-500/20 border-sky-500/50 text-sky-300";

                  return (
                    <div
                      key={loc.name}
                      className="rounded-2xl bg-zinc-900/80 border border-white/10 overflow-hidden flex flex-col justify-between group"
                    >
                      <div className="relative h-40 w-full overflow-hidden bg-black">
                        <img
                          src={sanitizeImageUrl(loc.bgImage, DEFAULT_BG)}
                          alt={loc.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent" />
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-mono text-zinc-200">
                            {loc.zone}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full backdrop-blur-md border text-[10px] font-mono font-bold uppercase ${dangerColor}`}
                          >
                            {dangerText}
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 inset-x-4">
                          <h4 className="text-base font-mono font-bold text-white flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{loc.name}</span>
                          </h4>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {loc.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 4: STATS, CONDUIT ARCHETYPES & KEYWORDS GLOSSARY
             =============================================================== */}
          {activeTab === "mechanics" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Applicable Stats & Combat Rules */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 bg-zinc-900/75 border border-white/10 rounded-2xl p-5 space-y-3.5">
                  <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                    <Swords className="w-4 h-4 text-rose-400" />
                    Core Attributes & Stat Check Definitions
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      {
                        code: "STR",
                        color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
                        desc:
                          story.rpgRules?.statDefinitions?.str ||
                          "Physical power, melee impact, and armor-shattering force.",
                        base: story.rpgRules?.baseStats?.str ?? 12,
                      },
                      {
                        code: "DEX",
                        color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
                        desc:
                          story.rpgRules?.statDefinitions?.dex ||
                          "Reflexes, evasion, initiative, and precision nerve strikes.",
                        base: story.rpgRules?.baseStats?.dex ?? 12,
                      },
                      {
                        code: "INT",
                        color: "text-sky-400 border-sky-500/30 bg-sky-500/10",
                        desc:
                          story.rpgRules?.statDefinitions?.int ||
                          "Arcane projection, tactical perception, and mental willpower.",
                        base: story.rpgRules?.baseStats?.int ?? 12,
                      },
                    ].map((st) => (
                      <div
                        key={st.code}
                        className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-start gap-3"
                      >
                        <span
                          className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-black shrink-0 ${st.color}`}
                        >
                          {st.code}
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-xs text-zinc-200 leading-relaxed">
                            {st.desc}
                          </p>
                          <span className="text-[10px] font-mono text-zinc-500 block">
                            Baseline Starting Score: {st.base} (Modified by Lineage & Class/Conduit)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-zinc-900/75 border border-white/10 rounded-2xl p-5 space-y-3.5">
                  <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Vitals & Tactical Engine Rules
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
                      <span className="text-[10px] font-mono uppercase text-rose-300 flex items-center gap-1 font-bold">
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        Vitality (HP)
                      </span>
                      <p className="text-sm font-mono font-black text-white mt-0.5">
                        Base {story.rpgRules?.baseStats?.hp ?? 110} HP
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Physical integrity before unconsciousness or reclamation.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/30">
                      <span className="text-[10px] font-mono uppercase text-sky-300 flex items-center gap-1 font-bold">
                        <Zap className="w-3 h-3 fill-sky-400 text-sky-400" />
                        {isSovereignSpire ? "Pulse / Flux (MP)" : "Mana / Reserves (MP)"}
                      </span>
                      <p className="text-sm font-mono font-black text-white mt-0.5">
                        Base {story.rpgRules?.baseStats?.mp ?? 90} MP
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {isSovereignSpire
                          ? "Fuels Somatic Kinetic Pulse & Aetherial Flux skills."
                          : "Fuels active spellcasting and combat techniques."}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5 text-xs">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 block">
                      System Administrator & Economy
                    </span>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      <strong>System Core:</strong> {story.rpgRules?.systemName || "Astra System"}
                    </p>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      <strong>Primary Currency:</strong> {story.rpgRules?.currencyName || "Imperial Crowns"}
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed pt-1 border-t border-white/5">
                      <strong>Anchor Metric:</strong> {story.rpgRules?.causalAnchorName || "Resonance Strain / Plausibility"} (Default: {story.rpgRules?.defaultPlausibility ?? 100}%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Sovereign Spire / Port Solaris Playable Conduit Pathways */}
              {(isSovereignSpire || isPortSolaris) && (
                <div className="space-y-3">
                  <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-cyan-400" />
                    {isPortSolaris
                      ? "Playable Flair Conduits, Showdown Styles & Keepsake Loadouts"
                      : "Playable Astra Conduits, Techniques & Relic Loadouts"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {(isPortSolaris ? PORT_SOLARIS_CONDUIT_PRESETS : SOVEREIGN_CONDUIT_PRESETS).map((preset) => (
                      <div
                        key={preset.id}
                        className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-white">
                            {preset.icon} {preset.roleTitle}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                            STR {preset.statSpread.str} • DEX {preset.statSpread.dex} • INT{" "}
                            {preset.statSpread.int}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          {preset.description}
                        </p>
                        <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 text-[11px] space-y-1">
                          <span className="text-[10px] font-mono text-amber-300 font-bold block">
                            Signature Item: {preset.canonLoadout.relic} ({"keepsakeSlot" in preset.canonLoadout ? preset.canonLoadout.keepsakeSlot : preset.canonLoadout.relicSlot})
                          </span>
                          <p className="text-[10px] text-rose-200/90 font-mono">
                            {"jealousyQuirk" in preset.canonLoadout ? preset.canonLoadout.jealousyQuirk : preset.canonLoadout.whisperFlaw}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Terminology & Keywords Glossary */}
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Keywords & World Terminology Glossary ({glossaryItems.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {glossaryItems.map((item) => (
                    <div
                      key={item.term}
                      className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-mono font-bold text-white">
                          {item.term}
                        </h4>
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-emerald-300 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
