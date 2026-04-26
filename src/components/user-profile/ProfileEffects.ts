export interface EffectLayer { src: string; loop: boolean; width: number; height: number; duration: number; start: number; loopDelay: number; zIndex: number }
export interface ProfileEffectData { id: string; title: string; thumbnailSrc: string; effects: EffectLayer[] }

export const PROFILE_EFFECTS: ProfileEffectData[] = [
  {
    id: "boost-relic", title: "Boost Relic",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-7/boost-relic/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/boost-relic/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/boost-relic/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "cyberspace", title: "Cyberspace",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-7/cyberspace/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/cyberspace/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/cyberspace/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "hydro-blast", title: "Hydro Blast",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/splash/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/splash/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/splash/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "shatter", title: "Shatter",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/earthquake/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-5/earthquake/intro.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/earthquake/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 2880, zIndex: 101 },
    ],
  },
  {
    id: "magic-hearts", title: "Magic Hearts",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/magic-girl/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/magic-girl/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/magic-girl/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "sakura-dreams", title: "Sakura Dreams",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/sakura/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-12-13/sakura/intro.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/sakura/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 2880, zIndex: 101 },
    ],
  },
  {
    id: "power-surge", title: "Power Surge",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/sayan/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/sayan/intro.png", loop: false, height: 880, width: 450, duration: 2400, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/sayan/loop.png", loop: true, height: 880, width: 450, duration: 2480, start: 4960, loopDelay: 4960, zIndex: 101 },
    ],
  },
  {
    id: "shuriken-strike", title: "Shuriken Strike",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/shuriken/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-5/shuriken/intro3.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/shuriken/loop3.png", loop: true, height: 880, width: 450, duration: 2000, start: 2880, loopDelay: 2000, zIndex: 101 },
    ],
  },
  {
    id: "mystic-vines", title: "Mystic Vines",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/vines/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/vines/intro.png", loop: true, height: 880, width: 450, duration: 3071, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/vines/loop.png", loop: true, height: 880, width: 450, duration: 2988, start: 2905, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/vines/intro-glow.png", loop: false, height: 880, width: 450, duration: 2573, start: 1666, loopDelay: 0, zIndex: 102 },
    ],
  },
  {
    id: "pixie-dust", title: "Pixie Dust",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/fairy/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/fairy/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 2880, zIndex: 100 },
    ],
  },
  {
    id: "discord-os", title: "Discord-Os",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/cereal/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/cereal/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/cereal/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "breakfast-plate", title: "Breakfast Plate",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/plate/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/plate/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/plate/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "ghoulish-graffiti", title: "Ghoulish Graffiti",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/punk-girl/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/punk-girl/intro.png", loop: false, height: 880, width: 450, duration: 2573, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/punk-girl/loop.png", loop: true, height: 880, width: 450, duration: 2000, start: 5146, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "dark-omens", title: "Dark Omens",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/ghost-skull/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/ghost-skull/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/ghost-skull/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "zombie-slime", title: "Zombie Slime",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/zombie-slime/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/zombie-slime/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/zombie-slime/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "fall-foliage", title: "Fall Foliage",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/leaves/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/leaves/intro-branch.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/leaves/intro-leaves.png", loop: false, height: 880, width: 450, duration: 2988, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/leaves/loop.png", loop: true, height: 880, width: 450, duration: 3984, start: 5760, loopDelay: 7968, zIndex: 102 },
    ],
  },
  {
    id: "lillypad-life", title: "Lillypad Life",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/rain/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/rain/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/rain/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "deck-the-halls", title: "Deck the halls",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/deck-the-halls/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-28/deck-the-halls/intro.png", loop: true, height: 880, width: 450, duration: 1750, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/deck-the-halls/loop.png", loop: true, height: 880, width: 450, duration: 1250, start: 1750, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "snowy-shenanigans", title: "Snowy Shenanigans",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-28/snowy-shenanigans/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-28/snowy-shenanigans/intro.png", loop: true, height: 880, width: 450, duration: 4168, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/snowy-shenanigans/loop.png", loop: true, height: 880, width: 450, duration: 8334, start: 4168, loopDelay: 8334, zIndex: 101 },
    ],
  },
  {
    id: "goozilla", title: "Goozilla",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/intro-claw.png", loop: true, height: 880, width: 450, duration: 4250, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/intro-slime.png", loop: false, height: 880, width: 450, duration: 4250, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/loop.png", loop: true, height: 880, width: 450, duration: 3000, start: 4250, loopDelay: 0, zIndex: 102 },
    ],
  },
  {
    id: "heartzilla", title: "Heartzilla",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/heartzilla/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-30/heartzilla/intro.png", loop: true, height: 880, width: 450, duration: 3750, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/heartzilla/loop.png", loop: true, height: 880, width: 450, duration: 4000, start: 3750, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "monster-pop", title: "Monster Pop",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/monster-pop/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-30/monster-pop/intro-monster.png", loop: true, height: 880, width: 450, duration: 3917, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-30/monster-pop/intro-glass.png", loop: true, height: 880, width: 450, duration: 3917, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/monster-pop/loop.png", loop: true, height: 880, width: 450, duration: 2083, start: 3917, loopDelay: 0, zIndex: 102 },
    ],
  },
  {
    id: "nightrunner", title: "Nightrunner",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-16/cyberpunk-nightrunner/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-19/cyberpunk-nightrunner/intro.png", loop: false, height: 880, width: 450, duration: 2960, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-18/cyberpunk-nightrunner/idle.png", loop: true, height: 880, width: 450, duration: 2960, start: 5920, loopDelay: 5920, zIndex: 101 },
    ],
  },
  {
    id: "uplink-error", title: "Uplink Error",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-16/cyberpunk-uplinkerror/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-19/cyberpunk-uplinkerror/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-18/cyberpunk-uplinkerror/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "dragon-dance", title: "Dragon Dance",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-01-31/dragon-dance/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-07/dragon-dance/intro_2e0f72c35c.png", loop: false, height: 880, width: 450, duration: 3360, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-07/dragon-dance/loop_20e743b578.png", loop: true, height: 880, width: 450, duration: 8560, start: 2880, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "fortune-flurry", title: "Fortune Flurry",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-01-31/fortune-flurry/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/fortune-flurry/frame.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/fortune-flurry/intro.png", loop: false, height: 880, width: 450, duration: 3280, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-02/fortune-flurry/loop.png", loop: true, height: 880, width: 450, duration: 10000, start: 2880, loopDelay: 0, zIndex: 102 },
    ],
  },
  {
    id: "midnight-celebration", title: "Midnight Celebration",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-01-31/midnight-celebration/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/midnight-celebration/frame.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/midnight-celebration/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/midnight-celebration/fireworks.png", loop: true, height: 880, width: 450, duration: 2880, start: 3200, loopDelay: 5760, zIndex: 102 },
    ],
  },
  {
    id: "rock-slide", title: "Rock Slide",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/rock-slide/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/rock-slide/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/rock-slide/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "vortex", title: "Vortex",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/vortex/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/vortex/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/vortex/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "mastery", title: "Mastery",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/mastery/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/mastery/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/mastery/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "dreamy", title: "Dreamy",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/dreamy/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/dreamy/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/dreamy/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 3280, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "ki-detonate", title: "Ki Detonate",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/ki-detonate/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/ki-detonate/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/ki-detonate/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 3280, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "sushi-mania", title: "Sushi Mania",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/sushi-mania/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/sushi-mania/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/sushi-mania/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 3280, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "petal-serenade", title: "Petal Serenade",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/intro-pse01.png", loop: false, height: 880, width: 450, duration: 3200, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/idle-frame.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/idle-petals.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 3500, zIndex: 102 },
    ],
  },
  {
    id: "fellowship-of-the-spring", title: "Fellowship of the Spring",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/intro-fose01.png", loop: false, height: 880, width: 450, duration: 3100, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/idle-frame.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/idle-critters.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 8000, zIndex: 102 },
    ],
  },
  {
    id: "spring-bloom", title: "Spring Bloom",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/intro-sbe01.png", loop: false, height: 880, width: 450, duration: 7300, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/idle-flowers.png", loop: true, height: 880, width: 450, duration: 4800, start: 6800, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/idle-rain.png", loop: true, height: 880, width: 450, duration: 4880, start: 6800, loopDelay: 8000, zIndex: 102 },
    ],
  },
  {
    id: "cloves-ruse", title: "Clove's Ruse",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/cloves-ruse/thumbnail_a5917b67.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/cloves-ruse/intro_b62d8ce4.png", loop: false, height: 880, width: 450, duration: 5360, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/cloves-ruse/idle_050419ac.png", loop: true, height: 880, width: 450, duration: 5840, start: 6560, loopDelay: 5840, zIndex: 101 },
    ],
  },
  {
    id: "ace", title: "ACE",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/thumbnail_7c4f8929.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/intro_fa545ec0.png", loop: false, height: 880, width: 450, duration: 4480, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/idle_frame_83d027d7.png", loop: true, height: 880, width: 450, duration: 20000, start: 4080, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/idle_a4ea3c0d.png", loop: true, height: 880, width: 450, duration: 5680, start: 8960, loopDelay: 0, zIndex: 102 },
    ],
  },
  {
    id: "the-immortal-clove", title: "The Immortal Clove",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/the-immortal-clove/thumbnail_20409a9b.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/the-immortal-clove/intro_310a69a3.png", loop: false, height: 880, width: 400, duration: 4890, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/the-immortal-clove/idle_8739289c.png", loop: true, height: 880, width: 400, duration: 7350, start: 9780, loopDelay: 3580, zIndex: 101 },
    ],
  },
  {
    id: "study-spot", title: "Study Spot",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/study-spot/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-12/study-spot/intro.png", loop: false, height: 880, width: 450, duration: 3000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/study-spot/idle.png", loop: true, height: 880, width: 450, duration: 3000, start: 3000, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "all-nighter", title: "All Nighter",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/all-nighter/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-14/all-nighter/intro.png", loop: false, height: 880, width: 450, duration: 3000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/all-nighter/idle-frame.png", loop: true, height: 880, width: 450, duration: 3000, start: 3000, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/all-nighter/idle-lights.png", loop: true, height: 880, width: 450, duration: 3000, start: 4000, loopDelay: 5000, zIndex: 102 },
    ],
  },
  {
    id: "watercolors", title: "Watercolors",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/watercolors/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/watercolors/intro.png", loop: false, height: 880, width: 450, duration: 3000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/watercolors/idle.png", loop: true, height: 880, width: 450, duration: 3000, start: 6000, loopDelay: 3000, zIndex: 101 },
    ],
  },
  {
    id: "shooting-stars", title: "Shooting Stars",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-22/shooting-stars/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/shooting-stars/intro_770bd27eae0.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/shooting-stars/loop_b1b5a9936b.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 4320, zIndex: 101 },
    ],
  },
  {
    id: "supernova", title: "Supernova",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-22/supernova/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/supernova/intro_9e90bcf683.png", loop: true, height: 880, width: 450, duration: 2960, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/supernova/loop_5835f1730b.png", loop: true, height: 880, width: 450, duration: 2880, start: 5920, loopDelay: 4320, zIndex: 101 },
    ],
  },
  {
    id: "twilight", title: "Twilight",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-22/twilight/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/twilight/intro_56dbd2384f.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/twilight/loop_ff3e249d19.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 4320, zIndex: 101 },
    ],
  },
  {
    id: "feelin-mischievous", title: "Feelin' Mischievous",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/intro_bg.png", loop: false, height: 880, width: 450, duration: 5200, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/intro.png", loop: false, height: 880, width: 450, duration: 5200, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/idle_bg.png", loop: true, height: 880, width: 450, duration: 2160, start: 4800, loopDelay: 0, zIndex: 102 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/idle.png", loop: true, height: 880, width: 450, duration: 2160, start: 4800, loopDelay: 0, zIndex: 103 },
    ],
  },
  {
    id: "feelin-90s", title: "Feelin' 90s",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-70s/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-70s/intro.png", loop: false, height: 880, width: 450, duration: 1360, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-70s/idle.png", loop: true, height: 880, width: 450, duration: 8080, start: 1360, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "feelin-pizzazz", title: "Feelin' Pizzazz",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-pizzazz/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-10/feelin-pizzazz/intro.png", loop: false, height: 880, width: 450, duration: 1280, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-pizzazz/idle.png", loop: true, height: 880, width: 450, duration: 7840, start: 1260, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "jolly-roger", title: "Jolly Roger",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/jolly-roger/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-10/jolly-roger/intro.png", loop: false, height: 880, width: 450, duration: 3280, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/jolly-roger/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 6000, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "forgotten-treasure", title: "Forgotten Treasure",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/forgotten-treasure/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-10/forgotten-treasure/intro.png", loop: false, height: 880, width: 450, duration: 3840, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/forgotten-treasure/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 6000, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "haunted-man-o-war", title: "Haunted Man O' War",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/haunted-man-o-war/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-13/haunted-man-o-war/intro.png", loop: false, height: 880, width: 450, duration: 3280, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-13/haunted-man-o-war/idle.png", loop: true, height: 880, width: 450, duration: 3280, start: 6000, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "space-evader", title: "Space Evader",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/intro_bg.png", loop: false, height: 880, width: 450, duration: 4160, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/intro_spaceship.png", loop: false, height: 880, width: 450, duration: 3840, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/idle.png", loop: true, height: 880, width: 450, duration: 4800, start: 7000, loopDelay: 3500, zIndex: 102 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/hud.png", loop: true, height: 880, width: 450, duration: 2400, start: 0, loopDelay: 0, zIndex: 103 },
    ],
  },
  {
    id: "turbo-drive", title: "Turbo Drive",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/idle_finish.png", loop: true, height: 880, width: 450, duration: 2880, start: 2700, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/idle_confetti.png", loop: true, height: 880, width: 450, duration: 2880, start: 2700, loopDelay: 3500, zIndex: 102 },
    ],
  },
  {
    id: "twinkle-trails", title: "Twinkle Trails",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/twinkle-trails/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/twinkle-trails/intro.png", loop: false, height: 880, width: 450, duration: 9760, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/twinkle-trails/idle.png", loop: true, height: 880, width: 450, duration: 6380, start: 9500, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "saya", title: "Saya",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/saya/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-21/saya/intro.png", loop: false, height: 880, width: 450, duration: 3840, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/saya/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 10240, loopDelay: 6400, zIndex: 101 },
    ],
  },
  {
    id: "wake-up", title: "Wake Up!",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/wake-up/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-20/wake-up/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/wake-up/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 7780, loopDelay: 4900, zIndex: 101 },
    ],
  },
  {
    id: "tocotoco", title: "Tocotoco",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/tocotoco/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-20/tocotoco/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/tocotoco/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 7000, zIndex: 101 },
    ],
  },
  {
    id: "arcane-summons", title: "Arcane Summons",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/arcane-summons/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/arcane-summons/intro.png", loop: false, height: 880, width: 450, duration: 4720, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/arcane-summons/idle.png", loop: true, height: 880, width: 450, duration: 4960, start: 8000, loopDelay: 5000, zIndex: 101 },
    ],
  },
  {
    id: "vengeance", title: "Vengeance",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/vengeance/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/vengeance/intro.png", loop: false, height: 880, width: 450, duration: 3840, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/vengeance/idle.png", loop: true, height: 880, width: 450, duration: 5120, start: 8000, loopDelay: 5000, zIndex: 101 },
    ],
  },
  {
    id: "spirit-flame", title: "Spirit Flame",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/spirit-flame/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/spirit-flame/intro.png", loop: false, height: 880, width: 450, duration: 2560, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/spirit-flame/idle.png", loop: true, height: 880, width: 450, duration: 2960, start: 6000, loopDelay: 6000, zIndex: 101 },
    ],
  },
  {
    id: "nice-profile", title: "NiCe pRoFiLE",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/nice-profile/thumbnail_f44f333d.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-24/nice-profile/intro_a9d1e733.png", loop: false, height: 880, width: 450, duration: 6000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/nice-profile/idle_a.png", loop: true, height: 880, width: 450, duration: 4760, start: 8920, loopDelay: 14760, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/nice-profile/idle_b.png", loop: true, height: 880, width: 450, duration: 4760, start: 18680, loopDelay: 14760, zIndex: 102 },
    ],
  },
  {
    id: "handsome-squidward", title: "Handsome Squidward",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/thumbnail_c1f759bf.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/intro_e89c516b.png", loop: false, height: 880, width: 450, duration: 6000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/idle_a.png", loop: true, height: 880, width: 450, duration: 3280, start: 9000, loopDelay: 14120, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/idle_b.png", loop: true, height: 880, width: 450, duration: 4120, start: 17280, loopDelay: 13280, zIndex: 102 },
    ],
  },
  {
    id: "doodlebob-takeover", title: "DoodleBob Takeover",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/doodlebob-takeover/thumbnail_23f31885.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/doodlebob-takeover/intro_479359c2.png", loop: false, height: 880, width: 450, duration: 6000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/doodlebob-takeover/idle.png", loop: true, height: 880, width: 450, duration: 4600, start: 8640, loopDelay: 5000, zIndex: 101 },
    ],
  },
  {
    id: "plankton-splat", title: "Plankton Splat",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/plankton-splat/thumbnail_72c641e8.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-17/plankton-splat/intro.png", loop: false, height: 880, width: 450, duration: 5900, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-17/plankton-splat/idle.png", loop: true, height: 880, width: 450, duration: 7760, start: 4350, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "ocean-flowers", title: "Ocean Flowers",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/ocean-flowers/thumbnail_fe6ab6db.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/ocean-flowers/intro.png", loop: false, height: 880, width: 450, duration: 3680, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/ocean-flowers/idle.png", loop: true, height: 880, width: 450, duration: 5840, start: 6840, loopDelay: 5000, zIndex: 101 },
    ],
  },
];

