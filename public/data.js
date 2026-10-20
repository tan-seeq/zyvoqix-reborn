/* ZYVOQIX V6.0 - original playable games and independently hosted links. */
export const CATEGORIES = [
 {id:'all',en:'All games',ar:'\u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u0644\u0639\u0627\u0628',icon:'\u2728'},
 {id:'action',en:'Action & battles',ar:'\u0623\u0643\u0634\u0646 \u0648\u0645\u0639\u0627\u0631\u0643',icon:'\u2694\ufe0f'},
 {id:'racing',en:'Cars & racing',ar:'\u0633\u064a\u0627\u0631\u0627\u062a \u0648\u0633\u0628\u0627\u0642\u0627\u062a',icon:'\ud83c\udfce\ufe0f'},
 {id:'flight',en:'Planes & space',ar:'\u0637\u064a\u0631\u0627\u0646 \u0648\u0641\u0636\u0627\u0621',icon:'\u2708\ufe0f'},
 {id:'adventure',en:'Adventure & quests',ar:'\u0645\u063a\u0627\u0645\u0631\u0627\u062a \u0648\u0627\u0633\u062a\u0643\u0634\u0627\u0641',icon:'\ud83d\uddfa\ufe0f'},
 {id:'multiplayer',en:'Multiplayer',ar:'\u062c\u0645\u0627\u0639\u064a\u0629',icon:'\ud83c\udfae'}
];
function game(id,name,category,engine,variant,icon,desc,level='Medium'){
 return {id,name,category,engine,variant,icon,desc,level,local:true};
}
export const LOCAL_GAMES = [
 // Original browser-native GPU demos: these are NOT ports of the external downloadable titles.
 game('neon-vector-rally-3d','Neon Vector Rally 3D','racing','gpu','rally','🏎️','Neon racing: GPU-accelerated WebGL 3D with playable 2D compatibility mode.','WebGL 3D'),
 game('orbit-fighter-3d','Orbit Fighter 3D','flight','gpu','orbit','🛩️','Space flight: GPU-accelerated WebGL 3D with playable 2D compatibility mode.','WebGL 3D'),

 game('nebula-strike','Nebula Strike','action','shooter','nebula','\ud83d\ude80','Pilot a laser fighter and defeat waves of enemies.','Medium'),
 game('cyber-defender','Cyber Defender','action','shooter','cyber','\ud83e\udd16','Guard a futuristic city from rogue combat drones.','Medium'),
 game('tank-storm','Tank Storm','action','shooter','tank','\ud83d\udee1\ufe0f','Command your battle tank and clear hostile machines.','Hard'),
 game('meteor-fury','Meteor Fury','action','shooter','meteor','\u2604\ufe0f','Protect the station by blasting incoming meteors.','Medium'),
 game('neon-survivor','Neon Survivor','action','survivor','survivor','\u26a1','Dodge fast hunters and collect energy shards.','Hard'),
 game('target-rush','Target Rush','action','targets','targets','\ud83c\udfaf','Aim fast, keep your combo, beat the clock.','Easy'),
 game('turbo-highway','Turbo Highway','racing','road','highway','\ud83c\udfce\ufe0f','Overtake traffic and avoid a high-speed crash.','Easy'),
 game('desert-rally','Desert Rally','racing','road','desert','\ud83c\udfdd\ufe0f','Rally through dunes, rocks and valuable fuel pickups.','Medium'),
 game('neon-drift','Neon Drift','racing','road','drift','\ud83d\ude97','Steer smoothly on wet streets and collect nitro.','Hard'),
 game('police-pursuit','Police Pursuit','racing','road','police','\ud83d\ude93','Escape patrol roadblocks and survive the chase.','Hard'),
 game('kart-mayhem','Kart Mayhem','racing','road','kart','\ud83c\udfc1','Dash past rival karts and collect sparkling boosts.','Easy'),
 game('nitro-sprint','Nitro Sprint','racing','road','nitro','\ud83d\udca8','A fast checkpoint sprint for fearless drivers.','Hard'),
 game('sky-squadron','Sky Squadron','flight','shooter','sky','\u2708\ufe0f','Fly your fighter and intercept hostile aircraft.','Medium'),
 game('star-fighter','Star Fighter','flight','shooter','star','\ud83c\udf0c','Laser battles between the stars and space stations.','Hard'),
 game('cloud-racer','Cloud Racer','flight','fly','cloud','\u2601\ufe0f','Thread your plane between floating cloud gates.','Easy'),
 game('jet-canyon','Jet Canyon','flight','fly','canyon','\ud83d\udee9\ufe0f','Navigate narrow canyons without touching the cliffs.','Hard'),
 game('rescue-wings','Rescue Wings','flight','fly','rescue','\ud83d\ude81','Collect rescue beacons while avoiding storm clouds.','Medium'),
 game('drone-trials','Drone Trials','flight','fly','drone','\ud83d\udef8','Guide a drone through precision hologram rings.','Medium'),
 game('temple-sprint','Temple Sprint','adventure','runner','temple','\ud83c\udfdb\ufe0f','Jump temple traps and hunt for golden relics.','Medium'),
 game('jungle-leap','Jungle Leap','adventure','runner','jungle','\ud83c\udf3f','Run under the canopy and leap over wild hazards.','Easy'),
 game('portal-mission','Portal Mission','adventure','runner','portal','\ud83c\udf00','Jump laser gates inside a mysterious portal world.','Hard'),
 game('crystal-explorer','Crystal Explorer','adventure','maze','crystal','\ud83d\udc8e','Find the exit and collect glowing cave crystals.','Medium'),
 game('dungeon-key','Dungeon Key','adventure','maze','dungeon','\ud83d\udd11','Find the key, avoid sentries and open the dungeon gate.','Hard'),
 game('island-treasure','Island Treasure','adventure','maze','island','\ud83c\udfdd\ufe0f','Explore twisting island paths for lost treasure.','Easy')
];
function ext(id,name,category,url,provider,icon,device='Desktop / Mobile',note='Free browser play on publisher platform'){
 return {id,name,category,url,provider,icon,device,note,local:false};
}
/* Direct URLs point to the original publishers or reputable game portals.
   No external title is copied, framed, or represented as hosted by Zyvoqix. */
