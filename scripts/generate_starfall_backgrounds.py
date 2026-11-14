import os
import re
import sys
import json
import time
import base64
import urllib.request
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

WORKSPACE_DIR = r"C:\Users\isawi\Astra Chronicles"
OUT_DIR = os.path.join(WORKSPACE_DIR, "public", "backgrounds", "starfall-labyrinth")

STYLE_PREFIX = (
    "Masterpiece 16:9 widescreen anime-gacha visual-novel environment background illustration, "
    "high-detail luminous dark-fantasy painted concept art (Granblue Fantasy / Honkai / Fate environment art quality), "
    "rich atmospheric perspective, volumetric lighting, crisp architectural details, clear open foreground ground plane for character sprites. "
    "STRICTLY NO people, NO characters, NO silhouettes, NO creatures, NO text, NO UI, NO watermarks. "
)

BACKGROUNDS = [
    {
        "slug": "star_gate_plaza",
        "title": "Star Gate Plaza (Floating Lobby Island)",
        "prompt": (
            STYLE_PREFIX
            + "Wide vista of Star Gate Plaza built atop a massive floating sky-island suspended high in a twilight astral sea of starlit indigo clouds and cascading starlight waterfalls. "
            "In the center of the grand black-obsidian and white-marble plaza rises the towering cyan-and-gold crystalline Star Gate summoning monolith inscribed with glowing star-runes. "
            "To one side along the carved marble balustrade cliff-edge glows an active blue-flamed Floor 1 Transfer Ring; to the other rises the stone archway of the Iron Barracks lodge. "
            "Beyond the floating island's rocky root-cliffs and waterfalls, dozens of other Masters' distant floating rock sky-islands drift at varied altitudes across the cosmic cloud sea—some crowned with grand gilded marble palaces, others dark crumbling stone ruins—all orbiting the colossal central 100-Floor Starfall Labyrinth Spire piercing the heavens on the horizon beneath faint golden holographic Command-Seal constellations. Strictly rocky floating islands only, NO flying animals or ships."
        ),
    },
    {
        "slug": "roster_barracks",
        "title": "The Iron Barracks (Floating Island Quarters)",
        "prompt": (
            STYLE_PREFIX
            + "Cozy yet battle-ready interior of The Iron Barracks war-room and dormitory lodge built along the cliffside of a large floating sky-island. "
            "Warm amber firelight from a crackling wrought-iron hearth illuminates a heavy oak tactical table covered with unrolled Labyrinth floor maps, brass compasses, inkwells, and spirit lanterns, surrounded by weapon maintenance racks holding polearms, shields, and swords, plus tucked-away wooden bunk alcoves with folded cloaks. "
            "Along the left and back wall, grand open arched stone terrace windows and a balcony look directly out over a breathtaking astral twilight sea of clouds, floating rock islets, neighboring Masters' distant floating lobby islands, and the towering Starfall Labyrinth Spire on the horizon."
        ),
    },
    {
        "slug": "memorial_sanctum",
        "title": "The Memorial Wall (Floating Island Cliffside Cloister)",
        "prompt": (
            STYLE_PREFIX
            + "Solemn, hauntingly beautiful open-air gothic marble-and-obsidian cloister perched on the sheer outer cliff edge of a large floating sky-island. "
            "Along the curved vaulted stone wall on the right, thousands of carved pointed niches hold softly glowing pale-cyan crystal dog-tags, shattered weapon hilts, and flickering blue soul-candles commemorating fallen gacha heroes, with fine silver Star Ash drifting gently on the breeze. "
            "To the left, open colonnade arches and a cracked marble terrace drop off into an endless astral sea of starlit clouds, cascading waterfalls pouring off the floating island's edge, distant floating lobby islands, and the monolithic 100-Floor Starfall Labyrinth Spire far across the void."
        ),
    },
    {
        "slug": "masters_console",
        "title": "The Master's Conduit Chamber (Sky-Island Observatory)",
        "prompt": (
            STYLE_PREFIX
            + "Eerie, awe-inspiring obsidian-and-gold astral observatory suspended high above a large floating lobby island, directly beneath a fractured crystalline glass-dome sky where giant faint golden system rings shimmer. "
            "Through sweeping panoramic tall glass arches, look down upon the floating sky-island's glowing Star Gate monolith courtyard far below, plus other Masters' floating islands drifting across the purple-teal cloud sea toward the distant Starfall Labyrinth Tower. "
            "Inside the polished black-mirror gallery float translucent golden holographic summoning matrices, geometric rune-screens, crimson Command-Seal glyphs, and an ornate empty gilded command lectern."
        ),
    },
    {
        "slug": "sunken_reliquary",
        "title": "Stratum I: The Sunken Reliquary & Drowned Basilica (Floors 1-25)",
        "prompt": (
            STYLE_PREFIX
            + "Cavernous half-submerged gothic reliquary cathedral inside Floors 1-25 of a dark-fantasy dungeon tower. "
            "Ankle-deep mirror-like dark brine covers cracked limestone flagstones, lit by eerie bioluminescent emerald-teal grave-moss clinging to towering skull-lined ossuary arches and broken marble pillars. "
            "Heavy rusted iron chandelier chains and a sunken bronze cathedral bell hang from the vaulted ceiling above raised stone altar steps, iron mimic coffers, and mist-shrouded portcullis gates."
        ),
    },
    {
        "slug": "chronos_foundry",
        "title": "Stratum II: The Chronos Foundry & Cinder Clockwork (Floors 26-50)",
        "prompt": (
            STYLE_PREFIX
            + "Monumental subterranean clockwork foundry chasm inside Floors 26-50 of a fantasy labyrinth tower. "
            "Cathedral-sized interlocking antique-brass escapement gears and giant swinging razor-edged pendulums span a dizzying vertical abyss, illuminated by glowing amber-orange channels of molten cinder-glass, copper lightning coils, pressurized steam vents, and floating turquoise temporal hourglasses above an iron gear-bridge catwalk."
        ),
    },
    {
        "slug": "cinder_horizon_gate",
        "title": "Floor 40: Cinder Horizon & Unwound Sun Gate",
        "prompt": (
            STYLE_PREFIX
            + "Epic boss-arena basilica of blackened obsidian and molten gold at Floor 40 of the Chronos Foundry. "
            "A cracked basalt causeway leads across rivers of glowing liquid amber glass toward a colossal sealed bronze-and-obsidian Abyssal Lift Gate inscribed with forty burning solar runes and crowned by a suspended mechanical Unwound Sun engine of concentric spinning brass rings and white-hot cinders."
        ),
    },
    {
        "slug": "eclipse_sanctum",
        "title": "Stratum III: The Eclipse Sanctum & Mirror Cloisters (Floors 51-75)",
        "prompt": (
            STYLE_PREFIX
            + "Uncharted dark-gothic Eclipse Sanctum inside Floors 51-75 of a fantasy tower. "
            "Deep crimson blood-moon light streams through towering shattered rose-window stained glass onto ash-covered stone pews and non-Euclidean colonnades of giant ornate black-silver illusion mirrors. "
            "At the center of the ruined nave burns an eerie unextinguishable bonfire of pale-jade and crimson embers surrounded by floating shards of mirror glass and drifting silver ash."
        ),
    },
    {
        "slug": "crimson_trial_court",
        "title": "Floor 70: Blood-Moon Viaduct & Crimson Trial Court",
        "prompt": (
            STYLE_PREFIX
            + "Dramatic open-air gothic dueling viaduct high on the exterior of a dark fantasy spire beneath a gigantic total black-and-scarlet solar eclipse filling the sky. "
            "Shattered white-marble and black-iron gothic arches line a wide battle bridge dusted with crimson petals and embers, while giant glowing red Command-Seal magic circles and eclipse corona flames blaze in the blood-red sky."
        ),
    },
    {
        "slug": "astral_singularity",
        "title": "Stratum IV: The Astral Singularity & Starlight Causeway (Floors 76-99)",
        "prompt": (
            STYLE_PREFIX
            + "Surreal cosmic endgame stratum inside Floors 76-99 of the Starfall Labyrinth. "
            "Fractured zero-gravity walkways of white marble and polished obsidian float through a deep indigo-and-violet nebula void, flanked by towering silver System Arbiter obelisks, giant conduits of glowing golden-cyan Star Shards, gravity anchor rings, and streams of luminous silver rune-code raining upward toward a cracked glass sky."
        ),
    },
    {
        "slug": "administrators_crown",
        "title": "Floor 100: Throne of the Administrator & Shattered Fourth Wall",
        "prompt": (
            STYLE_PREFIX
            + "Breathtaking Floor 100 final boss summit at the absolute apex of the Starfall Labyrinth Tower. "
            "A grand circular arena of starlit white crystal and black obsidian hangs directly beneath a vast shattered glass sky cracking open into blinding golden-white celestial light. "
            "Concentric silver Covenant rings and broken gacha-star prisms orbit a monumental empty crystalline Sovereign Throne at the far end of the causeway, with golden stardust and silver geometric fragments suspended in zero gravity."
        ),
    },
    {
        "slug": "lantern_sky_oasis",
        "title": "Upper Safe Zone: Lantern Broker Sky-Sanctum",
        "prompt": (
            STYLE_PREFIX
            + "Warm, atmospheric high-altitude Safe Zone sanctuary terrace built into a wide arched breach in the outer stone wall of a colossal fantasy tower, overlooking a twilight sea of starlit clouds far below. "
            "Hundreds of glowing warm-amber paper and brass spirit-lanterns hang on ropes across vaulted arches above a cozy cobblestone camp featuring a crackling central stone firepit, a glowing cyan crystalline Supply Obelisk, a weapon-repair anvil, stacked supply crates, and colorful canvas merchant awnings."
        ),
    },
]