export interface ProfileEffectSource {
    assetPath?: string | null;
    assetKey?: string | null;
    skuId?: string | null;
    name?: string | null;
    label?: string | null;
    collectionName?: string | null;
}

export interface ResolvedProfileEffect {
    effect: ProfileEffectData | null;
    key: string;
    seed: number;
    exact: boolean;
}

const EFFECT_BY_ID = new Map(PROFILE_EFFECTS.map(effect => [ effect.id, effect ]));
const EFFECT_BY_TITLE = new Map(PROFILE_EFFECTS.map(effect => [ normalizeProfileEffectToken(effect.title), effect ]));
const EFFECT_TITLES_BY_LENGTH = [ ...EFFECT_BY_TITLE.keys() ].sort((a, b) => b.length - a.length);

const PROFILE_EFFECT_ALIASES: Record<string, string> = {
    'bubblegum-zombie-slime': 'zombie-slime',
    'infernal-dark-omens': 'dark-omens',
    'midnight-dark-omens': 'dark-omens',
    'blazing-ghoulish-graffiti': 'ghoulish-graffiti',
    'neon-ghoulish-graffiti': 'ghoulish-graffiti',
    'dark-ghoulish-graffiti': 'ghoulish-graffiti',
    'spooky-ghoulish-graffiti': 'ghoulish-graffiti',
    'cyberpunk-nightrunner': 'nightrunner',
    'cyberpunk-uplinkerror': 'uplink-error',
    'discord-os': 'discord-os',
    'deck-the-halls': 'deck-the-halls',
    'deck-the-halls-bundle': 'deck-the-halls',
};