export const EXTERNAL_GAMES = [
 ext('shellshock','Shell Shockers','action','https://www.crazygames.com/game/shellshockersio','CrazyGames','\ud83e\udd5a','Desktop','Cartoon multiplayer FPS. Account and ads depend on host.'),
 ext('venge','Venge.io','action','https://poki.com/en/g/venge-io','Poki','\ud83c\udfaf'),
 ext('smash','Smash Karts','racing','https://www.crazygames.com/game/smash-karts','CrazyGames','\ud83c\udfce\ufe0f'),
 ext('moto','Moto X3M','racing','https://poki.com/en/g/moto-x3m','Poki','\ud83c\udfcd\ufe0f'),
 ext('driftboss','Drift Boss','racing','https://www.crazygames.com/game/drift-boss','CrazyGames','\ud83d\ude98'),
 ext('slowroads','Slow Roads','racing','https://slowroads.io/','Slow Roads','\ud83c\udf04','Desktop','Relaxed browser driving simulation.'),
 ext('geofs','GeoFS','flight','https://www.geo-fs.com/','GeoFS','\ud83d\udee9\ufe0f','Desktop','Browser flight simulator; registration optional for some features.'),
 ext('airplanehub','Airplane Games','flight','https://www.crazygames.com/t/airplane','CrazyGames','\ud83d\udeeb','Desktop / Mobile','Trusted provider category - choose a game there.'),
 ext('skyhub','Flying Games','flight','https://poki.com/en/airplane','Poki','\ud83d\ude81','Desktop / Mobile','Trusted provider category - choose a game there.'),
 ext('temple2','Temple Run 2','adventure','https://poki.com/en/g/temple-run-2','Poki','\ud83d\uddff'),
 ext('subway','Subway Surfers','adventure','https://poki.com/en/g/subway-surfers','Poki','\ud83c\udf89'),
 ext('leveldevil','Level Devil','adventure','https://poki.com/en/g/level-devil','Poki','\ud83c\udfc3'),
 ext('firewater','Fireboy and Watergirl','adventure','https://www.crazygames.com/game/fireboy-and-watergirl-the-forest-temple','CrazyGames','\ud83d\udd25'),
 ext('bloxd','Bloxd.io','multiplayer','https://bloxd.io/','Bloxd.io','\ud83e\uddf1'),
 ext('skr','Skribbl.io','multiplayer','https://skribbl.io/','Skribbl.io','\ud83c\udfa8'),
 ext('gartic','Gartic Phone','multiplayer','https://garticphone.com/','Gartic Phone','\ud83d\udcde'),
 ext('bonk','Bonk.io','multiplayer','https://bonk.io/','Bonk.io','\u26bd'),
 ext('poki','Explore Poki','multiplayer','https://poki.com/','Poki','\ud83c\udfae','Desktop / Mobile','Game storefront - explore titles on the site.'),
 ext('crazy','Explore CrazyGames','action','https://www.crazygames.com/','CrazyGames','\ud83d\udd25','Desktop / Mobile','Game storefront - explore titles on the site.')
];
export const CATEGORY_NAMES=Object.fromEntries(CATEGORIES.map(c=>[c.id,c.ar]));