def get_api_key() -> str:
    env_path = os.path.join(WORKSPACE_DIR, ".env.local")
    with open(env_path, "r", encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"^OPENROUTER_API_KEY=(.+)$", text, re.M)
    if not m:
        raise RuntimeError("OPENROUTER_API_KEY not found in .env.local")
    return m.group(1).strip().strip("'\"")

def generate_one(api_key: str, item: dict) -> str:
    slug = item["slug"]
    out_path = os.path.join(OUT_DIR, f"{slug}.jpg")
    models = [
        "google/gemini-3.1-flash-image",
        "google/gemini-3.1-flash-image",
        "google/gemini-2.5-flash-image",
    ]
    last_err = None
    for attempt, model_id in enumerate(models, start=1):
        payload = {
            "model": model_id,
            "modalities": ["image", "text"],
            "image_config": {"aspect_ratio": "16:9"},
            "messages": [
                {
                    "role": "user",
                    "content": [{"type": "text", "text": item["prompt"]}],
                }
            ],
        }
        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            print(f"[{slug}] Attempt {attempt} ({model_id})...", flush=True)
            with urllib.request.urlopen(req, timeout=110) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            msg = data.get("choices", [{}])[0].get("message", {})
            img_url = None
            if msg.get("images"):
                img_url = msg["images"][0]["image_url"]["url"]
            elif isinstance(msg.get("content"), list):
                for part in msg["content"]:
                    if part.get("type") == "image_url":
                        img_url = part["image_url"]["url"]
                        break
            if not img_url:
                raise RuntimeError(f"No image in response: {json.dumps(msg)[:220]}")
            raw_b64 = img_url.split(",", 1)[1]
            im = Image.open(BytesIO(base64.b64decode(raw_b64))).convert("RGB")
            im.save(out_path, format="JPEG", quality=95, subsampling=0)
            print(f"[{slug}] Saved -> {out_path} {im.size}", flush=True)
            return out_path
        except Exception as e:
            last_err = e
            print(f"[{slug}] Attempt {attempt} failed: {e}", flush=True)
            time.sleep(2 * attempt)
    raise RuntimeError(f"[{slug}] All attempts failed: {last_err}")

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    only = None
    if "--only" in sys.argv:
        idx = sys.argv.index("--only")
        if idx + 1 < len(sys.argv):
            only = {s.strip() for s in sys.argv[idx + 1].split(",") if s.strip()}

    targets = [b for b in BACKGROUNDS if not only or b["slug"] in only]
    api_key = get_api_key()
    print(f"Generating {len(targets)} Starfall Labyrinth 16:9 backgrounds...", flush=True)

    failures = []
    with ThreadPoolExecutor(max_workers=3) as pool:
        futs = {pool.submit(generate_one, api_key, item): item["slug"] for item in targets}
        for fut in as_completed(futs):
            slug = futs[fut]
            try:
                fut.result()
            except Exception as e:
                print(f"[ERROR] {slug}: {e}", flush=True)
                failures.append(slug)

    if failures:
        raise RuntimeError(f"Failed backgrounds: {failures}")
    print("All requested Starfall backgrounds generated!", flush=True)

if __name__ == "__main__":
    main()