const VARIANT_PREFIXES = [
    'bubblegum',
    'infernal',
    'midnight',
    'blazing',
    'neon',
    'spooky',
    'radiant',
    'golden',
    'silver',
    'crimson',
    'pastel',
    'electric',
    'cosmic',
];

export function normalizeProfileEffectToken(value: string | null | undefined) {
    return (value ?? '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/['’]/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}

function hashProfileEffectSeed(value: string) {
    let hash = 0;
    for(let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    return Math.abs(hash);
}

function getProfileEffectIdFromPath(assetPath: string | null | undefined) {
    if(!assetPath?.startsWith('profile_effect:')) return null;
    const id = assetPath.replace('profile_effect:', '');
    if(!id || id.startsWith('unmapped:')) return null;
    return normalizeProfileEffectToken(id);
}

function lookupProfileEffect(token: string | null | undefined) {
    const normalized = normalizeProfileEffectToken(token);
    if(!normalized) return null;

    const directAlias = PROFILE_EFFECT_ALIASES[normalized];
    if(directAlias && EFFECT_BY_ID.has(directAlias)) return { effect: EFFECT_BY_ID.get(directAlias)!, exact: false };

    if(EFFECT_BY_ID.has(normalized)) return { effect: EFFECT_BY_ID.get(normalized)!, exact: true };
    if(EFFECT_BY_TITLE.has(normalized)) return { effect: EFFECT_BY_TITLE.get(normalized)!, exact: true };

    const withoutBundle = normalized.replace(/-bundle$/, '');
    if(withoutBundle !== normalized) {
        const bundleMatch = lookupProfileEffect(withoutBundle);
        if(bundleMatch) return { ...bundleMatch, exact: false };
    }

    for(const prefix of VARIANT_PREFIXES) {
        if(!normalized.startsWith(`${ prefix }-`)) continue;
        const stripped = normalized.slice(prefix.length + 1);
        if(EFFECT_BY_ID.has(stripped)) return { effect: EFFECT_BY_ID.get(stripped)!, exact: false };
        if(EFFECT_BY_TITLE.has(stripped)) return { effect: EFFECT_BY_TITLE.get(stripped)!, exact: false };
    }

    const containedTitle = EFFECT_TITLES_BY_LENGTH.find(title => normalized.endsWith(title) || normalized.includes(`-${ title }-`));
    if(containedTitle) return { effect: EFFECT_BY_TITLE.get(containedTitle)!, exact: false };

    return null;
}

export function resolveProfileEffect(source: ProfileEffectSource | null | undefined): ResolvedProfileEffect | null {
    if(!source) return null;

    const candidates = [
        getProfileEffectIdFromPath(source.assetPath),
        source.name,
        source.label,
        source.assetKey?.replace(/^profile_effect:/, ''),
        source.collectionName,
        source.skuId,
    ];

    for(const candidate of candidates) {
        const match = lookupProfileEffect(candidate);
        if(match) {
            return {
                effect: match.effect,
                key: match.effect.id,
                seed: hashProfileEffectSeed(`${ match.effect.id }:${ source.assetKey ?? source.skuId ?? source.name ?? '' }`),
                exact: match.exact,
            };
        }
    }

    const fallbackKey = normalizeProfileEffectToken(source.name ?? source.assetKey ?? source.skuId ?? 'profile-effect');
    return {
        effect: null,
        key: fallbackKey || 'profile-effect',
        seed: hashProfileEffectSeed(`${ fallbackKey }:${ source.assetKey ?? source.skuId ?? '' }`),
        exact: false,
    };
}

export interface RoleBadge { label: string; color: string; bg: string; border: string }

export const ROLE_PRESETS: Record<string, RoleBadge> = {
    founder: { label: 'Gründer', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/20' },
    admin: { label: 'Admin', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20' },
    mod: { label: 'Moderator', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/20' },
    vip: { label: 'VIP', color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/20' },
    trader: { label: 'Trader', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' },
    builder: { label: 'Builder', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20' },
};