/* Verified project-owned download or code pages. Open source does not guarantee game data redistribution rights. */
export const OPEN_SOURCE_GAMES = [
 {
  "id": "oss-unvanquished",
  "name": "Unvanquished",
  "category": "action",
  "url": "https://unvanquished.net/download/",
  "provider": "Unvanquished",
  "icon": "👾",
  "launchMode": "download",
  "note": "FPS + strategy hybrid. Requires native PC installation.",
  "device": "Windows / macOS / Linux"
 },
 {
  "id": "oss-xonotic",
  "name": "Xonotic",
  "category": "action",
  "url": "https://xonotic.org/download/",
  "provider": "Xonotic",
  "icon": "🔫",
  "launchMode": "download",
  "note": "Fast-paced arena FPS. No verified official browser version.",
  "device": "Windows / Linux"
 },
 {
  "id": "oss-tesseract",
  "name": "Tesseract FPS Engine",
  "category": "action",
  "url": "https://github.com/lsalzman/tesseract",
  "provider": "Tesseract source repository",
  "icon": "💠",
  "launchMode": "source",
  "note": "Source/rendering technology demonstration; NOT a browser-playable game build.",
  "device": "Source code / desktop build"
 },
 {
  "id": "oss-darkmod",
  "name": "The Dark Mod",
  "category": "action",
  "url": "https://www.thedarkmod.com/downloads/",
  "provider": "The Dark Mod",
  "icon": "🥷",
  "launchMode": "download",
  "note": "Standalone stealth game for desktop; installation required.",
  "device": "Windows / Linux"
 },
 {
  "id": "oss-speeddreams",
  "name": "Speed Dreams",
  "category": "racing",
  "url": "https://www.speed-dreams.net/en/downloads",
  "provider": "Speed Dreams",
  "icon": "🏁",
  "launchMode": "download",
  "note": "Realistic PC motorsport simulation, NOT embedded browser play.",
  "device": "Windows / Linux"
 },
 {
  "id": "oss-ror",
  "name": "Rigs of Rods",
  "category": "racing",
  "url": "https://www.rigsofrods.org/",
  "provider": "Rigs of Rods",
  "icon": "🚙",
  "launchMode": "download",
  "note": "Soft-body vehicle physics. Requires a powerful native desktop client.",
  "device": "Windows / Linux"
 },
 {
  "id": "oss-flightgear",
  "name": "FlightGear",
  "category": "flight",
  "url": "https://www.flightgear.org/download/",
  "provider": "FlightGear",
  "icon": "✈️",
  "launchMode": "download",
  "note": "Open-source flight simulator; requires native installation and downloads.",
  "device": "Windows / macOS / Linux"
 },
 {
  "id": "oss-0ad",
  "name": "0 A.D.",
  "category": "adventure",
  "url": "https://play0ad.com/download/",
  "provider": "Wildfire Games",
  "icon": "🏛️",
  "launchMode": "download",
  "note": "Historical RTS with native desktop builds; not browser FPS.",
  "device": "Windows / macOS / Linux"
 },
 {
  "id": "oss-veloren",
  "name": "Veloren",
  "category": "adventure",
  "url": "https://veloren.net/download/",
  "provider": "Veloren",
  "icon": "🗻",
  "launchMode": "download",
  "note": "Open-world voxel RPG; install Airshipper launcher to play.",
  "device": "Windows / macOS / Linux"
 },
 {
  "id": "oss-openmw",
  "name": "OpenMW",
  "category": "adventure",
  "url": "https://openmw.org/downloads/",
  "provider": "OpenMW",
  "icon": "🗡️",
  "launchMode": "engine",
  "note": "Open-source game engine. Original Morrowind assets must be licensed separately.",
  "device": "Windows / macOS / Linux"
 }
];
