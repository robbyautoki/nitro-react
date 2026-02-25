import { type Nameplate, type NameplateCollection } from "./types";

export const NAMEPLATE_COLLECTIONS: NameplateCollection[] = [
  {
    id: "nameplates_v1",
    name: "Nameplates Vol. 1",
    nameplates: [
      { name: "Cherry Blossoms", asset: "nameplates/nameplates/cherry_blossoms/", staticUrl: "https://cdn.discordapp.com/assets/content/7bb8e28111f5b9f6f142c9a9dc7b70336e74afca0ab9de4c035b35caf4305709", skuId: "1349849614102036581" },
      { name: "Cat Beans", asset: "nameplates/nameplates/cat_beans/", staticUrl: "https://cdn.discordapp.com/assets/content/ec9a65ca7f64b6f60b37fafe8aa1463844c88ea20c30cf00b4bb046dae8bad1f", skuId: "1349849614143979540" },
      { name: "Spirit of Spring", asset: "nameplates/nameplates/spirit_of_spring/", staticUrl: "https://cdn.discordapp.com/assets/content/2518ec9988c8e18924e45cf4aa04bb76ac2a0ec9cc537f8fa1d64838762c4ba7", skuId: "1349849614173339688" },
      { name: "Twilight", asset: "nameplates/nameplates/twilight/", staticUrl: "https://cdn.discordapp.com/assets/content/9dca6944384cca7076955807d58485d998e43a6a617351fbfd197b673d10b085", skuId: "1349849614198505602" },
      { name: "Koi Pond", asset: "nameplates/nameplates/koi_pond/", staticUrl: "https://cdn.discordapp.com/assets/content/5d5347f9700f53598c1400683b7b4d0e3e3bd20fda53a48b0ab7b3d055b876d4", skuId: "1349849614227865711" },
      { name: "Vengeance", asset: "nameplates/nameplates/vengeance/", staticUrl: "https://cdn.discordapp.com/assets/content/7363b0cd5e88ab7a6070fb705c8d73fac4026c5dafb038a9933537b54c752f99", skuId: "1349849614257225760" },
      { name: "Cityscape", asset: "nameplates/nameplates/cityscape/", staticUrl: "https://cdn.discordapp.com/assets/content/dd450a828fe1acb553f1d4bc460a653934deaaa65ea5618a786a21a9aa6db4c7", skuId: "1349849614286585866" },
      { name: "Angels", asset: "nameplates/nameplates/angels/", staticUrl: "https://cdn.discordapp.com/assets/content/c92ed0e84e22e579c808b59eb55adfb2573cefb789af3d730fe6dd5fdaa2ea45", skuId: "1349849614311751731" },
    ],
  },
  {
    id: "nameplates_v2",
    name: "Nameplates Vol. 2",
    nameplates: [
      { name: "Spirit Moon", asset: "nameplates/nameplates_v2/spirit_moon/", staticUrl: "https://cdn.discordapp.com/assets/content/4107faaaa052dd9bd9ee55c05ced157cce010a676e47c9424ebf58af9b9727e8", skuId: "1377377712028516443" },
      { name: "Pixie Dust", asset: "nameplates/nameplates_v2/pixie_dust/", staticUrl: "https://cdn.discordapp.com/assets/content/7045deabc78fda21e5f8fc3ad02cebf2138d0a76ca9438f36771304b9e98da75", skuId: "1377377712062074880" },
      { name: "Glitch", asset: "nameplates/nameplates_v2/glitch/", staticUrl: "https://cdn.discordapp.com/assets/content/b5a3f11fe3bca25af450c5295ab8b20c9edd65301018f8a41160b967e9969d49", skuId: "1377377712078848180" },
      { name: "Starfall Tides", asset: "nameplates/nameplates_v2/starfall_tides/", staticUrl: "https://cdn.discordapp.com/assets/content/50a2b9562b1022bb692ccdc73c0b3af003da18eba09b8455ac77129b01132cbc", skuId: "1377377712104018071" },
      { name: "Cozy Cat", asset: "nameplates/nameplates_v2/cozy_cat/", staticUrl: "https://cdn.discordapp.com/assets/content/1e6e4f81b85dfbb494351a264d16edd30af5de0f43fb9382e07332e2abac1f3e", skuId: "1377377712129179840" },
      { name: "Sword of Legend", asset: "nameplates/nameplates_v2/sword_of_legend/", staticUrl: "https://cdn.discordapp.com/assets/content/0965d407ce6bfd1aac833110e8895a3ec05a9e4a818416c2bfafa752772eef8e", skuId: "1377377712162738196" },
    ],
  },
  {
    id: "spell",
    name: "Magic: The Gathering",
    nameplates: [
      { name: "White Mana", asset: "nameplates/spell/white_mana/", staticUrl: "https://cdn.discordapp.com/assets/content/f9d4b19853e28921f48a07bbe5f6e8fa94908ecfbe6c910d16201171b5a3c9c3", skuId: "1379220459203072050" },
      { name: "Blue Mana", asset: "nameplates/spell/blue_mana/", staticUrl: "https://cdn.discordapp.com/assets/content/8ad8f985e5c67e271d7170b5c2d43dda7e7094c0c818e5167885608b2743d2c4", skuId: "1379220459224043560" },
      { name: "Black Mana", asset: "nameplates/spell/black_mana/", staticUrl: "https://cdn.discordapp.com/assets/content/8d27a35159791ef3d3c6807dbe628044d01ee3ce72cf72e19eb1305a0ca6b0ca", skuId: "1379220459245015123" },
      { name: "Red Mana", asset: "nameplates/spell/red_mana/", staticUrl: "https://cdn.discordapp.com/assets/content/b94323223a03318924135043f4849f0bbc7c52072b5d4523b499707dd9b54470", skuId: "1379220459265986670" },
      { name: "Green Mana", asset: "nameplates/spell/green_mana/", staticUrl: "https://cdn.discordapp.com/assets/content/9be0c80a746055bdf7bd14c70107347195deb53a8c2cca0a47af758cb45b6e77", skuId: "1379220459286958180" },
    ],
  },
  {
    id: "nameplates_v3",
    name: "Nameplates Vol. 3",
    nameplates: [
      { name: "Aurora", asset: "nameplates/nameplates_v3/aurora/", staticUrl: "https://cdn.discordapp.com/assets/content/2bafd26e344acdfa31f2dac9644656bbd4387aeadfda04e7019a73976bc3357c", skuId: "1382845914192023632" },
      { name: "Bonsai", asset: "nameplates/nameplates_v3/bonsai/", staticUrl: "https://cdn.discordapp.com/assets/content/a85e5c7ff67940294de864008b70c0e6abcf1c32f36472c7f5ea2ad7ad613126", skuId: "1382845914225442886" },
      { name: "Under the Sea", asset: "nameplates/nameplates_v3/under_the_sea/", staticUrl: "https://cdn.discordapp.com/assets/content/5a11efa8f86ce99b21f7d07b83c8d191fb42ab9a598ddbc06ddc999e4913115e", skuId: "1382845914246549535" },
      { name: "Sun and Moon", asset: "nameplates/nameplates_v3/sun_and_moon/", staticUrl: "https://cdn.discordapp.com/assets/content/4324b2d1701fd90b133b8fa48c7bce9c09f7f07aa378d1fdc12acce6ea144b20", skuId: "1382845914267521117" },
      { name: "Oasis", asset: "nameplates/nameplates_v3/oasis/", staticUrl: "https://cdn.discordapp.com/assets/content/146d54473c918792de467d3ca6cb2e4c5456ee2d908320f4a603a15134d5a770", skuId: "1382845914292686929" },
      { name: "Touch Grass", asset: "nameplates/nameplates_v3/touch_grass/", staticUrl: "https://cdn.discordapp.com/assets/content/75734e993b993286483731c7565fd517a26d9e6b05c3092f41ab809d90e74e53", skuId: "1382845914317852693" },
    ],
  },
  {
    id: "chance",
    name: "D&D",
    nameplates: [
      { name: "Red Dragon", asset: "nameplates/chance/red_dragon/", staticUrl: "https://cdn.discordapp.com/assets/content/14a8a6f94c7667fe4f935e8a6b1676da5fe9d94474ca75c12d15d6953f54653a", skuId: "1385035256058482798" },
      { name: "D20 Roll", asset: "nameplates/chance/d20_roll/", staticUrl: "https://cdn.discordapp.com/assets/content/cbfee2b5133858ab663388c4bbff8dc3f3e86829ef0068b5f549359dd78e6056", skuId: "1385035256083648542" },
      { name: "Owlbear Cub", asset: "nameplates/chance/owlbear_cub/", staticUrl: "https://cdn.discordapp.com/assets/content/87b34795b8b1453c70a25bc94198b2589ac9dcc48681a8b89082339438f4810d", skuId: "1385035256104620154" },
    ],
  },
  {
    id: "paper",
    name: "Skibidi Toilet",
    nameplates: [
      { name: "Skibidi Toilet", asset: "nameplates/paper/skibidi_toilet/", staticUrl: "https://cdn.discordapp.com/assets/content/558d3537ad49b6f1e3e3973fa9d4b8c133ff477a71d11fc8d4e9937bac4603cf", skuId: "1387888352686112819" },
      { name: "TV Woman", asset: "nameplates/paper/tv_woman/", staticUrl: "https://cdn.discordapp.com/assets/content/90543823fe527f00e3a7a2f271cd3373a487f508a5bb81e9b3c577ddfe6b3dc3", skuId: "1387888352711278602" },
      { name: "Secret Agent", asset: "nameplates/paper/secret_agent/", staticUrl: "https://cdn.discordapp.com/assets/content/79b31c59518bd57ec7e19da99708910bd90c6d9c73992c2d2cff5cb6db353409", skuId: "1387888352736313414" },
    ],
  },
  {
    id: "petal",
    name: "League of Legends",
    nameplates: [
      { name: "Spirit Blossom Petals", asset: "nameplates/petal/spirit_blossom_petals/", staticUrl: "https://cdn.discordapp.com/assets/content/9a7edd80a2705d4d0ca5151a0604089f8a042e07f2c1642de00db9bace8b4eb1", skuId: "1394404301295714355" },
      { name: "Yunara's Aion Erna", asset: "nameplates/petal/yunaras_aion_erna/", staticUrl: "https://cdn.discordapp.com/assets/content/dd7062c167e8c09f1f250ef0f476d182103bcdcba248e8db56653214cdd576ab", skuId: "1394404301354434671" },
      { name: "Spirit Blossom Springs", asset: "nameplates/petal/spirit_blossom_springs/", staticUrl: "https://cdn.discordapp.com/assets/content/7440ee605d3cdcc111055cae532c8b96a9a513a01364bdd296718c55f054a264", skuId: "1394404301396377710" },
    ],
  },
  {
    id: "rock",
    name: "Dragon Ball Z",
    nameplates: [
      { name: "Gomah", asset: "nameplates/rock/gomah/", staticUrl: "https://cdn.discordapp.com/assets/content/b206fe4aca2bca31411f02b0b799cf2b03355b16194d4a24b2692b0597807093", skuId: "1400163655399641249" },
      { name: "Mini Vegeta", asset: "nameplates/rock/mini_vegeta/", staticUrl: "https://cdn.discordapp.com/assets/content/e9012ddda23cd4c944d0d12601341995ded4a8eae6cf63a3b71646502b99793b", skuId: "1400163655424933978" },
      { name: "Mini Goku", asset: "nameplates/rock/mini_goku/", staticUrl: "https://cdn.discordapp.com/assets/content/5e39c59a33b13ef83f38383a4243b6a48a1af4b7490abf14df7e42c93c464c68", skuId: "1400163655462555658" },
      { name: "Dragon Ball", asset: "nameplates/rock/dragon_ball/", staticUrl: "https://cdn.discordapp.com/assets/content/c5ea1aee47bafef32e8b736879d81a17659c3867b5fdd90c174b079a475b8e37", videoUrl: "https://cdn.discordapp.com/assets/content/c5e3e7845d9b39fc8cda625f76c519ac4dc0025998c840fa85136b6e1c66f328", label: "A glowing Dragon Ball hovers the nameplate.", palette: "crimson", skuId: "1400163655487848501" },
    ],
  },
  {
    id: "lunar_eclipse",
    name: "Lunar Eclipse",
    nameplates: [
      { name: "Moonlit Charm", asset: "nameplates/lunar_eclipse/moonlit_charm/", staticUrl: "https://cdn.discordapp.com/assets/content/8eaf18bf6586271d4a4cc9d2393db6e5e414fc26f8a696709fec36b5f77c7598", skuId: "1409898407920668782" },
      { name: "Luna Moth", asset: "nameplates/lunar_eclipse/luna_moth/", staticUrl: "https://cdn.discordapp.com/assets/content/278eb5a98ec1f48d7ebbb14e29af7f6892477de175dce462fcb64619c1c045c8", skuId: "1409898407945834558" },
      { name: "Moon Essence", asset: "nameplates/lunar_eclipse/moon_essence/", staticUrl: "https://cdn.discordapp.com/assets/content/70efaa9361084d5337fc08d950ad49a722e5fd26b1a30256d4897698c16c92c1", skuId: "1409898407971127427" },
    ],
  },
  {
    id: "box",
    name: "Borderlands",
    nameplates: [
      { name: "Claptrap", asset: "nameplates/box/claptrap/", staticUrl: "https://cdn.discordapp.com/assets/content/04cdf5faca530fe74e886a634fb0da40ee253d9b1ebf777f0f4b1522d4ed964d", skuId: "1412514944766967908" },
      { name: "Ripper Awakens", asset: "nameplates/box/ripper_awakens/", staticUrl: "https://cdn.discordapp.com/assets/content/acf200c4309b8bc6532e327cd64a37a9ce255cce23fc76bb6e6486a86402a82d", skuId: "1412514944787808507" },
      { name: "Shattered Veil", asset: "nameplates/box/shattered_veil/", staticUrl: "https://cdn.discordapp.com/assets/content/777c9aaa036d44641447e296b36a60a4951209a0edc5d6fbad674e83443d31bf", skuId: "1412514944817168587" },
      { name: "Vault", asset: "nameplates/box/vault/", staticUrl: "https://cdn.discordapp.com/assets/content/ac1e3a413b7c4bf2da3ee674c4c89b8eb8eb538d7a81e72d5fc70a45ed2c9ff1", skuId: "1412514944846528584" },
    ],
  },
  {
    id: "nameplate_bonanza",
    name: "Nameplate Bonanza",
    nameplates: [
      { name: "Berry Bunny", asset: "nameplates/nameplate_bonanza/berry_bunny/", staticUrl: "https://cdn.discordapp.com/assets/content/66bf82507c1c9339cbda773a9baa30dd50eecb44a33b9e78ba6cdb908747a6a9", skuId: "1417311919429128312" },
      { name: "The Same Duck", asset: "nameplates/nameplate_bonanza/the_same_duck/", staticUrl: "https://cdn.discordapp.com/assets/content/20ac97c99a18ad8129c908899a14c52659cb2a50d02d04d59aa8117f6dbbdae1", skuId: "1417311919454425269" },
      { name: "Starfall Tides Nightshade", asset: "nameplates/nameplate_bonanza/starfall_tides_nightshade/", staticUrl: "https://cdn.discordapp.com/assets/content/5412db78d079ac237ffb6434ec3ef85aaad8b02a8dce8689b9c8d08404ba995e", skuId: "1417311919378796554" },
      { name: "Starfall Tides Rose", asset: "nameplates/nameplate_bonanza/starfall_tides_rose/", staticUrl: "https://cdn.discordapp.com/assets/content/2ba8b592cd38a7d42c95c42cb94e31cb09093d88928628deafda00f04ba972ed", skuId: "1417311919513014323" },
      { name: "Starfall Tides Void", asset: "nameplates/nameplate_bonanza/starfall_tides_void/", staticUrl: "https://cdn.discordapp.com/assets/content/d33b6e89108a9bf15677949fbc7171eb60c0605a1ef66b5c6a2c00318620bcfd", skuId: "1417311919487848619" },
      { name: "Starlight Whales", asset: "nameplates/nameplate_bonanza/starlight_whales/", staticUrl: "https://cdn.discordapp.com/assets/content/dea5ae716bb3ea160cf2ff4d09be9d7048b2c226a5c2e5d1b44637d52d4b5a9b", skuId: "1417311919555215471" },
      { name: "Bloomling", asset: "nameplates/nameplate_bonanza/bloomling/", staticUrl: "https://cdn.discordapp.com/assets/content/98d6a6ebff33885a42fbb306ec2bc3e66f269aae49ce43c622f951427e928558", skuId: "1417311919576055949" },
      { name: "Sproutling", asset: "nameplates/nameplate_bonanza/sproutling/", staticUrl: "https://cdn.discordapp.com/assets/content/c77836198b6e56dedf65f362730a815d528aa0fc2ba73982f8a3dff26bf10236", skuId: "1417311919601221703" },
      { name: "Twilight Fuchsia", asset: "nameplates/nameplate_bonanza/twilight_fuchsia/", staticUrl: "https://cdn.discordapp.com/assets/content/ad8ac0d1890c7e523a9c11065842f6d11532b0522ec0a40799e4c9b2c8b54102", skuId: "1417311919399895081" },
      { name: "Twilight Dusk", asset: "nameplates/nameplate_bonanza/twilight_dusk/", staticUrl: "https://cdn.discordapp.com/assets/content/17fad0a2f9617b5f19c1eaf49673a1b34aaa4331ae5cac5e5538cdd11d8555e2", skuId: "1417311919643299840" },
      { name: "Cosmic Storm", asset: "nameplates/nameplate_bonanza/cosmic_storm/", staticUrl: "https://cdn.discordapp.com/assets/content/87f2945d17483fc6a6ca6084fa8ead2656b5a65d46197ad6258e6aa3fec74b17", skuId: "1417311919664005231" },
      { name: "Planet Rings", asset: "nameplates/nameplate_bonanza/planet_rings/", staticUrl: "https://cdn.discordapp.com/assets/content/49e4d9358eba7c72dc038a2187dd8e462c2bbae49b83710c5bbf651691f237fa", skuId: "1417311919689170984" },
      { name: "Fairies", asset: "nameplates/nameplate_bonanza/fairies/", staticUrl: "https://cdn.discordapp.com/assets/content/3fbd20d904824ba88a29344244774da035f6d97ff5a26bbf2249fc707a3f1158", skuId: "1417311919714336808" },
      { name: "Firefly Meadow", asset: "nameplates/nameplate_bonanza/firefly_meadow/", staticUrl: "https://cdn.discordapp.com/assets/content/64dcea3d7ebb24e8bfd1738ebf8ded13ca21f62b7371a459d61f2d6175452e04", skuId: "1417311919735308399" },
      { name: "Magic Hearts Blue", asset: "nameplates/nameplate_bonanza/magic_hearts_blue/", staticUrl: "https://cdn.discordapp.com/assets/content/bd602714e97baf6a77294496012f2d6c4d660b5e9307d6975720c04f764352d2", skuId: "1417311919412347021" },
      { name: "Magic Hearts Orange", asset: "nameplates/nameplate_bonanza/magic_hearts_orange/", staticUrl: "https://cdn.discordapp.com/assets/content/66d4591a36a75544dc388714d3c85c63f875c9853b8161d7fc88dada328d8fa3", skuId: "1417311919760474112" },
    ],
  },
  {
    id: "woodland_friends",
    name: "Woodland Friends",
    nameplates: [
      { name: "Autumn Breeze", asset: "nameplates/woodland_friends/autumn_breeze/", staticUrl: "https://cdn.discordapp.com/assets/content/f6251bc6478e707af1372fba6be5231720fe94291b9607e3704ee21d23a593f3", skuId: "1420045363141672971" },
      { name: "Petal Bloom", asset: "nameplates/woodland_friends/petal_bloom/", staticUrl: "https://cdn.discordapp.com/assets/content/33f2e6bcd2ea19ecd7b8f7cb93b2d44cc4b2069c369c62c2c3170c2b0ea9140e", skuId: "1420045363171033128" },
      { name: "Hoppy Bois Perch", asset: "nameplates/woodland_friends/hoppy_bois_perch/", staticUrl: "https://cdn.discordapp.com/assets/content/e4edc7b8ce1f97161b9deed9edf94541ef9d271cd8ac5e52b7a4245796197abf", skuId: "1420045363196199065" },
    ],
  },
  {
    id: "its_showtime",
    name: "It's Showtime",
    nameplates: [
      { name: "Encore Orange", asset: "nameplates/its_showtime/encore_orange/", staticUrl: "https://cdn.discordapp.com/assets/content/9ca7fe258d7bc05ecd2c8cd488b01343f9421b51a1f3db7b80907eccb268b146", skuId: "1420225379284553810" },
      { name: "Encore Teal", asset: "nameplates/its_showtime/encore_teal/", staticUrl: "https://cdn.discordapp.com/assets/content/2c04b1cebd188e8ff5deabb9ff78a6bc4e6db6d2bdad808cb4d280384a3a17b2", skuId: "1420225379293204593" },
    ],
  },
  {
    id: "trick_or_treat",
    name: "Trick or Treat",
    nameplates: [
      { name: "Pile of Bones (Trick)", asset: "nameplates/trick_or_treat/pile_of_bones_trick/", staticUrl: "https://cdn.discordapp.com/assets/content/e645466fdb42ebc29594f5ac54394edf82c7a0270547be0e6dd54402cc0b9d48", skuId: "1420057111697821756" },
      { name: "Pile of Bones (Treat)", asset: "nameplates/trick_or_treat/pile_of_bones_treat/", staticUrl: "https://cdn.discordapp.com/assets/content/aaae0d6955d4d0330ff008a79baccd5ede4cacc9766113152a0eff7d1c703e75", skuId: "1420057111701885028" },
      { name: "Ms. Spider (Trick)", asset: "nameplates/trick_or_treat/ms_spider_trick/", staticUrl: "https://cdn.discordapp.com/assets/content/a98309ee3da455a843053dff388ff4d52c2a7667035616dfa76924ed03d48a7a", skuId: "1420057111718531112" },
      { name: "Ms. Spider (Treat)", asset: "nameplates/trick_or_treat/ms_spider_treat/", staticUrl: "https://cdn.discordapp.com/assets/content/1f7298ea1a215c5e7f6e427ef7ab2ac395909027d963671559ca2c23e9ac83bf", skuId: "1420057111722856628" },
      { name: "I'm Watching Yooooou (Trick)", asset: "nameplates/trick_or_treat/im_watching_yooooou_trick/", staticUrl: "https://cdn.discordapp.com/assets/content/5b7e46ed869e45684af79a26226e525886176276bd17b818a21b30854297e375", skuId: "1420057111739502663" },
      { name: "I'm Watching Yooooou (Treat)", asset: "nameplates/trick_or_treat/im_watching_yooooou_treat/", staticUrl: "https://cdn.discordapp.com/assets/content/4f589eea4943209b475aa26fe9fc5768ba8d2a46bf5f44a3b439d715902ffa26", skuId: "1420057111748022303" },
    ],
  },
  {
    id: "orb",
    name: "Orb",
    nameplates: [
      { name: "Infinite Swirl", asset: "nameplates/orb/infinite_swirl/", staticUrl: "https://cdn.discordapp.com/assets/content/8d565e555a23a0ad7c18ef48079479162ada007b6785e5e8a529b1bb263fd102", videoUrl: "https://cdn.discordapp.com/assets/content/8e29a81937dcaeb5e0b195f9b62d406998cfe31e30c07f39b7c49b112231335b", label: "Glowing purple and cyan rings spiral and pulse across the nameplate with a soft glow.", palette: "violet", skuId: "1427463138646954035" },
      { name: "Magical Mist", asset: "nameplates/orb/magical_mist/", staticUrl: "https://cdn.discordapp.com/assets/content/dda22cbf6e3696da45ce42fdeee261d0fb03e8438e994a6506ccc4942dcb3beb", videoUrl: "https://cdn.discordapp.com/assets/content/5719f0e26a109ef3ce3b3ecf2ccf5003f1057d2f5cbbdbc457ba25343c09d749", label: "Blue and cyan mists flow gently across the nameplate with a soft ethereal glow.", palette: "cobalt", skuId: "1427463138646954036" },
    ],
  },
  {
    id: "plastic",
    name: "Jujutsu Kaisen",
    nameplates: [
      { name: "Yuji Itadori", asset: "nameplates/plastic/yuji_itadori/", staticUrl: "https://cdn.discordapp.com/assets/content/dcd20573ebb59ce5f9bf5647fb57c82fe55e9bda4db84750553d0b83a8f7a054", videoUrl: "https://cdn.discordapp.com/assets/content/5050c625036c997b5426c21ea78e585653a8f21e2c70ffd0bcfab485e530f2b3", label: "Crimson red and black flowing patterns of cursed energy dance across the red nameplate", palette: "crimson", skuId: "1428438925021548544" },
      { name: "Satoru Gojo", asset: "nameplates/plastic/satoru_gojo/", staticUrl: "https://cdn.discordapp.com/assets/content/a325058b82ad601e77865e1deb92f7fa6d8049ba8d924442f93c4176d2635d7a", videoUrl: "https://cdn.discordapp.com/assets/content/97d86485f812ba7758f0fde9320a9c27d62a8b1692c3dfa87eb66d8fb8f4ef6d", label: "Satoru Gojo's glowing blue eye and hand gesture with white spherical cursed energy surrounding the blue nameplate", palette: "cobalt", skuId: "1428438925046714408" },
      { name: "Ryomen Sukuna", asset: "nameplates/plastic/ryomen_sukuna/", staticUrl: "https://cdn.discordapp.com/assets/content/77c5aa174d8e9fda759d5ce383668cb21a9b419fb27f8ce55299c29a8013f427", videoUrl: "https://cdn.discordapp.com/assets/content/5a6a04d9ed8b5a31c80d91e6bb628d47417920cfb7567ff20764ec5eed6a3166", label: "Red and yellow cursed energy tendrils and flowing black slashes surrounding a red nameplate.", palette: "crimson", skuId: "1428438925067817093" },
    ],
  },
  {
    id: "straw",
    name: "Call of Duty",
    nameplates: [
      { name: "Camo Master", asset: "nameplates/straw/camo_master/", staticUrl: "https://cdn.discordapp.com/assets/content/ad5f4e649b5cbb456c68989ede497c539e908b531c919e584cf58299b478c41e", videoUrl: "https://cdn.discordapp.com/assets/content/06343ef776b710cf13bcb5ed9fc2d6b177415e5df4aeef0659b17fa39b55d2fc", label: "Purple-toned nameplate with camouflage pattern background.", palette: "violet", skuId: "1436367668922941471" },
      { name: "Squad Wipe", asset: "nameplates/straw/squad_wipe/", staticUrl: "https://cdn.discordapp.com/assets/content/e29267d943d2a303a54a7751a39e1995993222f5d668e9f3ef4fe0ca65c1e135", videoUrl: "https://cdn.discordapp.com/assets/content/4d2e225645e7456cb70f6cc2d428ecc0d551cb723aff474ce24a36972bd00114", label: "Teal-accented nameplate with covert operations theme.", palette: "teal", skuId: "1436367668943913131" },
      { name: "Bye Bye", asset: "nameplates/straw/bye_bye/", staticUrl: "https://cdn.discordapp.com/assets/content/d54d5d9ecaedce2ab29cbce2085f2a21b8b9a775156461a4f2d278788a11ef4f", videoUrl: "https://cdn.discordapp.com/assets/content/0690b4eae2b81b9cea835beab78b2081d816364a59bbebde76329425b9904577", label: "Dark purple nameplate featuring creepy toy monkey imagery.", palette: "violet", skuId: "1436367668964884690" },
      { name: "2035", asset: "nameplates/straw/2035/", staticUrl: "https://cdn.discordapp.com/assets/content/372cbbe032fc74393e074c0c50f3a8f136e2e6e38b16a162800a7c6298c497f5", videoUrl: "https://cdn.discordapp.com/assets/content/cf0f27b19f0609f7c342e5852ec198b5d4232adae31b5dff1d89d556220186cb", label: "Blue and orange data stream nameplate with digital interference pattern.", palette: "cobalt", skuId: "1436367668990050304" },
      { name: "Fluttering Static", asset: "nameplates/straw/fluttering_static/", staticUrl: "https://cdn.discordapp.com/assets/content/30a28c5debf07cdb0b707bcfc4efa5b9ccbf71fdab986314f5f01530a9cf4145", videoUrl: "https://cdn.discordapp.com/assets/content/9c4b9ccfb8629473202b9d9670de75d1f6f16edf7168f22f4c45f831322df10c", label: "Red digital corruption effect nameplate with butterfly motif.", palette: "crimson", skuId: "1436367669031993384" },
    ],
  },
  {
    id: "peanut",
    name: "Tron",
    nameplates: [
      { name: "Light Wall Red", asset: "nameplates/peanut/light_wall_red/", staticUrl: "https://cdn.discordapp.com/assets/content/6533fa3a790d34a29d033227fdc7a0b8be78c1e9fa58e250c729a96527eb4420", skuId: "1437881613903069387" },
      { name: "Light Wall Blue", asset: "nameplates/peanut/light_wall_blue/", staticUrl: "https://cdn.discordapp.com/assets/content/6d36e4fa30bfed3988c1e93179d14d676d54b9e4bd5bbc84659463aff699e11d", skuId: "1437881614159056979" },
      { name: "The Grid Fireworks", asset: "nameplates/peanut/the_grid_fireworks/", staticUrl: "https://cdn.discordapp.com/assets/content/a10553a65c359ab5583bd28dd6bbc6979ab3d4524d6352aa769aa3bc20b25d9c", skuId: "1437881614180028526" },
      { name: "Encom Grid", asset: "nameplates/peanut/encom_grid/", staticUrl: "https://cdn.discordapp.com/assets/content/2d1db65f49cd5bd6c07b06868262c5a4b38eb83df9d6cf0cac7bbf79a746901f", skuId: "1437881614205194352" },
    ],
  },
  {
    id: "10_days_of_discord",
    name: "10 Days of Discord",
    nameplates: [
      { name: "Arctic Winter Frost", asset: "nameplates/10_days_of_discord/arctic_winter_frost/", staticUrl: "https://cdn.discordapp.com/assets/content/070926d48292af56505a3511a9755d09ffd3c08de74d1befb0e47cfa4836942d", skuId: "1440063059803766824" },
      { name: "Aurora Winter Fox", asset: "nameplates/10_days_of_discord/aurora_winter_fox/", staticUrl: "https://cdn.discordapp.com/assets/content/c43b67d55f5eaab7b6bbe80c3e4f1534eee3eb5c771e1d3be4faafb2dd1355d1", skuId: "1440063059862487193" },
    ],
  },
  {
    id: "cosmos",
    name: "Cosmos",
    nameplates: [
      { name: "Cosmic Twilight Flow Amethyst", asset: "nameplates/cosmos/cosmic_twilight_flow_amethyst/", staticUrl: "https://cdn.discordapp.com/assets/content/d1ebd0c5e7e4a270d5c0131c7387acbdf63dcb9433c66748b9893c966882ae75", skuId: "1432550258357043320" },
      { name: "Cosmic Twilight Flow Beryl", asset: "nameplates/cosmos/cosmic_twilight_flow_beryl/", staticUrl: "https://cdn.discordapp.com/assets/content/3093dae5b294084950d68119a6b6a6d43064f4d0d33cc581cb8d655c94e4e426", skuId: "1432550258365435934" },
    ],
  },
  {
    id: "gargamel",
    name: "Avatar",
    nameplates: [
      { name: "Woodsprite", asset: "nameplates/gargamel/woodsprite/", staticUrl: "https://cdn.discordapp.com/assets/content/615d98113610c1453393ee7dce16a3d94bc0d2c3faf9e0a0c87d51a302f0c89f", skuId: "1447609133011304529" },
      { name: "Pandoran Seas Squid", asset: "nameplates/gargamel/pandoran_seas_squid/", staticUrl: "https://cdn.discordapp.com/assets/content/ffd2e806367a907aabd2e1e4d0e82b01c21d9a6897745c3f42d3d20cc9b78d51", skuId: "1447609132793200733" },
      { name: "Pandoran Seas Ilu", asset: "nameplates/gargamel/pandoran_seas_ilu/", staticUrl: "https://cdn.discordapp.com/assets/content/054a08d3ac739dd6d40e2ee3efc250a06dc0bdc9f04bd25954278134a678316e", skuId: "1447609132801593527" },
    ],
  },
  {
    id: "zodiac",
    name: "Zodiac",
    nameplates: [
      { name: "Aries", asset: "nameplates/zodiac/aries/", staticUrl: "https://cdn.discordapp.com/assets/content/5d0ee9da196589c478f225f3fb9d00809eed22e754f3035737100439dd52a42d", skuId: "1447654090661302343" },
      { name: "Taurus", asset: "nameplates/zodiac/taurus/", staticUrl: "https://cdn.discordapp.com/assets/content/60fec8f4ae4f2f868439c79ebaefdf385b18c0f513317a5fecbb1079a90533aa", skuId: "1447654090736799915" },
      { name: "Gemini", asset: "nameplates/zodiac/gemini/", staticUrl: "https://cdn.discordapp.com/assets/content/0967a7bb65264f9bc1660c6cd689ecea49198ce2ab09f487db2bc53844002f4e", skuId: "1447654090816491530" },
      { name: "Cancer", asset: "nameplates/zodiac/cancer/", staticUrl: "https://cdn.discordapp.com/assets/content/6b733794665e90566526181bc35cb96d4ea34d86ea71338cdc09c0be8b6ad0a4", skuId: "1447654090921349235" },
      { name: "Leo", asset: "nameplates/zodiac/leo/", staticUrl: "https://cdn.discordapp.com/assets/content/4c048e42ae5cef65a6af30fc727a7250096f15879720b4eef9bce17012fb0a7c", skuId: "1447654091026206894" },
      { name: "Virgo", asset: "nameplates/zodiac/virgo/", staticUrl: "https://cdn.discordapp.com/assets/content/49856ecc7266ace3d00c0ae74c5cf6c38b46c28f9a3bfa1e34c4f39755842509", skuId: "1447654091097509950" },
      { name: "Libra", asset: "nameplates/zodiac/libra/", staticUrl: "https://cdn.discordapp.com/assets/content/1887c16571487cb585ac1d0d9c25963900b073f3a3a2437e982797c45eda742b", skuId: "1447654091173007401" },
      { name: "Scorpio", asset: "nameplates/zodiac/scorpio/", staticUrl: "https://cdn.discordapp.com/assets/content/d9e0601a700c2315964f3811e7ff7095c7662820277d264441254f0c8e891d03", skuId: "1447654091240116366" },
      { name: "Sagittarius", asset: "nameplates/zodiac/sagittarius/", staticUrl: "https://cdn.discordapp.com/assets/content/a4ceaad4148a385340058a8b57282d4c059f4a9e0d3d5b422a02277950098ed0", skuId: "1447654091311419392" },
      { name: "Capricorn", asset: "nameplates/zodiac/capricorn/", staticUrl: "https://cdn.discordapp.com/assets/content/bfb8007ed8eb0893fcc551d55f1ead9f2fc330d650f37919c438411a40ffae5a", skuId: "1447654091390980227" },
      { name: "Aquarius", asset: "nameplates/zodiac/aquarius/", staticUrl: "https://cdn.discordapp.com/assets/content/696ff4d5ba4a6dd0f0782cef7e47cc63d2c5ace576106ccf6878cc63103ec6bf", skuId: "1447654091470802965" },
      { name: "Pisces", asset: "nameplates/zodiac/pisces/", staticUrl: "https://cdn.discordapp.com/assets/content/aaf61c53c00a58e8e52bad182316ba47225bf8c28ff8b7b69311874a231d584a", skuId: "1447654091575660544" },
    ],
  },
  {
    id: "slumber_party",
    name: "Slumber Party",
    nameplates: [
      { name: "Dream Waves", asset: "nameplates/slumber_party/dream_waves/", staticUrl: "https://cdn.discordapp.com/assets/content/ba4c8fb6d6344a7cc67a16a4fb672b4f7b48037124a6f80f1507e86918f2fee7", skuId: "1458483484598337682" },
      { name: "Moon Bloom", asset: "nameplates/slumber_party/moon_bloom/", staticUrl: "https://cdn.discordapp.com/assets/content/20972be875fec68b6a1b7e0499f84631b6bc9a4030d50f2165a24be9479b532d", skuId: "1458472704524156959" },
      { name: "Star Drift", asset: "nameplates/slumber_party/star_drift/", staticUrl: "https://cdn.discordapp.com/assets/content/2eb273ddb2914a6b948f500ec13a1bac9c7f670e9f2a9e5f39455756ead4bf94", skuId: "1458472704557584465" },
    ],
  },
  {
    id: "tarot",
    name: "Tarot",
    nameplates: [
      { name: "Sunlit Radiance", asset: "nameplates/tarot/sunlit_radiance/", staticUrl: "https://cdn.discordapp.com/assets/content/13a3f68c9499ce0731720910fa6ecd5dc19ba20b511b1e3735a591fd002f529d", skuId: "1461062060229132369" },
      { name: "Hermit's Lantern", asset: "nameplates/tarot/hermits_lantern/", staticUrl: "https://cdn.discordapp.com/assets/content/a044aefd1f340b026c5317298d1e4bfea232c48a236a4725268802b4d1445c0b", skuId: "1461062060254298326" },
      { name: "Tower's Strike", asset: "nameplates/tarot/towers_strike/", staticUrl: "https://cdn.discordapp.com/assets/content/62676bb38238fd7ebf77d199410ddf3b3e7cf6a3ae5480f183f593b4fe3f4fb8", skuId: "1461062060279464048" },
      { name: "Manifesting Magic", asset: "nameplates/tarot/manifesting_magic/", staticUrl: "https://cdn.discordapp.com/assets/content/7543245a475af2e803b15949539167c8dd4425186873b1824b4c067666073e1c", skuId: "1461062060300435722" },
    ],
  },
  {
    id: "gothica",
    name: "Gothica",
    nameplates: [
      { name: "Dark Roses", asset: "nameplates/gothica/dark_roses/", staticUrl: "https://cdn.discordapp.com/assets/content/d0b2f5ae03e06c46aa49a8265faeb4ea7649bd041e1138db36e15562a11b73ae", skuId: "1462116614077022469" },
      { name: "Gothic Arches", asset: "nameplates/gothica/gothic_arches/", staticUrl: "https://cdn.discordapp.com/assets/content/c640d7f110b65affe6f4f58232567a6389e3c37ccdd62fac3e55a62366c89e59", skuId: "1462116614106382346" },
      { name: "Nevermore", asset: "nameplates/gothica/nevermore/", staticUrl: "https://cdn.discordapp.com/assets/content/15cb9a18fb5fecfa9fb8c2184a6953afb599568990d80251356c718b6326bfc1", skuId: "1462116614131548265" },
    ],
  },
  {
    id: "love_xp",
    name: "Love XP",
    nameplates: [
      { name: "Love Meter", asset: "nameplates/love_xp/love_meter/", staticUrl: "https://cdn.discordapp.com/assets/content/d931cbac322eb0c1f1369a485cf3bcd4480f8bc7c0b5c3037346d46cbb9f4476", skuId: "1459194821372805192" },
      { name: "Mischief Meter", asset: "nameplates/love_xp/mischief_meter/", staticUrl: "https://cdn.discordapp.com/assets/content/7c559452f22795ff0a360c21cd8bf3ad195999998ba38592fc2a16cebe33af2f", skuId: "1459194821397971065" },
      { name: "Hunny Bunnies", asset: "nameplates/love_xp/hunny_bunnies/", staticUrl: "https://cdn.discordapp.com/assets/content/3b4f82929af6ce605e4b8f3ef7a46bbd067a2ded22112be6630be5c8b0d040b0", skuId: "1459194821427331220" },
      { name: "Lone Wolf", asset: "nameplates/love_xp/lone_wolf/", staticUrl: "https://cdn.discordapp.com/assets/content/9f879264f960988758f025f671311b9557d093287c91c65fab88997706302f32", skuId: "1459194821456691393" },
      { name: "Cutesy Bow", asset: "nameplates/love_xp/cutesy_bow/", staticUrl: "https://cdn.discordapp.com/assets/content/64c28add641384d891250ae93b57d08e8b2efb04b3ef6e9e854334f539110878", skuId: "1459194821490245734" },
      { name: "Lil Stinker", asset: "nameplates/love_xp/lil_stinker/", staticUrl: "https://cdn.discordapp.com/assets/content/3042214dfe6e376c35ba968650ade16726c6804b2f027a58a44ce17266d80966", skuId: "1459194821519605784" },
    ],
  },
  {
    id: "newest",
    name: "Neueste",
    nameplates: [
      { name: "Crimson Stallion", asset: "nameplates/crimson_stallion/", staticUrl: "https://cdn.discordapp.com/media/v1/collectibles-shop/1465519264755617887/static", skuId: "1465519264755617887" },
      { name: "Blossoming Branch", asset: "nameplates/blossoming_branch/", staticUrl: "https://cdn.discordapp.com/media/v1/collectibles-shop/1465519580016410746/static", skuId: "1465519580016410746" },
      { name: "Lotus Lanterns", asset: "nameplates/lotus_lanterns/", staticUrl: "https://cdn.discordapp.com/media/v1/collectibles-shop/1465519789958234259/static", skuId: "1465519789958234259" },
      { name: "Hot Dog", asset: "nameplates/hot_dog/", staticUrl: "https://cdn.discordapp.com/media/v1/collectibles-shop/1469125811671142563/static", skuId: "1469126030559023146" },
      { name: "Go Sports!", asset: "nameplates/go_sports!/", staticUrl: "https://cdn.discordapp.com/media/v1/collectibles-shop/1469125797351657657/static", skuId: "1469125797351657657" },
    ],
  },
];
