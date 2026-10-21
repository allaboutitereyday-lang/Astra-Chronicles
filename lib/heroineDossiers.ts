/**
 * Canonical Heroine Introduction Dossiers for Astra Chronicles
 *
 * Provides thorough, rich narrative baselines for each heroine's dynamic opening:
 * - Specific atmospheric setting & sensory triggers (ozone, rain, copper, sulfur)
 * - Psychological profile & demeanor
 * - Canonical opening encounter setup
 * - Signature dialogue rhythm & voice
 * - 4 strictly formatted opening choices: [Tone/Action]: Short summary
 * - Initial scenario quest
 */

export interface HeroineIntroductionDossier {
  name: string;
  title: string;
  defaultLocation: string;
  environment: string;
  appearanceSensoryCues: string;
  psychologicalProfile: string;
  canonicalEncounter: string;
  dialogueCadence: string;
  signatureOpeningDialogue: string;
  defaultExpression: "neutral" | "intrigued" | "flustered" | "smug" | "surprised" | "combat_ready" | "dangerous" | "hurt" | "beckon";
  initialMood: string;
  baselineChoices: [string, string, string, string];
  initialQuest: {
    id: string;
    title: string;
    description: string;
    type: "scenario";
    difficulty: "E" | "D";
    objectives: Array<{ text: string; completed: boolean }>;
    rewards: { exp: number; gold: number; title: string | null };
    status: "active";
  };
}

export const HEROINE_INTRODUCTION_DOSSIERS: Record<string, HeroineIntroductionDossier> = {
  "Evelyn Abbandonato": {
    name: "Evelyn Abbandonato",
    title: "High Arcanist of House Abbandonato",
    defaultLocation: "Imperial Capital Imperium",
    environment: "The high stone parapets of the Imperium Spire towering hundreds of feet above the capital. Brisk midnight wind off the eastern gulf carries the sharp copper tang of ozone, cooling masonry, and the low, rhythmic hum of celestial conduits in the adjacent Mage Tower. Distant lantern light flickers across tiered marble courtyards far below.",
    appearanceSensoryCues: "Tall, patrician posture wrapped in high-collared navy and gold-trimmed velvet coats. Heavy-lidded violet eyes framed by dark cascading hair, glowing ether-silver signet rings on her slender gloved fingers. She leans against the carved stone balustrade beside an intricate brass astrolabe, her expression one of cool, detached supremacy.",
    psychologicalProfile: "Aristocratic, supremely confident, razor-sharp intellect. She views brute physical violence as crude and pedestrian, but respects audacity, subtle cunning, and genuine magical or tactical talent. Guarded against political assassins and sycophants.",
    canonicalEncounter: "Wind whips across the imperial ramparts, snapping her long dark coat as you step onto the terrace. Evelyn does not startle; she swivels with deliberate, fluid grace, her glowing arcane rings dimming as her violet gaze traces every contour of your posture, armor, and weapon, calculating your threat index within seconds before a cool, amused smirk forms.",
    dialogueCadence: "Silky, articulate, patrician cadence with subtle mock-courtesy and lethal intellectual precision.",
    signatureOpeningDialogue: "Lurking along the imperial ramparts while the Mage Tower aligns its planar gyres? How deliciously pedestrian. State your house, your master, or whatever pitiful guild sent you before I have the gargoyle sentinels toss you into the river gates below.",
    defaultExpression: "smug",
    initialMood: "Analytical & Guarded",
    baselineChoices: [
      "[Subterfuge/Cunning]: Present the forged imperial cipher lifted from the harbor watch.",
      "[Arcana/Analytical]: Point out that the Mage Tower's secondary focus ring is misaligned by three degrees.",
      "[Composure/Diplomatic]: Step forward into the lantern light, meet her gaze evenly, and offer your contract services.",
      "[Combat/Defiant]: Keep your hand resting on your blade hilt and demand passage through the upper corridor."
    ],
    initialQuest: {
      id: "scenario_01_evelyn",
      title: "Scenario 1: Audience on the Imperial Ramparts",
      description: "Survive the initial scrutiny of Evelyn Abbandonato atop the Spire parapets without triggering the gargoyle defense wards.",
      type: "scenario",
      difficulty: "E",
      objectives: [
        { text: "Engage Evelyn Abbandonato and explain your presence on the high ramparts", completed: false },
        { text: "Demonstrate tactical acumen or diplomatic value to House Abbandonato", completed: false }
      ],
      rewards: { exp: 120, gold: 50, title: "Spire Infiltrator" },
      status: "active"
    }
  },
  "Aria Shadowthorn": {
    name: "Aria Shadowthorn",
    title: "Veil Seeker Rogue",
    defaultLocation: "Mage Tower",
    environment: "The damp obsidian undercroft beneath the Archon Vaults. The air is cold, heavy with the metallic tang of crushed containment seals and discharged lightning wards. Faint azure leylines pulse faintly beneath cracked flagstones, casting flickering shadows against octagonal basalt pillars.",
    appearanceSensoryCues: "Compact, lithe build cloaked in matte charcoal leathers and stealth-weave cloth. Piercing silver-grey eyes beneath a deep hood, cheek marked by a faint pale scar. She holds twin blackened daggers in a low reverse-grip, blades humming with neutralized ward-energy. Her breathing is near-silent, center of gravity coiled like a primed viper.",
    psychologicalProfile: "Hyper-vigilant street-smart rogue scout. Pragmatic to the bone; hates noble pomposity, long speeches, and unearned chivalry. She values silence, competence, mutual leverage, and quick thinking under pressure.",
    canonicalEncounter: "You drop down through a ventilation conduit into the vault, your boots barely making contact before a shadow tears away from the central reliquary pedestal. Steel gleams in the azure glyph light as Aria pivots into a low fighting stance, both daggers angled at your carotid and ribs before you can draw breath.",
    dialogueCadence: "Tense, low-pitched, clipped sentences delivered with knife-edge focus and no wasted words.",
    signatureOpeningDialogue: "Don't twitch. You bypassed the third silence ward without setting off the alarm chimes... which means either the Veil Seekers sent a second scout without telling me, or House Abbandonato's hounds are getting unusually quiet. Hands where I can see them. Who signed your contract tonight?",
    defaultExpression: "combat_ready",
    initialMood: "Predatory & On Edge",
    baselineChoices: [
      "[Subterfuge/Cunning]: Signal the covert Veil Seeker counter-cipher with your left hand.",
      "[Arcana/Analytical]: Note that her daggers are leaking ward-discharge—she triggered the inner glyphs herself.",
      "[Pragmatism/Diplomatic]: Propose a split: she takes the astral grimoire on the pedestal, you take the vault ciphers.",
      "[Combat/Aggressive]: Drop your center of gravity and prepare to counter her first strike."
    ],
    initialQuest: {
      id: "scenario_01_aria",
      title: "Scenario 1: Standoff in the Archon Undercroft",
      description: "De-escalate or capitalize on the lethal confrontation with Veil Seeker scout Aria Shadowthorn inside the restricted vault.",
      type: "scenario",
      difficulty: "E",
      objectives: [
        { text: "Prove to Aria that you are neither an Abbandonato guard nor a liability", completed: false },
        { text: "Secure your escape from the Archon Vault before the perimeter alarms reset", completed: false }
      ],
      rewards: { exp: 120, gold: 50, title: "Vault Shadow" },
      status: "active"
    }
  },
  "Serena": {
    name: "Serena",
    title: "Demi-Human Combat Maid",
    defaultLocation: "Bloodrose Duchy",
    environment: "The smoking courtyard of a minor noble's manor in the Bloodrose Duchy. Crumbling stone balustrades, burning oak porticos, and the coppery stench of blood and sulfur. Dozens of heavily armored Gray Zone marauders lie broken across the shattered flagstones.",
    appearanceSensoryCues: "A demi-human maid in an immaculate Victorian frilled apron and black dress, completely devoid of blood or soot despite the slaughterhouse around her. Soft white sheep ears twitch atop her head, framing curling ivory ram horns. She effortlessly balances a hundred-pound, flanged iron-spiked mace over one slender shoulder while delicately dabbing her brow with a lace handkerchief.",
    psychologicalProfile: "Flawlessly polite, devoted to protocol and domestic service, yet lethally efficient in crushing opposition. Possesses a deadpan, matter-of-fact demeanor that treats shattering skullcaps as an everyday chore comparable to polishing silverware.",
    canonicalEncounter: "The ground trembles as you step through the broken iron gates of the estate. Serena steps gracefully over the crumpled breastplate of a mercenary captain, shakes the ash from her pleated skirt, and dips into a perfect aristocratic curtsy amidst the cratered masonry, her soft ears angling toward you.",
    dialogueCadence: "Exquisitely formal, soft-spoken, respectful butler/maid cadence delivered with eerie, deadpan calm.",
    signatureOpeningDialogue: "Welcome back. I apologize for the unsightly state of the courtyard. The intruders were remarkably persistent, but the perimeter has been thoroughly swept. Shall I prepare tea, or is there another nuisance you require me to crush?",
    defaultExpression: "neutral",
    initialMood: "Impeccably Poised & Lethal",
    baselineChoices: [
      "[Observation/Analytical]: Note that she isn't even out of breath, and ask how many mercenaries remain in the woods.",
      "[Composure/Stoic]: Ignore the carnage entirely, bow politely, and request Earl Grey tea, black.",
      "[Tactics/Decisive]: Draw your weapon and suggest sweeping the remaining western wing together.",
      "[Inquire/Gentle]: Ask her gently to lower the mace before she accidentally collapses the portico."
    ],
    initialQuest: {
      id: "scenario_01_serena",
      title: "Scenario 1: The Bloodrose Manor Sweep",
      description: "Coordinate with Serena to secure the ruined estate grounds following the mercenary incursion.",
      type: "scenario",
      difficulty: "E",
      objectives: [
        { text: "Acknowledge Serena's report and assess the manor's structural integrity", completed: false },
        { text: "Confirm the elimination of all mercenary vanguard scouts in the perimeter", completed: false }
      ],
      rewards: { exp: 120, gold: 50, title: "Manor Overseer" },
      status: "active"
    }
  },
  "Morgana": {
    name: "Morgana",
    title: "Demon Realm Noblewoman",
    defaultLocation: "Gray Zone",
    environment: "The desiccated border badlands of the Gray Zone bordering the volcanic Demon Realm. Cracked, blistered obsidian earth glowing with subterranean magma fissures. The sky is a bruised violet-red, heavy with sulfuric fumes, ash flurries, and the distant wailing of planar monstrosities.",
    appearanceSensoryCues: "Striking demonic nobility. Sweeping dark ram horns curl through midnight-black hair, and glossy bat-like wings are draped gracefully behind her shoulders like a regal mantle. Dressed in opulent velvet and gold jewelry of ancient demonic craftsmanship. She holds a silver chalice brimming with planar wine, heavy-lidded golden eyes tracking your approach like an apex predator observing curious prey.",
    psychologicalProfile: "Hedonistic, commanding, ancient planar aristocrat. Amused by the fleeting struggles of mortals. She despises weakness, pious morality, and cowardly groveling, but is captivated by mortals possessing iron willpower, lethal ambition, or dark arcane resonance.",
    canonicalEncounter: "Sulfuric steam vents hiss around your boots as you cross the basalt threshold. Perched lazily atop an ancient sacrificial monolith, Morgana swirls her chalice, taking a slow sip. Her glowing amber gaze pins you where you stand, a faint, dangerously intoxicating smile parting her lips.",
    dialogueCadence: "Slow, sultry, mocking tone layered with ancient planar authority and dark amusement.",
    signatureOpeningDialogue: "A mortal walking the border of the volcanic wastes alone... how exquisitely reckless. Did you flee the Empire's pious inquisitors, or did you venture this close to the Demon Realm hoping someone would put an end to your tedious existence?",
    defaultExpression: "neutral",
    initialMood: "Predatory Amusement",
    baselineChoices: [
      "[Composure/Defiant]: Step to the rim of the fissure, meet her gaze evenly, and state that you seek power, not death.",
      "[Arcana/Analytical]: Identify the demonic seal binding her goblet and ask how she breached the Gray Zone wards.",
      "[Tactics/Pragmatic]: Offer mutual intelligence regarding the Imperial hunting parties tracking both of you.",
      "[Combat/Aggressive]: Keep your hand gripped on your weapon and declare the wastes belong to whoever survives."
    ],
    initialQuest: {
      id: "scenario_01_morgana",
      title: "Scenario 1: Fissure of the Demon Realm",
      description: "Withstand the gaze and planar aura of Demon Noblewoman Morgana without yielding to terror.",
      type: "scenario",
      difficulty: "E",
      objectives: [
        { text: "State your purpose for entering the Gray Zone borderlands without trembling", completed: false },
        { text: "Establish an initial pact or understanding with Morgana", completed: false }
      ],
      rewards: { exp: 120, gold: 50, title: "Abyss Walker" },
      status: "active"
    }
  },
  "Perci": {
    name: "Perci",
    title: "Timid Kitsune Rogue",
    defaultLocation: "Port City Fortus",
    environment: "The shadowy, fog-drenched slipways of Port City Fortus. Damp cobblestones slick with ocean brine and fish scales, towering stacks of salt-crusted maritime crates, and dim amber oil lamps struggling against the coastal mist. The muffled sound of harbor waves lap against the seawall.",
    appearanceSensoryCues: "A petite blonde kitsune rogue. Fluffy golden-fox ears flattened back against her head in distress, and a bushy tail tucked nervously behind her legs. She wears a travel-worn scarlet robe hanging loosely over a taut sarashi bandage wrap across her torso. Her amber eyes are wide with panic, and her knuckles are white as she grips a concealed hunting dagger.",
    psychologicalProfile: "Deeply traumatized by imperial bounty hunters and demi-human traffickers. Jumpy, highly anxious, soft-spoken, and hesitant. She expects betrayal and violence, but is fiercely protective and unconditionally loyal once someone earns her trust through patience and kindness.",
    canonicalEncounter: "You round the corner of a maritime warehouse into a dead-end alley. A stack of empty barrels clatters, and Perci recoils against the damp brick wall, her blade flashing out in a desperate, trembling defense as tears bead at the corners of her wide fox eyes.",
    dialogueCadence: "Soft, trembling, stuttering cadence filled with fearful hesitation and defensive panic.",
    signatureOpeningDialogue: "P-Please don't come any closer...! I... I wasn't doing anything forbidden, I promise. I just... needed somewhere quiet where the harbor watch wouldn't see my ears. A-Are you... here to turn me in?",
    defaultExpression: "flustered",
    initialMood: "Panicked & Defensive",
    baselineChoices: [
      "[Inquire/Gentle]: Step back, lower your hands in the lantern light, and reassure her you have no interest in bounties.",
      "[Observation/Analytical]: Point out the fresh blood on her sleeve and ask if she cut down the corsairs at the slipway.",
      "[Tactics/Survival]: Offer to shield her from the approaching watch in exchange for guidance through the lower docks.",
      "[Subterfuge/Rogue]: Flash your own covert operative emblem, proving you are not an imperial patrol."
    ],
    initialQuest: {
      id: "scenario_01_perci",
      title: "Scenario 1: Shadows of Port Fortus",
      description: "De-escalate the terrified kitsune rogue Perci before harbor watch patrols converge on the alleyway.",
      type: "scenario",
      difficulty: "E",
      objectives: [
        { text: "Reassure Perci and convince her you mean her no harm", completed: false },
        { text: "Help Perci evade or neutralize the searching harbor watchmen", completed: false }
      ],
      rewards: { exp: 120, gold: 50, title: "Harbor Protector" },
      status: "active"
    }
  }
};
