(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/lib/extension.js
  function isExtensionAlive() {
    try {
      return Boolean(chrome?.runtime?.id);
    } catch {
      return false;
    }
  }
  async function safeStorageGet(keys) {
    if (!isExtensionAlive()) return {};
    try {
      return await chrome.storage.local.get(keys);
    } catch (err) {
      if (/context invalidated/i.test(String(err?.message || err))) return {};
      throw err;
    }
  }
  async function safeStorageSet(values) {
    if (!isExtensionAlive()) return false;
    try {
      await chrome.storage.local.set(values);
      return true;
    } catch (err) {
      if (/context invalidated/i.test(String(err?.message || err))) return false;
      throw err;
    }
  }
  function safeSendMessage(message) {
    return new Promise((resolve) => {
      if (!isExtensionAlive()) {
        resolve({ ok: false, reason: "context_invalidated" });
        return;
      }
      try {
        chrome.runtime.sendMessage(message, (res) => {
          if (chrome.runtime.lastError) {
            resolve({
              ok: false,
              error: chrome.runtime.lastError.message
            });
            return;
          }
          resolve(res || { ok: false });
        });
      } catch (err) {
        resolve({
          ok: false,
          error: err?.message || String(err)
        });
      }
    });
  }

  // src/lib/storage.js
  var LIBRARY_KEY = "library";
  var AUTH_META_KEY = "authMeta";
  var DIRTY_KEY = "libraryDirty";
  function emptyLibrary() {
    return { folders: [], channels: {}, updatedAt: 0 };
  }
  async function getLibrary() {
    const data = await safeStorageGet(LIBRARY_KEY);
    const lib = data[LIBRARY_KEY];
    if (!lib || typeof lib !== "object") return emptyLibrary();
    return {
      folders: Array.isArray(lib.folders) ? lib.folders : [],
      channels: lib.channels && typeof lib.channels === "object" ? lib.channels : {},
      updatedAt: lib.updatedAt || 0
    };
  }
  async function setLibrary(library, { dirty = true } = {}) {
    const next = {
      folders: library.folders || [],
      channels: library.channels || {},
      updatedAt: library.updatedAt || Date.now()
    };
    await safeStorageSet({
      [LIBRARY_KEY]: next,
      [DIRTY_KEY]: dirty
    });
    return next;
  }
  async function getAuthMeta() {
    const data = await safeStorageGet(AUTH_META_KEY);
    return data[AUTH_META_KEY] || null;
  }
  function createId() {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
  async function createFolder({ name, icon, color }) {
    const lib = await getLibrary();
    const folder = {
      id: createId(),
      name: (name || "New folder").trim() || "New folder",
      icon: icon || "Folder",
      color: color || "#e11d2e",
      channelIds: []
    };
    lib.folders.push(folder);
    await setLibrary(lib);
    return folder;
  }
  async function updateFolder(folderId, patch) {
    const lib = await getLibrary();
    const idx = lib.folders.findIndex((f) => f.id === folderId);
    if (idx === -1) throw new Error("Folder not found");
    lib.folders[idx] = { ...lib.folders[idx], ...patch, id: folderId };
    await setLibrary(lib);
    return lib.folders[idx];
  }
  async function deleteFolder(folderId) {
    const lib = await getLibrary();
    lib.folders = lib.folders.filter((f) => f.id !== folderId);
    await setLibrary(lib);
  }
  async function setChannelFolders(channel, folderIds) {
    const lib = await getLibrary();
    const id = channel.id;
    const aliases = new Set(
      [id, channel.handle, channel.ucId].filter(Boolean)
    );
    lib.channels[id] = {
      id,
      name: channel.name || lib.channels[id]?.name || "Channel",
      handle: channel.handle || lib.channels[id]?.handle || "",
      avatarUrl: channel.avatarUrl || lib.channels[id]?.avatarUrl || ""
    };
    const selected = new Set(folderIds);
    for (const folder of lib.folders) {
      const has = (folder.channelIds || []).some((cid) => aliases.has(cid));
      folder.channelIds = (folder.channelIds || []).filter((cid) => !aliases.has(cid));
      if (selected.has(folder.id)) folder.channelIds.push(id);
      else if (has && !selected.has(folder.id)) {
      }
    }
    await setLibrary(lib);
    return lib;
  }
  async function moveChannelToFolder(channelId, fromFolderId, toFolderId) {
    if (!channelId || !toFolderId || fromFolderId === toFolderId) return getLibrary();
    const lib = await getLibrary();
    const from = lib.folders.find((f) => f.id === fromFolderId);
    const to = lib.folders.find((f) => f.id === toFolderId);
    if (!to) throw new Error("Target folder not found");
    if (from) {
      from.channelIds = (from.channelIds || []).filter((id) => id !== channelId);
    }
    if (!(to.channelIds || []).includes(channelId)) {
      to.channelIds = [...to.channelIds || [], channelId];
    }
    await setLibrary(lib);
    return lib;
  }
  function onLibraryChange(callback) {
    if (!isExtensionAlive()) return () => {
    };
    const listener = (changes, area) => {
      if (!isExtensionAlive()) return;
      if (area === "local" && changes[LIBRARY_KEY]) {
        callback(changes[LIBRARY_KEY].newValue || emptyLibrary());
      }
    };
    try {
      chrome.storage.onChanged.addListener(listener);
    } catch {
      return () => {
      };
    }
    return () => {
      try {
        chrome.storage.onChanged.removeListener(listener);
      } catch {
      }
    };
  }

  // node_modules/lucide/dist/esm/iconsAndAliases.mjs
  var iconsAndAliases_exports = {};
  __export(iconsAndAliases_exports, {
    AArrowDown: () => AArrowDown,
    AArrowUp: () => AArrowUp,
    ALargeSmall: () => ALargeSmall,
    Accessibility: () => Accessibility,
    Activity: () => Activity,
    ActivitySquare: () => SquareActivity,
    Ad: () => Ad,
    AirVent: () => AirVent,
    Airplay: () => Airplay,
    AlarmCheck: () => AlarmClockCheck,
    AlarmClock: () => AlarmClock,
    AlarmClockCheck: () => AlarmClockCheck,
    AlarmClockMinus: () => AlarmClockMinus,
    AlarmClockOff: () => AlarmClockOff,
    AlarmClockPlus: () => AlarmClockPlus,
    AlarmMinus: () => AlarmClockMinus,
    AlarmPlus: () => AlarmClockPlus,
    AlarmSmoke: () => AlarmSmoke,
    Album: () => SquareBookmark,
    AlertCircle: () => CircleExclamationPoint,
    AlertOctagon: () => OctagonExclamationPoint,
    AlertTriangle: () => TriangleExclamationPoint,
    AlignCenter: () => TextAlignCenter,
    AlignCenterHorizontal: () => AlignCenterHorizontal,
    AlignCenterVertical: () => AlignCenterVertical,
    AlignEndHorizontal: () => AlignEndHorizontal,
    AlignEndVertical: () => AlignEndVertical,
    AlignHorizontalDistributeCenter: () => AlignHorizontalDistributeCenter,
    AlignHorizontalDistributeEnd: () => AlignHorizontalDistributeEnd,
    AlignHorizontalDistributeStart: () => AlignHorizontalDistributeStart,
    AlignHorizontalJustifyCenter: () => AlignHorizontalJustifyCenter,
    AlignHorizontalJustifyEnd: () => AlignHorizontalJustifyEnd,
    AlignHorizontalJustifyStart: () => AlignHorizontalJustifyStart,
    AlignHorizontalSpaceAround: () => AlignHorizontalSpaceAround,
    AlignHorizontalSpaceBetween: () => AlignHorizontalSpaceBetween,
    AlignJustify: () => TextAlignJustify,
    AlignLeft: () => TextAlignStart,
    AlignRight: () => TextAlignEnd,
    AlignStartHorizontal: () => AlignStartHorizontal,
    AlignStartVertical: () => AlignStartVertical,
    AlignVerticalDistributeCenter: () => AlignVerticalDistributeCenter,
    AlignVerticalDistributeEnd: () => AlignVerticalDistributeEnd,
    AlignVerticalDistributeStart: () => AlignVerticalDistributeStart,
    AlignVerticalJustifyCenter: () => AlignVerticalJustifyCenter,
    AlignVerticalJustifyEnd: () => AlignVerticalJustifyEnd,
    AlignVerticalJustifyStart: () => AlignVerticalJustifyStart,
    AlignVerticalSpaceAround: () => AlignVerticalSpaceAround,
    AlignVerticalSpaceBetween: () => AlignVerticalSpaceBetween,
    Ambulance: () => Ambulance,
    Ampersand: () => Ampersand,
    Ampersands: () => Ampersands,
    Amphora: () => Amphora,
    Anchor: () => Anchor,
    Angle: () => Angle,
    Angry: () => FaceAngry,
    Annoyed: () => FaceExpressionless,
    Antenna: () => Antenna,
    Anvil: () => Anvil,
    Aperture: () => Aperture,
    AppWindow: () => AppWindow,
    AppWindowMac: () => AppWindowMac,
    Apple: () => Apple,
    Archive: () => Archive,
    ArchiveArrowDown: () => ArchiveArrowDown,
    ArchiveArrowUp: () => ArchiveArrowUp,
    ArchiveRestore: () => ArchiveArrowUp,
    ArchiveX: () => ArchiveX,
    AreaChart: () => ChartArea,
    Armchair: () => Armchair,
    ArmenianDram: () => ArmenianDram,
    ArrowBigDown: () => ArrowBigDown,
    ArrowBigDownDash: () => ArrowBigDownDash,
    ArrowBigLeft: () => ArrowBigLeft,
    ArrowBigLeftDash: () => ArrowBigLeftDash,
    ArrowBigRight: () => ArrowBigRight,
    ArrowBigRightDash: () => ArrowBigRightDash,
    ArrowBigUp: () => ArrowBigUp,
    ArrowBigUpDash: () => ArrowBigUpDash,
    ArrowDown: () => ArrowDown,
    ArrowDown01: () => ArrowDown01,
    ArrowDown10: () => ArrowDown10,
    ArrowDownAZ: () => ArrowDownAZ,
    ArrowDownAz: () => ArrowDownAZ,
    ArrowDownCircle: () => CircleArrowDown,
    ArrowDownFromLine: () => ArrowDownFromLine,
    ArrowDownLeft: () => ArrowDownLeft,
    ArrowDownLeftFromCircle: () => CircleArrowOutDownLeft,
    ArrowDownLeftFromSquare: () => SquareArrowOutDownLeft,
    ArrowDownLeftSquare: () => SquareArrowDownLeft,
    ArrowDownNarrowWide: () => ArrowDownNarrowWide,
    ArrowDownRight: () => ArrowDownRight,
    ArrowDownRightFromCircle: () => CircleArrowOutDownRight,
    ArrowDownRightFromSquare: () => SquareArrowOutDownRight,
    ArrowDownRightSquare: () => SquareArrowDownRight,
    ArrowDownSquare: () => SquareArrowDown,
    ArrowDownToDot: () => ArrowDownToDot,
    ArrowDownToLine: () => ArrowDownToLine,
    ArrowDownUp: () => ArrowDownUp,
    ArrowDownWideNarrow: () => ArrowDownWideNarrow,
    ArrowDownZA: () => ArrowDownZA,
    ArrowDownZa: () => ArrowDownZA,
    ArrowLeft: () => ArrowLeft,
    ArrowLeftCircle: () => CircleArrowLeft,
    ArrowLeftFromLine: () => ArrowLeftFromLine,
    ArrowLeftRight: () => ArrowLeftRight,
    ArrowLeftSquare: () => SquareArrowLeft,
    ArrowLeftToLine: () => ArrowLeftToLine,
    ArrowRight: () => ArrowRight,
    ArrowRightCircle: () => CircleArrowRight,
    ArrowRightFromLine: () => ArrowRightFromLine,
    ArrowRightLeft: () => ArrowRightLeft,
    ArrowRightSquare: () => SquareArrowRight,
    ArrowRightToLine: () => ArrowRightToLine,
    ArrowUp: () => ArrowUp,
    ArrowUp01: () => ArrowUp01,
    ArrowUp10: () => ArrowUp10,
    ArrowUpAZ: () => ArrowUpAZ,
    ArrowUpAz: () => ArrowUpAZ,
    ArrowUpCircle: () => CircleArrowUp,
    ArrowUpDown: () => ArrowUpDown,
    ArrowUpFromDot: () => ArrowUpFromDot,
    ArrowUpFromLine: () => ArrowUpFromLine,
    ArrowUpLeft: () => ArrowUpLeft,
    ArrowUpLeftFromCircle: () => CircleArrowOutUpLeft,
    ArrowUpLeftFromSquare: () => SquareArrowOutUpLeft,
    ArrowUpLeftSquare: () => SquareArrowUpLeft,
    ArrowUpNarrowWide: () => ArrowUpNarrowWide,
    ArrowUpRight: () => ArrowUpRight,
    ArrowUpRightFromCircle: () => CircleArrowOutUpRight,
    ArrowUpRightFromSquare: () => SquareArrowOutUpRight,
    ArrowUpRightSquare: () => SquareArrowUpRight,
    ArrowUpSquare: () => SquareArrowUp,
    ArrowUpToLine: () => ArrowUpToLine,
    ArrowUpWideNarrow: () => ArrowUpWideNarrow,
    ArrowUpZA: () => ArrowUpZA,
    ArrowUpZa: () => ArrowUpZA,
    ArrowsUpFromLine: () => ArrowsUpFromLine,
    Asterisk: () => Asterisk,
    AsteriskSquare: () => SquareAsterisk,
    Astroid: () => Astroid,
    AtSign: () => AtSign,
    Atom: () => Atom,
    AudioLines: () => AudioLines,
    AudioLinesOff: () => AudioLinesOff,
    AudioLinesX: () => AudioLinesX,
    AudioWaveform: () => AudioWaveform,
    Avocado: () => Avocado,
    Award: () => Award,
    Axe: () => Axe,
    Axis3D: () => Axis3d,
    Axis3d: () => Axis3d,
    AzerbaijaniManat: () => AzerbaijaniManat,
    Baby: () => Baby,
    Backpack: () => Backpack,
    Bacon: () => Bacon,
    Badge: () => Badge,
    BadgeAlert: () => BadgeExclamationPoint,
    BadgeCent: () => BadgeCent,
    BadgeCheck: () => BadgeCheck,
    BadgeDollarSign: () => BadgeDollarSign,
    BadgeEuro: () => BadgeEuro,
    BadgeExclamationPoint: () => BadgeExclamationPoint,
    BadgeHelp: () => BadgeQuestionMark,
    BadgeIndianRupee: () => BadgeIndianRupee,
    BadgeInfo: () => BadgeInfo,
    BadgeJapaneseYen: () => BadgeJapaneseYen,
    BadgeMinus: () => BadgeMinus,
    BadgePercent: () => BadgePercent,
    BadgePlus: () => BadgePlus,
    BadgePoundSterling: () => BadgePoundSterling,
    BadgeQuestionMark: () => BadgeQuestionMark,
    BadgeRussianRuble: () => BadgeRussianRuble,
    BadgeSwissFranc: () => BadgeSwissFranc,
    BadgeTurkishLira: () => BadgeTurkishLira,
    BadgeX: () => BadgeX,
    BaggageClaim: () => BaggageClaim,
    BallWave: () => BallWave,
    Balloon: () => Balloon,
    Ban: () => Ban,
    Banana: () => Banana,
    Bandage: () => Bandage,
    BangladeshiTaka: () => BangladeshiTaka,
    Banknote: () => Banknote,
    BanknoteArrowDown: () => BanknoteArrowDown,
    BanknoteArrowUp: () => BanknoteArrowUp,
    BanknoteCheck: () => BanknoteCheck,
    BanknoteX: () => BanknoteX,
    BarChart: () => ChartNoAxesColumnIncreasing,
    BarChart2: () => ChartNoAxesColumn,
    BarChart3: () => ChartColumn,
    BarChart4: () => ChartColumnIncreasing,
    BarChartBig: () => ChartColumnBig,
    BarChartHorizontal: () => ChartBar,
    BarChartHorizontalBig: () => ChartBarBig,
    Barcode: () => Barcode,
    Barrel: () => Barrel,
    Baseline: () => Baseline,
    Bath: () => Bath,
    Battery: () => Battery,
    BatteryCharging: () => BatteryCharging,
    BatteryExclamationPoint: () => BatteryExclamationPoint,
    BatteryFull: () => BatteryFull,
    BatteryLow: () => BatteryLow,
    BatteryMedium: () => BatteryMedium,
    BatteryPlus: () => BatteryPlus,
    BatteryWarning: () => BatteryExclamationPoint,
    Beaker: () => Beaker,
    Bean: () => Bean,
    BeanOff: () => BeanOff,
    Bed: () => Bed,
    BedDouble: () => BedDouble,
    BedSingle: () => BedSingle,
    Beef: () => Beef,
    BeefOff: () => BeefOff,
    Beer: () => Beer,
    BeerOff: () => BeerOff,
    BelarusianRuble: () => BelarusianRuble,
    Bell: () => Bell,
    BellCheck: () => BellCheck,
    BellDot: () => BellDot,
    BellElectric: () => BellElectric,
    BellMinus: () => BellMinus,
    BellOff: () => BellOff,
    BellPlus: () => BellPlus,
    BellRing: () => BellRing,
    BetweenHorizonalEnd: () => BetweenHorizontalEnd,
    BetweenHorizonalStart: () => BetweenHorizontalStart,
    BetweenHorizontalEnd: () => BetweenHorizontalEnd,
    BetweenHorizontalStart: () => BetweenHorizontalStart,
    BetweenVerticalEnd: () => BetweenVerticalEnd,
    BetweenVerticalStart: () => BetweenVerticalStart,
    BicepsFlexed: () => BicepsFlexed,
    Bike: () => Bike,
    Binary: () => Binary,
    Binoculars: () => Binoculars,
    Biohazard: () => Biohazard,
    Bird: () => Bird,
    Birdhouse: () => Birdhouse,
    Bitcoin: () => Bitcoin,
    Blend: () => Blend,
    Blender: () => Blender,
    Blinds: () => Blinds,
    Blocks: () => Blocks,
    Bluetooth: () => Bluetooth,
    BluetoothConnected: () => BluetoothConnected,
    BluetoothOff: () => BluetoothOff,
    BluetoothSearching: () => BluetoothSearching,
    Bold: () => LetterB,
    Bolt: () => Bolt,
    Bomb: () => Bomb,
    Bone: () => Bone,
    BoneFracture: () => BoneFracture,
    Book: () => Book,
    BookA: () => BookA,
    BookAlert: () => BookExclamationPoint,
    BookAudio: () => BookAudio,
    BookBookmark: () => BookBookmark,
    BookCheck: () => BookCheck,
    BookCopy: () => BookCopy,
    BookDashed: () => BookDashed,
    BookDown: () => BookDown,
    BookExclamationPoint: () => BookExclamationPoint,
    BookHeadphones: () => BookHeadphones,
    BookHeart: () => BookHeart,
    BookImage: () => BookImage,
    BookKey: () => BookKey,
    BookLock: () => BookLock,
    BookMarked: () => BookBookmark,
    BookMinus: () => BookMinus,
    BookOpen: () => BookOpen,
    BookOpenCheck: () => BookOpenCheck,
    BookOpenText: () => BookOpenText,
    BookPlus: () => BookPlus,
    BookSearch: () => BookSearch,
    BookTemplate: () => BookDashed,
    BookText: () => BookText,
    BookType: () => BookType,
    BookUp: () => BookUp,
    BookUp2: () => BookUp2,
    BookUser: () => BookUser,
    BookX: () => BookX,
    Bookmark: () => Bookmark,
    BookmarkCheck: () => BookmarkCheck,
    BookmarkMinus: () => BookmarkMinus,
    BookmarkOff: () => BookmarkOff,
    BookmarkPlus: () => BookmarkPlus,
    BookmarkX: () => BookmarkX,
    BoomBox: () => BoomBox,
    Bot: () => Bot,
    BotMessageSquare: () => BotMessageSquare,
    BotOff: () => BotOff,
    BottleWine: () => BottleWine,
    BowArrow: () => BowArrow,
    Box: () => Box,
    BoxSelect: () => SquareDashed,
    Boxes: () => Boxes,
    BoxesLinked: () => BoxesLinked,
    Braces: () => Braces,
    Brackets: () => Brackets,
    Brain: () => Brain,
    BrainCircuit: () => BrainCircuit,
    BrainCog: () => BrainCog,
    BrainOff: () => BrainOff,
    BrickWall: () => BrickWall,
    BrickWallFire: () => BrickWallFire,
    BrickWallShield: () => BrickWallShield,
    Bridge: () => Bridge,
    Briefcase: () => Briefcase,
    BriefcaseBusiness: () => BriefcaseBusiness,
    BriefcaseConveyorBelt: () => BriefcaseConveyorBelt,
    BriefcaseMedical: () => BriefcaseMedical,
    BriefcasePlus: () => BriefcasePlus,
    BringToFront: () => BringToFront,
    Broccoli: () => Broccoli,
    Broom: () => Broom,
    BroomSparkles: () => BroomSparkles,
    Brush: () => Brush,
    BrushCleaning: () => BrushCleaning,
    Bubbles: () => Bubbles,
    Bug: () => Bug,
    BugOff: () => BugOff,
    BugPlay: () => BugPlay,
    Building: () => Building,
    Building2: () => BuildingComplex,
    BuildingComplex: () => BuildingComplex,
    BuildingComplexPlus: () => BuildingComplexPlus,
    Bus: () => Bus,
    BusFront: () => BusFront,
    Cable: () => Cable,
    CableCar: () => CableCar,
    Cake: () => Cake,
    CakeSlice: () => CakeSlice,
    Calculator: () => Calculator,
    Calendar: () => Calendar,
    Calendar1: () => Calendar1,
    CalendarArrowDown: () => CalendarArrowDown,
    CalendarArrowLeft: () => CalendarArrowLeft,
    CalendarArrowRight: () => CalendarArrowRight,
    CalendarArrowUp: () => CalendarArrowUp,
    CalendarCheck: () => CalendarCheck,
    CalendarCheck2: () => CalendarCheck2,
    CalendarChevronsLeft: () => CalendarChevronsLeft,
    CalendarChevronsRight: () => CalendarChevronsRight,
    CalendarClock: () => CalendarClock,
    CalendarCog: () => CalendarCog,
    CalendarDays: () => CalendarDays,
    CalendarFold: () => CalendarFold,
    CalendarHeart: () => CalendarHeart,
    CalendarMinus: () => CalendarMinus,
    CalendarMinus2: () => CalendarMinus2,
    CalendarOff: () => CalendarOff,
    CalendarPlus: () => CalendarPlus,
    CalendarPlus2: () => CalendarPlus2,
    CalendarRange: () => CalendarRange,
    CalendarSearch: () => CalendarSearch,
    CalendarSync: () => CalendarSync,
    CalendarX: () => CalendarX,
    CalendarX2: () => CalendarX2,
    Calendars: () => Calendars,
    Camera: () => Camera,
    CameraOff: () => CameraOff,
    Can: () => Can,
    CanSoda: () => CanSoda,
    CandlestickChart: () => ChartCandlestick,
    Candy: () => Candy,
    CandyCane: () => CandyCane,
    CandyOff: () => CandyOff,
    Cannabis: () => Cannabis,
    CannabisOff: () => CannabisOff,
    Captions: () => Captions,
    CaptionsOff: () => CaptionsOff,
    Car: () => Car,
    CarBattery: () => CarBattery,
    CarFront: () => CarFront,
    CarTaxiFront: () => CarTaxiFront,
    Caravan: () => Caravan,
    CardSim: () => CardSim,
    Carrot: () => Carrot,
    Carton: () => Carton,
    CartonOff: () => CartonOff,
    CaseLower: () => CaseLower,
    CaseSensitive: () => CaseSensitive,
    CaseUpper: () => CaseUpper,
    CassetteTape: () => CassetteTape,
    Cast: () => Cast,
    Castle: () => Castle,
    Cat: () => Cat,
    Cctv: () => Cctv,
    CctvOff: () => CctvOff,
    Certificate: () => Certificate,
    ChartArea: () => ChartArea,
    ChartBar: () => ChartBar,
    ChartBarBig: () => ChartBarBig,
    ChartBarDecreasing: () => ChartBarDecreasing,
    ChartBarIncreasing: () => ChartBarIncreasing,
    ChartBarStacked: () => ChartBarStacked,
    ChartBellCurve: () => ChartBellCurve,
    ChartCandlestick: () => ChartCandlestick,
    ChartColumn: () => ChartColumn,
    ChartColumnBig: () => ChartColumnBig,
    ChartColumnDecreasing: () => ChartColumnDecreasing,
    ChartColumnIncreasing: () => ChartColumnIncreasing,
    ChartColumnStacked: () => ChartColumnStacked,
    ChartGantt: () => ChartGantt,
    ChartLine: () => ChartLine,
    ChartNetwork: () => ChartNetwork,
    ChartNoAxesColumn: () => ChartNoAxesColumn,
    ChartNoAxesColumnDecreasing: () => ChartNoAxesColumnDecreasing,
    ChartNoAxesColumnIncreasing: () => ChartNoAxesColumnIncreasing,
    ChartNoAxesCombined: () => ChartNoAxesCombined,
    ChartNoAxesGantt: () => ChartNoAxesGantt,
    ChartPie: () => ChartPie,
    ChartQuadrant: () => ChartQuadrant,
    ChartRadar: () => ChartRadar,
    ChartScatter: () => ChartScatter,
    ChartSpline: () => ChartSpline,
    Check: () => Check,
    CheckCheck: () => CheckCheck,
    CheckCircle: () => CircleCheckBig,
    CheckCircle2: () => CircleCheck,
    CheckLine: () => CheckLine,
    CheckSquare: () => SquareCheckBig,
    CheckSquare2: () => SquareCheck,
    ChefHat: () => ChefHat,
    Cherry: () => Cherry,
    ChessBishop: () => ChessBishop,
    ChessKing: () => ChessKing,
    ChessKnight: () => ChessKnight,
    ChessPawn: () => ChessPawn,
    ChessQueen: () => ChessQueen,
    ChessRook: () => ChessRook,
    ChevronDown: () => ChevronDown,
    ChevronDownCircle: () => CircleChevronDown,
    ChevronDownSquare: () => SquareChevronDown,
    ChevronFirst: () => ChevronFirst,
    ChevronLast: () => ChevronLast,
    ChevronLeft: () => ChevronLeft,
    ChevronLeftCircle: () => CircleChevronLeft,
    ChevronLeftSquare: () => SquareChevronLeft,
    ChevronRight: () => ChevronRight,
    ChevronRightCircle: () => CircleChevronRight,
    ChevronRightSquare: () => SquareChevronRight,
    ChevronUp: () => ChevronUp,
    ChevronUpCircle: () => CircleChevronUp,
    ChevronUpSquare: () => SquareChevronUp,
    ChevronsDown: () => ChevronsDown,
    ChevronsDownUp: () => ChevronsDownUp,
    ChevronsLeft: () => ChevronsLeft,
    ChevronsLeftRight: () => ChevronsLeftRight,
    ChevronsLeftRightEllipsis: () => ChevronsLeftRightEllipsis,
    ChevronsRight: () => ChevronsRight,
    ChevronsRightLeft: () => ChevronsRightLeft,
    ChevronsUp: () => ChevronsUp,
    ChevronsUpDown: () => ChevronsUpDown,
    Church: () => Church,
    Cigarette: () => Cigarette,
    CigaretteOff: () => CigaretteOff,
    Circle: () => Circle,
    CircleAlert: () => CircleExclamationPoint,
    CircleArrowDown: () => CircleArrowDown,
    CircleArrowLeft: () => CircleArrowLeft,
    CircleArrowOutDownLeft: () => CircleArrowOutDownLeft,
    CircleArrowOutDownRight: () => CircleArrowOutDownRight,
    CircleArrowOutUpLeft: () => CircleArrowOutUpLeft,
    CircleArrowOutUpRight: () => CircleArrowOutUpRight,
    CircleArrowRight: () => CircleArrowRight,
    CircleArrowUp: () => CircleArrowUp,
    CircleCheck: () => CircleCheck,
    CircleCheckBig: () => CircleCheckBig,
    CircleChevronDown: () => CircleChevronDown,
    CircleChevronLeft: () => CircleChevronLeft,
    CircleChevronRight: () => CircleChevronRight,
    CircleChevronUp: () => CircleChevronUp,
    CircleChevronsDown: () => CircleChevronsDown,
    CircleChevronsLeft: () => CircleChevronsLeft,
    CircleChevronsRight: () => CircleChevronsRight,
    CircleChevronsUp: () => CircleChevronsUp,
    CircleDashed: () => CircleDashed,
    CircleDashedCheck: () => CircleDashedCheck,
    CircleDivide: () => CircleDivide,
    CircleDollarSign: () => CircleDollarSign,
    CircleDot: () => CircleDot,
    CircleDotDashed: () => CircleDotDashed,
    CircleEllipsis: () => CircleEllipsis,
    CircleEqual: () => CircleEqual,
    CircleEuro: () => CircleEuro,
    CircleExclamationPoint: () => CircleExclamationPoint,
    CircleFadingArrowUp: () => CircleFadingArrowUp,
    CircleFadingCheck: () => CircleFadingCheck,
    CircleFadingPlay: () => CircleFadingPlay,
    CircleFadingPlus: () => CircleFadingPlus,
    CircleGauge: () => CircleGauge,
    CircleHelp: () => CircleQuestionMark,
    CircleLetterA: () => CircleLetterA,
    CircleLetterB: () => CircleLetterB,
    CircleLetterC: () => CircleLetterC,
    CircleLetterD: () => CircleLetterD,
    CircleLetterE: () => CircleLetterE,
    CircleLetterF: () => CircleLetterF,
    CircleLetterG: () => CircleLetterG,
    CircleLetterH: () => CircleLetterH,
    CircleLetterI: () => CircleLetterI,
    CircleLetterJ: () => CircleLetterJ,
    CircleLetterK: () => CircleLetterK,
    CircleLetterL: () => CircleLetterL,
    CircleLetterM: () => CircleLetterM,
    CircleLetterN: () => CircleLetterN,
    CircleLetterO: () => CircleLetterO,
    CircleLetterP: () => CircleLetterP,
    CircleLetterPOff: () => CircleLetterPOff,
    CircleLetterQ: () => CircleLetterQ,
    CircleLetterR: () => CircleLetterR,
    CircleLetterS: () => CircleLetterS,
    CircleLetterT: () => CircleLetterT,
    CircleLetterU: () => CircleLetterU,
    CircleLetterV: () => CircleLetterV,
    CircleLetterW: () => CircleLetterW,
    CircleLetterX: () => CircleLetterX,
    CircleLetterY: () => CircleLetterY,
    CircleLetterZ: () => CircleLetterZ,
    CircleMinus: () => CircleMinus,
    CircleOff: () => CircleOff,
    CircleParking: () => CircleLetterP,
    CircleParkingOff: () => CircleLetterPOff,
    CirclePause: () => CirclePause,
    CirclePercent: () => CirclePercent,
    CirclePile: () => CirclePile,
    CirclePlay: () => CirclePlay,
    CirclePlus: () => CirclePlus,
    CirclePoundSterling: () => CirclePoundSterling,
    CirclePower: () => CirclePower,
    CircleQuestionMark: () => CircleQuestionMark,
    CircleSlash: () => CircleSlash,
    CircleSlash2: () => CircleSlash2,
    CircleSlashed: () => CircleSlash2,
    CircleSmall: () => CircleSmall,
    CircleStar: () => CircleStar,
    CircleStop: () => CircleStop,
    CircleUser: () => CircleUser,
    CircleUserRound: () => CircleUserRound,
    CircleX: () => CircleX,
    CircuitBoard: () => CircuitBoard,
    Citrus: () => Citrus,
    Clapperboard: () => Clapperboard,
    ClefAlto: () => ClefAlto,
    ClefBass: () => ClefBass,
    ClefTreble: () => ClefTreble,
    Clipboard: () => Clipboard,
    ClipboardCheck: () => ClipboardCheck,
    ClipboardClock: () => ClipboardClock,
    ClipboardCopy: () => ClipboardCopy,
    ClipboardEdit: () => ClipboardPen,
    ClipboardList: () => ClipboardList,
    ClipboardMinus: () => ClipboardMinus,
    ClipboardPaste: () => ClipboardPaste,
    ClipboardPen: () => ClipboardPen,
    ClipboardPenLine: () => ClipboardPenLine,
    ClipboardPlus: () => ClipboardPlus,
    ClipboardSignature: () => ClipboardPenLine,
    ClipboardType: () => ClipboardType,
    ClipboardX: () => ClipboardX,
    Clock: () => Clock,
    Clock1: () => Clock1,
    Clock10: () => Clock10,
    Clock11: () => Clock11,
    Clock12: () => Clock12,
    Clock2: () => Clock2,
    Clock3: () => Clock3,
    Clock4: () => Clock4,
    Clock5: () => Clock5,
    Clock6: () => Clock6,
    Clock7: () => Clock7,
    Clock8: () => Clock8,
    Clock9: () => Clock9,
    ClockAlert: () => ClockExclamationPoint,
    ClockArrowDown: () => ClockArrowDown,
    ClockArrowLeft: () => ClockArrowLeft,
    ClockArrowRight: () => ClockArrowRight,
    ClockArrowUp: () => ClockArrowUp,
    ClockCheck: () => ClockCheck,
    ClockExclamationPoint: () => ClockExclamationPoint,
    ClockFading: () => ClockFading,
    ClockPlus: () => ClockPlus,
    ClosedCaption: () => ClosedCaption,
    Cloud: () => Cloud,
    CloudAlert: () => CloudExclamationPoint,
    CloudBackup: () => CloudBackup,
    CloudCheck: () => CloudCheck,
    CloudCog: () => CloudCog,
    CloudDownload: () => CloudDownload,
    CloudDrizzle: () => CloudDrizzle,
    CloudExclamationPoint: () => CloudExclamationPoint,
    CloudFog: () => CloudFog,
    CloudHail: () => CloudHail,
    CloudLightning: () => CloudLightning,
    CloudMoon: () => CloudMoon,
    CloudMoonRain: () => CloudMoonRain,
    CloudOff: () => CloudOff,
    CloudRain: () => CloudRain,
    CloudRainWind: () => CloudRainWind,
    CloudSnow: () => CloudSnow,
    CloudSun: () => CloudSun,
    CloudSunRain: () => CloudSunRain,
    CloudSync: () => CloudSync,
    CloudUpload: () => CloudUpload,
    Cloudy: () => Cloudy,
    Clover: () => Clover,
    Club: () => Club,
    Code: () => Code,
    Code2: () => CodeXml,
    CodeSquare: () => SquareCode,
    CodeXml: () => CodeXml,
    Coffee: () => Coffee,
    Cog: () => Cog,
    Coins: () => Coins,
    Columns: () => Columns2,
    Columns2: () => Columns2,
    Columns3: () => Columns3,
    Columns3Cog: () => Columns3Cog,
    Columns4: () => Columns4,
    ColumnsSettings: () => Columns3Cog,
    Combine: () => Combine,
    Command: () => Command,
    Compass: () => Compass,
    Component: () => Component,
    Computer: () => Computer,
    ConciergeBell: () => ConciergeBell,
    Cone: () => Cone,
    Construction: () => Construction,
    Contact: () => Contact,
    Contact2: () => ContactRound,
    ContactRound: () => ContactRound,
    Container: () => Container,
    Contrast: () => Contrast,
    Cookie: () => Cookie,
    CookingPot: () => CookingPot,
    Copy: () => Copy,
    CopyCheck: () => CopyCheck,
    CopyMinus: () => CopyMinus,
    CopyPlus: () => CopyPlus,
    CopySlash: () => CopySlash,
    CopyX: () => CopyX,
    Copyleft: () => Copyleft,
    Copyright: () => CircleLetterC,
    CornerDownLeft: () => CornerDownLeft,
    CornerDownRight: () => CornerDownRight,
    CornerLeftDown: () => CornerLeftDown,
    CornerLeftUp: () => CornerLeftUp,
    CornerRightDown: () => CornerRightDown,
    CornerRightUp: () => CornerRightUp,
    CornerUpLeft: () => CornerUpLeft,
    CornerUpRight: () => CornerUpRight,
    Cpu: () => Cpu,
    CpuAi: () => CpuAi,
    CreativeCommons: () => CreativeCommons,
    CreditCard: () => CreditCard,
    CreditCardCheck: () => CreditCardCheck,
    CreditCardMinus: () => CreditCardMinus,
    CreditCardPlus: () => CreditCardPlus,
    CreditCardReader: () => CreditCardReader,
    CreditCardX: () => CreditCardX,
    Croissant: () => Croissant,
    Crop: () => Crop,
    Cross: () => Cross,
    Crosshair: () => Crosshair,
    Crown: () => Crown,
    Cuboid: () => Cuboid,
    CupSoda: () => CupSoda,
    Cupcake: () => Cupcake,
    CurlyBraces: () => Braces,
    Currency: () => Currency,
    Cylinder: () => Cylinder,
    Dam: () => Dam,
    Database: () => Database,
    DatabaseArrowDown: () => DatabaseArrowDown,
    DatabaseArrowUp: () => DatabaseArrowUp,
    DatabaseBackup: () => DatabaseBackup,
    DatabaseCheck: () => DatabaseCheck,
    DatabaseCog: () => DatabaseCog,
    DatabaseMinus: () => DatabaseMinus,
    DatabasePlus: () => DatabasePlus,
    DatabaseSearch: () => DatabaseSearch,
    DatabaseX: () => DatabaseX,
    DatabaseZap: () => DatabaseZap,
    DecimalsArrowLeft: () => DecimalsArrowLeft,
    DecimalsArrowRight: () => DecimalsArrowRight,
    Delete: () => Delete,
    Dessert: () => Dessert,
    DiagramFlowHorizontal: () => DiagramFlowHorizontal,
    DiagramFlowVertical: () => DiagramFlowVertical,
    Diameter: () => Diameter,
    Diamond: () => Diamond,
    DiamondMinus: () => DiamondMinus,
    DiamondPercent: () => DiamondPercent,
    DiamondPlus: () => DiamondPlus,
    Dice1: () => Dice1,
    Dice2: () => Dice2,
    Dice3: () => Dice3,
    Dice4: () => Dice4,
    Dice5: () => Dice5,
    Dice6: () => Dice6,
    Dices: () => Dices,
    Diff: () => Diff,
    Disc: () => Disc,
    Disc2: () => Disc2,
    Disc3: () => Disc3,
    DiscAlbum: () => DiscAlbum,
    Divide: () => Divide,
    DivideCircle: () => CircleDivide,
    DivideSquare: () => SquareDivide,
    Dna: () => Dna,
    DnaOff: () => DnaOff,
    Dock: () => Dock,
    Dog: () => Dog,
    DollarSign: () => DollarSign,
    Dome: () => Dome,
    Donut: () => Donut,
    DoorClosed: () => DoorClosed,
    DoorClosedCog: () => DoorClosedCog,
    DoorClosedLocked: () => DoorClosedLocked,
    DoorClosedPackage: () => DoorClosedPackage,
    DoorOpen: () => DoorOpen,
    DoorStairwell: () => DoorStairwell,
    Dot: () => Dot,
    DotSquare: () => SquareDot,
    Download: () => Download,
    DownloadCloud: () => CloudDownload,
    DraftingCompass: () => DraftingCompass,
    Drama: () => Drama,
    Drill: () => Drill,
    Drone: () => Drone,
    Droplet: () => Droplet,
    DropletOff: () => DropletOff,
    Droplets: () => Droplets,
    Drum: () => Drum,
    Drumstick: () => Drumstick,
    Dumbbell: () => Dumbbell,
    Ear: () => Ear,
    EarOff: () => EarOff,
    Earbuds: () => Earbuds,
    EarbudsOff: () => EarbudsOff,
    Earth: () => Earth,
    EarthLock: () => EarthLock,
    Eclipse: () => Eclipse,
    Edit: () => SquarePen,
    Edit2: () => Pen,
    Edit3: () => PenLine,
    Egg: () => Egg,
    EggFried: () => EggFried,
    EggOff: () => EggOff,
    EighthNote: () => EighthNote,
    EighthNotes: () => EighthNotes,
    Eject: () => Eject,
    Ellipse: () => Ellipse,
    Ellipsis: () => Ellipsis,
    EllipsisVertical: () => EllipsisVertical,
    EmiratiDirham: () => EmiratiDirham,
    Engine: () => Engine,
    Equal: () => Equal,
    EqualApproximately: () => EqualApproximately,
    EqualApproximatelyNot: () => EqualApproximatelyNot,
    EqualNot: () => EqualNot,
    EqualSquare: () => SquareEqual,
    Eraser: () => Eraser,
    EthernetPort: () => EthernetPort,
    Euro: () => Euro,
    EvCharger: () => EvCharger,
    Expand: () => Expand,
    ExternalLink: () => ExternalLink,
    Eye: () => Eye,
    EyeClosed: () => EyeClosed,
    EyeDashed: () => EyeDashed,
    EyeOff: () => EyeOff,
    FaceAngry: () => FaceAngry,
    FaceExpressionless: () => FaceExpressionless,
    FaceGrinning: () => FaceGrinning,
    FaceNeutral: () => FaceNeutral,
    FaceSlightlyFrowning: () => FaceSlightlyFrowning,
    FaceSlightlySmiling: () => FaceSlightlySmiling,
    FaceSlightlySmilingPlus: () => FaceSlightlySmilingPlus,
    Factory: () => Factory,
    Fan: () => Fan,
    FastForward: () => FastForward,
    Faucet: () => Faucet,
    Feather: () => Feather,
    Fence: () => Fence,
    FerrisWheel: () => FerrisWheel,
    File: () => File,
    FileArchive: () => FileArchive,
    FileAudio: () => FileHeadphone,
    FileAudio2: () => FileHeadphone,
    FileAxis3D: () => FileAxis3d,
    FileAxis3d: () => FileAxis3d,
    FileBadge: () => FileBadge,
    FileBadge2: () => FileBadge,
    FileBarChart: () => FileChartColumnIncreasing,
    FileBarChart2: () => FileChartColumn,
    FileBox: () => FileBox,
    FileBraces: () => FileBraces,
    FileBracesCorner: () => FileBracesCorner,
    FileChartColumn: () => FileChartColumn,
    FileChartColumnIncreasing: () => FileChartColumnIncreasing,
    FileChartLine: () => FileChartLine,
    FileChartPie: () => FileChartPie,
    FileCheck: () => FileCheck,
    FileCheck2: () => FileCheckCorner,
    FileCheckCorner: () => FileCheckCorner,
    FileClock: () => FileClock,
    FileCode: () => FileCode,
    FileCode2: () => FileCodeCorner,
    FileCodeCorner: () => FileCodeCorner,
    FileCog: () => FileCog,
    FileCog2: () => FileCog,
    FileDatabase: () => FileDatabase,
    FileDiff: () => FileDiff,
    FileDigit: () => FileDigit,
    FileDown: () => FileDown,
    FileEdit: () => FilePen,
    FileExclamationPoint: () => FileExclamationPoint,
    FileHeadphone: () => FileHeadphone,
    FileHeart: () => FileHeart,
    FileImage: () => FileImage,
    FileInput: () => FileInput,
    FileJson: () => FileBraces,
    FileJson2: () => FileBracesCorner,
    FileKey: () => FileKey,
    FileKey2: () => FileKey,
    FileLineChart: () => FileChartLine,
    FileLock: () => FileLock,
    FileLock2: () => FileLock,
    FileMinus: () => FileMinus,
    FileMinus2: () => FileMinusCorner,
    FileMinusCorner: () => FileMinusCorner,
    FileMusic: () => FileMusic,
    FileOutput: () => FileOutput,
    FilePen: () => FilePen,
    FilePenLine: () => FilePenLine,
    FilePieChart: () => FileChartPie,
    FilePlay: () => FilePlay,
    FilePlus: () => FilePlus,
    FilePlus2: () => FilePlusCorner,
    FilePlusCorner: () => FilePlusCorner,
    FileQuestion: () => FileQuestionMark,
    FileQuestionMark: () => FileQuestionMark,
    FileScan: () => FileScan,
    FileSearch: () => FileSearch,
    FileSearch2: () => FileSearchCorner,
    FileSearchCorner: () => FileSearchCorner,
    FileSignal: () => FileSignal,
    FileSignature: () => FilePenLine,
    FileSliders: () => FileSliders,
    FileSpreadsheet: () => FileSpreadsheet,
    FileStack: () => FileStack,
    FileSymlink: () => FileSymlink,
    FileTerminal: () => FileTerminal,
    FileText: () => FileText,
    FileType: () => FileType,
    FileType2: () => FileTypeCorner,
    FileTypeCorner: () => FileTypeCorner,
    FileUp: () => FileUp,
    FileUser: () => FileUser,
    FileVideo: () => FilePlay,
    FileVideo2: () => FileVideoCamera,
    FileVideoCamera: () => FileVideoCamera,
    FileVolume: () => FileVolume,
    FileVolume2: () => FileSignal,
    FileWarning: () => FileExclamationPoint,
    FileX: () => FileX,
    FileX2: () => FileXCorner,
    FileXCorner: () => FileXCorner,
    Files: () => Files,
    Film: () => Film,
    Filter: () => Funnel,
    FilterX: () => FunnelX,
    Fingerprint: () => FingerprintPattern,
    FingerprintPattern: () => FingerprintPattern,
    FireExtinguisher: () => FireExtinguisher,
    Fish: () => Fish,
    FishOff: () => FishOff,
    FishSymbol: () => FishSymbol,
    FishingHook: () => FishingHook,
    FishingRod: () => FishingRod,
    Flag: () => Flag,
    FlagOff: () => FlagOff,
    FlagTriangleLeft: () => FlagTriangleLeft,
    FlagTriangleRight: () => FlagTriangleRight,
    Flame: () => Flame,
    FlameKindling: () => FlameKindling,
    Flashlight: () => Flashlight,
    FlashlightOff: () => FlashlightOff,
    FlaskConical: () => FlaskConical,
    FlaskConicalOff: () => FlaskConicalOff,
    FlaskRound: () => FlaskRound,
    FlipHorizontal: () => SquareCenterlineDashedHorizontal,
    FlipHorizontal2: () => TrianglesCenterlineDashedHorizontal,
    FlipVertical: () => SquareCenterlineDashedVertical,
    FlipVertical2: () => TrianglesCenterlineDashedVertical,
    Flower: () => Flower,
    Flower2: () => Flower2,
    Focus: () => Focus,
    FoldHorizontal: () => FoldHorizontal,
    FoldVertical: () => FoldVertical,
    Folder: () => Folder,
    FolderArchive: () => FolderArchive,
    FolderBookmark: () => FolderBookmark,
    FolderCheck: () => FolderCheck,
    FolderClock: () => FolderClock,
    FolderClosed: () => FolderClosed,
    FolderCode: () => FolderCode,
    FolderCog: () => FolderCog,
    FolderCog2: () => FolderCog,
    FolderDot: () => FolderDot,
    FolderDown: () => FolderDown,
    FolderEdit: () => FolderPen,
    FolderGit: () => FolderGit,
    FolderGit2: () => FolderGit2,
    FolderHeart: () => FolderHeart,
    FolderInput: () => FolderInput,
    FolderKanban: () => FolderKanban,
    FolderKey: () => FolderKey,
    FolderLock: () => FolderLock,
    FolderMinus: () => FolderMinus,
    FolderOpen: () => FolderOpen,
    FolderOpenDot: () => FolderOpenDot,
    FolderOutput: () => FolderOutput,
    FolderPen: () => FolderPen,
    FolderPlus: () => FolderPlus,
    FolderRoot: () => FolderRoot,
    FolderSearch: () => FolderSearch,
    FolderSearch2: () => FolderSearch2,
    FolderSymlink: () => FolderSymlink,
    FolderSync: () => FolderSync,
    FolderTree: () => FolderTree,
    FolderUp: () => FolderUp,
    FolderUser: () => FolderUser,
    FolderUsers: () => FolderUsers,
    FolderX: () => FolderX,
    Folders: () => Folders,
    Footprints: () => Footprints,
    ForkKnife: () => Utensils,
    ForkKnifeCrossed: () => UtensilsCrossed,
    Forklift: () => Forklift,
    Form: () => Form,
    FormInput: () => RectangleEllipsis,
    Forward: () => Forward,
    Frame: () => Frame,
    Frown: () => FaceSlightlyFrowning,
    Fuel: () => Fuel,
    Fullscreen: () => Fullscreen,
    FunctionSquare: () => SquareFunction,
    Funnel: () => Funnel,
    FunnelPlus: () => FunnelPlus,
    FunnelX: () => FunnelX,
    Galaxy: () => Galaxy,
    GalleryHorizontal: () => GalleryHorizontal,
    GalleryHorizontalEnd: () => GalleryHorizontalEnd,
    GalleryThumbnails: () => GalleryThumbnails,
    GalleryVertical: () => GalleryVertical,
    GalleryVerticalEnd: () => GalleryVerticalEnd,
    Gamepad: () => Gamepad,
    Gamepad2: () => Gamepad2,
    GamepadDirectional: () => GamepadDirectional,
    GanttChart: () => ChartNoAxesGantt,
    GanttChartSquare: () => SquareChartGantt,
    GapHorizontal: () => GapHorizontal,
    GapVertical: () => GapVertical,
    Gauge: () => Gauge,
    GaugeCircle: () => CircleGauge,
    Gavel: () => Gavel,
    Gem: () => Gem,
    GeorgianLari: () => GeorgianLari,
    Germ: () => Germ,
    GermOff: () => GermOff,
    Ghost: () => Ghost,
    Gift: () => Gift,
    GitBranch: () => GitBranch,
    GitBranchMinus: () => GitBranchMinus,
    GitBranchPlus: () => GitBranchPlus,
    GitCommit: () => GitCommitHorizontal,
    GitCommitHorizontal: () => GitCommitHorizontal,
    GitCommitVertical: () => GitCommitVertical,
    GitCompare: () => GitCompare,
    GitCompareArrows: () => GitCompareArrows,
    GitFork: () => GitFork,
    GitGraph: () => GitGraph,
    GitMerge: () => GitMerge,
    GitMergeConflict: () => GitMergeConflict,
    GitPullRequest: () => GitPullRequest,
    GitPullRequestArrow: () => GitPullRequestArrow,
    GitPullRequestClosed: () => GitPullRequestClosed,
    GitPullRequestCreate: () => GitPullRequestCreate,
    GitPullRequestCreateArrow: () => GitPullRequestCreateArrow,
    GitPullRequestDraft: () => GitPullRequestDraft,
    GlassWater: () => GlassWater,
    Glasses: () => Glasses,
    Globe: () => Globe,
    Globe2: () => Earth,
    GlobeBan: () => GlobeBan,
    GlobeCheck: () => GlobeCheck,
    GlobeCode: () => GlobeCode,
    GlobeLock: () => GlobeLock,
    GlobeOff: () => GlobeOff,
    GlobePlus: () => GlobePlus,
    GlobeX: () => GlobeX,
    Goal: () => Goal,
    Gpu: () => Gpu,
    Grab: () => HandGrab,
    GraduationCap: () => GraduationCap,
    Grape: () => Grape,
    GraphHub: () => GraphHub,
    GraphStar: () => GraphStar,
    Grid: () => Grid3x3,
    Grid2X2: () => Grid2x2,
    Grid2X2Check: () => Grid2x2Check,
    Grid2X2Plus: () => Grid2x2Plus,
    Grid2X2X: () => Grid2x2X,
    Grid2x2: () => Grid2x2,
    Grid2x2Check: () => Grid2x2Check,
    Grid2x2Plus: () => Grid2x2Plus,
    Grid2x2X: () => Grid2x2X,
    Grid3X3: () => Grid3x3,
    Grid3x2: () => Grid3x2,
    Grid3x3: () => Grid3x3,
    Grip: () => Grip,
    GripHorizontal: () => GripHorizontal,
    GripVertical: () => GripVertical,
    Groceries: () => Groceries,
    Group: () => Group,
    Guitar: () => Guitar,
    GuitarElectric: () => GuitarElectric,
    HalfNote: () => HalfNote,
    Ham: () => Ham,
    Hamburger: () => Hamburger,
    Hammer: () => Hammer,
    Hand: () => Hand,
    HandCoins: () => HandCoins,
    HandFist: () => HandFist,
    HandGrab: () => HandGrab,
    HandHeart: () => HandHeart,
    HandHelping: () => HandHelping,
    HandMetal: () => HandMetal,
    HandPlatter: () => HandPlatter,
    Handbag: () => Handbag,
    HandleBottomRight: () => HandleBottomRight,
    Handshake: () => Handshake,
    HardDrive: () => HardDrive,
    HardDriveDownload: () => HardDriveDownload,
    HardDriveUpload: () => HardDriveUpload,
    HardHat: () => HardHat,
    Hash: () => Hash,
    HatGlasses: () => HatGlasses,
    Haze: () => Haze,
    Hd: () => Hd,
    HdmiPort: () => HdmiPort,
    Heading: () => LetterH,
    Heading1: () => Heading1,
    Heading2: () => Heading2,
    Heading3: () => Heading3,
    Heading4: () => Heading4,
    Heading5: () => Heading5,
    Heading6: () => Heading6,
    HeadphoneOff: () => HeadphoneOff,
    Headphones: () => Headphones,
    Headset: () => Headset,
    Heart: () => Heart,
    HeartCrack: () => HeartCrack,
    HeartHandshake: () => HeartHandshake,
    HeartMinus: () => HeartMinus,
    HeartOff: () => HeartOff,
    HeartPlus: () => HeartPlus,
    HeartPulse: () => HeartPulse,
    HeartX: () => HeartX,
    Heater: () => Heater,
    Helicopter: () => Helicopter,
    HelpCircle: () => CircleQuestionMark,
    HelpingHand: () => HandHelping,
    Hexagon: () => Hexagon,
    Highlighter: () => Highlighter,
    HikingStick: () => HikingStick,
    History: () => RotateCcwClock,
    HockeyStick: () => HockeyStick,
    Home: () => House,
    Hop: () => Hop,
    HopOff: () => HopOff,
    Hospital: () => Hospital,
    HotAirBalloon: () => HotAirBalloon,
    Hotel: () => Hotel,
    Hourglass: () => Hourglass,
    HourglassCog: () => HourglassCog,
    House: () => House,
    HouseCog: () => HouseCog,
    HouseHeart: () => HouseHeart,
    HousePlug: () => HousePlug,
    HousePlus: () => HousePlus,
    HouseWifi: () => HouseWifi,
    Houses: () => Houses,
    IceCream: () => IceCreamCone,
    IceCream2: () => IceCreamBowl,
    IceCreamBowl: () => IceCreamBowl,
    IceCreamCone: () => IceCreamCone,
    IdCard: () => IdCard,
    IdCardLanyard: () => IdCardLanyard,
    Image: () => Image,
    ImageDown: () => ImageDown,
    ImageMinus: () => ImageMinus,
    ImageOff: () => ImageOff,
    ImagePlay: () => ImagePlay,
    ImagePlus: () => ImagePlus,
    ImageUp: () => ImageUp,
    ImageUpscale: () => ImageUpscale,
    Images: () => Images,
    Import: () => Import,
    Inbox: () => Inbox,
    Indent: () => ListIndentIncrease,
    IndentDecrease: () => ListIndentDecrease,
    IndentIncrease: () => ListIndentIncrease,
    IndianRupee: () => IndianRupee,
    Infinity: () => Infinity,
    Info: () => Info,
    Inspect: () => SquareMousePointer,
    InspectionPanel: () => InspectionPanel,
    Italic: () => Italic,
    IterationCcw: () => IterationCcw,
    IterationCw: () => IterationCw,
    IvBag: () => IvBag,
    JapaneseYen: () => JapaneseYen,
    Joystick: () => Joystick,
    Kanban: () => Kanban,
    KanbanSquare: () => SquareKanban,
    KanbanSquareDashed: () => SquareDashedKanban,
    Kayak: () => Kayak,
    KazakhTenge: () => KazakhTenge,
    Key: () => Key,
    KeyRound: () => KeyRound,
    KeySquare: () => KeySquare,
    Keyboard: () => Keyboard,
    KeyboardMusic: () => KeyboardMusic,
    KeyboardOff: () => KeyboardOff,
    Lambda: () => Lambda,
    Lamp: () => Lamp,
    LampCeiling: () => LampCeiling,
    LampDesk: () => LampDesk,
    LampFloor: () => LampFloor,
    LampWallDown: () => LampWallDown,
    LampWallUp: () => LampWallUp,
    LandPlot: () => LandPlot,
    Landmark: () => Landmark,
    Languages: () => Languages,
    Laptop: () => Laptop,
    Laptop2: () => LaptopMinimal,
    LaptopMinimal: () => LaptopMinimal,
    LaptopMinimalCheck: () => LaptopMinimalCheck,
    Laser: () => Laser,
    Lasso: () => Lasso,
    LassoSelect: () => LassoSelect,
    Laugh: () => FaceGrinning,
    LayerArrowDown: () => LayerArrowDown,
    LayerArrowUp: () => LayerArrowUp,
    Layers: () => Layers,
    Layers2: () => Layers2,
    Layers3: () => Layers,
    LayersArrowDown: () => LayersArrowDown,
    LayersArrowUp: () => LayersArrowUp,
    LayersMinus: () => LayersMinus,
    LayersPlus: () => LayersPlus,
    Layout: () => PanelsTopLeft,
    LayoutArrowDown: () => LayoutArrowDown,
    LayoutArrowRight: () => LayoutArrowRight,
    LayoutDashboard: () => LayoutDashboard,
    LayoutFreeform: () => LayoutFreeform,
    LayoutGrid: () => LayoutGrid,
    LayoutGridCircles: () => LayoutGridCircles,
    LayoutList: () => LayoutList,
    LayoutPanelLeft: () => LayoutPanelLeft,
    LayoutPanelTop: () => LayoutPanelTop,
    LayoutTemplate: () => LayoutTemplate,
    Leaf: () => Leaf,
    LeafyGreen: () => LeafyGreen,
    Lectern: () => Lectern,
    Lens: () => Lens,
    LensConcave: () => LensConcave,
    LensConvex: () => LensConvex,
    LetterA: () => LetterA,
    LetterB: () => LetterB,
    LetterC: () => LetterC,
    LetterD: () => LetterD,
    LetterE: () => LetterE,
    LetterF: () => LetterF,
    LetterG: () => LetterG,
    LetterH: () => LetterH,
    LetterI: () => LetterI,
    LetterJ: () => LetterJ,
    LetterK: () => LetterK,
    LetterL: () => LetterL,
    LetterM: () => LetterM,
    LetterN: () => LetterN,
    LetterO: () => LetterO,
    LetterP: () => LetterP,
    LetterQ: () => LetterQ,
    LetterR: () => LetterR,
    LetterS: () => LetterS,
    LetterSpacing: () => LetterSpacing,
    LetterT: () => LetterT,
    LetterText: () => TextInitial,
    LetterU: () => LetterU,
    LetterV: () => LetterV,
    LetterW: () => LetterW,
    LetterX: () => LetterX,
    LetterY: () => LetterY,
    LetterZ: () => LetterZ,
    Letters: () => Letters,
    Library: () => Library,
    LibraryBig: () => LibraryBig,
    LibrarySquare: () => SquareLibrary,
    LifeBuoy: () => LifeBuoy,
    Ligature: () => Ligature,
    Lightbulb: () => Lightbulb,
    LightbulbOff: () => LightbulbOff,
    Lighthouse: () => Lighthouse,
    LineChart: () => ChartLine,
    LineDotBottomVertical: () => LineDotBottomVertical,
    LineDotLeftHorizontal: () => LineDotLeftHorizontal,
    LineDotRightHorizontal: () => LineDotRightHorizontal,
    LineDotTopVertical: () => LineDotTopVertical,
    LineHeight: () => LineHeight,
    LineSquiggle: () => LineSquiggle,
    LineStyle: () => LineStyle,
    Link: () => Link,
    Link2: () => Link2,
    Link2Off: () => Link2Off,
    List: () => List,
    ListCheck: () => ListCheck,
    ListChecks: () => ListChecks,
    ListChevronsDownUp: () => ListChevronsDownUp,
    ListChevronsUpDown: () => ListChevronsUpDown,
    ListClock: () => ListClock,
    ListCollapse: () => ListCollapse,
    ListEnd: () => ListEnd,
    ListFilter: () => ListFilter,
    ListFilterPlus: () => ListFilterPlus,
    ListIndentDecrease: () => ListIndentDecrease,
    ListIndentIncrease: () => ListIndentIncrease,
    ListMinus: () => ListMinus,
    ListMusic: () => ListMusic,
    ListOrdered: () => ListOrdered,
    ListPlus: () => ListPlus,
    ListRestart: () => ListRestart,
    ListSortAscending: () => ListSortAscending,
    ListSortDescending: () => ListSortDescending,
    ListStart: () => ListStart,
    ListTodo: () => ListTodo,
    ListTree: () => ListTree,
    ListVideo: () => ListVideo,
    ListX: () => ListX,
    Loader: () => Loader,
    Loader2: () => LoaderCircle,
    LoaderCircle: () => LoaderCircle,
    LoaderPinwheel: () => LoaderPinwheel,
    Locate: () => Locate,
    LocateFixed: () => LocateFixed,
    LocateOff: () => LocateOff,
    LocationEdit: () => MapPinPen,
    Lock: () => Lock,
    LockKeyhole: () => LockKeyhole,
    LockKeyholeOpen: () => LockKeyholeOpen,
    LockOpen: () => LockOpen,
    LogIn: () => LogIn,
    LogOut: () => LogOut,
    Logs: () => Logs,
    Lollipop: () => Lollipop,
    Luggage: () => Luggage,
    MSquare: () => SquareLetterM,
    Magnet: () => Magnet,
    Mail: () => Mail,
    MailAlert: () => MailExclamationPoint,
    MailBadge: () => MailBadge,
    MailCheck: () => MailCheck,
    MailClock: () => MailClock,
    MailDot: () => MailDot,
    MailExclamationPoint: () => MailExclamationPoint,
    MailMinus: () => MailMinus,
    MailOpen: () => MailOpen,
    MailPen: () => MailPen,
    MailPlus: () => MailPlus,
    MailQuestion: () => MailQuestionMark,
    MailQuestionMark: () => MailQuestionMark,
    MailSearch: () => MailSearch,
    MailWarning: () => MailExclamationPoint,
    MailX: () => MailX,
    Mailbox: () => Mailbox,
    Mails: () => Mails,
    Mango: () => Mango,
    Map: () => Map,
    MapMinus: () => MapMinus,
    MapPin: () => MapPin,
    MapPinCheck: () => MapPinCheck,
    MapPinCheckInside: () => MapPinCheckInside,
    MapPinHouse: () => MapPinHouse,
    MapPinMinus: () => MapPinMinus,
    MapPinMinusInside: () => MapPinMinusInside,
    MapPinOff: () => MapPinOff,
    MapPinPen: () => MapPinPen,
    MapPinPlus: () => MapPinPlus,
    MapPinPlusInside: () => MapPinPlusInside,
    MapPinSearch: () => MapPinSearch,
    MapPinX: () => MapPinX,
    MapPinXInside: () => MapPinXInside,
    MapPinned: () => MapPinned,
    MapPlus: () => MapPlus,
    Margin: () => Margin,
    MarginBottom: () => MarginBottom,
    MarginHorizontal: () => MarginHorizontal,
    MarginLeft: () => MarginLeft,
    MarginRight: () => MarginRight,
    MarginTop: () => MarginTop,
    MarginVertical: () => MarginVertical,
    Mars: () => Mars,
    MarsStroke: () => MarsStroke,
    Martini: () => Martini,
    Maximize: () => Maximize,
    Maximize2: () => Maximize2,
    Medal: () => Medal,
    Megaphone: () => Megaphone,
    MegaphoneOff: () => MegaphoneOff,
    Meh: () => FaceNeutral,
    MemoryStick: () => MemoryStick,
    Menu: () => Menu,
    MenuSquare: () => SquareMenu,
    Merge: () => Merge,
    MessageCircle: () => MessageCircle,
    MessageCircleAlert: () => MessageCircleExclamationPoint,
    MessageCircleCheck: () => MessageCircleCheck,
    MessageCircleCode: () => MessageCircleCode,
    MessageCircleDashed: () => MessageCircleDashed,
    MessageCircleDashedCheck: () => MessageCircleDashedCheck,
    MessageCircleExclamationPoint: () => MessageCircleExclamationPoint,
    MessageCircleHeart: () => MessageCircleHeart,
    MessageCircleMore: () => MessageCircleMore,
    MessageCircleOff: () => MessageCircleOff,
    MessageCirclePlus: () => MessageCirclePlus,
    MessageCircleQuestion: () => MessageCircleQuestionMark,
    MessageCircleQuestionMark: () => MessageCircleQuestionMark,
    MessageCircleReply: () => MessageCircleReply,
    MessageCircleText: () => MessageCircleText,
    MessageCircleWarning: () => MessageCircleExclamationPoint,
    MessageCircleX: () => MessageCircleX,
    MessageSquare: () => MessageSquare,
    MessageSquareAlert: () => MessageSquareExclamationPoint,
    MessageSquareCheck: () => MessageSquareCheck,
    MessageSquareCode: () => MessageSquareCode,
    MessageSquareDashed: () => MessageSquareDashed,
    MessageSquareDiff: () => MessageSquareDiff,
    MessageSquareDot: () => MessageSquareDot,
    MessageSquareExclamationPoint: () => MessageSquareExclamationPoint,
    MessageSquareHeart: () => MessageSquareHeart,
    MessageSquareLock: () => MessageSquareLock,
    MessageSquareMore: () => MessageSquareMore,
    MessageSquareOff: () => MessageSquareOff,
    MessageSquarePlus: () => MessageSquarePlus,
    MessageSquareQuote: () => MessageSquareQuote,
    MessageSquareReply: () => MessageSquareReply,
    MessageSquareShare: () => MessageSquareShare,
    MessageSquareText: () => MessageSquareText,
    MessageSquareWarning: () => MessageSquareExclamationPoint,
    MessageSquareX: () => MessageSquareX,
    MessagesCircle: () => MessagesCircle,
    MessagesSquare: () => MessagesSquare,
    Metronome: () => Metronome,
    Mic: () => Mic,
    Mic2: () => MicVocal,
    MicAudioLines: () => MicAudioLines,
    MicOff: () => MicOff,
    MicSignal: () => MicSignal,
    MicVocal: () => MicVocal,
    Microchip: () => Microchip,
    Microscope: () => Microscope,
    Microwave: () => Microwave,
    MidiPort: () => MidiPort,
    Milestone: () => Milestone,
    Milk: () => Milk,
    MilkOff: () => MilkOff,
    Minimize: () => Minimize,
    Minimize2: () => Minimize2,
    Minus: () => Minus,
    MinusCircle: () => CircleMinus,
    MinusSquare: () => SquareMinus,
    MirrorRectangular: () => MirrorRectangular,
    MirrorRound: () => MirrorRound,
    Monitor: () => Monitor,
    MonitorActivity: () => MonitorActivity,
    MonitorCheck: () => MonitorCheck,
    MonitorCloud: () => MonitorCloud,
    MonitorCog: () => MonitorCog,
    MonitorDot: () => MonitorDot,
    MonitorDown: () => MonitorDown,
    MonitorOff: () => MonitorOff,
    MonitorPause: () => MonitorPause,
    MonitorPc: () => MonitorPc,
    MonitorPlay: () => MonitorPlay,
    MonitorSmartphone: () => MonitorSmartphone,
    MonitorSpeaker: () => MonitorSpeaker,
    MonitorStop: () => MonitorStop,
    MonitorUp: () => MonitorUp,
    MonitorX: () => MonitorX,
    Moon: () => Moon,
    MoonStar: () => MoonStar,
    Mop: () => Mop,
    MopSparkles: () => MopSparkles,
    MoreHorizontal: () => Ellipsis,
    MoreVertical: () => EllipsisVertical,
    Mosque: () => Mosque,
    Motorbike: () => Motorbike,
    Mountain: () => Mountain,
    MountainSnow: () => MountainSnow,
    Mouse: () => Mouse,
    MouseLeft: () => MouseLeft,
    MouseOff: () => MouseOff,
    MousePointer: () => MousePointer,
    MousePointer2: () => MousePointer2,
    MousePointer2Off: () => MousePointer2Off,
    MousePointerBan: () => MousePointerBan,
    MousePointerClick: () => MousePointerClick,
    MousePointerSquareDashed: () => SquareDashedMousePointer,
    MouseRight: () => MouseRight,
    Mouth: () => Mouth,
    MouthOff: () => MouthOff,
    Move: () => Move,
    Move3D: () => Move3d,
    Move3d: () => Move3d,
    MoveDiagonal: () => MoveDiagonal,
    MoveDiagonal2: () => MoveDiagonal2,
    MoveDown: () => MoveDown,
    MoveDownLeft: () => MoveDownLeft,
    MoveDownRight: () => MoveDownRight,
    MoveHorizontal: () => MoveHorizontal,
    MoveLeft: () => MoveLeft,
    MoveRight: () => MoveRight,
    MoveUp: () => MoveUp,
    MoveUpLeft: () => MoveUpLeft,
    MoveUpRight: () => MoveUpRight,
    MoveVertical: () => MoveVertical,
    Music: () => EighthNotes,
    Music2: () => EighthNote,
    Music3: () => HalfNote,
    Music4: () => SixteenthNotes,
    Navigation: () => Navigation,
    Navigation2: () => Navigation2,
    Navigation2Off: () => Navigation2Off,
    NavigationOff: () => NavigationOff,
    NepaliRupee: () => NepaliRupee,
    Network: () => Network,
    Newspaper: () => Newspaper,
    Nfc: () => Nfc,
    NonBinary: () => NonBinary,
    Notebook: () => Notebook,
    NotebookDot: () => NotebookDot,
    NotebookPen: () => NotebookPen,
    NotebookTabs: () => NotebookTabs,
    NotebookText: () => NotebookText,
    NotepadText: () => NotepadText,
    NotepadTextDashed: () => NotepadTextDashed,
    Numbers: () => Numbers,
    Nut: () => Nut,
    NutOff: () => NutOff,
    Octagon: () => Octagon,
    OctagonAlert: () => OctagonExclamationPoint,
    OctagonExclamationPoint: () => OctagonExclamationPoint,
    OctagonMinus: () => OctagonMinus,
    OctagonPause: () => OctagonPause,
    OctagonX: () => OctagonX,
    Omega: () => Omega,
    Opacity: () => Opacity,
    Option: () => Option,
    Orbit: () => Orbit,
    Origami: () => Origami,
    Outdent: () => ListIndentDecrease,
    Package: () => Package,
    Package2: () => Package2,
    PackageCheck: () => PackageCheck,
    PackageMinus: () => PackageMinus,
    PackageOpen: () => PackageOpen,
    PackagePen: () => PackagePen,
    PackagePlus: () => PackagePlus,
    PackageQuestionMark: () => PackageQuestionMark,
    PackageSearch: () => PackageSearch,
    PackageX: () => PackageX,
    PaintBucket: () => PaintBucket,
    PaintRoller: () => PaintRoller,
    Paintbrush: () => Paintbrush,
    Paintbrush2: () => PaintbrushVertical,
    PaintbrushVertical: () => PaintbrushVertical,
    Palette: () => Palette,
    Palmtree: () => TreePalm,
    Panda: () => Panda,
    PanelBottom: () => PanelBottom,
    PanelBottomClose: () => PanelBottomClose,
    PanelBottomDashed: () => PanelBottomDashed,
    PanelBottomInactive: () => PanelBottomDashed,
    PanelBottomOpen: () => PanelBottomOpen,
    PanelLeft: () => PanelLeft,
    PanelLeftClose: () => PanelLeftClose,
    PanelLeftDashed: () => PanelLeftDashed,
    PanelLeftInactive: () => PanelLeftDashed,
    PanelLeftOpen: () => PanelLeftOpen,
    PanelLeftRightDashed: () => PanelLeftRightDashed,
    PanelRight: () => PanelRight,
    PanelRightClose: () => PanelRightClose,
    PanelRightDashed: () => PanelRightDashed,
    PanelRightInactive: () => PanelRightDashed,
    PanelRightOpen: () => PanelRightOpen,
    PanelTop: () => PanelTop,
    PanelTopBottomDashed: () => PanelTopBottomDashed,
    PanelTopClose: () => PanelTopClose,
    PanelTopDashed: () => PanelTopDashed,
    PanelTopInactive: () => PanelTopDashed,
    PanelTopOpen: () => PanelTopOpen,
    PanelsLeftBottom: () => PanelsLeftBottom,
    PanelsLeftRight: () => Columns3,
    PanelsRightBottom: () => PanelsRightBottom,
    PanelsTopBottom: () => Rows3,
    PanelsTopLeft: () => PanelsTopLeft,
    PaperBag: () => PaperBag,
    Paperclip: () => Paperclip,
    Parasol: () => Parasol,
    Parentheses: () => Parentheses,
    Park: () => Park,
    ParkingCircle: () => CircleLetterP,
    ParkingCircleOff: () => CircleLetterPOff,
    ParkingMeter: () => ParkingMeter,
    ParkingSquare: () => SquareLetterP,
    ParkingSquareOff: () => SquareLetterPOff,
    PartyPopper: () => PartyPopper,
    Pause: () => Pause,
    PauseCircle: () => CirclePause,
    PauseOctagon: () => OctagonPause,
    PawPrint: () => PawPrint,
    PcCase: () => PcCase,
    Pen: () => Pen,
    PenBox: () => SquarePen,
    PenLine: () => PenLine,
    PenOff: () => PenOff,
    PenSquare: () => SquarePen,
    PenTool: () => PenTool,
    Pencil: () => Pencil,
    PencilLine: () => PencilLine,
    PencilOff: () => PencilOff,
    PencilRuler: () => PencilRuler,
    PencilSparkles: () => PencilSparkles,
    Pentagon: () => Pentagon,
    Percent: () => Percent,
    PercentCircle: () => CirclePercent,
    PercentDiamond: () => DiamondPercent,
    PercentSquare: () => SquarePercent,
    PerfumeBottle: () => PerfumeBottle,
    PersonStanding: () => PersonStanding,
    Phi: () => Phi,
    PhilippinePeso: () => PhilippinePeso,
    Phone: () => Phone,
    PhoneCall: () => PhoneCall,
    PhoneForwarded: () => PhoneForwarded,
    PhoneIncoming: () => PhoneIncoming,
    PhoneLog: () => PhoneLog,
    PhoneMissed: () => PhoneMissed,
    PhoneOff: () => PhoneOff,
    PhoneOutgoing: () => PhoneOutgoing,
    Pi: () => Pi,
    PiSquare: () => SquarePi,
    Piano: () => Piano,
    Pickaxe: () => Pickaxe,
    PictureInPicture: () => PictureInPicture,
    PictureInPicture2: () => PictureInPicture2,
    PieChart: () => ChartPie,
    PiggyBank: () => PiggyBank,
    Pilcrow: () => Pilcrow,
    PilcrowLeft: () => PilcrowLeft,
    PilcrowRight: () => PilcrowRight,
    PilcrowSquare: () => SquarePilcrow,
    Pill: () => Pill,
    PillBottle: () => PillBottle,
    Pin: () => Pin,
    PinOff: () => PinOff,
    Pipette: () => Pipette,
    Pizza: () => Pizza,
    Plane: () => Plane,
    PlaneLanding: () => PlaneLanding,
    PlaneTakeoff: () => PlaneTakeoff,
    PlantPot: () => PlantPot,
    Play: () => Play,
    PlayCircle: () => CirclePlay,
    PlayOff: () => PlayOff,
    PlaySquare: () => SquarePlay,
    PlayingCard: () => PlayingCard,
    PlayingCards: () => PlayingCards,
    PlayingCardsFan: () => PlayingCardsFan,
    Plug: () => Plug,
    Plug2: () => Plug2,
    PlugZap: () => PlugZap,
    PlugZap2: () => PlugZap,
    Plus: () => Plus,
    PlusCircle: () => CirclePlus,
    PlusSquare: () => SquarePlus,
    PocketKnife: () => PocketKnife,
    Podcast: () => MicSignal,
    Podium: () => Podium,
    Pointer: () => Pointer,
    PointerOff: () => PointerOff,
    Popcorn: () => Popcorn,
    Popsicle: () => Popsicle,
    PoundSterling: () => PoundSterling,
    Power: () => Power,
    PowerCircle: () => CirclePower,
    PowerOff: () => PowerOff,
    PowerSquare: () => SquarePower,
    Presentation: () => Presentation,
    Printer: () => Printer,
    Printer3d: () => Printer3d,
    PrinterCheck: () => PrinterCheck,
    PrinterX: () => PrinterX,
    Projector: () => Projector,
    Proportions: () => Proportions,
    Puzzle: () => Puzzle,
    Pyramid: () => Pyramid,
    QrCode: () => QrCode,
    Quote: () => Quote,
    Rabbit: () => Rabbit,
    Radar: () => Radar,
    Radiation: () => Radiation,
    Radical: () => Radical,
    Radio: () => Radio,
    RadioOff: () => RadioOff,
    RadioReceiver: () => RadioReceiver,
    RadioTower: () => RadioTower,
    Radius: () => Radius,
    Rainbow: () => Rainbow,
    Rat: () => Rat,
    Ratio: () => Ratio,
    Receipt: () => Receipt,
    ReceiptCent: () => ReceiptCent,
    ReceiptEuro: () => ReceiptEuro,
    ReceiptIndianRupee: () => ReceiptIndianRupee,
    ReceiptJapaneseYen: () => ReceiptJapaneseYen,
    ReceiptPoundSterling: () => ReceiptPoundSterling,
    ReceiptRussianRuble: () => ReceiptRussianRuble,
    ReceiptSwissFranc: () => ReceiptSwissFranc,
    ReceiptText: () => ReceiptText,
    ReceiptTurkishLira: () => ReceiptTurkishLira,
    RectangleCircle: () => RectangleCircle,
    RectangleEllipsis: () => RectangleEllipsis,
    RectangleGoggles: () => RectangleGoggles,
    RectangleHorizontal: () => RectangleHorizontal,
    RectangleVertical: () => RectangleVertical,
    Recycle: () => Recycle,
    Redo: () => Redo,
    Redo2: () => Redo2,
    RedoDot: () => RedoDot,
    RefreshCcw: () => RefreshCcw,
    RefreshCcwDot: () => RefreshCcwDot,
    RefreshCw: () => RefreshCw,
    RefreshCwOff: () => RefreshCwOff,
    Refrigerator: () => Refrigerator,
    Regex: () => Regex,
    RemoveFormatting: () => RemoveFormatting,
    Repeat: () => Repeat,
    Repeat1: () => Repeat1,
    Repeat2: () => Repeat2,
    RepeatOff: () => RepeatOff,
    Replace: () => Replace,
    ReplaceAll: () => ReplaceAll,
    Reply: () => Reply,
    ReplyAll: () => ReplyAll,
    Rewind: () => Rewind,
    Ribbon: () => Ribbon,
    Road: () => Road,
    RobotArm: () => RobotArm,
    RobotVacuum: () => RobotVacuum,
    Rocket: () => Rocket,
    RockingChair: () => RockingChair,
    RollerCoaster: () => RollerCoaster,
    Rose: () => Rose,
    Rotate3D: () => Rotate3d,
    Rotate3d: () => Rotate3d,
    RotateCcw: () => RotateCcw,
    RotateCcwClock: () => RotateCcwClock,
    RotateCcwKey: () => RotateCcwKey,
    RotateCcwSquare: () => RotateCcwSquare,
    RotateCw: () => RotateCw,
    RotateCwClock: () => RotateCwClock,
    RotateCwFadingClock: () => RotateCwFadingClock,
    RotateCwSquare: () => RotateCwSquare,
    Route: () => Route,
    RouteOff: () => RouteOff,
    Router: () => Router,
    Rows: () => Rows2,
    Rows2: () => Rows2,
    Rows3: () => Rows3,
    Rows4: () => Rows4,
    Rss: () => Rss,
    RugbyBall: () => RugbyBall,
    Ruler: () => Ruler,
    RulerDimensionLine: () => RulerDimensionLine,
    RussianRuble: () => RussianRuble,
    Sailboat: () => Sailboat,
    Salad: () => Salad,
    Sandwich: () => Sandwich,
    Satellite: () => Satellite,
    SatelliteDish: () => SatelliteDish,
    SaudiRiyal: () => SaudiRiyal,
    Save: () => Save,
    SaveAll: () => SaveAll,
    SaveCheck: () => SaveCheck,
    SaveOff: () => SaveOff,
    SavePen: () => SavePen,
    SavePlus: () => SavePlus,
    Scale: () => Scale,
    Scale3D: () => Scale3d,
    Scale3d: () => Scale3d,
    Scaling: () => Scaling,
    Scan: () => Scan,
    ScanBarcode: () => ScanBarcode,
    ScanBox: () => ScanBox,
    ScanEye: () => ScanEye,
    ScanFace: () => ScanFace,
    ScanHeart: () => ScanHeart,
    ScanLine: () => ScanLine,
    ScanQrCode: () => ScanQrCode,
    ScanSearch: () => ScanSearch,
    ScanSquare: () => ScanSquare,
    ScanText: () => ScanText,
    ScatterChart: () => ChartScatter,
    School: () => School,
    School2: () => University,
    Scissors: () => Scissors,
    ScissorsLineDashed: () => ScissorsLineDashed,
    ScissorsSquare: () => SquareScissors,
    ScissorsSquareDashedBottom: () => SquareBottomDashedScissors,
    Scooter: () => Scooter,
    ScratchBlocks: () => ScratchBlocks,
    ScreenShare: () => ScreenShare,
    ScreenShareOff: () => ScreenShareOff,
    Screw: () => Screw,
    Scroll: () => Scroll,
    ScrollText: () => ScrollText,
    Search: () => Search,
    SearchAlert: () => SearchExclamationPoint,
    SearchCheck: () => SearchCheck,
    SearchCode: () => SearchCode,
    SearchExclamationPoint: () => SearchExclamationPoint,
    SearchSlash: () => SearchSlash,
    SearchX: () => SearchX,
    Section: () => Section,
    Send: () => Send,
    SendHorizonal: () => SendHorizontal,
    SendHorizontal: () => SendHorizontal,
    SendToBack: () => SendToBack,
    SeparatorHorizontal: () => SeparatorHorizontal,
    SeparatorVertical: () => SeparatorVertical,
    Server: () => Server,
    ServerCog: () => ServerCog,
    ServerCrash: () => ServerCrash,
    ServerNas: () => ServerNas,
    ServerOff: () => ServerOff,
    ServerPlus: () => ServerPlus,
    Settings: () => Settings,
    Settings2: () => Settings2,
    Shapes: () => Shapes,
    Share: () => Share,
    Share2: () => Share2,
    Sheet: () => Sheet,
    Shell: () => Shell,
    ShelvingUnit: () => ShelvingUnit,
    Shield: () => Shield,
    ShieldAlert: () => ShieldExclamationPoint,
    ShieldBan: () => ShieldBan,
    ShieldCheck: () => ShieldCheck,
    ShieldClose: () => ShieldX,
    ShieldCog: () => ShieldCog,
    ShieldCogCorner: () => ShieldCogCorner,
    ShieldEllipsis: () => ShieldEllipsis,
    ShieldExclamationPoint: () => ShieldExclamationPoint,
    ShieldHalf: () => ShieldHalf,
    ShieldHouse: () => ShieldHouse,
    ShieldKeyhole: () => ShieldKeyhole,
    ShieldLock: () => ShieldLock,
    ShieldMinus: () => ShieldMinus,
    ShieldOff: () => ShieldOff,
    ShieldPlus: () => ShieldPlus,
    ShieldQuestion: () => ShieldQuestionMark,
    ShieldQuestionMark: () => ShieldQuestionMark,
    ShieldUser: () => ShieldUser,
    ShieldX: () => ShieldX,
    Ship: () => Ship,
    ShipCargo: () => ShipCargo,
    ShipWheel: () => ShipWheel,
    Shirt: () => Shirt,
    ShoppingBag: () => ShoppingBag,
    ShoppingBasket: () => ShoppingBasket,
    ShoppingCart: () => ShoppingCart,
    ShoppingCartMinus: () => ShoppingCartMinus,
    ShoppingCartPlus: () => ShoppingCartPlus,
    Shovel: () => Shovel,
    ShowerHead: () => ShowerHead,
    Shredder: () => Shredder,
    Shrimp: () => Shrimp,
    ShrimpOff: () => ShrimpOff,
    Shrink: () => Shrink,
    Shrub: () => Shrub,
    Shuffle: () => Shuffle,
    Sidebar: () => PanelLeft,
    SidebarClose: () => PanelLeftClose,
    SidebarOpen: () => PanelLeftOpen,
    Sigma: () => Sigma,
    SigmaSquare: () => SquareSigma,
    Signal: () => Signal,
    SignalHigh: () => SignalHigh,
    SignalLow: () => SignalLow,
    SignalMedium: () => SignalMedium,
    SignalZero: () => SignalZero,
    Signature: () => Signature,
    Signpost: () => Signpost,
    SignpostBig: () => SignpostBig,
    Siren: () => Siren,
    SirenOff: () => SirenOff,
    SixteenthNotes: () => SixteenthNotes,
    SkipBack: () => SkipBack,
    SkipForward: () => SkipForward,
    Skull: () => Skull,
    Slash: () => Slash,
    SlashSquare: () => SquareSlash,
    Slice: () => Slice,
    Sliders: () => SlidersVertical,
    SlidersHorizontal: () => SlidersHorizontal,
    SlidersVertical: () => SlidersVertical,
    Smartphone: () => Smartphone,
    SmartphoneCharging: () => SmartphoneCharging,
    SmartphoneNfc: () => SmartphoneNfc,
    SmartphoneUserRound: () => SmartphoneUserRound,
    Smile: () => FaceSlightlySmiling,
    SmilePlus: () => FaceSlightlySmilingPlus,
    Snail: () => Snail,
    Snowflake: () => Snowflake,
    SoapDispenserDroplet: () => SoapDispenserDroplet,
    Sofa: () => Sofa,
    SolarPanel: () => SolarPanel,
    SortAsc: () => ArrowUpNarrowWide,
    SortDesc: () => ArrowDownWideNarrow,
    Soup: () => Soup,
    Space: () => Space,
    Spade: () => Spade,
    Sparkle: () => Sparkle,
    Sparkles: () => Sparkles,
    Speaker: () => Speaker,
    Speech: () => Speech,
    SpellCheck: () => SpellCheck,
    SpellCheck2: () => SpellCheck2,
    Spline: () => Spline,
    SplinePointer: () => SplinePointer,
    Split: () => Split,
    SplitSquareHorizontal: () => SquareSplitHorizontal,
    SplitSquareVertical: () => SquareSplitVertical,
    Spool: () => Spool,
    SportShoe: () => SportShoe,
    Spotlight: () => Spotlight,
    SprayCan: () => SprayCan,
    Sprout: () => Sprout,
    Square: () => Square,
    SquareActivity: () => SquareActivity,
    SquareArrowDown: () => SquareArrowDown,
    SquareArrowDownLeft: () => SquareArrowDownLeft,
    SquareArrowDownRight: () => SquareArrowDownRight,
    SquareArrowLeft: () => SquareArrowLeft,
    SquareArrowOutDownLeft: () => SquareArrowOutDownLeft,
    SquareArrowOutDownRight: () => SquareArrowOutDownRight,
    SquareArrowOutUpLeft: () => SquareArrowOutUpLeft,
    SquareArrowOutUpRight: () => SquareArrowOutUpRight,
    SquareArrowRight: () => SquareArrowRight,
    SquareArrowRightEnter: () => SquareArrowRightEnter,
    SquareArrowRightExit: () => SquareArrowRightExit,
    SquareArrowUp: () => SquareArrowUp,
    SquareArrowUpLeft: () => SquareArrowUpLeft,
    SquareArrowUpRight: () => SquareArrowUpRight,
    SquareAsterisk: () => SquareAsterisk,
    SquareBookmark: () => SquareBookmark,
    SquareBottomDashedScissors: () => SquareBottomDashedScissors,
    SquareCenterlineDashedHorizontal: () => SquareCenterlineDashedHorizontal,
    SquareCenterlineDashedVertical: () => SquareCenterlineDashedVertical,
    SquareChartGantt: () => SquareChartGantt,
    SquareCheck: () => SquareCheck,
    SquareCheckBig: () => SquareCheckBig,
    SquareChevronDown: () => SquareChevronDown,
    SquareChevronLeft: () => SquareChevronLeft,
    SquareChevronRight: () => SquareChevronRight,
    SquareChevronUp: () => SquareChevronUp,
    SquareChevronsDown: () => SquareChevronsDown,
    SquareChevronsLeft: () => SquareChevronsLeft,
    SquareChevronsRight: () => SquareChevronsRight,
    SquareChevronsUp: () => SquareChevronsUp,
    SquareCode: () => SquareCode,
    SquareDashed: () => SquareDashed,
    SquareDashedBottom: () => SquareDashedBottom,
    SquareDashedBottomCode: () => SquareDashedBottomCode,
    SquareDashedKanban: () => SquareDashedKanban,
    SquareDashedMousePointer: () => SquareDashedMousePointer,
    SquareDashedPlus: () => SquareDashedPlus,
    SquareDashedText: () => SquareDashedText,
    SquareDashedTopSolid: () => SquareDashedTopSolid,
    SquareDashedX: () => SquareDashedX,
    SquareDashedXCorner: () => SquareDashedXCorner,
    SquareDimensions: () => SquareDimensions,
    SquareDivide: () => SquareDivide,
    SquareDot: () => SquareDot,
    SquareEqual: () => SquareEqual,
    SquareExclamationPoint: () => SquareExclamationPoint,
    SquareFunction: () => SquareFunction,
    SquareGanttChart: () => SquareChartGantt,
    SquareKanban: () => SquareKanban,
    SquareKanbanPlus: () => SquareKanbanPlus,
    SquareLetterA: () => SquareLetterA,
    SquareLetterB: () => SquareLetterB,
    SquareLetterC: () => SquareLetterC,
    SquareLetterD: () => SquareLetterD,
    SquareLetterE: () => SquareLetterE,
    SquareLetterF: () => SquareLetterF,
    SquareLetterG: () => SquareLetterG,
    SquareLetterH: () => SquareLetterH,
    SquareLetterI: () => SquareLetterI,
    SquareLetterJ: () => SquareLetterJ,
    SquareLetterK: () => SquareLetterK,
    SquareLetterL: () => SquareLetterL,
    SquareLetterM: () => SquareLetterM,
    SquareLetterN: () => SquareLetterN,
    SquareLetterO: () => SquareLetterO,
    SquareLetterP: () => SquareLetterP,
    SquareLetterPOff: () => SquareLetterPOff,
    SquareLetterQ: () => SquareLetterQ,
    SquareLetterR: () => SquareLetterR,
    SquareLetterS: () => SquareLetterS,
    SquareLetterT: () => SquareLetterT,
    SquareLetterU: () => SquareLetterU,
    SquareLetterV: () => SquareLetterV,
    SquareLetterW: () => SquareLetterW,
    SquareLetterX: () => SquareLetterX,
    SquareLetterY: () => SquareLetterY,
    SquareLetterZ: () => SquareLetterZ,
    SquareLibrary: () => SquareLibrary,
    SquareM: () => SquareLetterM,
    SquareMenu: () => SquareMenu,
    SquareMinus: () => SquareMinus,
    SquareMousePointer: () => SquareMousePointer,
    SquareOff: () => SquareOff,
    SquarePadding: () => SquarePadding,
    SquarePaddingBottom: () => SquarePaddingBottom,
    SquarePaddingHorizontal: () => SquarePaddingHorizontal,
    SquarePaddingLeft: () => SquarePaddingLeft,
    SquarePaddingRight: () => SquarePaddingRight,
    SquarePaddingTop: () => SquarePaddingTop,
    SquarePaddingVertical: () => SquarePaddingVertical,
    SquareParking: () => SquareLetterP,
    SquareParkingOff: () => SquareLetterPOff,
    SquarePause: () => SquarePause,
    SquarePen: () => SquarePen,
    SquarePercent: () => SquarePercent,
    SquarePi: () => SquarePi,
    SquarePilcrow: () => SquarePilcrow,
    SquarePlay: () => SquarePlay,
    SquarePlus: () => SquarePlus,
    SquarePower: () => SquarePower,
    SquareRadical: () => SquareRadical,
    SquareRoundCorner: () => SquareRoundCorner,
    SquareScissors: () => SquareScissors,
    SquareSigma: () => SquareSigma,
    SquareSlash: () => SquareSlash,
    SquareSparkles: () => SquareSparkles,
    SquareSplitHorizontal: () => SquareSplitHorizontal,
    SquareSplitVertical: () => SquareSplitVertical,
    SquareSquare: () => SquareSquare,
    SquareStack: () => SquareStack,
    SquareStar: () => SquareStar,
    SquareStop: () => SquareStop,
    SquareTerminal: () => SquareTerminal,
    SquareText: () => SquareText,
    SquareUser: () => SquareUser,
    SquareUserRound: () => SquareUserRound,
    SquareX: () => SquareX,
    SquaresExclude: () => SquaresExclude,
    SquaresIntersect: () => SquaresIntersect,
    SquaresSubtract: () => SquaresSubtract,
    SquaresUnite: () => SquaresUnite,
    Squircle: () => Squircle,
    SquircleDashed: () => SquircleDashed,
    Squirrel: () => Squirrel,
    Stamp: () => Stamp,
    Star: () => Star,
    StarCheck: () => StarCheck,
    StarHalf: () => StarHalf,
    StarMinus: () => StarMinus,
    StarOff: () => StarOff,
    StarPlus: () => StarPlus,
    StarX: () => StarX,
    Stars: () => Sparkles,
    StepBack: () => StepBack,
    StepForward: () => StepForward,
    Stethoscope: () => Stethoscope,
    Sticker: () => Sticker,
    StickyNote: () => StickyNote,
    StickyNoteCheck: () => StickyNoteCheck,
    StickyNoteMinus: () => StickyNoteMinus,
    StickyNoteOff: () => StickyNoteOff,
    StickyNotePlus: () => StickyNotePlus,
    StickyNoteX: () => StickyNoteX,
    StickyNotes: () => StickyNotes,
    Stone: () => Stone,
    StopCircle: () => CircleStop,
    Store: () => Store,
    StretchHorizontal: () => StretchHorizontal,
    StretchVertical: () => StretchVertical,
    Strikethrough: () => Strikethrough,
    Subscript: () => Subscript,
    Subtitles: () => Captions,
    Summary: () => Summary,
    Sun: () => Sun,
    SunDim: () => SunDim,
    SunMedium: () => SunMedium,
    SunMoon: () => SunMoon,
    SunSnow: () => SunSnow,
    Sunrise: () => Sunrise,
    Sunset: () => Sunset,
    Superscript: () => Superscript,
    SwatchBook: () => SwatchBook,
    SwissFranc: () => SwissFranc,
    SwitchCamera: () => SwitchCamera,
    Sword: () => Sword,
    Swords: () => Swords,
    Syringe: () => Syringe,
    Table: () => Table,
    Table2: () => Table2,
    TableCellsMerge: () => TableCellsMerge,
    TableCellsSplit: () => TableCellsSplit,
    TableColumnsSplit: () => TableColumnsSplit,
    TableConfig: () => Columns3Cog,
    TableOfContents: () => TableOfContents,
    TableProperties: () => TableProperties,
    TableRowsSplit: () => TableRowsSplit,
    Tablet: () => Tablet,
    TabletSmartphone: () => TabletSmartphone,
    Tablets: () => Tablets,
    Tag: () => Tag,
    TagPlus: () => TagPlus,
    TagX: () => TagX,
    Tags: () => Tags,
    Tally1: () => Tally1,
    Tally2: () => Tally2,
    Tally3: () => Tally3,
    Tally4: () => Tally4,
    Tally5: () => Tally5,
    Tangent: () => Tangent,
    Target: () => Target,
    Telescope: () => Telescope,
    Tent: () => Tent,
    TentTree: () => TentTree,
    Terminal: () => Terminal,
    TerminalSquare: () => SquareTerminal,
    TestTube: () => TestTube,
    TestTube2: () => TestTubeDiagonal,
    TestTubeDiagonal: () => TestTubeDiagonal,
    TestTubes: () => TestTubes,
    Text: () => TextAlignStart,
    TextAlignCenter: () => TextAlignCenter,
    TextAlignEnd: () => TextAlignEnd,
    TextAlignJustify: () => TextAlignJustify,
    TextAlignJustifyCenter: () => TextAlignJustifyCenter,
    TextAlignJustifyEnd: () => TextAlignJustifyEnd,
    TextAlignJustifyStart: () => TextAlignJustifyStart,
    TextAlignStart: () => TextAlignStart,
    TextCursor: () => TextCursor,
    TextCursorInput: () => TextCursorInput,
    TextInitial: () => TextInitial,
    TextQuote: () => TextQuote,
    TextSearch: () => TextSearch,
    TextSelect: () => SquareDashedText,
    TextSelection: () => SquareDashedText,
    TextWrap: () => TextWrap,
    Theater: () => Theater,
    Thermometer: () => Thermometer,
    ThermometerSnowflake: () => ThermometerSnowflake,
    ThermometerSun: () => ThermometerSun,
    ThumbsDown: () => ThumbsDown,
    ThumbsUp: () => ThumbsUp,
    TicTacToe: () => TicTacToe,
    Ticket: () => Ticket,
    TicketCheck: () => TicketCheck,
    TicketMinus: () => TicketMinus,
    TicketPercent: () => TicketPercent,
    TicketPlus: () => TicketPlus,
    TicketSlash: () => TicketSlash,
    TicketX: () => TicketX,
    Tickets: () => Tickets,
    TicketsPlane: () => TicketsPlane,
    Timeline: () => Timeline,
    Timer: () => Timer,
    TimerOff: () => TimerOff,
    TimerReset: () => TimerReset,
    ToggleLeft: () => ToggleLeft,
    ToggleRight: () => ToggleRight,
    Toilet: () => Toilet,
    Tombstone: () => Tombstone,
    ToolCase: () => ToolCase,
    Toolbox: () => Toolbox,
    Toothbrush: () => Toothbrush,
    ToothbrushSparkles: () => ToothbrushSparkles,
    Tornado: () => Tornado,
    Torus: () => Torus,
    Touchpad: () => Touchpad,
    TouchpadOff: () => TouchpadOff,
    TowelRack: () => TowelRack,
    TowerControl: () => TowerControl,
    ToyBrick: () => ToyBrick,
    Tractor: () => Tractor,
    TrafficCone: () => TrafficCone,
    Trailer: () => Trailer,
    Train: () => TramFront,
    TrainFront: () => TrainFront,
    TrainFrontTunnel: () => TrainFrontTunnel,
    TrainTrack: () => TrainTrack,
    TramFront: () => TramFront,
    Transgender: () => Transgender,
    Trash: () => Trash,
    Trash2: () => Trash,
    TrashOff: () => TrashOff,
    TreeDeciduous: () => TreeDeciduous,
    TreePalm: () => TreePalm,
    TreePine: () => TreePine,
    Trees: () => Trees,
    TrendingDown: () => TrendingDown,
    TrendingUp: () => TrendingUp,
    TrendingUpDown: () => TrendingUpDown,
    Triangle: () => Triangle,
    TriangleAlert: () => TriangleExclamationPoint,
    TriangleDashed: () => TriangleDashed,
    TriangleExclamationPoint: () => TriangleExclamationPoint,
    TriangleRight: () => TriangleRight,
    TrianglesCenterlineDashedHorizontal: () => TrianglesCenterlineDashedHorizontal,
    TrianglesCenterlineDashedVertical: () => TrianglesCenterlineDashedVertical,
    Trophy: () => Trophy,
    Truck: () => Truck,
    TruckElectric: () => TruckElectric,
    TubeLotion: () => TubeLotion,
    TurkishLira: () => TurkishLira,
    Turntable: () => Turntable,
    Turtle: () => Turtle,
    Tv: () => Tv,
    Tv2: () => TvMinimal,
    TvMinimal: () => TvMinimal,
    TvMinimalPlay: () => TvMinimalPlay,
    Type: () => Type,
    TypeOutline: () => TypeOutline,
    Umbrella: () => Umbrella,
    UmbrellaOff: () => UmbrellaOff,
    Underline: () => Underline,
    Undo: () => Undo,
    Undo2: () => Undo2,
    UndoDot: () => UndoDot,
    UnfoldHorizontal: () => UnfoldHorizontal,
    UnfoldVertical: () => UnfoldVertical,
    Ungroup: () => Ungroup,
    University: () => University,
    Unlink: () => Unlink,
    Unlink2: () => Unlink2,
    Unlock: () => LockOpen,
    UnlockKeyhole: () => LockKeyholeOpen,
    Unplug: () => Unplug,
    Upload: () => Upload,
    UploadCloud: () => CloudUpload,
    Usb: () => Usb,
    UsbCPort: () => UsbCPort,
    User: () => User,
    User2: () => UserRound,
    UserCheck: () => UserCheck,
    UserCheck2: () => UserRoundCheck,
    UserCircle: () => CircleUser,
    UserCircle2: () => CircleUserRound,
    UserCog: () => UserCog,
    UserCog2: () => UserRoundCog,
    UserGroup: () => UserGroup,
    UserKey: () => UserKey,
    UserLock: () => UserLock,
    UserMinus: () => UserMinus,
    UserMinus2: () => UserRoundMinus,
    UserPen: () => UserPen,
    UserPlus: () => UserPlus,
    UserPlus2: () => UserRoundPlus,
    UserRound: () => UserRound,
    UserRoundArrowLeft: () => UserRoundArrowLeft,
    UserRoundCheck: () => UserRoundCheck,
    UserRoundCog: () => UserRoundCog,
    UserRoundGroup: () => UserRoundGroup,
    UserRoundKey: () => UserRoundKey,
    UserRoundMinus: () => UserRoundMinus,
    UserRoundPen: () => UserRoundPen,
    UserRoundPlus: () => UserRoundPlus,
    UserRoundSearch: () => UserRoundSearch,
    UserRoundShield: () => UserRoundShield,
    UserRoundStar: () => UserRoundStar,
    UserRoundX: () => UserRoundX,
    UserSearch: () => UserSearch,
    UserShield: () => UserShield,
    UserSquare: () => SquareUser,
    UserSquare2: () => SquareUserRound,
    UserStar: () => UserStar,
    UserX: () => UserX,
    UserX2: () => UserRoundX,
    Users: () => Users,
    Users2: () => UsersRound,
    UsersCollaboration: () => UsersCollaboration,
    UsersRound: () => UsersRound,
    UsersRoundCollaboration: () => UsersRoundCollaboration,
    Utensils: () => Utensils,
    UtensilsCrossed: () => UtensilsCrossed,
    UtilityPole: () => UtilityPole,
    Van: () => Van,
    Variable: () => Variable,
    Vault: () => Vault,
    VectorPolygon: () => VectorPolygon,
    VectorSquare: () => VectorSquare,
    Vegan: () => Vegan,
    VenetianMask: () => VenetianMask,
    Venus: () => Venus,
    VenusAndMars: () => VenusAndMars,
    Verified: () => BadgeCheck,
    Vibrate: () => Vibrate,
    VibrateOff: () => VibrateOff,
    Video: () => Video,
    VideoOff: () => VideoOff,
    Videotape: () => Videotape,
    View: () => View,
    Virus: () => Virus,
    VirusOff: () => VirusOff,
    Voicemail: () => Voicemail,
    Volleyball: () => Volleyball,
    Volume: () => Volume,
    Volume1: () => Volume1,
    Volume2: () => Volume2,
    VolumeOff: () => VolumeOff,
    VolumeX: () => VolumeX,
    Vote: () => Vote,
    Wallet: () => Wallet,
    Wallet2: () => WalletMinimal,
    WalletCards: () => WalletCards,
    WalletMinimal: () => WalletMinimal,
    Wallpaper: () => Wallpaper,
    Wand: () => Wand,
    Wand2: () => WandSparkles,
    WandSparkles: () => WandSparkles,
    Warehouse: () => Warehouse,
    WashingMachine: () => WashingMachine,
    Watch: () => Watch,
    Waves: () => WavesHorizontal,
    WavesArrowDown: () => WavesArrowDown,
    WavesArrowUp: () => WavesArrowUp,
    WavesHorizontal: () => WavesHorizontal,
    WavesLadder: () => WavesLadder,
    WavesVertical: () => WavesVertical,
    Waypoints: () => Waypoints,
    Webcam: () => Webcam,
    WebcamOff: () => WebcamOff,
    Webhook: () => Webhook,
    WebhookOff: () => WebhookOff,
    Weight: () => Weight,
    WeightTilde: () => WeightTilde,
    Wheat: () => Wheat,
    WheatOff: () => WheatOff,
    Whistle: () => Whistle,
    WholeWord: () => WholeWord,
    Wifi: () => Wifi,
    WifiCog: () => WifiCog,
    WifiHigh: () => WifiHigh,
    WifiLock: () => WifiLock,
    WifiLow: () => WifiLow,
    WifiOff: () => WifiOff,
    WifiPen: () => WifiPen,
    WifiSync: () => WifiSync,
    WifiZero: () => WifiZero,
    Wind: () => Wind,
    WindArrowDown: () => WindArrowDown,
    WindArrowUp: () => WindArrowUp,
    Wine: () => Wine,
    WineOff: () => WineOff,
    Workflow: () => Workflow,
    Worm: () => Worm,
    WrapText: () => TextWrap,
    Wrench: () => Wrench,
    WrenchOff: () => WrenchOff,
    X: () => X,
    XCircle: () => CircleX,
    XLineTop: () => XLineTop,
    XOctagon: () => OctagonX,
    XSquare: () => SquareX,
    Zap: () => Zap,
    ZapOff: () => ZapOff,
    ZodiacAquarius: () => ZodiacAquarius,
    ZodiacAries: () => ZodiacAries,
    ZodiacCancer: () => ZodiacCancer,
    ZodiacCapricorn: () => ZodiacCapricorn,
    ZodiacGemini: () => ZodiacGemini,
    ZodiacLeo: () => ZodiacLeo,
    ZodiacLibra: () => ZodiacLibra,
    ZodiacOphiuchus: () => ZodiacOphiuchus,
    ZodiacPisces: () => ZodiacPisces,
    ZodiacSagittarius: () => ZodiacSagittarius,
    ZodiacScorpio: () => ZodiacScorpio,
    ZodiacTaurus: () => ZodiacTaurus,
    ZodiacVirgo: () => ZodiacVirgo,
    ZoomIn: () => ZoomIn,
    ZoomOut: () => ZoomOut
  });

  // node_modules/lucide/dist/esm/icons/a-arrow-down.mjs
  var AArrowDown = [
    ["path", { d: "m14 12 4 4 4-4" }],
    ["path", { d: "M18 16V7" }],
    ["path", { d: "m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" }],
    ["path", { d: "M3.304 13h6.392" }]
  ];

  // node_modules/lucide/dist/esm/icons/a-arrow-up.mjs
  var AArrowUp = [
    ["path", { d: "m14 11 4-4 4 4" }],
    ["path", { d: "M18 16V7" }],
    ["path", { d: "m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" }],
    ["path", { d: "M3.304 13h6.392" }]
  ];

  // node_modules/lucide/dist/esm/icons/a-large-small.mjs
  var ALargeSmall = [
    ["path", { d: "m15 16 2.536-7.328a1.02 1.02 1 0 1 1.928 0L22 16" }],
    ["path", { d: "M15.697 14h5.606" }],
    ["path", { d: "m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" }],
    ["path", { d: "M3.304 13h6.392" }]
  ];

  // node_modules/lucide/dist/esm/icons/accessibility.mjs
  var Accessibility = [
    ["circle", { cx: "16", cy: "4", r: "1" }],
    ["path", { d: "m18 19 1-7-6 1" }],
    ["path", { d: "m5 8 3-3 5.5 3-2.36 3.5" }],
    ["path", { d: "M4.24 14.5a5 5 0 0 0 6.88 6" }],
    ["path", { d: "M13.76 17.5a5 5 0 0 0-6.88-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/activity.mjs
  var Activity = [
    [
      "path",
      {
        d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/ad.mjs
  var Ad = [
    ["path", { d: "M10 13H6" }],
    ["path", { d: "M10 15v-4a2 2 0 0 0-4 0v4" }],
    [
      "path",
      {
        d: "M14 14.5a.5.5 0 0 0 .5.5h1a2.5 2.5 0 0 0 2.5-2.5v-1A2.5 2.5 0 0 0 15.5 9h-1a.5.5 0 0 0-.5.5z"
      }
    ],
    ["rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/air-vent.mjs
  var AirVent = [
    ["path", { d: "M18 17.5a2.5 2.5 0 1 1-4 2.03V12" }],
    ["path", { d: "M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M6 8h12" }],
    ["path", { d: "M6.6 15.572A2 2 0 1 0 10 17v-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/airplay.mjs
  var Airplay = [
    ["path", { d: "M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" }],
    ["path", { d: "m12 15 5 6H7Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/alarm-clock-check.mjs
  var AlarmClockCheck = [
    ["circle", { cx: "12", cy: "13", r: "8" }],
    ["path", { d: "M5 3 2 6" }],
    ["path", { d: "m22 6-3-3" }],
    ["path", { d: "M6.38 18.7 4 21" }],
    ["path", { d: "M17.64 18.67 20 21" }],
    ["path", { d: "m9 13 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/alarm-clock-minus.mjs
  var AlarmClockMinus = [
    ["circle", { cx: "12", cy: "13", r: "8" }],
    ["path", { d: "M5 3 2 6" }],
    ["path", { d: "m22 6-3-3" }],
    ["path", { d: "M6.38 18.7 4 21" }],
    ["path", { d: "M17.64 18.67 20 21" }],
    ["path", { d: "M9 13h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/alarm-clock-off.mjs
  var AlarmClockOff = [
    ["path", { d: "M6.87 6.87a8 8 0 1 0 11.26 11.26" }],
    ["path", { d: "M19.9 14.25a8 8 0 0 0-9.15-9.15" }],
    ["path", { d: "m22 6-3-3" }],
    ["path", { d: "M6.26 18.67 4 21" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M4 4 2 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/alarm-clock-plus.mjs
  var AlarmClockPlus = [
    ["circle", { cx: "12", cy: "13", r: "8" }],
    ["path", { d: "M5 3 2 6" }],
    ["path", { d: "m22 6-3-3" }],
    ["path", { d: "M6.38 18.7 4 21" }],
    ["path", { d: "M17.64 18.67 20 21" }],
    ["path", { d: "M12 10v6" }],
    ["path", { d: "M9 13h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/alarm-clock.mjs
  var AlarmClock = [
    ["circle", { cx: "12", cy: "13", r: "8" }],
    ["path", { d: "M12 9v4l2 2" }],
    ["path", { d: "M5 3 2 6" }],
    ["path", { d: "m22 6-3-3" }],
    ["path", { d: "M6.38 18.7 4 21" }],
    ["path", { d: "M17.64 18.67 20 21" }]
  ];

  // node_modules/lucide/dist/esm/icons/alarm-smoke.mjs
  var AlarmSmoke = [
    ["path", { d: "M11 21c0-2.5 2-2.5 2-5" }],
    ["path", { d: "M16 21c0-2.5 2-2.5 2-5" }],
    ["path", { d: "m19 8-.8 3a1.25 1.25 0 0 1-1.2 1H7a1.25 1.25 0 0 1-1.2-1L5 8" }],
    ["path", { d: "M21 3a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z" }],
    ["path", { d: "M6 21c0-2.5 2-2.5 2-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-center-horizontal.mjs
  var AlignCenterHorizontal = [
    ["path", { d: "M2 12h20" }],
    ["path", { d: "M10 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" }],
    ["path", { d: "M10 8V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4" }],
    ["path", { d: "M20 16v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1" }],
    ["path", { d: "M14 8V7c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-center-vertical.mjs
  var AlignCenterVertical = [
    ["path", { d: "M12 2v20" }],
    ["path", { d: "M8 10H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h4" }],
    ["path", { d: "M16 10h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4" }],
    ["path", { d: "M8 20H7a2 2 0 0 1-2-2v-2c0-1.1.9-2 2-2h1" }],
    ["path", { d: "M16 14h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-end-horizontal.mjs
  var AlignEndHorizontal = [
    ["rect", { width: "6", height: "16", x: "4", y: "2", rx: "2" }],
    ["rect", { width: "6", height: "9", x: "14", y: "9", rx: "2" }],
    ["path", { d: "M22 22H2" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-end-vertical.mjs
  var AlignEndVertical = [
    ["rect", { width: "16", height: "6", x: "2", y: "4", rx: "2" }],
    ["rect", { width: "9", height: "6", x: "9", y: "14", rx: "2" }],
    ["path", { d: "M22 22V2" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-horizontal-distribute-center.mjs
  var AlignHorizontalDistributeCenter = [
    ["rect", { width: "6", height: "14", x: "4", y: "5", rx: "2" }],
    ["rect", { width: "6", height: "10", x: "14", y: "7", rx: "2" }],
    ["path", { d: "M17 22v-5" }],
    ["path", { d: "M17 7V2" }],
    ["path", { d: "M7 22v-3" }],
    ["path", { d: "M7 5V2" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-horizontal-distribute-end.mjs
  var AlignHorizontalDistributeEnd = [
    ["rect", { width: "6", height: "14", x: "4", y: "5", rx: "2" }],
    ["rect", { width: "6", height: "10", x: "14", y: "7", rx: "2" }],
    ["path", { d: "M10 2v20" }],
    ["path", { d: "M20 2v20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-horizontal-distribute-start.mjs
  var AlignHorizontalDistributeStart = [
    ["rect", { width: "6", height: "14", x: "4", y: "5", rx: "2" }],
    ["rect", { width: "6", height: "10", x: "14", y: "7", rx: "2" }],
    ["path", { d: "M4 2v20" }],
    ["path", { d: "M14 2v20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-horizontal-justify-center.mjs
  var AlignHorizontalJustifyCenter = [
    ["rect", { width: "6", height: "14", x: "2", y: "5", rx: "2" }],
    ["rect", { width: "6", height: "10", x: "16", y: "7", rx: "2" }],
    ["path", { d: "M12 2v20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-horizontal-justify-end.mjs
  var AlignHorizontalJustifyEnd = [
    ["rect", { width: "6", height: "14", x: "2", y: "5", rx: "2" }],
    ["rect", { width: "6", height: "10", x: "12", y: "7", rx: "2" }],
    ["path", { d: "M22 2v20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-horizontal-justify-start.mjs
  var AlignHorizontalJustifyStart = [
    ["rect", { width: "6", height: "14", x: "6", y: "5", rx: "2" }],
    ["rect", { width: "6", height: "10", x: "16", y: "7", rx: "2" }],
    ["path", { d: "M2 2v20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-horizontal-space-around.mjs
  var AlignHorizontalSpaceAround = [
    ["rect", { width: "6", height: "10", x: "9", y: "7", rx: "2" }],
    ["path", { d: "M4 22V2" }],
    ["path", { d: "M20 22V2" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-horizontal-space-between.mjs
  var AlignHorizontalSpaceBetween = [
    ["rect", { width: "6", height: "14", x: "3", y: "5", rx: "2" }],
    ["rect", { width: "6", height: "10", x: "15", y: "7", rx: "2" }],
    ["path", { d: "M3 2v20" }],
    ["path", { d: "M21 2v20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-start-horizontal.mjs
  var AlignStartHorizontal = [
    ["rect", { width: "6", height: "16", x: "4", y: "6", rx: "2" }],
    ["rect", { width: "6", height: "9", x: "14", y: "6", rx: "2" }],
    ["path", { d: "M22 2H2" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-start-vertical.mjs
  var AlignStartVertical = [
    ["rect", { width: "9", height: "6", x: "6", y: "14", rx: "2" }],
    ["rect", { width: "16", height: "6", x: "6", y: "4", rx: "2" }],
    ["path", { d: "M2 2v20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-vertical-distribute-center.mjs
  var AlignVerticalDistributeCenter = [
    ["path", { d: "M22 17h-3" }],
    ["path", { d: "M22 7h-5" }],
    ["path", { d: "M5 17H2" }],
    ["path", { d: "M7 7H2" }],
    ["rect", { x: "5", y: "14", width: "14", height: "6", rx: "2" }],
    ["rect", { x: "7", y: "4", width: "10", height: "6", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-vertical-distribute-end.mjs
  var AlignVerticalDistributeEnd = [
    ["rect", { width: "14", height: "6", x: "5", y: "14", rx: "2" }],
    ["rect", { width: "10", height: "6", x: "7", y: "4", rx: "2" }],
    ["path", { d: "M2 20h20" }],
    ["path", { d: "M2 10h20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-vertical-distribute-start.mjs
  var AlignVerticalDistributeStart = [
    ["rect", { width: "14", height: "6", x: "5", y: "14", rx: "2" }],
    ["rect", { width: "10", height: "6", x: "7", y: "4", rx: "2" }],
    ["path", { d: "M2 14h20" }],
    ["path", { d: "M2 4h20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-vertical-justify-center.mjs
  var AlignVerticalJustifyCenter = [
    ["rect", { width: "14", height: "6", x: "5", y: "16", rx: "2" }],
    ["rect", { width: "10", height: "6", x: "7", y: "2", rx: "2" }],
    ["path", { d: "M2 12h20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-vertical-justify-end.mjs
  var AlignVerticalJustifyEnd = [
    ["rect", { width: "14", height: "6", x: "5", y: "12", rx: "2" }],
    ["rect", { width: "10", height: "6", x: "7", y: "2", rx: "2" }],
    ["path", { d: "M2 22h20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-vertical-justify-start.mjs
  var AlignVerticalJustifyStart = [
    ["rect", { width: "14", height: "6", x: "5", y: "16", rx: "2" }],
    ["rect", { width: "10", height: "6", x: "7", y: "6", rx: "2" }],
    ["path", { d: "M2 2h20" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-vertical-space-around.mjs
  var AlignVerticalSpaceAround = [
    ["rect", { width: "10", height: "6", x: "7", y: "9", rx: "2" }],
    ["path", { d: "M22 20H2" }],
    ["path", { d: "M22 4H2" }]
  ];

  // node_modules/lucide/dist/esm/icons/align-vertical-space-between.mjs
  var AlignVerticalSpaceBetween = [
    ["rect", { width: "14", height: "6", x: "5", y: "15", rx: "2" }],
    ["rect", { width: "10", height: "6", x: "7", y: "3", rx: "2" }],
    ["path", { d: "M2 21h20" }],
    ["path", { d: "M2 3h20" }]
  ];

  // node_modules/lucide/dist/esm/icons/ampersand.mjs
  var Ampersand = [
    ["path", { d: "M16 12h3" }],
    [
      "path",
      {
        d: "M17.5 12a8 8 0 0 1-8 8A4.5 4.5 0 0 1 5 15.5c0-6 8-4 8-8.5a3 3 0 1 0-6 0c0 3 2.5 8.5 12 13"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/ambulance.mjs
  var Ambulance = [
    ["path", { d: "M10 10H6" }],
    ["path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }],
    [
      "path",
      {
        d: "M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"
      }
    ],
    ["path", { d: "M8 8v4" }],
    ["path", { d: "M9 18h6" }],
    ["circle", { cx: "17", cy: "18", r: "2" }],
    ["circle", { cx: "7", cy: "18", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/ampersands.mjs
  var Ampersands = [
    [
      "path",
      { d: "M10 17c-5-3-7-7-7-9a2 2 0 0 1 4 0c0 2.5-5 2.5-5 6 0 1.7 1.3 3 3 3 2.8 0 5-2.2 5-5" }
    ],
    [
      "path",
      { d: "M22 17c-5-3-7-7-7-9a2 2 0 0 1 4 0c0 2.5-5 2.5-5 6 0 1.7 1.3 3 3 3 2.8 0 5-2.2 5-5" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/amphora.mjs
  var Amphora = [
    ["path", { d: "M10 2v5.632c0 .424-.272.795-.653.982A6 6 0 0 0 6 14c.006 4 3 7 5 8" }],
    ["path", { d: "M10 5H8a2 2 0 0 0 0 4h.68" }],
    ["path", { d: "M14 2v5.632c0 .424.272.795.652.982A6 6 0 0 1 18 14c0 4-3 7-5 8" }],
    ["path", { d: "M14 5h2a2 2 0 0 1 0 4h-.68" }],
    ["path", { d: "M18 22H6" }],
    ["path", { d: "M9 2h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/anchor.mjs
  var Anchor = [
    ["path", { d: "M12 6v16" }],
    ["path", { d: "m19 13 2-1a9 9 0 0 1-18 0l2 1" }],
    ["path", { d: "M9 11h6" }],
    ["circle", { cx: "12", cy: "4", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/angle.mjs
  var Angle = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M3 11a10 10 0 0 1 10 10" }]
  ];

  // node_modules/lucide/dist/esm/icons/antenna.mjs
  var Antenna = [
    ["path", { d: "M2 12 7 2" }],
    ["path", { d: "m7 12 5-10" }],
    ["path", { d: "m12 12 5-10" }],
    ["path", { d: "m17 12 5-10" }],
    ["path", { d: "M4.5 7h15" }],
    ["path", { d: "M12 16v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/aperture.mjs
  var Aperture = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m14.31 8 5.74 9.94" }],
    ["path", { d: "M9.69 8h11.48" }],
    ["path", { d: "m7.38 12 5.74-9.94" }],
    ["path", { d: "M9.69 16 3.95 6.06" }],
    ["path", { d: "M14.31 16H2.83" }],
    ["path", { d: "m16.62 12-5.74 9.94" }]
  ];

  // node_modules/lucide/dist/esm/icons/anvil.mjs
  var Anvil = [
    ["path", { d: "M7 10H6a4 4 0 0 1-4-4 1 1 0 0 1 1-1h4" }],
    ["path", { d: "M7 5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1 7 7 0 0 1-7 7H8a1 1 0 0 1-1-1z" }],
    ["path", { d: "M9 12v5" }],
    ["path", { d: "M15 12v5" }],
    ["path", { d: "M5 20a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3 1 1 0 0 1-1 1H6a1 1 0 0 1-1-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/app-window-mac.mjs
  var AppWindowMac = [
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
    ["path", { d: "M6 8h.01" }],
    ["path", { d: "M10 8h.01" }],
    ["path", { d: "M14 8h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/app-window.mjs
  var AppWindow = [
    ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }],
    ["path", { d: "M10 4v4" }],
    ["path", { d: "M2 8h20" }],
    ["path", { d: "M6 4v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/apple.mjs
  var Apple = [
    ["path", { d: "M12 6.528V3a1 1 0 0 1 1-1h0" }],
    [
      "path",
      {
        d: "M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/archive-arrow-down.mjs
  var ArchiveArrowDown = [
    ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1" }],
    ["path", { d: "M4 8v11a2 2 0 0 0 2 2h.343" }],
    ["path", { d: "M20 8v11a2 2 0 0 1-2 2h-.343" }],
    ["path", { d: "m9 18 3 3 3-3" }],
    ["path", { d: "M12 12v9" }]
  ];

  // node_modules/lucide/dist/esm/icons/archive-arrow-up.mjs
  var ArchiveArrowUp = [
    ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1" }],
    ["path", { d: "M4 8v11a2 2 0 0 0 2 2h2" }],
    ["path", { d: "M20 8v11a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "m9 15 3-3 3 3" }],
    ["path", { d: "M12 12v9" }]
  ];

  // node_modules/lucide/dist/esm/icons/archive-x.mjs
  var ArchiveX = [
    ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1" }],
    ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }],
    ["path", { d: "m9.5 17 5-5" }],
    ["path", { d: "m9.5 12 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/archive.mjs
  var Archive = [
    ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1" }],
    ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }],
    ["path", { d: "M10 12h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/armchair.mjs
  var Armchair = [
    ["path", { d: "M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" }],
    [
      "path",
      {
        d: "M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"
      }
    ],
    ["path", { d: "M5 18v2" }],
    ["path", { d: "M19 18v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/armenian-dram.mjs
  var ArmenianDram = [
    ["path", { d: "M11 10h8" }],
    ["path", { d: "M11 14h8" }],
    ["path", { d: "M17 20V10a6 6 0 0 0-12 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-big-down-dash.mjs
  var ArrowBigDownDash = [
    [
      "path",
      {
        d: "M14 8a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h3.293a.707.707 0 0 1 .5 1.207l-6.939 6.939a1.207 1.207 0 0 1-1.708 0l-6.94-6.94a.707.707 0 0 1 .5-1.206H8a1 1 0 0 0 1-1V9a1 1 0 0 1 1-1z"
      }
    ],
    ["path", { d: "M9 4h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-big-down.mjs
  var ArrowBigDown = [
    [
      "path",
      {
        d: "M9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 0 1 1h3.293a.707.707 0 0 1 .5 1.207l-7.086 7.086a1 1 0 0 1-1.414 0l-7.086-7.086a.707.707 0 0 1 .5-1.207H8a1 1 0 0 0 1-1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-big-left-dash.mjs
  var ArrowBigLeftDash = [
    [
      "path",
      {
        d: "M13 9a1 1 0 0 1-1-1V4.707a.707.707 0 0 0-1.207-.5l-6.94 6.94a1.207 1.207 0 0 0 0 1.707l6.94 6.94a.707.707 0 0 0 1.207-.5V16a1 1 0 0 1 1-1h2a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z"
      }
    ],
    ["path", { d: "M20 9v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-big-left.mjs
  var ArrowBigLeft = [
    [
      "path",
      {
        d: "M10.793 19.793a.707.707 0 0 0 1.207-.5V16a1 1 0 0 1 1-1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-6a1 1 0 0 1-1-1V4.707a.707.707 0 0 0-1.207-.5l-6.94 6.94a1.207 1.207 0 0 0 0 1.707z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-big-right-dash.mjs
  var ArrowBigRightDash = [
    [
      "path",
      {
        d: "M11 9a1 1 0 0 0 1-1V4.707a.707.707 0 0 1 1.207-.5l6.94 6.94a1.207 1.207 0 0 1 0 1.707l-6.94 6.94a.707.707 0 0 1-1.207-.5V16a1 1 0 0 0-1-1H9a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"
      }
    ],
    ["path", { d: "M4 9v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-big-right.mjs
  var ArrowBigRight = [
    [
      "path",
      {
        d: "M13.207 19.793a.707.707 0 0 1-1.207-.5V16a1 1 0 0 0-1-1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h6a1 1 0 0 0 1-1V4.707a.707.707 0 0 1 1.207-.5l6.94 6.94a1.207 1.207 0 0 1 0 1.707z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-big-up-dash.mjs
  var ArrowBigUpDash = [
    [
      "path",
      {
        d: "M14 16a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1h3.293a.707.707 0 0 0 .5-1.207l-6.939-6.939a1.207 1.207 0 0 0-1.708 0l-6.94 6.94a.707.707 0 0 0 .5 1.206H8a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1z"
      }
    ],
    ["path", { d: "M9 20h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-big-up.mjs
  var ArrowBigUp = [
    [
      "path",
      {
        d: "M9 19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-6a1 1 0 0 1 1-1h3.293a.707.707 0 0 0 .5-1.207l-7.086-7.086a1 1 0 0 0-1.414 0l-7.086 7.086a.707.707 0 0 0 .5 1.207H8a1 1 0 0 1 1 1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-0-1.mjs
  var ArrowDown01 = [
    ["path", { d: "m3 16 4 4 4-4" }],
    ["path", { d: "M7 20V4" }],
    ["rect", { x: "15", y: "4", width: "4", height: "6", ry: "2" }],
    ["path", { d: "M17 20v-6h-2" }],
    ["path", { d: "M15 20h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-1-0.mjs
  var ArrowDown10 = [
    ["path", { d: "m3 16 4 4 4-4" }],
    ["path", { d: "M7 20V4" }],
    ["path", { d: "M17 10V4h-2" }],
    ["path", { d: "M15 10h4" }],
    ["rect", { x: "15", y: "14", width: "4", height: "6", ry: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-a-z.mjs
  var ArrowDownAZ = [
    ["path", { d: "m3 16 4 4 4-4" }],
    ["path", { d: "M7 20V4" }],
    ["path", { d: "M20 8h-5" }],
    ["path", { d: "M15 10V6.5a2.5 2.5 0 0 1 5 0V10" }],
    ["path", { d: "M15 14h5l-5 6h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-from-line.mjs
  var ArrowDownFromLine = [
    ["path", { d: "M19 3H5" }],
    ["path", { d: "M12 21V7" }],
    ["path", { d: "m6 15 6 6 6-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-left.mjs
  var ArrowDownLeft = [
    ["path", { d: "M17 7 7 17" }],
    ["path", { d: "M17 17H7V7" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-narrow-wide.mjs
  var ArrowDownNarrowWide = [
    ["path", { d: "m3 16 4 4 4-4" }],
    ["path", { d: "M7 20V4" }],
    ["path", { d: "M11 4h4" }],
    ["path", { d: "M11 8h7" }],
    ["path", { d: "M11 12h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-right.mjs
  var ArrowDownRight = [
    ["path", { d: "m7 7 10 10" }],
    ["path", { d: "M17 7v10H7" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-to-dot.mjs
  var ArrowDownToDot = [
    ["path", { d: "M12 2v14" }],
    ["path", { d: "m19 9-7 7-7-7" }],
    ["circle", { cx: "12", cy: "21", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-to-line.mjs
  var ArrowDownToLine = [
    ["path", { d: "M12 17V3" }],
    ["path", { d: "m6 11 6 6 6-6" }],
    ["path", { d: "M19 21H5" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-up.mjs
  var ArrowDownUp = [
    ["path", { d: "m3 16 4 4 4-4" }],
    ["path", { d: "M7 20V4" }],
    ["path", { d: "m21 8-4-4-4 4" }],
    ["path", { d: "M17 4v16" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-wide-narrow.mjs
  var ArrowDownWideNarrow = [
    ["path", { d: "m3 16 4 4 4-4" }],
    ["path", { d: "M7 20V4" }],
    ["path", { d: "M11 4h10" }],
    ["path", { d: "M11 8h7" }],
    ["path", { d: "M11 12h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down-z-a.mjs
  var ArrowDownZA = [
    ["path", { d: "m3 16 4 4 4-4" }],
    ["path", { d: "M7 4v16" }],
    ["path", { d: "M15 4h5l-5 6h5" }],
    ["path", { d: "M15 20v-3.5a2.5 2.5 0 0 1 5 0V20" }],
    ["path", { d: "M20 18h-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-down.mjs
  var ArrowDown = [
    ["path", { d: "M12 5v14" }],
    ["path", { d: "m19 12-7 7-7-7" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-left-from-line.mjs
  var ArrowLeftFromLine = [
    ["path", { d: "m9 6-6 6 6 6" }],
    ["path", { d: "M3 12h14" }],
    ["path", { d: "M21 19V5" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-left-right.mjs
  var ArrowLeftRight = [
    ["path", { d: "M8 3 4 7l4 4" }],
    ["path", { d: "M4 7h16" }],
    ["path", { d: "m16 21 4-4-4-4" }],
    ["path", { d: "M20 17H4" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-left-to-line.mjs
  var ArrowLeftToLine = [
    ["path", { d: "M3 19V5" }],
    ["path", { d: "m13 6-6 6 6 6" }],
    ["path", { d: "M7 12h14" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-left.mjs
  var ArrowLeft = [
    ["path", { d: "m12 19-7-7 7-7" }],
    ["path", { d: "M19 12H5" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-right-from-line.mjs
  var ArrowRightFromLine = [
    ["path", { d: "M3 5v14" }],
    ["path", { d: "M21 12H7" }],
    ["path", { d: "m15 18 6-6-6-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-right-left.mjs
  var ArrowRightLeft = [
    ["path", { d: "m16 3 4 4-4 4" }],
    ["path", { d: "M20 7H4" }],
    ["path", { d: "m8 21-4-4 4-4" }],
    ["path", { d: "M4 17h16" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-right-to-line.mjs
  var ArrowRightToLine = [
    ["path", { d: "M17 12H3" }],
    ["path", { d: "m11 18 6-6-6-6" }],
    ["path", { d: "M21 5v14" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-right.mjs
  var ArrowRight = [
    ["path", { d: "M5 12h14" }],
    ["path", { d: "m12 5 7 7-7 7" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-0-1.mjs
  var ArrowUp01 = [
    ["path", { d: "m3 8 4-4 4 4" }],
    ["path", { d: "M7 4v16" }],
    ["rect", { x: "15", y: "4", width: "4", height: "6", ry: "2" }],
    ["path", { d: "M17 20v-6h-2" }],
    ["path", { d: "M15 20h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-1-0.mjs
  var ArrowUp10 = [
    ["path", { d: "m3 8 4-4 4 4" }],
    ["path", { d: "M7 4v16" }],
    ["path", { d: "M17 10V4h-2" }],
    ["path", { d: "M15 10h4" }],
    ["rect", { x: "15", y: "14", width: "4", height: "6", ry: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-a-z.mjs
  var ArrowUpAZ = [
    ["path", { d: "m3 8 4-4 4 4" }],
    ["path", { d: "M7 4v16" }],
    ["path", { d: "M20 8h-5" }],
    ["path", { d: "M15 10V6.5a2.5 2.5 0 0 1 5 0V10" }],
    ["path", { d: "M15 14h5l-5 6h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-down.mjs
  var ArrowUpDown = [
    ["path", { d: "m21 16-4 4-4-4" }],
    ["path", { d: "M17 20V4" }],
    ["path", { d: "m3 8 4-4 4 4" }],
    ["path", { d: "M7 4v16" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-from-dot.mjs
  var ArrowUpFromDot = [
    ["path", { d: "m5 9 7-7 7 7" }],
    ["path", { d: "M12 16V2" }],
    ["circle", { cx: "12", cy: "21", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-from-line.mjs
  var ArrowUpFromLine = [
    ["path", { d: "m18 9-6-6-6 6" }],
    ["path", { d: "M12 3v14" }],
    ["path", { d: "M5 21h14" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-left.mjs
  var ArrowUpLeft = [
    ["path", { d: "M7 17V7h10" }],
    ["path", { d: "M17 17 7 7" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-right.mjs
  var ArrowUpRight = [
    ["path", { d: "M7 7h10v10" }],
    ["path", { d: "M7 17 17 7" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-narrow-wide.mjs
  var ArrowUpNarrowWide = [
    ["path", { d: "m3 8 4-4 4 4" }],
    ["path", { d: "M7 4v16" }],
    ["path", { d: "M11 12h4" }],
    ["path", { d: "M11 16h7" }],
    ["path", { d: "M11 20h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-to-line.mjs
  var ArrowUpToLine = [
    ["path", { d: "M5 3h14" }],
    ["path", { d: "m18 13-6-6-6 6" }],
    ["path", { d: "M12 7v14" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-z-a.mjs
  var ArrowUpZA = [
    ["path", { d: "m3 8 4-4 4 4" }],
    ["path", { d: "M7 4v16" }],
    ["path", { d: "M15 4h5l-5 6h5" }],
    ["path", { d: "M15 20v-3.5a2.5 2.5 0 0 1 5 0V20" }],
    ["path", { d: "M20 18h-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up-wide-narrow.mjs
  var ArrowUpWideNarrow = [
    ["path", { d: "m3 8 4-4 4 4" }],
    ["path", { d: "M7 4v16" }],
    ["path", { d: "M11 12h10" }],
    ["path", { d: "M11 16h7" }],
    ["path", { d: "M11 20h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrows-up-from-line.mjs
  var ArrowsUpFromLine = [
    ["path", { d: "m4 6 3-3 3 3" }],
    ["path", { d: "M7 17V3" }],
    ["path", { d: "m14 6 3-3 3 3" }],
    ["path", { d: "M17 17V3" }],
    ["path", { d: "M4 21h16" }]
  ];

  // node_modules/lucide/dist/esm/icons/asterisk.mjs
  var Asterisk = [
    ["path", { d: "M12 5v14" }],
    ["path", { d: "m18.065 8.496-12.125 7" }],
    ["path", { d: "m5.94 8.504 12.125 7" }]
  ];

  // node_modules/lucide/dist/esm/icons/arrow-up.mjs
  var ArrowUp = [
    ["path", { d: "m5 12 7-7 7 7" }],
    ["path", { d: "M12 19V5" }]
  ];

  // node_modules/lucide/dist/esm/icons/astroid.mjs
  var Astroid = [
    [
      "path",
      {
        d: "M12.983 21.186a1 1 0 0 1-1.966 0 10 10 0 0 0-8.203-8.203 1 1 0 0 1 0-1.966 10 10 0 0 0 8.203-8.203 1 1 0 0 1 1.966 0 10 10 0 0 0 8.203 8.203 1 1 0 0 1 0 1.966 10 10 0 0 0-8.203 8.203"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/at-sign.mjs
  var AtSign = [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["path", { d: "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" }]
  ];

  // node_modules/lucide/dist/esm/icons/atom.mjs
  var Atom = [
    ["circle", { cx: "12", cy: "12", r: "1" }],
    [
      "path",
      {
        d: "M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"
      }
    ],
    [
      "path",
      {
        d: "M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/audio-lines-off.mjs
  var AudioLinesOff = [
    ["path", { d: "M10 10v11" }],
    ["path", { d: "M10 3v1.35" }],
    ["path", { d: "M14 14v1" }],
    ["path", { d: "M14 8v.35" }],
    ["path", { d: "M18 5v7.35" }],
    ["path", { d: "M2 10v3" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M22 10v3" }],
    ["path", { d: "M6 6v11" }]
  ];

  // node_modules/lucide/dist/esm/icons/audio-lines-x.mjs
  var AudioLinesX = [
    ["path", { d: "M10 3v18" }],
    ["path", { d: "M14 8v6.35" }],
    ["path", { d: "m17 17 5 5" }],
    ["path", { d: "M18 5v8.1" }],
    ["path", { d: "M2 10v3" }],
    ["path", { d: "M22 10v3" }],
    ["path", { d: "m22 17-5 5" }],
    ["path", { d: "M6 6v11" }]
  ];

  // node_modules/lucide/dist/esm/icons/audio-lines.mjs
  var AudioLines = [
    ["path", { d: "M2 10v3" }],
    ["path", { d: "M6 6v11" }],
    ["path", { d: "M10 3v18" }],
    ["path", { d: "M14 8v7" }],
    ["path", { d: "M18 5v13" }],
    ["path", { d: "M22 10v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/audio-waveform.mjs
  var AudioWaveform = [
    [
      "path",
      {
        d: "M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/avocado.mjs
  var Avocado = [
    [
      "path",
      {
        d: "M13.465 3.464a5 5 0 017.07 0 5 5 0 010 7.072c-1.204 1.203-2.38 2.89-2.614 4.577A8 8 0 118.886 6.08c1.687-.235 3.375-1.41 4.579-2.615"
      }
    ],
    ["circle", { cx: "10", cy: "14", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/award.mjs
  var Award = [
    [
      "path",
      {
        d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"
      }
    ],
    ["circle", { cx: "12", cy: "8", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/axe.mjs
  var Axe = [
    ["path", { d: "m14 12-8.381 8.38a1 1 0 0 1-3.001-3L11 9" }],
    [
      "path",
      {
        d: "M15 15.5a.5.5 0 0 0 .5.5A6.5 6.5 0 0 0 22 9.5a.5.5 0 0 0-.5-.5h-1.672a2 2 0 0 1-1.414-.586l-5.062-5.062a1.205 1.205 0 0 0-1.704 0L9.352 5.648a1.205 1.205 0 0 0 0 1.704l5.062 5.062A2 2 0 0 1 15 13.828z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/axis-3d.mjs
  var Axis3d = [
    ["path", { d: "M13.5 10.5 15 9" }],
    ["path", { d: "M4 4v15a1 1 0 0 0 1 1h15" }],
    ["path", { d: "M4.293 19.707 6 18" }],
    ["path", { d: "m9 15 1.5-1.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/azerbaijani-manat.mjs
  var AzerbaijaniManat = [
    ["path", { d: "M12 4v16" }],
    ["path", { d: "M18 20v-8a6 6 0 00-12 0v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/baby.mjs
  var Baby = [
    ["path", { d: "M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" }],
    ["path", { d: "M15 12h.01" }],
    [
      "path",
      {
        d: "M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"
      }
    ],
    ["path", { d: "M9 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/backpack.mjs
  var Backpack = [
    ["path", { d: "M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" }],
    ["path", { d: "M8 10h8" }],
    ["path", { d: "M8 18h8" }],
    ["path", { d: "M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" }],
    ["path", { d: "M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-cent.mjs
  var BadgeCent = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { d: "M12 7v10" }],
    ["path", { d: "M15.4 10a4 4 0 1 0 0 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/bacon.mjs
  var Bacon = [
    [
      "path",
      {
        d: "M2.795 16.804c-.789-.79-1.09-2.018-.442-2.928 1.933-2.713 4.414-1.05 6.145-5.378 1.868-4.67 4.608-2.366 6.592-6.107.218-.412.78-.53 1.11-.2l5.005 5.005c.789.79 1.09 2.018.442 2.928-1.933 2.713-4.414 1.05-6.145 5.378-1.868 4.67-4.608 2.366-6.591 6.107-.22.412-.78.53-1.11.2z"
      }
    ],
    ["path", { d: "M4.5 18.5c2-5 5-2 7-7s5-2 7-7" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-check.mjs
  var BadgeCheck = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { d: "m16 9-5.5 5.5L8 12" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-dollar-sign.mjs
  var BadgeDollarSign = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" }],
    ["path", { d: "M12 18V6" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-euro.mjs
  var BadgeEuro = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { d: "M7 12h5" }],
    ["path", { d: "M15 9.4a4 4 0 1 0 0 5.2" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-exclamation-point.mjs
  var BadgeExclamationPoint = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-indian-rupee.mjs
  var BadgeIndianRupee = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { d: "M8 8h8" }],
    ["path", { d: "M8 12h8" }],
    ["path", { d: "m13 17-5-1h1a4 4 0 0 0 0-8" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-minus.mjs
  var BadgeMinus = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["line", { x1: "8", x2: "16", y1: "12", y2: "12" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-info.mjs
  var BadgeInfo = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["line", { x1: "12", x2: "12", y1: "16", y2: "12" }],
    ["line", { x1: "12", x2: "12.01", y1: "8", y2: "8" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-japanese-yen.mjs
  var BadgeJapaneseYen = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { d: "m9 8 3 3v7" }],
    ["path", { d: "m12 11 3-3" }],
    ["path", { d: "M9 12h6" }],
    ["path", { d: "M9 16h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-percent.mjs
  var BadgePercent = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { d: "m15 9-6 6" }],
    ["path", { d: "M9 9h.01" }],
    ["path", { d: "M15 15h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-plus.mjs
  var BadgePlus = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "16" }],
    ["line", { x1: "8", x2: "16", y1: "12", y2: "12" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-pound-sterling.mjs
  var BadgePoundSterling = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { d: "M8 12h4" }],
    ["path", { d: "M10 16V9.5a2.5 2.5 0 0 1 5 0" }],
    ["path", { d: "M8 16h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-question-mark.mjs
  var BadgeQuestionMark = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }],
    ["line", { x1: "12", x2: "12.01", y1: "17", y2: "17" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-russian-ruble.mjs
  var BadgeRussianRuble = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { d: "M9 16h5" }],
    ["path", { d: "M9 12h5a2 2 0 1 0 0-4h-3v9" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-swiss-franc.mjs
  var BadgeSwissFranc = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { d: "M11 17V8h4" }],
    ["path", { d: "M11 12h3" }],
    ["path", { d: "M9 16h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge-turkish-lira.mjs
  var BadgeTurkishLira = [
    ["path", { d: "M11 7v10a5 5 0 0 0 5-5" }],
    ["path", { d: "m15 8-6 3" }],
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/badge-x.mjs
  var BadgeX = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["line", { x1: "15", x2: "9", y1: "9", y2: "15" }],
    ["line", { x1: "9", x2: "15", y1: "9", y2: "15" }]
  ];

  // node_modules/lucide/dist/esm/icons/badge.mjs
  var Badge = [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/ball-wave.mjs
  var BallWave = [
    [
      "path",
      {
        d: "M2 20c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
      }
    ],
    ["path", { d: "M7.757 13.243a2 6 45 1 0 8.486-8.486 2 6 45 1 0-8.486 8.486" }],
    ["circle", { cx: "12", cy: "9", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/baggage-claim.mjs
  var BaggageClaim = [
    ["path", { d: "M22 18H6a2 2 0 0 1-2-2V7a2 2 0 0 0-2-2" }],
    ["path", { d: "M17 14V4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v10" }],
    ["rect", { width: "13", height: "8", x: "8", y: "6", rx: "1" }],
    ["circle", { cx: "18", cy: "20", r: "2" }],
    ["circle", { cx: "9", cy: "20", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/balloon.mjs
  var Balloon = [
    ["path", { d: "M12 16v1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v1" }],
    ["path", { d: "M12 6a2 2 0 0 1 2 2" }],
    ["path", { d: "M18 8c0 4-3.5 8-6 8s-6-4-6-8a6 6 0 0 1 12 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/ban.mjs
  var Ban = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M4.929 4.929 19.07 19.071" }]
  ];

  // node_modules/lucide/dist/esm/icons/banana.mjs
  var Banana = [
    ["path", { d: "M4 13c3.5-2 8-2 10 2a5.5 5.5 0 0 1 8 5" }],
    [
      "path",
      {
        d: "M5.15 17.89c5.52-1.52 8.65-6.89 7-12C11.55 4 11.5 2 13 2c3.22 0 5 5.5 5 8 0 6.5-4.2 12-10.49 12C5.11 22 2 22 2 20c0-1.5 1.14-1.55 3.15-2.11Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/bandage.mjs
  var Bandage = [
    ["path", { d: "M10 10.01h.01" }],
    ["path", { d: "M10 14.01h.01" }],
    ["path", { d: "M14 10.01h.01" }],
    ["path", { d: "M14 14.01h.01" }],
    ["path", { d: "M18 6v12" }],
    ["path", { d: "M6 6v12" }],
    ["rect", { x: "2", y: "6", width: "20", height: "12", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/banknote-arrow-down.mjs
  var BanknoteArrowDown = [
    ["path", { d: "M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" }],
    ["path", { d: "m16 19 3 3 3-3" }],
    ["path", { d: "M18 12h.01" }],
    ["path", { d: "M19 16v6" }],
    ["path", { d: "M6 12h.01" }],
    ["circle", { cx: "12", cy: "12", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/bangladeshi-taka.mjs
  var BangladeshiTaka = [
    ["path", { d: "M6 5a2 2 0 0 1 4 0v12a4 4 0 0 0 8 0 2 2 0 0 0-4 0" }],
    ["path", { d: "M6 9h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/banknote-arrow-up.mjs
  var BanknoteArrowUp = [
    ["path", { d: "M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" }],
    ["path", { d: "M18 12h.01" }],
    ["path", { d: "M19 22v-6" }],
    ["path", { d: "m22 19-3-3-3 3" }],
    ["path", { d: "M6 12h.01" }],
    ["circle", { cx: "12", cy: "12", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/banknote-check.mjs
  var BanknoteCheck = [
    ["path", { d: "M11.748 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4.875" }],
    ["path", { d: "m16 19 2 2 4-4" }],
    ["path", { d: "M18 12h.01" }],
    ["path", { d: "M6 12h.01" }],
    ["circle", { cx: "12", cy: "12", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/banknote-x.mjs
  var BanknoteX = [
    ["path", { d: "M13 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" }],
    ["path", { d: "m17 17 5 5" }],
    ["path", { d: "M18 12h.01" }],
    ["path", { d: "m22 17-5 5" }],
    ["path", { d: "M6 12h.01" }],
    ["circle", { cx: "12", cy: "12", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/banknote.mjs
  var Banknote = [
    ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2" }],
    ["circle", { cx: "12", cy: "12", r: "2" }],
    ["path", { d: "M6 12h.01M18 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/barcode.mjs
  var Barcode = [
    ["path", { d: "M3 5v14" }],
    ["path", { d: "M8 5v14" }],
    ["path", { d: "M12 5v14" }],
    ["path", { d: "M17 5v14" }],
    ["path", { d: "M21 5v14" }]
  ];

  // node_modules/lucide/dist/esm/icons/barrel.mjs
  var Barrel = [
    ["path", { d: "M10.5 2a34.5 34.5 0 000 20" }],
    ["path", { d: "M13.5 2a34.5 34.5 0 010 20" }],
    ["path", { d: "M4.67 17h14.67" }],
    ["path", { d: "M4.67 7h14.67" }],
    [
      "path",
      {
        d: "M6.23 3.06a19 19 0 000 17.88A2 2 0 008 22h8a2 2 0 001.77-1.06 19 19 0 000-17.88A2 2 0 0016 2H8a2 2 0 00-1.77 1.06"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/baseline.mjs
  var Baseline = [
    ["path", { d: "M4 20h16" }],
    ["path", { d: "m6 16 6-12 6 12" }],
    ["path", { d: "M8 12h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/bath.mjs
  var Bath = [
    ["path", { d: "M10 4 8 6" }],
    ["path", { d: "M17 19v2" }],
    ["path", { d: "M2 12h20" }],
    ["path", { d: "M7 19v2" }],
    ["path", { d: "M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/battery-exclamation-point.mjs
  var BatteryExclamationPoint = [
    ["path", { d: "M10 17h.01" }],
    ["path", { d: "M10 7v6" }],
    ["path", { d: "M14 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M22 14v-4" }],
    ["path", { d: "M6 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/battery-charging.mjs
  var BatteryCharging = [
    ["path", { d: "m11 7-3 5h4l-3 5" }],
    ["path", { d: "M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" }],
    ["path", { d: "M22 14v-4" }],
    ["path", { d: "M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" }]
  ];

  // node_modules/lucide/dist/esm/icons/battery-full.mjs
  var BatteryFull = [
    ["path", { d: "M10 10v4" }],
    ["path", { d: "M14 10v4" }],
    ["path", { d: "M22 14v-4" }],
    ["path", { d: "M6 10v4" }],
    ["rect", { x: "2", y: "6", width: "16", height: "12", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/battery-low.mjs
  var BatteryLow = [
    ["path", { d: "M22 14v-4" }],
    ["path", { d: "M6 14v-4" }],
    ["rect", { x: "2", y: "6", width: "16", height: "12", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/battery-medium.mjs
  var BatteryMedium = [
    ["path", { d: "M10 14v-4" }],
    ["path", { d: "M22 14v-4" }],
    ["path", { d: "M6 14v-4" }],
    ["rect", { x: "2", y: "6", width: "16", height: "12", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/battery-plus.mjs
  var BatteryPlus = [
    ["path", { d: "M10 9v6" }],
    ["path", { d: "M12.543 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.605" }],
    ["path", { d: "M22 14v-4" }],
    ["path", { d: "M7 12h6" }],
    ["path", { d: "M7.606 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.606" }]
  ];

  // node_modules/lucide/dist/esm/icons/battery.mjs
  var Battery = [
    ["path", { d: "M 22 14 L 22 10" }],
    ["rect", { x: "2", y: "6", width: "16", height: "12", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/beaker.mjs
  var Beaker = [
    ["path", { d: "M4.5 3h15" }],
    ["path", { d: "M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" }],
    ["path", { d: "M6 14h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/bean.mjs
  var Bean = [
    [
      "path",
      {
        d: "M10.165 6.598C9.954 7.478 9.64 8.36 9 9c-.64.64-1.521.954-2.402 1.165A6 6 0 0 0 8 22c7.732 0 14-6.268 14-14a6 6 0 0 0-11.835-1.402Z"
      }
    ],
    ["path", { d: "M5.341 10.62a4 4 0 1 0 5.279-5.28" }]
  ];

  // node_modules/lucide/dist/esm/icons/bean-off.mjs
  var BeanOff = [
    ["path", { d: "M9 9c-.64.64-1.521.954-2.402 1.165A6 6 0 0 0 8 22a13.96 13.96 0 0 0 9.9-4.1" }],
    ["path", { d: "M10.75 5.093A6 6 0 0 1 22 8c0 2.411-.61 4.68-1.683 6.66" }],
    ["path", { d: "M5.341 10.62a4 4 0 0 0 6.487 1.208M10.62 5.341a4.015 4.015 0 0 1 2.039 2.04" }],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
  ];

  // node_modules/lucide/dist/esm/icons/bed-double.mjs
  var BedDouble = [
    ["path", { d: "M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" }],
    ["path", { d: "M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" }],
    ["path", { d: "M12 4v6" }],
    ["path", { d: "M2 18h20" }]
  ];

  // node_modules/lucide/dist/esm/icons/bed-single.mjs
  var BedSingle = [
    ["path", { d: "M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" }],
    ["path", { d: "M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" }],
    ["path", { d: "M3 18h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/bed.mjs
  var Bed = [
    ["path", { d: "M2 4v16" }],
    ["path", { d: "M2 8h18a2 2 0 0 1 2 2v10" }],
    ["path", { d: "M2 17h20" }],
    ["path", { d: "M6 8v9" }]
  ];

  // node_modules/lucide/dist/esm/icons/beef-off.mjs
  var BeefOff = [
    ["path", { d: "M11.771 6.109a2.5 2.5 0 0 1 3.12 3.12" }],
    ["path", { d: "M17.852 12.185a6.5 6.5 0 0 0-9.035-9.04" }],
    ["path", { d: "M18.013 18.013C15.029 20.349 10.831 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5" }],
    ["path", { d: "m18.5 6 2.19 4.5a6.48 6.48 0 0 1-.139 4.393" }],
    ["path", { d: "m2 2 20 20" }],
    [
      "path",
      {
        d: "M6.355 6.37a7 7 0 0 0-.075.23c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c3.356 0 6.993-1.267 9.85-3.151"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/beef.mjs
  var Beef = [
    [
      "path",
      {
        d: "M16.4 13.7A6.5 6.5 0 1 0 6.28 6.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3"
      }
    ],
    [
      "path",
      {
        d: "m18.5 6 1.754 3.5a6.48 6.48 0 0 1-1.854 8.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5"
      }
    ],
    ["circle", { cx: "12.5", cy: "8.5", r: "2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/beer-off.mjs
  var BeerOff = [
    ["path", { d: "M13 13v5" }],
    ["path", { d: "M17 11.47V8" }],
    ["path", { d: "M17 11h1a3 3 0 0 1 2.745 4.211" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" }],
    ["path", { d: "M7.536 7.535C6.766 7.649 6.154 8 5.5 8a2.5 2.5 0 0 1-1.768-4.268" }],
    [
      "path",
      {
        d: "M8.727 3.204C9.306 2.767 9.885 2 11 2c1.56 0 2 1.5 3 1.5s1.72-.5 2.5-.5a1 1 0 1 1 0 5c-.78 0-1.5-.5-2.5-.5a3.149 3.149 0 0 0-.842.12"
      }
    ],
    ["path", { d: "M9 14.6V18" }]
  ];

  // node_modules/lucide/dist/esm/icons/beer.mjs
  var Beer = [
    ["path", { d: "M17 11h1a3 3 0 0 1 0 6h-1" }],
    ["path", { d: "M9 12v6" }],
    ["path", { d: "M13 12v6" }],
    [
      "path",
      {
        d: "M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z"
      }
    ],
    ["path", { d: "M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" }]
  ];

  // node_modules/lucide/dist/esm/icons/belarusian-ruble.mjs
  var BelarusianRuble = [
    ["path", { d: "M3 16 L13 16" }],
    ["path", { d: "M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/bell-check.mjs
  var BellCheck = [
    ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
    ["path", { d: "m15 8 2 2 4-4" }],
    ["path", { d: "M16.8607 4.4824A6 6 0 0 0 6 8C6 12.499 4.589 13.956 3.262 15.326" }],
    [
      "path",
      {
        d: "M3.262 15.326A1 1 0 0 0 4 17H20A1 1 0 0 0 20.74 15.327C20.209 14.779 19.665 14.218 19.203 13.454"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/bell-dot.mjs
  var BellDot = [
    ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
    [
      "path",
      {
        d: "M11.68 2.009A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673c-.824-.85-1.678-1.731-2.21-3.348"
      }
    ],
    ["circle", { cx: "18", cy: "5", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/bell-electric.mjs
  var BellElectric = [
    ["path", { d: "M18.518 17.347A7 7 0 0 1 14 19" }],
    ["path", { d: "M18.8 4A11 11 0 0 1 20 9" }],
    ["path", { d: "M9 9h.01" }],
    ["circle", { cx: "20", cy: "16", r: "2" }],
    ["circle", { cx: "9", cy: "9", r: "7" }],
    ["rect", { x: "4", y: "16", width: "10", height: "6", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/bell-minus.mjs
  var BellMinus = [
    ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
    ["path", { d: "M15 8h6" }],
    [
      "path",
      {
        d: "M16.243 3.757A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673A9.4 9.4 0 0 1 18.667 12"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/bell-plus.mjs
  var BellPlus = [
    ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
    ["path", { d: "M15 8h6" }],
    ["path", { d: "M18 5v6" }],
    [
      "path",
      {
        d: "M20.002 14.464a9 9 0 0 0 .738.863A1 1 0 0 1 20 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 8.75-5.332"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/bell-off.mjs
  var BellOff = [
    ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
    ["path", { d: "M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05" }]
  ];

  // node_modules/lucide/dist/esm/icons/bell-ring.mjs
  var BellRing = [
    ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
    ["path", { d: "M22 8c0-2.3-.8-4.3-2-6" }],
    [
      "path",
      {
        d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
      }
    ],
    ["path", { d: "M4 2C2.8 3.7 2 5.7 2 8" }]
  ];

  // node_modules/lucide/dist/esm/icons/bell.mjs
  var Bell = [
    ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
    [
      "path",
      {
        d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/between-horizontal-end.mjs
  var BetweenHorizontalEnd = [
    ["rect", { width: "13", height: "7", x: "3", y: "3", rx: "1" }],
    ["path", { d: "m22 15-3-3 3-3" }],
    ["rect", { width: "13", height: "7", x: "3", y: "14", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/between-horizontal-start.mjs
  var BetweenHorizontalStart = [
    ["rect", { width: "13", height: "7", x: "8", y: "3", rx: "1" }],
    ["path", { d: "m2 9 3 3-3 3" }],
    ["rect", { width: "13", height: "7", x: "8", y: "14", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/between-vertical-end.mjs
  var BetweenVerticalEnd = [
    ["rect", { width: "7", height: "13", x: "3", y: "3", rx: "1" }],
    ["path", { d: "m9 22 3-3 3 3" }],
    ["rect", { width: "7", height: "13", x: "14", y: "3", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/between-vertical-start.mjs
  var BetweenVerticalStart = [
    ["rect", { width: "7", height: "13", x: "3", y: "8", rx: "1" }],
    ["path", { d: "m15 2-3 3-3-3" }],
    ["rect", { width: "7", height: "13", x: "14", y: "8", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/biceps-flexed.mjs
  var BicepsFlexed = [
    [
      "path",
      {
        d: "M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1"
      }
    ],
    ["path", { d: "M15 14a5 5 0 0 0-7.584 2" }],
    ["path", { d: "M9.964 6.825C8.019 7.977 9.5 13 8 15" }]
  ];

  // node_modules/lucide/dist/esm/icons/bike.mjs
  var Bike = [
    ["circle", { cx: "18.5", cy: "17.5", r: "3.5" }],
    ["circle", { cx: "5.5", cy: "17.5", r: "3.5" }],
    ["circle", { cx: "15", cy: "5", r: "1" }],
    ["path", { d: "M12 17.5V14l-3-3 4-3 2 3h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/binary.mjs
  var Binary = [
    ["rect", { x: "14", y: "14", width: "4", height: "6", rx: "2" }],
    ["rect", { x: "6", y: "4", width: "4", height: "6", rx: "2" }],
    ["path", { d: "M6 20h4" }],
    ["path", { d: "M14 10h4" }],
    ["path", { d: "M6 14h2v6" }],
    ["path", { d: "M14 4h2v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/binoculars.mjs
  var Binoculars = [
    ["path", { d: "M10 10h4" }],
    ["path", { d: "M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3" }],
    [
      "path",
      {
        d: "M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z"
      }
    ],
    ["path", { d: "M 22 16 L 2 16" }],
    [
      "path",
      {
        d: "M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/biohazard.mjs
  var Biohazard = [
    ["circle", { cx: "12", cy: "11.9", r: "2" }],
    ["path", { d: "M6.7 3.4c-.9 2.5 0 5.2 2.2 6.7C6.5 9 3.7 9.6 2 11.6" }],
    ["path", { d: "m8.9 10.1 1.4.8" }],
    ["path", { d: "M17.3 3.4c.9 2.5 0 5.2-2.2 6.7 2.4-1.2 5.2-.6 6.9 1.5" }],
    ["path", { d: "m15.1 10.1-1.4.8" }],
    ["path", { d: "M16.7 20.8c-2.6-.4-4.6-2.6-4.7-5.3-.2 2.6-2.1 4.8-4.7 5.2" }],
    ["path", { d: "M12 13.9v1.6" }],
    ["path", { d: "M13.5 5.4c-1-.2-2-.2-3 0" }],
    ["path", { d: "M17 16.4c.7-.7 1.2-1.6 1.5-2.5" }],
    ["path", { d: "M5.5 13.9c.3.9.8 1.8 1.5 2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/bird.mjs
  var Bird = [
    ["path", { d: "M16 7h.01" }],
    ["path", { d: "M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" }],
    ["path", { d: "m20 7 2 .5-2 .5" }],
    ["path", { d: "M10 18v3" }],
    ["path", { d: "M14 17.75V21" }],
    ["path", { d: "M7 18a6 6 0 0 0 3.84-10.61" }]
  ];

  // node_modules/lucide/dist/esm/icons/birdhouse.mjs
  var Birdhouse = [
    ["path", { d: "M12 18v4" }],
    ["path", { d: "m17 18 1.956-11.468" }],
    ["path", { d: "m3 8 7.82-5.615a2 2 0 0 1 2.36 0L21 8" }],
    ["path", { d: "M4 18h16" }],
    ["path", { d: "M7 18 5.044 6.532" }],
    ["circle", { cx: "12", cy: "10", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/bitcoin.mjs
  var Bitcoin = [
    [
      "path",
      {
        d: "M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/blend.mjs
  var Blend = [
    ["circle", { cx: "15", cy: "9", r: "7" }],
    ["circle", { cx: "9", cy: "15", r: "7" }]
  ];

  // node_modules/lucide/dist/esm/icons/blender.mjs
  var Blender = [
    [
      "path",
      {
        d: "M8 14a2 2 0 0 0-1.963 1.615l-1.018 5.193A1 1 0 0 0 6 22h12a1 1 0 0 0 .981-1.192l-1.018-5.193A2 2 0 0 0 16 14z"
      }
    ],
    ["path", { d: "m17 2-1 12" }],
    ["path", { d: "M8.006 14 7 2" }],
    ["path", { d: "M7.565 8.787A5 5 0 0 0 12 8a5 5 0 0 1 4.56-.75" }],
    ["path", { d: "M19 2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 .688 1.5" }],
    ["path", { d: "M12 18h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/blinds.mjs
  var Blinds = [
    ["path", { d: "M3 3h18" }],
    ["path", { d: "M20 7H8" }],
    ["path", { d: "M20 11H8" }],
    ["path", { d: "M10 19h10" }],
    ["path", { d: "M8 15h12" }],
    ["path", { d: "M4 3v14" }],
    ["circle", { cx: "4", cy: "19", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/blocks.mjs
  var Blocks = [
    [
      "path",
      {
        d: "M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2"
      }
    ],
    ["rect", { x: "14", y: "2", width: "8", height: "8", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/bluetooth-connected.mjs
  var BluetoothConnected = [
    ["path", { d: "m7 7 10 10-5 5V2l5 5L7 17" }],
    ["line", { x1: "18", x2: "21", y1: "12", y2: "12" }],
    ["line", { x1: "3", x2: "6", y1: "12", y2: "12" }]
  ];

  // node_modules/lucide/dist/esm/icons/bluetooth-off.mjs
  var BluetoothOff = [
    ["path", { d: "m17 17-5 5V12l-5 5" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M14.5 9.5 17 7l-5-5v4.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/bluetooth-searching.mjs
  var BluetoothSearching = [
    ["path", { d: "m7 7 10 10-5 5V2l5 5L7 17" }],
    ["path", { d: "M20.83 14.83a4 4 0 0 0 0-5.66" }],
    ["path", { d: "M18 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/bluetooth.mjs
  var Bluetooth = [["path", { d: "m7 7 10 10-5 5V2l5 5L7 17" }]];

  // node_modules/lucide/dist/esm/icons/bolt.mjs
  var Bolt = [
    [
      "path",
      {
        d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/bomb.mjs
  var Bomb = [
    ["circle", { cx: "11", cy: "13", r: "9" }],
    [
      "path",
      { d: "M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95" }
    ],
    ["path", { d: "m22 2-1.5 1.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/bone-fracture.mjs
  var BoneFracture = [
    [
      "path",
      {
        d: "M14 4.5a1 1 0 0 1 5 0 .5.5 0 0 0 .5.5 1 1 0 0 1 0 5c-.81 0-1.8-.7-2.5 0l-1.958 1.957a.15.15 0 0 1-.252-.072l-.493-2.07a.15.15 0 0 0-.111-.112l-2.072-.494a.15.15 0 0 1-.072-.252L14 7c.7-.7 0-1.69 0-2.5"
      }
    ],
    ["path", { d: "m16 20-1-2" }],
    ["path", { d: "m20 16-2-1" }],
    ["path", { d: "m4 8 2 1" }],
    ["path", { d: "m8 4 1 2" }],
    [
      "path",
      {
        d: "M9.698 14.19a.15.15 0 0 0 .112.112l2.074.489a.15.15 0 0 1 .072.252L10 17c-.7.7 0 1.69 0 2.5a1 1 0 0 1-5 0 .495.495 0 0 0-.5-.5 1 1 0 0 1 0-5c.81 0 1.8.7 2.5 0l1.956-1.957a.15.15 0 0 1 .252.072z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/bone.mjs
  var Bone = [
    [
      "path",
      {
        d: "M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/book-a.mjs
  var BookA = [
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["path", { d: "m8 13 4-7 4 7" }],
    ["path", { d: "M9.1 11h5.7" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-audio.mjs
  var BookAudio = [
    ["path", { d: "M12 6v7" }],
    ["path", { d: "M16 8v3" }],
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["path", { d: "M8 8v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-bookmark.mjs
  var BookBookmark = [
    [
      "path",
      {
        d: "M10 2v7.751a.25.25 0 00.407.195l2.28-1.834a.5.5 0 01.627 0l2.28 1.834A.25.25 0 0016 9.751V2"
      }
    ],
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 016.5 2H19a1 1 0 011 1v18a1 1 0 01-1 1H6.5a1 1 0 010-5H20" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/book-check.mjs
  var BookCheck = [
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["path", { d: "m9 9.5 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-copy.mjs
  var BookCopy = [
    ["path", { d: "M5 7a2 2 0 0 0-2 2v11" }],
    ["path", { d: "M5.803 18H5a2 2 0 0 0 0 4h9.5a.5.5 0 0 0 .5-.5V21" }],
    [
      "path",
      { d: "M9 15V4a2 2 0 0 1 2-2h9.5a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5H11a2 2 0 0 1 0-4h10" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/book-dashed.mjs
  var BookDashed = [
    ["path", { d: "M12 17h1.5" }],
    ["path", { d: "M12 22h1.5" }],
    ["path", { d: "M12 2h1.5" }],
    ["path", { d: "M17.5 22H19a1 1 0 0 0 1-1" }],
    ["path", { d: "M17.5 2H19a1 1 0 0 1 1 1v1.5" }],
    ["path", { d: "M20 14v3h-2.5" }],
    ["path", { d: "M20 8.5V10" }],
    ["path", { d: "M4 10V8.5" }],
    ["path", { d: "M4 19.5V14" }],
    ["path", { d: "M4 4.5A2.5 2.5 0 0 1 6.5 2H8" }],
    ["path", { d: "M8 22H6.5a1 1 0 0 1 0-5H8" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-down.mjs
  var BookDown = [
    ["path", { d: "M12 13V7" }],
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["path", { d: "m9 10 3 3 3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-exclamation-point.mjs
  var BookExclamationPoint = [
    ["path", { d: "M12 13h.01" }],
    ["path", { d: "M12 6v3" }],
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/book-headphones.mjs
  var BookHeadphones = [
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["path", { d: "M8 12v-2a4 4 0 0 1 8 0v2" }],
    ["circle", { cx: "15", cy: "12", r: "1" }],
    ["circle", { cx: "9", cy: "12", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-heart.mjs
  var BookHeart = [
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    [
      "path",
      {
        d: "M8.62 9.8A2.25 2.25 0 1 1 12 6.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/book-image.mjs
  var BookImage = [
    ["path", { d: "m20 13.7-2.1-2.1a2 2 0 0 0-2.8 0L9.7 17" }],
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["circle", { cx: "10", cy: "8", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-key.mjs
  var BookKey = [
    ["path", { d: "M13 2H6.5A2.5 2.5 0 0 0 4 4.5v15" }],
    ["path", { d: "M17 2v6" }],
    ["path", { d: "M17 4h2" }],
    ["path", { d: "M20 15.2V21a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }],
    ["circle", { cx: "17", cy: "10", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-lock.mjs
  var BookLock = [
    ["path", { d: "M18 6V4a2 2 0 1 0-4 0v2" }],
    ["path", { d: "M20 15v6a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }],
    ["path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H10" }],
    ["rect", { x: "12", y: "6", width: "8", height: "5", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-minus.mjs
  var BookMinus = [
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["path", { d: "M9 10h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-open-check.mjs
  var BookOpenCheck = [
    ["path", { d: "M12 5v16" }],
    ["path", { d: "m16 12 2 2 4-4" }],
    [
      "path",
      {
        d: "M22 6V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2h4.001A2 2 0 0022 17v-1.344"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/book-open-text.mjs
  var BookOpenText = [
    ["path", { d: "M12 5v16" }],
    ["path", { d: "M16 13h2" }],
    ["path", { d: "M16 9h2" }],
    [
      "path",
      {
        d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"
      }
    ],
    ["path", { d: "M6 13h2" }],
    ["path", { d: "M6 9h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-open.mjs
  var BookOpen = [
    ["path", { d: "M12 5v16" }],
    [
      "path",
      {
        d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/book-plus.mjs
  var BookPlus = [
    ["path", { d: "M12 7v6" }],
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["path", { d: "M9 10h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-search.mjs
  var BookSearch = [
    ["path", { d: "M11 22H5.5a1 1 0 0 1 0-5h4.501" }],
    ["path", { d: "m21 22-1.879-1.878" }],
    ["path", { d: "M3 19.5v-15A2.5 2.5 0 0 1 5.5 2H18a1 1 0 0 1 1 1v8" }],
    ["circle", { cx: "17", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-text.mjs
  var BookText = [
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["path", { d: "M8 11h8" }],
    ["path", { d: "M8 7h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-type.mjs
  var BookType = [
    ["path", { d: "M10 13h4" }],
    ["path", { d: "M12 6v7" }],
    ["path", { d: "M16 8V6H8v2" }],
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/book-up.mjs
  var BookUp = [
    ["path", { d: "M12 13V7" }],
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["path", { d: "m9 10 3-3 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-up-2.mjs
  var BookUp2 = [
    ["path", { d: "M12 13V7" }],
    ["path", { d: "M18 2h1a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }],
    ["path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2" }],
    ["path", { d: "m9 10 3-3 3 3" }],
    ["path", { d: "m9 5 3-3 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-user.mjs
  var BookUser = [
    ["path", { d: "M15 13a3 3 0 1 0-6 0" }],
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["circle", { cx: "12", cy: "8", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/book-x.mjs
  var BookX = [
    ["path", { d: "m14.5 7.5-5 5" }],
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ],
    ["path", { d: "m9.5 7.5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/book.mjs
  var Book = [
    [
      "path",
      { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/bookmark-check.mjs
  var BookmarkCheck = [
    [
      "path",
      {
        d: "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "m9 10 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/bookmark-minus.mjs
  var BookmarkMinus = [
    ["path", { d: "M15 10H9" }],
    [
      "path",
      {
        d: "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/bookmark-off.mjs
  var BookmarkOff = [
    [
      "path",
      {
        d: "M19 19v1a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5"
      }
    ],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M8.656 3H17a2 2 0 0 1 2 2v8.344" }]
  ];

  // node_modules/lucide/dist/esm/icons/bookmark-plus.mjs
  var BookmarkPlus = [
    ["path", { d: "M12 7v6" }],
    ["path", { d: "M15 10H9" }],
    [
      "path",
      {
        d: "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/bookmark-x.mjs
  var BookmarkX = [
    ["path", { d: "m14.5 7.5-5 5" }],
    [
      "path",
      {
        d: "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "m9.5 7.5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/bookmark.mjs
  var Bookmark = [
    [
      "path",
      {
        d: "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/boom-box.mjs
  var BoomBox = [
    ["path", { d: "M4 9V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" }],
    ["path", { d: "M8 8v1" }],
    ["path", { d: "M12 8v1" }],
    ["path", { d: "M16 8v1" }],
    ["rect", { width: "20", height: "12", x: "2", y: "9", rx: "2" }],
    ["circle", { cx: "8", cy: "15", r: "2" }],
    ["circle", { cx: "16", cy: "15", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/bot-message-square.mjs
  var BotMessageSquare = [
    ["path", { d: "M12 6V2H8" }],
    ["path", { d: "M15 11v2" }],
    ["path", { d: "M2 12h2" }],
    ["path", { d: "M20 12h2" }],
    [
      "path",
      {
        d: "M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"
      }
    ],
    ["path", { d: "M9 11v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/bot-off.mjs
  var BotOff = [
    ["path", { d: "M13.67 8H18a2 2 0 0 1 2 2v4.33" }],
    ["path", { d: "M2 14h2" }],
    ["path", { d: "M20 14h2" }],
    ["path", { d: "M22 22 2 2" }],
    ["path", { d: "M8 8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 1.414-.586" }],
    ["path", { d: "M9 13v2" }],
    ["path", { d: "M9.67 4H12v2.33" }]
  ];

  // node_modules/lucide/dist/esm/icons/bot.mjs
  var Bot = [
    ["path", { d: "M12 8V4H8" }],
    ["rect", { width: "16", height: "12", x: "4", y: "8", rx: "2" }],
    ["path", { d: "M2 14h2" }],
    ["path", { d: "M20 14h2" }],
    ["path", { d: "M15 13v2" }],
    ["path", { d: "M9 13v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/bottle-wine.mjs
  var BottleWine = [
    [
      "path",
      {
        d: "M10 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a6 6 0 0 0 1.2 3.6l.6.8A6 6 0 0 1 17 13v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8a6 6 0 0 1 1.2-3.6l.6-.8A6 6 0 0 0 10 5z"
      }
    ],
    ["path", { d: "M17 13h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/bow-arrow.mjs
  var BowArrow = [
    ["path", { d: "M17 3h4v4" }],
    ["path", { d: "M18.575 11.082a13 13 0 0 1 1.048 9.027 1.17 1.17 0 0 1-1.914.597L14 17" }],
    ["path", { d: "M7 10 3.29 6.29a1.17 1.17 0 0 1 .6-1.91 13 13 0 0 1 9.03 1.05" }],
    [
      "path",
      {
        d: "M7 14a1.7 1.7 0 0 0-1.207.5l-2.646 2.646A.5.5 0 0 0 3.5 18H5a1 1 0 0 1 1 1v1.5a.5.5 0 0 0 .854.354L9.5 18.207A1.7 1.7 0 0 0 10 17v-2a1 1 0 0 0-1-1z"
      }
    ],
    ["path", { d: "M9.707 14.293 21 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/box.mjs
  var Box = [
    [
      "path",
      {
        d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
      }
    ],
    ["path", { d: "m3.3 7 8.7 5 8.7-5" }],
    ["path", { d: "M12 22V12" }]
  ];

  // node_modules/lucide/dist/esm/icons/boxes-linked.mjs
  var BoxesLinked = [
    ["path", { d: "M14 6h2a2 2 0 0 1 2 2v5" }],
    ["path", { d: "M14.21 15.202 18 17.4V22" }],
    [
      "path",
      {
        d: "M14.796 14.611A1.6 1.6 0 0 0 14 15.995v3.013a1.6 1.6 0 0 0 .797 1.384l2.4 1.392a1.6 1.6 0 0 0 1.606 0l2.4-1.392A1.6 1.6 0 0 0 22 19.008v-3.013a1.6 1.6 0 0 0-.796-1.384l-2.4-1.394a1.6 1.6 0 0 0-1.514-.051z"
      }
    ],
    ["path", { d: "m18 17.4 3.79-2.198" }],
    ["path", { d: "M2.21 4.202 6 6.4V16a2 2 0 0 0 2 2h2" }],
    [
      "path",
      {
        d: "M2.796 3.611A1.6 1.6 0 0 0 2 4.995v3.013a1.6 1.6 0 0 0 .797 1.384l2.4 1.392a1.6 1.6 0 0 0 1.606 0l2.4-1.392A1.6 1.6 0 0 0 10 8.008V4.995a1.6 1.6 0 0 0-.796-1.384l-2.4-1.394a1.6 1.6 0 0 0-1.514-.052z"
      }
    ],
    ["path", { d: "m6 6.4 3.79-2.198" }]
  ];

  // node_modules/lucide/dist/esm/icons/boxes.mjs
  var Boxes = [
    [
      "path",
      {
        d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"
      }
    ],
    ["path", { d: "m7 16.5-4.74-2.85" }],
    ["path", { d: "m7 16.5 5-3" }],
    ["path", { d: "M7 16.5v5.17" }],
    [
      "path",
      {
        d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"
      }
    ],
    ["path", { d: "m17 16.5-5-3" }],
    ["path", { d: "m17 16.5 4.74-2.85" }],
    ["path", { d: "M17 16.5v5.17" }],
    [
      "path",
      {
        d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"
      }
    ],
    ["path", { d: "M12 8 7.26 5.15" }],
    ["path", { d: "m12 8 4.74-2.85" }],
    ["path", { d: "M12 13.5V8" }]
  ];

  // node_modules/lucide/dist/esm/icons/braces.mjs
  var Braces = [
    ["path", { d: "M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" }],
    ["path", { d: "M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/brackets.mjs
  var Brackets = [
    ["path", { d: "M16 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3" }],
    ["path", { d: "M8 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3" }]
  ];

  // node_modules/lucide/dist/esm/icons/brain-circuit.mjs
  var BrainCircuit = [
    ["path", { d: "M12 13h4" }],
    ["path", { d: "M12 18h6a2 2 0 012 2v1" }],
    ["path", { d: "M12 8h8" }],
    ["path", { d: "M12 9a4.17 4.17 0 01-3 4" }],
    ["path", { d: "M16 8V5a2 2 0 012-2" }],
    ["path", { d: "M6 18a4 4 0 01-2-7.465" }],
    ["path", { d: "M6.004 5.125a4 4 0 00-2.526 5.77" }],
    ["path", { d: "M6.294 6.294A3 3 0 1112 5v13a4 4 0 11-7.967-.518" }],
    ["circle", { cx: "16", cy: "13", r: "0.5", fill: "currentColor" }],
    ["circle", { cx: "18", cy: "3", r: "0.5", fill: "currentColor" }],
    ["circle", { cx: "20", cy: "21", r: "0.5", fill: "currentColor" }],
    ["circle", { cx: "20", cy: "8", r: "0.5", fill: "currentColor" }]
  ];

  // node_modules/lucide/dist/esm/icons/brain-cog.mjs
  var BrainCog = [
    ["path", { d: "m10.852 14.772-.383.923" }],
    ["path", { d: "m10.852 9.228-.383-.923" }],
    ["path", { d: "m13.148 14.772.382.924" }],
    ["path", { d: "m13.53 8.305-.382.923" }],
    ["path", { d: "m14.772 10.852.923-.383" }],
    ["path", { d: "m14.772 13.148.923.383" }],
    ["path", { d: "M17.997 5.125a4 4 0 012.526 5.77" }],
    ["path", { d: "M18 18a4 4 0 002-7.464" }],
    ["path", { d: "M4.033 17.483A4 4 0 0011.46 20c.184-.31.896-.31 1.076 0a4 4 0 007.43-2.517" }],
    ["path", { d: "M6 18a4 4 0 01-2-7.464" }],
    ["path", { d: "M6.002 5.125a4 4 0 00-2.525 5.77" }],
    [
      "path",
      {
        d: "M6.293 6.294a3 3 0 01-.287-1.098l-.004-.07a3 3 0 015.968-.543c.05.02.057.01.059 0a3 3 0 015.968.542l-.004.071a3 3 0 01-.287 1.098"
      }
    ],
    ["path", { d: "m9.228 10.852-.923-.383" }],
    ["path", { d: "m9.228 13.148-.923.383" }],
    ["circle", { cx: "12", cy: "12", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/brain-off.mjs
  var BrainOff = [
    ["path", { d: "M12 18v-6" }],
    ["path", { d: "M12 5v1.344" }],
    ["path", { d: "M17.707 6.293A3 3 0 1012 5a3 3 0 00-4.124-2.781" }],
    ["path", { d: "M17.997 5.125a4 4 0 012.526 5.77" }],
    ["path", { d: "M19.644 19.644A4 4 0 0112 18a4 4 0 11-7.967-.517" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M20 10.536a4 4 0 011.533 5.34" }],
    ["path", { d: "M3.477 10.895a4 4 0 011.876-5.542" }],
    ["path", { d: "M6 18a4 4 0 01-2-7.464" }],
    ["path", { d: "M9 13a4.17 4.17 0 002.166-1.5 4 4 0 00.138-.196" }]
  ];

  // node_modules/lucide/dist/esm/icons/brain.mjs
  var Brain = [
    ["path", { d: "M12 18V5" }],
    ["path", { d: "M15 13a4.17 4.17 0 01-3-4 4.17 4.17 0 01-3 4" }],
    ["path", { d: "M17.707 6.294A3 3 0 1012 5a3 3 0 10-5.707 1.294" }],
    ["path", { d: "M17.996 5.125a4 4 0 012.526 5.77" }],
    ["path", { d: "M18 18a4 4 0 002-7.465" }],
    ["path", { d: "M19.967 17.482a4 4 0 11-7.967.517 4 4 0 11-7.967-.517" }],
    ["path", { d: "M6 18a4 4 0 01-2-7.465" }],
    ["path", { d: "M6.004 5.125a4 4 0 00-2.526 5.77" }]
  ];

  // node_modules/lucide/dist/esm/icons/brick-wall-fire.mjs
  var BrickWallFire = [
    ["path", { d: "M16 3v2.107" }],
    [
      "path",
      {
        d: "M17 9c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 22 17a5 5 0 0 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C13 11.5 16 9 17 9"
      }
    ],
    ["path", { d: "M21 8.274V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.938" }],
    ["path", { d: "M3 15h5.253" }],
    ["path", { d: "M3 9h8.228" }],
    ["path", { d: "M8 15v6" }],
    ["path", { d: "M8 3v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/brick-wall-shield.mjs
  var BrickWallShield = [
    ["path", { d: "M12 9v1.258" }],
    ["path", { d: "M16 3v5.46" }],
    ["path", { d: "M21 9.118V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5.75" }],
    [
      "path",
      {
        d: "M22 17.5c0 2.499-1.75 3.749-3.83 4.474a.5.5 0 0 1-.335-.005c-2.085-.72-3.835-1.97-3.835-4.47V14a.5.5 0 0 1 .5-.499c1 0 2.25-.6 3.12-1.36a.6.6 0 0 1 .76-.001c.875.765 2.12 1.36 3.12 1.36a.5.5 0 0 1 .5.5z"
      }
    ],
    ["path", { d: "M3 15h7" }],
    ["path", { d: "M3 9h12.142" }],
    ["path", { d: "M8 15v6" }],
    ["path", { d: "M8 3v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/brick-wall.mjs
  var BrickWall = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M12 9v6" }],
    ["path", { d: "M16 15v6" }],
    ["path", { d: "M16 3v6" }],
    ["path", { d: "M3 15h18" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 15v6" }],
    ["path", { d: "M8 3v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/bridge.mjs
  var Bridge = [
    ["path", { d: "M10 9.728V16" }],
    ["path", { d: "M14 9.728V16" }],
    ["path", { d: "M18 20V4" }],
    ["path", { d: "m22 11-4-4A7.5 7.5 0 0 1 6 7l-4 4" }],
    ["path", { d: "M22 16H2" }],
    ["path", { d: "M6 20V4" }]
  ];

  // node_modules/lucide/dist/esm/icons/briefcase-business.mjs
  var BriefcaseBusiness = [
    ["path", { d: "M12 12h.01" }],
    ["path", { d: "M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" }],
    ["path", { d: "M22 13a18.15 18.15 0 0 1-20 0" }],
    ["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/briefcase-conveyor-belt.mjs
  var BriefcaseConveyorBelt = [
    ["path", { d: "M10 20v2" }],
    ["path", { d: "M14 20v2" }],
    ["path", { d: "M18 20v2" }],
    ["path", { d: "M21 20H3" }],
    ["path", { d: "M6 20v2" }],
    ["path", { d: "M8 16V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12" }],
    ["rect", { x: "4", y: "6", width: "16", height: "10", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/briefcase-medical.mjs
  var BriefcaseMedical = [
    ["path", { d: "M12 11v4" }],
    ["path", { d: "M14 13h-4" }],
    ["path", { d: "M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" }],
    ["path", { d: "M18 6v14" }],
    ["path", { d: "M6 6v14" }],
    ["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/briefcase-plus.mjs
  var BriefcasePlus = [
    ["path", { d: "M13.354 20H4a2 2 0 01-2-2V8a2 2 0 012-2h16a2 2 0 012 2v3.354" }],
    ["path", { d: "M16 11.354V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" }],
    ["path", { d: "M16 17h6" }],
    ["path", { d: "M19 14v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/briefcase.mjs
  var Briefcase = [
    ["path", { d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" }],
    ["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/bring-to-front.mjs
  var BringToFront = [
    ["rect", { x: "8", y: "8", width: "8", height: "8", rx: "2" }],
    ["path", { d: "M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" }],
    ["path", { d: "M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/broccoli.mjs
  var Broccoli = [
    ["path", { d: "M10 13a3 3 0 01-2.121-5.121" }],
    [
      "path",
      {
        d: "M15.606 14.204c-3.5 1.5-5.899 4.503-8.899 7.503A1 1 0 016 22c-2 0-4-2-4-4a1 1 0 01.293-.707c1.911-1.911 3.823-3.578 5.347-5.441"
      }
    ],
    ["path", { d: "M16.573 14.737A4 4 0 0114 11" }],
    [
      "path",
      {
        d: "M7.14 10.907a4 4 0 112.756-7.43A4 4 0 0116.7 4.48a2 2 0 012.82 2.82 4 4 0 011.002 6.805 4 4 0 11-7.51 1.59"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/broom-sparkles.mjs
  var BroomSparkles = [
    ["path", { d: "M11 2v2" }],
    ["path", { d: "M12 3h-2" }],
    ["path", { d: "M13.5 10.5 22 2" }],
    [
      "path",
      {
        d: "M14.734 13.841a2 2 0 00-.314-2.42L12.58 9.58a2 2 0 00-2.421-.314l-7.657 4.461A1 1 0 002.3 15.3l6.403 6.403a1 1 0 001.571-.204z"
      }
    ],
    ["path", { d: "M20 15v4" }],
    ["path", { d: "M22 17h-4" }],
    ["path", { d: "M4 4v4" }],
    ["path", { d: "m5 18 2-2" }],
    ["path", { d: "M6 6H2" }],
    ["path", { d: "m7.699 10.7 5.602 5.601" }]
  ];

  // node_modules/lucide/dist/esm/icons/broom.mjs
  var Broom = [
    ["path", { d: "M13.5 10.5 22 2" }],
    [
      "path",
      {
        d: "M14.734 13.841a2 2 0 00-.314-2.42L12.58 9.58a2 2 0 00-2.421-.314l-7.657 4.461A1 1 0 002.3 15.3l6.403 6.403a1 1 0 001.571-.204z"
      }
    ],
    ["path", { d: "m5 18 2-2" }],
    ["path", { d: "m7.699 10.7 5.602 5.601" }]
  ];

  // node_modules/lucide/dist/esm/icons/brush-cleaning.mjs
  var BrushCleaning = [
    ["path", { d: "m16 22-1-4" }],
    [
      "path",
      {
        d: "M19 14a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1"
      }
    ],
    ["path", { d: "M19 14H5l-1.973 6.767A1 1 0 0 0 4 22h16a1 1 0 0 0 .973-1.233z" }],
    ["path", { d: "m8 22 1-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/brush.mjs
  var Brush = [
    ["path", { d: "m11 10 3 3" }],
    ["path", { d: "M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z" }],
    ["path", { d: "M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031" }]
  ];

  // node_modules/lucide/dist/esm/icons/bubbles.mjs
  var Bubbles = [
    ["path", { d: "M7.001 15.085A1.5 1.5 0 0 1 9 16.5" }],
    ["circle", { cx: "18.5", cy: "8.5", r: "3.5" }],
    ["circle", { cx: "7.5", cy: "16.5", r: "5.5" }],
    ["circle", { cx: "7.5", cy: "4.5", r: "2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/bug-off.mjs
  var BugOff = [
    ["path", { d: "M12 20v-8" }],
    ["path", { d: "M12.656 7H14a4 4 0 0 1 4 4v1.344" }],
    ["path", { d: "M14.12 3.88 16 2" }],
    ["path", { d: "M17.123 17.123A6 6 0 0 1 6 14v-3a4 4 0 0 1 1.72-3.287" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M21 5a4 4 0 0 1-3.55 3.97" }],
    ["path", { d: "M22 13h-3.344" }],
    ["path", { d: "M3 21a4 4 0 0 1 3.81-4" }],
    ["path", { d: "M3 5a4 4 0 0 0 3.55 3.97" }],
    ["path", { d: "M6 13H2" }],
    ["path", { d: "m8 2 1.88 1.88" }],
    ["path", { d: "M9.712 4.06A3 3 0 0 1 15 6v1.13" }]
  ];

  // node_modules/lucide/dist/esm/icons/bug-play.mjs
  var BugPlay = [
    ["path", { d: "M10 19.655A6 6 0 0 1 6 14v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 3.97" }],
    [
      "path",
      {
        d: "M14 15.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997a1 1 0 0 1-1.517-.86z"
      }
    ],
    ["path", { d: "M14.12 3.88 16 2" }],
    ["path", { d: "M21 5a4 4 0 0 1-3.55 3.97" }],
    ["path", { d: "M3 21a4 4 0 0 1 3.81-4" }],
    ["path", { d: "M3 5a4 4 0 0 0 3.55 3.97" }],
    ["path", { d: "M6 13H2" }],
    ["path", { d: "m8 2 1.88 1.88" }],
    ["path", { d: "M9 7.13V6a3 3 0 1 1 6 0v1.13" }]
  ];

  // node_modules/lucide/dist/esm/icons/bug.mjs
  var Bug = [
    ["path", { d: "M12 20v-9" }],
    ["path", { d: "M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z" }],
    ["path", { d: "M14.12 3.88 16 2" }],
    ["path", { d: "M21 21a4 4 0 0 0-3.81-4" }],
    ["path", { d: "M21 5a4 4 0 0 1-3.55 3.97" }],
    ["path", { d: "M22 13h-4" }],
    ["path", { d: "M3 21a4 4 0 0 1 3.81-4" }],
    ["path", { d: "M3 5a4 4 0 0 0 3.55 3.97" }],
    ["path", { d: "M6 13H2" }],
    ["path", { d: "m8 2 1.88 1.88" }],
    ["path", { d: "M9 7.13V6a3 3 0 1 1 6 0v1.13" }]
  ];

  // node_modules/lucide/dist/esm/icons/building-complex-plus.mjs
  var BuildingComplexPlus = [
    ["path", { d: "M10 12h4" }],
    ["path", { d: "M10 21v-3a2 2 0 013.05-1.702" }],
    ["path", { d: "M10 8h4" }],
    ["path", { d: "M16 19h6" }],
    ["path", { d: "M18 7h2a2 2 0 012 2v4.355" }],
    ["path", { d: "M19 16v6" }],
    ["path", { d: "M6 10H4a2 2 0 00-2 2v7a2 2 0 002 2h8.535" }],
    ["path", { d: "M6 21V5a2 2 0 012-2h8a2 2 0 012 2v7.126" }]
  ];

  // node_modules/lucide/dist/esm/icons/building-complex.mjs
  var BuildingComplex = [
    ["path", { d: "M10 12h4" }],
    ["path", { d: "M10 8h4" }],
    ["path", { d: "M14 21v-3a2 2 0 0 0-4 0v3" }],
    ["path", { d: "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" }],
    ["path", { d: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" }]
  ];

  // node_modules/lucide/dist/esm/icons/building.mjs
  var Building = [
    ["path", { d: "M12 10h.01" }],
    ["path", { d: "M12 14h.01" }],
    ["path", { d: "M12 6h.01" }],
    ["path", { d: "M16 10h.01" }],
    ["path", { d: "M16 14h.01" }],
    ["path", { d: "M16 6h.01" }],
    ["path", { d: "M8 10h.01" }],
    ["path", { d: "M8 14h.01" }],
    ["path", { d: "M8 6h.01" }],
    ["path", { d: "M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" }],
    ["rect", { x: "4", y: "2", width: "16", height: "20", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/bus.mjs
  var Bus = [
    ["path", { d: "M8 6v6" }],
    ["path", { d: "M15 6v6" }],
    ["path", { d: "M2 12h19.6" }],
    [
      "path",
      {
        d: "M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"
      }
    ],
    ["circle", { cx: "7", cy: "18", r: "2" }],
    ["path", { d: "M9 18h5" }],
    ["circle", { cx: "16", cy: "18", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/bus-front.mjs
  var BusFront = [
    ["path", { d: "M4 6 2 7" }],
    ["path", { d: "M10 6h4" }],
    ["path", { d: "m22 7-2-1" }],
    ["rect", { width: "16", height: "16", x: "4", y: "3", rx: "2" }],
    ["path", { d: "M4 11h16" }],
    ["path", { d: "M8 15h.01" }],
    ["path", { d: "M16 15h.01" }],
    ["path", { d: "M6 19v2" }],
    ["path", { d: "M18 21v-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/cable.mjs
  var Cable = [
    ["path", { d: "M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z" }],
    ["path", { d: "M17 21v-2" }],
    ["path", { d: "M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10" }],
    ["path", { d: "M21 21v-2" }],
    ["path", { d: "M3 5V3" }],
    ["path", { d: "M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z" }],
    ["path", { d: "M7 5V3" }]
  ];

  // node_modules/lucide/dist/esm/icons/cable-car.mjs
  var CableCar = [
    ["path", { d: "M10 3h.01" }],
    ["path", { d: "M14 2h.01" }],
    ["path", { d: "m2 9 20-5" }],
    ["path", { d: "M12 12V6.5" }],
    ["rect", { width: "16", height: "10", x: "4", y: "12", rx: "3" }],
    ["path", { d: "M9 12v5" }],
    ["path", { d: "M15 12v5" }],
    ["path", { d: "M4 17h16" }]
  ];

  // node_modules/lucide/dist/esm/icons/cake-slice.mjs
  var CakeSlice = [
    ["path", { d: "M16 13H3" }],
    ["path", { d: "M16 17H3" }],
    [
      "path",
      {
        d: "m7.2 7.9-3.388 2.5A2 2 0 0 0 3 12.01V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-8.654c0-2-2.44-6.026-6.44-8.026a1 1 0 0 0-1.082.057L10.4 5.6"
      }
    ],
    ["circle", { cx: "9", cy: "7", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/cake.mjs
  var Cake = [
    ["path", { d: "M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" }],
    ["path", { d: "M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" }],
    ["path", { d: "M2 21h20" }],
    ["path", { d: "M7 8v3" }],
    ["path", { d: "M12 8v3" }],
    ["path", { d: "M17 8v3" }],
    ["path", { d: "M7 4h.01" }],
    ["path", { d: "M12 4h.01" }],
    ["path", { d: "M17 4h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-1.mjs
  var Calendar1 = [
    ["path", { d: "M11 13h1v4" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/calculator.mjs
  var Calculator = [
    ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2" }],
    ["line", { x1: "8", x2: "16", y1: "6", y2: "6" }],
    ["line", { x1: "16", x2: "16", y1: "14", y2: "18" }],
    ["path", { d: "M16 10h.01" }],
    ["path", { d: "M12 10h.01" }],
    ["path", { d: "M8 10h.01" }],
    ["path", { d: "M12 14h.01" }],
    ["path", { d: "M8 14h.01" }],
    ["path", { d: "M12 18h.01" }],
    ["path", { d: "M8 18h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-arrow-down.mjs
  var CalendarArrowDown = [
    ["path", { d: "m14 17 4 4 4-4" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M18 13v8" }],
    ["path", { d: "M21 10.354V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h7.343" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-arrow-left.mjs
  var CalendarArrowLeft = [
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M21 9H3" }],
    ["path", { d: "M3 12.34V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2h-7.35" }],
    ["path", { d: "M3 18h6" }],
    ["path", { d: "m6 21-3-3 3-3" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-arrow-right.mjs
  var CalendarArrowRight = [
    ["path", { d: "M16 2v3" }],
    ["path", { d: "m18 21 3-3h-6" }],
    ["path", { d: "M21 12.34V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h7.35" }],
    ["path", { d: "m21 18-3-3" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-arrow-up.mjs
  var CalendarArrowUp = [
    ["path", { d: "m14 17 4-4 4 4" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M18 21v-8" }],
    ["path", { d: "M21 10.343V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h9" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-check-2.mjs
  var CalendarCheck2 = [
    ["path", { d: "M 19 3 L 5 3" }],
    ["path", { d: "M 21 13 L 21 5" }],
    ["path", { d: "M 21 5 A2 2 0 0 0 19 3" }],
    ["path", { d: "M 3 19 A2 2 0 0 0 5 21" }],
    ["path", { d: "M 3 5 L 3 19" }],
    ["path", { d: "M 5 3 A2 2 0 0 0 3 5" }],
    ["path", { d: "m16 19 2 2 4-4" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M5 21 L12.5 21" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-chevrons-left.mjs
  var CalendarChevronsLeft = [
    ["path", { d: "m11 21-3-3 3-3" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M21 9H3" }],
    ["path", { d: "M3 11.5V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2h-4" }],
    ["path", { d: "m5 21-3-3 3-3" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-check.mjs
  var CalendarCheck = [
    ["path", { d: "M8 2v3" }],
    ["path", { d: "M16 2v3" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "m9 15 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-chevrons-right.mjs
  var CalendarChevronsRight = [
    ["path", { d: "m13 21 3-3-3-3" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "m19 21 3-3-3-3" }],
    ["path", { d: "M21 11.5V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h4" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-clock.mjs
  var CalendarClock = [
    ["path", { d: "M16 14v2.2l1.6 1" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338" }],
    ["path", { d: "M3 9h5.859" }],
    ["path", { d: "M8 2v3" }],
    ["circle", { cx: "16", cy: "16", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-cog.mjs
  var CalendarCog = [
    ["path", { d: "m15.228 16.852-.923-.383" }],
    ["path", { d: "m15.228 19.148-.923.383" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "m16.47 14.305.382.923" }],
    ["path", { d: "m16.852 20.772-.383.924" }],
    ["path", { d: "m19.148 15.228.383-.923" }],
    ["path", { d: "m19.53 21.696-.382-.924" }],
    ["path", { d: "m20.773 16.852.924-.383" }],
    ["path", { d: "m20.773 19.148.924.383" }],
    ["path", { d: "M21 10.5V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h5.5" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }],
    ["circle", { cx: "18", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-days.mjs
  var CalendarDays = [
    ["path", { d: "M8 2v3" }],
    ["path", { d: "M16 2v3" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 13h.01" }],
    ["path", { d: "M12 13h.01" }],
    ["path", { d: "M16 13h.01" }],
    ["path", { d: "M8 17h.01" }],
    ["path", { d: "M12 17h.01" }],
    ["path", { d: "M16 17h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-fold.mjs
  var CalendarFold = [
    ["path", { d: "M16 2v3" }],
    [
      "path",
      {
        d: "M21 15V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10v-5a1 1 0 011-1za2.4 2.4 0 01-.706 1.706l-3.588 3.588A2.4 2.4 0 0115 21"
      }
    ],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-minus-2.mjs
  var CalendarMinus2 = [
    ["path", { d: "M8 2v3" }],
    ["path", { d: "M16 2v3" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M10 15h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-heart.mjs
  var CalendarHeart = [
    ["path", { d: "M12.127 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5.125" }],
    [
      "path",
      {
        d: "M14.62 17.8A2.25 2.25 0 1118 14.836a2.25 2.25 0 113.38 2.966l-2.626 2.856a.998.998 0 01-1.507 0z"
      }
    ],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-minus.mjs
  var CalendarMinus = [
    ["path", { d: "M16 18h6" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M21 14V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h8.3" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-off.mjs
  var CalendarOff = [
    ["path", { d: "M16 2v3" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M21 9h-5.5" }],
    ["path", { d: "M3 9h6" }],
    ["path", { d: "M3.586 3.586A2 2 0 003 5v14a2 2 0 002 2h14a2 2 0 001.414-.586" }],
    ["path", { d: "M8.656 3H19a2 2 0 012 2v10.344" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-plus-2.mjs
  var CalendarPlus2 = [
    ["path", { d: "M8 2v3" }],
    ["path", { d: "M16 2v3" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M10 15h4" }],
    ["path", { d: "M12 13v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-plus.mjs
  var CalendarPlus = [
    ["path", { d: "M16 18h6" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M19 15v6" }],
    ["path", { d: "M21 11.5V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h8.3" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-range.mjs
  var CalendarRange = [
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }],
    ["path", { d: "M17 13h-6" }],
    ["path", { d: "M13 17H7" }],
    ["path", { d: "M7 13h.01" }],
    ["path", { d: "M17 17h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-search.mjs
  var CalendarSearch = [
    ["path", { d: "M16 2v3" }],
    ["path", { d: "M21 10.69V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h7.25" }],
    ["path", { d: "m22 21-1.875-1.875" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }],
    ["circle", { cx: "18", cy: "17", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-sync.mjs
  var CalendarSync = [
    ["path", { d: "M11 10v4h4" }],
    ["path", { d: "m11 14 1.535-1.605a5 5 0 018 1.5" }],
    ["path", { d: "M16 2v3" }],
    ["path", { d: "m21 18-1.535 1.605a5 5 0 01-8-1.5" }],
    ["path", { d: "M21 22v-4h-4" }],
    ["path", { d: "M21 8.517V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h3.517" }],
    ["path", { d: "M3 9h4" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-x-2.mjs
  var CalendarX2 = [
    ["path", { d: "M16 2v3" }],
    ["path", { d: "m17 16 5 5" }],
    ["path", { d: "m17 21 5-5" }],
    ["path", { d: "M21 12V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h8" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M8 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar-x.mjs
  var CalendarX = [
    ["path", { d: "M8 2v3" }],
    ["path", { d: "M16 2v3" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "m14 13-4 4" }],
    ["path", { d: "m10 13 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendar.mjs
  var Calendar = [
    ["path", { d: "M8 2v3" }],
    ["path", { d: "M16 2v3" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M3 9h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/calendars.mjs
  var Calendars = [
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M15.726 21.01A2 2 0 0 1 14 22H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2" }],
    ["path", { d: "M18 2v2" }],
    ["path", { d: "M2 13h2" }],
    ["path", { d: "M8 8h14" }],
    ["rect", { x: "8", y: "3", width: "14", height: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/camera-off.mjs
  var CameraOff = [
    ["path", { d: "M14.564 14.558a3 3 0 1 1-4.122-4.121" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M20 20H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 .819-.175" }],
    [
      "path",
      {
        d: "M9.695 4.024A2 2 0 0 1 10.004 4h3.993a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v7.344"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/camera.mjs
  var Camera = [
    [
      "path",
      {
        d: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"
      }
    ],
    ["circle", { cx: "12", cy: "13", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/can-soda.mjs
  var CanSoda = [
    ["path", { d: "m17 22 1.664-2.496a2 2 0 00.336-1.11V5.606a2 2 0 00-.336-1.11L17 2" }],
    ["path", { d: "M18 22H6" }],
    ["path", { d: "M18 2H6" }],
    ["path", { d: "M5 17h14" }],
    ["path", { d: "M5 7h14" }],
    ["path", { d: "m7 22-1.664-2.496A2 2 0 015 18.394V5.606a2 2 0 01.336-1.11L7 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/can.mjs
  var Can = [
    ["path", { d: "M21 10.5a9 2.5 0 01-18 0v8a9 2.5 0 0018 0z" }],
    ["path", { d: "M21 10.5A9 2.5 25.32 004.59 3.47 9 2.5 25.32 0021 10.5" }],
    ["path", { d: "M3 10.5a9 2.5 0 016.527-2.405" }],
    ["path", { d: "M9 16.858a31 31 0 006 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/candy-cane.mjs
  var CandyCane = [
    ["path", { d: "m10.8 5 2.111 4.223" }],
    ["path", { d: "M17.75 7 15 2.1" }],
    ["path", { d: "m4.874 14.647 2.12 4.24" }],
    [
      "path",
      { d: "M5.7 21a2 2 0 0 1-3.5-2l8.6-14a6 6 0 0 1 10.4 6 2 2 0 1 1-3.464-2 2 2 0 1 0-3.464-2z" }
    ],
    ["path", { d: "m7.906 9.712 2.005 4.411" }]
  ];

  // node_modules/lucide/dist/esm/icons/candy-off.mjs
  var CandyOff = [
    ["path", { d: "M10 10v7.9" }],
    ["path", { d: "M11.802 6.145a5 5 0 0 1 6.053 6.053" }],
    ["path", { d: "M14 6.1v2.243" }],
    ["path", { d: "m15.5 15.571-.964.964a5 5 0 0 1-7.071 0 5 5 0 0 1 0-7.07l.964-.965" }],
    [
      "path",
      {
        d: "M16 7V3a1 1 0 0 1 1.707-.707 2.5 2.5 0 0 0 2.152.717 1 1 0 0 1 1.131 1.131 2.5 2.5 0 0 0 .717 2.152A1 1 0 0 1 21 8h-4"
      }
    ],
    ["path", { d: "m2 2 20 20" }],
    [
      "path",
      {
        d: "M8 17v4a1 1 0 0 1-1.707.707 2.5 2.5 0 0 0-2.152-.717 1 1 0 0 1-1.131-1.131 2.5 2.5 0 0 0-.717-2.152A1 1 0 0 1 3 16h4"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/candy.mjs
  var Candy = [
    ["path", { d: "M10 7v10.9" }],
    ["path", { d: "M14 6.1V17" }],
    [
      "path",
      {
        d: "M16 7V3a1 1 0 0 1 1.707-.707 2.5 2.5 0 0 0 2.152.717 1 1 0 0 1 1.131 1.131 2.5 2.5 0 0 0 .717 2.152A1 1 0 0 1 21 8h-4"
      }
    ],
    [
      "path",
      {
        d: "M16.536 7.465a5 5 0 0 0-7.072 0l-2 2a5 5 0 0 0 0 7.07 5 5 0 0 0 7.072 0l2-2a5 5 0 0 0 0-7.07"
      }
    ],
    [
      "path",
      {
        d: "M8 17v4a1 1 0 0 1-1.707.707 2.5 2.5 0 0 0-2.152-.717 1 1 0 0 1-1.131-1.131 2.5 2.5 0 0 0-.717-2.152A1 1 0 0 1 3 16h4"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/cannabis-off.mjs
  var CannabisOff = [
    ["path", { d: "M12 22v-4c1.5 1.5 3.5 3 6 3 0-1.5-.5-3.5-2-5" }],
    ["path", { d: "M13.988 8.327C13.902 6.054 13.365 3.82 12 2a9.3 9.3 0 0 0-1.445 2.9" }],
    ["path", { d: "M17.375 11.725C18.882 10.53 21 7.841 21 6c-2.324 0-5.08 1.296-6.662 2.684" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M21.024 15.378A15 15 0 0 0 22 15c-.426-1.279-2.67-2.557-4.25-2.907" }],
    [
      "path",
      {
        d: "M6.995 6.992C5.714 6.4 4.29 6 3 6c0 2 2.5 5 4 6-1.5 0-4.5 1.5-5 3 3.5 1.5 6 1 6 1-1.5 1.5-2 3.5-2 5 2.5 0 4.5-1.5 6-3"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/cannabis.mjs
  var Cannabis = [
    ["path", { d: "M12 22v-4" }],
    [
      "path",
      {
        d: "M7 12c-1.5 0-4.5 1.5-5 3 3.5 1.5 6 1 6 1-1.5 1.5-2 3.5-2 5 2.5 0 4.5-1.5 6-3 1.5 1.5 3.5 3 6 3 0-1.5-.5-3.5-2-5 0 0 2.5.5 6-1-.5-1.5-3.5-3-5-3 1.5-1 4-4 4-6-2.5 0-5.5 1.5-7 3 0-2.5-.5-5-2-7-1.5 2-2 4.5-2 7-1.5-1.5-4.5-3-7-3 0 2 2.5 5 4 6"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/captions-off.mjs
  var CaptionsOff = [
    ["path", { d: "M10.5 5H19a2 2 0 0 1 2 2v8.5" }],
    ["path", { d: "M17 11h-.5" }],
    ["path", { d: "M19 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M7 11h4" }],
    ["path", { d: "M7 15h2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/captions.mjs
  var Captions = [
    ["rect", { width: "18", height: "14", x: "3", y: "5", rx: "2", ry: "2" }],
    ["path", { d: "M7 15h4M15 15h2M7 11h2M13 11h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/car-battery.mjs
  var CarBattery = [
    ["path", { d: "M14 13h4" }],
    ["path", { d: "M16 15v-4" }],
    ["path", { d: "M18 5v2" }],
    ["path", { d: "M6 13h4" }],
    ["path", { d: "M6 5v2" }],
    ["rect", { x: "2", y: "7", width: "20", height: "12", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/car-front.mjs
  var CarFront = [
    ["path", { d: "m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8" }],
    ["path", { d: "M7 14h.01" }],
    ["path", { d: "M17 14h.01" }],
    ["rect", { width: "18", height: "8", x: "3", y: "10", rx: "2" }],
    ["path", { d: "M5 18v2" }],
    ["path", { d: "M19 18v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/car-taxi-front.mjs
  var CarTaxiFront = [
    ["path", { d: "M10 2h4" }],
    ["path", { d: "m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8" }],
    ["path", { d: "M7 14h.01" }],
    ["path", { d: "M17 14h.01" }],
    ["rect", { width: "18", height: "8", x: "3", y: "10", rx: "2" }],
    ["path", { d: "M5 18v2" }],
    ["path", { d: "M19 18v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/car.mjs
  var Car = [
    [
      "path",
      {
        d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
      }
    ],
    ["circle", { cx: "7", cy: "17", r: "2" }],
    ["path", { d: "M9 17h6" }],
    ["circle", { cx: "17", cy: "17", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/caravan.mjs
  var Caravan = [
    ["path", { d: "M18 19V9a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v8a2 2 0 0 0 2 2h2" }],
    ["path", { d: "M2 9h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2" }],
    ["path", { d: "M22 17v1a1 1 0 0 1-1 1H10v-9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9" }],
    ["circle", { cx: "8", cy: "19", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/card-sim.mjs
  var CardSim = [
    ["path", { d: "M12 14v4" }],
    [
      "path",
      {
        d: "M14.172 2a2 2 0 0 1 1.414.586l3.828 3.828A2 2 0 0 1 20 7.828V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "M8 14h8" }],
    ["rect", { x: "8", y: "10", width: "8", height: "8", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/carrot.mjs
  var Carrot = [
    ["path", { d: "M15 16a1 1 0 0 0-7-7q-4 4-5.987 12.385a.5.5 0 0 0 .602.602Q11 20 15 16l-3-3" }],
    ["path", { d: "M15 9q4 4 7 0-3-4-7 0 4-4 0-7-4 3 0 7" }],
    ["path", { d: "m8 15-2.58-2.58" }]
  ];

  // node_modules/lucide/dist/esm/icons/carton-off.mjs
  var CartonOff = [
    ["path", { d: "M10 10H5v10a2 2 0 002 2h10a2 2 0 002-2v-1" }],
    ["path", { d: "M13 22v-9" }],
    ["path", { d: "M13.902 8.245 16 6h-4.343" }],
    ["path", { d: "M19 13.343V10a2 2 0 00-.539-1.367L16 6V3a1 1 0 00-1-1H9a1 1 0 00-.857.486" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M7.034 7.034 5.539 8.633A2 2 0 005 10" }]
  ];

  // node_modules/lucide/dist/esm/icons/carton.mjs
  var Carton = [
    [
      "path",
      {
        d: "M13 22V10a2 2 0 01.539-1.367L16 6H8L5.539 8.633A2 2 0 005 10v10a2 2 0 002 2h10a2 2 0 002-2V10a2 2 0 00-.539-1.367L16 6V3a1 1 0 00-1-1H9a1 1 0 00-1 1v3"
      }
    ],
    ["path", { d: "M5 10h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/case-lower.mjs
  var CaseLower = [
    ["path", { d: "M10 9v7" }],
    ["path", { d: "M14 6v10" }],
    ["circle", { cx: "17.5", cy: "12.5", r: "3.5" }],
    ["circle", { cx: "6.5", cy: "12.5", r: "3.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/case-sensitive.mjs
  var CaseSensitive = [
    ["path", { d: "m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" }],
    ["path", { d: "M22 9v7" }],
    ["path", { d: "M3.304 13h6.392" }],
    ["circle", { cx: "18.5", cy: "12.5", r: "3.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/case-upper.mjs
  var CaseUpper = [
    [
      "path",
      { d: "M15 11h4.5a1 1 0 0 1 0 5h-4a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h3a1 1 0 0 1 0 5" }
    ],
    ["path", { d: "m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" }],
    ["path", { d: "M3.304 13h6.392" }]
  ];

  // node_modules/lucide/dist/esm/icons/cassette-tape.mjs
  var CassetteTape = [
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
    ["circle", { cx: "8", cy: "10", r: "2" }],
    ["path", { d: "M8 12h8" }],
    ["circle", { cx: "16", cy: "10", r: "2" }],
    ["path", { d: "m6 20 .7-2.9A1.4 1.4 0 0 1 8.1 16h7.8a1.4 1.4 0 0 1 1.4 1l.7 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/cast.mjs
  var Cast = [
    ["path", { d: "M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" }],
    ["path", { d: "M2 12a9 9 0 0 1 8 8" }],
    ["path", { d: "M2 16a5 5 0 0 1 4 4" }],
    ["line", { x1: "2", x2: "2.01", y1: "20", y2: "20" }]
  ];

  // node_modules/lucide/dist/esm/icons/castle.mjs
  var Castle = [
    ["path", { d: "M10 5V3" }],
    ["path", { d: "M14 5V3" }],
    ["path", { d: "M15 21v-3a3 3 0 0 0-6 0v3" }],
    ["path", { d: "M18 3v8" }],
    ["path", { d: "M18 5H6" }],
    ["path", { d: "M22 11H2" }],
    ["path", { d: "M22 9v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9" }],
    ["path", { d: "M6 3v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/cat.mjs
  var Cat = [
    [
      "path",
      {
        d: "M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"
      }
    ],
    ["path", { d: "M8 14v.5" }],
    ["path", { d: "M16 14v.5" }],
    ["path", { d: "M11.25 16.25h1.5L12 17l-.75-.75Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/cctv-off.mjs
  var CctvOff = [
    [
      "path",
      {
        d: "m12.309 6.652 4.797 2.401a1 1 0 0 1 .447 1.341l-.501 1.001.605.605h2.725a1 1 0 0 1 .894 1.447l-.724 1.448"
      }
    ],
    [
      "path",
      {
        d: "m15.166 15.166-.719 1.439a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.9 2.9 0 0 1 .873-1.037"
      }
    ],
    ["path", { d: "M2 19h3.76a2 2 0 0 0 1.8-1.1l1.441-2.902" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M2 21v-4" }],
    ["path", { d: "M7 9h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/cctv.mjs
  var Cctv = [
    [
      "path",
      { d: "M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-1.708.134l-2.124-2.97" }
    ],
    [
      "path",
      {
        d: "M17.106 9.053a1 1 0 0 1 .447 1.341l-3.106 6.211a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.92 2.92 0 0 1 3.92-1.3z"
      }
    ],
    ["path", { d: "M2 19h3.76a2 2 0 0 0 1.8-1.1L9 15" }],
    ["path", { d: "M2 21v-4" }],
    ["path", { d: "M7 9h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/certificate.mjs
  var Certificate = [
    ["path", { d: "M12 10H6" }],
    [
      "path",
      {
        d: "m20.69 15.479 1.29 4.88a.5.5 0 01-.698.591l-1.843-.849a1 1 0 00-.879.001l-1.846.85a.5.5 0 01-.692-.593l1.29-4.88"
      }
    ],
    ["path", { d: "M22 6.675V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h8" }],
    ["path", { d: "M6 14h4" }],
    ["circle", { cx: "19", cy: "13", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-area.mjs
  var ChartArea = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    [
      "path",
      {
        d: "M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/chart-bar-big.mjs
  var ChartBarBig = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["rect", { x: "7", y: "13", width: "9", height: "4", rx: "1" }],
    ["rect", { x: "7", y: "5", width: "12", height: "4", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-bar-decreasing.mjs
  var ChartBarDecreasing = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M7 11h8" }],
    ["path", { d: "M7 16h3" }],
    ["path", { d: "M7 6h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-bar-increasing.mjs
  var ChartBarIncreasing = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M7 11h8" }],
    ["path", { d: "M7 16h12" }],
    ["path", { d: "M7 6h3" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-bar.mjs
  var ChartBar = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M7 16h8" }],
    ["path", { d: "M7 11h12" }],
    ["path", { d: "M7 6h3" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-bar-stacked.mjs
  var ChartBarStacked = [
    ["path", { d: "M11 13v4" }],
    ["path", { d: "M15 5v4" }],
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["rect", { x: "7", y: "13", width: "9", height: "4", rx: "1" }],
    ["rect", { x: "7", y: "5", width: "12", height: "4", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-bell-curve.mjs
  var ChartBellCurve = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M7 16c3.5 0 2.5-10 6-10s2.5 10 6 10" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-candlestick.mjs
  var ChartCandlestick = [
    ["path", { d: "M9 5v4" }],
    ["rect", { width: "4", height: "6", x: "7", y: "9", rx: "1" }],
    ["path", { d: "M9 15v2" }],
    ["path", { d: "M17 3v2" }],
    ["rect", { width: "4", height: "8", x: "15", y: "5", rx: "1" }],
    ["path", { d: "M17 13v3" }],
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-column-big.mjs
  var ChartColumnBig = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["rect", { x: "15", y: "5", width: "4", height: "12", rx: "1" }],
    ["rect", { x: "7", y: "8", width: "4", height: "9", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-column-increasing.mjs
  var ChartColumnIncreasing = [
    ["path", { d: "M13 17V9" }],
    ["path", { d: "M18 17V5" }],
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M8 17v-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-column-decreasing.mjs
  var ChartColumnDecreasing = [
    ["path", { d: "M13 17V9" }],
    ["path", { d: "M18 17v-3" }],
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M8 17V5" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-column-stacked.mjs
  var ChartColumnStacked = [
    ["path", { d: "M11 13H7" }],
    ["path", { d: "M19 9h-4" }],
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["rect", { x: "15", y: "5", width: "4", height: "12", rx: "1" }],
    ["rect", { x: "7", y: "8", width: "4", height: "9", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-column.mjs
  var ChartColumn = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M18 17V9" }],
    ["path", { d: "M13 17V5" }],
    ["path", { d: "M8 17v-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-gantt.mjs
  var ChartGantt = [
    ["path", { d: "M10 6h8" }],
    ["path", { d: "M12 16h6" }],
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M8 11h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-line.mjs
  var ChartLine = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "m19 9-5 5-4-4-3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-network.mjs
  var ChartNetwork = [
    ["path", { d: "m13.11 7.664 1.78 2.672" }],
    ["path", { d: "m14.162 12.788-3.324 1.424" }],
    ["path", { d: "m20 4-6.06 1.515" }],
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["circle", { cx: "12", cy: "6", r: "2" }],
    ["circle", { cx: "16", cy: "12", r: "2" }],
    ["circle", { cx: "9", cy: "15", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-no-axes-column-decreasing.mjs
  var ChartNoAxesColumnDecreasing = [
    ["path", { d: "M5 21V3" }],
    ["path", { d: "M12 21V9" }],
    ["path", { d: "M19 21v-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-no-axes-column-increasing.mjs
  var ChartNoAxesColumnIncreasing = [
    ["path", { d: "M5 21v-6" }],
    ["path", { d: "M12 21V9" }],
    ["path", { d: "M19 21V3" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-no-axes-column.mjs
  var ChartNoAxesColumn = [
    ["path", { d: "M5 21v-6" }],
    ["path", { d: "M12 21V3" }],
    ["path", { d: "M19 21V9" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-no-axes-combined.mjs
  var ChartNoAxesCombined = [
    ["path", { d: "M12 16v5" }],
    ["path", { d: "M16 14.639V21" }],
    ["path", { d: "M20 10.656V21" }],
    ["path", { d: "m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" }],
    ["path", { d: "M4 18.463V21" }],
    ["path", { d: "M8 14.656V21" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-no-axes-gantt.mjs
  var ChartNoAxesGantt = [
    ["path", { d: "M6 5h12" }],
    ["path", { d: "M4 12h10" }],
    ["path", { d: "M12 19h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-pie.mjs
  var ChartPie = [
    [
      "path",
      {
        d: "M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"
      }
    ],
    ["path", { d: "M21.21 15.89A10 10 0 1 1 8 2.83" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-quadrant.mjs
  var ChartQuadrant = [
    ["path", { d: "M13 3v18" }],
    ["path", { d: "M3 12h18" }],
    ["path", { d: "M3 3v16a2 2 0 002 2h16" }],
    ["circle", { cx: "17.5", cy: "5.5", r: "0.5", fill: "currentColor" }],
    ["circle", { cx: "19.5", cy: "16.5", r: "0.5", fill: "currentColor" }],
    ["circle", { cx: "7.5", cy: "16.5", r: "0.5", fill: "currentColor" }],
    ["circle", { cx: "7.5", cy: "7.5", r: "0.5", fill: "currentColor" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-radar.mjs
  var ChartRadar = [
    ["path", { d: "M12 2v10" }],
    ["path", { d: "m16 18 3.085-8.125L12 4.103 3.473 9.442l3.196 10.554z" }],
    ["path", { d: "m2 9 10 3 6 9" }],
    ["path", { d: "m6 21 6-9 10-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-scatter.mjs
  var ChartScatter = [
    ["circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor" }],
    ["circle", { cx: "18.5", cy: "5.5", r: ".5", fill: "currentColor" }],
    ["circle", { cx: "11.5", cy: "11.5", r: ".5", fill: "currentColor" }],
    ["circle", { cx: "7.5", cy: "16.5", r: ".5", fill: "currentColor" }],
    ["circle", { cx: "17.5", cy: "14.5", r: ".5", fill: "currentColor" }],
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }]
  ];

  // node_modules/lucide/dist/esm/icons/chart-spline.mjs
  var ChartSpline = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-7" }]
  ];

  // node_modules/lucide/dist/esm/icons/check-check.mjs
  var CheckCheck = [
    ["path", { d: "M18 6 7 17l-5-5" }],
    ["path", { d: "m22 10-7.5 7.5L13 16" }]
  ];

  // node_modules/lucide/dist/esm/icons/check.mjs
  var Check = [["path", { d: "M20 6 9 17l-5-5" }]];

  // node_modules/lucide/dist/esm/icons/check-line.mjs
  var CheckLine = [
    ["path", { d: "M20 4L9 15" }],
    ["path", { d: "M21 19L3 19" }],
    ["path", { d: "M9 15L4 10" }]
  ];

  // node_modules/lucide/dist/esm/icons/chef-hat.mjs
  var ChefHat = [
    ["path", { d: "M10 11v5" }],
    ["path", { d: "M14 11v5" }],
    [
      "path",
      {
        d: "M6 12.65c0-.457-.316-.844-.727-1.041A4 4 0 017.52 4.034a1.53 1.53 0 001.367-.547 4 4 0 016.225 0 1.53 1.53 0 001.367.547 4 4 0 012.248 7.575c-.411.197-.727.584-.727 1.04V19a2 2 0 01-2 2H8a2 2 0 01-2-2z"
      }
    ],
    ["path", { d: "M6 16h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/cherry.mjs
  var Cherry = [
    ["path", { d: "M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" }],
    ["path", { d: "M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" }],
    ["path", { d: "M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12" }],
    ["path", { d: "M22 9c-4.29 0-7.14-2.33-10-7 5.71 0 10 4.67 10 7Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/chess-bishop.mjs
  var ChessBishop = [
    ["path", { d: "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" }],
    [
      "path",
      {
        d: "M15 18c1.5-.615 3-2.461 3-4.923C18 8.769 14.5 4.462 12 2 9.5 4.462 6 8.77 6 13.077 6 15.539 7.5 17.385 9 18"
      }
    ],
    ["path", { d: "m16 7-2.5 2.5" }],
    ["path", { d: "M9 2h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/chess-king.mjs
  var ChessKing = [
    ["path", { d: "M4 20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" }],
    [
      "path",
      {
        d: "m6.7 18-1-1C4.35 15.682 3 14.09 3 12a5 5 0 0 1 4.95-5c1.584 0 2.7.455 4.05 1.818C13.35 7.455 14.466 7 16.05 7A5 5 0 0 1 21 12c0 2.082-1.359 3.673-2.7 5l-1 1"
      }
    ],
    ["path", { d: "M10 4h4" }],
    ["path", { d: "M12 2v6.818" }]
  ];

  // node_modules/lucide/dist/esm/icons/chess-knight.mjs
  var ChessKnight = [
    ["path", { d: "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" }],
    [
      "path",
      {
        d: "M16.5 18c1-2 2.5-5 2.5-9a7 7 0 0 0-7-7H6.635a1 1 0 0 0-.768 1.64L7 5l-2.32 5.802a2 2 0 0 0 .95 2.526l2.87 1.456"
      }
    ],
    ["path", { d: "m15 5 1.425-1.425" }],
    ["path", { d: "m17 8 1.53-1.53" }],
    ["path", { d: "M9.713 12.185 7 18" }]
  ];

  // node_modules/lucide/dist/esm/icons/chess-pawn.mjs
  var ChessPawn = [
    ["path", { d: "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" }],
    ["path", { d: "m14.5 10 1.5 8" }],
    ["path", { d: "M7 10h10" }],
    ["path", { d: "m8 18 1.5-8" }],
    ["circle", { cx: "12", cy: "6", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevron-down.mjs
  var ChevronDown = [["path", { d: "m6 9 6 6 6-6" }]];

  // node_modules/lucide/dist/esm/icons/chess-queen.mjs
  var ChessQueen = [
    ["path", { d: "m10.68 5.499-.996 4.982a.65.65 0 01-1.131.295L5.885 7.663" }],
    ["path", { d: "m13.32 5.5.995 4.98a.65.65 0 001.131.296l2.668-3.113" }],
    ["path", { d: "M20.428 8.952 17.5 18" }],
    ["path", { d: "M4 20a2 2 0 012-2h12a2 2 0 012 2v1a1 1 0 01-1 1H5a1 1 0 01-1-1z" }],
    ["path", { d: "M6.5 18 3.571 8.952" }],
    ["circle", { cx: "12", cy: "4", r: "2" }],
    ["circle", { cx: "20", cy: "7", r: "2" }],
    ["circle", { cx: "4", cy: "7", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/chess-rook.mjs
  var ChessRook = [
    ["path", { d: "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" }],
    ["path", { d: "M10 2v2" }],
    ["path", { d: "M14 2v2" }],
    ["path", { d: "m17 18-1-9" }],
    ["path", { d: "M6 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2" }],
    ["path", { d: "M6 4h12" }],
    ["path", { d: "m7 18 1-9" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevron-first.mjs
  var ChevronFirst = [
    ["path", { d: "m17 18-6-6 6-6" }],
    ["path", { d: "M7 6v12" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevron-last.mjs
  var ChevronLast = [
    ["path", { d: "m7 18 6-6-6-6" }],
    ["path", { d: "M17 6v12" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevron-left.mjs
  var ChevronLeft = [["path", { d: "m15 18-6-6 6-6" }]];

  // node_modules/lucide/dist/esm/icons/chevron-right.mjs
  var ChevronRight = [["path", { d: "m9 18 6-6-6-6" }]];

  // node_modules/lucide/dist/esm/icons/chevron-up.mjs
  var ChevronUp = [["path", { d: "m18 15-6-6-6 6" }]];

  // node_modules/lucide/dist/esm/icons/chevrons-down-up.mjs
  var ChevronsDownUp = [
    ["path", { d: "m7 20 5-5 5 5" }],
    ["path", { d: "m7 4 5 5 5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevrons-down.mjs
  var ChevronsDown = [
    ["path", { d: "m7 6 5 5 5-5" }],
    ["path", { d: "m7 13 5 5 5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevrons-left-right-ellipsis.mjs
  var ChevronsLeftRightEllipsis = [
    ["path", { d: "M12 12h.01" }],
    ["path", { d: "M16 12h.01" }],
    ["path", { d: "m17 7 5 5-5 5" }],
    ["path", { d: "m7 7-5 5 5 5" }],
    ["path", { d: "M8 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevrons-left-right.mjs
  var ChevronsLeftRight = [
    ["path", { d: "m9 7-5 5 5 5" }],
    ["path", { d: "m15 7 5 5-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevrons-left.mjs
  var ChevronsLeft = [
    ["path", { d: "m11 17-5-5 5-5" }],
    ["path", { d: "m18 17-5-5 5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevrons-right-left.mjs
  var ChevronsRightLeft = [
    ["path", { d: "m20 17-5-5 5-5" }],
    ["path", { d: "m4 17 5-5-5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevrons-right.mjs
  var ChevronsRight = [
    ["path", { d: "m6 17 5-5-5-5" }],
    ["path", { d: "m13 17 5-5-5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevrons-up-down.mjs
  var ChevronsUpDown = [
    ["path", { d: "m7 15 5 5 5-5" }],
    ["path", { d: "m7 9 5-5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/chevrons-up.mjs
  var ChevronsUp = [
    ["path", { d: "m17 11-5-5-5 5" }],
    ["path", { d: "m17 18-5-5-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/church.mjs
  var Church = [
    ["path", { d: "M10 9h4" }],
    ["path", { d: "M12 7v5" }],
    ["path", { d: "M14 21v-3a2 2 0 0 0-4 0v3" }],
    [
      "path",
      {
        d: "m18 9 3.52 2.147a1 1 0 0 1 .48.854V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.999a1 1 0 0 1 .48-.854L6 9"
      }
    ],
    ["path", { d: "M6 21V7a1 1 0 0 1 .376-.782l5-3.999a1 1 0 0 1 1.249.001l5 4A1 1 0 0 1 18 7v14" }]
  ];

  // node_modules/lucide/dist/esm/icons/cigarette-off.mjs
  var CigaretteOff = [
    ["path", { d: "M12 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h13" }],
    ["path", { d: "M18 8c0-2.5-2-2.5-2-5" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M21 12a1 1 0 0 1 1 1v2a1 1 0 0 1-.5.866" }],
    ["path", { d: "M22 8c0-2.5-2-2.5-2-5" }],
    ["path", { d: "M7 12v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/cigarette.mjs
  var Cigarette = [
    ["path", { d: "M17 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h14" }],
    ["path", { d: "M18 8c0-2.5-2-2.5-2-5" }],
    ["path", { d: "M21 16a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" }],
    ["path", { d: "M22 8c0-2.5-2-2.5-2-5" }],
    ["path", { d: "M7 12v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-arrow-down.mjs
  var CircleArrowDown = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 8v8" }],
    ["path", { d: "m8 12 4 4 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-arrow-left.mjs
  var CircleArrowLeft = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m12 8-4 4 4 4" }],
    ["path", { d: "M16 12H8" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-arrow-out-down-left.mjs
  var CircleArrowOutDownLeft = [
    ["path", { d: "M2 12a10 10 0 1 1 10 10" }],
    ["path", { d: "m2 22 10-10" }],
    ["path", { d: "M8 22H2v-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-arrow-out-down-right.mjs
  var CircleArrowOutDownRight = [
    ["path", { d: "M12 22a10 10 0 1 1 10-10" }],
    ["path", { d: "M22 22 12 12" }],
    ["path", { d: "M22 16v6h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-arrow-out-up-left.mjs
  var CircleArrowOutUpLeft = [
    ["path", { d: "M2 8V2h6" }],
    ["path", { d: "m2 2 10 10" }],
    ["path", { d: "M12 2A10 10 0 1 1 2 12" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-arrow-out-up-right.mjs
  var CircleArrowOutUpRight = [
    ["path", { d: "M22 12A10 10 0 1 1 12 2" }],
    ["path", { d: "M22 2 12 12" }],
    ["path", { d: "M16 2h6v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-arrow-right.mjs
  var CircleArrowRight = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m12 16 4-4-4-4" }],
    ["path", { d: "M8 12h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-arrow-up.mjs
  var CircleArrowUp = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m16 12-4-4-4 4" }],
    ["path", { d: "M12 16V8" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-check-big.mjs
  var CircleCheckBig = [
    ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }],
    ["path", { d: "m9 11 3 3L22 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-check.mjs
  var CircleCheck = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m16 9-5.5 5.5L8 12" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-chevron-down.mjs
  var CircleChevronDown = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m16 10-4 4-4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-chevron-left.mjs
  var CircleChevronLeft = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m14 16-4-4 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-chevron-right.mjs
  var CircleChevronRight = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m10 8 4 4-4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-chevron-up.mjs
  var CircleChevronUp = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m8 14 4-4 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-chevrons-down.mjs
  var CircleChevronsDown = [
    ["path", { d: "M9 14L12 17L15 14" }],
    ["path", { d: "M9 8L12 11L15 8" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-chevrons-left.mjs
  var CircleChevronsLeft = [
    ["path", { d: "M10 9L7 12L10 15" }],
    ["path", { d: "M16 9L13 12L16 15" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-chevrons-right.mjs
  var CircleChevronsRight = [
    ["path", { d: "M14 15L17 12L14 9" }],
    ["path", { d: "M8 15L11 12L8 9" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-chevrons-up.mjs
  var CircleChevronsUp = [
    ["path", { d: "M15 10L12 7L9 10" }],
    ["path", { d: "M15 16L12 13L9 16" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-dashed-check.mjs
  var CircleDashedCheck = [
    ["path", { d: "M10.1 2.182a10 10 0 013.8 0" }],
    ["path", { d: "M13.9 21.818a10 10 0 01-3.8 0" }],
    ["path", { d: "m16 9-5.5 5.5L8 12" }],
    ["path", { d: "M17.609 3.721a10 10 0 012.69 2.7" }],
    ["path", { d: "M2.182 13.9a10 10 0 010-3.8" }],
    ["path", { d: "M20.279 17.609a10 10 0 01-2.7 2.69" }],
    ["path", { d: "M21.818 10.1a10 10 0 010 3.8" }],
    ["path", { d: "M3.721 6.391a10 10 0 012.7-2.69" }],
    ["path", { d: "M6.391 20.279a10 10 0 01-2.69-2.7" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-dashed.mjs
  var CircleDashed = [
    ["path", { d: "M10.1 2.182a10 10 0 0 1 3.8 0" }],
    ["path", { d: "M13.9 21.818a10 10 0 0 1-3.8 0" }],
    ["path", { d: "M17.609 3.721a10 10 0 0 1 2.69 2.7" }],
    ["path", { d: "M2.182 13.9a10 10 0 0 1 0-3.8" }],
    ["path", { d: "M20.279 17.609a10 10 0 0 1-2.7 2.69" }],
    ["path", { d: "M21.818 10.1a10 10 0 0 1 0 3.8" }],
    ["path", { d: "M3.721 6.391a10 10 0 0 1 2.7-2.69" }],
    ["path", { d: "M6.391 20.279a10 10 0 0 1-2.69-2.7" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-divide.mjs
  var CircleDivide = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "8", x2: "16", y1: "12", y2: "12" }],
    ["line", { x1: "12", x2: "12", y1: "16", y2: "16" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "8" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-dollar-sign.mjs
  var CircleDollarSign = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" }],
    ["path", { d: "M12 18V6" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-dot-dashed.mjs
  var CircleDotDashed = [
    ["path", { d: "M10.1 2.18a9.93 9.93 0 0 1 3.8 0" }],
    ["path", { d: "M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7" }],
    ["path", { d: "M21.82 10.1a9.93 9.93 0 0 1 0 3.8" }],
    ["path", { d: "M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69" }],
    ["path", { d: "M13.9 21.82a9.94 9.94 0 0 1-3.8 0" }],
    ["path", { d: "M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7" }],
    ["path", { d: "M2.18 13.9a9.93 9.93 0 0 1 0-3.8" }],
    ["path", { d: "M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69" }],
    ["circle", { cx: "12", cy: "12", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-dot.mjs
  var CircleDot = [
    ["circle", { cx: "12", cy: "12", r: "1" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-ellipsis.mjs
  var CircleEllipsis = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M17 12h.01" }],
    ["path", { d: "M12 12h.01" }],
    ["path", { d: "M7 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-equal.mjs
  var CircleEqual = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M7 10h10" }],
    ["path", { d: "M7 14h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-euro.mjs
  var CircleEuro = [
    ["path", { d: "M15 9.4a4 4 0 1 0 0 5.2" }],
    ["path", { d: "M7 12h5" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-fading-arrow-up.mjs
  var CircleFadingArrowUp = [
    ["path", { d: "M12 2a10 10 0 0 1 7.38 16.75" }],
    ["path", { d: "m16 12-4-4-4 4" }],
    ["path", { d: "M12 16V8" }],
    ["path", { d: "M2.5 8.875a10 10 0 0 0-.5 3" }],
    ["path", { d: "M2.83 16a10 10 0 0 0 2.43 3.4" }],
    ["path", { d: "M4.636 5.235a10 10 0 0 1 .891-.857" }],
    ["path", { d: "M8.644 21.42a10 10 0 0 0 7.631-.38" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-exclamation-point.mjs
  var CircleExclamationPoint = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-fading-check.mjs
  var CircleFadingCheck = [
    ["path", { d: "M12 2a10 10 0 017.38 16.75" }],
    ["path", { d: "m16 9-5.5 5.5L8 12" }],
    ["path", { d: "M2.5 8.875a10 10 0 00-.5 3" }],
    ["path", { d: "M2.83 16a10 10 0 002.43 3.4" }],
    ["path", { d: "M4.636 5.235a10 10 0 01.891-.857" }],
    ["path", { d: "M8.644 21.42a10 10 0 007.631-.38" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-fading-play.mjs
  var CircleFadingPlay = [
    ["path", { d: "M12 2a10 10 0 0 1 7.38 16.75" }],
    [
      "path",
      {
        d: "M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z"
      }
    ],
    ["path", { d: "M2.5 8.875a10 10 0 0 0-.5 3" }],
    ["path", { d: "M2.83 16a10 10 0 0 0 2.43 3.4" }],
    ["path", { d: "M4.636 5.235a10 10 0 0 1 .891-.857" }],
    ["path", { d: "M8.644 21.42a10 10 0 0 0 7.631-.38" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-fading-plus.mjs
  var CircleFadingPlus = [
    ["path", { d: "M12 2a10 10 0 0 1 7.38 16.75" }],
    ["path", { d: "M12 8v8" }],
    ["path", { d: "M16 12H8" }],
    ["path", { d: "M2.5 8.875a10 10 0 0 0-.5 3" }],
    ["path", { d: "M2.83 16a10 10 0 0 0 2.43 3.4" }],
    ["path", { d: "M4.636 5.235a10 10 0 0 1 .891-.857" }],
    ["path", { d: "M8.644 21.42a10 10 0 0 0 7.631-.38" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-gauge.mjs
  var CircleGauge = [
    ["path", { d: "M15.6 2.7a10 10 0 1 0 5.7 5.7" }],
    ["circle", { cx: "12", cy: "12", r: "2" }],
    ["path", { d: "M13.4 10.6 19 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-a.mjs
  var CircleLetterA = [
    ["path", { d: "M15 14H9" }],
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m8 16 3.453-7.648a.6.6 0 0 1 1.094 0L16 16" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-c.mjs
  var CircleLetterC = [
    ["path", { d: "M15 9.354a4 4 0 1 0 0 5.292" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-b.mjs
  var CircleLetterB = [
    [
      "path",
      {
        d: "M9 12h4.846a2.24 2.24 0 011.523.586 2 2 0 01.001 2.828 2.24 2.24 0 01-1.524.586H9.5a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5H13a2 2 0 010 4"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-d.mjs
  var CircleLetterD = [
    ["path", { d: "M12 8a4 4 0 010 8H9.412A.41.41 0 019 15.588V8.412A.41.41 0 019.412 8z" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-e.mjs
  var CircleLetterE = [
    ["path", { d: "M15 8H9.5a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5H15" }],
    ["path", { d: "M9 12h4" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-f.mjs
  var CircleLetterF = [
    ["path", { d: "M9 16V8.5a.5.5 0 0 1 .5-.5H15" }],
    ["path", { d: "M9 12h4" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-g.mjs
  var CircleLetterG = [
    ["path", { d: "M12.5 12H15v2.268a.88.88 0 01-.263.65A4 4 0 1112 8h2.5" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-h.mjs
  var CircleLetterH = [
    ["path", { d: "M9 16V8" }],
    ["path", { d: "M15 16V8" }],
    ["path", { d: "M9 12h6" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-j.mjs
  var CircleLetterJ = [
    ["path", { d: "M14 8v5.5a1 1 0 01-5 0V13" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-i.mjs
  var CircleLetterI = [
    ["path", { d: "M12 16V8" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-k.mjs
  var CircleLetterK = [
    ["path", { d: "M9 16V8" }],
    ["path", { d: "m11 12 4 4" }],
    ["path", { d: "m15 8-6 6" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-l.mjs
  var CircleLetterL = [
    ["path", { d: "M9 8v7.5a.5.5 0 0 0 .5.5H15" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-m.mjs
  var CircleLetterM = [
    [
      "path",
      {
        d: "M8 16.001v-7.5a.5.5 0 0 1 .9-.3l2.7 3.599a.5.5 0 0 0 .8 0l2.7-3.6a.5.5 0 0 1 .9.3v7.501"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-n.mjs
  var CircleLetterN = [
    ["path", { d: "M9 16V8.576a.496.496 0 01.937-.243l4.126 7.43A.496.496 0 0015 15.52V8" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-o.mjs
  var CircleLetterO = [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-p-off.mjs
  var CircleLetterPOff = [
    ["path", { d: "M12 12h1a2 2 0 000-4H9.5a.5.5 0 00-.5.5V9" }],
    ["path", { d: "M15.652 21.31A10 10 0 012.691 8.348" }],
    ["path", { d: "M22 22 2 2" }],
    ["path", { d: "M4.929 4.929a10 10 0 0116.729 4.483 10 10 0 01-2.588 9.658" }],
    ["path", { d: "M9 14.657V16" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-p.mjs
  var CircleLetterP = [
    ["path", { d: "M9 12h4a2 2 0 0 0 0-4H9.5a.5.5 0 0 0-.5.5V16" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-q.mjs
  var CircleLetterQ = [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["path", { d: "m16 16-2.5-2.5" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-r.mjs
  var CircleLetterR = [
    ["path", { d: "m11 12 4 4" }],
    ["path", { d: "M9 12h4a2 2 0 0 0 0-4H9.5a.5.5 0 0 0-.5.5V16" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-s.mjs
  var CircleLetterS = [
    ["path", { d: "M14.5 8H11a2 2 0 100 4h2a2 2 0 110 4H9" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-t.mjs
  var CircleLetterT = [
    ["path", { d: "M12 16V8" }],
    ["path", { d: "M9 8h6" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-u.mjs
  var CircleLetterU = [
    ["path", { d: "M15 8v5a3 3 0 1 1-6 0V8" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-w.mjs
  var CircleLetterW = [
    [
      "path",
      {
        d: "m16 8-1.591 7.598a.497.497 0 01-.97.038l-.96-3.276a.5.5 0 00-.959 0l-.96 3.276a.496.496 0 01-.969-.038L8 8"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-v.mjs
  var CircleLetterV = [
    ["path", { d: "m9 8 2.525 7.66a.5.5 0 0 0 .95 0L15 8" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-x.mjs
  var CircleLetterX = [
    ["path", { d: "m9 16 6-8" }],
    ["path", { d: "m9 8 6 8" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-y.mjs
  var CircleLetterY = [
    ["path", { d: "m9 8 3 4 3-4" }],
    ["path", { d: "M12 12v4" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-letter-z.mjs
  var CircleLetterZ = [
    ["path", { d: "M9 8h5.501a.5.5 0 0 1 .37.836L9.13 15.164A.5.5 0 0 0 9.5 16H15" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-minus.mjs
  var CircleMinus = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M8 12h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-off.mjs
  var CircleOff = [
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M8.35 2.69A10 10 0 0 1 21.3 15.65" }],
    ["path", { d: "M19.08 19.08A10 10 0 1 1 4.92 4.92" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-pause.mjs
  var CirclePause = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "10", x2: "10", y1: "15", y2: "9" }],
    ["line", { x1: "14", x2: "14", y1: "15", y2: "9" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-percent.mjs
  var CirclePercent = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m15 9-6 6" }],
    ["path", { d: "M9 9h.01" }],
    ["path", { d: "M15 15h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-pile.mjs
  var CirclePile = [
    ["circle", { cx: "12", cy: "19", r: "2" }],
    ["circle", { cx: "12", cy: "5", r: "2" }],
    ["circle", { cx: "16", cy: "12", r: "2" }],
    ["circle", { cx: "20", cy: "19", r: "2" }],
    ["circle", { cx: "4", cy: "19", r: "2" }],
    ["circle", { cx: "8", cy: "12", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-play.mjs
  var CirclePlay = [
    [
      "path",
      {
        d: "M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-plus.mjs
  var CirclePlus = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M8 12h8" }],
    ["path", { d: "M12 8v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-pound-sterling.mjs
  var CirclePoundSterling = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M10 16V9.5a1 1 0 0 1 5 0" }],
    ["path", { d: "M8 12h4" }],
    ["path", { d: "M8 16h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-power.mjs
  var CirclePower = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 7v4" }],
    ["path", { d: "M7.998 9.003a5 5 0 1 0 8-.005" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-question-mark.mjs
  var CircleQuestionMark = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }],
    ["path", { d: "M12 17h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-slash-2.mjs
  var CircleSlash2 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M22 2 2 22" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-slash.mjs
  var CircleSlash = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "9", x2: "15", y1: "15", y2: "9" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-small.mjs
  var CircleSmall = [["circle", { cx: "12", cy: "12", r: "6" }]];

  // node_modules/lucide/dist/esm/icons/circle-star.mjs
  var CircleStar = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    [
      "path",
      {
        d: "M11.051 7.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.867l-1.156-1.152a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/circle-stop.mjs
  var CircleStop = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["rect", { x: "9", y: "9", width: "6", height: "6", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-user-round.mjs
  var CircleUserRound = [
    ["path", { d: "M17.925 20.056a6 6 0 0 0-11.851.001" }],
    ["circle", { cx: "12", cy: "11", r: "4" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-user.mjs
  var CircleUser = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["circle", { cx: "12", cy: "10", r: "3" }],
    ["path", { d: "M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle-x.mjs
  var CircleX = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m15 9-6 6" }],
    ["path", { d: "m9 9 6 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/circle.mjs
  var Circle = [["circle", { cx: "12", cy: "12", r: "10" }]];

  // node_modules/lucide/dist/esm/icons/circuit-board.mjs
  var CircuitBoard = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M11 9h4a2 2 0 0 0 2-2V3" }],
    ["circle", { cx: "9", cy: "9", r: "2" }],
    ["path", { d: "M7 21v-4a2 2 0 0 1 2-2h4" }],
    ["circle", { cx: "15", cy: "15", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/citrus.mjs
  var Citrus = [
    [
      "path",
      { d: "M21.66 17.67a1.08 1.08 0 0 1-.04 1.6A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04z" }
    ],
    ["path", { d: "M19.65 15.66A8 8 0 0 1 8.35 4.34" }],
    ["path", { d: "m14 10-5.5 5.5" }],
    ["path", { d: "M14 17.85V10H6.15" }]
  ];

  // node_modules/lucide/dist/esm/icons/clapperboard.mjs
  var Clapperboard = [
    ["path", { d: "m12.296 3.464 3.02 3.956" }],
    ["path", { d: "M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z" }],
    ["path", { d: "M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }],
    ["path", { d: "m6.18 5.276 3.1 3.899" }]
  ];

  // node_modules/lucide/dist/esm/icons/clef-alto.mjs
  var ClefAlto = [
    ["path", { d: "M10 4v16" }],
    [
      "path",
      {
        d: "M14 4.764a3 3 0 1 1-.152 4.327A4 4 0 0 1 10 12a4 4 0 0 1 3.848 2.909A3 3 0 1 1 14 19.236"
      }
    ],
    ["path", { d: "M6 4v16" }]
  ];

  // node_modules/lucide/dist/esm/icons/clef-bass.mjs
  var ClefBass = [
    ["path", { d: "M19 11h.01" }],
    ["path", { d: "M19 6h.01" }],
    ["path", { d: "M5 8c0-4 4-4 4-4 6 0 6 6 6 6 0 7-10 11-10 11" }],
    ["circle", { cx: "7", cy: "8", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/clef-treble.mjs
  var ClefTreble = [
    [
      "path",
      {
        d: "M10.586 21.414a2 2 0 0 0 3.378-1.791L11.036 4.377a2 2 0 1 1 3.378 1.037C12.414 7.414 7 8 7 13a5 5 0 0 0 5 5 5 4 0 0 0 5-4 3 3 0 0 0-3-3 3 2 0 0 0-3 2"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard-check.mjs
  var ClipboardCheck = [
    ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
    ["path", { d: "m9 14 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard-clock.mjs
  var ClipboardClock = [
    ["path", { d: "M16 14v2.2l1.6 1" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v.832" }],
    ["path", { d: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" }],
    ["circle", { cx: "16", cy: "16", r: "6" }],
    ["rect", { x: "8", y: "2", width: "8", height: "4", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard-copy.mjs
  var ClipboardCopy = [
    ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
    ["path", { d: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v4" }],
    ["path", { d: "M21 14H11" }],
    ["path", { d: "m15 10-4 4 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard-list.mjs
  var ClipboardList = [
    ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M12 11h4" }],
    ["path", { d: "M12 16h4" }],
    ["path", { d: "M8 11h.01" }],
    ["path", { d: "M8 16h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard-minus.mjs
  var ClipboardMinus = [
    ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M9 14h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard-paste.mjs
  var ClipboardPaste = [
    ["path", { d: "M11 14h10" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v1.344" }],
    ["path", { d: "m17 18 4-4-4-4" }],
    ["path", { d: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113" }],
    ["rect", { x: "8", y: "2", width: "8", height: "4", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard-pen-line.mjs
  var ClipboardPenLine = [
    ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1" }],
    ["path", { d: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.5" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 1.73 1" }],
    ["path", { d: "M8 18h1" }],
    [
      "path",
      {
        d: "M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard-pen.mjs
  var ClipboardPen = [
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v2" }],
    [
      "path",
      {
        d: "M21.34 15.664a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
      }
    ],
    ["path", { d: "M8 22H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
    ["rect", { x: "8", y: "2", width: "8", height: "4", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard-plus.mjs
  var ClipboardPlus = [
    ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M9 14h6" }],
    ["path", { d: "M12 17v-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard-type.mjs
  var ClipboardType = [
    ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M9 12v-1h6v1" }],
    ["path", { d: "M11 17h2" }],
    ["path", { d: "M12 11v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard-x.mjs
  var ClipboardX = [
    ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
    ["path", { d: "m14.5 11.5-5 5" }],
    ["path", { d: "m9.5 11.5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/clipboard.mjs
  var Clipboard = [
    ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-1.mjs
  var Clock1 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6l2-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-10.mjs
  var Clock10 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6l-4-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-11.mjs
  var Clock11 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6l-2-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-2.mjs
  var Clock2 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6l4-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-12.mjs
  var Clock12 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-3.mjs
  var Clock3 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-4.mjs
  var Clock4 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6l4 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-5.mjs
  var Clock5 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6l2 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-6.mjs
  var Clock6 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v10" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-7.mjs
  var Clock7 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6l-2 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-8.mjs
  var Clock8 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6l-4 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-9.mjs
  var Clock9 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6H8" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-arrow-down.mjs
  var ClockArrowDown = [
    ["path", { d: "M12 6v6l2 1" }],
    ["path", { d: "M12.337 21.994a10 10 0 1 1 9.588-8.767" }],
    ["path", { d: "m14 18 4 4 4-4" }],
    ["path", { d: "M18 14v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-arrow-left.mjs
  var ClockArrowLeft = [
    ["path", { d: "M12 6v6l1.5.8" }],
    ["path", { d: "M12.338 21.994a10 10 0 1 1 9.587-8.767" }],
    ["path", { d: "M14 18h8" }],
    ["path", { d: "m18 22-4-4 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-arrow-right.mjs
  var ClockArrowRight = [
    ["path", { d: "M12 6v6l2 1" }],
    ["path", { d: "M13.5 21.885A10 10 0 1 1 22 12" }],
    ["path", { d: "M14 18h8" }],
    ["path", { d: "m18 22 4-4-4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-arrow-up.mjs
  var ClockArrowUp = [
    ["path", { d: "M12 6v6l1.56.78" }],
    ["path", { d: "M13.227 21.925a10 10 0 1 1 8.767-9.588" }],
    ["path", { d: "m14 18 4-4 4 4" }],
    ["path", { d: "M18 22v-8" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-check.mjs
  var ClockCheck = [
    ["path", { d: "M21.95 13a10 10 0 1 0-8.685 8.92" }],
    ["path", { d: "M12 6v6l4 2" }],
    ["path", { d: "m16 19 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-exclamation-point.mjs
  var ClockExclamationPoint = [
    ["path", { d: "M12 6v6l4 2" }],
    ["path", { d: "M20 12v5" }],
    ["path", { d: "M20 21h.01" }],
    ["path", { d: "M21.25 8.2A10 10 0 1 0 16 21.16" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-fading.mjs
  var ClockFading = [
    ["path", { d: "M12 2a10 10 0 0 1 7.38 16.75" }],
    ["path", { d: "M12 6v6l4 2" }],
    ["path", { d: "M2.5 8.875a10 10 0 0 0-.5 3" }],
    ["path", { d: "M2.83 16a10 10 0 0 0 2.43 3.4" }],
    ["path", { d: "M4.636 5.235a10 10 0 0 1 .891-.857" }],
    ["path", { d: "M8.644 21.42a10 10 0 0 0 7.631-.38" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock-plus.mjs
  var ClockPlus = [
    ["path", { d: "M12 6v6l3.644 1.822" }],
    ["path", { d: "M16 19h6" }],
    ["path", { d: "M19 16v6" }],
    ["path", { d: "M21.92 13.267a10 10 0 1 0-8.653 8.653" }]
  ];

  // node_modules/lucide/dist/esm/icons/clock.mjs
  var Clock = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6l4 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/closed-caption.mjs
  var ClosedCaption = [
    ["path", { d: "M10 9.17a3 3 0 1 0 0 5.66" }],
    ["path", { d: "M17 9.17a3 3 0 1 0 0 5.66" }],
    ["rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-backup.mjs
  var CloudBackup = [
    ["path", { d: "M21 15.251A4.5 4.5 0 0 0 17.5 8h-1.79A7 7 0 1 0 3 13.607" }],
    ["path", { d: "M7 11v4h4" }],
    ["path", { d: "M8 19a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5 4.82 4.82 0 0 0-3.41 1.41L7 15" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-check.mjs
  var CloudCheck = [
    ["path", { d: "m17 15-5.5 5.5L9 18" }],
    ["path", { d: "M5.516 16.07A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 3.501 7.327" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-cog.mjs
  var CloudCog = [
    ["path", { d: "m10.852 19.772-.383.924" }],
    ["path", { d: "m13.148 14.228.383-.923" }],
    ["path", { d: "M13.148 19.772a3 3 0 1 0-2.296-5.544l-.383-.923" }],
    ["path", { d: "m13.53 20.696-.382-.924a3 3 0 1 1-2.296-5.544" }],
    ["path", { d: "m14.772 15.852.923-.383" }],
    ["path", { d: "m14.772 18.148.923.383" }],
    ["path", { d: "M4.2 15.1a7 7 0 1 1 9.93-9.858A7 7 0 0 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.2" }],
    ["path", { d: "m9.228 15.852-.923-.383" }],
    ["path", { d: "m9.228 18.148-.923.383" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-download.mjs
  var CloudDownload = [
    ["path", { d: "M12 13v8l-4-4" }],
    ["path", { d: "m12 21 4-4" }],
    ["path", { d: "M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-drizzle.mjs
  var CloudDrizzle = [
    ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
    ["path", { d: "M8 19v1" }],
    ["path", { d: "M8 14v1" }],
    ["path", { d: "M16 19v1" }],
    ["path", { d: "M16 14v1" }],
    ["path", { d: "M12 21v1" }],
    ["path", { d: "M12 16v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-exclamation-point.mjs
  var CloudExclamationPoint = [
    ["path", { d: "M12 12v4" }],
    ["path", { d: "M12 20h.01" }],
    ["path", { d: "M8.128 16.949A7 7 0 1 1 15.71 8h1.79a1 1 0 0 1 0 9h-1.642" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-fog.mjs
  var CloudFog = [
    ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
    ["path", { d: "M16 17H7" }],
    ["path", { d: "M17 21H9" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-lightning.mjs
  var CloudLightning = [
    ["path", { d: "M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" }],
    ["path", { d: "m13 12-3 5h4l-3 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-moon-rain.mjs
  var CloudMoonRain = [
    ["path", { d: "M11 20v2" }],
    [
      "path",
      {
        d: "M18.376 14.512a6 6 0 0 0 3.461-4.127c.148-.625-.659-.97-1.248-.714a4 4 0 0 1-5.259-5.26c.255-.589-.09-1.395-.716-1.248a6 6 0 0 0-4.594 5.36"
      }
    ],
    ["path", { d: "M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" }],
    ["path", { d: "M7 19v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-hail.mjs
  var CloudHail = [
    ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
    ["path", { d: "M16 14v2" }],
    ["path", { d: "M8 14v2" }],
    ["path", { d: "M16 20h.01" }],
    ["path", { d: "M8 20h.01" }],
    ["path", { d: "M12 16v2" }],
    ["path", { d: "M12 22h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-moon.mjs
  var CloudMoon = [
    ["path", { d: "M13 16a3 3 0 0 1 0 6H7a5 5 0 1 1 4.9-6z" }],
    [
      "path",
      {
        d: "M18.376 14.512a6 6 0 0 0 3.461-4.127c.148-.625-.659-.97-1.248-.714a4 4 0 0 1-5.259-5.26c.255-.589-.09-1.395-.716-1.248a6 6 0 0 0-4.594 5.36"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-off.mjs
  var CloudOff = [
    ["path", { d: "M10.94 5.274A7 7 0 0 1 15.71 10h1.79a4.5 4.5 0 0 1 4.222 6.057" }],
    ["path", { d: "M18.796 18.81A4.5 4.5 0 0 1 17.5 19H9A7 7 0 0 1 5.79 5.78" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-rain-wind.mjs
  var CloudRainWind = [
    ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
    ["path", { d: "m9.2 22 3-7" }],
    ["path", { d: "m9 13-3 7" }],
    ["path", { d: "m17 13-3 7" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-rain.mjs
  var CloudRain = [
    ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
    ["path", { d: "M16 14v6" }],
    ["path", { d: "M8 14v6" }],
    ["path", { d: "M12 16v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-snow.mjs
  var CloudSnow = [
    ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
    ["path", { d: "M8 15h.01" }],
    ["path", { d: "M8 19h.01" }],
    ["path", { d: "M12 17h.01" }],
    ["path", { d: "M12 21h.01" }],
    ["path", { d: "M16 15h.01" }],
    ["path", { d: "M16 19h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-sun-rain.mjs
  var CloudSunRain = [
    ["path", { d: "M12 2v2" }],
    ["path", { d: "m4.93 4.93 1.41 1.41" }],
    ["path", { d: "M20 12h2" }],
    ["path", { d: "m19.07 4.93-1.41 1.41" }],
    ["path", { d: "M15.947 12.65a4 4 0 0 0-5.925-4.128" }],
    ["path", { d: "M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" }],
    ["path", { d: "M11 20v2" }],
    ["path", { d: "M7 19v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-sun.mjs
  var CloudSun = [
    ["path", { d: "M12 2v2" }],
    ["path", { d: "m4.93 4.93 1.41 1.41" }],
    ["path", { d: "M20 12h2" }],
    ["path", { d: "m19.07 4.93-1.41 1.41" }],
    ["path", { d: "M15.947 12.65a4 4 0 0 0-5.925-4.128" }],
    ["path", { d: "M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-sync.mjs
  var CloudSync = [
    ["path", { d: "m17 18-1.535 1.605a5 5 0 0 1-8-1.5" }],
    ["path", { d: "M17 22v-4h-4" }],
    ["path", { d: "M20.996 15.251A4.5 4.5 0 0 0 17.495 8h-1.79a7 7 0 1 0-12.709 5.607" }],
    ["path", { d: "M7 10v4h4" }],
    ["path", { d: "m7 14 1.535-1.605a5 5 0 0 1 8 1.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud-upload.mjs
  var CloudUpload = [
    ["path", { d: "M12 13v8" }],
    ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
    ["path", { d: "m8 17 4-4 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/cloud.mjs
  var Cloud = [["path", { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" }]];

  // node_modules/lucide/dist/esm/icons/cloudy.mjs
  var Cloudy = [
    ["path", { d: "M17.5 12a1 1 0 1 1 0 9H9.006a7 7 0 1 1 6.702-9z" }],
    ["path", { d: "M21.832 9A3 3 0 0 0 19 7h-2.207a5.5 5.5 0 0 0-10.72.61" }]
  ];

  // node_modules/lucide/dist/esm/icons/clover.mjs
  var Clover = [
    ["path", { d: "M16.17 7.83 2 22" }],
    [
      "path",
      {
        d: "M4.02 12a2.827 2.827 0 1 1 3.81-4.17A2.827 2.827 0 1 1 12 4.02a2.827 2.827 0 1 1 4.17 3.81A2.827 2.827 0 1 1 19.98 12a2.827 2.827 0 1 1-3.81 4.17A2.827 2.827 0 1 1 12 19.98a2.827 2.827 0 1 1-4.17-3.81A1 1 0 1 1 4 12"
      }
    ],
    ["path", { d: "m7.83 7.83 8.34 8.34" }]
  ];

  // node_modules/lucide/dist/esm/icons/club.mjs
  var Club = [
    [
      "path",
      { d: "M17.28 9.05a5.5 5.5 0 1 0-10.56 0A5.5 5.5 0 1 0 12 17.66a5.5 5.5 0 1 0 5.28-8.6Z" }
    ],
    ["path", { d: "M12 17.66L12 22" }]
  ];

  // node_modules/lucide/dist/esm/icons/code-xml.mjs
  var CodeXml = [
    ["path", { d: "m18 16 4-4-4-4" }],
    ["path", { d: "m6 8-4 4 4 4" }],
    ["path", { d: "m14.5 4-5 16" }]
  ];

  // node_modules/lucide/dist/esm/icons/code.mjs
  var Code = [
    ["path", { d: "m16 18 6-6-6-6" }],
    ["path", { d: "m8 6-6 6 6 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/coffee.mjs
  var Coffee = [
    ["path", { d: "M10 2v2" }],
    ["path", { d: "M14 2v2" }],
    [
      "path",
      {
        d: "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"
      }
    ],
    ["path", { d: "M6 2v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/coins.mjs
  var Coins = [
    ["path", { d: "M13.744 17.736a6 6 0 1 1-7.48-7.48" }],
    ["path", { d: "M15 6h1v4" }],
    ["path", { d: "m6.134 14.768.866-.5 2 3.464" }],
    ["circle", { cx: "16", cy: "8", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/cog.mjs
  var Cog = [
    ["path", { d: "M11 10.27 7 3.34" }],
    ["path", { d: "m11 13.73-4 6.93" }],
    ["path", { d: "M12 22v-2" }],
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M14 12h8" }],
    ["path", { d: "m17 20.66-1-1.73" }],
    ["path", { d: "m17 3.34-1 1.73" }],
    ["path", { d: "M2 12h2" }],
    ["path", { d: "m20.66 17-1.73-1" }],
    ["path", { d: "m20.66 7-1.73 1" }],
    ["path", { d: "m3.34 17 1.73-1" }],
    ["path", { d: "m3.34 7 1.73 1" }],
    ["circle", { cx: "12", cy: "12", r: "2" }],
    ["circle", { cx: "12", cy: "12", r: "8" }]
  ];

  // node_modules/lucide/dist/esm/icons/columns-2.mjs
  var Columns2 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M12 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/columns-3-cog.mjs
  var Columns3Cog = [
    ["path", { d: "M10.6 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5.6" }],
    ["path", { d: "m14.305 19.53.923-.382" }],
    ["path", { d: "M15 3v7.6" }],
    ["path", { d: "m15.229 16.852-.924-.383" }],
    ["path", { d: "m16.852 15.228-.383-.923" }],
    ["path", { d: "m16.852 20.772-.383.924" }],
    ["path", { d: "m19.148 15.228.383-.923" }],
    ["path", { d: "m19.53 21.696-.382-.924" }],
    ["path", { d: "m20.773 16.852.922-.383" }],
    ["path", { d: "m20.773 19.148.922.383" }],
    ["path", { d: "M9 3v18" }],
    ["circle", { cx: "18", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/columns-3.mjs
  var Columns3 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M9 3v18" }],
    ["path", { d: "M15 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/columns-4.mjs
  var Columns4 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M7.5 3v18" }],
    ["path", { d: "M12 3v18" }],
    ["path", { d: "M16.5 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/combine.mjs
  var Combine = [
    ["path", { d: "M14 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" }],
    ["path", { d: "M19 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" }],
    ["path", { d: "m7 15 3 3" }],
    ["path", { d: "m7 21 3-3H5a2 2 0 0 1-2-2v-2" }],
    ["rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" }],
    ["rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/command.mjs
  var Command = [
    ["path", { d: "M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/compass.mjs
  var Compass = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    [
      "path",
      {
        d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/component.mjs
  var Component = [
    [
      "path",
      {
        d: "M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"
      }
    ],
    [
      "path",
      {
        d: "M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"
      }
    ],
    [
      "path",
      {
        d: "M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"
      }
    ],
    [
      "path",
      {
        d: "M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/computer.mjs
  var Computer = [
    ["path", { d: "M12 18h6" }],
    ["path", { d: "M6 18h.01" }],
    ["path", { d: "M8 6h1" }],
    ["rect", { x: "2", y: "14", width: "20", height: "8", rx: "2" }],
    ["rect", { x: "4", y: "2", width: "16", height: "12", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/concierge-bell.mjs
  var ConciergeBell = [
    ["path", { d: "M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z" }],
    ["path", { d: "M20 16a8 8 0 1 0-16 0" }],
    ["path", { d: "M12 4v4" }],
    ["path", { d: "M10 4h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/cone.mjs
  var Cone = [
    ["path", { d: "m20.9 18.55-8-15.98a1 1 0 0 0-1.8 0l-8 15.98" }],
    ["ellipse", { cx: "12", cy: "19", rx: "9", ry: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/construction.mjs
  var Construction = [
    ["rect", { x: "2", y: "6", width: "20", height: "8", rx: "1" }],
    ["path", { d: "M17 14v7" }],
    ["path", { d: "M7 14v7" }],
    ["path", { d: "M17 3v3" }],
    ["path", { d: "M7 3v3" }],
    ["path", { d: "M10 14 2.3 6.3" }],
    ["path", { d: "m14 6 7.7 7.7" }],
    ["path", { d: "m8 6 8 8" }]
  ];

  // node_modules/lucide/dist/esm/icons/contact-round.mjs
  var ContactRound = [
    ["path", { d: "M16 2v2" }],
    ["path", { d: "M17.915 21a6 6 0 10-12 0" }],
    ["path", { d: "M8 2v2" }],
    ["circle", { cx: "12", cy: "11", r: "4" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/contact.mjs
  var Contact = [
    ["path", { d: "M16 2v2" }],
    ["path", { d: "M7 21v-2a2 2 0 012-2h6a2 2 0 012 2v2" }],
    ["path", { d: "M8 2v2" }],
    ["circle", { cx: "12", cy: "10", r: "3" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/container.mjs
  var Container = [
    [
      "path",
      {
        d: "M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z"
      }
    ],
    ["path", { d: "M10 21.9V14L2.1 9.1" }],
    ["path", { d: "m10 14 11.9-6.9" }],
    ["path", { d: "M14 19.8v-8.1" }],
    ["path", { d: "M18 17.5V9.4" }]
  ];

  // node_modules/lucide/dist/esm/icons/cookie.mjs
  var Cookie = [
    ["path", { d: "M11 17h.01" }],
    [
      "path",
      {
        d: "M11.496 2c.324-.016.558.292.529.615a4 4 0 004.235 4.368.713.713 0 01.758.757 4 4 0 004.366 4.237c.323-.03.63.204.614.527a10 10 0 01-2.915 6.566A1 1 0 114.93 4.918 10 10 0 0111.496 2"
      }
    ],
    ["path", { d: "M12 12h.01" }],
    ["path", { d: "M16 16h.01" }],
    ["path", { d: "M16 3h.01" }],
    ["path", { d: "M21 4h.01" }],
    ["path", { d: "M21 8h.01" }],
    ["path", { d: "M7 14h.01" }],
    ["path", { d: "M9 8h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/contrast.mjs
  var Contrast = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 18a6 6 0 0 0 0-12v12z" }]
  ];

  // node_modules/lucide/dist/esm/icons/cooking-pot.mjs
  var CookingPot = [
    ["path", { d: "M2 12h20" }],
    ["path", { d: "M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" }],
    ["path", { d: "m4 8 16-4" }],
    ["path", { d: "m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8" }]
  ];

  // node_modules/lucide/dist/esm/icons/copy-check.mjs
  var CopyCheck = [
    ["path", { d: "m12 15 2 2 4-4" }],
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/copy-minus.mjs
  var CopyMinus = [
    ["line", { x1: "12", x2: "18", y1: "15", y2: "15" }],
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/copy-plus.mjs
  var CopyPlus = [
    ["line", { x1: "15", x2: "15", y1: "12", y2: "18" }],
    ["line", { x1: "12", x2: "18", y1: "15", y2: "15" }],
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/copy-slash.mjs
  var CopySlash = [
    ["line", { x1: "12", x2: "18", y1: "18", y2: "12" }],
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/copy-x.mjs
  var CopyX = [
    ["path", { d: "M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" }],
    ["rect", { x: "8", y: "8", width: "14", height: "14", rx: "2" }],
    ["path", { d: "m12.5 12.5 5 5" }],
    ["path", { d: "m12.5 17.5 5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/copy.mjs
  var Copy = [
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/copyleft.mjs
  var Copyleft = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M9.17 14.83a4 4 0 1 0 0-5.66" }]
  ];

  // node_modules/lucide/dist/esm/icons/corner-down-left.mjs
  var CornerDownLeft = [
    ["path", { d: "M20 4v7a4 4 0 0 1-4 4H4" }],
    ["path", { d: "m9 10-5 5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/corner-down-right.mjs
  var CornerDownRight = [
    ["path", { d: "m15 10 5 5-5 5" }],
    ["path", { d: "M4 4v7a4 4 0 0 0 4 4h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/corner-left-down.mjs
  var CornerLeftDown = [
    ["path", { d: "m14 15-5 5-5-5" }],
    ["path", { d: "M20 4h-7a4 4 0 0 0-4 4v12" }]
  ];

  // node_modules/lucide/dist/esm/icons/corner-left-up.mjs
  var CornerLeftUp = [
    ["path", { d: "M14 9 9 4 4 9" }],
    ["path", { d: "M20 20h-7a4 4 0 0 1-4-4V4" }]
  ];

  // node_modules/lucide/dist/esm/icons/corner-right-down.mjs
  var CornerRightDown = [
    ["path", { d: "m10 15 5 5 5-5" }],
    ["path", { d: "M4 4h7a4 4 0 0 1 4 4v12" }]
  ];

  // node_modules/lucide/dist/esm/icons/corner-right-up.mjs
  var CornerRightUp = [
    ["path", { d: "m10 9 5-5 5 5" }],
    ["path", { d: "M4 20h7a4 4 0 0 0 4-4V4" }]
  ];

  // node_modules/lucide/dist/esm/icons/corner-up-left.mjs
  var CornerUpLeft = [
    ["path", { d: "M20 20v-7a4 4 0 0 0-4-4H4" }],
    ["path", { d: "M9 14 4 9l5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/corner-up-right.mjs
  var CornerUpRight = [
    ["path", { d: "m15 14 5-5-5-5" }],
    ["path", { d: "M4 20v-7a4 4 0 0 1 4-4h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/cpu-ai.mjs
  var CpuAi = [
    ["path", { d: "M12 20v2" }],
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M16 9v6" }],
    ["path", { d: "M17 20v2" }],
    ["path", { d: "M17 2v2" }],
    ["path", { d: "M2 12h2" }],
    ["path", { d: "M2 17h2" }],
    ["path", { d: "M2 7h2" }],
    ["path", { d: "M20 12h2" }],
    ["path", { d: "M20 17h2" }],
    ["path", { d: "M20 7h2" }],
    ["path", { d: "M7 20v2" }],
    ["path", { d: "M7 2v2" }],
    ["path", { d: "M8 13h4" }],
    ["path", { d: "M8 15v-4a2 2 0 014 0v4" }],
    ["rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/cpu.mjs
  var Cpu = [
    ["path", { d: "M12 20v2" }],
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M17 20v2" }],
    ["path", { d: "M17 2v2" }],
    ["path", { d: "M2 12h2" }],
    ["path", { d: "M2 17h2" }],
    ["path", { d: "M2 7h2" }],
    ["path", { d: "M20 12h2" }],
    ["path", { d: "M20 17h2" }],
    ["path", { d: "M20 7h2" }],
    ["path", { d: "M7 20v2" }],
    ["path", { d: "M7 2v2" }],
    ["rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }],
    ["rect", { x: "8", y: "8", width: "8", height: "8", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/creative-commons.mjs
  var CreativeCommons = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M10 9.3a2.8 2.8 0 0 0-3.5 1 3.1 3.1 0 0 0 0 3.4 2.7 2.7 0 0 0 3.5 1" }],
    ["path", { d: "M17 9.3a2.8 2.8 0 0 0-3.5 1 3.1 3.1 0 0 0 0 3.4 2.7 2.7 0 0 0 3.5 1" }]
  ];

  // node_modules/lucide/dist/esm/icons/credit-card-check.mjs
  var CreditCardCheck = [
    ["path", { d: "M12.5 19H4a2 2 0 01-2-2V7a2 2 0 012-2h16a2 2 0 012 2v4" }],
    ["path", { d: "M2 10h20" }],
    ["path", { d: "M6 14h2" }],
    ["path", { d: "m16 17 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/credit-card-minus.mjs
  var CreditCardMinus = [
    ["path", { d: "M22 13V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h8.536" }],
    ["path", { d: "M22 10H2" }],
    ["path", { d: "M6 14h2" }],
    ["path", { d: "M16 17h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/credit-card-plus.mjs
  var CreditCardPlus = [
    ["path", { d: "M22 11.354V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h8.536" }],
    ["path", { d: "M22 10H2" }],
    ["path", { d: "M6 14h2" }],
    ["path", { d: "M16 17h6" }],
    ["path", { d: "M19 14v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/credit-card-reader.mjs
  var CreditCardReader = [
    ["path", { d: "M15 16v1" }],
    [
      "path",
      {
        d: "M16.963 7.734A1 1 0 0015.999 7H8.003a1 1 0 00-.964.734L4.073 18.467A2 2 0 006 21h12a2 2 0 001.927-2.532z"
      }
    ],
    ["path", { d: "M2.678 8.5A2 2 0 012 7V5a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 01-.676 1.499" }],
    ["path", { d: "m9 21 2-14" }]
  ];

  // node_modules/lucide/dist/esm/icons/credit-card-x.mjs
  var CreditCardX = [
    ["path", { d: "M12.5 19H4a2 2 0 01-2-2V7a2 2 0 012-2h16a2 2 0 012 2v3.5" }],
    ["path", { d: "M2 10h20" }],
    ["path", { d: "M6 14h2" }],
    ["path", { d: "m16.5 14.5 5 5" }],
    ["path", { d: "m21.5 14.5-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/credit-card.mjs
  var CreditCard = [
    ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "2" }],
    ["line", { x1: "2", x2: "22", y1: "10", y2: "10" }],
    ["path", { d: "M6 14h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/croissant.mjs
  var Croissant = [
    ["path", { d: "M10.2 18H4.774a1.5 1.5 0 0 1-1.352-.97 11 11 0 0 1 .132-6.487" }],
    ["path", { d: "M18 10.2V4.774a1.5 1.5 0 0 0-.97-1.352 11 11 0 0 0-6.486.132" }],
    ["path", { d: "M18 5a4 3 0 0 1 4 3 2 2 0 0 1-2 2 10 10 0 0 0-5.139 1.42" }],
    ["path", { d: "M5 18a3 4 0 0 0 3 4 2 2 0 0 0 2-2 10 10 0 0 1 1.42-5.14" }],
    [
      "path",
      {
        d: "M8.709 2.554a10 10 0 0 0-6.155 6.155 1.5 1.5 0 0 0 .676 1.626l9.807 5.42a2 2 0 0 0 2.718-2.718l-5.42-9.807a1.5 1.5 0 0 0-1.626-.676"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/crop.mjs
  var Crop = [
    ["path", { d: "M6 2v14a2 2 0 0 0 2 2h14" }],
    ["path", { d: "M18 22V8a2 2 0 0 0-2-2H2" }]
  ];

  // node_modules/lucide/dist/esm/icons/cross.mjs
  var Cross = [
    [
      "path",
      {
        d: "M4 9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a1 1 0 0 1 1 1v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a1 1 0 0 1 1-1h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4a1 1 0 0 1-1-1V4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4a1 1 0 0 1-1 1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/crosshair.mjs
  var Crosshair = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "22", x2: "18", y1: "12", y2: "12" }],
    ["line", { x1: "6", x2: "2", y1: "12", y2: "12" }],
    ["line", { x1: "12", x2: "12", y1: "6", y2: "2" }],
    ["line", { x1: "12", x2: "12", y1: "22", y2: "18" }]
  ];

  // node_modules/lucide/dist/esm/icons/crown.mjs
  var Crown = [
    [
      "path",
      {
        d: "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"
      }
    ],
    ["path", { d: "M5 21h14" }]
  ];

  // node_modules/lucide/dist/esm/icons/cuboid.mjs
  var Cuboid = [
    ["path", { d: "M10 22v-8" }],
    ["path", { d: "M2.336 8.89 10 14l11.715-7.029" }],
    [
      "path",
      {
        d: "M22 14a2 2 0 0 1-.971 1.715l-10 6a2 2 0 0 1-2.138-.05l-6-4A2 2 0 0 1 2 16v-6a2 2 0 0 1 .971-1.715l10-6a2 2 0 0 1 2.138.05l6 4A2 2 0 0 1 22 8z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/cup-soda.mjs
  var CupSoda = [
    ["path", { d: "m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8" }],
    ["path", { d: "M5 8h14" }],
    ["path", { d: "M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" }],
    ["path", { d: "m12 8 1-6h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/cupcake.mjs
  var Cupcake = [
    ["path", { d: "M12 22v-9" }],
    ["path", { d: "M14 4h1a3 3 0 013 3l-.004.125A4 4 0 0121 11v2" }],
    ["path", { d: "m15.5 22 1.5-9" }],
    [
      "path",
      {
        d: "M21 13a1 1 0 01.919 1.394l-2.74 6.394A2 2 0 0117.34 22H6.659a2 2 0 01-1.838-1.212l-2.74-6.394A1 1 0 013 13z"
      }
    ],
    ["path", { d: "M3 13v-2a4 4 0 013.003-3.875L6 7a3 3 0 013-3h1" }],
    ["path", { d: "M8.5 22 7 13" }],
    ["circle", { cx: "12", cy: "4", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/currency.mjs
  var Currency = [
    ["circle", { cx: "12", cy: "12", r: "8" }],
    ["line", { x1: "3", x2: "6", y1: "3", y2: "6" }],
    ["line", { x1: "21", x2: "18", y1: "3", y2: "6" }],
    ["line", { x1: "3", x2: "6", y1: "21", y2: "18" }],
    ["line", { x1: "21", x2: "18", y1: "21", y2: "18" }]
  ];

  // node_modules/lucide/dist/esm/icons/cylinder.mjs
  var Cylinder = [
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
    ["path", { d: "M3 5v14a9 3 0 0 0 18 0V5" }]
  ];

  // node_modules/lucide/dist/esm/icons/dam.mjs
  var Dam = [
    ["path", { d: "M11 11.31c1.17.56 1.54 1.69 3.5 1.69 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" }],
    ["path", { d: "M11.75 18c.35.5 1.45 1 2.75 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" }],
    ["path", { d: "M2 10h4" }],
    ["path", { d: "M2 14h4" }],
    ["path", { d: "M2 18h4" }],
    ["path", { d: "M2 6h4" }],
    ["path", { d: "M7 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1L10 4a1 1 0 0 0-1-1z" }]
  ];

  // node_modules/lucide/dist/esm/icons/database-arrow-down.mjs
  var DatabaseArrowDown = [
    ["path", { d: "m16 19 3 3 3-3" }],
    ["path", { d: "M19 16v6" }],
    ["path", { d: "M21 12.536V5" }],
    ["path", { d: "M3 12A9 3 0 0 0 15.182 14.806" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 13.318 21.968" }],
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/database-arrow-up.mjs
  var DatabaseArrowUp = [
    ["path", { d: "M19 22v-6" }],
    ["path", { d: "M21 12.536V5" }],
    ["path", { d: "m22 19-3-3-3 3" }],
    ["path", { d: "M3 12A9 3 0 0 0 14.457 14.886" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 13.318 21.968" }],
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/database-backup.mjs
  var DatabaseBackup = [
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
    ["path", { d: "M3 12a9 3 0 0 0 5 2.69" }],
    ["path", { d: "M21 9.3V5" }],
    ["path", { d: "M3 5v14a9 3 0 0 0 6.47 2.88" }],
    ["path", { d: "M12 12v4h4" }],
    ["path", { d: "M13 20a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L12 16" }]
  ];

  // node_modules/lucide/dist/esm/icons/database-check.mjs
  var DatabaseCheck = [
    ["path", { d: "m16 19 2 2 4-4" }],
    ["path", { d: "M21 13.127V5" }],
    ["path", { d: "M3 12A9 3 0 0 0 21 12" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 13.318 21.968" }],
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/database-cog.mjs
  var DatabaseCog = [
    ["path", { d: "m14.305 19.53.923-.382" }],
    ["path", { d: "m15.228 16.852-.923-.383" }],
    ["path", { d: "m16.852 15.228-.383-.923" }],
    ["path", { d: "m16.852 20.772-.383.924" }],
    ["path", { d: "m19.148 15.228.383-.923" }],
    ["path", { d: "m19.53 21.696-.382-.924" }],
    ["path", { d: "m20.772 16.852.924-.383" }],
    ["path", { d: "m20.772 19.148.924.383" }],
    ["path", { d: "M21 10.5V5" }],
    ["path", { d: "M3 12a9 3 0 0 0 7.599 2.963" }],
    ["path", { d: "M3 5v14a9 3 0 0 0 8.148 2.987" }],
    ["circle", { cx: "18", cy: "18", r: "3" }],
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/database-minus.mjs
  var DatabaseMinus = [
    ["path", { d: "M21 15V5" }],
    ["path", { d: "M22 19h-6" }],
    ["path", { d: "M3 12A9 3 0 0 0 21 12" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 13.318 21.968" }],
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/database-plus.mjs
  var DatabasePlus = [
    ["path", { d: "M19 16v6" }],
    ["path", { d: "M21 12.536V5" }],
    ["path", { d: "M22 19h-6" }],
    ["path", { d: "M3 12A9 3 0 0 0 15.1824 14.8061" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 13.318 21.968" }],
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/database-search.mjs
  var DatabaseSearch = [
    ["path", { d: "M21 11.693V5" }],
    ["path", { d: "m22 22-1.875-1.875" }],
    ["path", { d: "M3 12a9 3 0 0 0 8.697 2.998" }],
    ["path", { d: "M3 5v14a9 3 0 0 0 9.28 2.999" }],
    ["circle", { cx: "18", cy: "18", r: "3" }],
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/database-x.mjs
  var DatabaseX = [
    ["path", { d: "m17 17 5 5" }],
    ["path", { d: "M19.323 13.744A9 3 0 0 0 21 12" }],
    ["path", { d: "M21 13.127V5" }],
    ["path", { d: "m22 17-5 5" }],
    ["path", { d: "M3 12A9 3 0 0 0 13.563 14.954" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 13 21.981" }],
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/database-zap.mjs
  var DatabaseZap = [
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 15 21.84" }],
    ["path", { d: "M21 5V8" }],
    ["path", { d: "M21 12L18 17H22L19 22" }],
    ["path", { d: "M3 12A9 3 0 0 0 14.59 14.87" }]
  ];

  // node_modules/lucide/dist/esm/icons/database.mjs
  var Database = [
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5" }],
    ["path", { d: "M3 12A9 3 0 0 0 21 12" }]
  ];

  // node_modules/lucide/dist/esm/icons/decimals-arrow-left.mjs
  var DecimalsArrowLeft = [
    ["path", { d: "m13 21-3-3 3-3" }],
    ["path", { d: "M20 18H10" }],
    ["path", { d: "M3 11h.01" }],
    ["rect", { x: "6", y: "3", width: "5", height: "8", rx: "2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/decimals-arrow-right.mjs
  var DecimalsArrowRight = [
    ["path", { d: "M10 18h10" }],
    ["path", { d: "m17 21 3-3-3-3" }],
    ["path", { d: "M3 11h.01" }],
    ["rect", { x: "15", y: "3", width: "5", height: "8", rx: "2.5" }],
    ["rect", { x: "6", y: "3", width: "5", height: "8", rx: "2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/delete.mjs
  var Delete = [
    [
      "path",
      {
        d: "M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"
      }
    ],
    ["path", { d: "m12 9 6 6" }],
    ["path", { d: "m18 9-6 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/dessert.mjs
  var Dessert = [
    [
      "path",
      {
        d: "M10.162 3.167A10 10 0 0 0 2 13a2 2 0 0 0 4 0v-1a2 2 0 0 1 4 0v4a2 2 0 0 0 4 0v-4a2 2 0 0 1 4 0v1a2 2 0 0 0 4-.006 10 10 0 0 0-8.161-9.826"
      }
    ],
    ["path", { d: "M20.804 14.869a9 9 0 0 1-17.608 0" }],
    ["circle", { cx: "12", cy: "4", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/diagram-flow-horizontal.mjs
  var DiagramFlowHorizontal = [
    ["path", { d: "M8 12h.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 003.5 3.5h.5" }],
    ["path", { d: "M8.5 12A3.5 3.5 0 0012 8.5 3.5 3.5 0 0115.5 5h.5" }],
    ["rect", { x: "16", y: "16", width: "6", height: "6", rx: "1" }],
    ["rect", { x: "16", y: "2", width: "6", height: "6", rx: "1" }],
    ["rect", { x: "2", y: "9", width: "6", height: "6", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/diagram-flow-vertical.mjs
  var DiagramFlowVertical = [
    ["path", { d: "M12 8.5a3.5 3.5 0 003.5 3.5 3.5 3.5 0 013.5 3.5v.5" }],
    ["path", { d: "M12 8v.5A3.5 3.5 0 018.5 12 3.5 3.5 0 005 15.5v.5" }],
    ["rect", { x: "16", y: "16", width: "6", height: "6", rx: "1" }],
    ["rect", { x: "2", y: "16", width: "6", height: "6", rx: "1" }],
    ["rect", { x: "9", y: "2", width: "6", height: "6", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/diameter.mjs
  var Diameter = [
    ["circle", { cx: "19", cy: "19", r: "2" }],
    ["circle", { cx: "5", cy: "5", r: "2" }],
    ["path", { d: "M6.48 3.66a10 10 0 0 1 13.86 13.86" }],
    ["path", { d: "m6.41 6.41 11.18 11.18" }],
    ["path", { d: "M3.66 6.48a10 10 0 0 0 13.86 13.86" }]
  ];

  // node_modules/lucide/dist/esm/icons/diamond-minus.mjs
  var DiamondMinus = [
    [
      "path",
      {
        d: "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z"
      }
    ],
    ["path", { d: "M8 12h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/diamond-percent.mjs
  var DiamondPercent = [
    [
      "path",
      {
        d: "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0Z"
      }
    ],
    ["path", { d: "M9.2 9.2h.01" }],
    ["path", { d: "m14.5 9.5-5 5" }],
    ["path", { d: "M14.7 14.8h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/diamond-plus.mjs
  var DiamondPlus = [
    ["path", { d: "M12 8v8" }],
    [
      "path",
      {
        d: "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z"
      }
    ],
    ["path", { d: "M8 12h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/diamond.mjs
  var Diamond = [
    [
      "path",
      {
        d: "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/dice-1.mjs
  var Dice1 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ["path", { d: "M12 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/dice-2.mjs
  var Dice2 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ["path", { d: "M15 9h.01" }],
    ["path", { d: "M9 15h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/dice-3.mjs
  var Dice3 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ["path", { d: "M16 8h.01" }],
    ["path", { d: "M12 12h.01" }],
    ["path", { d: "M8 16h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/dice-4.mjs
  var Dice4 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ["path", { d: "M16 8h.01" }],
    ["path", { d: "M8 8h.01" }],
    ["path", { d: "M8 16h.01" }],
    ["path", { d: "M16 16h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/dice-5.mjs
  var Dice5 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ["path", { d: "M16 8h.01" }],
    ["path", { d: "M8 8h.01" }],
    ["path", { d: "M8 16h.01" }],
    ["path", { d: "M16 16h.01" }],
    ["path", { d: "M12 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/dice-6.mjs
  var Dice6 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ["path", { d: "M16 8h.01" }],
    ["path", { d: "M16 12h.01" }],
    ["path", { d: "M16 16h.01" }],
    ["path", { d: "M8 8h.01" }],
    ["path", { d: "M8 12h.01" }],
    ["path", { d: "M8 16h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/dices.mjs
  var Dices = [
    ["rect", { width: "12", height: "12", x: "2", y: "10", rx: "2", ry: "2" }],
    ["path", { d: "m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" }],
    ["path", { d: "M6 18h.01" }],
    ["path", { d: "M10 14h.01" }],
    ["path", { d: "M15 6h.01" }],
    ["path", { d: "M18 9h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/diff.mjs
  var Diff = [
    ["path", { d: "M12 3v14" }],
    ["path", { d: "M5 10h14" }],
    ["path", { d: "M5 21h14" }]
  ];

  // node_modules/lucide/dist/esm/icons/disc-3.mjs
  var Disc3 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M6 12c0-1.7.7-3.2 1.8-4.2" }],
    ["circle", { cx: "12", cy: "12", r: "2" }],
    ["path", { d: "M18 12c0 1.7-.7 3.2-1.8 4.2" }]
  ];

  // node_modules/lucide/dist/esm/icons/disc-album.mjs
  var DiscAlbum = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["circle", { cx: "12", cy: "12", r: "5" }],
    ["path", { d: "M12 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/disc-2.mjs
  var Disc2 = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["path", { d: "M12 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/disc.mjs
  var Disc = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["circle", { cx: "12", cy: "12", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/divide.mjs
  var Divide = [
    ["circle", { cx: "12", cy: "6", r: "1" }],
    ["line", { x1: "5", x2: "19", y1: "12", y2: "12" }],
    ["circle", { cx: "12", cy: "18", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/dna-off.mjs
  var DnaOff = [
    ["path", { d: "M15 2c-1.35 1.5-2.092 3-2.5 4.5L14 8" }],
    ["path", { d: "m17 6-2.891-2.891" }],
    ["path", { d: "M2 15c3.333-3 6.667-3 10-3" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "m20 9 .891.891" }],
    ["path", { d: "M22 9c-1.5 1.35-3 2.092-4.5 2.5l-1-1" }],
    ["path", { d: "M3.109 14.109 4 15" }],
    ["path", { d: "m6.5 12.5 1 1" }],
    ["path", { d: "m7 18 2.891 2.891" }],
    ["path", { d: "M9 22c1.35-1.5 2.092-3 2.5-4.5L10 16" }]
  ];

  // node_modules/lucide/dist/esm/icons/dna.mjs
  var Dna = [
    ["path", { d: "m10 16 1.5 1.5" }],
    ["path", { d: "m14 8-1.5-1.5" }],
    ["path", { d: "M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" }],
    ["path", { d: "m16.5 10.5 1 1" }],
    ["path", { d: "m17 6-2.891-2.891" }],
    ["path", { d: "M2 15c6.667-6 13.333 0 20-6" }],
    ["path", { d: "m20 9 .891.891" }],
    ["path", { d: "M3.109 14.109 4 15" }],
    ["path", { d: "m6.5 12.5 1 1" }],
    ["path", { d: "m7 18 2.891 2.891" }],
    ["path", { d: "M9 22c1.798-1.998 2.518-3.995 2.807-5.993" }]
  ];

  // node_modules/lucide/dist/esm/icons/dock.mjs
  var Dock = [
    ["path", { d: "M2 8h20" }],
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
    ["path", { d: "M6 16h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/dog.mjs
  var Dog = [
    ["path", { d: "M11.25 16.25h1.5L12 17z" }],
    ["path", { d: "M16 14v.5" }],
    [
      "path",
      {
        d: "M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"
      }
    ],
    ["path", { d: "M8 14v.5" }],
    [
      "path",
      {
        d: "M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/dollar-sign.mjs
  var DollarSign = [
    ["path", { d: "M12 3v18" }],
    ["path", { d: "M17 5H9.5a1 1 0 000 7h5a1 1 0 010 7H6" }]
  ];

  // node_modules/lucide/dist/esm/icons/dome.mjs
  var Dome = [
    ["path", { d: "M10 21v-3a2 2 0 014 0v3" }],
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M18 12v9" }],
    ["path", { d: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 011-1h18a1 1 0 011 1z" }],
    ["path", { d: "M4 12a8 8 0 0116 0" }],
    ["path", { d: "M6 12v9" }]
  ];

  // node_modules/lucide/dist/esm/icons/donut.mjs
  var Donut = [
    [
      "path",
      {
        d: "M20.5 10a2.5 2.5 0 0 1-2.4-3H18a2.95 2.95 0 0 1-2.6-4.4 10 10 0 1 0 6.3 7.1c-.3.2-.8.3-1.2.3"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/door-closed-cog.mjs
  var DoorClosedCog = [
    ["path", { d: "m14.305 19.53.923-.382" }],
    ["path", { d: "m15.229 16.852-.924-.383" }],
    ["path", { d: "m16.852 15.228-.383-.923" }],
    ["path", { d: "m16.852 20.773-.383.924" }],
    ["path", { d: "M19 10.35V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" }],
    ["path", { d: "m19.148 15.228.383-.923" }],
    ["path", { d: "m19.53 21.697-.382-.924" }],
    ["path", { d: "M2 21h8.58" }],
    ["path", { d: "m20.773 16.852.922-.383" }],
    ["path", { d: "m20.773 19.148.922.383" }],
    ["path", { d: "M9 12h.01" }],
    ["circle", { cx: "18", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/door-closed-locked.mjs
  var DoorClosedLocked = [
    ["path", { d: "M19 8V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" }],
    ["path", { d: "M2 21h8" }],
    ["path", { d: "M20 16v-2a2 2 0 00-4 0v2" }],
    ["path", { d: "M9 12h.01" }],
    ["rect", { x: "14", y: "16", width: "8", height: "5", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/door-closed-package.mjs
  var DoorClosedPackage = [
    ["path", { d: "M18 13v3" }],
    ["path", { d: "M19 9V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" }],
    ["path", { d: "M2 21h8" }],
    ["path", { d: "M9 12h.01" }],
    ["rect", { x: "14", y: "13", width: "8", height: "8", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/door-closed.mjs
  var DoorClosed = [
    ["path", { d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" }],
    ["path", { d: "M2 21h20" }],
    ["path", { d: "M9 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/door-open.mjs
  var DoorOpen = [
    ["path", { d: "M10 21H2" }],
    ["path", { d: "M10 3H7a2 2 0 00-2 2v16" }],
    ["path", { d: "M14 12h.01" }],
    ["path", { d: "M19 21V5a2 2 0 00-1.675-1.974l-6.163-1.013A1 1 0 0010 3v18a1 1 0 001.124.992z" }],
    ["path", { d: "M22 21h-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/dot.mjs
  var Dot = [["circle", { cx: "12", cy: "12", r: "1" }]];

  // node_modules/lucide/dist/esm/icons/door-stairwell.mjs
  var DoorStairwell = [
    ["path", { d: "M12 17v-3a1 1 0 011-1h6" }],
    ["path", { d: "M19 17h-9a1 1 0 00-1 1v3" }],
    ["path", { d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" }],
    ["path", { d: "M19 9h-3a1 1 0 00-1 1v3" }],
    ["path", { d: "M22 21H2" }]
  ];

  // node_modules/lucide/dist/esm/icons/download.mjs
  var Download = [
    ["path", { d: "M12 15V3" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["path", { d: "m7 10 5 5 5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/drama.mjs
  var Drama = [
    ["path", { d: "M10 11h.01" }],
    ["path", { d: "M14 6h.01" }],
    ["path", { d: "M18 6h.01" }],
    ["path", { d: "M6.5 13.1h.01" }],
    ["path", { d: "M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3" }],
    ["path", { d: "M17.4 9.9c-.8.8-2 .8-2.8 0" }],
    [
      "path",
      {
        d: "M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7"
      }
    ],
    ["path", { d: "M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4" }]
  ];

  // node_modules/lucide/dist/esm/icons/drafting-compass.mjs
  var DraftingCompass = [
    ["path", { d: "m12.99 6.74 1.93 3.44" }],
    ["path", { d: "M19.136 12a10 10 0 0 1-14.271 0" }],
    ["path", { d: "m21 21-2.16-3.84" }],
    ["path", { d: "m3 21 8.02-14.26" }],
    ["circle", { cx: "12", cy: "5", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/drill.mjs
  var Drill = [
    ["path", { d: "M10 18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a3 3 0 0 1-3-3 1 1 0 0 1 1-1z" }],
    [
      "path",
      {
        d: "M13 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1l-.81 3.242a1 1 0 0 1-.97.758H8"
      }
    ],
    ["path", { d: "M14 4h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3" }],
    ["path", { d: "M18 6h4" }],
    ["path", { d: "m5 10-2 8" }],
    ["path", { d: "m7 18 2-8" }]
  ];

  // node_modules/lucide/dist/esm/icons/drone.mjs
  var Drone = [
    ["path", { d: "M10 10 7 7" }],
    ["path", { d: "m10 14-3 3" }],
    ["path", { d: "m14 10 3-3" }],
    ["path", { d: "m14 14 3 3" }],
    ["path", { d: "M14.205 4.139a4 4 0 1 1 5.439 5.863" }],
    ["path", { d: "M19.637 14a4 4 0 1 1-5.432 5.868" }],
    ["path", { d: "M4.367 10a4 4 0 1 1 5.438-5.862" }],
    ["path", { d: "M9.795 19.862a4 4 0 1 1-5.429-5.873" }],
    ["rect", { x: "10", y: "8", width: "4", height: "8", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/droplet-off.mjs
  var DropletOff = [
    [
      "path",
      {
        d: "M18.715 13.186C18.29 11.858 17.384 10.607 16 9.5c-2-1.6-3.5-4-4-6.5a10.7 10.7 0 0 1-.884 2.586"
      }
    ],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M8.795 8.797A11 11 0 0 1 8 9.5C6 11.1 5 13 5 15a7 7 0 0 0 13.222 3.208" }]
  ];

  // node_modules/lucide/dist/esm/icons/droplet.mjs
  var Droplet = [
    [
      "path",
      {
        d: "M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/droplets.mjs
  var Droplets = [
    [
      "path",
      {
        d: "M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"
      }
    ],
    [
      "path",
      {
        d: "M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/drum.mjs
  var Drum = [
    ["path", { d: "m2 2 8 8" }],
    ["path", { d: "m22 2-8 8" }],
    ["ellipse", { cx: "12", cy: "9", rx: "10", ry: "5" }],
    ["path", { d: "M7 13.4v7.9" }],
    ["path", { d: "M12 14v8" }],
    ["path", { d: "M17 13.4v7.9" }],
    ["path", { d: "M2 9v8a10 5 0 0 0 20 0V9" }]
  ];

  // node_modules/lucide/dist/esm/icons/drumstick.mjs
  var Drumstick = [
    ["path", { d: "M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23" }],
    ["path", { d: "m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59" }]
  ];

  // node_modules/lucide/dist/esm/icons/dumbbell.mjs
  var Dumbbell = [
    [
      "path",
      {
        d: "M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"
      }
    ],
    ["path", { d: "m2.5 21.5 1.4-1.4" }],
    ["path", { d: "m20.1 3.9 1.4-1.4" }],
    [
      "path",
      {
        d: "M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"
      }
    ],
    ["path", { d: "m9.6 14.4 4.8-4.8" }]
  ];

  // node_modules/lucide/dist/esm/icons/ear-off.mjs
  var EarOff = [
    ["path", { d: "M6 18.5a3.5 3.5 0 1 0 7 0c0-1.57.92-2.52 2.04-3.46" }],
    ["path", { d: "M6 8.5c0-.75.13-1.47.36-2.14" }],
    ["path", { d: "M8.8 3.15A6.5 6.5 0 0 1 19 8.5c0 1.63-.44 2.81-1.09 3.76" }],
    ["path", { d: "M12.5 6A2.5 2.5 0 0 1 15 8.5M10 13a2 2 0 0 0 1.82-1.18" }],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
  ];

  // node_modules/lucide/dist/esm/icons/ear.mjs
  var Ear = [
    ["path", { d: "M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" }],
    ["path", { d: "M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/earbuds-off.mjs
  var EarbudsOff = [
    [
      "path",
      {
        d: "M10 10v9a2 2 0 01-4 0v-8a5 5 0 01-3.75-1.693A1 1 0 012 8.646V5.354a1 1 0 01.25-.661 5 5 0 011.359-1.084"
      }
    ],
    ["path", { d: "M14 14v5a2 2 90 004 0v-1" }],
    [
      "path",
      {
        d: "M18 12.343V11a5 5 90 003.75-1.693 1 1 90 00.25-.661V5.354a1 1 90 00-.25-.661A5 5 90 0018 3a4 4 90 00-4 4v1.343"
      }
    ],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/earbuds.mjs
  var Earbuds = [
    [
      "path",
      {
        d: "M18 3a4 4 90 00-4 4v12a2 2 90 004 0v-8a5 5 90 003.75-1.693 1 1 90 00.25-.661V5.354a1 1 90 00-.25-.661A5 5 90 0018 3"
      }
    ],
    [
      "path",
      {
        d: "M6 3a4 4 0 014 4v12a2 2 0 01-4 0v-8a5 5 0 01-3.75-1.693A1 1 0 012 8.646V5.354a1 1 0 01.25-.661A5 5 0 016 3"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/earth-lock.mjs
  var EarthLock = [
    ["path", { d: "M7 3.34V5a3 3 0 0 0 3 3" }],
    ["path", { d: "M11 21.95V18a2 2 0 0 0-2-2 2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" }],
    ["path", { d: "M21.54 15H17a2 2 0 0 0-2 2v4.54" }],
    ["path", { d: "M12 2a10 10 0 1 0 9.54 13" }],
    ["path", { d: "M20 6V4a2 2 0 1 0-4 0v2" }],
    ["rect", { width: "8", height: "5", x: "14", y: "6", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/earth.mjs
  var Earth = [
    ["path", { d: "M21.54 15H17a2 2 0 0 0-2 2v4.54" }],
    [
      "path",
      { d: "M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" }
    ],
    ["path", { d: "M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/eclipse.mjs
  var Eclipse = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 2a7 7 0 1 0 10 10" }]
  ];

  // node_modules/lucide/dist/esm/icons/egg-off.mjs
  var EggOff = [
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M20 14.347V14c0-6-4-12-8-12-1.078 0-2.157.436-3.157 1.19" }],
    ["path", { d: "M6.206 6.21C4.871 8.4 4 11.2 4 14a8 8 0 0 0 14.568 4.568" }]
  ];

  // node_modules/lucide/dist/esm/icons/egg-fried.mjs
  var EggFried = [
    ["circle", { cx: "11.5", cy: "12.5", r: "3.5" }],
    [
      "path",
      {
        d: "M3 8c0-3.5 2.5-6 6.5-6 5 0 4.83 3 7.5 5s5 2 5 6c0 4.5-2.5 6.5-7 6.5-2.5 0-2.5 2.5-6 2.5s-7-2-7-5.5c0-3 1.5-3 1.5-5C3.5 10 3 9 3 8Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/egg.mjs
  var Egg = [["path", { d: "M12 2C8 2 4 8 4 14a8 8 0 0 0 16 0c0-6-4-12-8-12" }]];

  // node_modules/lucide/dist/esm/icons/eighth-note.mjs
  var EighthNote = [
    ["path", { d: "m19 6-5.2-3.9a.5.5 0 0 0-.8.4V18" }],
    ["circle", { cx: "9", cy: "18", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/eighth-notes.mjs
  var EighthNotes = [
    ["path", { d: "M21 16V3a1 1 0 0 0-1.28-.96l-10 2.917a1 1 0 0 0-.72.96V19" }],
    ["circle", { cx: "18", cy: "16", r: "3" }],
    ["circle", { cx: "6", cy: "19", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/eject.mjs
  var Eject = [
    [
      "path",
      { d: "M4 13a1 1 0 0 1-.72-1.695l7.257-7.668a2 2 0 0 1 2.926 0l7.256 7.668A1 1 0 0 1 20 13z" }
    ],
    ["rect", { x: "3", y: "17", width: "18", height: "4", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/ellipse.mjs
  var Ellipse = [["ellipse", { cx: "12", cy: "12", rx: "10", ry: "6" }]];

  // node_modules/lucide/dist/esm/icons/ellipsis-vertical.mjs
  var EllipsisVertical = [
    ["circle", { cx: "12", cy: "12", r: "1" }],
    ["circle", { cx: "12", cy: "5", r: "1" }],
    ["circle", { cx: "12", cy: "19", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/ellipsis.mjs
  var Ellipsis = [
    ["circle", { cx: "12", cy: "12", r: "1" }],
    ["circle", { cx: "19", cy: "12", r: "1" }],
    ["circle", { cx: "5", cy: "12", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/emirati-dirham.mjs
  var EmiratiDirham = [
    ["path", { d: "M11 4a8 8 0 0 1 0 16H6.406A.4.4 0 0 1 6 19.594V4.406A.4.4 0 0 1 6.406 4z" }],
    ["path", { d: "M4 10h17" }],
    ["path", { d: "M4 14h17" }]
  ];

  // node_modules/lucide/dist/esm/icons/engine.mjs
  var Engine = [
    ["path", { d: "M10 3h6" }],
    ["path", { d: "M13 3v4" }],
    ["path", { d: "M2 10v6" }],
    ["path", { d: "M2 13h4" }],
    [
      "path",
      {
        d: "M6 16a2 2 0 002 2h1a2 2 0 011.6.8l.3.4a2 2 0 001.6.8h2.264a2 2 0 001.789-1.106l1.67-3.341a1 1 0 01.895-.553H21a1 1 0 001-1v-4a1 1 0 00-1-1h-3.5a1 1 0 01-.8-.4l-.9-1.2A1 1 0 0015 7h-4a1 1 0 00-.8.4l-.9 1.2a1 1 0 01-.8.4H7a1 1 0 00-1 1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/equal-approximately-not.mjs
  var EqualApproximatelyNot = [
    ["path", { d: "M5 15a6.5 6.5 0 0 1 7 0 6.5 6.5 0 0 0 7 0" }],
    ["path", { d: "M5 9a6.5 6.5 0 0 1 7 0 6.5 6.5 0 0 0 7 0" }],
    ["line", { x1: "19", x2: "5", y1: "5", y2: "19" }]
  ];

  // node_modules/lucide/dist/esm/icons/equal-approximately.mjs
  var EqualApproximately = [
    ["path", { d: "M5 15a6.5 6.5 0 0 1 7 0 6.5 6.5 0 0 0 7 0" }],
    ["path", { d: "M5 9a6.5 6.5 0 0 1 7 0 6.5 6.5 0 0 0 7 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/equal-not.mjs
  var EqualNot = [
    ["line", { x1: "5", x2: "19", y1: "9", y2: "9" }],
    ["line", { x1: "5", x2: "19", y1: "15", y2: "15" }],
    ["line", { x1: "19", x2: "5", y1: "5", y2: "19" }]
  ];

  // node_modules/lucide/dist/esm/icons/equal.mjs
  var Equal = [
    ["line", { x1: "5", x2: "19", y1: "9", y2: "9" }],
    ["line", { x1: "5", x2: "19", y1: "15", y2: "15" }]
  ];

  // node_modules/lucide/dist/esm/icons/eraser.mjs
  var Eraser = [
    [
      "path",
      {
        d: "M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21"
      }
    ],
    ["path", { d: "m5.082 11.09 8.828 8.828" }]
  ];

  // node_modules/lucide/dist/esm/icons/euro.mjs
  var Euro = [
    ["path", { d: "M4 10h12" }],
    ["path", { d: "M4 14h9" }],
    [
      "path",
      { d: "M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/ethernet-port.mjs
  var EthernetPort = [
    ["path", { d: "M10 8v1" }],
    ["path", { d: "M14 8v1" }],
    ["path", { d: "M18 8v1" }],
    [
      "path",
      {
        d: "M19 17a2 2 0 00-1.765 1.059l-.47.882A2 2 0 0115 20H9a2 2 0 01-1.765-1.059l-.47-.882A2 2 0 005 17H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v9a2 2 0 01-2 2z"
      }
    ],
    ["path", { d: "M6 8v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/ev-charger.mjs
  var EvCharger = [
    ["path", { d: "M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5" }],
    ["path", { d: "M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16" }],
    ["path", { d: "M2 21h13" }],
    ["path", { d: "M3 7h11" }],
    ["path", { d: "m9 11-2 3h3l-2 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/expand.mjs
  var Expand = [
    ["path", { d: "m15 15 6 6" }],
    ["path", { d: "m15 9 6-6" }],
    ["path", { d: "M21 16v5h-5" }],
    ["path", { d: "M21 8V3h-5" }],
    ["path", { d: "M3 16v5h5" }],
    ["path", { d: "m3 21 6-6" }],
    ["path", { d: "M3 8V3h5" }],
    ["path", { d: "M9 9 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/external-link.mjs
  var ExternalLink = [
    ["path", { d: "M15 3h6v6" }],
    ["path", { d: "M10 14 21 3" }],
    ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/eye-closed.mjs
  var EyeClosed = [
    ["path", { d: "m15 18-.722-3.25" }],
    ["path", { d: "M2 8a10.645 10.645 0 0 0 20 0" }],
    ["path", { d: "m20 15-1.726-2.05" }],
    ["path", { d: "m4 15 1.726-2.05" }],
    ["path", { d: "m9 18 .722-3.25" }]
  ];

  // node_modules/lucide/dist/esm/icons/eye-dashed.mjs
  var EyeDashed = [
    ["path", { d: "M13.054 18.946a11 11 0 0 1-2.11 0" }],
    ["path", { d: "M13.054 5.054a11 11 0 0 0-2.11-.001" }],
    ["path", { d: "M17.072 6.274a11 11 0 0 1 1.753 1.173" }],
    ["path", { d: "M18.825 16.552a11 11 0 0 1-1.753 1.174" }],
    ["path", { d: "M2.514 13.303a11 11 0 0 1-.452-.954 1 1 0 0 1 0-.697 11 11 0 0 1 .45-.955" }],
    ["path", { d: "M21.485 10.697a11 11 0 0 1 .453.955 1 1 0 0 1 0 .697 11 11 0 0 1-.453.954" }],
    ["path", { d: "M5.173 7.448a11 11 0 0 1 1.753-1.174" }],
    ["path", { d: "M6.926 17.726a11 11 0 0 1-1.753-1.174" }],
    ["circle", { cx: "12", cy: "12", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/eye-off.mjs
  var EyeOff = [
    [
      "path",
      {
        d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
      }
    ],
    ["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242" }],
    [
      "path",
      {
        d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
      }
    ],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/eye.mjs
  var Eye = [
    [
      "path",
      {
        d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/face-angry.mjs
  var FaceAngry = [
    ["path", { d: "M15 12v-1.584" }],
    ["path", { d: "M17 10a5 5 0 00-3 1" }],
    ["path", { d: "M7 10a5 5 0 013 1" }],
    ["path", { d: "M9 12v-1.584" }],
    ["path", { d: "M9 17a5 5 0 016.001 0" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/face-expressionless.mjs
  var FaceExpressionless = [
    ["path", { d: "M14 10h2" }],
    ["path", { d: "M8 10h2" }],
    ["path", { d: "M8 16h8" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/face-grinning.mjs
  var FaceGrinning = [
    ["path", { d: "M15 10V9" }],
    [
      "path",
      { d: "M7.084 14.302a5.12 5.12 0 009.833 0 .24.24 0 00-.235-.302H7.32a.24.24 0 00-.235.302" }
    ],
    ["path", { d: "M9 10V9" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/face-neutral.mjs
  var FaceNeutral = [
    ["path", { d: "M15 10V9" }],
    ["path", { d: "M8 16h8" }],
    ["path", { d: "M9 10V9" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/face-slightly-frowning.mjs
  var FaceSlightlyFrowning = [
    ["path", { d: "M15 10V9" }],
    ["path", { d: "M9 10V9" }],
    ["path", { d: "M9 16a5 5 0 016 0" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/face-slightly-smiling-plus.mjs
  var FaceSlightlySmilingPlus = [
    ["path", { d: "M13.267 2.08a10 10 0 108.653 8.653" }],
    ["path", { d: "M15 10V9" }],
    ["path", { d: "M16 5h6" }],
    ["path", { d: "M16.472 15a6 6 0 01-8.943 0" }],
    ["path", { d: "M19 2v6" }],
    ["path", { d: "M9 10V9" }]
  ];

  // node_modules/lucide/dist/esm/icons/factory.mjs
  var Factory = [
    ["path", { d: "M12 16h.01" }],
    ["path", { d: "M16 16h.01" }],
    [
      "path",
      {
        d: "M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"
      }
    ],
    ["path", { d: "M8 16h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/face-slightly-smiling.mjs
  var FaceSlightlySmiling = [
    ["path", { d: "M15 10V9" }],
    ["path", { d: "M16.472 15a6 6 0 01-8.943 0" }],
    ["path", { d: "M9 10V9" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/fan.mjs
  var Fan = [
    [
      "path",
      {
        d: "M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z"
      }
    ],
    ["path", { d: "M12 12v.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/fast-forward.mjs
  var FastForward = [
    ["path", { d: "M12 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 12 18z" }],
    ["path", { d: "M2 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 2 18z" }]
  ];

  // node_modules/lucide/dist/esm/icons/faucet.mjs
  var Faucet = [
    ["path", { d: "M10.083 5.428 5.57 4.083a2 2 0 10.001 3.834l4.512-1.345" }],
    ["path", { d: "M12 8v3" }],
    ["path", { d: "m13.917 5.428 4.511-1.345a2 2 0 110 3.834l-4.51-1.345" }],
    ["path", { d: "M18 17v-4.006" }],
    ["path", { d: "M22 11v8" }],
    [
      "path",
      {
        d: "M22 12h-3a1 1 0 00-1 .994h-2.539a4 4 0 00-6.915-.012L7 13a5 5 0 00-5 5v1a1 1 0 001 1h2a1 1 0 001-1v-1a1 1 0 01.995-1l1.552.018a4 4 0 006.907 0L18 17a1 1 0 001 1h3"
      }
    ],
    ["circle", { cx: "12", cy: "6", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/feather.mjs
  var Feather = [
    [
      "path",
      {
        d: "M14.086 18.412A2 2 0 0112.67 19H5v-7.672a2 2 0 01.586-1.414L11.75 3.75a6 6 0 118.49 8.49z"
      }
    ],
    ["path", { d: "M16 8 2 22" }],
    ["path", { d: "M17.488 15H9" }]
  ];

  // node_modules/lucide/dist/esm/icons/fence.mjs
  var Fence = [
    ["path", { d: "M4 3 2 5v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" }],
    ["path", { d: "M6 8h4" }],
    ["path", { d: "M6 18h4" }],
    ["path", { d: "m12 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" }],
    ["path", { d: "M14 8h4" }],
    ["path", { d: "M14 18h4" }],
    ["path", { d: "m20 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/ferris-wheel.mjs
  var FerrisWheel = [
    ["circle", { cx: "12", cy: "12", r: "2" }],
    ["path", { d: "M12 2v4" }],
    ["path", { d: "m6.8 15-3.5 2" }],
    ["path", { d: "m20.7 7-3.5 2" }],
    ["path", { d: "M6.8 9 3.3 7" }],
    ["path", { d: "m20.7 17-3.5-2" }],
    ["path", { d: "m9 22 3-8 3 8" }],
    ["path", { d: "M8 22h8" }],
    ["path", { d: "M18 18.7a9 9 0 1 0-12 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-archive.mjs
  var FileArchive = [
    [
      "path",
      {
        d: "M13.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v11.5"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M8 12v-1" }],
    ["path", { d: "M8 18v-2" }],
    ["path", { d: "M8 7V6" }],
    ["circle", { cx: "8", cy: "20", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-axis-3d.mjs
  var FileAxis3d = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m8 18 4-4" }],
    ["path", { d: "M8 10v8h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-badge.mjs
  var FileBadge = [
    [
      "path",
      {
        d: "M13 22h5a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v3.3"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    [
      "path",
      {
        d: "m7.69 16.479 1.29 4.88a.5.5 0 0 1-.698.591l-1.843-.849a1 1 0 0 0-.879.001l-1.846.85a.5.5 0 0 1-.692-.593l1.29-4.88"
      }
    ],
    ["circle", { cx: "6", cy: "14", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-box.mjs
  var FileBox = [
    ["path", { d: "M14 2v5a1 1 0 001 1h5" }],
    [
      "path",
      {
        d: "M14.692 22H18a2 2 0 002-2V8a2.4 2.4 0 00-.706-1.706l-3.588-3.588A2.4 2.4 0 0014 2H6a2 2 0 00-2 2v3.804"
      }
    ],
    ["path", { d: "M2.264 13.752 7 16.5l4.737-2.748" }],
    [
      "path",
      {
        d: "M2.995 13.014A2 2 0 002 14.744v3.516a2 2 0 00.996 1.73l3 1.74a2 2 0 002.008 0l3-1.74A2 2 0 0012 18.26v-3.517a2 2 0 00-.995-1.73l-3-1.742a2 2 0 00-1.892-.064z"
      }
    ],
    ["path", { d: "M7 16.5V22" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-braces-corner.mjs
  var FileBracesCorner = [
    [
      "path",
      {
        d: "M14 22h4a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v6"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M5 14a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1 1 1 0 0 1 1 1v2a1 1 0 0 0 1 1" }],
    ["path", { d: "M9 22a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-2a1 1 0 0 0-1-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-braces.mjs
  var FileBraces = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" }],
    ["path", { d: "M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-chart-column-increasing.mjs
  var FileChartColumnIncreasing = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M8 18v-2" }],
    ["path", { d: "M12 18v-4" }],
    ["path", { d: "M16 18v-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-chart-column.mjs
  var FileChartColumn = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M8 18v-1" }],
    ["path", { d: "M12 18v-6" }],
    ["path", { d: "M16 18v-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-chart-line.mjs
  var FileChartLine = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m16 13-3.5 3.5-2-2L8 17" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-chart-pie.mjs
  var FileChartPie = [
    [
      "path",
      {
        d: "M15.941 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.704l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v3.512"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M4.017 11.512a6 6 0 1 0 8.466 8.475" }],
    [
      "path",
      {
        d: "M9 16a1 1 0 0 1-1-1v-4c0-.552.45-1.008.995-.917a6 6 0 0 1 4.922 4.922c.091.544-.365.995-.917.995z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/file-check-corner.mjs
  var FileCheckCorner = [
    [
      "path",
      {
        d: "M10.5 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v6"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m14 20 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-check.mjs
  var FileCheck = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m9 15 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-clock.mjs
  var FileClock = [
    [
      "path",
      {
        d: "M16 22h2a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v2.85"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M8 14v2.2l1.6 1" }],
    ["circle", { cx: "8", cy: "16", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-code-corner.mjs
  var FileCodeCorner = [
    [
      "path",
      {
        d: "M4 12.15V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-3.35"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m5 16-3 3 3 3" }],
    ["path", { d: "m9 22 3-3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-code.mjs
  var FileCode = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M10 12.5 8 15l2 2.5" }],
    ["path", { d: "m14 12.5 2 2.5-2 2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-cog.mjs
  var FileCog = [
    ["path", { d: "M15 8a1 1 0 0 1-1-1V2a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8z" }],
    ["path", { d: "M20 8v12a2 2 0 0 1-2 2h-4.182" }],
    ["path", { d: "m3.305 19.53.923-.382" }],
    ["path", { d: "M4 10.592V4a2 2 0 0 1 2-2h8" }],
    ["path", { d: "m4.228 16.852-.924-.383" }],
    ["path", { d: "m5.852 15.228-.383-.923" }],
    ["path", { d: "m5.852 20.772-.383.924" }],
    ["path", { d: "m8.148 15.228.383-.923" }],
    ["path", { d: "m8.53 21.696-.382-.924" }],
    ["path", { d: "m9.773 16.852.922-.383" }],
    ["path", { d: "m9.773 19.148.922.383" }],
    ["circle", { cx: "7", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-database.mjs
  var FileDatabase = [
    ["path", { d: "M12 12v8a5 2 0 01-10 0v-8" }],
    ["path", { d: "M12 16a5 2 0 01-10 0" }],
    ["path", { d: "M14 2v5a1 1 0 001 1h5" }],
    [
      "path",
      {
        d: "M4 6.3V4a2 2 0 012-2h8a2.4 2.4 0 011.706.706l3.588 3.588A2.4 2.4 0 0120 8v12a2 2 0 01-2 2h-2.43"
      }
    ],
    ["ellipse", { cx: "7", cy: "12", rx: "5", ry: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-diff.mjs
  var FileDiff = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M9 10h6" }],
    ["path", { d: "M12 13V7" }],
    ["path", { d: "M9 17h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-digit.mjs
  var FileDigit = [
    [
      "path",
      {
        d: "M4 12V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M10 16h2v6" }],
    ["path", { d: "M10 22h4" }],
    ["rect", { x: "2", y: "16", width: "4", height: "6", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-down.mjs
  var FileDown = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M12 18v-6" }],
    ["path", { d: "m9 15 3 3 3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-exclamation-point.mjs
  var FileExclamationPoint = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M12 9v4" }],
    ["path", { d: "M12 17h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-headphone.mjs
  var FileHeadphone = [
    [
      "path",
      {
        d: "M4 6.835V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-.343"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    [
      "path",
      { d: "M2 19a2 2 0 0 1 4 0v1a2 2 0 0 1-4 0v-4a6 6 0 0 1 12 0v4a2 2 0 0 1-4 0v-1a2 2 0 0 1 4 0" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/file-heart.mjs
  var FileHeart = [
    [
      "path",
      {
        d: "M13 22h5a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v7"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    [
      "path",
      {
        d: "M3.62 18.8A2.25 2.25 0 1 1 7 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a1 1 0 0 1-1.507 0z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/file-image.mjs
  var FileImage = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["circle", { cx: "10", cy: "12", r: "2" }],
    ["path", { d: "m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-input.mjs
  var FileInput = [
    [
      "path",
      {
        d: "M4 11V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M2 15h10" }],
    ["path", { d: "m9 18 3-3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-key.mjs
  var FileKey = [
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M4 12v6" }],
    ["path", { d: "M4 14h2" }],
    [
      "path",
      {
        d: "M9.65 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v4"
      }
    ],
    ["circle", { cx: "4", cy: "20", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-lock.mjs
  var FileLock = [
    [
      "path",
      {
        d: "M4 9.8V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-3"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M9 17v-2a2 2 0 0 0-4 0v2" }],
    ["rect", { width: "8", height: "5", x: "3", y: "17", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-minus-corner.mjs
  var FileMinusCorner = [
    [
      "path",
      {
        d: "M20 14V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M14 18h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-minus.mjs
  var FileMinus = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M9 15h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-output.mjs
  var FileOutput = [
    [
      "path",
      {
        d: "M4.226 20.925A2 2 0 0 0 6 22h12a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v3.127"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m5 11-3 3" }],
    ["path", { d: "m5 17-3-3h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-music.mjs
  var FileMusic = [
    [
      "path",
      {
        d: "M11.65 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v10.35"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M8 20v-7l3 1.474" }],
    ["circle", { cx: "6", cy: "20", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-pen-line.mjs
  var FilePenLine = [
    [
      "path",
      {
        d: "M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z"
      }
    ],
    ["path", { d: "M14.487 7.858A1 1 0 0 1 14 7V2" }],
    [
      "path",
      {
        d: "M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516"
      }
    ],
    ["path", { d: "M8 18h1" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-pen.mjs
  var FilePen = [
    [
      "path",
      {
        d: "M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    [
      "path",
      {
        d: "M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/file-play.mjs
  var FilePlay = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    [
      "path",
      {
        d: "M15.033 13.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56v-4.704a.645.645 0 0 1 .967-.56z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/file-plus-corner.mjs
  var FilePlusCorner = [
    [
      "path",
      {
        d: "M11.35 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5.35"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M14 19h6" }],
    ["path", { d: "M17 16v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-plus.mjs
  var FilePlus = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M9 15h6" }],
    ["path", { d: "M12 18v-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-question-mark.mjs
  var FileQuestionMark = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M12 17h.01" }],
    ["path", { d: "M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-scan.mjs
  var FileScan = [
    [
      "path",
      {
        d: "M20 10V8a2.4 2.4 0 0 0-.706-1.704l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h4.35"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M16 14a2 2 0 0 0-2 2" }],
    ["path", { d: "M16 22a2 2 0 0 1-2-2" }],
    ["path", { d: "M20 14a2 2 0 0 1 2 2" }],
    ["path", { d: "M20 22a2 2 0 0 0 2-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-search-corner.mjs
  var FileSearchCorner = [
    [
      "path",
      {
        d: "M11.1 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.589 3.588A2.4 2.4 0 0 1 20 8v3.25"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m21 22-2.88-2.88" }],
    ["circle", { cx: "16", cy: "17", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-search.mjs
  var FileSearch = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["circle", { cx: "11.5", cy: "14.5", r: "2.5" }],
    ["path", { d: "M13.3 16.3 15 18" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-signal.mjs
  var FileSignal = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M8 15h.01" }],
    ["path", { d: "M11.5 13.5a2.5 2.5 0 0 1 0 3" }],
    ["path", { d: "M15 12a5 5 0 0 1 0 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-sliders.mjs
  var FileSliders = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M8 12h8" }],
    ["path", { d: "M10 11v2" }],
    ["path", { d: "M8 17h8" }],
    ["path", { d: "M14 16v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-spreadsheet.mjs
  var FileSpreadsheet = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M8 13h2" }],
    ["path", { d: "M14 13h2" }],
    ["path", { d: "M8 17h2" }],
    ["path", { d: "M14 17h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-stack.mjs
  var FileStack = [
    ["path", { d: "M11 21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1" }],
    ["path", { d: "M16 16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1" }],
    [
      "path",
      {
        d: "M21 6a2 2 0 0 0-.586-1.414l-2-2A2 2 0 0 0 17 2h-3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/file-symlink.mjs
  var FileSymlink = [
    [
      "path",
      {
        d: "M4 11V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m10 18 3-3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-terminal.mjs
  var FileTerminal = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m8 16 2-2-2-2" }],
    ["path", { d: "M12 18h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-text.mjs
  var FileText = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M10 9H8" }],
    ["path", { d: "M16 13H8" }],
    ["path", { d: "M16 17H8" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-type-corner.mjs
  var FileTypeCorner = [
    [
      "path",
      {
        d: "M12 22h6a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v6"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M3 16v-1.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5V16" }],
    ["path", { d: "M6 22h2" }],
    ["path", { d: "M7 14v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-type.mjs
  var FileType = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M11 18h2" }],
    ["path", { d: "M12 12v6" }],
    ["path", { d: "M9 13v-.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-up.mjs
  var FileUp = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M12 12v6" }],
    ["path", { d: "m15 15-3-3-3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-user.mjs
  var FileUser = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M16 22a4 4 0 0 0-8 0" }],
    ["circle", { cx: "12", cy: "15", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-video-camera.mjs
  var FileVideoCamera = [
    [
      "path",
      {
        d: "M4 12V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    [
      "path",
      { d: "m10 17.843 3.033-1.755a.64.64 0 0 1 .967.56v4.704a.65.65 0 0 1-.967.56L10 20.157" }
    ],
    ["rect", { width: "7", height: "6", x: "3", y: "16", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-volume.mjs
  var FileVolume = [
    [
      "path",
      {
        d: "M4 11.55V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-1.95"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M12 15a5 5 0 0 1 0 6" }],
    [
      "path",
      {
        d: "M8 14.502a.5.5 0 0 0-.826-.381l-1.893 1.631a1 1 0 0 1-.651.243H3.5a.5.5 0 0 0-.5.501v3.006a.5.5 0 0 0 .5.501h1.129a1 1 0 0 1 .652.243l1.893 1.633a.5.5 0 0 0 .826-.38z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/file-x-corner.mjs
  var FileXCorner = [
    [
      "path",
      {
        d: "M11 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m15 17 5 5" }],
    ["path", { d: "m20 17-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/file-x.mjs
  var FileX = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m14.5 12.5-5 5" }],
    ["path", { d: "m9.5 12.5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/file.mjs
  var File = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/files.mjs
  var Files = [
    ["path", { d: "M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" }],
    ["path", { d: "M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z" }],
    ["path", { d: "M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/film.mjs
  var Film = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M7 3v18" }],
    ["path", { d: "M3 7.5h4" }],
    ["path", { d: "M3 12h18" }],
    ["path", { d: "M3 16.5h4" }],
    ["path", { d: "M17 3v18" }],
    ["path", { d: "M17 7.5h4" }],
    ["path", { d: "M17 16.5h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/fingerprint-pattern.mjs
  var FingerprintPattern = [
    ["path", { d: "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" }],
    ["path", { d: "M14 13.12c0 2.38 0 6.38-1 8.88" }],
    ["path", { d: "M17.29 21.02c.12-.6.43-2.3.5-3.02" }],
    ["path", { d: "M2 12a10 10 0 0 1 18-6" }],
    ["path", { d: "M2 16h.01" }],
    ["path", { d: "M21.8 16c.2-2 .131-5.354 0-6" }],
    ["path", { d: "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" }],
    ["path", { d: "M8.65 22c.21-.66.45-1.32.57-2" }],
    ["path", { d: "M9 6.8a6 6 0 0 1 9 5.2v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/fire-extinguisher.mjs
  var FireExtinguisher = [
    ["path", { d: "M15 6.5V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3.5" }],
    ["path", { d: "M9 18h8" }],
    ["path", { d: "M18 3h-3" }],
    ["path", { d: "M11 3a6 6 0 0 0-6 6v11" }],
    ["path", { d: "M5 13h4" }],
    ["path", { d: "M17 10a4 4 0 0 0-8 0v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/fish-off.mjs
  var FishOff = [
    [
      "path",
      {
        d: "M18 12.47v.03m0-.5v.47m-.475 5.056A6.744 6.744 0 0 1 15 18c-3.56 0-7.56-2.53-8.5-6 .348-1.28 1.114-2.433 2.121-3.38m3.444-2.088A8.802 8.802 0 0 1 15 6c3.56 0 6.06 2.54 7 6-.309 1.14-.786 2.177-1.413 3.058"
      }
    ],
    [
      "path",
      {
        d: "M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33m7.48-4.372A9.77 9.77 0 0 1 16 6.07m0 11.86a9.77 9.77 0 0 1-1.728-3.618"
      }
    ],
    [
      "path",
      {
        d: "m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98M8.53 3h5.27a2 2 0 0 1 1.98 1.67l.23 1.4M2 2l20 20"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/fish-symbol.mjs
  var FishSymbol = [["path", { d: "M2 16s9-15 20-4C11 23 2 8 2 8" }]];

  // node_modules/lucide/dist/esm/icons/fish.mjs
  var Fish = [
    [
      "path",
      {
        d: "M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"
      }
    ],
    ["path", { d: "M18 12v.5" }],
    ["path", { d: "M16 17.93a9.77 9.77 0 0 1 0-11.86" }],
    [
      "path",
      {
        d: "M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"
      }
    ],
    ["path", { d: "M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4" }],
    ["path", { d: "m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98" }]
  ];

  // node_modules/lucide/dist/esm/icons/fishing-hook.mjs
  var FishingHook = [
    ["path", { d: "m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10" }],
    ["path", { d: "M20.414 8.586 22 7" }],
    ["circle", { cx: "19", cy: "10", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/fishing-rod.mjs
  var FishingRod = [
    ["path", { d: "M4 11h1" }],
    ["path", { d: "M8 15a2 2 0 0 1-4 0V3a1 1 0 0 1 1-1h.5C14 2 20 9 20 18v4" }],
    ["circle", { cx: "18", cy: "18", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/flag-off.mjs
  var FlagOff = [
    ["path", { d: "M16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M4 22V4" }],
    ["path", { d: "M7.656 2H8c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10.347" }]
  ];

  // node_modules/lucide/dist/esm/icons/flag-triangle-left.mjs
  var FlagTriangleLeft = [
    ["path", { d: "M18 22V2.8a.8.8 0 0 0-1.17-.71L5.45 7.78a.8.8 0 0 0 0 1.44L18 15.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/flag-triangle-right.mjs
  var FlagTriangleRight = [
    ["path", { d: "M6 22V2.8a.8.8 0 0 1 1.17-.71l11.38 5.69a.8.8 0 0 1 0 1.44L6 15.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/flag.mjs
  var Flag = [
    [
      "path",
      {
        d: "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/flame-kindling.mjs
  var FlameKindling = [
    [
      "path",
      {
        d: "M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z"
      }
    ],
    ["path", { d: "m5 22 14-4" }],
    ["path", { d: "m5 18 14 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/flame.mjs
  var Flame = [
    [
      "path",
      {
        d: "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/flashlight.mjs
  var Flashlight = [
    ["path", { d: "M12 13v1" }],
    [
      "path",
      {
        d: "M17 2a1 1 0 0 1 1 1v4a3 3 0 0 1-.6 1.8l-.6.8A4 4 0 0 0 16 12v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8a4 4 0 0 0-.8-2.4l-.6-.8A3 3 0 0 1 6 7V3a1 1 0 0 1 1-1z"
      }
    ],
    ["path", { d: "M6 6h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/flask-conical-off.mjs
  var FlaskConicalOff = [
    ["path", { d: "M10 2v2.343" }],
    ["path", { d: "M14 2v6.343" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M20 20a2 2 0 0 1-2 2H6a2 2 0 0 1-1.755-2.96l5.227-9.563" }],
    ["path", { d: "M6.453 15H15" }],
    ["path", { d: "M8.5 2h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/flashlight-off.mjs
  var FlashlightOff = [
    ["path", { d: "M11.652 6H18" }],
    ["path", { d: "M12 13v1" }],
    [
      "path",
      { d: "M16 16v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-8a4 4 0 0 0-.8-2.4l-.6-.8A3 3 0 0 1 6 7V6" }
    ],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M7.649 2H17a1 1 0 0 1 1 1v4a3 3 0 0 1-.6 1.8l-.6.8a4 4 0 0 0-.55 1.007" }]
  ];

  // node_modules/lucide/dist/esm/icons/flask-conical.mjs
  var FlaskConical = [
    [
      "path",
      {
        d: "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"
      }
    ],
    ["path", { d: "M6.453 15h11.094" }],
    ["path", { d: "M8.5 2h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/flask-round.mjs
  var FlaskRound = [
    ["path", { d: "M10 2v6.292a7 7 0 1 0 4 0V2" }],
    ["path", { d: "M5 15h14" }],
    ["path", { d: "M8.5 2h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/flower.mjs
  var Flower = [
    ["circle", { cx: "12", cy: "12", r: "3" }],
    [
      "path",
      {
        d: "M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"
      }
    ],
    ["path", { d: "M12 7.5V9" }],
    ["path", { d: "M7.5 12H9" }],
    ["path", { d: "M16.5 12H15" }],
    ["path", { d: "M12 16.5V15" }],
    ["path", { d: "m8 8 1.88 1.88" }],
    ["path", { d: "M14.12 9.88 16 8" }],
    ["path", { d: "m8 16 1.88-1.88" }],
    ["path", { d: "M14.12 14.12 16 16" }]
  ];

  // node_modules/lucide/dist/esm/icons/flower-2.mjs
  var Flower2 = [
    [
      "path",
      {
        d: "M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1"
      }
    ],
    ["circle", { cx: "12", cy: "8", r: "2" }],
    ["path", { d: "M12 10v12" }],
    ["path", { d: "M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z" }],
    ["path", { d: "M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/focus.mjs
  var Focus = [
    ["circle", { cx: "12", cy: "12", r: "3" }],
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/fold-horizontal.mjs
  var FoldHorizontal = [
    ["path", { d: "M2 12h6" }],
    ["path", { d: "M22 12h-6" }],
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M12 8v2" }],
    ["path", { d: "M12 14v2" }],
    ["path", { d: "M12 20v2" }],
    ["path", { d: "m19 9-3 3 3 3" }],
    ["path", { d: "m5 15 3-3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/fold-vertical.mjs
  var FoldVertical = [
    ["path", { d: "M12 22v-6" }],
    ["path", { d: "M12 8V2" }],
    ["path", { d: "M4 12H2" }],
    ["path", { d: "M10 12H8" }],
    ["path", { d: "M16 12h-2" }],
    ["path", { d: "M22 12h-2" }],
    ["path", { d: "m15 19-3-3-3 3" }],
    ["path", { d: "m15 5-3 3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-bookmark.mjs
  var FolderBookmark = [
    [
      "path",
      {
        d: "M12 6v7.751a.25.25 0 00.407.195l2.28-1.834a.5.5 0 01.627 0l2.28 1.834a.25.25 0 00.406-.195V6"
      }
    ],
    [
      "path",
      {
        d: "M20 20a2 2 0 002-2V8a2 2 0 00-2-2h-7.9a2 2 0 01-1.69-.9L9.6 3.9A2 2 0 007.93 3H4a2 2 0 00-2 2v13a2 2 0 002 2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/folder-archive.mjs
  var FolderArchive = [
    ["circle", { cx: "15", cy: "19", r: "2" }],
    [
      "path",
      {
        d: "M20.9 19.8A2 2 0 0 0 22 18V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h5.1"
      }
    ],
    ["path", { d: "M15 11v-1" }],
    ["path", { d: "M15 17v-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-check.mjs
  var FolderCheck = [
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ],
    ["path", { d: "m9 13 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-clock.mjs
  var FolderClock = [
    ["path", { d: "M16 14v2.2l1.6 1" }],
    [
      "path",
      {
        d: "M7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2"
      }
    ],
    ["circle", { cx: "16", cy: "16", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-closed.mjs
  var FolderClosed = [
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ],
    ["path", { d: "M2 10h20" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-code.mjs
  var FolderCode = [
    ["path", { d: "M10 10.5 8 13l2 2.5" }],
    ["path", { d: "m14 10.5 2 2.5-2 2.5" }],
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/folder-cog.mjs
  var FolderCog = [
    [
      "path",
      {
        d: "M10.3 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.98a2 2 0 0 1 1.69.9l.66 1.2A2 2 0 0 0 12 6h8a2 2 0 0 1 2 2v3.3"
      }
    ],
    ["path", { d: "m14.305 19.53.923-.382" }],
    ["path", { d: "m15.228 16.852-.923-.383" }],
    ["path", { d: "m16.852 15.228-.383-.923" }],
    ["path", { d: "m16.852 20.772-.383.924" }],
    ["path", { d: "m19.148 15.228.383-.923" }],
    ["path", { d: "m19.53 21.696-.382-.924" }],
    ["path", { d: "m20.772 16.852.924-.383" }],
    ["path", { d: "m20.772 19.148.924.383" }],
    ["circle", { cx: "18", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-dot.mjs
  var FolderDot = [
    [
      "path",
      {
        d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"
      }
    ],
    ["circle", { cx: "12", cy: "13", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-down.mjs
  var FolderDown = [
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ],
    ["path", { d: "M12 10v6" }],
    ["path", { d: "m15 13-3 3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-git-2.mjs
  var FolderGit2 = [
    ["path", { d: "M18 19a5 5 0 0 1-5-5v8" }],
    [
      "path",
      {
        d: "M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5"
      }
    ],
    ["circle", { cx: "13", cy: "12", r: "2" }],
    ["circle", { cx: "20", cy: "19", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-git.mjs
  var FolderGit = [
    ["circle", { cx: "12", cy: "13", r: "2" }],
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ],
    ["path", { d: "M14 13h3" }],
    ["path", { d: "M7 13h3" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-heart.mjs
  var FolderHeart = [
    [
      "path",
      {
        d: "M10.638 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v3.417"
      }
    ],
    [
      "path",
      {
        d: "M14.62 18.8A2.25 2.25 0 1 1 18 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/folder-input.mjs
  var FolderInput = [
    [
      "path",
      {
        d: "M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"
      }
    ],
    ["path", { d: "M2 13h10" }],
    ["path", { d: "m9 16 3-3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-kanban.mjs
  var FolderKanban = [
    [
      "path",
      {
        d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"
      }
    ],
    ["path", { d: "M8 10v4" }],
    ["path", { d: "M12 10v2" }],
    ["path", { d: "M16 10v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-key.mjs
  var FolderKey = [
    [
      "path",
      {
        d: "M13 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v1.36"
      }
    ],
    ["path", { d: "M19 12v6" }],
    ["path", { d: "M19 14h2" }],
    ["circle", { cx: "19", cy: "20", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-lock.mjs
  var FolderLock = [
    ["rect", { width: "8", height: "5", x: "14", y: "17", rx: "1" }],
    [
      "path",
      {
        d: "M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2.5"
      }
    ],
    ["path", { d: "M20 17v-2a2 2 0 1 0-4 0v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-minus.mjs
  var FolderMinus = [
    ["path", { d: "M9 13h6" }],
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/folder-open-dot.mjs
  var FolderOpenDot = [
    [
      "path",
      {
        d: "m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"
      }
    ],
    ["circle", { cx: "14", cy: "15", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-output.mjs
  var FolderOutput = [
    [
      "path",
      {
        d: "M2 7.5V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-1.5"
      }
    ],
    ["path", { d: "M2 13h10" }],
    ["path", { d: "m5 10-3 3 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-open.mjs
  var FolderOpen = [
    [
      "path",
      {
        d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/folder-pen.mjs
  var FolderPen = [
    [
      "path",
      {
        d: "M2 11.5V5a2 2 0 0 1 2-2h3.9c.7 0 1.3.3 1.7.9l.8 1.2c.4.6 1 .9 1.7.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9.5"
      }
    ],
    [
      "path",
      {
        d: "M11.378 13.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/folder-plus.mjs
  var FolderPlus = [
    ["path", { d: "M12 10v6" }],
    ["path", { d: "M9 13h6" }],
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/folder-root.mjs
  var FolderRoot = [
    [
      "path",
      {
        d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"
      }
    ],
    ["circle", { cx: "12", cy: "13", r: "2" }],
    ["path", { d: "M12 15v5" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-search-2.mjs
  var FolderSearch2 = [
    ["circle", { cx: "11.5", cy: "12.5", r: "2.5" }],
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ],
    ["path", { d: "M13.3 14.3 15 16" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-search.mjs
  var FolderSearch = [
    [
      "path",
      {
        d: "M10.7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4.1"
      }
    ],
    ["path", { d: "m21 21-1.9-1.9" }],
    ["circle", { cx: "17", cy: "17", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-symlink.mjs
  var FolderSymlink = [
    [
      "path",
      {
        d: "M2 9.35V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7"
      }
    ],
    ["path", { d: "m8 16 3-3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-sync.mjs
  var FolderSync = [
    [
      "path",
      {
        d: "M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v.5"
      }
    ],
    ["path", { d: "M12 10v4h4" }],
    ["path", { d: "m12 14 1.535-1.605a5 5 0 0 1 8 1.5" }],
    ["path", { d: "M22 22v-4h-4" }],
    ["path", { d: "m22 18-1.535 1.605a5 5 0 0 1-8-1.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-tree.mjs
  var FolderTree = [
    [
      "path",
      {
        d: "M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"
      }
    ],
    [
      "path",
      {
        d: "M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"
      }
    ],
    ["path", { d: "M3 5a2 2 0 0 0 2 2h3" }],
    ["path", { d: "M3 3v13a2 2 0 0 0 2 2h3" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-user.mjs
  var FolderUser = [
    [
      "path",
      {
        d: "M10.254 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2V9.255"
      }
    ],
    ["path", { d: "M22 22a4 4 0 0 0-8 0" }],
    ["circle", { cx: "18", cy: "15", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-up.mjs
  var FolderUp = [
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ],
    ["path", { d: "M12 10v6" }],
    ["path", { d: "m9 13 3-3 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder-users.mjs
  var FolderUsers = [
    [
      "path",
      {
        d: "M5.254 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2V9.255"
      }
    ],
    ["circle", { cx: "13", cy: "15", r: "3" }],
    ["path", { d: "M17 22a4 4 0 0 0-8 0" }],
    ["path", { d: "M22 22A4 4 0 0 0 20.24 18.686 1 1 0 0 1 20.1 17.143 3 3 0 0 0 19.5 12.402" }]
  ];

  // node_modules/lucide/dist/esm/icons/folder.mjs
  var Folder = [
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/folder-x.mjs
  var FolderX = [
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ],
    ["path", { d: "m9.5 10.5 5 5" }],
    ["path", { d: "m14.5 10.5-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/folders.mjs
  var Folders = [
    [
      "path",
      {
        d: "M20 5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2.5a1.5 1.5 0 0 1 1.2.6l.6.8a1.5 1.5 0 0 0 1.2.6z"
      }
    ],
    ["path", { d: "M3 8.268a2 2 0 0 0-1 1.738V19a2 2 0 0 0 2 2h11a2 2 0 0 0 1.732-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/footprints.mjs
  var Footprints = [
    [
      "path",
      {
        d: "M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"
      }
    ],
    [
      "path",
      {
        d: "M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"
      }
    ],
    ["path", { d: "M16 17h4" }],
    ["path", { d: "M4 13h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/forklift.mjs
  var Forklift = [
    ["path", { d: "M12 12H5a2 2 0 0 0-2 2v5" }],
    ["path", { d: "M15 19h7" }],
    ["path", { d: "M16 19V2" }],
    [
      "path",
      { d: "M6 12V7a2 2 0 0 1 2-2h2.172a2 2 0 0 1 1.414.586l3.828 3.828A2 2 0 0 1 16 10.828" }
    ],
    ["path", { d: "M7 19h4" }],
    ["circle", { cx: "13", cy: "19", r: "2" }],
    ["circle", { cx: "5", cy: "19", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/form.mjs
  var Form = [
    ["path", { d: "M4 14h6" }],
    ["path", { d: "M4 2h10" }],
    ["rect", { x: "4", y: "18", width: "16", height: "4", rx: "1" }],
    ["rect", { x: "4", y: "6", width: "16", height: "4", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/frame.mjs
  var Frame = [
    ["line", { x1: "22", x2: "2", y1: "6", y2: "6" }],
    ["line", { x1: "22", x2: "2", y1: "18", y2: "18" }],
    ["line", { x1: "6", x2: "6", y1: "2", y2: "22" }],
    ["line", { x1: "18", x2: "18", y1: "2", y2: "22" }]
  ];

  // node_modules/lucide/dist/esm/icons/forward.mjs
  var Forward = [
    ["path", { d: "m15 17 5-5-5-5" }],
    ["path", { d: "M4 18v-2a4 4 0 0 1 4-4h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/fuel.mjs
  var Fuel = [
    ["path", { d: "M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5" }],
    ["path", { d: "M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16" }],
    ["path", { d: "M2 21h13" }],
    ["path", { d: "M3 9h11" }]
  ];

  // node_modules/lucide/dist/esm/icons/fullscreen.mjs
  var Fullscreen = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    ["rect", { width: "10", height: "8", x: "7", y: "8", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/funnel-plus.mjs
  var FunnelPlus = [
    [
      "path",
      {
        d: "M13.354 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14v6a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341l1.218-1.348"
      }
    ],
    ["path", { d: "M16 6h6" }],
    ["path", { d: "M19 3v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/funnel-x.mjs
  var FunnelX = [
    [
      "path",
      {
        d: "M12.531 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14v6a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341l.427-.473"
      }
    ],
    ["path", { d: "m16.5 3.5 5 5" }],
    ["path", { d: "m21.5 3.5-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/funnel.mjs
  var Funnel = [
    [
      "path",
      {
        d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/galaxy.mjs
  var Galaxy = [
    [
      "path",
      {
        d: "M16.005 15.108a5.041 6.52 28.25 00-8.008-6.217 5.041 6.52 28.25 008.008 6.217A11.884 7.288-60.76 014.029 7.001"
      }
    ],
    ["path", { d: "M17 21h.01" }],
    ["path", { d: "M7 3h.01" }],
    ["path", { d: "M7.997 8.891a11.885 7.288-60.756 0111.977 8.107" }],
    ["circle", { cx: "12", cy: "12", r: "1", fill: "currentColor" }]
  ];

  // node_modules/lucide/dist/esm/icons/gallery-horizontal-end.mjs
  var GalleryHorizontalEnd = [
    ["path", { d: "M2 7v10" }],
    ["path", { d: "M6 5v14" }],
    ["rect", { width: "12", height: "18", x: "10", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/gallery-horizontal.mjs
  var GalleryHorizontal = [
    ["path", { d: "M2 3v18" }],
    ["rect", { width: "12", height: "18", x: "6", y: "3", rx: "2" }],
    ["path", { d: "M22 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/gallery-thumbnails.mjs
  var GalleryThumbnails = [
    ["rect", { width: "18", height: "14", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M4 21h1" }],
    ["path", { d: "M9 21h1" }],
    ["path", { d: "M14 21h1" }],
    ["path", { d: "M19 21h1" }]
  ];

  // node_modules/lucide/dist/esm/icons/gallery-vertical-end.mjs
  var GalleryVerticalEnd = [
    ["path", { d: "M7 2h10" }],
    ["path", { d: "M5 6h14" }],
    ["rect", { width: "18", height: "12", x: "3", y: "10", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/gallery-vertical.mjs
  var GalleryVertical = [
    ["path", { d: "M3 2h18" }],
    ["rect", { width: "18", height: "12", x: "3", y: "6", rx: "2" }],
    ["path", { d: "M3 22h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/gamepad-2.mjs
  var Gamepad2 = [
    ["line", { x1: "6", x2: "10", y1: "11", y2: "11" }],
    ["line", { x1: "8", x2: "8", y1: "9", y2: "13" }],
    ["line", { x1: "15", x2: "15.01", y1: "12", y2: "12" }],
    ["line", { x1: "18", x2: "18.01", y1: "10", y2: "10" }],
    [
      "path",
      {
        d: "M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/gamepad-directional.mjs
  var GamepadDirectional = [
    [
      "path",
      {
        d: "M11.146 15.854a1.207 1.207 0 0 1 1.708 0l1.56 1.56A2 2 0 0 1 15 18.828V21a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2.172a2 2 0 0 1 .586-1.414z"
      }
    ],
    [
      "path",
      {
        d: "M18.828 15a2 2 0 0 1-1.414-.586l-1.56-1.56a1.207 1.207 0 0 1 0-1.708l1.56-1.56A2 2 0 0 1 18.828 9H21a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1z"
      }
    ],
    [
      "path",
      {
        d: "M6.586 14.414A2 2 0 0 1 5.172 15H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2.172a2 2 0 0 1 1.414.586l1.56 1.56a1.207 1.207 0 0 1 0 1.708z"
      }
    ],
    [
      "path",
      {
        d: "M9 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.172a2 2 0 0 1-.586 1.414l-1.56 1.56a1.207 1.207 0 0 1-1.708 0l-1.56-1.56A2 2 0 0 1 9 5.172z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/gamepad.mjs
  var Gamepad = [
    ["line", { x1: "6", x2: "10", y1: "12", y2: "12" }],
    ["line", { x1: "8", x2: "8", y1: "10", y2: "14" }],
    ["line", { x1: "15", x2: "15.01", y1: "13", y2: "13" }],
    ["line", { x1: "18", x2: "18.01", y1: "11", y2: "11" }],
    ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/gap-vertical.mjs
  var GapVertical = [
    ["path", { d: "M2 12h2" }],
    ["path", { d: "M8 12h2" }],
    ["path", { d: "M14 12h2" }],
    ["path", { d: "M20 12h2" }],
    ["path", { d: "M3 21v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" }],
    ["path", { d: "M3 3v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3" }]
  ];

  // node_modules/lucide/dist/esm/icons/gap-horizontal.mjs
  var GapHorizontal = [
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M12 8v2" }],
    ["path", { d: "M12 14v2" }],
    ["path", { d: "M12 20v2" }],
    ["path", { d: "M21 3h-3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" }],
    ["path", { d: "M3 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3" }]
  ];

  // node_modules/lucide/dist/esm/icons/gauge.mjs
  var Gauge = [
    ["path", { d: "m12 14 4-4" }],
    ["path", { d: "M3.34 19a10 10 0 1 1 17.32 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/gavel.mjs
  var Gavel = [
    ["path", { d: "m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381" }],
    ["path", { d: "m16 16 6-6" }],
    ["path", { d: "m21.5 10.5-8-8" }],
    ["path", { d: "m8 8 6-6" }],
    ["path", { d: "m8.5 7.5 8 8" }]
  ];

  // node_modules/lucide/dist/esm/icons/gem.mjs
  var Gem = [
    ["path", { d: "M10.5 3 8 9l4 13 4-13-2.5-6" }],
    [
      "path",
      {
        d: "M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"
      }
    ],
    ["path", { d: "M2 9h20" }]
  ];

  // node_modules/lucide/dist/esm/icons/georgian-lari.mjs
  var GeorgianLari = [
    ["path", { d: "M10 10V3" }],
    ["path", { d: "M14 10V3" }],
    ["path", { d: "M19 13a7 7 0 10-7 7" }],
    ["path", { d: "M5 20h14" }]
  ];

  // node_modules/lucide/dist/esm/icons/germ-off.mjs
  var GermOff = [
    ["path", { d: "m11 2 .925 1.848" }],
    ["path", { d: "M13 15h.01" }],
    ["path", { d: "M13.424 7.768a2 2 0 112.808 2.808" }],
    ["path", { d: "m16 21-1-2.472" }],
    ["path", { d: "M16.988 16.988A12 12 0 019 20a5 5 0 01-2.759-9.171 8.8 8.8 0 002.307-2.28" }],
    ["path", { d: "m19 2-1 1.804" }],
    ["path", { d: "m2 19 2.746-1.373" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "m22 16-2.474-2.13a12 12 0 001.376-3.786 6 6 0 00-10.313-5.151" }],
    ["path", { d: "m22 5-1.804 1" }],
    ["path", { d: "m3 10 2 2" }],
    ["path", { d: "M9 16h.01" }],
    ["path", { d: "M9 20v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/germ.mjs
  var Germ = [
    ["path", { d: "m11 2 .925 1.848" }],
    ["path", { d: "M13 15h.01" }],
    ["path", { d: "m16 21-1-2.472" }],
    ["path", { d: "m19 2-1 1.804" }],
    ["path", { d: "m2 19 2.746-1.373" }],
    ["path", { d: "m22 16-2.474-2.13" }],
    ["path", { d: "m22 5-1.804 1" }],
    ["path", { d: "m3 10 2 2" }],
    ["path", { d: "M9 16h.01" }],
    ["path", { d: "M9 20v2" }],
    [
      "path",
      {
        d: "M9.33 7.035c-.51 1.478-1.786 2.93-3.09 3.794A5 5 0 009 20a12.1 12.1 0 0011.902-9.916A6 6 0 009.33 7.035"
      }
    ],
    ["circle", { cx: "15", cy: "9", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/ghost.mjs
  var Ghost = [
    ["path", { d: "M15 10v1" }],
    [
      "path",
      {
        d: "M7.528 20.472a1.6 1.6 0 012.277 0l1.057 1.056a1.6 1.6 0 002.276 0l1.057-1.056a1.6 1.6 0 012.277 0l1.114 1.114a1.4 1.4 0 002.414-1V10a8 8 0 00-16 0v10.586a1.4 1.4 0 002.414 1z"
      }
    ],
    ["path", { d: "M9 10v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/gift.mjs
  var Gift = [
    ["path", { d: "M12 7v14" }],
    ["path", { d: "M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" }],
    ["path", { d: "M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" }],
    ["rect", { x: "3", y: "7", width: "18", height: "4", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-branch-minus.mjs
  var GitBranchMinus = [
    ["path", { d: "M15 6a9 9 0 0 0-9 9V3" }],
    ["path", { d: "M21 18h-6" }],
    ["circle", { cx: "18", cy: "6", r: "3" }],
    ["circle", { cx: "6", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-branch.mjs
  var GitBranch = [
    ["path", { d: "M15 6a9 9 0 0 0-9 9V3" }],
    ["circle", { cx: "18", cy: "6", r: "3" }],
    ["circle", { cx: "6", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-branch-plus.mjs
  var GitBranchPlus = [
    ["path", { d: "M6 3v12" }],
    ["path", { d: "M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" }],
    ["path", { d: "M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" }],
    ["path", { d: "M15 6a9 9 0 0 0-9 9" }],
    ["path", { d: "M18 15v6" }],
    ["path", { d: "M21 18h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-commit-horizontal.mjs
  var GitCommitHorizontal = [
    ["circle", { cx: "12", cy: "12", r: "3" }],
    ["line", { x1: "3", x2: "9", y1: "12", y2: "12" }],
    ["line", { x1: "15", x2: "21", y1: "12", y2: "12" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-commit-vertical.mjs
  var GitCommitVertical = [
    ["path", { d: "M12 3v6" }],
    ["circle", { cx: "12", cy: "12", r: "3" }],
    ["path", { d: "M12 15v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-compare-arrows.mjs
  var GitCompareArrows = [
    ["circle", { cx: "5", cy: "6", r: "3" }],
    ["path", { d: "M12 6h5a2 2 0 0 1 2 2v7" }],
    ["path", { d: "m15 9-3-3 3-3" }],
    ["circle", { cx: "19", cy: "18", r: "3" }],
    ["path", { d: "M12 18H7a2 2 0 0 1-2-2V9" }],
    ["path", { d: "m9 15 3 3-3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-compare.mjs
  var GitCompare = [
    ["circle", { cx: "18", cy: "18", r: "3" }],
    ["circle", { cx: "6", cy: "6", r: "3" }],
    ["path", { d: "M13 6h3a2 2 0 0 1 2 2v7" }],
    ["path", { d: "M11 18H8a2 2 0 0 1-2-2V9" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-fork.mjs
  var GitFork = [
    ["circle", { cx: "12", cy: "18", r: "3" }],
    ["circle", { cx: "6", cy: "6", r: "3" }],
    ["circle", { cx: "18", cy: "6", r: "3" }],
    ["path", { d: "M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" }],
    ["path", { d: "M12 12v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-graph.mjs
  var GitGraph = [
    ["circle", { cx: "5", cy: "6", r: "3" }],
    ["path", { d: "M5 9v6" }],
    ["circle", { cx: "5", cy: "18", r: "3" }],
    ["path", { d: "M12 3v18" }],
    ["circle", { cx: "19", cy: "6", r: "3" }],
    ["path", { d: "M16 15.7A9 9 0 0 0 19 9" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-merge-conflict.mjs
  var GitMergeConflict = [
    ["path", { d: "M12 6h4a2 2 0 0 1 2 2v7" }],
    ["path", { d: "M6 12v9" }],
    ["path", { d: "m8.5 3.5-5 5" }],
    ["path", { d: "m8.5 8.5-5-5" }],
    ["circle", { cx: "18", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-merge.mjs
  var GitMerge = [
    ["circle", { cx: "18", cy: "18", r: "3" }],
    ["circle", { cx: "6", cy: "6", r: "3" }],
    ["path", { d: "M6 21V9a9 9 0 0 0 9 9" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-pull-request-arrow.mjs
  var GitPullRequestArrow = [
    ["circle", { cx: "5", cy: "6", r: "3" }],
    ["path", { d: "M5 9v12" }],
    ["circle", { cx: "19", cy: "18", r: "3" }],
    ["path", { d: "m15 9-3-3 3-3" }],
    ["path", { d: "M12 6h5a2 2 0 0 1 2 2v7" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-pull-request-closed.mjs
  var GitPullRequestClosed = [
    ["path", { d: "m15.5 3.5 5 5" }],
    ["path", { d: "m15.5 8.5 5-5" }],
    ["path", { d: "M18 11.62V15" }],
    ["path", { d: "M6 9v12" }],
    ["circle", { cx: "18", cy: "18", r: "3" }],
    ["circle", { cx: "6", cy: "6", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-pull-request-create-arrow.mjs
  var GitPullRequestCreateArrow = [
    ["circle", { cx: "5", cy: "6", r: "3" }],
    ["path", { d: "M5 9v12" }],
    ["path", { d: "m15 9-3-3 3-3" }],
    ["path", { d: "M12 6h5a2 2 0 0 1 2 2v3" }],
    ["path", { d: "M19 15v6" }],
    ["path", { d: "M22 18h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-pull-request-create.mjs
  var GitPullRequestCreate = [
    ["circle", { cx: "6", cy: "6", r: "3" }],
    ["path", { d: "M6 9v12" }],
    ["path", { d: "M13 6h3a2 2 0 0 1 2 2v3" }],
    ["path", { d: "M18 15v6" }],
    ["path", { d: "M21 18h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-pull-request-draft.mjs
  var GitPullRequestDraft = [
    ["circle", { cx: "18", cy: "18", r: "3" }],
    ["circle", { cx: "6", cy: "6", r: "3" }],
    ["path", { d: "M18 6V5" }],
    ["path", { d: "M18 11v-1" }],
    ["line", { x1: "6", x2: "6", y1: "9", y2: "21" }]
  ];

  // node_modules/lucide/dist/esm/icons/git-pull-request.mjs
  var GitPullRequest = [
    ["circle", { cx: "18", cy: "18", r: "3" }],
    ["circle", { cx: "6", cy: "6", r: "3" }],
    ["path", { d: "M13 6h3a2 2 0 0 1 2 2v7" }],
    ["line", { x1: "6", x2: "6", y1: "9", y2: "21" }]
  ];

  // node_modules/lucide/dist/esm/icons/glasses.mjs
  var Glasses = [
    ["circle", { cx: "6", cy: "15", r: "4" }],
    ["circle", { cx: "18", cy: "15", r: "4" }],
    ["path", { d: "M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2" }],
    ["path", { d: "M2.5 13 5 7c.7-1.3 1.4-2 3-2" }],
    ["path", { d: "M21.5 13 19 7c-.7-1.3-1.5-2-3-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/glass-water.mjs
  var GlassWater = [
    [
      "path",
      {
        d: "M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z"
      }
    ],
    ["path", { d: "M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/globe-ban.mjs
  var GlobeBan = [
    ["path", { d: "M12 22a14.48 14.48 0 01-4.008-10C7.993 9.136 9 5.258 11 2.05A10 10 0 0012 22" }],
    ["path", { d: "m15.172 3.172 5.656 5.656" }],
    ["path", { d: "M15.86 14a14.5 14.5 0 01-3.859 8 10 10 0 009.949-9" }],
    ["path", { d: "M2 12h10.5" }],
    ["circle", { cx: "18", cy: "6", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/globe-check.mjs
  var GlobeCheck = [
    ["path", { d: "m15 6 2 2 4-4" }],
    ["path", { d: "M2 12h20A10 10 0 1 1 12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 4-10" }]
  ];

  // node_modules/lucide/dist/esm/icons/globe-code.mjs
  var GlobeCode = [
    ["path", { d: "M15.5 10 13 7.5 15.5 5" }],
    ["path", { d: "M15.861 14A14.5 14.5 0 0112 22a14.48 14.48 0 010-20 10 10 0 109.888 11.5" }],
    ["path", { d: "M19.5 5 22 7.5 19.5 10" }],
    ["path", { d: "M2 12h8.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/globe-lock.mjs
  var GlobeLock = [
    ["path", { d: "M15.686 15A14.5 14.5 0 0 1 12 22a14.5 14.5 0 0 1 0-20 10 10 0 1 0 9.542 13" }],
    ["path", { d: "M2 12h8.5" }],
    ["path", { d: "M20 6V4a2 2 0 1 0-4 0v2" }],
    ["rect", { width: "8", height: "5", x: "14", y: "6", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/globe-off.mjs
  var GlobeOff = [
    ["path", { d: "M10.114 4.462A14.5 14.5 0 0 1 12 2a10 10 0 0 1 9.313 13.643" }],
    ["path", { d: "M15.557 15.556A14.5 14.5 0 0 1 12 22 10 10 0 0 1 4.929 4.929" }],
    ["path", { d: "M15.892 10.234A14.5 14.5 0 0 0 12 2a10 10 0 0 0-3.643.687" }],
    ["path", { d: "M17.656 12H22" }],
    ["path", { d: "M19.071 19.071A10 10 0 0 1 12 22 14.5 14.5 0 0 1 8.44 8.45" }],
    ["path", { d: "M2 12h10" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/globe-plus.mjs
  var GlobePlus = [
    ["path", { d: "M15.929 10.563A14.5 14.5 0 0112 22a1 1 0 010-20 15 15 0 01.68.768" }],
    ["path", { d: "M19 2v6" }],
    ["path", { d: "M21.92 10.734A10 10 0 0112 22a14.5 14.5 0 010-20 10 10 0 011.266.08" }],
    ["path", { d: "M22 12H2" }],
    ["path", { d: "M22 5h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/globe-x.mjs
  var GlobeX = [
    ["path", { d: "m16 3 5 5" }],
    ["path", { d: "M2 12h20A10 10 0 1 1 12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 4-10" }],
    ["path", { d: "m21 3-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/globe.mjs
  var Globe = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }],
    ["path", { d: "M2 12h20" }]
  ];

  // node_modules/lucide/dist/esm/icons/goal.mjs
  var Goal = [
    ["path", { d: "M12 13V2l8 4-8 4" }],
    ["path", { d: "M20.561 10.222a9 9 0 1 1-12.55-5.29" }],
    ["path", { d: "M8.002 9.997a5 5 0 1 0 8.9 2.02" }]
  ];

  // node_modules/lucide/dist/esm/icons/gpu.mjs
  var Gpu = [
    ["path", { d: "M2 17h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H2" }],
    ["path", { d: "M2 21V3" }],
    ["path", { d: "M7 17v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3" }],
    ["circle", { cx: "16", cy: "11", r: "2" }],
    ["circle", { cx: "8", cy: "11", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/graduation-cap.mjs
  var GraduationCap = [
    [
      "path",
      {
        d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"
      }
    ],
    ["path", { d: "M22 10v6" }],
    ["path", { d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/grape.mjs
  var Grape = [
    ["path", { d: "M22 5V2l-5.89 5.89" }],
    ["circle", { cx: "16.6", cy: "15.89", r: "3" }],
    ["circle", { cx: "8.11", cy: "7.4", r: "3" }],
    ["circle", { cx: "12.35", cy: "11.65", r: "3" }],
    ["circle", { cx: "13.91", cy: "5.85", r: "3" }],
    ["circle", { cx: "18.15", cy: "10.09", r: "3" }],
    ["circle", { cx: "6.56", cy: "13.2", r: "3" }],
    ["circle", { cx: "10.8", cy: "17.44", r: "3" }],
    ["circle", { cx: "5", cy: "19", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/graph-hub.mjs
  var GraphHub = [
    ["circle", { cx: "12", cy: "7", r: "4" }],
    ["circle", { cx: "4", cy: "19", r: "2" }],
    ["circle", { cx: "12", cy: "19", r: "2" }],
    ["circle", { cx: "20", cy: "19", r: "2" }],
    ["path", { d: "M8 7a4 4 0 0 0-4 4v6" }],
    ["path", { d: "M12 11v6" }],
    ["path", { d: "M16 7a4 4 0 0 1 4 4v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/graph-star.mjs
  var GraphStar = [
    ["path", { d: "m12.342 9.316 1.764-3.527" }],
    ["path", { d: "m12.59 14.545 2.35 3.759" }],
    ["path", { d: "m13.982 12.332 4.03.447" }],
    ["path", { d: "M5.414 17.586 8.88 14.12" }],
    ["path", { d: "M9.025 9.742 5.317 5.505" }],
    ["circle", { cx: "11", cy: "12", r: "3" }],
    ["circle", { cx: "15", cy: "4", r: "2" }],
    ["circle", { cx: "16", cy: "20", r: "2" }],
    ["circle", { cx: "20", cy: "13", r: "2" }],
    ["circle", { cx: "4", cy: "19", r: "2" }],
    ["circle", { cx: "4", cy: "4", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/grid-2x2-check.mjs
  var Grid2x2Check = [
    [
      "path",
      {
        d: "M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3"
      }
    ],
    ["path", { d: "m16 19 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/grid-2x2-plus.mjs
  var Grid2x2Plus = [
    [
      "path",
      {
        d: "M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3"
      }
    ],
    ["path", { d: "M16 19h6" }],
    ["path", { d: "M19 22v-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/grid-2x2-x.mjs
  var Grid2x2X = [
    [
      "path",
      {
        d: "M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3"
      }
    ],
    ["path", { d: "m16.5 16.5 5 5" }],
    ["path", { d: "m16.5 21.5 5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/grid-2x2.mjs
  var Grid2x2 = [
    ["path", { d: "M12 3v18" }],
    ["path", { d: "M3 12h18" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/grid-3x2.mjs
  var Grid3x2 = [
    ["path", { d: "M15 3v18" }],
    ["path", { d: "M3 12h18" }],
    ["path", { d: "M9 3v18" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/grid-3x3.mjs
  var Grid3x3 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M3 15h18" }],
    ["path", { d: "M9 3v18" }],
    ["path", { d: "M15 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/grip-horizontal.mjs
  var GripHorizontal = [
    ["circle", { cx: "12", cy: "9", r: "1" }],
    ["circle", { cx: "19", cy: "9", r: "1" }],
    ["circle", { cx: "5", cy: "9", r: "1" }],
    ["circle", { cx: "12", cy: "15", r: "1" }],
    ["circle", { cx: "19", cy: "15", r: "1" }],
    ["circle", { cx: "5", cy: "15", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/grip-vertical.mjs
  var GripVertical = [
    ["circle", { cx: "9", cy: "12", r: "1" }],
    ["circle", { cx: "9", cy: "5", r: "1" }],
    ["circle", { cx: "9", cy: "19", r: "1" }],
    ["circle", { cx: "15", cy: "12", r: "1" }],
    ["circle", { cx: "15", cy: "5", r: "1" }],
    ["circle", { cx: "15", cy: "19", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/grip.mjs
  var Grip = [
    ["circle", { cx: "12", cy: "5", r: "1" }],
    ["circle", { cx: "19", cy: "5", r: "1" }],
    ["circle", { cx: "5", cy: "5", r: "1" }],
    ["circle", { cx: "12", cy: "12", r: "1" }],
    ["circle", { cx: "19", cy: "12", r: "1" }],
    ["circle", { cx: "5", cy: "12", r: "1" }],
    ["circle", { cx: "12", cy: "19", r: "1" }],
    ["circle", { cx: "19", cy: "19", r: "1" }],
    ["circle", { cx: "5", cy: "19", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/groceries.mjs
  var Groceries = [
    ["path", { d: "M10 15h4" }],
    [
      "path",
      {
        d: "M19.424 11.095a2.5 2.5 0 00.471-2.309 2 2 0 00.424-3.286 2 2 0 00-2.143-3.322 2 2 0 00-.676.502 2 2 0 00-3.287.424 2.5 2.5 0 00-3.189 2.06A3 3 0 0012 11l4-4"
      }
    ],
    ["path", { d: "M4 12.006A1 1 0 014.994 11H19a1 1 0 011 1v7a2 2 0 01-2 2H6a2 2 0 01-2-2z" }],
    ["path", { d: "M7 11a4 4 0 01-4-4V5a1 1 0 011-1h2a4 4 0 013.584 2.222" }]
  ];

  // node_modules/lucide/dist/esm/icons/group.mjs
  var Group = [
    ["path", { d: "M3 7V5c0-1.1.9-2 2-2h2" }],
    ["path", { d: "M17 3h2c1.1 0 2 .9 2 2v2" }],
    ["path", { d: "M21 17v2c0 1.1-.9 2-2 2h-2" }],
    ["path", { d: "M7 21H5c-1.1 0-2-.9-2-2v-2" }],
    ["rect", { width: "7", height: "5", x: "7", y: "7", rx: "1" }],
    ["rect", { width: "7", height: "5", x: "10", y: "12", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/guitar-electric.mjs
  var GuitarElectric = [
    ["path", { d: "m12.172 11.828 4.242-4.242" }],
    [
      "path",
      {
        d: "M16.414 7.586A2 2 0 0017 6.172V5a2 2 0 011.177-1.823L20.59 2.09a1 1 0 011.32 1.32l-1.088 2.412A2 2 0 0119 7h-1a2 2 0 00-1.586.586"
      }
    ],
    ["path", { d: "m6 16 2 2" }],
    [
      "path",
      {
        d: "M8.23 9.85a3 3 0 011.28-1.454 1 1 0 011.496.815 4 4 0 003.783 3.783 1 1 0 01.815 1.496 3 3 0 01-1.454 1.28l-.92.38A2 2 0 0012 18a4 4 0 01-4 4 6 6 0 01-6-6 4 4 0 014-4 2 2 0 001.85-1.23z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/guitar.mjs
  var Guitar = [
    ["path", { d: "m11.9 12.1 4.514-4.514" }],
    [
      "path",
      {
        d: "M20.1 2.3a1 1 0 0 0-1.4 0l-1.114 1.114A2 2 0 0 0 17 4.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 17.828 7h1.344a2 2 0 0 0 1.414-.586L21.7 5.3a1 1 0 0 0 0-1.4z"
      }
    ],
    ["path", { d: "m6 16 2 2" }],
    [
      "path",
      {
        d: "M8.23 9.85A3 3 0 0 1 11 8a5 5 0 0 1 5 5 3 3 0 0 1-1.85 2.77l-.92.38A2 2 0 0 0 12 18a4 4 0 0 1-4 4 6 6 0 0 1-6-6 4 4 0 0 1 4-4 2 2 0 0 0 1.85-1.23z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/half-note.mjs
  var HalfNote = [
    ["circle", { cx: "12", cy: "18", r: "4" }],
    ["path", { d: "M16 18V2" }]
  ];

  // node_modules/lucide/dist/esm/icons/ham.mjs
  var Ham = [
    ["path", { d: "M13.144 21.144A7.274 10.445 45 1 0 2.856 10.856" }],
    [
      "path",
      { d: "M13.144 21.144A7.274 4.365 45 0 0 2.856 10.856a7.274 4.365 45 0 0 10.288 10.288" }
    ],
    [
      "path",
      {
        d: "M16.565 10.435 18.6 8.4a2.501 2.501 0 1 0 1.65-4.65 2.5 2.5 0 1 0-4.66 1.66l-2.024 2.025"
      }
    ],
    ["path", { d: "m8.5 16.5-1-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/hamburger.mjs
  var Hamburger = [
    ["path", { d: "M12 16H4a2 2 0 1 1 0-4h16a2 2 0 1 1 0 4h-4.25" }],
    ["path", { d: "M5 12a2 2 0 0 1-2-2 9 7 0 0 1 18 0 2 2 0 0 1-2 2" }],
    ["path", { d: "M5 16a2 2 0 0 0-2 2 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 2 2 0 0 0-2-2q0 0 0 0" }],
    ["path", { d: "m6.67 12 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2" }]
  ];

  // node_modules/lucide/dist/esm/icons/hammer.mjs
  var Hammer = [
    ["path", { d: "m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" }],
    ["path", { d: "m18 15 4-4" }],
    [
      "path",
      {
        d: "m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/hand-coins.mjs
  var HandCoins = [
    ["path", { d: "M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" }],
    [
      "path",
      {
        d: "m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"
      }
    ],
    ["path", { d: "m2 16 6 6" }],
    ["circle", { cx: "16", cy: "9", r: "2.9" }],
    ["circle", { cx: "6", cy: "5", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/hand-fist.mjs
  var HandFist = [
    [
      "path",
      {
        d: "M12.035 17.012a3 3 0 0 0-3-3l-.311-.002a.72.72 0 0 1-.505-1.229l1.195-1.195A2 2 0 0 1 10.828 11H12a2 2 0 0 0 0-4H9.243a3 3 0 0 0-2.122.879l-2.707 2.707A4.83 4.83 0 0 0 3 14a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v2a2 2 0 1 0 4 0"
      }
    ],
    ["path", { d: "M13.888 9.662A2 2 0 0 0 17 8V5A2 2 0 1 0 13 5" }],
    ["path", { d: "M9 5A2 2 0 1 0 5 5V10" }],
    ["path", { d: "M9 7V4A2 2 0 1 1 13 4V7.268" }]
  ];

  // node_modules/lucide/dist/esm/icons/hand-grab.mjs
  var HandGrab = [
    ["path", { d: "M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" }],
    ["path", { d: "M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" }],
    ["path", { d: "M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5" }],
    ["path", { d: "M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2" }],
    ["path", { d: "M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/hand-heart.mjs
  var HandHeart = [
    ["path", { d: "M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" }],
    [
      "path",
      {
        d: "m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95"
      }
    ],
    ["path", { d: "m2 15 6 6" }],
    [
      "path",
      { d: "m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/hand-helping.mjs
  var HandHelping = [
    ["path", { d: "M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14" }],
    [
      "path",
      {
        d: "m7 18 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"
      }
    ],
    ["path", { d: "m2 13 6 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/hand-metal.mjs
  var HandMetal = [
    ["path", { d: "M18 12.5V10a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" }],
    ["path", { d: "M14 11V9a2 2 0 1 0-4 0v2" }],
    ["path", { d: "M10 10.5V5a2 2 0 1 0-4 0v9" }],
    [
      "path",
      {
        d: "m7 15-1.76-1.76a2 2 0 0 0-2.83 2.82l3.6 3.6C7.5 21.14 9.2 22 12 22h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v5"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/hand-platter.mjs
  var HandPlatter = [
    ["path", { d: "M12 3V2" }],
    [
      "path",
      {
        d: "m15.4 17.4 3.2-2.8a2 2 0 1 1 2.8 2.9l-3.6 3.3c-.7.8-1.7 1.2-2.8 1.2h-4c-1.1 0-2.1-.4-2.8-1.2l-1.302-1.464A1 1 0 0 0 6.151 19H5"
      }
    ],
    ["path", { d: "M2 14h12a2 2 0 0 1 0 4h-2" }],
    ["path", { d: "M4 10h16" }],
    ["path", { d: "M5 10a7 7 0 0 1 14 0" }],
    ["path", { d: "M5 14v6a1 1 0 0 1-1 1H2" }]
  ];

  // node_modules/lucide/dist/esm/icons/hand.mjs
  var Hand = [
    ["path", { d: "M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" }],
    ["path", { d: "M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" }],
    ["path", { d: "M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" }],
    [
      "path",
      {
        d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/handbag.mjs
  var Handbag = [
    [
      "path",
      {
        d: "M2.048 18.566A2 2 0 0 0 4 21h16a2 2 0 0 0 1.952-2.434l-2-9A2 2 0 0 0 18 8H6a2 2 0 0 0-1.952 1.566z"
      }
    ],
    ["path", { d: "M8 11V6a4 4 0 0 1 8 0v5" }]
  ];

  // node_modules/lucide/dist/esm/icons/handle-bottom-right.mjs
  var HandleBottomRight = [
    ["path", { d: "M21 8 8 21" }],
    ["path", { d: "m21 15-6 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/handshake.mjs
  var Handshake = [
    ["path", { d: "m11 17 2 2a1 1 0 1 0 3-3" }],
    [
      "path",
      {
        d: "m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"
      }
    ],
    ["path", { d: "m21 3 1 11h-2" }],
    ["path", { d: "M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" }],
    ["path", { d: "M3 4h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/hard-drive-download.mjs
  var HardDriveDownload = [
    ["path", { d: "M12 2v8" }],
    ["path", { d: "m16 6-4 4-4-4" }],
    ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2" }],
    ["path", { d: "M6 18h.01" }],
    ["path", { d: "M10 18h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/hard-drive-upload.mjs
  var HardDriveUpload = [
    ["path", { d: "m16 6-4-4-4 4" }],
    ["path", { d: "M12 2v8" }],
    ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2" }],
    ["path", { d: "M6 18h.01" }],
    ["path", { d: "M10 18h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/hard-drive.mjs
  var HardDrive = [
    ["path", { d: "M10 16h.01" }],
    [
      "path",
      {
        d: "M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
      }
    ],
    ["path", { d: "M21.946 12.013H2.054" }],
    ["path", { d: "M6 16h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/hard-hat.mjs
  var HardHat = [
    ["path", { d: "M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" }],
    ["path", { d: "M14 6a6 6 0 0 1 6 6v3" }],
    ["path", { d: "M4 15v-3a6 6 0 0 1 6-6" }],
    ["rect", { x: "2", y: "15", width: "20", height: "4", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/hash.mjs
  var Hash = [
    ["line", { x1: "4", x2: "20", y1: "9", y2: "9" }],
    ["line", { x1: "4", x2: "20", y1: "15", y2: "15" }],
    ["line", { x1: "10", x2: "8", y1: "3", y2: "21" }],
    ["line", { x1: "16", x2: "14", y1: "3", y2: "21" }]
  ];

  // node_modules/lucide/dist/esm/icons/hat-glasses.mjs
  var HatGlasses = [
    ["path", { d: "M14 18a2 2 0 0 0-4 0" }],
    [
      "path",
      {
        d: "m19 11-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11"
      }
    ],
    ["path", { d: "M2 11h20" }],
    ["circle", { cx: "17", cy: "18", r: "3" }],
    ["circle", { cx: "7", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/haze.mjs
  var Haze = [
    ["path", { d: "m5.2 6.2 1.4 1.4" }],
    ["path", { d: "M2 13h2" }],
    ["path", { d: "M20 13h2" }],
    ["path", { d: "m17.4 7.6 1.4-1.4" }],
    ["path", { d: "M22 17H2" }],
    ["path", { d: "M22 21H2" }],
    ["path", { d: "M16 13a4 4 0 0 0-8 0" }],
    ["path", { d: "M12 5V2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/hd.mjs
  var Hd = [
    ["path", { d: "M10 12H6" }],
    ["path", { d: "M10 15V9" }],
    [
      "path",
      {
        d: "M14 14.5a.5.5 0 0 0 .5.5h1a2.5 2.5 0 0 0 2.5-2.5v-1A2.5 2.5 0 0 0 15.5 9h-1a.5.5 0 0 0-.5.5z"
      }
    ],
    ["path", { d: "M6 15V9" }],
    ["rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/hdmi-port.mjs
  var HdmiPort = [
    [
      "path",
      {
        d: "M22 9a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h.5a2 2 0 011.6.8l.3.4A2 2 0 007 16h10a2 2 0 001.6-.8l.3-.4a2 2 0 011.6-.8h.5a1 1 0 001-1z"
      }
    ],
    ["path", { d: "M8 12h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/heading-1.mjs
  var Heading1 = [
    ["path", { d: "M4 12h8" }],
    ["path", { d: "M4 18V6" }],
    ["path", { d: "M12 18V6" }],
    ["path", { d: "m17 12 3-2v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/heading-2.mjs
  var Heading2 = [
    ["path", { d: "M4 12h8" }],
    ["path", { d: "M4 18V6" }],
    ["path", { d: "M12 18V6" }],
    ["path", { d: "M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/heading-3.mjs
  var Heading3 = [
    ["path", { d: "M4 12h8" }],
    ["path", { d: "M4 18V6" }],
    ["path", { d: "M12 18V6" }],
    ["path", { d: "M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" }],
    ["path", { d: "M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/heading-4.mjs
  var Heading4 = [
    ["path", { d: "M12 18V6" }],
    ["path", { d: "M17 10v3a1 1 0 0 0 1 1h3" }],
    ["path", { d: "M21 10v8" }],
    ["path", { d: "M4 12h8" }],
    ["path", { d: "M4 18V6" }]
  ];

  // node_modules/lucide/dist/esm/icons/heading-5.mjs
  var Heading5 = [
    ["path", { d: "M4 12h8" }],
    ["path", { d: "M4 18V6" }],
    ["path", { d: "M12 18V6" }],
    ["path", { d: "M17 13v-3h4" }],
    ["path", { d: "M17 17.7c.4.2.8.3 1.3.3 1.5 0 2.7-1.1 2.7-2.5S19.8 13 18.3 13H17" }]
  ];

  // node_modules/lucide/dist/esm/icons/headphone-off.mjs
  var HeadphoneOff = [
    ["path", { d: "M21 14h-1.343" }],
    ["path", { d: "M9.128 3.47A9 9 0 0 1 21 12v3.343" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M20.414 20.414A2 2 0 0 1 19 21h-1a2 2 0 0 1-2-2v-3" }],
    ["path", { d: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 2.636-6.364" }]
  ];

  // node_modules/lucide/dist/esm/icons/heading-6.mjs
  var Heading6 = [
    ["path", { d: "M4 12h8" }],
    ["path", { d: "M4 18V6" }],
    ["path", { d: "M12 18V6" }],
    ["circle", { cx: "19", cy: "16", r: "2" }],
    ["path", { d: "M20 10c-2 2-3 3.5-3 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/headphones.mjs
  var Headphones = [
    [
      "path",
      {
        d: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/headset.mjs
  var Headset = [
    [
      "path",
      {
        d: "M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"
      }
    ],
    ["path", { d: "M21 16v2a4 4 0 0 1-4 4h-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/heart-crack.mjs
  var HeartCrack = [
    [
      "path",
      {
        d: "M12.409 5.824c-.702.792-1.15 1.496-1.415 2.166l2.153 2.156a.5.5 0 0 1 0 .707l-2.293 2.293a.5.5 0 0 0 0 .707L12 15"
      }
    ],
    [
      "path",
      {
        d: "M13.508 20.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.677.6.6 0 0 0 .818.001A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/heart-handshake.mjs
  var HeartHandshake = [
    [
      "path",
      {
        d: "M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/heart-minus.mjs
  var HeartMinus = [
    [
      "path",
      {
        d: "m14.876 18.99-1.368 1.323a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5a5.2 5.2 0 0 1-.244 1.572"
      }
    ],
    ["path", { d: "M15 15h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/heart-off.mjs
  var HeartOff = [
    [
      "path",
      {
        d: "M10.5 4.893a5.5 5.5 0 0 1 1.091.931.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 1.872-1.002 3.356-2.187 4.655"
      }
    ],
    [
      "path",
      {
        d: "m16.967 16.967-3.459 3.346a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 2.747-4.761"
      }
    ],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/heart-plus.mjs
  var HeartPlus = [
    [
      "path",
      {
        d: "m14.479 19.374-.971.939a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5a5.2 5.2 0 0 1-.219 1.49"
      }
    ],
    ["path", { d: "M15 15h6" }],
    ["path", { d: "M18 12v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/heart-pulse.mjs
  var HeartPulse = [
    [
      "path",
      {
        d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
      }
    ],
    ["path", { d: "M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" }]
  ];

  // node_modules/lucide/dist/esm/icons/heart-x.mjs
  var HeartX = [
    ["path", { d: "m15.5 12.5 5 5" }],
    ["path", { d: "m20.5 12.5-5 5" }],
    [
      "path",
      {
        d: "M21.955 8.774a5.5 5.5 0 0 0-9.546-2.95.6.6 0 0 1-.818 0A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.508 5.332a2 2 0 0 0 2.57.352"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/heart.mjs
  var Heart = [
    [
      "path",
      {
        d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/heater.mjs
  var Heater = [
    ["path", { d: "M11 8c2-3-2-3 0-6" }],
    ["path", { d: "M15.5 8c2-3-2-3 0-6" }],
    ["path", { d: "M6 10h.01" }],
    ["path", { d: "M6 14h.01" }],
    ["path", { d: "M10 16v-4" }],
    ["path", { d: "M14 16v-4" }],
    ["path", { d: "M18 16v-4" }],
    ["path", { d: "M20 6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3" }],
    ["path", { d: "M5 20v2" }],
    ["path", { d: "M19 20v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/helicopter.mjs
  var Helicopter = [
    ["path", { d: "M11 17v4" }],
    ["path", { d: "M14 3v8a2 2 0 0 0 2 2h5.865" }],
    ["path", { d: "M17 17v4" }],
    ["path", { d: "M18 17a4 4 0 0 0 4-4 8 6 0 0 0-8-6 6 5 0 0 0-6 5v3a2 2 0 0 0 2 2z" }],
    ["path", { d: "M2 10v5" }],
    ["path", { d: "M6 3h16" }],
    ["path", { d: "M7 21h14" }],
    ["path", { d: "M8 13H2" }]
  ];

  // node_modules/lucide/dist/esm/icons/hexagon.mjs
  var Hexagon = [
    [
      "path",
      {
        d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/highlighter.mjs
  var Highlighter = [
    ["path", { d: "m9 11-6 6v3h9l3-3" }],
    ["path", { d: "m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/hiking-stick.mjs
  var HikingStick = [
    ["path", { d: "M13.5 10.5 2 22" }],
    [
      "path",
      {
        d: "M16.352 11.648a1.205 1.205 0 01-1.704 0l-2.296-2.296a1.205 1.205 0 010-1.704l.72-.72a2 2 0 011.022-.546l.599-.12a2 2 0 001.569-1.57l.12-.598a2 2 0 01.546-1.022l.72-.72a1.205 1.205 0 011.704 0l2.296 2.296a1.205 1.205 0 010 1.704l-6.02 6.02a1 1 0 103 3l.201-.201A7.4 7.4 0 0021 9.93V7"
      }
    ],
    ["path", { d: "m6 21-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/hockey-stick.mjs
  var HockeyStick = [
    ["path", { d: "M11 4v4c0 1.1-2.025 2-4.5 2S2 9.1 2 8V4" }],
    [
      "path",
      {
        d: "M18.21 3.106a2 2 0 013.579 1.789l-6.895 13.789A6 6 0 019.529 22H4.5a1 1 0 010-5h5.528a2 2 0 001.788-1.105z"
      }
    ],
    ["path", { d: "m18.59 11.295-3.578-1.789" }],
    ["path", { d: "m20.79 6.895-3.578-1.789" }],
    ["path", { d: "M7 17v5" }],
    ["ellipse", { cx: "6.5", cy: "4", rx: "4.5", ry: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/hop-off.mjs
  var HopOff = [
    ["path", { d: "M10.82 16.12c1.69.6 3.91.79 5.18.85.28.01.53-.09.7-.27" }],
    [
      "path",
      { d: "M11.14 20.57c.52.24 2.44 1.12 4.08 1.37.46.06.86-.25.9-.71.12-1.52-.3-3.43-.5-4.28" }
    ],
    ["path", { d: "M16.13 21.05c1.65.63 3.68.84 4.87.91a.9.9 0 0 0 .7-.26" }],
    [
      "path",
      { d: "M17.99 5.52a20.83 20.83 0 0 1 3.15 4.5.8.8 0 0 1-.68 1.13c-1.17.1-2.5.02-3.9-.25" }
    ],
    ["path", { d: "M20.57 11.14c.24.52 1.12 2.44 1.37 4.08.04.3-.08.59-.31.75" }],
    [
      "path",
      {
        d: "M4.93 4.93a10 10 0 0 0-.67 13.4c.35.43.96.4 1.17-.12.69-1.71 1.07-5.07 1.07-6.71 1.34.45 3.1.9 4.88.62a.85.85 0 0 0 .48-.24"
      }
    ],
    [
      "path",
      { d: "M5.52 17.99c1.05.95 2.91 2.42 4.5 3.15a.8.8 0 0 0 1.13-.68c.2-2.34-.33-5.3-1.57-8.28" }
    ],
    ["path", { d: "M8.35 2.68a10 10 0 0 1 9.98 1.58c.43.35.4.96-.12 1.17-1.5.6-4.3.98-6.07 1.05" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/hop.mjs
  var Hop = [
    [
      "path",
      { d: "M10.82 16.12c1.69.6 3.91.79 5.18.85.55.03 1-.42.97-.97-.06-1.27-.26-3.5-.85-5.18" }
    ],
    [
      "path",
      {
        d: "M11.5 6.5c1.64 0 5-.38 6.71-1.07.52-.2.55-.82.12-1.17A10 10 0 0 0 4.26 18.33c.35.43.96.4 1.17-.12.69-1.71 1.07-5.07 1.07-6.71 1.34.45 3.1.9 4.88.62a.88.88 0 0 0 .73-.74c.3-2.14-.15-3.5-.61-4.88"
      }
    ],
    [
      "path",
      { d: "M15.62 16.95c.2.85.62 2.76.5 4.28a.77.77 0 0 1-.9.7 16.64 16.64 0 0 1-4.08-1.36" }
    ],
    [
      "path",
      { d: "M16.13 21.05c1.65.63 3.68.84 4.87.91a.9.9 0 0 0 .96-.96 17.68 17.68 0 0 0-.9-4.87" }
    ],
    [
      "path",
      { d: "M16.94 15.62c.86.2 2.77.62 4.29.5a.77.77 0 0 0 .7-.9 16.64 16.64 0 0 0-1.36-4.08" }
    ],
    [
      "path",
      { d: "M17.99 5.52a20.82 20.82 0 0 1 3.15 4.5.8.8 0 0 1-.68 1.13c-2.33.2-5.3-.32-8.27-1.57" }
    ],
    ["path", { d: "M4.93 4.93 3 3a.7.7 0 0 1 0-1" }],
    [
      "path",
      {
        d: "M9.58 12.18c1.24 2.98 1.77 5.95 1.57 8.28a.8.8 0 0 1-1.13.68 20.82 20.82 0 0 1-4.5-3.15"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/hospital.mjs
  var Hospital = [
    ["path", { d: "M12 7v4" }],
    ["path", { d: "M14 21v-3a2 2 0 0 0-4 0v3" }],
    ["path", { d: "M14 9h-4" }],
    ["path", { d: "M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16" }]
  ];

  // node_modules/lucide/dist/esm/icons/hot-air-balloon.mjs
  var HotAirBalloon = [
    ["path", { d: "M11.5 18C10 15 9 12 9 9a3 7 0 0 1 6 0c0 3-1 6-2.5 9" }],
    ["path", { d: "M15 18c3-3 5-5 5-9A8 7 0 0 0 4 9c0 4 2 6 5 9" }],
    ["path", { d: "M15 18H9v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1z" }]
  ];

  // node_modules/lucide/dist/esm/icons/hotel.mjs
  var Hotel = [
    ["path", { d: "M10 22v-6.57" }],
    ["path", { d: "M12 11h.01" }],
    ["path", { d: "M12 7h.01" }],
    ["path", { d: "M14 15.43V22" }],
    ["path", { d: "M15 16a5 5 0 0 0-6 0" }],
    ["path", { d: "M16 11h.01" }],
    ["path", { d: "M16 7h.01" }],
    ["path", { d: "M8 11h.01" }],
    ["path", { d: "M8 7h.01" }],
    ["rect", { x: "4", y: "2", width: "16", height: "20", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/hourglass-cog.mjs
  var HourglassCog = [
    ["path", { d: "m14.305 19.53.923-.382" }],
    ["path", { d: "m15.228 16.852-.923-.383" }],
    ["path", { d: "m16.852 15.228-.383-.923" }],
    ["path", { d: "m16.852 20.772-.383.924" }],
    ["path", { d: "M17 2v4.172a2 2 0 0 1-.586 1.414l-8.828 8.828A2 2 0 0 0 7 17.828V22" }],
    ["path", { d: "m19.148 15.228.383-.923" }],
    ["path", { d: "m19.53 21.696-.382-.924" }],
    ["path", { d: "m20.772 16.852.924-.383" }],
    ["path", { d: "m20.772 19.148.924.383" }],
    ["path", { d: "M5 22h6.159" }],
    ["path", { d: "M5 2h14" }],
    ["path", { d: "M7 2v4.172a2 2 0 0 0 .586 1.414l5.188 5.188" }],
    ["circle", { cx: "18", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/hourglass.mjs
  var Hourglass = [
    ["path", { d: "M5 22h14" }],
    ["path", { d: "M5 2h14" }],
    ["path", { d: "M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" }],
    ["path", { d: "M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" }]
  ];

  // node_modules/lucide/dist/esm/icons/house-cog.mjs
  var HouseCog = [
    [
      "path",
      {
        d: "M10.584 21H5a2 2 0 01-2-2v-9a2 2 0 01.709-1.527l7-6a2 2 0 012.582 0l7 6A2 2 0 0121 10.001v.583"
      }
    ],
    ["path", { d: "M14 12H10a1 1 0 00-1 1v8" }],
    ["path", { d: "m14.305 19.53.923-.382" }],
    ["path", { d: "m15.229 16.852-.924-.383" }],
    ["path", { d: "m16.852 15.228-.383-.923" }],
    ["path", { d: "m16.852 20.773-.383.924" }],
    ["path", { d: "m19.148 15.228.383-.923" }],
    ["path", { d: "m19.53 21.697-.382-.924" }],
    ["path", { d: "m20.773 16.852.922-.383" }],
    ["path", { d: "m20.773 19.148.922.383" }],
    ["circle", { cx: "18", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/house-heart.mjs
  var HouseHeart = [
    [
      "path",
      {
        d: "M8.62 13.8A2.25 2.25 0 1 1 12 10.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z"
      }
    ],
    [
      "path",
      {
        d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/house-plug.mjs
  var HousePlug = [
    ["path", { d: "M10 12V8.964" }],
    ["path", { d: "M14 12V8.964" }],
    ["path", { d: "M15 12a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1z" }],
    [
      "path",
      {
        d: "M8.5 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/house-plus.mjs
  var HousePlus = [
    [
      "path",
      {
        d: "M12.35 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v2.35"
      }
    ],
    ["path", { d: "M14.8 12.4A1 1 0 0 0 14 12h-4a1 1 0 0 0-1 1v8" }],
    ["path", { d: "M15 18h6" }],
    ["path", { d: "M18 15v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/house-wifi.mjs
  var HouseWifi = [
    ["path", { d: "M9.5 13.866a4 4 0 0 1 5 .01" }],
    ["path", { d: "M12 17h.01" }],
    [
      "path",
      {
        d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      }
    ],
    ["path", { d: "M7 10.754a8 8 0 0 1 10 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/house.mjs
  var House = [
    ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }],
    [
      "path",
      {
        d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/houses.mjs
  var Houses = [
    [
      "path",
      {
        d: "m12.681 4.24.834-.715a1.45 1.45 0 011.88 0l5.09 4.364A1.45 1.45 0 0121 9v6.546a1.45 1.45 0 01-1 1.381"
      }
    ],
    [
      "path",
      {
        d: "M15.485 11.889A1.45 1.45 0 0116 13v6.546A1.454 1.454 0 0114.546 21H4.364a1.454 1.454 0 01-1.454-1.454V13a1.45 1.45 0 01.515-1.111l5.09-4.364a1.45 1.45 0 011.88 0z"
      }
    ],
    ["path", { d: "M7.41 20.546v-4a1 1 0 011-1h2a1 1 0 011 1v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/ice-cream-bowl.mjs
  var IceCreamBowl = [
    [
      "path",
      { d: "M12 17c5 0 8-2.69 8-6H4c0 3.31 3 6 8 6m-4 4h8m-4-3v3M5.14 11a3.5 3.5 0 1 1 6.71 0" }
    ],
    ["path", { d: "M12.14 11a3.5 3.5 0 1 1 6.71 0" }],
    ["path", { d: "M15.5 6.5a3.5 3.5 0 1 0-7 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/ice-cream-cone.mjs
  var IceCreamCone = [
    ["path", { d: "m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11" }],
    ["path", { d: "M17 7A5 5 0 0 0 7 7" }],
    ["path", { d: "M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/id-card-lanyard.mjs
  var IdCardLanyard = [
    ["path", { d: "M13.5 8h-3" }],
    ["path", { d: "m15 2-1 2h3a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h3" }],
    ["path", { d: "M16 22a4 4 0 00-8 0" }],
    ["path", { d: "m9 2 3 6" }],
    ["circle", { cx: "12", cy: "15", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/id-card.mjs
  var IdCard = [
    ["path", { d: "M13 19a4 4 0 00-8 0" }],
    ["path", { d: "M16 10h2" }],
    ["path", { d: "M16 14h2" }],
    ["circle", { cx: "9", cy: "12", r: "3" }],
    ["rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/image-down.mjs
  var ImageDown = [
    [
      "path",
      {
        d: "M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"
      }
    ],
    ["path", { d: "m14 19 3 3v-5.5" }],
    ["path", { d: "m17 22 3-3" }],
    ["circle", { cx: "9", cy: "9", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/image-minus.mjs
  var ImageMinus = [
    ["path", { d: "M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" }],
    ["line", { x1: "16", x2: "22", y1: "5", y2: "5" }],
    ["circle", { cx: "9", cy: "9", r: "2" }],
    ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }]
  ];

  // node_modules/lucide/dist/esm/icons/image-off.mjs
  var ImageOff = [
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }],
    ["path", { d: "M10.41 10.41a2 2 0 1 1-2.83-2.83" }],
    ["line", { x1: "13.5", x2: "6", y1: "13.5", y2: "21" }],
    ["line", { x1: "18", x2: "21", y1: "12", y2: "15" }],
    ["path", { d: "M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59" }],
    ["path", { d: "M21 15V5a2 2 0 0 0-2-2H9" }]
  ];

  // node_modules/lucide/dist/esm/icons/image-play.mjs
  var ImagePlay = [
    [
      "path",
      {
        d: "M15 15.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997a1 1 0 0 1-1.517-.86z"
      }
    ],
    ["path", { d: "M21 12.17V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" }],
    ["path", { d: "m6 21 5-5" }],
    ["circle", { cx: "9", cy: "9", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/image-up.mjs
  var ImageUp = [
    [
      "path",
      {
        d: "M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"
      }
    ],
    ["path", { d: "m14 19.5 3-3 3 3" }],
    ["path", { d: "M17 22v-5.5" }],
    ["circle", { cx: "9", cy: "9", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/image-plus.mjs
  var ImagePlus = [
    ["path", { d: "M16 5h6" }],
    ["path", { d: "M19 2v6" }],
    ["path", { d: "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" }],
    ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }],
    ["circle", { cx: "9", cy: "9", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/image-upscale.mjs
  var ImageUpscale = [
    ["path", { d: "M16 3h5v5" }],
    ["path", { d: "M17 21h2a2 2 0 0 0 2-2" }],
    ["path", { d: "M21 12v3" }],
    ["path", { d: "m21 3-5 5" }],
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2" }],
    ["path", { d: "m5 21 4.144-4.144a1.21 1.21 0 0 1 1.712 0L13 19" }],
    ["path", { d: "M9 3h3" }],
    ["rect", { x: "3", y: "11", width: "10", height: "10", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/image.mjs
  var Image = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ["circle", { cx: "9", cy: "9", r: "2" }],
    ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }]
  ];

  // node_modules/lucide/dist/esm/icons/images.mjs
  var Images = [
    ["path", { d: "m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16" }],
    ["path", { d: "M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2" }],
    ["circle", { cx: "13", cy: "7", r: "1", fill: "currentColor" }],
    ["rect", { x: "8", y: "2", width: "14", height: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/import.mjs
  var Import = [
    ["path", { d: "M12 3v12" }],
    ["path", { d: "m8 11 4 4 4-4" }],
    ["path", { d: "M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/inbox.mjs
  var Inbox = [
    ["polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }],
    [
      "path",
      {
        d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/indian-rupee.mjs
  var IndianRupee = [
    ["path", { d: "m14 20-8-8h4c5.333 0 5.333-8 0-8" }],
    ["path", { d: "M6 4h12" }],
    ["path", { d: "M6 8h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/infinity.mjs
  var Infinity = [
    ["path", { d: "M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8" }]
  ];

  // node_modules/lucide/dist/esm/icons/info.mjs
  var Info = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 16v-4" }],
    ["path", { d: "M12 8h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/inspection-panel.mjs
  var InspectionPanel = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M7 7h.01" }],
    ["path", { d: "M17 7h.01" }],
    ["path", { d: "M7 17h.01" }],
    ["path", { d: "M17 17h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/italic.mjs
  var Italic = [
    ["line", { x1: "19", x2: "10", y1: "4", y2: "4" }],
    ["line", { x1: "14", x2: "5", y1: "20", y2: "20" }],
    ["line", { x1: "15", x2: "9", y1: "4", y2: "20" }]
  ];

  // node_modules/lucide/dist/esm/icons/iteration-ccw.mjs
  var IterationCcw = [
    ["path", { d: "m16 14 4 4-4 4" }],
    ["path", { d: "M20 10a8 8 0 1 0-8 8h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/iteration-cw.mjs
  var IterationCw = [
    ["path", { d: "M4 10a8 8 0 1 1 8 8H4" }],
    ["path", { d: "m8 22-4-4 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/iv-bag.mjs
  var IvBag = [
    ["path", { d: "M12 18v2a2 2 0 002 2h6" }],
    ["path", { d: "M6 11c.72.5 1.44 1 3 1 3 0 3-2 6-2 1.56 0 2.28.5 3 1" }],
    [
      "path",
      {
        d: "M9.293 3c.453 0 .887-.18 1.207-.5s.754-.5 1.207-.5h.586c.453 0 .887.18 1.207.5s.754.5 1.207.5H16a2 2 0 012 2v11a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/japanese-yen.mjs
  var JapaneseYen = [
    ["path", { d: "M12 12v8" }],
    ["path", { d: "m6 4 6 8 6-8" }],
    ["path", { d: "M8 13h8" }],
    ["path", { d: "M8 17h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/joystick.mjs
  var Joystick = [
    ["path", { d: "M21 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2Z" }],
    ["path", { d: "M6 15v-2" }],
    ["path", { d: "M12 15V9" }],
    ["circle", { cx: "12", cy: "6", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/kanban.mjs
  var Kanban = [
    ["path", { d: "M5 3v14" }],
    ["path", { d: "M12 3v8" }],
    ["path", { d: "M19 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/kayak.mjs
  var Kayak = [
    ["path", { d: "M18 17a1 1 0 0 0-1 1v1a2 2 0 1 0 2-2z" }],
    [
      "path",
      {
        d: "M20.97 3.61a.45.45 0 0 0-.58-.58C10.2 6.6 6.6 10.2 3.03 20.39a.45.45 0 0 0 .58.58C13.8 17.4 17.4 13.8 20.97 3.61"
      }
    ],
    ["path", { d: "m6.707 6.707 10.586 10.586" }],
    ["path", { d: "M7 5a2 2 0 1 0-2 2h1a1 1 0 0 0 1-1z" }]
  ];

  // node_modules/lucide/dist/esm/icons/kazakh-tenge.mjs
  var KazakhTenge = [
    ["path", { d: "M12 8v12" }],
    ["path", { d: "M6 4h12" }],
    ["path", { d: "M6 8h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/key-round.mjs
  var KeyRound = [
    [
      "path",
      {
        d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
      }
    ],
    ["circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor" }]
  ];

  // node_modules/lucide/dist/esm/icons/key-square.mjs
  var KeySquare = [
    [
      "path",
      {
        d: "M12.4 2.7a2.5 2.5 0 0 1 3.4 0l5.5 5.5a2.5 2.5 0 0 1 0 3.4l-3.7 3.7a2.5 2.5 0 0 1-3.4 0L8.7 9.8a2.5 2.5 0 0 1 0-3.4z"
      }
    ],
    ["path", { d: "m14 7 3 3" }],
    [
      "path",
      {
        d: "m9.4 10.6-6.814 6.814A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/key.mjs
  var Key = [
    ["path", { d: "m2 21 9.6-9.6" }],
    ["path", { d: "m7.5 15.5 2.3 2.3a1 1 0 0 1 0 1.4l-2.1 2.1a1 1 0 0 1-1.4 0L4 19" }],
    ["circle", { cx: "15.5", cy: "7.5", r: "5.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/keyboard-music.mjs
  var KeyboardMusic = [
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
    ["path", { d: "M6 8h4" }],
    ["path", { d: "M14 8h.01" }],
    ["path", { d: "M18 8h.01" }],
    ["path", { d: "M2 12h20" }],
    ["path", { d: "M6 12v4" }],
    ["path", { d: "M10 12v4" }],
    ["path", { d: "M14 12v4" }],
    ["path", { d: "M18 12v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/keyboard-off.mjs
  var KeyboardOff = [
    ["path", { d: "M 20 4 A2 2 0 0 1 22 6" }],
    ["path", { d: "M 22 6 L 22 16.41" }],
    ["path", { d: "M 7 16 L 16 16" }],
    ["path", { d: "M 9.69 4 L 20 4" }],
    ["path", { d: "M14 8h.01" }],
    ["path", { d: "M18 8h.01" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" }],
    ["path", { d: "M6 8h.01" }],
    ["path", { d: "M8 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/keyboard.mjs
  var Keyboard = [
    ["path", { d: "M10 8h.01" }],
    ["path", { d: "M12 12h.01" }],
    ["path", { d: "M14 8h.01" }],
    ["path", { d: "M16 12h.01" }],
    ["path", { d: "M18 8h.01" }],
    ["path", { d: "M6 8h.01" }],
    ["path", { d: "M7 16h10" }],
    ["path", { d: "M8 12h.01" }],
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/lambda.mjs
  var Lambda = [
    ["path", { d: "M11.38 10 5 20" }],
    ["path", { d: "M19 18a2 2 0 01-2 2c-4.87-.003-5.052-16-10-16a2 2 0 00-2 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/lamp-ceiling.mjs
  var LampCeiling = [
    ["path", { d: "M12 2v5" }],
    ["path", { d: "M14.829 15.998a3 3 0 1 1-5.658 0" }],
    [
      "path",
      {
        d: "M20.92 14.606A1 1 0 0 1 20 16H4a1 1 0 0 1-.92-1.394l3-7A1 1 0 0 1 7 7h10a1 1 0 0 1 .92.606z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/lamp-desk.mjs
  var LampDesk = [
    [
      "path",
      {
        d: "M10.293 2.293a1 1 0 0 1 1.414 0l2.5 2.5 5.994 1.227a1 1 0 0 1 .506 1.687l-7 7a1 1 0 0 1-1.687-.506l-1.227-5.994-2.5-2.5a1 1 0 0 1 0-1.414z"
      }
    ],
    ["path", { d: "m14.207 4.793-3.414 3.414" }],
    ["path", { d: "M3 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" }],
    ["path", { d: "m9.086 6.5-4.793 4.793a1 1 0 0 0-.18 1.17L7 18" }]
  ];

  // node_modules/lucide/dist/esm/icons/lamp-floor.mjs
  var LampFloor = [
    ["path", { d: "M12 10v12" }],
    [
      "path",
      {
        d: "M17.929 7.629A1 1 0 0 1 17 9H7a1 1 0 0 1-.928-1.371l2-5A1 1 0 0 1 9 2h6a1 1 0 0 1 .928.629z"
      }
    ],
    ["path", { d: "M9 22h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/lamp-wall-down.mjs
  var LampWallDown = [
    [
      "path",
      {
        d: "M19.929 18.629A1 1 0 0 1 19 20H9a1 1 0 0 1-.928-1.371l2-5A1 1 0 0 1 11 13h6a1 1 0 0 1 .928.629z"
      }
    ],
    ["path", { d: "M6 3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" }],
    ["path", { d: "M8 6h4a2 2 0 0 1 2 2v5" }]
  ];

  // node_modules/lucide/dist/esm/icons/lamp-wall-up.mjs
  var LampWallUp = [
    [
      "path",
      {
        d: "M19.929 9.629A1 1 0 0 1 19 11H9a1 1 0 0 1-.928-1.371l2-5A1 1 0 0 1 11 4h6a1 1 0 0 1 .928.629z"
      }
    ],
    ["path", { d: "M6 15a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" }],
    ["path", { d: "M8 18h4a2 2 0 0 0 2-2v-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/lamp.mjs
  var Lamp = [
    ["path", { d: "M12 12v6" }],
    [
      "path",
      {
        d: "M4.077 10.615A1 1 0 0 0 5 12h14a1 1 0 0 0 .923-1.385l-3.077-7.384A2 2 0 0 0 15 2H9a2 2 0 0 0-1.846 1.23Z"
      }
    ],
    ["path", { d: "M8 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" }]
  ];

  // node_modules/lucide/dist/esm/icons/land-plot.mjs
  var LandPlot = [
    ["path", { d: "m12 8 6-3-6-3v10" }],
    [
      "path",
      {
        d: "m8 11.99-5.5 3.14a1 1 0 0 0 0 1.74l8.5 4.86a2 2 0 0 0 2 0l8.5-4.86a1 1 0 0 0 0-1.74L16 12"
      }
    ],
    ["path", { d: "m6.49 12.85 11.02 6.3" }],
    ["path", { d: "M17.51 12.85 6.5 19.15" }]
  ];

  // node_modules/lucide/dist/esm/icons/landmark.mjs
  var Landmark = [
    ["path", { d: "M10 18v-7" }],
    [
      "path",
      { d: "M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z" }
    ],
    ["path", { d: "M14 18v-7" }],
    ["path", { d: "M18 18v-7" }],
    ["path", { d: "M3 22h18" }],
    ["path", { d: "M6 18v-7" }]
  ];

  // node_modules/lucide/dist/esm/icons/languages.mjs
  var Languages = [
    ["path", { d: "m5 8 6 6" }],
    ["path", { d: "m4 14 6-6 2-3" }],
    ["path", { d: "M2 5h12" }],
    ["path", { d: "M7 2h1" }],
    ["path", { d: "m22 22-5-10-5 10" }],
    ["path", { d: "M14 18h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/laptop-minimal-check.mjs
  var LaptopMinimalCheck = [
    ["path", { d: "M2 20h20" }],
    ["path", { d: "m9 10 2 2 4-4" }],
    ["rect", { x: "3", y: "4", width: "18", height: "12", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/laptop-minimal.mjs
  var LaptopMinimal = [
    ["rect", { width: "18", height: "12", x: "3", y: "4", rx: "2", ry: "2" }],
    ["line", { x1: "2", x2: "22", y1: "20", y2: "20" }]
  ];

  // node_modules/lucide/dist/esm/icons/laptop.mjs
  var Laptop = [
    [
      "path",
      {
        d: "M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "M20.054 15.987H3.946" }]
  ];

  // node_modules/lucide/dist/esm/icons/lasso-select.mjs
  var LassoSelect = [
    ["path", { d: "M7 22a5 5 0 0 1-2-4" }],
    ["path", { d: "M7 16.93c.96.43 1.96.74 2.99.91" }],
    [
      "path",
      { d: "M3.34 14A6.8 6.8 0 0 1 2 10c0-4.42 4.48-8 10-8s10 3.58 10 8a7.19 7.19 0 0 1-.33 2" }
    ],
    ["path", { d: "M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" }],
    [
      "path",
      {
        d: "M14.33 22h-.09a.35.35 0 0 1-.24-.32v-10a.34.34 0 0 1 .33-.34c.08 0 .15.03.21.08l7.34 6a.33.33 0 0 1-.21.59h-4.49l-2.57 3.85a.35.35 0 0 1-.28.14z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/laser.mjs
  var Laser = [
    ["path", { d: "m13 8 .95-.95" }],
    ["path", { d: "M13.95 16.95 13 16" }],
    ["path", { d: "M22 12h-9" }],
    ["path", { d: "M4 12H2" }],
    ["path", { d: "M4.05 16.95 5 16" }],
    ["path", { d: "m5 8-.95-.95" }],
    ["path", { d: "M9 12h.01" }],
    ["path", { d: "M9 19v-2" }],
    ["path", { d: "M9 7V5" }]
  ];

  // node_modules/lucide/dist/esm/icons/lasso.mjs
  var Lasso = [
    ["path", { d: "M3.704 14.467a10 8 0 1 1 3.115 2.375" }],
    ["path", { d: "M7 22a5 5 0 0 1-2-3.994" }],
    ["circle", { cx: "5", cy: "16", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/layer-arrow-down.mjs
  var LayerArrowDown = [
    ["path", { d: "M12 10v10" }],
    ["path", { d: "M22 10a1 1 0 01-.59.92l-5.077 2.308" }],
    [
      "path",
      {
        d: "M22.017 10.005a1 1 0 00-.597-.916l-8.59-3.91a2 2 0 00-1.66.001L2.6 9.08a1 1 0 00-.02 1.831l5.093 2.316"
      }
    ],
    ["path", { d: "m9 17 3 3 3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/layer-arrow-up.mjs
  var LayerArrowUp = [
    ["path", { d: "M12 14V4" }],
    [
      "path",
      {
        d: "M7.674 10.774 2.58 13.09a1 1 0 000 1.822l8.6 3.91a2 2 0 001.65 0l8.58-3.9a1 1 0 00.59-.92 1 1 0 00-.59-.922l-5.078-2.308"
      }
    ],
    ["path", { d: "m9 7 3-3 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/layers-2.mjs
  var Layers2 = [
    [
      "path",
      {
        d: "M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z"
      }
    ],
    [
      "path",
      {
        d: "m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/layers-arrow-down.mjs
  var LayersArrowDown = [
    ["path", { d: "M12 7v15" }],
    ["path", { d: "M2 12a1 1 0 00.58.91l5.093 2.316" }],
    ["path", { d: "M22 12a1 1 0 01-.59.92l-5.077 2.308" }],
    [
      "path",
      {
        d: "M8 10.37 2.6 7.91a1 1 0 010-1.831l8.57-3.9a2 2 0 011.66.001l8.59 3.91a1 1 0 010 1.831l-5.392 2.45"
      }
    ],
    ["path", { d: "m9 19 3 3 3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/layers-arrow-up.mjs
  var LayersArrowUp = [
    ["path", { d: "M12 12V2" }],
    ["path", { d: "M2 17.002a1 1 0 00.58.91l8.6 3.91a2 2 0 001.65 0l8.58-3.9a1 1 0 00.59-.92" }],
    [
      "path",
      {
        d: "M7.674 8.774 2.58 11.09a1 1 0 000 1.822l8.6 3.91a2 2 0 001.65 0l8.58-3.9a1 1 0 00.59-.92 1 1 0 00-.59-.922l-5.078-2.308"
      }
    ],
    ["path", { d: "m9 5 3-3 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/layers-minus.mjs
  var LayersMinus = [
    [
      "path",
      {
        d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 .83.18 2 2 0 0 0 .83-.18l8.58-3.9a1 1 0 0 0 0-1.832z"
      }
    ],
    ["path", { d: "M16 17h6" }],
    ["path", { d: "M2.003 11.995a1 1 0 0 0 .597.915l8.58 3.91a2 2 0 0 0 .83.18" }],
    [
      "path",
      { d: "M2.003 16.995a1 1 0 0 0 .597.915l8.58 3.91a2 2 0 0 0 .83.18 2 2 0 0 0 .83-.18l2.11-.96" }
    ],
    ["path", { d: "M22.018 12.004a1 1 0 0 1-.598.916l-.177.08" }]
  ];

  // node_modules/lucide/dist/esm/icons/layers-plus.mjs
  var LayersPlus = [
    [
      "path",
      {
        d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 .83.18 2 2 0 0 0 .83-.18l8.58-3.9a1 1 0 0 0 0-1.831z"
      }
    ],
    ["path", { d: "M16 17h6" }],
    ["path", { d: "M19 14v6" }],
    ["path", { d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 .825.178" }],
    ["path", { d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l2.116-.962" }]
  ];

  // node_modules/lucide/dist/esm/icons/layers.mjs
  var Layers = [
    [
      "path",
      {
        d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"
      }
    ],
    ["path", { d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" }],
    ["path", { d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" }]
  ];

  // node_modules/lucide/dist/esm/icons/layout-arrow-down.mjs
  var LayoutArrowDown = [
    ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" }],
    ["path", { d: "M18 3v18" }],
    ["path", { d: "m21 18-3 3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/layout-arrow-right.mjs
  var LayoutArrowRight = [
    ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }],
    ["path", { d: "M3 18h18" }],
    ["path", { d: "m18 21 3-3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/layout-dashboard.mjs
  var LayoutDashboard = [
    ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1" }],
    ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/layout-freeform.mjs
  var LayoutFreeform = [
    ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "14", y: "4", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "4", y: "14", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/layout-grid-circles.mjs
  var LayoutGridCircles = [
    ["circle", { cx: "17.5", cy: "17.5", r: "3.5" }],
    ["circle", { cx: "17.5", cy: "6.5", r: "3.5" }],
    ["circle", { cx: "6.5", cy: "17.5", r: "3.5" }],
    ["circle", { cx: "6.5", cy: "6.5", r: "3.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/layout-grid.mjs
  var LayoutGrid = [
    ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/layout-list.mjs
  var LayoutList = [
    ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" }],
    ["path", { d: "M14 4h7" }],
    ["path", { d: "M14 9h7" }],
    ["path", { d: "M14 15h7" }],
    ["path", { d: "M14 20h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/layout-panel-left.mjs
  var LayoutPanelLeft = [
    ["rect", { width: "7", height: "18", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/layout-panel-top.mjs
  var LayoutPanelTop = [
    ["rect", { width: "18", height: "7", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/layout-template.mjs
  var LayoutTemplate = [
    ["rect", { width: "18", height: "7", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "9", height: "7", x: "3", y: "14", rx: "1" }],
    ["rect", { width: "5", height: "7", x: "16", y: "14", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/leaf.mjs
  var Leaf = [
    [
      "path",
      {
        d: "M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20"
      }
    ],
    ["path", { d: "M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13" }]
  ];

  // node_modules/lucide/dist/esm/icons/leafy-green.mjs
  var LeafyGreen = [
    [
      "path",
      {
        d: "M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5 4 4 0 0 0 6.187-2.353 3.5 3.5 0 0 0 3.69-5.116A3.5 3.5 0 0 0 20.95 8 3.5 3.5 0 1 0 16 3.05a3.5 3.5 0 0 0-5.831 1.373 3.5 3.5 0 0 0-5.116 3.69 4 4 0 0 0-2.348 6.155C3.499 15.42 4.409 16.712 4.2 18.1 3.926 19.743 3.014 20.732 2 22"
      }
    ],
    ["path", { d: "M2 22 17 7" }]
  ];

  // node_modules/lucide/dist/esm/icons/lectern.mjs
  var Lectern = [
    [
      "path",
      {
        d: "M15 13h4a2 2 0 001.901-1.38l1.057-4.333A1 1 0 0021 6H3a1 1 0 00-.958 1.287L3.1 11.621A2 2 0 005.001 13h4"
      }
    ],
    ["path", { d: "M15 22V11a1 1 0 00-1-1h-4a1 1 0 00-1 1v11" }],
    ["path", { d: "M18 22H6" }],
    ["path", { d: "M18 6V3a1 1 0 00-1-1h-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/lens-concave.mjs
  var LensConcave = [
    [
      "path",
      {
        d: "M7 2a1 1 0 0 0-.8 1.6 14 14 0 0 1 0 16.8A1 1 0 0 0 7 22h10a1 1 0 0 0 .8-1.6 14 14 0 0 1 0-16.8A1 1 0 0 0 17 2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/lens-convex.mjs
  var LensConvex = [
    [
      "path",
      {
        d: "M13.433 2a1 1 0 0 1 .824.448 18 18 0 0 1 0 19.104 1 1 0 0 1-.824.448h-2.866a1 1 0 0 1-.824-.448 18 18 0 0 1 0-19.104A1 1 0 0 1 10.567 2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/lens.mjs
  var Lens = [
    ["path", { d: "M15.725 7.296h.01" }],
    ["path", { d: "M6 12a6 6 0 016-6" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-a.mjs
  var LetterA = [
    ["path", { d: "M17.117 14H6.883" }],
    ["path", { d: "m4 20 7.55-15.712a.5.5 0 01.9 0L20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-b.mjs
  var LetterB = [
    ["path", { d: "M6 12h9a4 4 0 010 8H7a1 1 0 01-1-1V5a1 1 0 011-1h7a4 4 0 010 8" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-c.mjs
  var LetterC = [["path", { d: "M19 6.708a8 8 0 100 10.584" }]];

  // node_modules/lucide/dist/esm/icons/letter-d.mjs
  var LetterD = [
    ["path", { d: "M11 4a8 8 0 010 16H6.406A.406.406 0 016 19.594V4.406A.406.406 0 016.406 4z" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-e.mjs
  var LetterE = [
    ["path", { d: "M18 4H7a1 1 0 00-1 1v14a1 1 0 001 1h11" }],
    ["path", { d: "M6 12h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-f.mjs
  var LetterF = [
    ["path", { d: "M6 12h8" }],
    ["path", { d: "M6 20V5a1 1 0 011-1h11" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-g.mjs
  var LetterG = [
    ["path", { d: "M19 6.708a8 8 0 10-.526 11.126c.355-.333.526-.811.526-1.299V13a1 1 0 00-1-1h-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-h.mjs
  var LetterH = [
    ["path", { d: "M18 20V4" }],
    ["path", { d: "M6 12H18" }],
    ["path", { d: "M6 20V4" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-i.mjs
  var LetterI = [["path", { d: "M12 20V4" }]];

  // node_modules/lucide/dist/esm/icons/letter-j.mjs
  var LetterJ = [["path", { d: "M17 4v11a5 5 0 01-10 0" }]];

  // node_modules/lucide/dist/esm/icons/letter-k.mjs
  var LetterK = [
    ["path", { d: "M17 4 6 15" }],
    ["path", { d: "M6 20V4" }],
    ["path", { d: "m9 12 8 8" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-l.mjs
  var LetterL = [["path", { d: "M6 4v15a1 1 0 001 1h11" }]];

  // node_modules/lucide/dist/esm/icons/letter-m.mjs
  var LetterM = [
    [
      "path",
      {
        d: "M4 20V4.253a.25.25 0 01.454-.144l6.727 9.467a1 1 0 001.63 0l6.735-9.468a.25.25 0 01.454.145V20"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/letter-n.mjs
  var LetterN = [
    ["path", { d: "M6 20V4.25a.25.25 0 01.455-.143l11.09 15.786a.25.25 0 00.455-.144V4" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-o.mjs
  var LetterO = [["circle", { cx: "12", cy: "12", r: "8" }]];

  // node_modules/lucide/dist/esm/icons/letter-p.mjs
  var LetterP = [["path", { d: "M6 12h8a4 4 0 000-8H7a1 1 0 00-1 1v15" }]];

  // node_modules/lucide/dist/esm/icons/letter-q.mjs
  var LetterQ = [
    ["circle", { cx: "12", cy: "12", r: "8" }],
    ["path", { d: "M20 20L15 15" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-r.mjs
  var LetterR = [
    ["path", { d: "m10 12 8 8" }],
    ["path", { d: "M6 12h8a4 4 0 000-8H7a1 1 0 00-1 1v15" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-s.mjs
  var LetterS = [["path", { d: "M17 4h-7a4 4 0 000 8h4a4 4 0 010 8H6" }]];

  // node_modules/lucide/dist/esm/icons/letter-t.mjs
  var LetterT = [
    ["path", { d: "M12 20V4" }],
    ["path", { d: "M5 4h14" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-spacing.mjs
  var LetterSpacing = [
    ["path", { d: "M15 14H9" }],
    ["path", { d: "M21 3v18" }],
    ["path", { d: "M3 3v18" }],
    ["path", { d: "m8 16 3.453-7.648a.6.6 0 011.094.001L16 16" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-u.mjs
  var LetterU = [["path", { d: "M6 4v10a6 6 0 0012 0V4" }]];

  // node_modules/lucide/dist/esm/icons/letter-v.mjs
  var LetterV = [["path", { d: "m6 4 5.765 15.835a.25.25 0 00.47 0L18 4" }]];

  // node_modules/lucide/dist/esm/icons/letter-w.mjs
  var LetterW = [
    [
      "path",
      {
        d: "m21 4-4.794 15.821a.25.25 0 01-.471.021l-3.503-8.685a.25.25 0 00-.464 0l-3.503 8.685a.25.25 0 01-.47-.021L3 4"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/letter-x.mjs
  var LetterX = [
    ["path", { d: "M18 4 6 20" }],
    ["path", { d: "m6 4 12 16" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-y.mjs
  var LetterY = [
    ["path", { d: "M12 12v8" }],
    ["path", { d: "m6 4 6 8 6-8" }]
  ];

  // node_modules/lucide/dist/esm/icons/letter-z.mjs
  var LetterZ = [
    ["path", { d: "M6 4h11.5a.5.5 0 01.387.817L6.114 19.183a.5.5 0 00.387.817H18" }]
  ];

  // node_modules/lucide/dist/esm/icons/library-big.mjs
  var LibraryBig = [
    ["rect", { width: "8", height: "18", x: "3", y: "3", rx: "1" }],
    ["path", { d: "M7 3v18" }],
    [
      "path",
      {
        d: "M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/letters.mjs
  var Letters = [
    ["path", { d: "M15 8H9" }],
    ["path", { d: "M21 15.354a4 4 0 100 5.292" }],
    ["path", { d: "M3 18h4a2 2 0 010 4H3.5a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5H6a2 2 0 010 4" }],
    ["path", { d: "m8 10 3.453-7.648a.6.6 0 011.094 0L16 10" }]
  ];

  // node_modules/lucide/dist/esm/icons/library.mjs
  var Library = [
    ["path", { d: "m16 6 4 14" }],
    ["path", { d: "M12 6v14" }],
    ["path", { d: "M8 8v12" }],
    ["path", { d: "M4 4v16" }]
  ];

  // node_modules/lucide/dist/esm/icons/life-buoy.mjs
  var LifeBuoy = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m4.93 4.93 4.24 4.24" }],
    ["path", { d: "m14.83 9.17 4.24-4.24" }],
    ["path", { d: "m14.83 14.83 4.24 4.24" }],
    ["path", { d: "m9.17 14.83-4.24 4.24" }],
    ["circle", { cx: "12", cy: "12", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/ligature.mjs
  var Ligature = [
    ["path", { d: "M14 12h2v8" }],
    ["path", { d: "M14 20h4" }],
    ["path", { d: "M6 12h4" }],
    ["path", { d: "M6 20h4" }],
    ["path", { d: "M8 20V8a4 4 0 0 1 7.464-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/lightbulb-off.mjs
  var LightbulbOff = [
    ["path", { d: "M16.8 11.2c.8-.9 1.2-2 1.2-3.2a6 6 0 0 0-9.3-5" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M6.3 6.3a4.67 4.67 0 0 0 1.2 5.2c.7.7 1.3 1.5 1.5 2.5" }],
    ["path", { d: "M9 18h6" }],
    ["path", { d: "M10 22h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/lightbulb.mjs
  var Lightbulb = [
    [
      "path",
      {
        d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
      }
    ],
    ["path", { d: "M9 18h6" }],
    ["path", { d: "M10 22h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/lighthouse.mjs
  var Lighthouse = [
    ["path", { d: "M12 3V2" }],
    ["path", { d: "M16.066 16.865 7 22l2-11V6a3 3 0 016 0v5l2 11" }],
    ["path", { d: "m19.792 4.5.866-.5" }],
    ["path", { d: "m19.797 13.5.866.5" }],
    ["path", { d: "M21 9h1" }],
    ["path", { d: "M3 9H2" }],
    ["path", { d: "m4.203 13.5-.866.5" }],
    ["path", { d: "M4.208 4.5 3.342 4" }],
    ["path", { d: "M5.5 22h13" }],
    ["path", { d: "m7.932 16.875 7.377-4.178" }],
    ["path", { d: "M8 11h8" }],
    ["path", { d: "M8 7h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/line-dot-bottom-vertical.mjs
  var LineDotBottomVertical = [
    ["path", { d: "M12 3v12" }],
    ["circle", { cx: "12", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/line-dot-left-horizontal.mjs
  var LineDotLeftHorizontal = [
    ["path", { d: "M9 12h12" }],
    ["circle", { cx: "6", cy: "12", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/line-dot-right-horizontal.mjs
  var LineDotRightHorizontal = [
    ["path", { d: "M 3 12 L 15 12" }],
    ["circle", { cx: "18", cy: "12", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/line-dot-top-vertical.mjs
  var LineDotTopVertical = [
    ["path", { d: "M12 9v12" }],
    ["circle", { cx: "12", cy: "6", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/line-height.mjs
  var LineHeight = [
    ["path", { d: "M15 14H9" }],
    ["path", { d: "M21 21H3" }],
    ["path", { d: "M21 3H3" }],
    ["path", { d: "m8 16 3.453-7.648a.6.6 0 011.094.001L16 16" }]
  ];

  // node_modules/lucide/dist/esm/icons/line-squiggle.mjs
  var LineSquiggle = [
    [
      "path",
      { d: "M7 3.5c5-2 7 2.5 3 4C1.5 10 2 15 5 16c5 2 9-10 14-7s.5 13.5-4 12c-5-2.5.5-11 6-2" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/line-style.mjs
  var LineStyle = [
    ["path", { d: "M11 5h2" }],
    ["path", { d: "M15 12h6" }],
    ["path", { d: "M19 5h2" }],
    ["path", { d: "M3 12h6" }],
    ["path", { d: "M3 19h18" }],
    ["path", { d: "M3 5h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/link-2-off.mjs
  var Link2Off = [
    ["path", { d: "M9 17H7A5 5 0 0 1 7 7" }],
    ["path", { d: "M15 7h2a5 5 0 0 1 4 8" }],
    ["line", { x1: "8", x2: "12", y1: "12", y2: "12" }],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
  ];

  // node_modules/lucide/dist/esm/icons/link.mjs
  var Link = [
    ["path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }],
    ["path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }]
  ];

  // node_modules/lucide/dist/esm/icons/link-2.mjs
  var Link2 = [
    ["path", { d: "M9 17H7A5 5 0 0 1 7 7h2" }],
    ["path", { d: "M15 7h2a5 5 0 1 1 0 10h-2" }],
    ["line", { x1: "8", x2: "16", y1: "12", y2: "12" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-check.mjs
  var ListCheck = [
    ["path", { d: "M16 5H3" }],
    ["path", { d: "M16 12H3" }],
    ["path", { d: "M11 19H3" }],
    ["path", { d: "m15 18 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-checks.mjs
  var ListChecks = [
    ["path", { d: "M13 5h8" }],
    ["path", { d: "M13 12h8" }],
    ["path", { d: "M13 19h8" }],
    ["path", { d: "m3 17 2 2 4-4" }],
    ["path", { d: "m3 7 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-chevrons-down-up.mjs
  var ListChevronsDownUp = [
    ["path", { d: "M3 5h8" }],
    ["path", { d: "M3 12h8" }],
    ["path", { d: "M3 19h8" }],
    ["path", { d: "m15 5 3 3 3-3" }],
    ["path", { d: "m15 19 3-3 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-chevrons-up-down.mjs
  var ListChevronsUpDown = [
    ["path", { d: "M3 5h8" }],
    ["path", { d: "M3 12h8" }],
    ["path", { d: "M3 19h8" }],
    ["path", { d: "m15 8 3-3 3 3" }],
    ["path", { d: "m15 16 3 3 3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-clock.mjs
  var ListClock = [
    ["path", { d: "M16 13v2.2l1.6 1" }],
    ["path", { d: "M3 12h3.458" }],
    ["path", { d: "M3 19h3.832" }],
    ["path", { d: "M3 5h18" }],
    ["circle", { cx: "16", cy: "15", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-collapse.mjs
  var ListCollapse = [
    ["path", { d: "M10 5h11" }],
    ["path", { d: "M10 12h11" }],
    ["path", { d: "M10 19h11" }],
    ["path", { d: "m3 10 3-3-3-3" }],
    ["path", { d: "m3 20 3-3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-end.mjs
  var ListEnd = [
    ["path", { d: "M16 5H3" }],
    ["path", { d: "M16 12H3" }],
    ["path", { d: "M9 19H3" }],
    ["path", { d: "m16 16-3 3 3 3" }],
    ["path", { d: "M21 5v12a2 2 0 0 1-2 2h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-filter-plus.mjs
  var ListFilterPlus = [
    ["path", { d: "M12 5H2" }],
    ["path", { d: "M6 12h12" }],
    ["path", { d: "M9 19h6" }],
    ["path", { d: "M16 5h6" }],
    ["path", { d: "M19 8V2" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-filter.mjs
  var ListFilter = [
    ["path", { d: "M2 5h20" }],
    ["path", { d: "M6 12h12" }],
    ["path", { d: "M9 19h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-indent-decrease.mjs
  var ListIndentDecrease = [
    ["path", { d: "M21 5H11" }],
    ["path", { d: "M21 12H11" }],
    ["path", { d: "M21 19H11" }],
    ["path", { d: "m7 8-4 4 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-indent-increase.mjs
  var ListIndentIncrease = [
    ["path", { d: "M21 5H11" }],
    ["path", { d: "M21 12H11" }],
    ["path", { d: "M21 19H11" }],
    ["path", { d: "m3 8 4 4-4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-minus.mjs
  var ListMinus = [
    ["path", { d: "M16 5H3" }],
    ["path", { d: "M11 12H3" }],
    ["path", { d: "M16 19H3" }],
    ["path", { d: "M21 12h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-music.mjs
  var ListMusic = [
    ["path", { d: "M16 5H3" }],
    ["path", { d: "M11 12H3" }],
    ["path", { d: "M11 19H3" }],
    ["path", { d: "M21 16V5" }],
    ["circle", { cx: "18", cy: "16", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-ordered.mjs
  var ListOrdered = [
    ["path", { d: "M11 5h10" }],
    ["path", { d: "M11 12h10" }],
    ["path", { d: "M11 19h10" }],
    ["path", { d: "M4 4h1v5" }],
    ["path", { d: "M4 9h2" }],
    ["path", { d: "M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-plus.mjs
  var ListPlus = [
    ["path", { d: "M16 5H3" }],
    ["path", { d: "M11 12H3" }],
    ["path", { d: "M16 19H3" }],
    ["path", { d: "M18 9v6" }],
    ["path", { d: "M21 12h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-restart.mjs
  var ListRestart = [
    ["path", { d: "M21 5H3" }],
    ["path", { d: "M7 12H3" }],
    ["path", { d: "M7 19H3" }],
    ["path", { d: "M12 18a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L11 14" }],
    ["path", { d: "M11 10v4h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-sort-ascending.mjs
  var ListSortAscending = [
    ["path", { d: "M3 19h18" }],
    ["path", { d: "M15 12H3" }],
    ["path", { d: "M9 5H3" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-sort-descending.mjs
  var ListSortDescending = [
    ["path", { d: "M15 12H3" }],
    ["path", { d: "M3 5h18" }],
    ["path", { d: "M9 19H3" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-start.mjs
  var ListStart = [
    ["path", { d: "M3 5h6" }],
    ["path", { d: "M3 12h13" }],
    ["path", { d: "M3 19h13" }],
    ["path", { d: "m16 8-3-3 3-3" }],
    ["path", { d: "M21 19V7a2 2 0 0 0-2-2h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-todo.mjs
  var ListTodo = [
    ["path", { d: "M13 5h8" }],
    ["path", { d: "M13 12h8" }],
    ["path", { d: "M13 19h8" }],
    ["path", { d: "m3 17 2 2 4-4" }],
    ["rect", { x: "3", y: "4", width: "6", height: "6", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-tree.mjs
  var ListTree = [
    ["path", { d: "M8 5h13" }],
    ["path", { d: "M13 12h8" }],
    ["path", { d: "M13 19h8" }],
    ["path", { d: "M3 10a2 2 0 0 0 2 2h3" }],
    ["path", { d: "M3 5v12a2 2 0 0 0 2 2h3" }]
  ];

  // node_modules/lucide/dist/esm/icons/list-video.mjs
  var ListVideo = [
    ["path", { d: "M21 5H3" }],
    ["path", { d: "M10 12H3" }],
    ["path", { d: "M10 19H3" }],
    [
      "path",
      {
        d: "M15 12.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997a1 1 0 0 1-1.517-.86z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/list-x.mjs
  var ListX = [
    ["path", { d: "M16 5H3" }],
    ["path", { d: "M11 12H3" }],
    ["path", { d: "M16 19H3" }],
    ["path", { d: "m15.5 9.5 5 5" }],
    ["path", { d: "m20.5 9.5-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/list.mjs
  var List = [
    ["path", { d: "M3 5h.01" }],
    ["path", { d: "M3 12h.01" }],
    ["path", { d: "M3 19h.01" }],
    ["path", { d: "M8 5h13" }],
    ["path", { d: "M8 12h13" }],
    ["path", { d: "M8 19h13" }]
  ];

  // node_modules/lucide/dist/esm/icons/loader-circle.mjs
  var LoaderCircle = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]];

  // node_modules/lucide/dist/esm/icons/loader-pinwheel.mjs
  var LoaderPinwheel = [
    ["path", { d: "M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0" }],
    ["path", { d: "M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6" }],
    ["path", { d: "M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/loader.mjs
  var Loader = [
    ["path", { d: "M12 2v4" }],
    ["path", { d: "m16.2 7.8 2.9-2.9" }],
    ["path", { d: "M18 12h4" }],
    ["path", { d: "m16.2 16.2 2.9 2.9" }],
    ["path", { d: "M12 18v4" }],
    ["path", { d: "m4.9 19.1 2.9-2.9" }],
    ["path", { d: "M2 12h4" }],
    ["path", { d: "m4.9 4.9 2.9 2.9" }]
  ];

  // node_modules/lucide/dist/esm/icons/locate-off.mjs
  var LocateOff = [
    ["path", { d: "M12 19v3" }],
    ["path", { d: "M12 2v3" }],
    ["path", { d: "M18.89 13.24a7 7 0 0 0-8.13-8.13" }],
    ["path", { d: "M19 12h3" }],
    ["path", { d: "M2 12h3" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M7.05 7.05a7 7 0 0 0 9.9 9.9" }]
  ];

  // node_modules/lucide/dist/esm/icons/locate-fixed.mjs
  var LocateFixed = [
    ["line", { x1: "2", x2: "5", y1: "12", y2: "12" }],
    ["line", { x1: "19", x2: "22", y1: "12", y2: "12" }],
    ["line", { x1: "12", x2: "12", y1: "2", y2: "5" }],
    ["line", { x1: "12", x2: "12", y1: "19", y2: "22" }],
    ["circle", { cx: "12", cy: "12", r: "7" }],
    ["circle", { cx: "12", cy: "12", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/locate.mjs
  var Locate = [
    ["line", { x1: "2", x2: "5", y1: "12", y2: "12" }],
    ["line", { x1: "19", x2: "22", y1: "12", y2: "12" }],
    ["line", { x1: "12", x2: "12", y1: "2", y2: "5" }],
    ["line", { x1: "12", x2: "12", y1: "19", y2: "22" }],
    ["circle", { cx: "12", cy: "12", r: "7" }]
  ];

  // node_modules/lucide/dist/esm/icons/lock-keyhole-open.mjs
  var LockKeyholeOpen = [
    ["circle", { cx: "12", cy: "16", r: "1" }],
    ["rect", { width: "18", height: "12", x: "3", y: "10", rx: "2" }],
    ["path", { d: "M7 10V7a5 5 0 0 1 9.33-2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/lock-keyhole.mjs
  var LockKeyhole = [
    ["circle", { cx: "12", cy: "16", r: "1" }],
    ["rect", { x: "3", y: "10", width: "18", height: "12", rx: "2" }],
    ["path", { d: "M7 10V7a5 5 0 0 1 10 0v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/lock-open.mjs
  var LockOpen = [
    ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }],
    ["path", { d: "M7 11V7a5 5 0 0 1 9.9-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/lock.mjs
  var Lock = [
    ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }],
    ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/log-in.mjs
  var LogIn = [
    ["path", { d: "m10 17 5-5-5-5" }],
    ["path", { d: "M15 12H3" }],
    ["path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/log-out.mjs
  var LogOut = [
    ["path", { d: "m16 17 5-5-5-5" }],
    ["path", { d: "M21 12H9" }],
    ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/logs.mjs
  var Logs = [
    ["path", { d: "M3 5h1" }],
    ["path", { d: "M3 12h1" }],
    ["path", { d: "M3 19h1" }],
    ["path", { d: "M8 5h1" }],
    ["path", { d: "M8 12h1" }],
    ["path", { d: "M8 19h1" }],
    ["path", { d: "M13 5h8" }],
    ["path", { d: "M13 12h8" }],
    ["path", { d: "M13 19h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/lollipop.mjs
  var Lollipop = [
    ["circle", { cx: "11", cy: "11", r: "8" }],
    ["path", { d: "m21 21-4.3-4.3" }],
    ["path", { d: "M11 11a2 2 0 0 0 4 0 4 4 0 0 0-8 0 6 6 0 0 0 12 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/luggage.mjs
  var Luggage = [
    ["path", { d: "M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2" }],
    ["path", { d: "M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14" }],
    ["path", { d: "M10 20h4" }],
    ["circle", { cx: "16", cy: "20", r: "2" }],
    ["circle", { cx: "8", cy: "20", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/magnet.mjs
  var Magnet = [
    ["path", { d: "m12 15 4 4" }],
    [
      "path",
      {
        d: "M2.352 10.648a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l6.029-6.029a1 1 0 1 1 3 3l-6.029 6.029a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l6.365-6.367A1 1 0 0 0 8.716 4.282z"
      }
    ],
    ["path", { d: "m5 8 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-badge.mjs
  var MailBadge = [
    ["path", { d: "M22 7.7V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8.25" }],
    ["path", { d: "M12 12.996a1.94 1.94 0 0 1-1.03-.296L2 7" }],
    [
      "path",
      {
        d: "m20.69 16.479 1.29 4.88a.5.5 0 0 1-.698.591l-1.843-.849a1 1 0 0 0-.879.001l-1.846.85a.5.5 0 0 1-.692-.593l1.29-4.88"
      }
    ],
    ["circle", { cx: "19", cy: "14", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-check.mjs
  var MailCheck = [
    ["path", { d: "M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" }],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }],
    ["path", { d: "m16 19 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-clock.mjs
  var MailClock = [
    ["path", { d: "M16 14v2.2l1.6 1" }],
    ["path", { d: "m22 7-.759.484" }],
    ["path", { d: "M6.835 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v2" }],
    ["path", { d: "M7.605 10.567 2 7" }],
    ["circle", { cx: "16", cy: "16", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-dot.mjs
  var MailDot = [
    ["path", { d: "M12.674 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4.675" }],
    ["path", { d: "m2 7 9 5.701a2 2 0 0 0 2 0l1.084-.686" }],
    ["circle", { cx: "19", cy: "7", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-exclamation-point.mjs
  var MailExclamationPoint = [
    ["path", { d: "M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" }],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }],
    ["path", { d: "M20 14v4" }],
    ["path", { d: "M20 22v.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-minus.mjs
  var MailMinus = [
    ["path", { d: "M22 15V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" }],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }],
    ["path", { d: "M16 19h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-open.mjs
  var MailOpen = [
    [
      "path",
      {
        d: "M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"
      }
    ],
    ["path", { d: "m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-pen.mjs
  var MailPen = [
    [
      "path",
      {
        d: "M15.363 17.634a2 2 0 00-.506.854l-.837 2.87a.5.5 0 00.62.62l2.87-.837a2 2 0 00.854-.506l3.013-3.009a1 1 0 10-3.004-3.004z"
      }
    ],
    ["path", { d: "M22 10.38V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h6.25" }],
    ["path", { d: "m22 7-8.991 5.727a2 2 0 01-2.009 0L2 7" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-plus.mjs
  var MailPlus = [
    ["path", { d: "M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" }],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }],
    ["path", { d: "M19 16v6" }],
    ["path", { d: "M16 19h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-question-mark.mjs
  var MailQuestionMark = [
    ["path", { d: "M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" }],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }],
    ["path", { d: "M18 15.28c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2" }],
    ["path", { d: "M20 22v.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-search.mjs
  var MailSearch = [
    ["path", { d: "M22 12.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h7.5" }],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }],
    ["path", { d: "M18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" }],
    ["circle", { cx: "18", cy: "18", r: "3" }],
    ["path", { d: "m22 22-1.5-1.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail-x.mjs
  var MailX = [
    ["path", { d: "M22 12.532V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8.792" }],
    ["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" }],
    ["path", { d: "m16.5 16.5 5 5" }],
    ["path", { d: "m21.5 16.5-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/mail.mjs
  var Mail = [
    ["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" }],
    ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/mailbox.mjs
  var Mailbox = [
    ["path", { d: "M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" }],
    ["polyline", { points: "15,9 18,9 18,11" }],
    ["path", { d: "M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2" }],
    ["line", { x1: "6", x2: "7", y1: "10", y2: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/mails.mjs
  var Mails = [
    ["path", { d: "M17 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 1-1.732" }],
    ["path", { d: "m22 5.5-6.419 4.179a2 2 0 0 1-2.162 0L7 5.5" }],
    ["rect", { x: "7", y: "3", width: "15", height: "12", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/mango.mjs
  var Mango = [
    ["path", { d: "m17 6 3-3" }],
    ["path", { d: "M7 22a4 4 0 01-2.62-7.023A2 2 0 005 13.383V10a8 8 0 1116 0A12 12 0 019 22z" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-minus.mjs
  var MapMinus = [
    [
      "path",
      {
        d: "m11 19-1.106-.552a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0l4.212 2.106a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619V14"
      }
    ],
    ["path", { d: "M15 5.764V14" }],
    ["path", { d: "M21 18h-6" }],
    ["path", { d: "M9 3.236v15" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-check-inside.mjs
  var MapPinCheckInside = [
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      }
    ],
    ["path", { d: "m9 10 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-check.mjs
  var MapPinCheck = [
    [
      "path",
      {
        d: "M19.43 12.935c.357-.967.57-1.955.57-2.935a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32.197 32.197 0 0 0 .813-.728"
      }
    ],
    ["circle", { cx: "12", cy: "10", r: "3" }],
    ["path", { d: "m16 18 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-house.mjs
  var MapPinHouse = [
    [
      "path",
      {
        d: "M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z"
      }
    ],
    ["path", { d: "M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2" }],
    ["path", { d: "M18 22v-3" }],
    ["circle", { cx: "10", cy: "10", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-minus-inside.mjs
  var MapPinMinusInside = [
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      }
    ],
    ["path", { d: "M9 10h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-minus.mjs
  var MapPinMinus = [
    [
      "path",
      {
        d: "M18.977 14C19.6 12.701 20 11.343 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32 32 0 0 0 .824-.738"
      }
    ],
    ["circle", { cx: "12", cy: "10", r: "3" }],
    ["path", { d: "M16 18h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-off.mjs
  var MapPinOff = [
    ["path", { d: "M12.75 7.09a3 3 0 0 1 2.16 2.16" }],
    [
      "path",
      {
        d: "M17.072 17.072c-1.634 2.17-3.527 3.912-4.471 4.727a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 1.432-4.568"
      }
    ],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M8.475 2.818A8 8 0 0 1 20 10c0 1.183-.31 2.377-.81 3.533" }],
    ["path", { d: "M9.13 9.13a3 3 0 0 0 3.74 3.74" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-pen.mjs
  var MapPinPen = [
    ["path", { d: "M17.97 9.304A8 8 0 0 0 2 10c0 4.69 4.887 9.562 7.022 11.468" }],
    [
      "path",
      {
        d: "M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
      }
    ],
    ["circle", { cx: "10", cy: "10", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-plus-inside.mjs
  var MapPinPlusInside = [
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      }
    ],
    ["path", { d: "M12 7v6" }],
    ["path", { d: "M9 10h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-plus.mjs
  var MapPinPlus = [
    [
      "path",
      {
        d: "M19.914 11.105A7.298 7.298 0 0 0 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32 32 0 0 0 .824-.738"
      }
    ],
    ["circle", { cx: "12", cy: "10", r: "3" }],
    ["path", { d: "M16 18h6" }],
    ["path", { d: "M19 15v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-search.mjs
  var MapPinSearch = [
    [
      "path",
      {
        d: "M 12.248 21.969 a 1 1 0 0 1 -0.849 -0.17 C 9.539 20.193 4 14.993 4 10 a 8 8 0 0 1 16 0 C 20 10.42 19.961 10.841 19.888 11.262"
      }
    ],
    ["path", { d: "m22 22-1.88-1.88" }],
    ["circle", { cx: "12", cy: "10", r: "3" }],
    ["circle", { cx: "18", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-x-inside.mjs
  var MapPinXInside = [
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      }
    ],
    ["path", { d: "m14.5 7.5-5 5" }],
    ["path", { d: "m9.5 7.5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin-x.mjs
  var MapPinX = [
    [
      "path",
      {
        d: "M19.752 11.901A7.78 7.78 0 0 0 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 19 19 0 0 0 .09-.077"
      }
    ],
    ["circle", { cx: "12", cy: "10", r: "3" }],
    ["path", { d: "m21.5 15.5-5 5" }],
    ["path", { d: "m21.5 20.5-5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pin.mjs
  var MapPin = [
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      }
    ],
    ["circle", { cx: "12", cy: "10", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-pinned.mjs
  var MapPinned = [
    [
      "path",
      {
        d: "M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 01-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0112 0"
      }
    ],
    [
      "path",
      {
        d: "M4.474 15h-.197a1 1 0 00-.969.753l-1.097 4.35a1.5 1.5 0 001.444 1.898L20.344 22a1.5 1.5 0 001.446-1.897l-1.098-4.35a1 1 0 00-.969-.753h-.197"
      }
    ],
    ["circle", { cx: "12", cy: "8", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/map-plus.mjs
  var MapPlus = [
    [
      "path",
      {
        d: "m11 19-1.106-.552a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0l4.212 2.106a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619V12"
      }
    ],
    ["path", { d: "M15 5.764V12" }],
    ["path", { d: "M18 15v6" }],
    ["path", { d: "M21 18h-6" }],
    ["path", { d: "M9 3.236v15" }]
  ];

  // node_modules/lucide/dist/esm/icons/map.mjs
  var Map = [
    [
      "path",
      {
        d: "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"
      }
    ],
    ["path", { d: "M15 5.764v15" }],
    ["path", { d: "M9 3.236v15" }]
  ];

  // node_modules/lucide/dist/esm/icons/margin-bottom.mjs
  var MarginBottom = [
    ["rect", { x: "9", y: "9", width: "6", height: "6", rx: "1" }],
    ["path", { d: "M3 21h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/margin-horizontal.mjs
  var MarginHorizontal = [
    ["rect", { x: "9", y: "9", width: "6", height: "6", rx: "1" }],
    ["path", { d: "M21 3v18" }],
    ["path", { d: "M3 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/margin-left.mjs
  var MarginLeft = [
    ["rect", { x: "9", y: "9", width: "6", height: "6", rx: "1" }],
    ["path", { d: "M3 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/margin-right.mjs
  var MarginRight = [
    ["rect", { x: "9", y: "9", width: "6", height: "6", rx: "1" }],
    ["path", { d: "M21 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/margin-top.mjs
  var MarginTop = [
    ["rect", { x: "9", y: "9", width: "6", height: "6", rx: "1" }],
    ["path", { d: "M3 3h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/margin-vertical.mjs
  var MarginVertical = [
    ["rect", { x: "9", y: "9", width: "6", height: "6", rx: "1" }],
    ["path", { d: "M3 21h18" }],
    ["path", { d: "M3 3h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/margin.mjs
  var Margin = [
    ["rect", { x: "9", y: "9", width: "6", height: "6", rx: "1" }],
    ["path", { d: "M21 6v12" }],
    ["path", { d: "M3 6v12" }],
    ["path", { d: "M6 21h12" }],
    ["path", { d: "M6 3h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/mars-stroke.mjs
  var MarsStroke = [
    ["path", { d: "m14 6 4 4" }],
    ["path", { d: "M17 3h4v4" }],
    ["path", { d: "m21 3-7.75 7.75" }],
    ["circle", { cx: "9", cy: "15", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/mars.mjs
  var Mars = [
    ["path", { d: "M16 3h5v5" }],
    ["path", { d: "m21 3-6.75 6.75" }],
    ["circle", { cx: "10", cy: "14", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/martini.mjs
  var Martini = [
    ["path", { d: "M12 12 4.207 4.207A.707.707 0 0 1 4.707 3h14.586a.707.707 0 0 1 .5 1.207z" }],
    ["path", { d: "M12 12v10" }],
    ["path", { d: "M7 22h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/maximize-2.mjs
  var Maximize2 = [
    ["path", { d: "M15 3h6v6" }],
    ["path", { d: "m21 3-7 7" }],
    ["path", { d: "m3 21 7-7" }],
    ["path", { d: "M9 21H3v-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/maximize.mjs
  var Maximize = [
    ["path", { d: "M8 3H5a2 2 0 0 0-2 2v3" }],
    ["path", { d: "M21 8V5a2 2 0 0 0-2-2h-3" }],
    ["path", { d: "M3 16v3a2 2 0 0 0 2 2h3" }],
    ["path", { d: "M16 21h3a2 2 0 0 0 2-2v-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/medal.mjs
  var Medal = [
    [
      "path",
      {
        d: "M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"
      }
    ],
    ["path", { d: "M11 12 5.12 2.2" }],
    ["path", { d: "m13 12 5.88-9.8" }],
    ["path", { d: "M8 7h8" }],
    ["circle", { cx: "12", cy: "17", r: "5" }],
    ["path", { d: "M12 18v-2h-.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/megaphone-off.mjs
  var MegaphoneOff = [
    ["path", { d: "M11.636 6A13 13 0 0 0 19.4 3.2 1 1 0 0 1 21 4v11.344" }],
    ["path", { d: "M14.378 14.357A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" }],
    ["path", { d: "M8 8v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/megaphone.mjs
  var Megaphone = [
    [
      "path",
      {
        d: "M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" }],
    ["path", { d: "M8 6v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/memory-stick.mjs
  var MemoryStick = [
    ["path", { d: "M12 12v-2" }],
    ["path", { d: "M12 18v-2" }],
    ["path", { d: "M16 12v-2" }],
    ["path", { d: "M16 18v-2" }],
    ["path", { d: "M2 11h1.5" }],
    ["path", { d: "M20 18v-2" }],
    ["path", { d: "M20.5 11H22" }],
    ["path", { d: "M4 18v-2" }],
    ["path", { d: "M8 12v-2" }],
    ["path", { d: "M8 18v-2" }],
    ["rect", { x: "2", y: "6", width: "20", height: "10", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/menu.mjs
  var Menu = [
    ["path", { d: "M4 5h16" }],
    ["path", { d: "M4 12h16" }],
    ["path", { d: "M4 19h16" }]
  ];

  // node_modules/lucide/dist/esm/icons/merge.mjs
  var Merge = [
    ["path", { d: "m8 6 4-4 4 4" }],
    ["path", { d: "M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22" }],
    ["path", { d: "m20 22-5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-check.mjs
  var MessageCircleCheck = [
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
      }
    ],
    ["path", { d: "m16 9-5.5 5.5L8 12" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-dashed-check.mjs
  var MessageCircleDashedCheck = [
    ["path", { d: "M10.1 2.182a10 10 0 013.8 0" }],
    ["path", { d: "M13.9 21.818a10 10 0 01-3.8 0" }],
    ["path", { d: "M17.609 3.72a10 10 0 012.69 2.7" }],
    ["path", { d: "M2.182 13.9a10 10 0 010-3.8" }],
    ["path", { d: "M20.28 17.61a10 10 0 01-2.7 2.69" }],
    ["path", { d: "M21.818 10.1a10 10 0 010 3.8" }],
    ["path", { d: "M3.721 6.391a10 10 0 012.7-2.69" }],
    ["path", { d: "m6.163 21.117-2.906.85a1 1 0 01-1.236-1.169l.965-2.98" }],
    ["path", { d: "m16 9-5.5 5.5L8 12" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-dashed.mjs
  var MessageCircleDashed = [
    ["path", { d: "M10.1 2.182a10 10 0 0 1 3.8 0" }],
    ["path", { d: "M13.9 21.818a10 10 0 0 1-3.8 0" }],
    ["path", { d: "M17.609 3.72a10 10 0 0 1 2.69 2.7" }],
    ["path", { d: "M2.182 13.9a10 10 0 0 1 0-3.8" }],
    ["path", { d: "M20.28 17.61a10 10 0 0 1-2.7 2.69" }],
    ["path", { d: "M21.818 10.1a10 10 0 0 1 0 3.8" }],
    ["path", { d: "M3.721 6.391a10 10 0 0 1 2.7-2.69" }],
    ["path", { d: "m6.163 21.117-2.906.85a1 1 0 0 1-1.236-1.169l.965-2.98" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-code.mjs
  var MessageCircleCode = [
    ["path", { d: "m10 9-3 3 3 3" }],
    ["path", { d: "m14 15 3-3-3-3" }],
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-exclamation-point.mjs
  var MessageCircleExclamationPoint = [
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
      }
    ],
    ["path", { d: "M12 8v4" }],
    ["path", { d: "M12 16h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-heart.mjs
  var MessageCircleHeart = [
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
      }
    ],
    [
      "path",
      {
        d: "M7.828 13.07A3 3 0 0 1 12 8.764a3 3 0 0 1 5.004 2.224 3 3 0 0 1-.832 2.083l-3.447 3.62a1 1 0 0 1-1.45-.001z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-more.mjs
  var MessageCircleMore = [
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
      }
    ],
    ["path", { d: "M8 12h.01" }],
    ["path", { d: "M12 12h.01" }],
    ["path", { d: "M16 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-off.mjs
  var MessageCircleOff = [
    ["path", { d: "m2 2 20 20" }],
    [
      "path",
      {
        d: "M4.93 4.929a10 10 0 0 0-1.938 11.412 2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 0 0 11.302-1.989"
      }
    ],
    ["path", { d: "M8.35 2.69A10 10 0 0 1 21.3 15.65" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-plus.mjs
  var MessageCirclePlus = [
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
      }
    ],
    ["path", { d: "M8 12h8" }],
    ["path", { d: "M12 8v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-question-mark.mjs
  var MessageCircleQuestionMark = [
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
      }
    ],
    ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }],
    ["path", { d: "M12 17h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-reply.mjs
  var MessageCircleReply = [
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
      }
    ],
    ["path", { d: "m10 15-3-3 3-3" }],
    ["path", { d: "M7 12h8a2 2 0 0 1 2 2v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-text.mjs
  var MessageCircleText = [
    [
      "path",
      {
        d: "M3.086 17.509a2 2 0 00-.094-1.167 10 10 0 114.777 4.719 2 2 0 00-1.099-.092l-3.413.998a1 1 0 01-1.236-1.168z"
      }
    ],
    ["path", { d: "M8 12h9" }],
    ["path", { d: "M8 16h5" }],
    ["path", { d: "M8 8h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle-x.mjs
  var MessageCircleX = [
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
      }
    ],
    ["path", { d: "m15 9-6 6" }],
    ["path", { d: "m9 9 6 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-circle.mjs
  var MessageCircle = [
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-check.mjs
  var MessageSquareCheck = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.7.7 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ],
    ["path", { d: "m9 11 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-code.mjs
  var MessageSquareCode = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ],
    ["path", { d: "m10 8-3 3 3 3" }],
    ["path", { d: "m14 14 3-3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-dashed.mjs
  var MessageSquareDashed = [
    ["path", { d: "M14 3h2" }],
    ["path", { d: "M16 19h-2" }],
    ["path", { d: "M2 12v-2" }],
    ["path", { d: "M2 16v5.286a.71.71 0 0 0 1.212.502l1.149-1.149" }],
    ["path", { d: "M20 19a2 2 0 0 0 2-2v-1" }],
    ["path", { d: "M22 10v2" }],
    ["path", { d: "M22 6V5a2 2 0 0 0-2-2" }],
    ["path", { d: "M4 3a2 2 0 0 0-2 2v1" }],
    ["path", { d: "M8 19h2" }],
    ["path", { d: "M8 3h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-diff.mjs
  var MessageSquareDiff = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ],
    ["path", { d: "M10 15h4" }],
    ["path", { d: "M10 9h4" }],
    ["path", { d: "M12 7v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-dot.mjs
  var MessageSquareDot = [
    [
      "path",
      {
        d: "M12.7 3H4a2 2 0 0 0-2 2v16.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H20a2 2 0 0 0 2-2v-4.7"
      }
    ],
    ["circle", { cx: "19", cy: "6", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-exclamation-point.mjs
  var MessageSquareExclamationPoint = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ],
    ["path", { d: "M12 15h.01" }],
    ["path", { d: "M12 7v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-heart.mjs
  var MessageSquareHeart = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ],
    [
      "path",
      {
        d: "M7.5 9.5c0 .687.265 1.383.697 1.844l3.009 3.264a1.14 1.14 0 0 0 .407.314 1 1 0 0 0 .783-.004 1.14 1.14 0 0 0 .398-.31l3.008-3.264A2.77 2.77 0 0 0 16.5 9.5 2.5 2.5 0 0 0 12 8a2.5 2.5 0 0 0-4.5 1.5"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-lock.mjs
  var MessageSquareLock = [
    [
      "path",
      {
        d: "M22 8.5V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H10"
      }
    ],
    ["path", { d: "M20 15v-2a2 2 0 0 0-4 0v2" }],
    ["rect", { x: "14", y: "15", width: "8", height: "5", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-more.mjs
  var MessageSquareMore = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ],
    ["path", { d: "M12 11h.01" }],
    ["path", { d: "M16 11h.01" }],
    ["path", { d: "M8 11h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-off.mjs
  var MessageSquareOff = [
    [
      "path",
      {
        d: "M19 19H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.7.7 0 0 1 2 21.286V5a2 2 0 0 1 1.184-1.826"
      }
    ],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M8.656 3H20a2 2 0 0 1 2 2v11.344" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-plus.mjs
  var MessageSquarePlus = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ],
    ["path", { d: "M12 8v6" }],
    ["path", { d: "M9 11h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-quote.mjs
  var MessageSquareQuote = [
    ["path", { d: "M14 14a2 2 0 0 0 2-2V8h-2" }],
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ],
    ["path", { d: "M8 14a2 2 0 0 0 2-2V8H8" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-reply.mjs
  var MessageSquareReply = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ],
    ["path", { d: "m10 8-3 3 3 3" }],
    ["path", { d: "M17 14v-1a2 2 0 0 0-2-2H7" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-share.mjs
  var MessageSquareShare = [
    [
      "path",
      {
        d: "M12 3H4a2 2 0 0 0-2 2v16.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H20a2 2 0 0 0 2-2v-4"
      }
    ],
    ["path", { d: "M16 3h6v6" }],
    ["path", { d: "m16 9 6-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-text.mjs
  var MessageSquareText = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ],
    ["path", { d: "M7 11h10" }],
    ["path", { d: "M7 15h6" }],
    ["path", { d: "M7 7h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square-x.mjs
  var MessageSquareX = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ],
    ["path", { d: "m14.5 8.5-5 5" }],
    ["path", { d: "m9.5 8.5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/message-square.mjs
  var MessageSquare = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/messages-circle.mjs
  var MessagesCircle = [
    [
      "path",
      {
        d: "M19.95 10.05a7 7 0 011.412 7.872 1 1 0 00-.058.787l.675 2.089a1 1 0 01-1.236 1.168l-2.155-.631a1 1 0 00-.745.06 7 7 0 01-7.793-1.445"
      }
    ],
    [
      "path",
      {
        d: "M2.696 12.708a1 1 0 00-.058-.785 7 7 0 113.518 3.473 1 1 0 00-.744-.061l-2.155.63a1 1 0 01-1.236-1.167z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/messages-square.mjs
  var MessagesSquare = [
    [
      "path",
      {
        d: "M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      }
    ],
    [
      "path",
      {
        d: "M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/metronome.mjs
  var Metronome = [
    ["path", { d: "M12 11.4V9.1" }],
    ["path", { d: "m12 17 6.59-6.59" }],
    [
      "path",
      {
        d: "m15.05 5.7-.218-.691a3 3 0 0 0-5.663 0L4.418 19.695A1 1 0 0 0 5.37 21h13.253a1 1 0 0 0 .951-1.31L18.45 16.2"
      }
    ],
    ["circle", { cx: "20", cy: "9", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/mic-off.mjs
  var MicOff = [
    ["path", { d: "M12 19v3" }],
    ["path", { d: "M15 9.34V5a3 3 0 0 0-5.68-1.33" }],
    ["path", { d: "M16.95 16.95A7 7 0 0 1 5 12v-2" }],
    ["path", { d: "M18.89 13.23A7 7 0 0 0 19 12v-2" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M9 9v3a3 3 0 0 0 5.12 2.12" }]
  ];

  // node_modules/lucide/dist/esm/icons/mic-audio-lines.mjs
  var MicAudioLines = [
    ["path", { d: "M10 3v2.341" }],
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M14 5v.341" }],
    ["path", { d: "M18 5v13" }],
    ["path", { d: "M2 10v3" }],
    ["path", { d: "M22 10v3" }],
    ["path", { d: "M6 6v11" }],
    ["path", { d: "M9 21h6" }],
    ["rect", { width: "4", height: "8", x: "10", y: "9", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/mic-signal.mjs
  var MicSignal = [
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M18 11a6 6 0 00-3-5.197" }],
    ["path", { d: "M2 11a10 10 0 015-8.662" }],
    ["path", { d: "M22 11a10 10 0 00-5-8.662" }],
    ["path", { d: "M6 11a6 6 0 013-5.197" }],
    ["path", { d: "M9 21h6" }],
    ["rect", { x: "10", y: "9", width: "4", height: "8", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/mic-vocal.mjs
  var MicVocal = [
    ["path", { d: "m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12" }],
    [
      "path",
      {
        d: "M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5"
      }
    ],
    ["circle", { cx: "16", cy: "7", r: "5" }]
  ];

  // node_modules/lucide/dist/esm/icons/mic.mjs
  var Mic = [
    ["path", { d: "M12 19v3" }],
    ["path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }],
    ["rect", { x: "9", y: "2", width: "6", height: "13", rx: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/microchip.mjs
  var Microchip = [
    ["path", { d: "M10 12h4" }],
    ["path", { d: "M10 17h4" }],
    ["path", { d: "M10 7h4" }],
    ["path", { d: "M18 12h2" }],
    ["path", { d: "M18 18h2" }],
    ["path", { d: "M18 6h2" }],
    ["path", { d: "M4 12h2" }],
    ["path", { d: "M4 18h2" }],
    ["path", { d: "M4 6h2" }],
    ["rect", { x: "6", y: "2", width: "12", height: "20", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/microscope.mjs
  var Microscope = [
    ["path", { d: "M6 18h8" }],
    ["path", { d: "M3 22h18" }],
    ["path", { d: "M14 22a7 7 0 1 0 0-14h-1" }],
    ["path", { d: "M9 14h2" }],
    ["path", { d: "M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" }],
    ["path", { d: "M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/microwave.mjs
  var Microwave = [
    ["rect", { width: "20", height: "15", x: "2", y: "4", rx: "2" }],
    ["rect", { width: "8", height: "7", x: "6", y: "8", rx: "1" }],
    ["path", { d: "M18 8v7" }],
    ["path", { d: "M6 19v2" }],
    ["path", { d: "M18 19v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/midi-port.mjs
  var MidiPort = [
    ["path", { d: "M12 18h.01" }],
    ["path", { d: "M15 2.458V5a1 1 0 01-1 1h-4a1 1 0 01-1-1V2.458" }],
    ["path", { d: "M16 16h.01" }],
    ["path", { d: "M18 12h.01" }],
    ["path", { d: "M6 12h.01" }],
    ["path", { d: "M8 16h.01" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/milestone.mjs
  var Milestone = [
    ["path", { d: "M12 13v8" }],
    ["path", { d: "M12 3v3" }],
    [
      "path",
      {
        d: "M18.172 6a2 2 0 0 1 1.414.586l2.06 2.06a1.207 1.207 0 0 1 0 1.708l-2.06 2.06a2 2 0 0 1-1.414.586H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/milk-off.mjs
  var MilkOff = [
    ["path", { d: "M8 2h8" }],
    [
      "path",
      {
        d: "M9 2v1.343M15 2v2.789a4 4 0 0 0 .672 2.219l.656.984a4 4 0 0 1 .672 2.22v1.131M7.8 7.8l-.128.192A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3"
      }
    ],
    ["path", { d: "M7 15a6.47 6.47 0 0 1 5 0 6.472 6.472 0 0 0 3.435.435" }],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
  ];

  // node_modules/lucide/dist/esm/icons/milk.mjs
  var Milk = [
    ["path", { d: "M8 2h8" }],
    [
      "path",
      {
        d: "M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2"
      }
    ],
    ["path", { d: "M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/minimize-2.mjs
  var Minimize2 = [
    ["path", { d: "m14 10 7-7" }],
    ["path", { d: "M20 10h-6V4" }],
    ["path", { d: "m3 21 7-7" }],
    ["path", { d: "M4 14h6v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/minimize.mjs
  var Minimize = [
    ["path", { d: "M8 3v3a2 2 0 0 1-2 2H3" }],
    ["path", { d: "M21 8h-3a2 2 0 0 1-2-2V3" }],
    ["path", { d: "M3 16h3a2 2 0 0 1 2 2v3" }],
    ["path", { d: "M16 21v-3a2 2 0 0 1 2-2h3" }]
  ];

  // node_modules/lucide/dist/esm/icons/minus.mjs
  var Minus = [["path", { d: "M5 12h14" }]];

  // node_modules/lucide/dist/esm/icons/mirror-rectangular.mjs
  var MirrorRectangular = [
    ["path", { d: "M11 6 8 9" }],
    ["path", { d: "m16 7-8 8" }],
    ["rect", { x: "4", y: "2", width: "16", height: "20", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/mirror-round.mjs
  var MirrorRound = [
    ["path", { d: "M10 6.6 8.6 8" }],
    ["path", { d: "M12 18v4" }],
    ["path", { d: "M15 7.5 9.5 13" }],
    ["path", { d: "M7 22h10" }],
    ["circle", { cx: "12", cy: "10", r: "8" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-activity.mjs
  var MonitorActivity = [
    ["path", { d: "M12 17v4" }],
    [
      "path",
      {
        d: "M18 10h-2.315a1 1 0 00-.932.64l-.787 2.034a.5.5 0 01-.932 0l-2.068-5.348a.5.5 0 00-.932 0l-.787 2.035a1 1 0 01-.932.639H6"
      }
    ],
    ["path", { d: "M8 21h8" }],
    ["rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-check.mjs
  var MonitorCheck = [
    ["path", { d: "m9 10 2 2 4-4" }],
    ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }],
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M8 21h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-cloud.mjs
  var MonitorCloud = [
    ["path", { d: "M11 13a3 3 0 1 1 2.83-4H14a2 2 0 0 1 0 4z" }],
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M8 21h8" }],
    ["rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-cog.mjs
  var MonitorCog = [
    ["path", { d: "M12 17v4" }],
    ["path", { d: "m14.305 7.53.923-.382" }],
    ["path", { d: "m15.228 4.852-.923-.383" }],
    ["path", { d: "m16.852 3.228-.383-.924" }],
    ["path", { d: "m16.852 8.772-.383.923" }],
    ["path", { d: "m19.148 3.228.383-.924" }],
    ["path", { d: "m19.53 9.696-.382-.924" }],
    ["path", { d: "m20.772 4.852.924-.383" }],
    ["path", { d: "m20.772 7.148.924.383" }],
    ["path", { d: "M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" }],
    ["path", { d: "M8 21h8" }],
    ["circle", { cx: "18", cy: "6", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-dot.mjs
  var MonitorDot = [
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M22 12.307V15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8.693" }],
    ["path", { d: "M8 21h8" }],
    ["circle", { cx: "19", cy: "6", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-down.mjs
  var MonitorDown = [
    ["path", { d: "M12 13V7" }],
    ["path", { d: "m15 10-3 3-3-3" }],
    ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }],
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M8 21h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-pause.mjs
  var MonitorPause = [
    ["path", { d: "M10 13V7" }],
    ["path", { d: "M14 13V7" }],
    ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }],
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M8 21h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-off.mjs
  var MonitorOff = [
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M17 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 1.184-1.826" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M8 21h8" }],
    ["path", { d: "M8.656 3H20a2 2 0 0 1 2 2v10a2 2 0 0 1-.293 1.042" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-pc.mjs
  var MonitorPc = [
    ["path", { d: "M10 15H4a2 2 0 01-2-2V7a2 2 0 012-2h6" }],
    ["path", { d: "M10 19H5" }],
    ["path", { d: "M14 11h8" }],
    ["path", { d: "M14 7h8" }],
    ["path", { d: "M18 17h.01" }],
    ["path", { d: "M9 19v-4" }],
    ["rect", { x: "14", y: "3", width: "8", height: "18", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-play.mjs
  var MonitorPlay = [
    [
      "path",
      {
        d: "M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z"
      }
    ],
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M8 21h8" }],
    ["rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-smartphone.mjs
  var MonitorSmartphone = [
    ["path", { d: "M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" }],
    ["path", { d: "M10 19v-3.96 3.15" }],
    ["path", { d: "M7 19h5" }],
    ["rect", { width: "6", height: "10", x: "16", y: "12", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-speaker.mjs
  var MonitorSpeaker = [
    ["path", { d: "M5.5 20H8" }],
    ["path", { d: "M17 9h.01" }],
    ["rect", { width: "10", height: "16", x: "12", y: "4", rx: "2" }],
    ["path", { d: "M8 6H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4" }],
    ["circle", { cx: "17", cy: "15", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-stop.mjs
  var MonitorStop = [
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M8 21h8" }],
    ["rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }],
    ["rect", { x: "9", y: "7", width: "6", height: "6", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-up.mjs
  var MonitorUp = [
    ["path", { d: "m9 10 3-3 3 3" }],
    ["path", { d: "M12 13V7" }],
    ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }],
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M8 21h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor-x.mjs
  var MonitorX = [
    ["path", { d: "m14.5 12.5-5-5" }],
    ["path", { d: "m9.5 12.5 5-5" }],
    ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }],
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M8 21h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/monitor.mjs
  var Monitor = [
    ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }],
    ["line", { x1: "8", x2: "16", y1: "21", y2: "21" }],
    ["line", { x1: "12", x2: "12", y1: "17", y2: "21" }]
  ];

  // node_modules/lucide/dist/esm/icons/moon-star.mjs
  var MoonStar = [
    ["path", { d: "M18 5h4" }],
    ["path", { d: "M20 3v4" }],
    [
      "path",
      {
        d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/moon.mjs
  var Moon = [
    [
      "path",
      {
        d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/mop.mjs
  var Mop = [
    ["path", { d: "M10 22c2.761 0 5-1.79 5-4-4.42 0-4.08-5-8.5-5a1 1 0 100 9za3 3 0 01-3-3" }],
    ["path", { d: "M12.5 11.5 22 2" }],
    [
      "path",
      {
        d: "m6.98 13.02 2.665-2.664a1.21 1.21 0 011.71 0l2.29 2.288a1.21 1.21 0 010 1.712l-2.088 2.087"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/mop-sparkles.mjs
  var MopSparkles = [
    ["path", { d: "M10 22a3 3 0 01-3-3" }],
    ["path", { d: "M10 22c2.761 0 5-1.79 5-4-4.42 0-4.08-5-8.5-5a4.501 4.501 0 000 9z" }],
    ["path", { d: "M10 3H8" }],
    ["path", { d: "M12.5 11.5 22 2" }],
    ["path", { d: "M20 13v4" }],
    ["path", { d: "M22 15h-4" }],
    ["path", { d: "M4 5v4" }],
    ["path", { d: "M6 7H2" }],
    [
      "path",
      {
        d: "m6.98 13.02 2.665-2.664a1.21 1.21 0 011.71 0l2.29 2.288a1.21 1.21 0 010 1.712l-2.088 2.087"
      }
    ],
    ["path", { d: "M9 2v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/mosque.mjs
  var Mosque = [
    ["path", { d: "M12.268 2a2 2 0 003.465 2" }],
    ["path", { d: "M14 5 L14 8" }],
    ["path", { d: "M16 22v-3a2 2 0 00-4 0v3" }],
    [
      "path",
      {
        d: "M21 13c-.662-1.497-1.666-2.753-2.9-3.63C16.825 8.47 15.422 8 14 8s-2.826.47-4.1 1.37C8.668 10.248 7.663 11.504 7 13z"
      }
    ],
    ["path", { d: "M3 9h4" }],
    ["path", { d: "M7 22V6a5 5 0 00-2-4 5 5 0 00-2 4v14a2 2 0 002 2h14a2 2 0 002-2v-7" }]
  ];

  // node_modules/lucide/dist/esm/icons/motorbike.mjs
  var Motorbike = [
    ["path", { d: "m18 14-1-3" }],
    ["path", { d: "m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81" }],
    ["path", { d: "M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5" }],
    ["circle", { cx: "19", cy: "17", r: "3" }],
    ["circle", { cx: "5", cy: "17", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/mountain-snow.mjs
  var MountainSnow = [
    ["path", { d: "m8 3 4 8 5-5 5 15H2L8 3z" }],
    ["path", { d: "M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19" }]
  ];

  // node_modules/lucide/dist/esm/icons/mountain.mjs
  var Mountain = [["path", { d: "m8 3 4 8 5-5 5 15H2L8 3z" }]];

  // node_modules/lucide/dist/esm/icons/mouse-left.mjs
  var MouseLeft = [
    ["path", { d: "M12 7.318V10" }],
    ["path", { d: "M5 10v5a7 7 0 0 0 14 0V9c0-3.527-2.608-6.515-6-7" }],
    ["circle", { cx: "7", cy: "4", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/mouse-off.mjs
  var MouseOff = [
    ["path", { d: "M12 6v.343" }],
    ["path", { d: "M18.218 18.218A7 7 0 0 1 5 15V9a7 7 0 0 1 .782-3.218" }],
    ["path", { d: "M19 13.343V9A7 7 0 0 0 8.56 2.902" }],
    ["path", { d: "M22 22 2 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/mouse-pointer-2.mjs
  var MousePointer2 = [
    [
      "path",
      {
        d: "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/mouse-pointer-2-off.mjs
  var MousePointer2Off = [
    [
      "path",
      {
        d: "m15.55 8.45 5.138 2.087a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063L8.45 15.551"
      }
    ],
    ["path", { d: "M22 2 2 22" }],
    ["path", { d: "m6.816 11.528-2.779-6.84a.495.495 0 0 1 .651-.651l6.84 2.779" }]
  ];

  // node_modules/lucide/dist/esm/icons/mouse-pointer-ban.mjs
  var MousePointerBan = [
    [
      "path",
      {
        d: "M2.034 2.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.944L8.204 7.545a1 1 0 0 0-.66.66l-1.066 3.443a.5.5 0 0 1-.944.033z"
      }
    ],
    ["circle", { cx: "16", cy: "16", r: "6" }],
    ["path", { d: "m11.8 11.8 8.4 8.4" }]
  ];

  // node_modules/lucide/dist/esm/icons/mouse-pointer-click.mjs
  var MousePointerClick = [
    ["path", { d: "M14 4.1 12 6" }],
    ["path", { d: "m5.1 8-2.9-.8" }],
    ["path", { d: "m6 12-1.9 2" }],
    ["path", { d: "M7.2 2.2 8 5.1" }],
    [
      "path",
      {
        d: "M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/mouse-pointer.mjs
  var MousePointer = [
    ["path", { d: "M12.586 12.586 19 19" }],
    [
      "path",
      {
        d: "M3.688 3.037a.497.497 0 0 0-.651.651l6.5 15.999a.501.501 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/mouse-right.mjs
  var MouseRight = [
    ["path", { d: "M12 7.318V10" }],
    ["path", { d: "M19 10v5a7 7 0 0 1-14 0V9c0-3.527 2.608-6.515 6-7" }],
    ["circle", { cx: "17", cy: "4", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/mouse.mjs
  var Mouse = [
    ["rect", { x: "5", y: "2", width: "14", height: "20", rx: "7" }],
    ["path", { d: "M12 6v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/mouth-off.mjs
  var MouthOff = [
    [
      "path",
      {
        d: "M13.074 7.417a2.6 2.6 0 012.989.099c1.829 1.36 3.053 2.076 5.479 3.644a1 1 0 01.308 1.368 11.6 11.6 0 01-1.617 2.05"
      }
    ],
    ["path", { d: "M2 12a50.5 50.5 0 0010.99.99" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M21 11a1 1 0 011 1 51 51 0 01-3.734.61" }],
    [
      "path",
      {
        d: "M7.695 7.695c-1.7 1.247-2.92 1.967-5.238 3.464a1 1 0 00-.307 1.369 11.6 11.6 0 0014.766 4.388"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/mouth.mjs
  var Mouth = [
    ["path", { d: "M2 12a50.5 50.5 0 0020 0 1 1 0 00-1-1" }],
    [
      "path",
      {
        d: "M2.457 11.159a1 1 0 00-.307 1.369 11.59 11.59 0 0019.7 0 1 1 0 00-.308-1.368c-2.426-1.568-3.65-2.284-5.479-3.644a2.6 2.6 0 00-3.373.208 1 1 0 01-1.38 0 2.62 2.62 0 00-3.373-.208c-1.83 1.36-3.053 2.076-5.48 3.643"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/move-3d.mjs
  var Move3d = [
    ["path", { d: "M5 3v16h16" }],
    ["path", { d: "m5 19 6-6" }],
    ["path", { d: "m2 6 3-3 3 3" }],
    ["path", { d: "m18 16 3 3-3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-diagonal-2.mjs
  var MoveDiagonal2 = [
    ["path", { d: "M19 13v6h-6" }],
    ["path", { d: "M5 11V5h6" }],
    ["path", { d: "m5 5 14 14" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-diagonal.mjs
  var MoveDiagonal = [
    ["path", { d: "M11 19H5v-6" }],
    ["path", { d: "M13 5h6v6" }],
    ["path", { d: "M19 5 5 19" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-down-right.mjs
  var MoveDownRight = [
    ["path", { d: "M19 13V19H13" }],
    ["path", { d: "M5 5L19 19" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-down-left.mjs
  var MoveDownLeft = [
    ["path", { d: "M11 19H5V13" }],
    ["path", { d: "M19 5L5 19" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-down.mjs
  var MoveDown = [
    ["path", { d: "M8 18L12 22L16 18" }],
    ["path", { d: "M12 2V22" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-horizontal.mjs
  var MoveHorizontal = [
    ["path", { d: "m18 8 4 4-4 4" }],
    ["path", { d: "M2 12h20" }],
    ["path", { d: "m6 8-4 4 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-left.mjs
  var MoveLeft = [
    ["path", { d: "M6 8L2 12L6 16" }],
    ["path", { d: "M2 12H22" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-right.mjs
  var MoveRight = [
    ["path", { d: "M18 8L22 12L18 16" }],
    ["path", { d: "M2 12H22" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-up-left.mjs
  var MoveUpLeft = [
    ["path", { d: "M5 11V5H11" }],
    ["path", { d: "M5 5L19 19" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-up-right.mjs
  var MoveUpRight = [
    ["path", { d: "M13 5H19V11" }],
    ["path", { d: "M19 5L5 19" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-up.mjs
  var MoveUp = [
    ["path", { d: "M8 6L12 2L16 6" }],
    ["path", { d: "M12 2V22" }]
  ];

  // node_modules/lucide/dist/esm/icons/move-vertical.mjs
  var MoveVertical = [
    ["path", { d: "M12 2v20" }],
    ["path", { d: "m8 18 4 4 4-4" }],
    ["path", { d: "m8 6 4-4 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/move.mjs
  var Move = [
    ["path", { d: "M12 2v20" }],
    ["path", { d: "m15 19-3 3-3-3" }],
    ["path", { d: "m19 9 3 3-3 3" }],
    ["path", { d: "M2 12h20" }],
    ["path", { d: "m5 9-3 3 3 3" }],
    ["path", { d: "m9 5 3-3 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/navigation-2-off.mjs
  var Navigation2Off = [
    ["path", { d: "M9.31 9.31 5 21l7-4 7 4-1.17-3.17" }],
    ["path", { d: "M14.53 8.88 12 2l-1.17 3.17" }],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
  ];

  // node_modules/lucide/dist/esm/icons/navigation-2.mjs
  var Navigation2 = [["polygon", { points: "12 2 19 21 12 17 5 21 12 2" }]];

  // node_modules/lucide/dist/esm/icons/navigation-off.mjs
  var NavigationOff = [
    ["path", { d: "M8.43 8.43 3 11l8 2 2 8 2.57-5.43" }],
    ["path", { d: "M17.39 11.73 22 2l-9.73 4.61" }],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
  ];

  // node_modules/lucide/dist/esm/icons/nepali-rupee.mjs
  var NepaliRupee = [
    ["path", { d: "m14 20-8-8h4c5.333 0 5.333-8 0-8" }],
    ["path", { d: "M14 8c4.078 0 5.038 4.678 2.88 6.88" }],
    ["path", { d: "M6 4h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/navigation.mjs
  var Navigation = [["polygon", { points: "3 11 22 2 13 21 11 13 3 11" }]];

  // node_modules/lucide/dist/esm/icons/network.mjs
  var Network = [
    ["rect", { x: "16", y: "16", width: "6", height: "6", rx: "1" }],
    ["rect", { x: "2", y: "16", width: "6", height: "6", rx: "1" }],
    ["rect", { x: "9", y: "2", width: "6", height: "6", rx: "1" }],
    ["path", { d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" }],
    ["path", { d: "M12 12V8" }]
  ];

  // node_modules/lucide/dist/esm/icons/newspaper.mjs
  var Newspaper = [
    ["path", { d: "M15 18h-5" }],
    ["path", { d: "M18 14h-8" }],
    [
      "path",
      {
        d: "M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2"
      }
    ],
    ["rect", { width: "8", height: "4", x: "10", y: "6", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/nfc.mjs
  var Nfc = [
    ["path", { d: "M6 8.32a7.43 7.43 0 0 1 0 7.36" }],
    ["path", { d: "M9.46 6.21a11.76 11.76 0 0 1 0 11.58" }],
    ["path", { d: "M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" }],
    ["path", { d: "M16.37 2a20.16 20.16 0 0 1 0 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/non-binary.mjs
  var NonBinary = [
    ["path", { d: "M12 2v10" }],
    ["path", { d: "m8.5 4 7 4" }],
    ["path", { d: "m8.5 8 7-4" }],
    ["circle", { cx: "12", cy: "17", r: "5" }]
  ];

  // node_modules/lucide/dist/esm/icons/notebook-dot.mjs
  var NotebookDot = [
    ["path", { d: "M16 11.75V22" }],
    ["path", { d: "M2 10h4" }],
    ["path", { d: "M2 14h4" }],
    ["path", { d: "M2 18h4" }],
    ["path", { d: "M2 6h4" }],
    ["path", { d: "M20 11.75V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h5.65" }],
    ["circle", { cx: "18", cy: "5", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/notebook-pen.mjs
  var NotebookPen = [
    ["path", { d: "M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" }],
    ["path", { d: "M2 6h4" }],
    ["path", { d: "M2 10h4" }],
    ["path", { d: "M2 14h4" }],
    ["path", { d: "M2 18h4" }],
    [
      "path",
      {
        d: "M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/notebook-tabs.mjs
  var NotebookTabs = [
    ["path", { d: "M2 6h4" }],
    ["path", { d: "M2 10h4" }],
    ["path", { d: "M2 14h4" }],
    ["path", { d: "M2 18h4" }],
    ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2" }],
    ["path", { d: "M15 2v20" }],
    ["path", { d: "M15 7h5" }],
    ["path", { d: "M15 12h5" }],
    ["path", { d: "M15 17h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/notebook-text.mjs
  var NotebookText = [
    ["path", { d: "M2 6h4" }],
    ["path", { d: "M2 10h4" }],
    ["path", { d: "M2 14h4" }],
    ["path", { d: "M2 18h4" }],
    ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2" }],
    ["path", { d: "M9.5 8h5" }],
    ["path", { d: "M9.5 12H16" }],
    ["path", { d: "M9.5 16H14" }]
  ];

  // node_modules/lucide/dist/esm/icons/notebook.mjs
  var Notebook = [
    ["path", { d: "M2 6h4" }],
    ["path", { d: "M2 10h4" }],
    ["path", { d: "M2 14h4" }],
    ["path", { d: "M2 18h4" }],
    ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2" }],
    ["path", { d: "M16 2v20" }]
  ];

  // node_modules/lucide/dist/esm/icons/notepad-text-dashed.mjs
  var NotepadTextDashed = [
    ["path", { d: "M8 2v4" }],
    ["path", { d: "M12 2v4" }],
    ["path", { d: "M16 2v4" }],
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M20 12v2" }],
    ["path", { d: "M20 18v2a2 2 0 0 1-2 2h-1" }],
    ["path", { d: "M13 22h-2" }],
    ["path", { d: "M7 22H6a2 2 0 0 1-2-2v-2" }],
    ["path", { d: "M4 14v-2" }],
    ["path", { d: "M4 8V6a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M8 10h6" }],
    ["path", { d: "M8 14h8" }],
    ["path", { d: "M8 18h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/notepad-text.mjs
  var NotepadText = [
    ["path", { d: "M8 2v4" }],
    ["path", { d: "M12 2v4" }],
    ["path", { d: "M16 2v4" }],
    ["rect", { width: "16", height: "18", x: "4", y: "4", rx: "2" }],
    ["path", { d: "M8 10h6" }],
    ["path", { d: "M8 14h8" }],
    ["path", { d: "M8 18h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/numbers.mjs
  var Numbers = [
    ["path", { d: "m10 4 2.6-1.95a.25.25 0 01.4.2V10" }],
    ["path", { d: "M16 14.535A4 4 0 0118 14a2 2 0 010 4 2 2 0 010 4 4 4 0 01-2-.535" }],
    ["path", { d: "M8 22H4.5a.5.5 0 01-.5-.5c0-2.68 4-2.932 4-5.5a2 2 0 00-2-2 2.5 2.5 0 00-2 1" }]
  ];

  // node_modules/lucide/dist/esm/icons/nut.mjs
  var Nut = [
    [
      "path",
      {
        d: "M16.847 5.847 20 9a7.23 7.23 0 011.551 7.516C21.241 17.352 21 17.932 21 19v1a1 1 0 01-1 1h-1c-1.069 0-1.648.242-2.485.552A7.2 7.2 0 019.002 20l-3.155-3.153"
      }
    ],
    [
      "path",
      {
        d: "M18.21 5.43c-1.71.69-5.07 1.07-6.71 1.07.46 1.38.91 2.74.61 4.88a.88.88 0 01-.73.74c-1.78.28-3.54-.17-4.88-.62 0 1.64-.38 5-1.07 6.71-.21.52-.82.55-1.17.12A10 10 0 0118.33 4.26c.43.35.4.97-.12 1.17"
      }
    ],
    ["path", { d: "M4.93 4.93 3 3a.7.7 0 010-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/nut-off.mjs
  var NutOff = [
    [
      "path",
      {
        d: "M11.868 11.868a.88.88 0 01-.488.252c-1.78.28-3.54-.17-4.88-.62 0 1.272-.229 3.578-.653 5.347a10 10 0 01-.417 1.363c-.21.52-.82.55-1.17.12a10 10 0 01.677-13.393"
      }
    ],
    ["path", { d: "M12.14 6.485a27.4 27.4 0 004.707-.638L20 9a7.23 7.23 0 011.706 7.05" }],
    ["path", { d: "m2 2 20 20" }],
    [
      "path",
      {
        d: "M20.707 20.707A1 1 0 0120 21h-1c-1.069 0-1.648.242-2.485.552A7.2 7.2 0 019.002 20l-3.155-3.153"
      }
    ],
    ["path", { d: "M8.356 2.7a10 10 0 019.974 1.56c.43.35.4.97-.12 1.17a10 10 0 01-1.363.417" }]
  ];

  // node_modules/lucide/dist/esm/icons/octagon-exclamation-point.mjs
  var OctagonExclamationPoint = [
    ["path", { d: "M12 16h.01" }],
    ["path", { d: "M12 8v4" }],
    [
      "path",
      {
        d: "M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/octagon-pause.mjs
  var OctagonPause = [
    ["path", { d: "M10 15V9" }],
    ["path", { d: "M14 15V9" }],
    [
      "path",
      {
        d: "M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/octagon-minus.mjs
  var OctagonMinus = [
    [
      "path",
      {
        d: "M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z"
      }
    ],
    ["path", { d: "M8 12h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/octagon-x.mjs
  var OctagonX = [
    ["path", { d: "m15 9-6 6" }],
    [
      "path",
      {
        d: "M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z"
      }
    ],
    ["path", { d: "m9 9 6 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/octagon.mjs
  var Octagon = [
    [
      "path",
      {
        d: "M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/omega.mjs
  var Omega = [
    [
      "path",
      {
        d: "M3 20h4.5a.5.5 0 0 0 .5-.5v-.282a.52.52 0 0 0-.247-.437 8 8 0 1 1 8.494-.001.52.52 0 0 0-.247.438v.282a.5.5 0 0 0 .5.5H21"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/opacity.mjs
  var Opacity = [
    ["path", { d: "M12 3h.01" }],
    ["path", { d: "M12 9h.01" }],
    ["path", { d: "M15 6h.01" }],
    ["path", { d: "M18 3h.01" }],
    ["path", { d: "M21 6v13a2 2 0 0 1-2 2H6" }],
    ["path", { d: "M3 12h.01" }],
    ["path", { d: "M3 18h.01" }],
    ["path", { d: "M3 6h.01" }],
    ["path", { d: "M6 15h.01" }],
    ["path", { d: "M6 3h.01" }],
    ["path", { d: "M6 9h.01" }],
    ["path", { d: "M9 12h.01" }],
    ["path", { d: "M9 6h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/option.mjs
  var Option = [
    ["path", { d: "M14 3h7" }],
    ["path", { d: "M3 3h5.28a1 1 0 0 1 .948.684l5.544 16.632a1 1 0 0 0 .949.684H21" }]
  ];

  // node_modules/lucide/dist/esm/icons/orbit.mjs
  var Orbit = [
    ["path", { d: "M20.341 6.484A10 10 0 0 1 10.266 21.85" }],
    ["path", { d: "M3.659 17.516A10 10 0 0 1 13.74 2.152" }],
    ["circle", { cx: "12", cy: "12", r: "3" }],
    ["circle", { cx: "19", cy: "5", r: "2" }],
    ["circle", { cx: "5", cy: "19", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/origami.mjs
  var Origami = [
    ["path", { d: "M12 12V4a1 1 0 0 1 1-1h6.297a1 1 0 0 1 .651 1.759l-4.696 4.025" }],
    [
      "path",
      { d: "m12 21-7.414-7.414A2 2 0 0 1 4 12.172V6.415a1.002 1.002 0 0 1 1.707-.707L20 20.009" }
    ],
    [
      "path",
      {
        d: "m12.214 3.381 8.414 14.966a1 1 0 0 1-.167 1.199l-1.168 1.163a1 1 0 0 1-.706.291H6.351a1 1 0 0 1-.625-.219L3.25 18.8a1 1 0 0 1 .631-1.781l4.165.027"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/package-check.mjs
  var PackageCheck = [
    ["path", { d: "M12 22V12" }],
    ["path", { d: "m16 17 2 2 4-4" }],
    [
      "path",
      {
        d: "M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753"
      }
    ],
    ["path", { d: "M3.29 7 12 12l8.71-5" }],
    ["path", { d: "m7.5 4.27 8.997 5.148" }]
  ];

  // node_modules/lucide/dist/esm/icons/package-2.mjs
  var Package2 = [
    ["path", { d: "M12 3v6" }],
    [
      "path",
      {
        d: "M16.76 3a2 2 0 0 1 1.8 1.1l2.23 4.479a2 2 0 0 1 .21.891V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.472a2 2 0 0 1 .211-.894L5.45 4.1A2 2 0 0 1 7.24 3z"
      }
    ],
    ["path", { d: "M3.054 9.013h17.893" }]
  ];

  // node_modules/lucide/dist/esm/icons/package-minus.mjs
  var PackageMinus = [
    ["path", { d: "M12 22V12" }],
    ["path", { d: "M16 17h6" }],
    [
      "path",
      {
        d: "M21 13V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.675-.955"
      }
    ],
    ["path", { d: "M3.29 7 12 12l8.71-5" }],
    ["path", { d: "m7.5 4.27 8.997 5.148" }]
  ];

  // node_modules/lucide/dist/esm/icons/package-open.mjs
  var PackageOpen = [
    ["path", { d: "M12 22v-9" }],
    [
      "path",
      {
        d: "M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z"
      }
    ],
    [
      "path",
      {
        d: "M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13"
      }
    ],
    [
      "path",
      {
        d: "M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/package-pen.mjs
  var PackagePen = [
    ["path", { d: "M12 14.34V12l8.71-5" }],
    [
      "path",
      {
        d: "M16.511 21.141a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 1 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .599.626z"
      }
    ],
    [
      "path",
      {
        d: "M21 9.114V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l5.087 2.907"
      }
    ],
    ["path", { d: "M3.29 7 12 12" }],
    ["path", { d: "m7.5 4.27 9 5.15" }]
  ];

  // node_modules/lucide/dist/esm/icons/package-plus.mjs
  var PackagePlus = [
    ["path", { d: "M12 22V12" }],
    ["path", { d: "M16 17h6" }],
    ["path", { d: "M19 14v6" }],
    [
      "path",
      {
        d: "M21 10.535V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.675-.955"
      }
    ],
    ["path", { d: "M3.29 7 12 12l8.71-5" }],
    ["path", { d: "m7.5 4.27 8.997 5.148" }]
  ];

  // node_modules/lucide/dist/esm/icons/package-question-mark.mjs
  var PackageQuestionMark = [
    ["path", { d: "M12 22V12l8.71-5" }],
    ["path", { d: "M17 15.27c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2" }],
    ["path", { d: "M19 21.99h.01" }],
    [
      "path",
      {
        d: "M21 10.342V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2.33-1.332"
      }
    ],
    ["path", { d: "M3.29 7 12 12" }],
    ["path", { d: "m7.5 4.27 9 5.15" }]
  ];

  // node_modules/lucide/dist/esm/icons/package-search.mjs
  var PackageSearch = [
    ["path", { d: "M12 22V12" }],
    ["path", { d: "M20.27 18.27 22 20" }],
    [
      "path",
      {
        d: "M21 10.498V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l.98-.559"
      }
    ],
    ["path", { d: "M3.29 7 12 12l8.71-5" }],
    ["path", { d: "m7.5 4.27 8.997 5.148" }],
    ["circle", { cx: "18.5", cy: "16.5", r: "2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/package-x.mjs
  var PackageX = [
    ["path", { d: "M12 22V12" }],
    ["path", { d: "m16.5 14.5 5 5" }],
    ["path", { d: "m16.5 19.5 5-5" }],
    [
      "path",
      {
        d: "M21 10.5V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l.13-.074"
      }
    ],
    ["path", { d: "M3.29 7 12 12l8.71-5" }],
    ["path", { d: "m7.5 4.27 8.997 5.148" }]
  ];

  // node_modules/lucide/dist/esm/icons/package.mjs
  var Package = [
    [
      "path",
      {
        d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
      }
    ],
    ["path", { d: "M12 22V12" }],
    ["polyline", { points: "3.29 7 12 12 20.71 7" }],
    ["path", { d: "m7.5 4.27 9 5.15" }]
  ];

  // node_modules/lucide/dist/esm/icons/paint-bucket.mjs
  var PaintBucket = [
    ["path", { d: "M11 7 6 2" }],
    ["path", { d: "M18.992 12H2.041" }],
    [
      "path",
      {
        d: "M21.145 18.38A3.34 3.34 0 0 1 20 16.5a3.3 3.3 0 0 1-1.145 1.88c-.575.46-.855 1.02-.855 1.595A2 2 0 0 0 20 22a2 2 0 0 0 2-2.025c0-.58-.285-1.13-.855-1.595"
      }
    ],
    [
      "path",
      {
        d: "m8.5 4.5 2.148-2.148a1.205 1.205 0 0 1 1.704 0l7.296 7.296a1.205 1.205 0 0 1 0 1.704l-7.592 7.592a3.615 3.615 0 0 1-5.112 0l-3.888-3.888a3.615 3.615 0 0 1 0-5.112L5.67 7.33"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/paint-roller.mjs
  var PaintRoller = [
    ["rect", { width: "16", height: "6", x: "2", y: "2", rx: "2" }],
    ["path", { d: "M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" }],
    ["rect", { width: "4", height: "6", x: "8", y: "16", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/paintbrush-vertical.mjs
  var PaintbrushVertical = [
    ["path", { d: "M10 2v2" }],
    ["path", { d: "M14 2v4" }],
    ["path", { d: "M17 2a1 1 0 0 1 1 1v9H6V3a1 1 0 0 1 1-1z" }],
    [
      "path",
      {
        d: "M6 12a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2h2a1 1 0 0 1 1 1v2.9a2 2 0 1 0 4 0V17a1 1 0 0 1 1-1h2a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/paintbrush.mjs
  var Paintbrush = [
    ["path", { d: "m14.622 17.897-10.68-2.913" }],
    [
      "path",
      {
        d: "M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z"
      }
    ],
    [
      "path",
      {
        d: "M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/palette.mjs
  var Palette = [
    [
      "path",
      {
        d: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"
      }
    ],
    ["circle", { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor" }],
    ["circle", { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor" }],
    ["circle", { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor" }],
    ["circle", { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor" }]
  ];

  // node_modules/lucide/dist/esm/icons/panda.mjs
  var Panda = [
    ["path", { d: "M11.25 17.25h1.5L12 18z" }],
    ["path", { d: "m15 12 2 2" }],
    ["path", { d: "M17.902 6.599a8 8 0 0 0-.5-.5" }],
    [
      "path",
      {
        d: "M2 14.5C2 19.47 6.48 22 12 22s10-2.53 10-7.5a10 10 0 0 0-1.3-4.83 4.5 4.5 0 1 0-7.05-5.5 8 8 0 0 0-3.3 0 4.5 4.5 0 1 0-7.04 5.5A10 10 0 0 0 2 14.5"
      }
    ],
    ["path", { d: "M6.099 6.599a8 8 0 0 1 .5-.5" }],
    ["path", { d: "m9 12-2 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-bottom-close.mjs
  var PanelBottomClose = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 15h18" }],
    ["path", { d: "m15 8-3 3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-bottom-dashed.mjs
  var PanelBottomDashed = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M14 15h1" }],
    ["path", { d: "M19 15h2" }],
    ["path", { d: "M3 15h2" }],
    ["path", { d: "M9 15h1" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-bottom-open.mjs
  var PanelBottomOpen = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 15h18" }],
    ["path", { d: "m9 10 3-3 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-bottom.mjs
  var PanelBottom = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 15h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-left-close.mjs
  var PanelLeftClose = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M9 3v18" }],
    ["path", { d: "m16 15-3-3 3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-left-dashed.mjs
  var PanelLeftDashed = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M9 14v1" }],
    ["path", { d: "M9 19v2" }],
    ["path", { d: "M9 3v2" }],
    ["path", { d: "M9 9v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-left-open.mjs
  var PanelLeftOpen = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M9 3v18" }],
    ["path", { d: "m14 9 3 3-3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-left-right-dashed.mjs
  var PanelLeftRightDashed = [
    ["path", { d: "M15 10V9" }],
    ["path", { d: "M15 15v-1" }],
    ["path", { d: "M15 21v-2" }],
    ["path", { d: "M15 5V3" }],
    ["path", { d: "M9 10V9" }],
    ["path", { d: "M9 15v-1" }],
    ["path", { d: "M9 21v-2" }],
    ["path", { d: "M9 5V3" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-left.mjs
  var PanelLeft = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M9 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-right-close.mjs
  var PanelRightClose = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M15 3v18" }],
    ["path", { d: "m8 9 3 3-3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-right-dashed.mjs
  var PanelRightDashed = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M15 14v1" }],
    ["path", { d: "M15 19v2" }],
    ["path", { d: "M15 3v2" }],
    ["path", { d: "M15 9v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-right-open.mjs
  var PanelRightOpen = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M15 3v18" }],
    ["path", { d: "m10 15-3-3 3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-right.mjs
  var PanelRight = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M15 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-top-bottom-dashed.mjs
  var PanelTopBottomDashed = [
    ["path", { d: "M14 15h1" }],
    ["path", { d: "M14 9h1" }],
    ["path", { d: "M19 15h2" }],
    ["path", { d: "M19 9h2" }],
    ["path", { d: "M3 15h2" }],
    ["path", { d: "M3 9h2" }],
    ["path", { d: "M9 15h1" }],
    ["path", { d: "M9 9h1" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-top-close.mjs
  var PanelTopClose = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "m9 16 3-3 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-top-dashed.mjs
  var PanelTopDashed = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M14 9h1" }],
    ["path", { d: "M19 9h2" }],
    ["path", { d: "M3 9h2" }],
    ["path", { d: "M9 9h1" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-top-open.mjs
  var PanelTopOpen = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "m15 14-3 3-3-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/panel-top.mjs
  var PanelTop = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 9h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/panels-right-bottom.mjs
  var PanelsRightBottom = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 15h12" }],
    ["path", { d: "M15 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/panels-left-bottom.mjs
  var PanelsLeftBottom = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M9 3v18" }],
    ["path", { d: "M9 15h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/panels-top-left.mjs
  var PanelsTopLeft = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M9 21V9" }]
  ];

  // node_modules/lucide/dist/esm/icons/paper-bag.mjs
  var PaperBag = [
    [
      "path",
      {
        d: "M5.364 3.848C4 6 3 9.652 3 12.652V19a2 2 0 002 2h14a2 2 0 002-2v-5c0-2.334-1.816-4.668-2.622-7.002"
      }
    ],
    [
      "path",
      {
        d: "M7 3h11.379a2 2 0 011.789 1.106l.723 1.447A1 1 0 0119.997 7h-8.525a2 2 0 01-1.789-1.106L8.79 4.105a2 2 0 10-3.579 1.789l2.261 4.522A5 5 0 018 12.652V21"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/paperclip.mjs
  var Paperclip = [
    [
      "path",
      {
        d: "m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/parasol.mjs
  var Parasol = [
    ["path", { d: "M12.5 11.134 18.196 21" }],
    [
      "path",
      {
        d: "M20.425 5.299a10 10 0 0 0-16.941 9.78c.183.563.843.774 1.355.478L20.16 6.711c.512-.296.66-.973.264-1.413"
      }
    ],
    ["path", { d: "M21 21H3" }]
  ];

  // node_modules/lucide/dist/esm/icons/parentheses.mjs
  var Parentheses = [
    ["path", { d: "M8 21s-4-3-4-9 4-9 4-9" }],
    ["path", { d: "M16 3s4 3 4 9-4 9-4 9" }]
  ];

  // node_modules/lucide/dist/esm/icons/park.mjs
  var Park = [
    ["path", { d: "M12 18h10" }],
    ["path", { d: "M13.248 9.998A4.5 4.5 0 0 0 11.75 8.6V8a1 1 0 0 0-7.5 0 4.9 4.9 0 0 0 2.25 9H8" }],
    ["path", { d: "m15 14-2 6" }],
    ["path", { d: "m19 14 2 6" }],
    ["path", { d: "M21 14h-8" }],
    ["path", { d: "M8 20v-5.922a2 2 0 0 0-.586-1.414L6.5 11.75" }],
    ["path", { d: "M9.205 12.795 8 14" }],
    ["circle", { cx: "19", cy: "6", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/parking-meter.mjs
  var ParkingMeter = [
    ["path", { d: "M11 15h2" }],
    ["path", { d: "M12 12v3" }],
    ["path", { d: "M12 19v3" }],
    [
      "path",
      {
        d: "M15.282 19a1 1 0 0 0 .948-.68l2.37-6.988a7 7 0 1 0-13.2 0l2.37 6.988a1 1 0 0 0 .948.68z"
      }
    ],
    ["path", { d: "M9 9a3 3 0 1 1 6 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/pause.mjs
  var Pause = [
    ["rect", { x: "14", y: "3", width: "5", height: "18", rx: "1" }],
    ["rect", { x: "5", y: "3", width: "5", height: "18", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/party-popper.mjs
  var PartyPopper = [
    ["path", { d: "M5.8 11.3 2 22l10.7-3.79" }],
    ["path", { d: "M4 3h.01" }],
    ["path", { d: "M22 8h.01" }],
    ["path", { d: "M15 2h.01" }],
    ["path", { d: "M22 20h.01" }],
    [
      "path",
      {
        d: "m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"
      }
    ],
    ["path", { d: "m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" }],
    ["path", { d: "m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" }],
    [
      "path",
      {
        d: "M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/paw-print.mjs
  var PawPrint = [
    ["circle", { cx: "11", cy: "4", r: "2" }],
    ["circle", { cx: "18", cy: "8", r: "2" }],
    ["circle", { cx: "20", cy: "16", r: "2" }],
    [
      "path",
      {
        d: "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/pc-case.mjs
  var PcCase = [
    ["rect", { width: "14", height: "20", x: "5", y: "2", rx: "2" }],
    ["path", { d: "M15 14h.01" }],
    ["path", { d: "M9 6h6" }],
    ["path", { d: "M9 10h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/pen-line.mjs
  var PenLine = [
    ["path", { d: "M13 21h8" }],
    [
      "path",
      {
        d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/pen-off.mjs
  var PenOff = [
    [
      "path",
      {
        d: "m10 10-6.157 6.162a2 2 0 0 0-.5.833l-1.322 4.36a.5.5 0 0 0 .622.624l4.358-1.323a2 2 0 0 0 .83-.5L14 13.982"
      }
    ],
    ["path", { d: "m12.829 7.172 4.359-4.346a1 1 0 1 1 3.986 3.986l-4.353 4.353" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/pen-tool.mjs
  var PenTool = [
    [
      "path",
      {
        d: "m18 13-.654-4.736a4 4 0 00-2.756-3.266l-9.163-2.9a2 2 0 00-2.017.493l-.82.819a2 2 0 00-.492 2.017l2.9 9.163a4 4 0 003.266 2.756L13 18"
      }
    ],
    [
      "path",
      {
        d: "M18.648 12.352a1.205 1.205 0 011.704 0l1.296 1.296a1.205 1.205 0 010 1.704l-6.296 6.296a1.205 1.205 0 01-1.704 0l-1.296-1.296a1.205 1.205 0 010-1.704z"
      }
    ],
    ["path", { d: "m3 3 6.586 6.586" }],
    ["circle", { cx: "11", cy: "11", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/pen.mjs
  var Pen = [
    [
      "path",
      {
        d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/pencil-line.mjs
  var PencilLine = [
    ["path", { d: "M13 21h8" }],
    ["path", { d: "m15 5 4 4" }],
    [
      "path",
      {
        d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/pencil-off.mjs
  var PencilOff = [
    [
      "path",
      {
        d: "m10 10-6.157 6.162a2 2 0 0 0-.5.833l-1.322 4.36a.5.5 0 0 0 .622.624l4.358-1.323a2 2 0 0 0 .83-.5L14 13.982"
      }
    ],
    ["path", { d: "m12.829 7.172 4.359-4.346a1 1 0 1 1 3.986 3.986l-4.353 4.353" }],
    ["path", { d: "m15 5 4 4" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/pencil-ruler.mjs
  var PencilRuler = [
    ["path", { d: "M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" }],
    ["path", { d: "m8 6 2-2" }],
    ["path", { d: "m18 16 2-2" }],
    ["path", { d: "m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17" }],
    [
      "path",
      {
        d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      }
    ],
    ["path", { d: "m15 5 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/pencil-sparkles.mjs
  var PencilSparkles = [
    ["path", { d: "M10 3H8" }],
    ["path", { d: "m15.007 5.008 3.987 3.986" }],
    ["path", { d: "M20 15v4" }],
    [
      "path",
      {
        d: "M21.174 6.813a2.82 2.82 0 0 0-3.986-3.987L3.842 16.175a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      }
    ],
    ["path", { d: "M22 17h-4" }],
    ["path", { d: "M4 5v4" }],
    ["path", { d: "M6 7H2" }],
    ["path", { d: "M9 2v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/pencil.mjs
  var Pencil = [
    [
      "path",
      {
        d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      }
    ],
    ["path", { d: "m15 5 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/pentagon.mjs
  var Pentagon = [
    [
      "path",
      {
        d: "M10.83 2.38a2 2 0 0 1 2.34 0l8 5.74a2 2 0 0 1 .73 2.25l-3.04 9.26a2 2 0 0 1-1.9 1.37H7.04a2 2 0 0 1-1.9-1.37L2.1 10.37a2 2 0 0 1 .73-2.25z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/percent.mjs
  var Percent = [
    ["line", { x1: "19", x2: "5", y1: "5", y2: "19" }],
    ["circle", { cx: "6.5", cy: "6.5", r: "2.5" }],
    ["circle", { cx: "17.5", cy: "17.5", r: "2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/perfume-bottle.mjs
  var PerfumeBottle = [
    ["path", { d: "M 5 22 H 11.072" }],
    ["path", { d: "M15 5 C 23 4 23.328 12.676 20 14.536" }],
    ["path", { d: "M15.802 10.308 C 14.776 9.465 14 8.496 14 7" }],
    ["path", { d: "M2 2h.01" }],
    ["path", { d: "M2 7h.01" }],
    ["path", { d: "M5 4.5h.01" }],
    ["path", { d: "M8.127 22 A 8 8 0 0 1 4 15 3 3 0 0 1 4.879 12.879C 6.879 10.879 10 10 10 7" }],
    ["circle", { cx: "18", cy: "18", r: "4" }],
    ["rect", { x: "9", y: "2", width: "6", height: "5", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/person-standing.mjs
  var PersonStanding = [
    ["circle", { cx: "12", cy: "5", r: "1" }],
    ["path", { d: "m9 20 3-6 3 6" }],
    ["path", { d: "m6 8 6 2 6-2" }],
    ["path", { d: "M12 10v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/phi.mjs
  var Phi = [
    ["path", { d: "M12 2v20" }],
    ["circle", { cx: "12", cy: "12", r: "7" }]
  ];

  // node_modules/lucide/dist/esm/icons/philippine-peso.mjs
  var PhilippinePeso = [
    ["path", { d: "M4 12h16" }],
    ["path", { d: "M4 8h16" }],
    ["path", { d: "M6 20V5a1 1 0 011-1h5a6 6 0 010 12H6" }]
  ];

  // node_modules/lucide/dist/esm/icons/phone-call.mjs
  var PhoneCall = [
    ["path", { d: "M13 2a9 9 0 0 1 9 9" }],
    ["path", { d: "M13 6a5 5 0 0 1 5 5" }],
    [
      "path",
      {
        d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/phone-forwarded.mjs
  var PhoneForwarded = [
    ["path", { d: "M14 6h8" }],
    ["path", { d: "m18 2 4 4-4 4" }],
    [
      "path",
      {
        d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/phone-incoming.mjs
  var PhoneIncoming = [
    ["path", { d: "M16 2v6h6" }],
    ["path", { d: "m22 2-6 6" }],
    [
      "path",
      {
        d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/phone-log.mjs
  var PhoneLog = [
    [
      "path",
      {
        d: "M13.832 16.568a1 1 0 001.213-.303l.355-.465A2 2 0 0117 15h3a2 2 0 012 2v3a2 2 0 01-2 2A18 18 0 012 4a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-.8 1.6l-.468.351a1 1 0 00-.292 1.233 14 14 0 006.392 6.384"
      }
    ],
    ["path", { d: "M14.396 4.171h7.171" }],
    ["path", { d: "M17.343 8.17h4.224" }]
  ];

  // node_modules/lucide/dist/esm/icons/phone-missed.mjs
  var PhoneMissed = [
    ["path", { d: "m16 2 6 6" }],
    ["path", { d: "m22 2-6 6" }],
    [
      "path",
      {
        d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/phone-off.mjs
  var PhoneOff = [
    [
      "path",
      {
        d: "M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272"
      }
    ],
    ["path", { d: "M22 2 2 22" }],
    [
      "path",
      {
        d: "M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/phone-outgoing.mjs
  var PhoneOutgoing = [
    ["path", { d: "m16 8 6-6" }],
    ["path", { d: "M22 8V2h-6" }],
    [
      "path",
      {
        d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/pi.mjs
  var Pi = [
    ["line", { x1: "9", x2: "9", y1: "4", y2: "20" }],
    ["path", { d: "M4 7c0-1.7 1.3-3 3-3h13" }],
    ["path", { d: "M18 20c-1.7 0-3-1.3-3-3V4" }]
  ];

  // node_modules/lucide/dist/esm/icons/phone.mjs
  var Phone = [
    [
      "path",
      {
        d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/piano.mjs
  var Piano = [
    ["path", { d: "M10 13v4" }],
    ["path", { d: "M14 13v4" }],
    ["path", { d: "M18 13v4" }],
    ["path", { d: "M2 13h20" }],
    [
      "path",
      {
        d: "M22 11.5A3.5 3.5 0 0018.5 8a3.52 3.52 0 01-3.173-2A7 7 0 002 9v10a2 2 0 002 2h16a2 2 0 002-2z"
      }
    ],
    ["path", { d: "M6 13v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/pickaxe.mjs
  var Pickaxe = [
    ["path", { d: "m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999" }],
    [
      "path",
      {
        d: "M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024"
      }
    ],
    [
      "path",
      {
        d: "M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069"
      }
    ],
    [
      "path",
      {
        d: "M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/picture-in-picture-2.mjs
  var PictureInPicture2 = [
    ["path", { d: "M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4" }],
    ["rect", { width: "10", height: "7", x: "12", y: "13", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/picture-in-picture.mjs
  var PictureInPicture = [
    ["path", { d: "M2 10h6V4" }],
    ["path", { d: "m2 4 6 6" }],
    ["path", { d: "M21 10V7a2 2 0 0 0-2-2h-7" }],
    ["path", { d: "M3 14v2a2 2 0 0 0 2 2h3" }],
    ["rect", { x: "12", y: "14", width: "10", height: "7", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/piggy-bank.mjs
  var PiggyBank = [
    [
      "path",
      {
        d: "M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z"
      }
    ],
    ["path", { d: "M16 10h.01" }],
    ["path", { d: "M2 8v1a2 2 0 0 0 2 2h1" }]
  ];

  // node_modules/lucide/dist/esm/icons/pilcrow-left.mjs
  var PilcrowLeft = [
    ["path", { d: "M14 3v11" }],
    ["path", { d: "M14 9h-3a3 3 0 0 1 0-6h9" }],
    ["path", { d: "M18 3v11" }],
    ["path", { d: "M22 18H2l4-4" }],
    ["path", { d: "m6 22-4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/pilcrow-right.mjs
  var PilcrowRight = [
    ["path", { d: "M10 3v11" }],
    ["path", { d: "M10 9H7a1 1 0 0 1 0-6h8" }],
    ["path", { d: "M14 3v11" }],
    ["path", { d: "m18 14 4 4H2" }],
    ["path", { d: "m22 18-4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/pilcrow.mjs
  var Pilcrow = [
    ["path", { d: "M13 4v16" }],
    ["path", { d: "M17 4v16" }],
    ["path", { d: "M19 4H9.5a4.5 4.5 0 0 0 0 9H13" }]
  ];

  // node_modules/lucide/dist/esm/icons/pill-bottle.mjs
  var PillBottle = [
    ["path", { d: "M18 11h-4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h4" }],
    ["path", { d: "M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" }],
    ["rect", { width: "16", height: "5", x: "4", y: "2", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/pill.mjs
  var Pill = [
    ["path", { d: "m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" }],
    ["path", { d: "m8.5 8.5 7 7" }]
  ];

  // node_modules/lucide/dist/esm/icons/pin-off.mjs
  var PinOff = [
    ["path", { d: "M12 17v5" }],
    ["path", { d: "M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11" }]
  ];

  // node_modules/lucide/dist/esm/icons/pipette.mjs
  var Pipette = [
    [
      "path",
      {
        d: "m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12"
      }
    ],
    ["path", { d: "m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z" }],
    ["path", { d: "m2 22 .414-.414" }]
  ];

  // node_modules/lucide/dist/esm/icons/pin.mjs
  var Pin = [
    ["path", { d: "M12 17v5" }],
    [
      "path",
      {
        d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/pizza.mjs
  var Pizza = [
    ["path", { d: "m12 14-1 1" }],
    ["path", { d: "m13.75 18.25-1.25 1.42" }],
    ["path", { d: "M17.775 5.654a15.68 15.68 0 0 0-12.121 12.12" }],
    ["path", { d: "M18.8 9.3a1 1 0 0 0 2.1 7.7" }],
    [
      "path",
      {
        d: "M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/plane-takeoff.mjs
  var PlaneTakeoff = [
    ["path", { d: "M2 22h20" }],
    [
      "path",
      {
        d: "M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/plane-landing.mjs
  var PlaneLanding = [
    ["path", { d: "M2 22h20" }],
    [
      "path",
      {
        d: "M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.84.9 1.45s.35 1.17.9 1.45L8 8.5l3-6 1.05.53a2 2 0 0 1 1.09 1.52l.72 5.4a2 2 0 0 0 1.09 1.52l4.4 2.2c.42.22.78.55 1.01.96l.6 1.03c.49.88-.06 1.98-1.06 2.1l-1.18.15c-.47.06-.95-.02-1.37-.24L4.29 11.15a2 2 0 0 1-.52-.38Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/plane.mjs
  var Plane = [
    [
      "path",
      {
        d: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/plant-pot.mjs
  var PlantPot = [
    [
      "path",
      {
        d: "M14 8.536V6a4 4 0 014-4h1.5a.5.5 0 01.5.5V4a4 4 0 01-4 4 4 4 0 00-4 4 5 5 0 01-8-4 5 5 0 018 4c0 2 1 3 1 5"
      }
    ],
    ["path", { d: "m18 17-1.085 3.58A2 2 0 0115 22H9.002a2 2 0 01-1.913-1.418L6 17" }],
    ["path", { d: "M5 17h14" }]
  ];

  // node_modules/lucide/dist/esm/icons/play-off.mjs
  var PlayOff = [
    ["path", { d: "m10.215 4.56 9.79 5.71a2 2 0 0 1 .003 3.458l-.393.23" }],
    ["path", { d: "m16.042 16.042-8.034 4.686A2 2 0 0 1 5 19V5" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/play.mjs
  var Play = [
    [
      "path",
      { d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/playing-card.mjs
  var PlayingCard = [
    [
      "path",
      {
        d: "M12.832 8.445a1 1 0 00-1.589-.098l-2.075 3.098a1 1 0 000 1.11l2 3a1 1 0 001.664 0l2-3a1 1 0 000-1.11z"
      }
    ],
    ["rect", { x: "5", y: "2", width: "14", height: "20", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/playing-cards.mjs
  var PlayingCards = [
    [
      "path",
      {
        d: "M14.832 8.445a1 1 0 00-1.589-.098l-2.075 3.098a1 1 0 000 1.11l2 3a1 1 0 001.664 0l2-3a1 1 0 000-1.11z"
      }
    ],
    ["path", { d: "m7.18 20.827-5-11a2 2 0 01.993-2.647L7 5.44" }],
    ["rect", { x: "7", y: "2", width: "14", height: "20", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/playing-cards-fan.mjs
  var PlayingCardsFan = [
    [
      "path",
      {
        d: "M12.65 7.65a2 2 0 012.629-1.046l5.51 2.374a2 2 0 011.046 2.628l-3.957 9.184a2 2 0 01-2.628 1.046l-5.51-2.374a2 2 0 01-1.046-2.628z"
      }
    ],
    ["path", { d: "M18 7.777V4a2 2 0 00-2-2h-6a2 2 0 00-2 2v10a2 2 0 001.137 1.805" }],
    [
      "path",
      { d: "m8 4.389-4.364.809a2 2 0 00-1.602 2.33l1.822 9.833a2 2 0 002.331 1.602l2.542-.47" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/plug-2.mjs
  var Plug2 = [
    ["path", { d: "M9 2v6" }],
    ["path", { d: "M15 2v6" }],
    ["path", { d: "M12 17v5" }],
    ["path", { d: "M5 8h14" }],
    ["path", { d: "M6 11V8h12v3a6 6 0 1 1-12 0Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/plug-zap.mjs
  var PlugZap = [
    ["path", { d: "M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" }],
    ["path", { d: "m2 22 3-3" }],
    ["path", { d: "M7.5 13.5 10 11" }],
    ["path", { d: "M10.5 16.5 13 14" }],
    ["path", { d: "m18 3-4 4h6l-4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/plug.mjs
  var Plug = [
    ["path", { d: "M12 22v-5" }],
    ["path", { d: "M15 8V2" }],
    ["path", { d: "M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z" }],
    ["path", { d: "M9 8V2" }]
  ];

  // node_modules/lucide/dist/esm/icons/plus.mjs
  var Plus = [
    ["path", { d: "M5 12h14" }],
    ["path", { d: "M12 5v14" }]
  ];

  // node_modules/lucide/dist/esm/icons/pocket-knife.mjs
  var PocketKnife = [
    ["path", { d: "M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2" }],
    ["path", { d: "M18 6h.01" }],
    ["path", { d: "M6 18h.01" }],
    ["path", { d: "M20.83 8.83a4 4 0 0 0-5.66-5.66l-12 12a4 4 0 1 0 5.66 5.66Z" }],
    ["path", { d: "M18 11.66V22a4 4 0 0 0 4-4V6" }]
  ];

  // node_modules/lucide/dist/esm/icons/podium.mjs
  var Podium = [
    ["path", { d: "M12 6V2h-1" }],
    [
      "path",
      {
        d: "M9 15a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1"
      }
    ],
    ["path", { d: "M9 21V11a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v10" }]
  ];

  // node_modules/lucide/dist/esm/icons/pointer.mjs
  var Pointer = [
    ["path", { d: "M22 14a8 8 0 0 1-8 8" }],
    ["path", { d: "M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" }],
    ["path", { d: "M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" }],
    ["path", { d: "M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" }],
    [
      "path",
      {
        d: "M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/pointer-off.mjs
  var PointerOff = [
    ["path", { d: "M10 4.5V4a2 2 0 0 0-2.41-1.957" }],
    ["path", { d: "M13.9 8.4a2 2 0 0 0-1.26-1.295" }],
    ["path", { d: "M21.7 16.2A8 8 0 0 0 22 14v-3a2 2 0 1 0-4 0v-1a2 2 0 0 0-3.63-1.158" }],
    [
      "path",
      { d: "m7 15-1.8-1.8a2 2 0 0 0-2.79 2.86L6 19.7a7.74 7.74 0 0 0 6 2.3h2a8 8 0 0 0 5.657-2.343" }
    ],
    ["path", { d: "M6 6v8" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/popcorn.mjs
  var Popcorn = [
    ["path", { d: "M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4" }],
    ["path", { d: "M10 22 9 8" }],
    ["path", { d: "m14 22 1-14" }],
    [
      "path",
      {
        d: "M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/popsicle.mjs
  var Popsicle = [
    [
      "path",
      { d: "M18.6 14.4c.8-.8.8-2 0-2.8l-8.1-8.1a4.95 4.95 0 1 0-7.1 7.1l8.1 8.1c.9.7 2.1.7 2.9-.1Z" }
    ],
    ["path", { d: "m22 22-5.5-5.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/pound-sterling.mjs
  var PoundSterling = [
    ["path", { d: "M17 18a2 2 0 01-2 2H5a3 3 0 003-3V8a4 4 0 018 0" }],
    ["path", { d: "M6 12h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/power-off.mjs
  var PowerOff = [
    ["path", { d: "M18.36 6.64A9 9 0 0 1 20.77 15" }],
    ["path", { d: "M6.16 6.16a9 9 0 1 0 12.68 12.68" }],
    ["path", { d: "M12 2v4" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/power.mjs
  var Power = [
    ["path", { d: "M12 2v10" }],
    ["path", { d: "M18.4 6.6a9 9 0 1 1-12.77.04" }]
  ];

  // node_modules/lucide/dist/esm/icons/presentation.mjs
  var Presentation = [
    ["path", { d: "M2 3h20" }],
    ["path", { d: "M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" }],
    ["path", { d: "m7 21 5-5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/printer-3d.mjs
  var Printer3d = [
    ["path", { d: "M10 11v1" }],
    ["path", { d: "M12 8h8" }],
    ["path", { d: "M15 20v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3" }],
    ["path", { d: "M4 20h16" }],
    ["path", { d: "M4 22V4a2 2 0 012-2h12a2 2 0 012 2v18" }],
    ["path", { d: "M4 8h4" }],
    [
      "path",
      {
        d: "M8.635 10.093A2 2 0 018 8.631V7a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-.293.707l-1 1a1 1 0 01-1.414 0z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/printer-check.mjs
  var PrinterCheck = [
    ["path", { d: "M13.5 22H7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v.5" }],
    ["path", { d: "m16 19 2 2 4-4" }],
    ["path", { d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/printer-x.mjs
  var PrinterX = [
    ["path", { d: "M12.531 22H7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h6.377" }],
    ["path", { d: "m16.5 16.5 5 5" }],
    ["path", { d: "m16.5 21.5 5-5" }],
    ["path", { d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.5" }],
    ["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/printer.mjs
  var Printer = [
    ["path", { d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" }],
    ["rect", { x: "6", y: "14", width: "12", height: "8", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/projector.mjs
  var Projector = [
    ["path", { d: "M5 7 3 5" }],
    ["path", { d: "M9 6V3" }],
    ["path", { d: "m13 7 2-2" }],
    ["circle", { cx: "9", cy: "13", r: "3" }],
    [
      "path",
      { d: "M11.83 12H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2.17" }
    ],
    ["path", { d: "M16 16h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/proportions.mjs
  var Proportions = [
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
    ["path", { d: "M12 9v11" }],
    ["path", { d: "M2 9h13a2 2 0 0 1 2 2v9" }]
  ];

  // node_modules/lucide/dist/esm/icons/puzzle.mjs
  var Puzzle = [
    [
      "path",
      {
        d: "M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/pyramid.mjs
  var Pyramid = [
    [
      "path",
      {
        d: "M2.5 16.88a1 1 0 0 1-.32-1.43l9-13.02a1 1 0 0 1 1.64 0l9 13.01a1 1 0 0 1-.32 1.44l-8.51 4.86a2 2 0 0 1-1.98 0Z"
      }
    ],
    ["path", { d: "M12 2v20" }]
  ];

  // node_modules/lucide/dist/esm/icons/qr-code.mjs
  var QrCode = [
    ["rect", { width: "5", height: "5", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "5", height: "5", x: "16", y: "3", rx: "1" }],
    ["rect", { width: "5", height: "5", x: "3", y: "16", rx: "1" }],
    ["path", { d: "M21 16h-3a2 2 0 0 0-2 2v3" }],
    ["path", { d: "M21 21v.01" }],
    ["path", { d: "M12 7v3a2 2 0 0 1-2 2H7" }],
    ["path", { d: "M3 12h.01" }],
    ["path", { d: "M12 3h.01" }],
    ["path", { d: "M12 16v.01" }],
    ["path", { d: "M16 12h1" }],
    ["path", { d: "M21 12v.01" }],
    ["path", { d: "M12 21v-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/quote.mjs
  var Quote = [
    [
      "path",
      {
        d: "M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"
      }
    ],
    [
      "path",
      {
        d: "M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/rabbit.mjs
  var Rabbit = [
    ["path", { d: "M13 16a3 3 0 0 1 2.24 5" }],
    ["path", { d: "M18 12h.01" }],
    [
      "path",
      {
        d: "M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3"
      }
    ],
    ["path", { d: "M20 8.54V4a2 2 0 1 0-4 0v3" }],
    ["path", { d: "M7.612 12.524a3 3 0 1 0-1.6 4.3" }]
  ];

  // node_modules/lucide/dist/esm/icons/radar.mjs
  var Radar = [
    ["path", { d: "M19.07 4.93A10 10 0 0 0 6.99 3.34" }],
    ["path", { d: "M4 6h.01" }],
    ["path", { d: "M2.29 9.62A10 10 0 1 0 21.31 8.35" }],
    ["path", { d: "M16.24 7.76A6 6 0 1 0 8.23 16.67" }],
    ["path", { d: "M12 18h.01" }],
    ["path", { d: "M17.99 11.66A6 6 0 0 1 15.77 16.67" }],
    ["circle", { cx: "12", cy: "12", r: "2" }],
    ["path", { d: "m13.41 10.59 5.66-5.66" }]
  ];

  // node_modules/lucide/dist/esm/icons/radiation.mjs
  var Radiation = [
    ["path", { d: "M12 12h.01" }],
    [
      "path",
      {
        d: "M14 15.4641a4 4 0 0 1-4 0L7.52786 19.74597 A 1 1 0 0 0 7.99303 21.16211 10 10 0 0 0 16.00697 21.16211 1 1 0 0 0 16.47214 19.74597z"
      }
    ],
    [
      "path",
      {
        d: "M16 12a4 4 0 0 0-2-3.464l2.472-4.282a1 1 0 0 1 1.46-.305 10 10 0 0 1 4.006 6.94A1 1 0 0 1 21 12z"
      }
    ],
    [
      "path",
      {
        d: "M8 12a4 4 0 0 1 2-3.464L7.528 4.254a1 1 0 0 0-1.46-.305 10 10 0 0 0-4.006 6.94A1 1 0 0 0 3 12z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/radical.mjs
  var Radical = [
    [
      "path",
      {
        d: "M3 12h3.28a1 1 0 0 1 .948.684l2.298 7.934a.5.5 0 0 0 .96-.044L13.82 4.771A1 1 0 0 1 14.792 4H21"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/radio-off.mjs
  var RadioOff = [
    ["path", { d: "M13.414 13.414a2 2 0 1 1-2.828-2.828" }],
    ["path", { d: "M16.247 7.761a6 6 0 0 1 1.744 4.572" }],
    ["path", { d: "M19.075 4.933a10 10 0 0 1 2.234 10.72" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M4.925 19.067a10 10 0 0 1 0-14.134" }],
    ["path", { d: "M7.753 16.239a6 6 0 0 1 0-8.478" }]
  ];

  // node_modules/lucide/dist/esm/icons/radio-receiver.mjs
  var RadioReceiver = [
    ["path", { d: "M5 16v2" }],
    ["path", { d: "M19 16v2" }],
    ["rect", { width: "20", height: "8", x: "2", y: "8", rx: "2" }],
    ["path", { d: "M18 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/radio-tower.mjs
  var RadioTower = [
    ["path", { d: "M4.9 16.1C1 12.2 1 5.8 4.9 1.9" }],
    ["path", { d: "M7.8 4.7a6.14 6.14 0 0 0-.8 7.5" }],
    ["circle", { cx: "12", cy: "9", r: "2" }],
    ["path", { d: "M16.2 4.8c2 2 2.26 5.11.8 7.47" }],
    ["path", { d: "M19.1 1.9a9.96 9.96 0 0 1 0 14.1" }],
    ["path", { d: "M9.5 18h5" }],
    ["path", { d: "m8 22 4-11 4 11" }]
  ];

  // node_modules/lucide/dist/esm/icons/radio.mjs
  var Radio = [
    ["path", { d: "M16.247 7.761a6 6 0 0 1 0 8.478" }],
    ["path", { d: "M19.075 4.933a10 10 0 0 1 0 14.134" }],
    ["path", { d: "M4.925 19.067a10 10 0 0 1 0-14.134" }],
    ["path", { d: "M7.753 16.239a6 6 0 0 1 0-8.478" }],
    ["circle", { cx: "12", cy: "12", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/radius.mjs
  var Radius = [
    ["path", { d: "M20.34 17.52a10 10 0 1 0-2.82 2.82" }],
    ["circle", { cx: "19", cy: "19", r: "2" }],
    ["path", { d: "m13.41 13.41 4.18 4.18" }],
    ["circle", { cx: "12", cy: "12", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/rainbow.mjs
  var Rainbow = [
    ["path", { d: "M22 17a10 10 0 0 0-20 0" }],
    ["path", { d: "M6 17a6 6 0 0 1 12 0" }],
    ["path", { d: "M10 17a2 2 0 0 1 4 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/rat.mjs
  var Rat = [
    ["path", { d: "M13 22H4a2 2 0 0 1 0-4h12" }],
    ["path", { d: "M13.236 18a3 3 0 0 0-2.2-5" }],
    ["path", { d: "M16 9h.01" }],
    [
      "path",
      {
        d: "M16.82 3.94a3 3 0 1 1 3.237 4.868l1.815 2.587a1.5 1.5 0 0 1-1.5 2.1l-2.872-.453a3 3 0 0 0-3.5 3"
      }
    ],
    ["path", { d: "M17 4.988a3 3 0 1 0-5.2 2.052A7 7 0 0 0 4 14.015 4 4 0 0 0 8 18" }]
  ];

  // node_modules/lucide/dist/esm/icons/ratio.mjs
  var Ratio = [
    ["rect", { width: "12", height: "20", x: "6", y: "2", rx: "2" }],
    ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/receipt-euro.mjs
  var ReceiptEuro = [
    ["path", { d: "M15.828 14.829a4 4 0 0 1-5.656 0 4 4 0 0 1 0-5.657 4 4 0 0 1 5.656 0" }],
    [
      "path",
      {
        d: "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
      }
    ],
    ["path", { d: "M8 12h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/receipt-cent.mjs
  var ReceiptCent = [
    ["path", { d: "M12 7v10" }],
    ["path", { d: "M14.828 14.829a4 4 0 0 1-5.656 0 4 4 0 0 1 0-5.657 4 4 0 0 1 5.656 0" }],
    [
      "path",
      {
        d: "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/receipt-indian-rupee.mjs
  var ReceiptIndianRupee = [
    [
      "path",
      {
        d: "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
      }
    ],
    ["path", { d: "M8 11h8" }],
    ["path", { d: "M8 7h8" }],
    ["path", { d: "M9 7a4 4 0 0 1 0 8H8l3 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/receipt-pound-sterling.mjs
  var ReceiptPoundSterling = [
    ["path", { d: "M10 17V9.5a1 1 0 0 1 5 0" }],
    [
      "path",
      {
        d: "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
      }
    ],
    ["path", { d: "M8 13h5" }],
    ["path", { d: "M8 17h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/receipt-japanese-yen.mjs
  var ReceiptJapaneseYen = [
    ["path", { d: "m12 10 3-3" }],
    [
      "path",
      {
        d: "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
      }
    ],
    ["path", { d: "M9 11h6" }],
    ["path", { d: "M9 15h6" }],
    ["path", { d: "m9 7 3 3v7" }]
  ];

  // node_modules/lucide/dist/esm/icons/receipt-russian-ruble.mjs
  var ReceiptRussianRuble = [
    [
      "path",
      {
        d: "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
      }
    ],
    ["path", { d: "M8 11h5a2 2 0 0 0 0-4h-3v10" }],
    ["path", { d: "M8 15h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/receipt-swiss-franc.mjs
  var ReceiptSwissFranc = [
    ["path", { d: "M10 11h4" }],
    ["path", { d: "M10 17V7h5" }],
    [
      "path",
      {
        d: "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
      }
    ],
    ["path", { d: "M8 15h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/receipt-text.mjs
  var ReceiptText = [
    ["path", { d: "M13 16H8" }],
    ["path", { d: "M14 8H8" }],
    ["path", { d: "M16 12H8" }],
    [
      "path",
      {
        d: "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/receipt-turkish-lira.mjs
  var ReceiptTurkishLira = [
    ["path", { d: "M10 7v10a5 5 0 0 0 5-5" }],
    ["path", { d: "m14 8-6 3" }],
    [
      "path",
      {
        d: "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/receipt.mjs
  var Receipt = [
    ["path", { d: "M12 17V7" }],
    ["path", { d: "M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" }],
    [
      "path",
      {
        d: "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/rectangle-circle.mjs
  var RectangleCircle = [
    ["path", { d: "M14 4v16H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" }],
    ["circle", { cx: "14", cy: "12", r: "8" }]
  ];

  // node_modules/lucide/dist/esm/icons/rectangle-ellipsis.mjs
  var RectangleEllipsis = [
    ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2" }],
    ["path", { d: "M12 12h.01" }],
    ["path", { d: "M17 12h.01" }],
    ["path", { d: "M7 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/rectangle-goggles.mjs
  var RectangleGoggles = [
    [
      "path",
      {
        d: "M20 6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-1.6-.8l-1.6-2.13a1 1 0 0 0-1.6 0L9.6 17.2A2 2 0 0 1 8 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/rectangle-vertical.mjs
  var RectangleVertical = [
    ["rect", { width: "12", height: "20", x: "6", y: "2", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/rectangle-horizontal.mjs
  var RectangleHorizontal = [
    ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/recycle.mjs
  var Recycle = [
    ["path", { d: "M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" }],
    ["path", { d: "M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" }],
    ["path", { d: "m14 16-3 3 3 3" }],
    ["path", { d: "M8.293 13.596 7.196 9.5 3.1 10.598" }],
    [
      "path",
      {
        d: "m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"
      }
    ],
    ["path", { d: "m13.378 9.633 4.096 1.098 1.097-4.096" }]
  ];

  // node_modules/lucide/dist/esm/icons/redo-2.mjs
  var Redo2 = [
    ["path", { d: "m15 14 5-5-5-5" }],
    ["path", { d: "M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" }]
  ];

  // node_modules/lucide/dist/esm/icons/redo-dot.mjs
  var RedoDot = [
    ["circle", { cx: "12", cy: "17", r: "1" }],
    ["path", { d: "M21 7v6h-6" }],
    ["path", { d: "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" }]
  ];

  // node_modules/lucide/dist/esm/icons/redo.mjs
  var Redo = [
    ["path", { d: "M21 7v6h-6" }],
    ["path", { d: "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" }]
  ];

  // node_modules/lucide/dist/esm/icons/refresh-ccw-dot.mjs
  var RefreshCcwDot = [
    ["path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
    ["path", { d: "M3 3v5h5" }],
    ["path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }],
    ["path", { d: "M16 16h5v5" }],
    ["circle", { cx: "12", cy: "12", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/refresh-ccw.mjs
  var RefreshCcw = [
    ["path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
    ["path", { d: "M3 3v5h5" }],
    ["path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }],
    ["path", { d: "M16 16h5v5" }]
  ];

  // node_modules/lucide/dist/esm/icons/refresh-cw-off.mjs
  var RefreshCwOff = [
    ["path", { d: "M21 8L18.74 5.74A9.75 9.75 0 0 0 12 3C11 3 10.03 3.16 9.13 3.47" }],
    ["path", { d: "M8 16H3v5" }],
    ["path", { d: "M3 12C3 9.51 4 7.26 5.64 5.64" }],
    ["path", { d: "m3 16 2.26 2.26A9.75 9.75 0 0 0 12 21c2.49 0 4.74-1 6.36-2.64" }],
    ["path", { d: "M21 12c0 1-.16 1.97-.47 2.87" }],
    ["path", { d: "M21 3v5h-5" }],
    ["path", { d: "M22 22 2 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/refresh-cw.mjs
  var RefreshCw = [
    ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }],
    ["path", { d: "M21 3v5h-5" }],
    ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }],
    ["path", { d: "M8 16H3v5" }]
  ];

  // node_modules/lucide/dist/esm/icons/regex.mjs
  var Regex = [
    ["path", { d: "M17 3v10" }],
    ["path", { d: "m12.67 5.5 8.66 5" }],
    ["path", { d: "m12.67 10.5 8.66-5" }],
    ["path", { d: "M9 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2z" }]
  ];

  // node_modules/lucide/dist/esm/icons/refrigerator.mjs
  var Refrigerator = [
    ["path", { d: "M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z" }],
    ["path", { d: "M5 10h14" }],
    ["path", { d: "M15 7v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/remove-formatting.mjs
  var RemoveFormatting = [
    ["path", { d: "M4 7V4h16v3" }],
    ["path", { d: "M5 20h6" }],
    ["path", { d: "M13 4 8 20" }],
    ["path", { d: "m15 15 5 5" }],
    ["path", { d: "m20 15-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/repeat-1.mjs
  var Repeat1 = [
    ["path", { d: "m17 2 4 4-4 4" }],
    ["path", { d: "M3 11v-1a4 4 0 0 1 4-4h14" }],
    ["path", { d: "m7 22-4-4 4-4" }],
    ["path", { d: "M21 13v1a4 4 0 0 1-4 4H3" }],
    ["path", { d: "M11 10h1v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/repeat-2.mjs
  var Repeat2 = [
    ["path", { d: "m2 9 3-3 3 3" }],
    ["path", { d: "M13 18H7a2 2 0 0 1-2-2V6" }],
    ["path", { d: "m22 15-3 3-3-3" }],
    ["path", { d: "M11 6h6a2 2 0 0 1 2 2v10" }]
  ];

  // node_modules/lucide/dist/esm/icons/repeat-off.mjs
  var RepeatOff = [
    ["path", { d: "M11.656 6H21l-4-4" }],
    ["path", { d: "M17.898 17.898A4 4 0 0 1 17 18H3l4-4" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M21 13v1a4 4 0 0 1-.171 1.159" }],
    ["path", { d: "m21 6-4 4" }],
    ["path", { d: "M3 11v-1a4 4 0 0 1 3.102-3.898" }],
    ["path", { d: "m7 22-4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/replace-all.mjs
  var ReplaceAll = [
    ["path", { d: "M14 14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" }],
    ["path", { d: "M14 4a1 1 0 0 1 1-1" }],
    ["path", { d: "M15 10a1 1 0 0 1-1-1" }],
    ["path", { d: "M19 14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" }],
    ["path", { d: "M21 4a1 1 0 0 0-1-1" }],
    ["path", { d: "M21 9a1 1 0 0 1-1 1" }],
    ["path", { d: "m3 7 3 3 3-3" }],
    ["path", { d: "M6 10V5a2 2 0 0 1 2-2h2" }],
    ["rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/repeat.mjs
  var Repeat = [
    ["path", { d: "m17 2 4 4-4 4" }],
    ["path", { d: "M3 11v-1a4 4 0 0 1 4-4h14" }],
    ["path", { d: "m7 22-4-4 4-4" }],
    ["path", { d: "M21 13v1a4 4 0 0 1-4 4H3" }]
  ];

  // node_modules/lucide/dist/esm/icons/replace.mjs
  var Replace = [
    ["path", { d: "M14 4a1 1 0 0 1 1-1" }],
    ["path", { d: "M15 10a1 1 0 0 1-1-1" }],
    ["path", { d: "M21 4a1 1 0 0 0-1-1" }],
    ["path", { d: "M21 9a1 1 0 0 1-1 1" }],
    ["path", { d: "m3 7 3 3 3-3" }],
    ["path", { d: "M6 10V5a2 2 0 0 1 2-2h2" }],
    ["rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/reply-all.mjs
  var ReplyAll = [
    ["path", { d: "m12 17-5-5 5-5" }],
    ["path", { d: "M22 18v-2a4 4 0 0 0-4-4H7" }],
    ["path", { d: "m7 17-5-5 5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/reply.mjs
  var Reply = [
    ["path", { d: "M20 18v-2a4 4 0 0 0-4-4H4" }],
    ["path", { d: "m9 17-5-5 5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/rewind.mjs
  var Rewind = [
    ["path", { d: "M12 6a2 2 0 0 0-3.414-1.414l-6 6a2 2 0 0 0 0 2.828l6 6A2 2 0 0 0 12 18z" }],
    ["path", { d: "M22 6a2 2 0 0 0-3.414-1.414l-6 6a2 2 0 0 0 0 2.828l6 6A2 2 0 0 0 22 18z" }]
  ];

  // node_modules/lucide/dist/esm/icons/ribbon.mjs
  var Ribbon = [
    ["path", { d: "M12 11.22C11 9.997 10 9 10 8a2 2 0 0 1 4 0c0 1-.998 2.002-2.01 3.22" }],
    ["path", { d: "m12 18 2.57-3.5" }],
    ["path", { d: "M6.243 9.016a7 7 0 0 1 11.507-.009" }],
    ["path", { d: "M9.35 14.53 12 11.22" }],
    [
      "path",
      {
        d: "M9.35 14.53C7.728 12.246 6 10.221 6 7a6 5 0 0 1 12 0c-.005 3.22-1.778 5.235-3.43 7.5l3.557 4.527a1 1 0 0 1-.203 1.43l-1.894 1.36a1 1 0 0 1-1.384-.215L12 18l-2.679 3.593a1 1 0 0 1-1.39.213l-1.865-1.353a1 1 0 0 1-.203-1.422z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/road.mjs
  var Road = [
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M12 5V3" }],
    ["path", { d: "M12 9v3" }],
    [
      "path",
      {
        d: "M2.077 18.449A2 2 0 0 0 4 21h16a2 2 0 0 0 1.924-2.55l-4-14A2 2 0 0 0 16 3H8a2 2 0 0 0-1.924 1.45z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/robot-arm.mjs
  var RobotArm = [
    ["path", { d: "M12 21 7.5 8.322" }],
    ["path", { d: "m14 7 1.75-3.767a.5.5 0 0 1 .662-.172L20 5.005" }],
    ["path", { d: "m20 8.998-3.588 1.944a.5.5 0 0 1-.662-.172L14 7H8" }],
    ["path", { d: "M3.486 21h10" }],
    ["path", { d: "M5 21V8.732" }],
    ["circle", { cx: "6", cy: "7", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/robot-vacuum.mjs
  var RobotVacuum = [
    ["path", { d: "M11 17h2" }],
    ["path", { d: "M12 12h.01" }],
    ["path", { d: "M17 12a5 5 0 00-10 0" }],
    ["path", { d: "M19 2v2.8" }],
    ["path", { d: "M2 5h2.8" }],
    ["path", { d: "M22 5h-2.8" }],
    ["path", { d: "M5 2v2.8" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/rocket.mjs
  var Rocket = [
    ["path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" }],
    [
      "path",
      {
        d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"
      }
    ],
    [
      "path",
      {
        d: "M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"
      }
    ],
    ["path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" }]
  ];

  // node_modules/lucide/dist/esm/icons/rocking-chair.mjs
  var RockingChair = [
    ["path", { d: "m15 13 3.708 7.416" }],
    ["path", { d: "M3 19a15 15 0 0 0 18 0" }],
    ["path", { d: "m3 2 3.21 9.633A2 2 0 0 0 8.109 13H18" }],
    ["path", { d: "m9 13-3.708 7.416" }]
  ];

  // node_modules/lucide/dist/esm/icons/roller-coaster.mjs
  var RollerCoaster = [
    ["path", { d: "M6 19V5" }],
    ["path", { d: "M10 19V6.8" }],
    ["path", { d: "M14 19v-7.8" }],
    ["path", { d: "M18 5v4" }],
    ["path", { d: "M18 19v-6" }],
    ["path", { d: "M22 19V9" }],
    ["path", { d: "M2 19V9a4 4 0 0 1 4-4c2 0 4 1.33 6 4s4 4 6 4a4 4 0 1 0-3-6.65" }]
  ];

  // node_modules/lucide/dist/esm/icons/rose.mjs
  var Rose = [
    ["path", { d: "M17 10h-1a4 4 0 1 1 4-4v.534" }],
    ["path", { d: "M17 6h1a4 4 0 0 1 1.42 7.74l-2.29.87a6 6 0 0 1-5.339-10.68l2.069-1.31" }],
    [
      "path",
      { d: "M4.5 17c2.8-.5 4.4 0 5.5.8s1.8 2.2 2.3 3.7c-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2" }
    ],
    ["path", { d: "M9.77 12C4 15 2 22 2 22" }],
    ["circle", { cx: "17", cy: "8", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/rotate-3d.mjs
  var Rotate3d = [
    ["path", { d: "m15.194 13.707 3.814 1.86-1.86 3.814" }],
    ["path", { d: "M16.47214 7.52786 A 5 10 0 1 0 13 21.79796" }],
    ["path", { d: "M21.79796 11 A 10 5 0 1 0 19 15.57071" }]
  ];

  // node_modules/lucide/dist/esm/icons/rotate-ccw-key.mjs
  var RotateCcwKey = [
    ["path", { d: "M12 7v6" }],
    ["path", { d: "M12 9h2" }],
    ["path", { d: "M3 12a9 9 0 1 0 9-9 9.74 9.74 0 0 0-6.74 2.74L3 8" }],
    ["path", { d: "M3 3v5h5" }],
    ["circle", { cx: "12", cy: "15", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/rotate-ccw-clock.mjs
  var RotateCcwClock = [
    ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
    ["path", { d: "M3 3v5h5" }],
    ["path", { d: "M12 7v5l4 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/rotate-ccw-square.mjs
  var RotateCcwSquare = [
    ["path", { d: "M20 9V7a2 2 0 0 0-2-2h-6" }],
    ["path", { d: "m15 2-3 3 3 3" }],
    ["path", { d: "M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/rotate-ccw.mjs
  var RotateCcw = [
    ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
    ["path", { d: "M3 3v5h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/rotate-cw-clock.mjs
  var RotateCwClock = [
    ["path", { d: "M12 7v5l4 2" }],
    ["path", { d: "M16 8h5V3" }],
    ["path", { d: "m21 8-2.3-2.3A9.7 9.7 0 0012 3a9 9 0 109 9" }]
  ];

  // node_modules/lucide/dist/esm/icons/rotate-cw-fading-clock.mjs
  var RotateCwFadingClock = [
    ["path", { d: "M12 3a9.75 9.75 0 0 1 6.74 2.74" }],
    ["path", { d: "M18.74 5.74 21 8" }],
    ["path", { d: "M21 8V3" }],
    ["path", { d: "M7.5 19.794c-6-3.464-6-12.124 0-15.588" }],
    ["path", { d: "M7.5 4.206A9 9 0 0 1 12 3" }],
    ["path", { d: "M12 7v5l4 2" }],
    ["path", { d: "M14 20.775A9 9 0 0 1 12 21" }],
    ["path", { d: "M19 17.656a9 9 0 0 1-1.5 1.456" }],
    ["path", { d: "M21 12a9 9 0 0 1-.228 2" }],
    ["path", { d: "M21 8h-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/rotate-cw-square.mjs
  var RotateCwSquare = [
    ["path", { d: "M12 5H6a2 2 0 0 0-2 2v3" }],
    ["path", { d: "m9 8 3-3-3-3" }],
    ["path", { d: "M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/rotate-cw.mjs
  var RotateCw = [
    ["path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }],
    ["path", { d: "M21 3v5h-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/route-off.mjs
  var RouteOff = [
    ["circle", { cx: "6", cy: "19", r: "3" }],
    ["path", { d: "M9 19h8.5c.4 0 .9-.1 1.3-.2" }],
    ["path", { d: "M5.2 5.2A3.5 3.53 0 0 0 6.5 12H12" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M21 15.3a3.5 3.5 0 0 0-3.3-3.3" }],
    ["path", { d: "M15 5h-4.3" }],
    ["circle", { cx: "18", cy: "5", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/router.mjs
  var Router = [
    ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2" }],
    ["path", { d: "M6.01 18H6" }],
    ["path", { d: "M10.01 18H10" }],
    ["path", { d: "M15 10v4" }],
    ["path", { d: "M17.84 7.17a4 4 0 0 0-5.66 0" }],
    ["path", { d: "M20.66 4.34a8 8 0 0 0-11.31 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/route.mjs
  var Route = [
    ["circle", { cx: "6", cy: "19", r: "3" }],
    ["path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }],
    ["circle", { cx: "18", cy: "5", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/rows-2.mjs
  var Rows2 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 12h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/rows-3.mjs
  var Rows3 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M21 9H3" }],
    ["path", { d: "M21 15H3" }]
  ];

  // node_modules/lucide/dist/esm/icons/rows-4.mjs
  var Rows4 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M21 7.5H3" }],
    ["path", { d: "M21 12H3" }],
    ["path", { d: "M21 16.5H3" }]
  ];

  // node_modules/lucide/dist/esm/icons/rss.mjs
  var Rss = [
    ["path", { d: "M4 11a9 9 0 0 1 9 9" }],
    ["path", { d: "M4 4a16 16 0 0 1 16 16" }],
    ["circle", { cx: "5", cy: "19", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/rugby-ball.mjs
  var RugbyBall = [
    ["path", { d: "m10 10 4 4" }],
    ["path", { d: "m13 7 4 4" }],
    [
      "path",
      {
        d: "M15.34 2.138A15 15 0 002.138 15.34c-.357 2.94.004 4.919.805 5.717.798.8 2.778 1.162 5.718.805A15 15 0 0021.862 8.661c.357-2.94-.004-4.92-.805-5.718-.798-.8-2.778-1.162-5.717-.805"
      }
    ],
    ["path", { d: "M17 7 7 17" }],
    ["path", { d: "m7 13 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/ruler-dimension-line.mjs
  var RulerDimensionLine = [
    ["path", { d: "M10 15v-3" }],
    ["path", { d: "M14 15v-3" }],
    ["path", { d: "M18 15v-3" }],
    ["path", { d: "M2 8V4" }],
    ["path", { d: "M22 6H2" }],
    ["path", { d: "M22 8V4" }],
    ["path", { d: "M6 15v-3" }],
    ["rect", { x: "2", y: "12", width: "20", height: "8", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/ruler.mjs
  var Ruler = [
    [
      "path",
      {
        d: "M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"
      }
    ],
    ["path", { d: "m14.5 12.5 2-2" }],
    ["path", { d: "m11.5 9.5 2-2" }],
    ["path", { d: "m8.5 6.5 2-2" }],
    ["path", { d: "m17.5 15.5 2-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/russian-ruble.mjs
  var RussianRuble = [
    ["path", { d: "M4 16h6" }],
    ["path", { d: "M7 20V5a1 1 0 011-1h6a4 4 0 010 8H4" }]
  ];

  // node_modules/lucide/dist/esm/icons/sailboat.mjs
  var Sailboat = [
    ["path", { d: "M10 2v15" }],
    ["path", { d: "M7 22a4 4 0 0 1-4-4 1 1 0 0 1 1-1h16a1 1 0 0 1 1 1 4 4 0 0 1-4 4z" }],
    [
      "path",
      { d: "M9.159 2.46a1 1 0 0 1 1.521-.193l9.977 8.98A1 1 0 0 1 20 13H4a1 1 0 0 1-.824-1.567z" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/salad.mjs
  var Salad = [
    [
      "path",
      {
        d: "M19.496 12a2.5 2.5 0 00.399-2.214A2 2 0 0020.32 6.5 2 2 0 0019 3a2 2 0 00-1.5.68 2 2 0 00-3.287.424 2.5 2.5 0 00-3.189 2.06A3 3 0 0012 12l4-4"
      }
    ],
    ["path", { d: "M4 12a1 1 0 00-.99 1.133A9 9 0 0012 21a9 9 0 008.99-7.867A1 1 0 0020 12z" }],
    ["path", { d: "M7 21h10" }],
    ["path", { d: "M9.85 6.907A3.5 3.5 0 005.05 12" }]
  ];

  // node_modules/lucide/dist/esm/icons/sandwich.mjs
  var Sandwich = [
    ["path", { d: "m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777" }],
    ["path", { d: "M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25" }],
    ["path", { d: "M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9" }],
    ["path", { d: "m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2" }],
    ["rect", { width: "20", height: "4", x: "2", y: "11", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/satellite-dish.mjs
  var SatelliteDish = [
    ["path", { d: "M18 12a6 6 0 00-6-6" }],
    [
      "path",
      {
        d: "M2.824 10.459a8 8 0 0010.717 10.717c.558-.276.623-1.012.183-1.452l-9.448-9.448c-.44-.44-1.176-.375-1.452.183"
      }
    ],
    ["path", { d: "M22 12A10 10 0 0012 2" }],
    ["path", { d: "m9 15 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/satellite.mjs
  var Satellite = [
    [
      "path",
      {
        d: "m13.5 6.5-3.148-3.148a1.205 1.205 0 0 0-1.704 0L6.352 5.648a1.205 1.205 0 0 0 0 1.704L9.5 10.5"
      }
    ],
    ["path", { d: "M16.5 7.5 19 5" }],
    [
      "path",
      {
        d: "m17.5 10.5 3.148 3.148a1.205 1.205 0 0 1 0 1.704l-2.296 2.296a1.205 1.205 0 0 1-1.704 0L13.5 14.5"
      }
    ],
    ["path", { d: "M9 21a6 6 0 0 0-6-6" }],
    [
      "path",
      {
        d: "M9.352 10.648a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l4.296-4.296a1.205 1.205 0 0 0 0-1.704l-2.296-2.296a1.205 1.205 0 0 0-1.704 0z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/saudi-riyal.mjs
  var SaudiRiyal = [
    ["path", { d: "M10 2.977v13.19a2 2 0 01-1.23 1.846L4 19.999" }],
    ["path", { d: "M14 4v9.523a1 1 0 001.371.928L19 13" }],
    ["path", { d: "m19 18-5 2" }],
    ["path", { d: "M19 8 4 14" }]
  ];

  // node_modules/lucide/dist/esm/icons/save-all.mjs
  var SaveAll = [
    ["path", { d: "M10 2v3a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M18 18v-6a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6" }],
    ["path", { d: "M18 22H4a2 2 0 0 1-2-2V6" }],
    [
      "path",
      {
        d: "M8 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9.172a2 2 0 0 1 1.414.586l2.828 2.828A2 2 0 0 1 22 6.828V16a2 2 0 0 1-2.01 2z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/save-check.mjs
  var SaveCheck = [
    [
      "path",
      {
        d: "M12.5 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10.2a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4v4.35"
      }
    ],
    ["path", { d: "m16 19 2 2 4-4" }],
    ["path", { d: "M17 15.13V14a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/save-off.mjs
  var SaveOff = [
    ["path", { d: "M13 13H8a1 1 0 0 0-1 1v7" }],
    ["path", { d: "M14 8h1" }],
    ["path", { d: "M17 21v-4" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M20.41 20.41A2 2 0 0 1 19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 .59-1.41" }],
    ["path", { d: "M9 3h6.2a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V15" }]
  ];

  // node_modules/lucide/dist/esm/icons/save-pen.mjs
  var SavePen = [
    ["path", { d: "M13.33 13H8a1 1 0 00-1 1v7" }],
    [
      "path",
      {
        d: "M14.363 17.634a2 2 0 00-.506.854l-.837 2.87a.5.5 0 00.62.62l2.87-.837a2 2 0 00.854-.506l4.013-4.009a1 1 0 10-3.004-3.004z"
      }
    ],
    ["path", { d: "M7 3v4a1 1 0 001 1h7" }],
    [
      "path",
      { d: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h10.2a2 2 0 011.4.6l3.8 3.8a2 2 0 01.6 1.4v.3" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/save-plus.mjs
  var SavePlus = [
    [
      "path",
      {
        d: "M12.5 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10.2a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V12"
      }
    ],
    ["path", { d: "M16 13H8a1 1 0 0 0-1 1v7" }],
    ["path", { d: "M19 22v-6" }],
    ["path", { d: "M22 19h-6" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/save.mjs
  var Save = [
    [
      "path",
      {
        d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];

  // node_modules/lucide/dist/esm/icons/scale-3d.mjs
  var Scale3d = [
    ["path", { d: "M5 7v11a1 1 0 0 0 1 1h11" }],
    ["path", { d: "M5.293 18.707 11 13" }],
    ["circle", { cx: "19", cy: "19", r: "2" }],
    ["circle", { cx: "5", cy: "5", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/scale.mjs
  var Scale = [
    ["path", { d: "M12 3v18" }],
    ["path", { d: "m19 8 3 8a5 5 0 0 1-6 0zV7" }],
    ["path", { d: "M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" }],
    ["path", { d: "m5 8 3 8a5 5 0 0 1-6 0zV7" }],
    ["path", { d: "M7 21h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/scaling.mjs
  var Scaling = [
    ["path", { d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }],
    ["path", { d: "M14 15H9v-5" }],
    ["path", { d: "M16 3h5v5" }],
    ["path", { d: "M21 3 9 15" }]
  ];

  // node_modules/lucide/dist/esm/icons/scan-barcode.mjs
  var ScanBarcode = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    ["path", { d: "M8 7v10" }],
    ["path", { d: "M12 7v10" }],
    ["path", { d: "M17 7v10" }]
  ];

  // node_modules/lucide/dist/esm/icons/scan-box.mjs
  var ScanBox = [
    ["path", { d: "M12 12v5.5" }],
    ["path", { d: "M17 3h2a2 2 0 012 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 01-2 2h-2" }],
    ["path", { d: "M3 7V5a2 2 0 012-2h2" }],
    ["path", { d: "M7 21H5a2 2 0 01-2-2v-2" }],
    ["path", { d: "M7.264 9.252 12 12l4.737-2.748" }],
    [
      "path",
      {
        d: "M7.995 8.514A2 2 0 007 10.244v3.516a2 2 0 00.996 1.73l3 1.74a2 2 0 002.008 0l3-1.74A2 2 0 0017 13.76v-3.517a2 2 0 00-.995-1.73l-3-1.742a2 2 0 00-1.892-.064z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/scan-eye.mjs
  var ScanEye = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    ["circle", { cx: "12", cy: "12", r: "1" }],
    [
      "path",
      {
        d: "M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/scan-face.mjs
  var ScanFace = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    ["path", { d: "M8 14s1.5 2 4 2 4-2 4-2" }],
    ["path", { d: "M9 9h.01" }],
    ["path", { d: "M15 9h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/scan-heart.mjs
  var ScanHeart = [
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    [
      "path",
      { d: "M7.828 13.07A3 3 0 0 1 12 8.764a3 3 0 0 1 4.172 4.306l-3.447 3.62a1 1 0 0 1-1.449 0z" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/scan-line.mjs
  var ScanLine = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    ["path", { d: "M7 12h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/scan-qr-code.mjs
  var ScanQrCode = [
    ["path", { d: "M17 12v4a1 1 0 0 1-1 1h-4" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M17 8V7" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M7 17h.01" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    ["rect", { x: "7", y: "7", width: "5", height: "5", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/scan-search.mjs
  var ScanSearch = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    ["circle", { cx: "12", cy: "12", r: "3" }],
    ["path", { d: "m16 16-1.9-1.9" }]
  ];

  // node_modules/lucide/dist/esm/icons/scan-square.mjs
  var ScanSquare = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    ["rect", { width: "8", height: "8", x: "8", y: "8", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/scan-text.mjs
  var ScanText = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    ["path", { d: "M7 8h8" }],
    ["path", { d: "M7 12h10" }],
    ["path", { d: "M7 16h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/scan.mjs
  var Scan = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/school.mjs
  var School = [
    ["path", { d: "M14 21v-3a2 2 0 0 0-4 0v3" }],
    ["path", { d: "M18 4.933V21" }],
    ["path", { d: "m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6" }],
    [
      "path",
      {
        d: "m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11"
      }
    ],
    ["path", { d: "M6 4.933V21" }],
    ["circle", { cx: "12", cy: "9", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/scissors-line-dashed.mjs
  var ScissorsLineDashed = [
    ["path", { d: "M5.42 9.42 8 12" }],
    ["circle", { cx: "4", cy: "8", r: "2" }],
    ["path", { d: "m14 6-8.58 8.58" }],
    ["circle", { cx: "4", cy: "16", r: "2" }],
    ["path", { d: "M10.8 14.8 14 18" }],
    ["path", { d: "M16 12h-2" }],
    ["path", { d: "M22 12h-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/scissors.mjs
  var Scissors = [
    ["circle", { cx: "6", cy: "6", r: "3" }],
    ["path", { d: "M8.12 8.12 12 12" }],
    ["path", { d: "M20 4 8.12 15.88" }],
    ["circle", { cx: "6", cy: "18", r: "3" }],
    ["path", { d: "M14.8 14.8 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/scooter.mjs
  var Scooter = [
    ["path", { d: "M21 4h-3.5l2 11.05" }],
    ["path", { d: "M6.95 17h5.142c.523 0 .95-.406 1.063-.916a6.5 6.5 0 0 1 5.345-5.009" }],
    ["circle", { cx: "19.5", cy: "17.5", r: "2.5" }],
    ["circle", { cx: "4.5", cy: "17.5", r: "2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/scratch-blocks.mjs
  var ScratchBlocks = [
    [
      "path",
      {
        d: "M19 5a2 2 0 012 2v11a2 2 0 01-2 2h-5.586a1 1 0 00-.707.293l-1.414 1.414a1 1 0 01-.707.293H8.414a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 005.586 20H5a2 2 0 01-2-2V5.286c0-.394.11-.785.36-1.09a6 6 0 019.168-.133C12.996 4.6 13.637 5 14.35 5z"
      }
    ],
    [
      "path",
      {
        d: "M21 12h-7.586a1 1 0 00-.707.293l-1.414 1.414a1 1 0 01-.707.293H8.414a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 005.586 12H3"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/screen-share-off.mjs
  var ScreenShareOff = [
    ["path", { d: "M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" }],
    ["path", { d: "M8 21h8" }],
    ["path", { d: "M12 17v4" }],
    ["path", { d: "m22 3-5 5" }],
    ["path", { d: "m17 3 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/screen-share.mjs
  var ScreenShare = [
    ["path", { d: "M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" }],
    ["path", { d: "M8 21h8" }],
    ["path", { d: "M12 17v4" }],
    ["path", { d: "m17 8 5-5" }],
    ["path", { d: "M17 3h5v5" }]
  ];

  // node_modules/lucide/dist/esm/icons/screw.mjs
  var Screw = [
    ["path", { d: "M10 9v10" }],
    ["path", { d: "M14 13v2" }],
    [
      "path",
      {
        d: "M16.5 10.5 5.706 21.294A2.4 2.4 0 014.002 22H2.5a.5.5 0 01-.5-.5v-1.502a2.4 2.4 0 01.706-1.704L13.5 7.5"
      }
    ],
    [
      "path",
      {
        d: "M20.819 11.575a6 6 0 00.969-5.162.6.6 0 00-.981-.219l-.455.454a1.2 1.2 0 01-1.704 0l-1.296-1.296a1.2 1.2 0 010-1.704l.454-.453a.595.595 0 00-.219-.98 6 6 0 00-5.162.967 2 2 0 00-.222 3.019l5.596 5.597a2 2 0 003.02-.222"
      }
    ],
    ["path", { d: "M6 13v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/scroll-text.mjs
  var ScrollText = [
    ["path", { d: "M15 12h-5" }],
    ["path", { d: "M15 8h-5" }],
    ["path", { d: "M19 17V5a2 2 0 0 0-2-2H4" }],
    [
      "path",
      {
        d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/scroll.mjs
  var Scroll = [
    ["path", { d: "M19 17V5a2 2 0 0 0-2-2H4" }],
    [
      "path",
      {
        d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/search-check.mjs
  var SearchCheck = [
    ["path", { d: "m8 11 2 2 4-4" }],
    ["circle", { cx: "11", cy: "11", r: "8" }],
    ["path", { d: "m21 21-4.3-4.3" }]
  ];

  // node_modules/lucide/dist/esm/icons/search-code.mjs
  var SearchCode = [
    ["path", { d: "m13 13.5 2-2.5-2-2.5" }],
    ["path", { d: "m21 21-4.3-4.3" }],
    ["path", { d: "M9 8.5 7 11l2 2.5" }],
    ["circle", { cx: "11", cy: "11", r: "8" }]
  ];

  // node_modules/lucide/dist/esm/icons/search-exclamation-point.mjs
  var SearchExclamationPoint = [
    ["circle", { cx: "11", cy: "11", r: "8" }],
    ["path", { d: "m21 21-4.3-4.3" }],
    ["path", { d: "M11 7v4" }],
    ["path", { d: "M11 15h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/search-slash.mjs
  var SearchSlash = [
    ["path", { d: "m13.5 8.5-5 5" }],
    ["circle", { cx: "11", cy: "11", r: "8" }],
    ["path", { d: "m21 21-4.3-4.3" }]
  ];

  // node_modules/lucide/dist/esm/icons/search.mjs
  var Search = [
    ["path", { d: "m21 21-4.34-4.34" }],
    ["circle", { cx: "11", cy: "11", r: "8" }]
  ];

  // node_modules/lucide/dist/esm/icons/search-x.mjs
  var SearchX = [
    ["path", { d: "m13.5 8.5-5 5" }],
    ["path", { d: "m8.5 8.5 5 5" }],
    ["circle", { cx: "11", cy: "11", r: "8" }],
    ["path", { d: "m21 21-4.3-4.3" }]
  ];

  // node_modules/lucide/dist/esm/icons/section.mjs
  var Section = [
    ["path", { d: "M16 5a4 3 0 0 0-8 0c0 4 8 3 8 7a4 3 0 0 1-8 0" }],
    ["path", { d: "M8 19a4 3 0 0 0 8 0c0-4-8-3-8-7a4 3 0 0 1 8 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/send-horizontal.mjs
  var SendHorizontal = [
    [
      "path",
      {
        d: "M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z"
      }
    ],
    ["path", { d: "M6 12h16" }]
  ];

  // node_modules/lucide/dist/esm/icons/send-to-back.mjs
  var SendToBack = [
    ["rect", { x: "14", y: "14", width: "8", height: "8", rx: "2" }],
    ["rect", { x: "2", y: "2", width: "8", height: "8", rx: "2" }],
    ["path", { d: "M7 14v1a2 2 0 0 0 2 2h1" }],
    ["path", { d: "M14 7h1a2 2 0 0 1 2 2v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/send.mjs
  var Send = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
      }
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939" }]
  ];

  // node_modules/lucide/dist/esm/icons/separator-horizontal.mjs
  var SeparatorHorizontal = [
    ["path", { d: "m16 16-4 4-4-4" }],
    ["path", { d: "M3 12h18" }],
    ["path", { d: "m8 8 4-4 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/separator-vertical.mjs
  var SeparatorVertical = [
    ["path", { d: "M12 3v18" }],
    ["path", { d: "m16 16 4-4-4-4" }],
    ["path", { d: "m8 8-4 4 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/server-cog.mjs
  var ServerCog = [
    ["path", { d: "m10.852 14.772-.383.923" }],
    ["path", { d: "M13.148 14.772a3 3 0 1 0-2.296-5.544l-.383-.923" }],
    ["path", { d: "m13.148 9.228.383-.923" }],
    ["path", { d: "m13.53 15.696-.382-.924a3 3 0 1 1-2.296-5.544" }],
    ["path", { d: "m14.772 10.852.923-.383" }],
    ["path", { d: "m14.772 13.148.923.383" }],
    ["path", { d: "M4.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5" }],
    ["path", { d: "M4.5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5" }],
    ["path", { d: "M6 18h.01" }],
    ["path", { d: "M6 6h.01" }],
    ["path", { d: "m9.228 10.852-.923-.383" }],
    ["path", { d: "m9.228 13.148-.923.383" }]
  ];

  // node_modules/lucide/dist/esm/icons/server-crash.mjs
  var ServerCrash = [
    ["path", { d: "M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" }],
    ["path", { d: "M6 6h.01" }],
    ["path", { d: "M6 18h.01" }],
    ["path", { d: "m13 6-4 6h6l-4 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/server-plus.mjs
  var ServerPlus = [
    ["path", { d: "M12.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M16 12h6" }],
    ["path", { d: "M19 9v6" }],
    ["path", { d: "M22 18v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h8.5" }],
    ["path", { d: "M6 18h.01" }],
    ["path", { d: "M6 6h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/server-nas.mjs
  var ServerNas = [
    ["path", { d: "M10 16V8" }],
    ["path", { d: "M14 16V8" }],
    ["path", { d: "M18 16V8" }],
    ["path", { d: "M6 12h.01" }],
    ["path", { d: "M6 16h.01" }],
    ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/server-off.mjs
  var ServerOff = [
    ["path", { d: "M7 2h13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-5" }],
    ["path", { d: "M10 10 2.5 2.5C2 2 2 2.5 2 5v3a2 2 0 0 0 2 2h6z" }],
    ["path", { d: "M22 17v-1a2 2 0 0 0-2-2h-1" }],
    ["path", { d: "M4 14a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16.5l1-.5.5.5-8-8H4z" }],
    ["path", { d: "M6 18h.01" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/server.mjs
  var Server = [
    ["rect", { width: "20", height: "8", x: "2", y: "2", rx: "2", ry: "2" }],
    ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2", ry: "2" }],
    ["line", { x1: "6", x2: "6.01", y1: "6", y2: "6" }],
    ["line", { x1: "6", x2: "6.01", y1: "18", y2: "18" }]
  ];

  // node_modules/lucide/dist/esm/icons/settings-2.mjs
  var Settings2 = [
    ["path", { d: "M14 17H5" }],
    ["path", { d: "M19 7h-9" }],
    ["circle", { cx: "17", cy: "17", r: "3" }],
    ["circle", { cx: "7", cy: "7", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/settings.mjs
  var Settings = [
    [
      "path",
      {
        d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/shapes.mjs
  var Shapes = [
    [
      "path",
      {
        d: "M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"
      }
    ],
    ["rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }],
    ["circle", { cx: "17.5", cy: "17.5", r: "3.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/share-2.mjs
  var Share2 = [
    ["circle", { cx: "18", cy: "5", r: "3" }],
    ["circle", { cx: "6", cy: "12", r: "3" }],
    ["circle", { cx: "18", cy: "19", r: "3" }],
    ["line", { x1: "8.59", x2: "15.42", y1: "13.51", y2: "17.49" }],
    ["line", { x1: "15.41", x2: "8.59", y1: "6.51", y2: "10.49" }]
  ];

  // node_modules/lucide/dist/esm/icons/share.mjs
  var Share = [
    ["path", { d: "M12 2v13" }],
    ["path", { d: "m16 6-4-4-4 4" }],
    ["path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" }]
  ];

  // node_modules/lucide/dist/esm/icons/sheet.mjs
  var Sheet = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ["line", { x1: "3", x2: "21", y1: "9", y2: "9" }],
    ["line", { x1: "3", x2: "21", y1: "15", y2: "15" }],
    ["line", { x1: "9", x2: "9", y1: "9", y2: "21" }],
    ["line", { x1: "15", x2: "15", y1: "9", y2: "21" }]
  ];

  // node_modules/lucide/dist/esm/icons/shell.mjs
  var Shell = [
    [
      "path",
      {
        d: "M14 11a2 2 0 1 1-4 0 4 4 0 0 1 8 0 6 6 0 0 1-12 0 8 8 0 0 1 16 0 10 10 0 1 1-20 0 11.93 11.93 0 0 1 2.42-7.22 2 2 0 1 1 3.16 2.44"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/shelving-unit.mjs
  var ShelvingUnit = [
    ["path", { d: "M12 12V9a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" }],
    ["path", { d: "M16 20v-3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3" }],
    ["path", { d: "M20 22V2" }],
    ["path", { d: "M4 12h16" }],
    ["path", { d: "M4 20h16" }],
    ["path", { d: "M4 2v20" }],
    ["path", { d: "M4 4h16" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-ban.mjs
  var ShieldBan = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "m4.243 5.21 14.39 12.472" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-check.mjs
  var ShieldCheck = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "m9 12 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-cog-corner.mjs
  var ShieldCogCorner = [
    [
      "path",
      {
        d: "M11 22c-3.806-1.45-7-3.966-7-9V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v4"
      }
    ],
    ["path", { d: "M14.923 16.547 14 16.164" }],
    ["path", { d: "m14.923 18.843-.923.383" }],
    ["path", { d: "M16.547 14.923 16.164 14" }],
    ["path", { d: "m16.547 20.467-.383.924" }],
    ["path", { d: "m18.843 14.923.383-.923" }],
    ["path", { d: "m19.225 21.391-.382-.924" }],
    ["path", { d: "m20.467 16.547.923-.383" }],
    ["path", { d: "m20.467 18.843.923.383" }],
    ["circle", { cx: "17.695", cy: "17.695", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-cog.mjs
  var ShieldCog = [
    ["path", { d: "m10.929 14.467-.383.924" }],
    ["path", { d: "M10.929 8.923 10.546 8" }],
    ["path", { d: "M13.225 8.923 13.608 8" }],
    ["path", { d: "m13.607 15.391-.382-.924" }],
    ["path", { d: "m14.849 10.547.923-.383" }],
    ["path", { d: "m14.849 12.843.923.383" }],
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "m9.305 10.547-.923-.383" }],
    ["path", { d: "m9.305 12.843-.923.383" }],
    ["circle", { cx: "12.077", cy: "11.695", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-ellipsis.mjs
  var ShieldEllipsis = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "M8 12h.01" }],
    ["path", { d: "M12 12h.01" }],
    ["path", { d: "M16 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-exclamation-point.mjs
  var ShieldExclamationPoint = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "M12 8v4" }],
    ["path", { d: "M12 16h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-half.mjs
  var ShieldHalf = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "M12 22V2" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-house.mjs
  var ShieldHouse = [
    [
      "path",
      {
        d: "M15 22a1 1 0 01-1-1v-4a1 1 0 01.445-.832l3-2a1 1 0 011.11 0l3 2A1 1 0 0122 17v4a1 1 0 01-1 1z"
      }
    ],
    ["path", { d: "M18 22v-3" }],
    [
      "path",
      {
        d: "M20 10.418V6a1 1 0 00-1-1c-2 0-4.49-1.19-6.24-2.72a1.17 1.17 0 00-1.52 0C9.5 3.8 7 5 5 5a1 1 0 00-1 1v7c0 4.602 2.67 7.1 6.037 8.603"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/shield-keyhole.mjs
  var ShieldKeyhole = [
    ["path", { d: "M12 13v3" }],
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z"
      }
    ],
    ["circle", { cx: "12", cy: "11", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-lock.mjs
  var ShieldLock = [
    [
      "path",
      {
        d: "M20 9.807V6a1 1 0 00-1-1c-2 0-4.49-1.19-6.24-2.72a1.17 1.17 0 00-1.52 0C9.5 3.8 7 5 5 5a1 1 0 00-1 1v7c0 3.88 2.107 6.254 5 7.796"
      }
    ],
    ["path", { d: "M19 17v-2a2 2 0 00-4 0v2" }],
    ["rect", { x: "13", y: "17", width: "8", height: "5", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-minus.mjs
  var ShieldMinus = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "M9 12h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-off.mjs
  var ShieldOff = [
    ["path", { d: "m2 2 20 20" }],
    [
      "path",
      {
        d: "M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71"
      }
    ],
    [
      "path",
      {
        d: "M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/shield-plus.mjs
  var ShieldPlus = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "M9 12h6" }],
    ["path", { d: "M12 9v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-question-mark.mjs
  var ShieldQuestionMark = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" }],
    ["path", { d: "M12 17h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-user.mjs
  var ShieldUser = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "M6.376 18.91a6 6 0 0 1 11.249.003" }],
    ["circle", { cx: "12", cy: "11", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield-x.mjs
  var ShieldX = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "m14.5 9.5-5 5" }],
    ["path", { d: "m9.5 9.5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/shield.mjs
  var Shield = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/ship-cargo.mjs
  var ShipCargo = [
    ["path", { d: "M12 15v-3" }],
    ["path", { d: "M12 2v2" }],
    [
      "path",
      {
        d: "M16.5 12V9a1 1 0 011-1h1a1 1 0 001-1V5a1 1 0 00-1-1h-13a1 1 0 00-1 1v2a1 1 0 001 1h1a1 1 0 011 1v3"
      }
    ],
    [
      "path",
      {
        d: "M19.38 19c1.076-1.815 1.636-4.89 1.628-6.008a1 1 0 00-1-.992H3.984a1 1 0 00-1 .984c-.03 1.86.97 5.621 2.826 7.776"
      }
    ],
    [
      "path",
      {
        d: "M2 20c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/ship-wheel.mjs
  var ShipWheel = [
    ["circle", { cx: "12", cy: "12", r: "8" }],
    ["path", { d: "M12 2v7.5" }],
    ["path", { d: "m19 5-5.23 5.23" }],
    ["path", { d: "M22 12h-7.5" }],
    ["path", { d: "m19 19-5.23-5.23" }],
    ["path", { d: "M12 14.5V22" }],
    ["path", { d: "M10.23 13.77 5 19" }],
    ["path", { d: "M9.5 12H2" }],
    ["path", { d: "M10.23 10.23 5 5" }],
    ["circle", { cx: "12", cy: "12", r: "2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/ship.mjs
  var Ship = [
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M12 9.189V13" }],
    ["path", { d: "M19 12V6a2 2 0 00-2-2H7a2 2 0 00-2 2v6" }],
    [
      "path",
      {
        d: "M19.38 19A11.6 11.6 0 0021 13l-8.188-3.639a2 2 0 00-1.624 0L3 13.001a11.6 11.6 0 002.81 7.76"
      }
    ],
    [
      "path",
      {
        d: "M2 20c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/shirt.mjs
  var Shirt = [
    [
      "path",
      {
        d: "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/shopping-bag.mjs
  var ShoppingBag = [
    ["path", { d: "M16 10a4 4 0 0 1-8 0" }],
    ["path", { d: "M3.103 6.034h17.794" }],
    [
      "path",
      {
        d: "M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/shopping-basket.mjs
  var ShoppingBasket = [
    ["path", { d: "m15 11-1 9" }],
    ["path", { d: "m19 11-4-7" }],
    ["path", { d: "M2 11h20" }],
    ["path", { d: "m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" }],
    ["path", { d: "M4.5 15.5h15" }],
    ["path", { d: "m5 11 4-7" }],
    ["path", { d: "m9 11 1 9" }]
  ];

  // node_modules/lucide/dist/esm/icons/shopping-cart-minus.mjs
  var ShoppingCartMinus = [
    ["path", { d: "M16 5h6" }],
    ["path", { d: "m2.05 2.05 1.099-.028a1 1 0 011.008.815l2.69 14.347A1 1 0 007.83 18H18" }],
    ["path", { d: "M4.564 5H12" }],
    ["path", { d: "M6.25 14h12.712a2 2 0 001.991-1.57l.514-3.113" }],
    ["circle", { cx: "18", cy: "20", r: "2" }],
    ["circle", { cx: "8", cy: "20", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/shopping-cart-plus.mjs
  var ShoppingCartPlus = [
    ["path", { d: "M16 5h6" }],
    ["path", { d: "M19 2v6" }],
    ["path", { d: "m2.05 2.05 1.099-.028a1 1 0 011.008.815l2.69 14.347A1 1 0 007.83 18H18" }],
    ["path", { d: "M4.564 5H12" }],
    ["path", { d: "M6.25 14h12.712a2 2 0 001.991-1.57l.172-1.041" }],
    ["circle", { cx: "18", cy: "20", r: "2" }],
    ["circle", { cx: "8", cy: "20", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/shopping-cart.mjs
  var ShoppingCart = [
    ["path", { d: "m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18" }],
    ["path", { d: "M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25" }],
    ["circle", { cx: "18", cy: "20", r: "2" }],
    ["circle", { cx: "8", cy: "20", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/shovel.mjs
  var Shovel = [
    [
      "path",
      {
        d: "M21.56 4.56a1.5 1.5 0 0 1 0 2.122l-.47.47a3 3 0 0 1-4.212-.03 3 3 0 0 1 0-4.243l.44-.44a1.5 1.5 0 0 1 2.121 0z"
      }
    ],
    [
      "path",
      {
        d: "M3 22a1 1 0 0 1-1-1v-3.586a1 1 0 0 1 .293-.707l3.355-3.355a1.205 1.205 0 0 1 1.704 0l3.296 3.296a1.205 1.205 0 0 1 0 1.704l-3.355 3.355a1 1 0 0 1-.707.293z"
      }
    ],
    ["path", { d: "m9 15 7.879-7.878" }]
  ];

  // node_modules/lucide/dist/esm/icons/shower-head.mjs
  var ShowerHead = [
    ["path", { d: "m4 4 2.5 2.5" }],
    ["path", { d: "M13.5 6.5a4.95 4.95 0 0 0-7 7" }],
    ["path", { d: "M15 5 5 15" }],
    ["path", { d: "M14 17v.01" }],
    ["path", { d: "M10 16v.01" }],
    ["path", { d: "M13 13v.01" }],
    ["path", { d: "M16 10v.01" }],
    ["path", { d: "M11 20v.01" }],
    ["path", { d: "M17 14v.01" }],
    ["path", { d: "M20 11v.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/shredder.mjs
  var Shredder = [
    [
      "path",
      { d: "M4 13V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5" }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M10 22v-5" }],
    ["path", { d: "M14 19v-2" }],
    ["path", { d: "M18 20v-3" }],
    ["path", { d: "M2 13h20" }],
    ["path", { d: "M6 20v-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/shrimp-off.mjs
  var ShrimpOff = [
    ["path", { d: "M10 2a3.28 3.28 0 003.227 1.798l6.17-.561A1 1 0 1119.614 8H13.5" }],
    ["path", { d: "M11 20c-.5.5-1.12 1-2.5 1a1 1 0 010-5H12a7 7 0 003.283-.817" }],
    ["path", { d: "M11 22c-.5-.5-1.12-1-2.5-1a6.5 6.5 0 01-5.63-3.25 6.44 6.44 0 015.236-9.744" }],
    ["path", { d: "M18.04 12.54A7 7 0 0019 9V8" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M8 16c-2 0-4.5-4-4-6" }],
    ["path", { d: "M9.43 9.33A8.5 8.5 0 0010 16" }]
  ];

  // node_modules/lucide/dist/esm/icons/shrimp.mjs
  var Shrimp = [
    [
      "path",
      {
        d: "M10 2a3.28 3.28 0 003.227 1.798l6.17-.561A1 1 0 1119.614 8H8.5a6.44 6.44 0 00-5.63 9.75A6.5 6.5 0 008.5 21c1.38 0 2-.5 2.5-1"
      }
    ],
    ["path", { d: "M10 8a8.5 8.5 0 000 8" }],
    ["path", { d: "M11 22c-.5-.5-1.12-1-2.5-1a1 1 0 010-5H12a7 7 0 007-7V8" }],
    ["path", { d: "M13 12h.01" }],
    ["path", { d: "M8 16c-2 0-4.5-4-4-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/shuffle.mjs
  var Shuffle = [
    ["path", { d: "m18 14 4 4-4 4" }],
    ["path", { d: "m18 2 4 4-4 4" }],
    ["path", { d: "M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" }],
    ["path", { d: "M2 6h1.972a4 4 0 0 1 3.6 2.2" }],
    ["path", { d: "M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" }]
  ];

  // node_modules/lucide/dist/esm/icons/shrink.mjs
  var Shrink = [
    ["path", { d: "m15 15 6 6m-6-6v4.8m0-4.8h4.8" }],
    ["path", { d: "M9 19.8V15m0 0H4.2M9 15l-6 6" }],
    ["path", { d: "M15 4.2V9m0 0h4.8M15 9l6-6" }],
    ["path", { d: "M9 4.2V9m0 0H4.2M9 9 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/shrub.mjs
  var Shrub = [
    ["path", { d: "M12 22v-5.172a2 2 0 0 0-.586-1.414L9.5 13.5" }],
    ["path", { d: "M14.5 14.5 12 17" }],
    ["path", { d: "M17 8.8A6 6 0 0 1 13.8 20H10A6.5 6.5 0 0 1 7 8a5 5 0 0 1 10 0z" }]
  ];

  // node_modules/lucide/dist/esm/icons/signal-high.mjs
  var SignalHigh = [
    ["path", { d: "M2 20h.01" }],
    ["path", { d: "M7 20v-4" }],
    ["path", { d: "M12 20v-8" }],
    ["path", { d: "M17 20V8" }]
  ];

  // node_modules/lucide/dist/esm/icons/sigma.mjs
  var Sigma = [
    [
      "path",
      {
        d: "M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/signal-low.mjs
  var SignalLow = [
    ["path", { d: "M2 20h.01" }],
    ["path", { d: "M7 20v-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/signal-medium.mjs
  var SignalMedium = [
    ["path", { d: "M2 20h.01" }],
    ["path", { d: "M7 20v-4" }],
    ["path", { d: "M12 20v-8" }]
  ];

  // node_modules/lucide/dist/esm/icons/signal-zero.mjs
  var SignalZero = [["path", { d: "M2 20h.01" }]];

  // node_modules/lucide/dist/esm/icons/signal.mjs
  var Signal = [
    ["path", { d: "M2 20h.01" }],
    ["path", { d: "M7 20v-4" }],
    ["path", { d: "M12 20v-8" }],
    ["path", { d: "M17 20V8" }],
    ["path", { d: "M22 4v16" }]
  ];

  // node_modules/lucide/dist/esm/icons/signature.mjs
  var Signature = [
    [
      "path",
      {
        d: "m21 17-2.156-1.868A.5.5 0 0 0 18 15.5v.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1c0-2.545-3.991-3.97-8.5-4a1 1 0 0 0 0 5c4.153 0 4.745-11.295 5.708-13.5a2.5 2.5 0 1 1 3.31 3.284"
      }
    ],
    ["path", { d: "M3 21h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/signpost-big.mjs
  var SignpostBig = [
    ["path", { d: "M10 9H4L2 7l2-2h6" }],
    ["path", { d: "M14 5h6l2 2-2 2h-6" }],
    ["path", { d: "M10 22V4a2 2 0 1 1 4 0v18" }],
    ["path", { d: "M8 22h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/signpost.mjs
  var Signpost = [
    ["path", { d: "M12 13v8" }],
    ["path", { d: "M12 3v3" }],
    [
      "path",
      {
        d: "M2.354 10.354a1.207 1.207 0 0 1 0-1.708l2.06-2.06A2 2 0 0 1 5.828 6h12.344a2 2 0 0 1 1.414.586l2.06 2.06a1.207 1.207 0 0 1 0 1.708l-2.06 2.06a2 2 0 0 1-1.414.586H5.828a2 2 0 0 1-1.414-.586z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/siren-off.mjs
  var SirenOff = [
    ["path", { d: "M12 12v6" }],
    ["path", { d: "M12 2v1" }],
    ["path", { d: "M12.707 7.05a5 5 0 0 1 4.243 4.243" }],
    ["path", { d: "M17 17v1H7a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2" }],
    ["path", { d: "M18.5 4.5 18 5" }],
    ["path", { d: "M2 12h1" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M21 12h1" }],
    ["path", { d: "M7 18v-6a5 5 0 0 1 1.464-3.536" }]
  ];

  // node_modules/lucide/dist/esm/icons/siren.mjs
  var Siren = [
    ["path", { d: "M7 18v-6a5 5 0 1 1 10 0v6" }],
    ["path", { d: "M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" }],
    ["path", { d: "M21 12h1" }],
    ["path", { d: "M18.5 4.5 18 5" }],
    ["path", { d: "M2 12h1" }],
    ["path", { d: "M12 2v1" }],
    ["path", { d: "m4.929 4.929.707.707" }],
    ["path", { d: "M12 12v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/sixteenth-notes.mjs
  var SixteenthNotes = [
    ["path", { d: "M21 16V3a1 1 0 0 0-1.28-.96l-10 2.917a1 1 0 0 0-.72.96V19" }],
    ["path", { d: "M21 6 9 9.5" }],
    ["circle", { cx: "18", cy: "16", r: "3" }],
    ["circle", { cx: "6", cy: "19", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/skip-back.mjs
  var SkipBack = [
    [
      "path",
      {
        d: "M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z"
      }
    ],
    ["path", { d: "M3 20V4" }]
  ];

  // node_modules/lucide/dist/esm/icons/skip-forward.mjs
  var SkipForward = [
    ["path", { d: "M21 4v16" }],
    [
      "path",
      { d: "M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/skull.mjs
  var Skull = [
    ["path", { d: "m12.5 17-.5-1-.5 1h1z" }],
    [
      "path",
      {
        d: "M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"
      }
    ],
    ["circle", { cx: "15", cy: "12", r: "1" }],
    ["circle", { cx: "9", cy: "12", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/slash.mjs
  var Slash = [["path", { d: "M22 2 2 22" }]];

  // node_modules/lucide/dist/esm/icons/slice.mjs
  var Slice = [
    [
      "path",
      {
        d: "M11 16.586V19a1 1 0 0 1-1 1H2L18.37 3.63a1 1 0 1 1 3 3l-9.663 9.663a1 1 0 0 1-1.414 0L8 14"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/sliders-horizontal.mjs
  var SlidersHorizontal = [
    ["path", { d: "M10 5H3" }],
    ["path", { d: "M12 19H3" }],
    ["path", { d: "M14 3v4" }],
    ["path", { d: "M16 17v4" }],
    ["path", { d: "M21 12h-9" }],
    ["path", { d: "M21 19h-5" }],
    ["path", { d: "M21 5h-7" }],
    ["path", { d: "M8 10v4" }],
    ["path", { d: "M8 12H3" }]
  ];

  // node_modules/lucide/dist/esm/icons/sliders-vertical.mjs
  var SlidersVertical = [
    ["path", { d: "M10 8h4" }],
    ["path", { d: "M12 21v-9" }],
    ["path", { d: "M12 8V3" }],
    ["path", { d: "M17 16h4" }],
    ["path", { d: "M19 12V3" }],
    ["path", { d: "M19 21v-5" }],
    ["path", { d: "M3 14h4" }],
    ["path", { d: "M5 10V3" }],
    ["path", { d: "M5 21v-7" }]
  ];

  // node_modules/lucide/dist/esm/icons/smartphone-charging.mjs
  var SmartphoneCharging = [
    ["rect", { width: "14", height: "20", x: "5", y: "2", rx: "2", ry: "2" }],
    ["path", { d: "M12.667 8 10 12h4l-2.667 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/smartphone-nfc.mjs
  var SmartphoneNfc = [
    ["rect", { width: "7", height: "12", x: "2", y: "6", rx: "1" }],
    ["path", { d: "M13 8.32a7.43 7.43 0 0 1 0 7.36" }],
    ["path", { d: "M16.46 6.21a11.76 11.76 0 0 1 0 11.58" }],
    ["path", { d: "M19.91 4.1a15.91 15.91 0 0 1 .01 15.8" }]
  ];

  // node_modules/lucide/dist/esm/icons/smartphone-user-round.mjs
  var SmartphoneUserRound = [
    ["path", { d: "M10 22H6a2 2 0 01-2-2V4a2 2 0 012-2h10a2 2 0 012 2v4" }],
    ["path", { d: "M11 18h.01" }],
    ["path", { d: "M22 22a4 4 0 00-8 0" }],
    ["circle", { cx: "18", cy: "15", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/snail.mjs
  var Snail = [
    ["path", { d: "M2 13a6 6 0 1 0 12 0 4 4 0 1 0-8 0 2 2 0 0 0 4 0" }],
    ["circle", { cx: "10", cy: "13", r: "8" }],
    ["path", { d: "M2 21h12c4.4 0 8-3.6 8-8V7a2 2 0 1 0-4 0v6" }],
    ["path", { d: "M18 3 19.1 5.2" }],
    ["path", { d: "M22 3 20.9 5.2" }]
  ];

  // node_modules/lucide/dist/esm/icons/smartphone.mjs
  var Smartphone = [
    ["rect", { width: "14", height: "20", x: "5", y: "2", rx: "2", ry: "2" }],
    ["path", { d: "M12 18h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/snowflake.mjs
  var Snowflake = [
    ["path", { d: "m10 20-1.25-2.5L6 18" }],
    ["path", { d: "M10 4 8.75 6.5 6 6" }],
    ["path", { d: "m14 20 1.25-2.5L18 18" }],
    ["path", { d: "m14 4 1.25 2.5L18 6" }],
    ["path", { d: "m17 21-3-6h-4" }],
    ["path", { d: "m17 3-3 6 1.5 3" }],
    ["path", { d: "M2 12h6.5L10 9" }],
    ["path", { d: "m20 10-1.5 2 1.5 2" }],
    ["path", { d: "M22 12h-6.5L14 15" }],
    ["path", { d: "m4 10 1.5 2L4 14" }],
    ["path", { d: "m7 21 3-6-1.5-3" }],
    ["path", { d: "m7 3 3 6h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/sofa.mjs
  var Sofa = [
    ["path", { d: "M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" }],
    [
      "path",
      {
        d: "M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"
      }
    ],
    ["path", { d: "M4 18v2" }],
    ["path", { d: "M20 18v2" }],
    ["path", { d: "M12 4v9" }]
  ];

  // node_modules/lucide/dist/esm/icons/soap-dispenser-droplet.mjs
  var SoapDispenserDroplet = [
    ["path", { d: "M10.5 2v4" }],
    ["path", { d: "M14 2H7a2 2 0 0 0-2 2" }],
    [
      "path",
      {
        d: "M19.29 14.76A6.67 6.67 0 0 1 17 11a6.6 6.6 0 0 1-2.29 3.76c-1.15.92-1.71 2.04-1.71 3.19 0 2.22 1.8 4.05 4 4.05s4-1.83 4-4.05c0-1.16-.57-2.26-1.71-3.19"
      }
    ],
    ["path", { d: "M9.607 21H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h7V7a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/solar-panel.mjs
  var SolarPanel = [
    ["path", { d: "M11 2h2" }],
    ["path", { d: "m14.28 14-4.56 8" }],
    ["path", { d: "m21 22-1.558-4H4.558" }],
    ["path", { d: "M3 10v2" }],
    [
      "path",
      {
        d: "M6.245 15.04A2 2 0 0 1 8 14h12a1 1 0 0 1 .864 1.505l-3.11 5.457A2 2 0 0 1 16 22H4a1 1 0 0 1-.863-1.506z"
      }
    ],
    ["path", { d: "M7 2a4 4 0 0 1-4 4" }],
    ["path", { d: "m8.66 7.66 1.41 1.41" }]
  ];

  // node_modules/lucide/dist/esm/icons/soup.mjs
  var Soup = [
    [
      "path",
      { d: "M11.248 3c.273.1.808.53.747 1.36-.05.83-.938 1.2-.989 2.02-.06.78.333 1.24.727 1.62" }
    ],
    [
      "path",
      { d: "M16.252 3c.268.1.794.53.745 1.36-.06.83-.923 1.2-.993 2.02-.05.78.338 1.24.725 1.62" }
    ],
    ["path", { d: "M19.5 12 22 6" }],
    ["path", { d: "M4 12a1 1 0 00-.99 1.133A9 9 0 0012 21a9 9 0 008.99-7.867A1 1 0 0020 12z" }],
    [
      "path",
      { d: "M6.252 3c.268.1.794.53.745 1.36-.06.83-.923 1.2-.993 2.02-.05.78.338 1.24.735 1.62" }
    ],
    ["path", { d: "M7 21h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/spade.mjs
  var Spade = [
    ["path", { d: "M12 18v4" }],
    [
      "path",
      {
        d: "M2 14.499a5.5 5.5 0 0 0 9.591 3.675.6.6 0 0 1 .818.001A5.5 5.5 0 0 0 22 14.5c0-2.29-1.5-4-3-5.5l-5.492-5.312a2 2 0 0 0-3-.02L5 8.999c-1.5 1.5-3 3.2-3 5.5"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/space.mjs
  var Space = [["path", { d: "M22 17v1c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1" }]];

  // node_modules/lucide/dist/esm/icons/sparkle.mjs
  var Sparkle = [
    [
      "path",
      {
        d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/sparkles.mjs
  var Sparkles = [
    [
      "path",
      {
        d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
      }
    ],
    ["path", { d: "M20 2v4" }],
    ["path", { d: "M22 4h-4" }],
    ["circle", { cx: "4", cy: "20", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/speaker.mjs
  var Speaker = [
    ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2" }],
    ["path", { d: "M12 6h.01" }],
    ["circle", { cx: "12", cy: "14", r: "4" }],
    ["path", { d: "M12 14h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/spell-check-2.mjs
  var SpellCheck2 = [
    ["path", { d: "m6 16 6-12 6 12" }],
    ["path", { d: "M8 12h8" }],
    [
      "path",
      {
        d: "M4 21c1.1 0 1.1-1 2.3-1s1.1 1 2.3 1c1.1 0 1.1-1 2.3-1 1.1 0 1.1 1 2.3 1 1.1 0 1.1-1 2.3-1 1.1 0 1.1 1 2.3 1 1.1 0 1.1-1 2.3-1"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/speech.mjs
  var Speech = [
    [
      "path",
      {
        d: "M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.054 1 4.55a5.77 5.77 0 0 1 .029 2.758L2 20"
      }
    ],
    ["path", { d: "M19.8 17.8a7.5 7.5 0 0 0 .003-10.603" }],
    ["path", { d: "M17 15a3.5 3.5 0 0 0-.025-4.975" }]
  ];

  // node_modules/lucide/dist/esm/icons/spell-check.mjs
  var SpellCheck = [
    ["path", { d: "m20 15-5.5 5.5L12 18" }],
    ["path", { d: "m4 16 6-12 5.115 10.23" }],
    ["path", { d: "M6 12h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/spline-pointer.mjs
  var SplinePointer = [
    [
      "path",
      {
        d: "M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"
      }
    ],
    ["path", { d: "M5 17A12 12 0 0 1 17 5" }],
    ["circle", { cx: "19", cy: "5", r: "2" }],
    ["circle", { cx: "5", cy: "19", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/spline.mjs
  var Spline = [
    ["circle", { cx: "19", cy: "5", r: "2" }],
    ["circle", { cx: "5", cy: "19", r: "2" }],
    ["path", { d: "M5 17A12 12 0 0 1 17 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/split.mjs
  var Split = [
    ["path", { d: "M16 3h5v5" }],
    ["path", { d: "M8 3H3v5" }],
    ["path", { d: "M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" }],
    ["path", { d: "m15 9 6-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/spool.mjs
  var Spool = [
    [
      "path",
      {
        d: "M17 13.44 4.442 17.082A2 2 0 0 0 4.982 21H19a2 2 0 0 0 .558-3.921l-1.115-.32A2 2 0 0 1 17 14.837V7.66"
      }
    ],
    [
      "path",
      {
        d: "m7 10.56 12.558-3.642A2 2 0 0 0 19.018 3H5a2 2 0 0 0-.558 3.921l1.115.32A2 2 0 0 1 7 9.163v7.178"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/sport-shoe.mjs
  var SportShoe = [
    ["path", { d: "m15 10.42 4.8-5.07" }],
    ["path", { d: "M19 18h3" }],
    [
      "path",
      {
        d: "M9.5 22 21.414 9.415A2 2 0 0 0 21.2 6.4l-5.61-4.208A1 1 0 0 0 14 3v2a2 2 0 0 1-1.394 1.906L8.677 8.053A1 1 0 0 0 8 9c-.155 6.393-2.082 9-4 9a2 2 0 0 0 0 4h14"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/spotlight.mjs
  var Spotlight = [
    ["path", { d: "M15.295 19.562 16 22" }],
    ["path", { d: "m17 16 3.758 2.098" }],
    ["path", { d: "m19 12.5 3.026-.598" }],
    [
      "path",
      {
        d: "M7.61 6.3a3 3 0 0 0-3.92 1.3l-1.38 2.79a3 3 0 0 0 1.3 3.91l6.89 3.597a1 1 0 0 0 1.342-.447l3.106-6.211a1 1 0 0 0-.447-1.341z"
      }
    ],
    ["path", { d: "M8 9V2" }]
  ];

  // node_modules/lucide/dist/esm/icons/sprout.mjs
  var Sprout = [
    [
      "path",
      {
        d: "M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"
      }
    ],
    ["path", { d: "M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" }],
    ["path", { d: "M5 21h14" }]
  ];

  // node_modules/lucide/dist/esm/icons/spray-can.mjs
  var SprayCan = [
    ["path", { d: "M3 3h.01" }],
    ["path", { d: "M7 5h.01" }],
    ["path", { d: "M11 7h.01" }],
    ["path", { d: "M3 7h.01" }],
    ["path", { d: "M7 9h.01" }],
    ["path", { d: "M3 11h.01" }],
    ["rect", { width: "4", height: "4", x: "15", y: "5" }],
    ["path", { d: "m19 9 2 2v10c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1V11l2-2" }],
    ["path", { d: "m13 14 8-2" }],
    ["path", { d: "m13 19 8-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-activity.mjs
  var SquareActivity = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M17 12h-2l-2 5-2-10-2 5H7" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-down.mjs
  var SquareArrowDown = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M12 8v8" }],
    ["path", { d: "m8 12 4 4 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-down-left.mjs
  var SquareArrowDownLeft = [
    ["path", { d: "M15 15H9l6-6" }],
    ["path", { d: "M9 15V9" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-down-right.mjs
  var SquareArrowDownRight = [
    ["path", { d: "M15 15 9 9" }],
    ["path", { d: "M9 15h6V9" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-left.mjs
  var SquareArrowLeft = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "m12 8-4 4 4 4" }],
    ["path", { d: "M16 12H8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-out-down-left.mjs
  var SquareArrowOutDownLeft = [
    ["path", { d: "M13 21h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6" }],
    ["path", { d: "m3 21 9-9" }],
    ["path", { d: "M9 21H3v-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-out-down-right.mjs
  var SquareArrowOutDownRight = [
    ["path", { d: "M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" }],
    ["path", { d: "m21 21-9-9" }],
    ["path", { d: "M21 15v6h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-out-up-left.mjs
  var SquareArrowOutUpLeft = [
    ["path", { d: "M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6" }],
    ["path", { d: "m3 3 9 9" }],
    ["path", { d: "M3 9V3h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-out-up-right.mjs
  var SquareArrowOutUpRight = [
    ["path", { d: "M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" }],
    ["path", { d: "m21 3-9 9" }],
    ["path", { d: "M15 3h6v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-right-enter.mjs
  var SquareArrowRightEnter = [
    ["path", { d: "m10 16 4-4-4-4" }],
    ["path", { d: "M3 12h11" }],
    ["path", { d: "M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-right-exit.mjs
  var SquareArrowRightExit = [
    ["path", { d: "M10 12h11" }],
    ["path", { d: "m17 16 4-4-4-4" }],
    [
      "path",
      { d: "M21 6.344V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.344" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-right.mjs
  var SquareArrowRight = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M8 12h8" }],
    ["path", { d: "m12 16 4-4-4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-up-left.mjs
  var SquareArrowUpLeft = [
    ["path", { d: "M15 15 9 9" }],
    ["path", { d: "M9 15V9h6" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-up-right.mjs
  var SquareArrowUpRight = [
    ["path", { d: "M15 15V9H9" }],
    ["path", { d: "m9 15 6-6" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-arrow-up.mjs
  var SquareArrowUp = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "m16 12-4-4-4 4" }],
    ["path", { d: "M12 16V8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-asterisk.mjs
  var SquareAsterisk = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M12 8v8" }],
    ["path", { d: "m8.5 14 7-4" }],
    ["path", { d: "m8.5 10 7 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-bookmark.mjs
  var SquareBookmark = [
    [
      "path",
      {
        d: "M11 3v7.751a.25.25 0 00.407.195l2.28-1.834a.5.5 0 01.627 0l2.28 1.834a.25.25 0 00.406-.195V3"
      }
    ],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-bottom-dashed-scissors.mjs
  var SquareBottomDashedScissors = [
    ["path", { d: "M14 21h1" }],
    ["path", { d: "m17 17-2.18-2.18" }],
    ["path", { d: "M5 21a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2" }],
    ["path", { d: "M9 21h1" }],
    ["path", { d: "M9.56 14.44 17 7" }],
    ["path", { d: "M9.56 9.56 12 12" }],
    ["circle", { cx: "8.5", cy: "15.5", r: "1.5" }],
    ["circle", { cx: "8.5", cy: "8.5", r: "1.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-centerline-dashed-horizontal.mjs
  var SquareCenterlineDashedHorizontal = [
    ["path", { d: "M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" }],
    ["path", { d: "M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" }],
    ["path", { d: "M12 20v2" }],
    ["path", { d: "M12 14v2" }],
    ["path", { d: "M12 8v2" }],
    ["path", { d: "M12 2v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-centerline-dashed-vertical.mjs
  var SquareCenterlineDashedVertical = [
    ["path", { d: "M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" }],
    ["path", { d: "M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" }],
    ["path", { d: "M4 12H2" }],
    ["path", { d: "M10 12H8" }],
    ["path", { d: "M16 12h-2" }],
    ["path", { d: "M22 12h-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-chart-gantt.mjs
  var SquareChartGantt = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M9 8h7" }],
    ["path", { d: "M8 12h6" }],
    ["path", { d: "M11 16h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-check-big.mjs
  var SquareCheckBig = [
    ["path", { d: "M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344" }],
    ["path", { d: "m9 11 3 3L22 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-check.mjs
  var SquareCheck = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "m16 9-5.5 5.5L8 12" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-chevron-down.mjs
  var SquareChevronDown = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "m16 10-4 4-4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-chevron-left.mjs
  var SquareChevronLeft = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "m14 16-4-4 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-chevron-right.mjs
  var SquareChevronRight = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "m10 8 4 4-4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-chevron-up.mjs
  var SquareChevronUp = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "m8 14 4-4 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-chevrons-down.mjs
  var SquareChevronsDown = [
    ["path", { d: "M9 14L12 17L15 14" }],
    ["path", { d: "M9 8L12 11L15 8" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-chevrons-left.mjs
  var SquareChevronsLeft = [
    ["path", { d: "M10 9L7 12L10 15" }],
    ["path", { d: "M16 9L13 12L16 15" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-chevrons-right.mjs
  var SquareChevronsRight = [
    ["path", { d: "M14 15L17 12L14 9" }],
    ["path", { d: "M8 15L11 12L8 9" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-chevrons-up.mjs
  var SquareChevronsUp = [
    ["path", { d: "M15 10L12 7L9 10" }],
    ["path", { d: "M15 16L12 13L9 16" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-code.mjs
  var SquareCode = [
    ["path", { d: "m10 9-3 3 3 3" }],
    ["path", { d: "m14 15 3-3-3-3" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dashed-bottom-code.mjs
  var SquareDashedBottomCode = [
    ["path", { d: "M10 9.5 8 12l2 2.5" }],
    ["path", { d: "M14 21h1" }],
    ["path", { d: "m14 9.5 2 2.5-2 2.5" }],
    ["path", { d: "M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2" }],
    ["path", { d: "M9 21h1" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dashed-bottom.mjs
  var SquareDashedBottom = [
    ["path", { d: "M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2" }],
    ["path", { d: "M9 21h1" }],
    ["path", { d: "M14 21h1" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dashed-kanban.mjs
  var SquareDashedKanban = [
    ["path", { d: "M8 7v7" }],
    ["path", { d: "M12 7v4" }],
    ["path", { d: "M16 7v9" }],
    ["path", { d: "M5 3a2 2 0 0 0-2 2" }],
    ["path", { d: "M9 3h1" }],
    ["path", { d: "M14 3h1" }],
    ["path", { d: "M19 3a2 2 0 0 1 2 2" }],
    ["path", { d: "M21 9v1" }],
    ["path", { d: "M21 14v1" }],
    ["path", { d: "M21 19a2 2 0 0 1-2 2" }],
    ["path", { d: "M14 21h1" }],
    ["path", { d: "M9 21h1" }],
    ["path", { d: "M5 21a2 2 0 0 1-2-2" }],
    ["path", { d: "M3 14v1" }],
    ["path", { d: "M3 9v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dashed-mouse-pointer.mjs
  var SquareDashedMousePointer = [
    [
      "path",
      {
        d: "M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"
      }
    ],
    ["path", { d: "M5 3a2 2 0 0 0-2 2" }],
    ["path", { d: "M19 3a2 2 0 0 1 2 2" }],
    ["path", { d: "M5 21a2 2 0 0 1-2-2" }],
    ["path", { d: "M9 3h1" }],
    ["path", { d: "M9 21h2" }],
    ["path", { d: "M14 3h1" }],
    ["path", { d: "M3 9v1" }],
    ["path", { d: "M21 9v2" }],
    ["path", { d: "M3 14v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dashed-plus.mjs
  var SquareDashedPlus = [
    ["path", { d: "M5 3a2 2 0 0 0-2 2" }],
    ["path", { d: "M19 3a2 2 0 0 1 2 2" }],
    ["path", { d: "M21 19a2 2 0 0 1-2 2" }],
    ["path", { d: "M5 21a2 2 0 0 1-2-2" }],
    ["path", { d: "M9 3h1" }],
    ["path", { d: "M9 21h1" }],
    ["path", { d: "M14 3h1" }],
    ["path", { d: "M14 21h1" }],
    ["path", { d: "M3 9v1" }],
    ["path", { d: "M21 9v1" }],
    ["path", { d: "M3 14v1" }],
    ["path", { d: "M21 14v1" }],
    ["path", { d: "M8 12h8" }],
    ["path", { d: "M12 8v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dashed-text.mjs
  var SquareDashedText = [
    ["path", { d: "M14 21h1" }],
    ["path", { d: "M14 3h1" }],
    ["path", { d: "M19 3a2 2 0 0 1 2 2" }],
    ["path", { d: "M21 14v1" }],
    ["path", { d: "M21 19a2 2 0 0 1-2 2" }],
    ["path", { d: "M21 9v1" }],
    ["path", { d: "M3 14v1" }],
    ["path", { d: "M3 9v1" }],
    ["path", { d: "M5 21a2 2 0 0 1-2-2" }],
    ["path", { d: "M5 3a2 2 0 0 0-2 2" }],
    ["path", { d: "M7 12h10" }],
    ["path", { d: "M7 16h6" }],
    ["path", { d: "M7 8h8" }],
    ["path", { d: "M9 21h1" }],
    ["path", { d: "M9 3h1" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dashed-top-solid.mjs
  var SquareDashedTopSolid = [
    ["path", { d: "M14 21h1" }],
    ["path", { d: "M21 14v1" }],
    ["path", { d: "M21 19a2 2 0 0 1-2 2" }],
    ["path", { d: "M21 9v1" }],
    ["path", { d: "M3 14v1" }],
    ["path", { d: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" }],
    ["path", { d: "M3 9v1" }],
    ["path", { d: "M5 21a2 2 0 0 1-2-2" }],
    ["path", { d: "M9 21h1" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dashed-x-corner.mjs
  var SquareDashedXCorner = [
    ["path", { d: "M14 3h1" }],
    ["path", { d: "m16 16 5 5" }],
    ["path", { d: "M19 3a2 2 0 012 2" }],
    ["path", { d: "m21 16-5 5" }],
    ["path", { d: "M21 9v1" }],
    ["path", { d: "M3 14v1" }],
    ["path", { d: "M3 9v1" }],
    ["path", { d: "M5 21a2 2 0 01-2-2" }],
    ["path", { d: "M5 3a2 2 0 00-2 2" }],
    ["path", { d: "M9 21h1" }],
    ["path", { d: "M9 3h1" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dashed-x.mjs
  var SquareDashedX = [
    ["path", { d: "M14 21h1" }],
    ["path", { d: "M14 3h1" }],
    ["path", { d: "M19 3a2 2 0 012 2" }],
    ["path", { d: "M21 14v1" }],
    ["path", { d: "M21 19a2 2 0 01-2 2" }],
    ["path", { d: "M21 9v1" }],
    ["path", { d: "M3 14v1" }],
    ["path", { d: "M3 9v1" }],
    ["path", { d: "M5 21a2 2 0 01-2-2" }],
    ["path", { d: "M5 3a2 2 0 00-2 2" }],
    ["path", { d: "m9 15 6-6" }],
    ["path", { d: "M9 21h1" }],
    ["path", { d: "M9 3h1" }],
    ["path", { d: "m9 9 6 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dashed.mjs
  var SquareDashed = [
    ["path", { d: "M5 3a2 2 0 0 0-2 2" }],
    ["path", { d: "M19 3a2 2 0 0 1 2 2" }],
    ["path", { d: "M21 19a2 2 0 0 1-2 2" }],
    ["path", { d: "M5 21a2 2 0 0 1-2-2" }],
    ["path", { d: "M9 3h1" }],
    ["path", { d: "M9 21h1" }],
    ["path", { d: "M14 3h1" }],
    ["path", { d: "M14 21h1" }],
    ["path", { d: "M3 9v1" }],
    ["path", { d: "M21 9v1" }],
    ["path", { d: "M3 14v1" }],
    ["path", { d: "M21 14v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dimensions.mjs
  var SquareDimensions = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M12 7H7v5" }],
    ["path", { d: "M12 17h5v-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-divide.mjs
  var SquareDivide = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ["line", { x1: "8", x2: "16", y1: "12", y2: "12" }],
    ["line", { x1: "12", x2: "12", y1: "16", y2: "16" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-dot.mjs
  var SquareDot = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["circle", { cx: "12", cy: "12", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-equal.mjs
  var SquareEqual = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M7 10h10" }],
    ["path", { d: "M7 14h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-exclamation-point.mjs
  var SquareExclamationPoint = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-function.mjs
  var SquareFunction = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ["path", { d: "M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3" }],
    ["path", { d: "M9 11.2h5.7" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-kanban-plus.mjs
  var SquareKanbanPlus = [
    ["path", { d: "M12 7v4" }],
    ["path", { d: "M12.354 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v7.354" }],
    ["path", { d: "M15 18h6" }],
    ["path", { d: "M16 7v4.536" }],
    ["path", { d: "M18 21v-6" }],
    ["path", { d: "M8 7v7" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-kanban.mjs
  var SquareKanban = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M8 7v7" }],
    ["path", { d: "M12 7v4" }],
    ["path", { d: "M16 7v9" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-a.mjs
  var SquareLetterA = [
    ["path", { d: "m8 16 3.453-7.648a.6.6 0 0 1 1.094 0L16 16" }],
    ["path", { d: "M15 14H9" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-b.mjs
  var SquareLetterB = [
    [
      "path",
      {
        d: "M9 12h4.846a2.24 2.24 0 011.523.586 2 2 0 01.001 2.828 2.24 2.24 0 01-1.524.586H9.5a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5H13a2 2 0 010 4"
      }
    ],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-c.mjs
  var SquareLetterC = [
    ["path", { d: "M15 9.354a4 4 0 1 0 0 5.292" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-d.mjs
  var SquareLetterD = [
    ["path", { d: "M12 8a4 4 0 010 8H9.412A.41.41 0 019 15.588V8.412A.41.41 0 019.412 8z" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-e.mjs
  var SquareLetterE = [
    ["path", { d: "M15 8H9.5a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5H15" }],
    ["path", { d: "M9 12h4" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-f.mjs
  var SquareLetterF = [
    ["path", { d: "M9 16V8.5a.5.5 0 0 1 .5-.5H15" }],
    ["path", { d: "M9 12h4" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-g.mjs
  var SquareLetterG = [
    ["path", { d: "M12.5 12H15v2.268a.88.88 0 01-.263.65A4 4 0 1112 8h2.5" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-h.mjs
  var SquareLetterH = [
    ["path", { d: "M9 16V8" }],
    ["path", { d: "M15 16V8" }],
    ["path", { d: "M9 12h6" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-j.mjs
  var SquareLetterJ = [
    ["path", { d: "M14 8v5.5a1 1 0 01-5 0V13" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-i.mjs
  var SquareLetterI = [
    ["path", { d: "M12 16V8" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-k.mjs
  var SquareLetterK = [
    ["path", { d: "M9 16V8" }],
    ["path", { d: "m11 12 4 4" }],
    ["path", { d: "m15 8-6 6" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-l.mjs
  var SquareLetterL = [
    ["path", { d: "M9 8v7.5a.5.5 0 0 0 .5.5H15" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-m.mjs
  var SquareLetterM = [
    [
      "path",
      {
        d: "M8 16.001v-7.5a.5.5 0 0 1 .9-.3l2.7 3.599a.5.5 0 0 0 .8 0l2.7-3.6a.5.5 0 0 1 .9.3v7.501"
      }
    ],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-n.mjs
  var SquareLetterN = [
    ["path", { d: "M9 16V8.576a.496.496 0 01.937-.243l4.126 7.43A.496.496 0 0015 15.52V8" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-o.mjs
  var SquareLetterO = [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-p-off.mjs
  var SquareLetterPOff = [
    ["path", { d: "M12 12h1a2 2 0 000-4H9.5a.5.5 0 00-.5.5V9" }],
    ["path", { d: "M15.343 21H5a2 2 0 01-2-2V8.657" }],
    ["path", { d: "M22 22 2 2" }],
    ["path", { d: "M3.586 3.586A2 2 0 015 3h14a2 2 0 012 2v14a2 2 0 01-.586 1.414" }],
    ["path", { d: "M9 14.657V16" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-p.mjs
  var SquareLetterP = [
    ["path", { d: "M9 12h4a2 2 0 0 0 0-4H9.5a.5.5 0 0 0-.5.5V16" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-q.mjs
  var SquareLetterQ = [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["path", { d: "m16 16-2.5-2.5" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-s.mjs
  var SquareLetterS = [
    ["path", { d: "M14.5 8H11a2 2 0 100 4h2a2 2 0 110 4H9" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-r.mjs
  var SquareLetterR = [
    ["path", { d: "m11 12 4 4" }],
    ["path", { d: "M9 12h4a2 2 0 0 0 0-4H9.5a.5.5 0 0 0-.5.5V16" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-t.mjs
  var SquareLetterT = [
    ["path", { d: "M12 16V8" }],
    ["path", { d: "M9 8h6" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-u.mjs
  var SquareLetterU = [
    ["path", { d: "M15 8v5a3 3 0 1 1-6 0V8" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-v.mjs
  var SquareLetterV = [
    ["path", { d: "m9 8 2.525 7.66a.5.5 0 0 0 .95 0L15 8" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-w.mjs
  var SquareLetterW = [
    [
      "path",
      {
        d: "m16 8-1.591 7.598a.497.497 0 01-.97.038l-.96-3.276a.5.5 0 00-.959 0l-.96 3.276a.496.496 0 01-.969-.038L8 8"
      }
    ],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-x.mjs
  var SquareLetterX = [
    ["path", { d: "m9 16 6-8" }],
    ["path", { d: "m9 8 6 8" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-y.mjs
  var SquareLetterY = [
    ["path", { d: "m9 8 3 4 3-4" }],
    ["path", { d: "M12 12v4" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-letter-z.mjs
  var SquareLetterZ = [
    ["path", { d: "M9 8h5.501a.5.5 0 0 1 .37.836L9.13 15.164A.5.5 0 0 0 9.5 16H15" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-library.mjs
  var SquareLibrary = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M7 7v10" }],
    ["path", { d: "M11 7v10" }],
    ["path", { d: "m15 7 2 10" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-menu.mjs
  var SquareMenu = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M7 8h10" }],
    ["path", { d: "M7 12h10" }],
    ["path", { d: "M7 16h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-minus.mjs
  var SquareMinus = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M8 12h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-mouse-pointer.mjs
  var SquareMousePointer = [
    [
      "path",
      {
        d: "M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"
      }
    ],
    ["path", { d: "M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-off.mjs
  var SquareOff = [
    ["path", { d: "M20.4 20.4a2 2 0 01-1.4.6H5a2 2 0 01-2-2V5a2 2 0 01.59-1.41" }],
    ["path", { d: "M21 15.3V5a2 2 0 00-2-2H8.7" }],
    ["path", { d: "M22 22 2 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-padding-horizontal.mjs
  var SquarePaddingHorizontal = [
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M17 16V8" }],
    ["path", { d: "M7 16V8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-padding-left.mjs
  var SquarePaddingLeft = [
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M7 16V8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-padding-bottom.mjs
  var SquarePaddingBottom = [
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M8 17h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-padding-right.mjs
  var SquarePaddingRight = [
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M17 16V8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-padding-top.mjs
  var SquarePaddingTop = [
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M8 7h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-padding-vertical.mjs
  var SquarePaddingVertical = [
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M8 17h8" }],
    ["path", { d: "M8 7h8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-padding.mjs
  var SquarePadding = [
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["path", { d: "M14 17h-4" }],
    ["path", { d: "M14 7h-4" }],
    ["path", { d: "M17 14v-4" }],
    ["path", { d: "M7 14v-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-pause.mjs
  var SquarePause = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["line", { x1: "10", x2: "10", y1: "15", y2: "9" }],
    ["line", { x1: "14", x2: "14", y1: "15", y2: "9" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-pen.mjs
  var SquarePen = [
    ["path", { d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }],
    [
      "path",
      {
        d: "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/square-percent.mjs
  var SquarePercent = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "m15 9-6 6" }],
    ["path", { d: "M9 9h.01" }],
    ["path", { d: "M15 15h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-pi.mjs
  var SquarePi = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M7 7h10" }],
    ["path", { d: "M10 7v10" }],
    ["path", { d: "M16 17a2 2 0 0 1-2-2V7" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-pilcrow.mjs
  var SquarePilcrow = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M12 12H9.5a2.5 2.5 0 0 1 0-5H17" }],
    ["path", { d: "M12 7v10" }],
    ["path", { d: "M16 7v10" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-play.mjs
  var SquarePlay = [
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    [
      "path",
      {
        d: "M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/square-plus.mjs
  var SquarePlus = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M8 12h8" }],
    ["path", { d: "M12 8v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-power.mjs
  var SquarePower = [
    ["path", { d: "M12 7v4" }],
    ["path", { d: "M7.998 9.003a5 5 0 1 0 8-.005" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-radical.mjs
  var SquareRadical = [
    ["path", { d: "M7 12h2l2 5 2-10h4" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-round-corner.mjs
  var SquareRoundCorner = [
    ["path", { d: "M21 11a8 8 0 0 0-8-8" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-scissors.mjs
  var SquareScissors = [
    ["path", { d: "m17 17-2.18-2.18" }],
    ["path", { d: "M9.56 14.44 17 7" }],
    ["path", { d: "M9.56 9.56 12 12" }],
    ["circle", { cx: "8.5", cy: "15.5", r: "1.5" }],
    ["circle", { cx: "8.5", cy: "8.5", r: "1.5" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-sigma.mjs
  var SquareSigma = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M16 8.9V7H8l4 5-4 5h8v-1.9" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-slash.mjs
  var SquareSlash = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["line", { x1: "9", x2: "15", y1: "15", y2: "9" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-sparkles.mjs
  var SquareSparkles = [
    ["path", { d: "M11 15H7" }],
    [
      "path",
      {
        d: "M15.41 2.49a.6.6 0 011.18 0l.63 3.334a1.2 1.2 0 00.956.955l3.334.631a.6.6 0 010 1.18l-3.334.63a1.2 1.2 0 00-.955.956l-.631 3.334a.6.6 0 01-1.18 0l-.63-3.334a1.2 1.2 0 00-.956-.955L10.49 8.59a.6.6 0 010-1.18l3.334-.63a1.2 1.2 0 00.955-.956z"
      }
    ],
    ["path", { d: "M21 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6" }],
    ["path", { d: "M9 13v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-split-horizontal.mjs
  var SquareSplitHorizontal = [
    ["path", { d: "M12 2v20" }],
    ["path", { d: "M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" }],
    ["path", { d: "M8 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-split-vertical.mjs
  var SquareSplitVertical = [
    ["path", { d: "M2 12h20" }],
    ["path", { d: "M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" }],
    ["path", { d: "M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-square.mjs
  var SquareSquare = [
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
    ["rect", { x: "8", y: "8", width: "8", height: "8", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-stack.mjs
  var SquareStack = [
    ["path", { d: "M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2" }],
    ["path", { d: "M10 16c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2" }],
    ["rect", { width: "8", height: "8", x: "14", y: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-stop.mjs
  var SquareStop = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["rect", { x: "9", y: "9", width: "6", height: "6", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-star.mjs
  var SquareStar = [
    [
      "path",
      {
        d: "M11.035 7.69a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"
      }
    ],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-terminal.mjs
  var SquareTerminal = [
    ["path", { d: "m7 11 2-2-2-2" }],
    ["path", { d: "M11 13h4" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-text.mjs
  var SquareText = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M7 8h8" }],
    ["path", { d: "M7 12h10" }],
    ["path", { d: "M7 16h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-user-round.mjs
  var SquareUserRound = [
    ["path", { d: "M18 21a6 6 0 0 0-12 0" }],
    ["circle", { cx: "12", cy: "11", r: "4" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-user.mjs
  var SquareUser = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["circle", { cx: "12", cy: "10", r: "3" }],
    ["path", { d: "M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/square-x.mjs
  var SquareX = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ["path", { d: "m15 9-6 6" }],
    ["path", { d: "m9 9 6 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/squares-exclude.mjs
  var SquaresExclude = [
    [
      "path",
      {
        d: "M16 12v2a2 2 0 0 1-2 2H9a1 1 0 0 0-1 1v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h0"
      }
    ],
    [
      "path",
      {
        d: "M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3a1 1 0 0 1-1 1h-5a2 2 0 0 0-2 2v2"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/square.mjs
  var Square = [["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]];

  // node_modules/lucide/dist/esm/icons/squares-intersect.mjs
  var SquaresIntersect = [
    ["path", { d: "M10 22a2 2 0 0 1-2-2" }],
    ["path", { d: "M14 2a2 2 0 0 1 2 2" }],
    ["path", { d: "M16 22h-2" }],
    ["path", { d: "M2 10V8" }],
    ["path", { d: "M2 4a2 2 0 0 1 2-2" }],
    ["path", { d: "M20 8a2 2 0 0 1 2 2" }],
    ["path", { d: "M22 14v2" }],
    ["path", { d: "M22 20a2 2 0 0 1-2 2" }],
    ["path", { d: "M4 16a2 2 0 0 1-2-2" }],
    ["path", { d: "M8 10a2 2 0 0 1 2-2h5a1 1 0 0 1 1 1v5a2 2 0 0 1-2 2H9a1 1 0 0 1-1-1z" }],
    ["path", { d: "M8 2h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/squares-unite.mjs
  var SquaresUnite = [
    [
      "path",
      {
        d: "M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3a1 1 0 0 0 1 1h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-3a1 1 0 0 0-1-1z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/squares-subtract.mjs
  var SquaresSubtract = [
    ["path", { d: "M10 22a2 2 0 0 1-2-2" }],
    ["path", { d: "M16 22h-2" }],
    [
      "path",
      {
        d: "M16 4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-5a2 2 0 0 1 2-2h5a1 1 0 0 0 1-1z"
      }
    ],
    ["path", { d: "M20 8a2 2 0 0 1 2 2" }],
    ["path", { d: "M22 14v2" }],
    ["path", { d: "M22 20a2 2 0 0 1-2 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/squircle-dashed.mjs
  var SquircleDashed = [
    ["path", { d: "M13.77 3.043a34 34 0 0 0-3.54 0" }],
    ["path", { d: "M13.771 20.956a33 33 0 0 1-3.541.001" }],
    ["path", { d: "M20.18 17.74c-.51 1.15-1.29 1.93-2.439 2.44" }],
    ["path", { d: "M20.18 6.259c-.51-1.148-1.291-1.929-2.44-2.438" }],
    ["path", { d: "M20.957 10.23a33 33 0 0 1 0 3.54" }],
    ["path", { d: "M3.043 10.23a34 34 0 0 0 .001 3.541" }],
    ["path", { d: "M6.26 20.179c-1.15-.508-1.93-1.29-2.44-2.438" }],
    ["path", { d: "M6.26 3.82c-1.149.51-1.93 1.291-2.44 2.44" }]
  ];

  // node_modules/lucide/dist/esm/icons/squircle.mjs
  var Squircle = [
    ["path", { d: "M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" }]
  ];

  // node_modules/lucide/dist/esm/icons/squirrel.mjs
  var Squirrel = [
    ["path", { d: "M15.236 22a3 3 0 0 0-2.2-5" }],
    ["path", { d: "M16 20a3 3 0 0 1 3-3h1a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4V4" }],
    ["path", { d: "M18 13h.01" }],
    [
      "path",
      {
        d: "M18 6a4 4 0 0 0-4 4 7 7 0 0 0-7 7c0-5 4-5 4-10.5a4.5 4.5 0 1 0-9 0 2.5 2.5 0 0 0 5 0C7 10 3 11 3 17c0 2.8 2.2 5 5 5h10"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/star-check.mjs
  var StarCheck = [
    [
      "path",
      {
        d: "m19.06 12.501 2.78-2.707a.53.53 0 0 0-.294-.905l-5.166-.755a2.1 2.1 0 0 1-1.595-1.16l-2.31-4.68a.53.53 0 0 0-.95.001L9.216 6.974a2.1 2.1 0 0 1-1.597 1.16l-5.165.755a.53.53 0 0 0-.294.906l3.736 3.637a2.1 2.1 0 0 1 .611 1.879l-.88 5.139a.53.53 0 0 0 .769.56l4.617-2.428.027-.014"
      }
    ],
    ["path", { d: "m15 18 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/stamp.mjs
  var Stamp = [
    ["path", { d: "M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13" }],
    [
      "path",
      {
        d: "M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z"
      }
    ],
    ["path", { d: "M5 22h14" }]
  ];

  // node_modules/lucide/dist/esm/icons/star-half.mjs
  var StarHalf = [
    [
      "path",
      {
        d: "M12 18.338a2.1 2.1 0 0 0-.987.244L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16l2.309-4.679A.53.53 0 0 1 12 2"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/star-minus.mjs
  var StarMinus = [
    ["path", { d: "M15 18h6" }],
    [
      "path",
      {
        d: "M17.688 14a2.1 2.1 0 0 1 .416-.568l3.736-3.638a.53.53 0 0 0-.294-.905l-5.166-.755a2.1 2.1 0 0 1-1.595-1.16l-2.31-4.68a.53.53 0 0 0-.95.001L9.216 6.974a2.1 2.1 0 0 1-1.597 1.16l-5.165.755a.53.53 0 0 0-.294.906l3.736 3.637a2.1 2.1 0 0 1 .611 1.879l-.88 5.139a.53.53 0 0 0 .769.56l4.617-2.428.027-.014"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/star-off.mjs
  var StarOff = [
    [
      "path",
      {
        d: "m10.344 4.688 1.181-2.393a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.237 3.152"
      }
    ],
    [
      "path",
      {
        d: "m17.945 17.945.43 2.505a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a8 8 0 0 0 .4-.099"
      }
    ],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/star-plus.mjs
  var StarPlus = [
    [
      "path",
      {
        d: "M11.013 18.582 6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16l2.309-4.679a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904L20 11.5"
      }
    ],
    ["path", { d: "M15 18h6" }],
    ["path", { d: "M18 15v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/star-x.mjs
  var StarX = [
    ["path", { d: "m15.5 15.5 5 5" }],
    [
      "path",
      {
        d: "m20.063 11.525 1.777-1.731a.53.53 0 0 0-.294-.905l-5.166-.755a2.1 2.1 0 0 1-1.595-1.16l-2.31-4.68a.53.53 0 0 0-.95.001L9.216 6.974a2.1 2.1 0 0 1-1.597 1.16l-5.165.755a.53.53 0 0 0-.294.906l3.736 3.637a2.1 2.1 0 0 1 .611 1.879l-.88 5.139a.53.53 0 0 0 .769.56l4.617-2.428a2.1 2.1 0 0 1 .987-.243 2 2 0 0 1 .132.004"
      }
    ],
    ["path", { d: "m20.5 15.5-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/star.mjs
  var Star = [
    [
      "path",
      {
        d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/step-back.mjs
  var StepBack = [
    [
      "path",
      {
        d: "M13.971 4.285A2 2 0 0 1 17 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z"
      }
    ],
    ["path", { d: "M21 20V4" }]
  ];

  // node_modules/lucide/dist/esm/icons/step-forward.mjs
  var StepForward = [
    [
      "path",
      { d: "M10.029 4.285A2 2 0 0 0 7 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" }
    ],
    ["path", { d: "M3 4v16" }]
  ];

  // node_modules/lucide/dist/esm/icons/stethoscope.mjs
  var Stethoscope = [
    ["path", { d: "M11 2v2" }],
    ["path", { d: "M5 2v2" }],
    ["path", { d: "M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" }],
    ["path", { d: "M8 15a6 6 0 0 0 12 0v-3" }],
    ["circle", { cx: "20", cy: "10", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/sticker.mjs
  var Sticker = [
    [
      "path",
      {
        d: "M21 9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"
      }
    ],
    ["path", { d: "M15 3v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M8 13h.01" }],
    ["path", { d: "M16 13h.01" }],
    ["path", { d: "M10 16s.8 1 2 1c1.3 0 2-1 2-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/sticky-note-check.mjs
  var StickyNoteCheck = [
    ["path", { d: "m15 19 2 2 4-4" }],
    ["path", { d: "M15 3v5a1 1 0 0 0 1 1h5" }],
    [
      "path",
      {
        d: "M21 13V9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6.5"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/sticky-note-minus.mjs
  var StickyNoteMinus = [
    ["path", { d: "M15 3v5a1 1 0 0 0 1 1h5" }],
    [
      "path",
      {
        d: "M21 14V9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.35"
      }
    ],
    ["path", { d: "M21 18h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/sticky-note-off.mjs
  var StickyNoteOff = [
    ["path", { d: "M15 3v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M3.586 3.586A2 2 0 0 0 3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.414-.586" }],
    ["path", { d: "M8.656 3H15a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 21 9v6.344" }]
  ];

  // node_modules/lucide/dist/esm/icons/sticky-note-plus.mjs
  var StickyNotePlus = [
    ["path", { d: "M15 3v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M18 15v6" }],
    [
      "path",
      {
        d: "M21 12.356V9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.355"
      }
    ],
    ["path", { d: "M21 18h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/sticky-note-x.mjs
  var StickyNoteX = [
    ["path", { d: "M15 3v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "m16 16 5 5" }],
    [
      "path",
      {
        d: "M21 12V9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7"
      }
    ],
    ["path", { d: "m21 16-5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/sticky-note.mjs
  var StickyNote = [
    [
      "path",
      {
        d: "M21 9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"
      }
    ],
    ["path", { d: "M15 3v5a1 1 0 0 0 1 1h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/sticky-notes.mjs
  var StickyNotes = [
    [
      "path",
      {
        d: "M10 8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 16 14v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "M10 8v5a1 1 0 0 0 1 1h5" }],
    [
      "path",
      {
        d: "M8 4a2 2 0 0 1 2-2h6a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 22 8v6a2 2 0 0 1-2 2"
      }
    ],
    ["path", { d: "M16 2v5a1 1 0 0 0 1 1h5" }]
  ];

  // node_modules/lucide/dist/esm/icons/stone.mjs
  var Stone = [
    [
      "path",
      {
        d: "M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z"
      }
    ],
    ["path", { d: "M11.99 22 14 12l7.822 3.184" }],
    ["path", { d: "M14 12 8.47 2.302" }]
  ];

  // node_modules/lucide/dist/esm/icons/store.mjs
  var Store = [
    ["path", { d: "M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5" }],
    [
      "path",
      {
        d: "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"
      }
    ],
    ["path", { d: "M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05" }]
  ];

  // node_modules/lucide/dist/esm/icons/stretch-horizontal.mjs
  var StretchHorizontal = [
    ["rect", { width: "20", height: "6", x: "2", y: "4", rx: "2" }],
    ["rect", { width: "20", height: "6", x: "2", y: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/stretch-vertical.mjs
  var StretchVertical = [
    ["rect", { width: "6", height: "20", x: "4", y: "2", rx: "2" }],
    ["rect", { width: "6", height: "20", x: "14", y: "2", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/strikethrough.mjs
  var Strikethrough = [
    ["path", { d: "M16 4H9a3 3 0 0 0-2.83 4" }],
    ["path", { d: "M14 12a4 4 0 0 1 0 8H6" }],
    ["line", { x1: "4", x2: "20", y1: "12", y2: "12" }]
  ];

  // node_modules/lucide/dist/esm/icons/subscript.mjs
  var Subscript = [
    ["path", { d: "m4 5 8 8" }],
    ["path", { d: "m12 5-8 8" }],
    [
      "path",
      {
        d: "M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/summary.mjs
  var Summary = [
    ["path", { d: "M15 4H7" }],
    ["path", { d: "m18 16 3 3-3 3" }],
    ["path", { d: "M3 4v13a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M7 14h7" }],
    ["path", { d: "M7 9h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/sun-dim.mjs
  var SunDim = [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["path", { d: "M12 4h.01" }],
    ["path", { d: "M20 12h.01" }],
    ["path", { d: "M12 20h.01" }],
    ["path", { d: "M4 12h.01" }],
    ["path", { d: "M17.657 6.343h.01" }],
    ["path", { d: "M17.657 17.657h.01" }],
    ["path", { d: "M6.343 17.657h.01" }],
    ["path", { d: "M6.343 6.343h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/sun-medium.mjs
  var SunMedium = [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["path", { d: "M12 3v1" }],
    ["path", { d: "M12 20v1" }],
    ["path", { d: "M3 12h1" }],
    ["path", { d: "M20 12h1" }],
    ["path", { d: "m18.364 5.636-.707.707" }],
    ["path", { d: "m6.343 17.657-.707.707" }],
    ["path", { d: "m5.636 5.636.707.707" }],
    ["path", { d: "m17.657 17.657.707.707" }]
  ];

  // node_modules/lucide/dist/esm/icons/sun-moon.mjs
  var SunMoon = [
    ["path", { d: "M12 2v2" }],
    [
      "path",
      {
        d: "M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715"
      }
    ],
    ["path", { d: "M16 12a4 4 0 0 0-4-4" }],
    ["path", { d: "m19 5-1.256 1.256" }],
    ["path", { d: "M20 12h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/sun-snow.mjs
  var SunSnow = [
    ["path", { d: "M10 21v-1" }],
    ["path", { d: "M10 4V3" }],
    ["path", { d: "M10 9a3 3 0 0 0 0 6" }],
    ["path", { d: "m14 20 1.25-2.5L18 18" }],
    ["path", { d: "m14 4 1.25 2.5L18 6" }],
    ["path", { d: "m17 21-3-6 1.5-3H22" }],
    ["path", { d: "m17 3-3 6 1.5 3" }],
    ["path", { d: "M2 12h1" }],
    ["path", { d: "m20 10-1.5 2 1.5 2" }],
    ["path", { d: "m3.64 18.36.7-.7" }],
    ["path", { d: "m4.34 6.34-.7-.7" }]
  ];

  // node_modules/lucide/dist/esm/icons/sun.mjs
  var Sun = [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M12 20v2" }],
    ["path", { d: "m4.93 4.93 1.41 1.41" }],
    ["path", { d: "m17.66 17.66 1.41 1.41" }],
    ["path", { d: "M2 12h2" }],
    ["path", { d: "M20 12h2" }],
    ["path", { d: "m6.34 17.66-1.41 1.41" }],
    ["path", { d: "m19.07 4.93-1.41 1.41" }]
  ];

  // node_modules/lucide/dist/esm/icons/sunrise.mjs
  var Sunrise = [
    ["path", { d: "M12 2v8" }],
    ["path", { d: "m4.93 10.93 1.41 1.41" }],
    ["path", { d: "M2 18h2" }],
    ["path", { d: "M20 18h2" }],
    ["path", { d: "m19.07 10.93-1.41 1.41" }],
    ["path", { d: "M22 22H2" }],
    ["path", { d: "m8 6 4-4 4 4" }],
    ["path", { d: "M16 18a4 4 0 0 0-8 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/sunset.mjs
  var Sunset = [
    ["path", { d: "M12 10V2" }],
    ["path", { d: "m4.93 10.93 1.41 1.41" }],
    ["path", { d: "M2 18h2" }],
    ["path", { d: "M20 18h2" }],
    ["path", { d: "m19.07 10.93-1.41 1.41" }],
    ["path", { d: "M22 22H2" }],
    ["path", { d: "m16 6-4 4-4-4" }],
    ["path", { d: "M16 18a4 4 0 0 0-8 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/superscript.mjs
  var Superscript = [
    ["path", { d: "m4 19 8-8" }],
    ["path", { d: "m12 19-8-8" }],
    [
      "path",
      {
        d: "M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/swatch-book.mjs
  var SwatchBook = [
    ["path", { d: "M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z" }],
    ["path", { d: "M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7" }],
    ["path", { d: "M 7 17h.01" }],
    [
      "path",
      { d: "m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8" }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/swiss-franc.mjs
  var SwissFranc = [
    ["path", { d: "M10 10h7" }],
    ["path", { d: "M10 20V5a1 1 0 011-1h7" }],
    ["path", { d: "M6 16h9" }]
  ];

  // node_modules/lucide/dist/esm/icons/switch-camera.mjs
  var SwitchCamera = [
    ["path", { d: "M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" }],
    ["path", { d: "M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" }],
    ["circle", { cx: "12", cy: "12", r: "3" }],
    ["path", { d: "m18 22-3-3 3-3" }],
    ["path", { d: "m6 2 3 3-3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/sword.mjs
  var Sword = [
    ["path", { d: "m11 19-6-6" }],
    ["path", { d: "m5 21-2-2" }],
    ["path", { d: "m8 16-4 4" }],
    ["path", { d: "M9.5 17.5 20.414 6.586A2 2 0 0021 5.172V3h-2.172a2 2 0 00-1.414.586L6.5 14.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/swords.mjs
  var Swords = [
    ["path", { d: "m13 19 6-6" }],
    ["path", { d: "M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5" }],
    [
      "path",
      { d: "m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586" }
    ],
    ["path", { d: "m16 16 4 4" }],
    ["path", { d: "m19 21 2-2" }],
    ["path", { d: "m5 14 4 4" }],
    ["path", { d: "m5 21-2-2" }],
    ["path", { d: "M7.5 16.5 4 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/table-2.mjs
  var Table2 = [
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M9 3v18" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/table-cells-merge.mjs
  var TableCellsMerge = [
    ["path", { d: "M12 21v-6" }],
    ["path", { d: "M12 9V3" }],
    ["path", { d: "M3 15h18" }],
    ["path", { d: "M3 9h18" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/syringe.mjs
  var Syringe = [
    ["path", { d: "m18 2 4 4" }],
    ["path", { d: "m17 7 3-3" }],
    ["path", { d: "M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" }],
    ["path", { d: "m9 11 4 4" }],
    ["path", { d: "m5 19-3 3" }],
    ["path", { d: "m14 4 6 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/table-cells-split.mjs
  var TableCellsSplit = [
    ["path", { d: "M12 15V9" }],
    ["path", { d: "M3 15h18" }],
    ["path", { d: "M3 9h18" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/table-columns-split.mjs
  var TableColumnsSplit = [
    ["path", { d: "M14 14v2" }],
    ["path", { d: "M14 20v2" }],
    ["path", { d: "M14 2v2" }],
    ["path", { d: "M14 8v2" }],
    ["path", { d: "M2 15h8" }],
    ["path", { d: "M2 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H2" }],
    ["path", { d: "M2 9h8" }],
    ["path", { d: "M22 15h-4" }],
    ["path", { d: "M22 3h-2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" }],
    ["path", { d: "M22 9h-4" }],
    ["path", { d: "M5 3v18" }]
  ];

  // node_modules/lucide/dist/esm/icons/table-of-contents.mjs
  var TableOfContents = [
    ["path", { d: "M16 5H3" }],
    ["path", { d: "M16 12H3" }],
    ["path", { d: "M16 19H3" }],
    ["path", { d: "M21 5h.01" }],
    ["path", { d: "M21 12h.01" }],
    ["path", { d: "M21 19h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/table-properties.mjs
  var TableProperties = [
    ["path", { d: "M15 3v18" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M21 9H3" }],
    ["path", { d: "M21 15H3" }]
  ];

  // node_modules/lucide/dist/esm/icons/table-rows-split.mjs
  var TableRowsSplit = [
    ["path", { d: "M14 10h2" }],
    ["path", { d: "M15 22v-8" }],
    ["path", { d: "M15 2v4" }],
    ["path", { d: "M2 10h2" }],
    ["path", { d: "M20 10h2" }],
    ["path", { d: "M3 19h18" }],
    ["path", { d: "M3 22v-6a2 2 135 0 1 2-2h14a2 2 45 0 1 2 2v6" }],
    ["path", { d: "M3 2v2a2 2 45 0 0 2 2h14a2 2 135 0 0 2-2V2" }],
    ["path", { d: "M8 10h2" }],
    ["path", { d: "M9 22v-8" }],
    ["path", { d: "M9 2v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/table.mjs
  var Table = [
    ["path", { d: "M12 3v18" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 9h18" }],
    ["path", { d: "M3 15h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/tablet-smartphone.mjs
  var TabletSmartphone = [
    ["rect", { width: "10", height: "14", x: "3", y: "8", rx: "2" }],
    ["path", { d: "M5 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2.4" }],
    ["path", { d: "M8 18h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/tablet.mjs
  var Tablet = [
    ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2", ry: "2" }],
    ["line", { x1: "12", x2: "12.01", y1: "18", y2: "18" }]
  ];

  // node_modules/lucide/dist/esm/icons/tablets.mjs
  var Tablets = [
    ["circle", { cx: "7", cy: "7", r: "5" }],
    ["circle", { cx: "17", cy: "17", r: "5" }],
    ["path", { d: "M12 17h10" }],
    ["path", { d: "m3.46 10.54 7.08-7.08" }]
  ];

  // node_modules/lucide/dist/esm/icons/tag-plus.mjs
  var TagPlus = [
    ["path", { d: "M16 13h6" }],
    [
      "path",
      {
        d: "m16.5 6.5-3.914-3.914A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l1.79-1.79"
      }
    ],
    ["path", { d: "M19 10v6" }],
    ["circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor" }]
  ];

  // node_modules/lucide/dist/esm/icons/tag-x.mjs
  var TagX = [
    [
      "path",
      {
        d: "m16.5 6.5-3.914-3.914A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.43 2.43 0 0 0 3.42 0l1.79-1.79"
      }
    ],
    ["path", { d: "m16.5 10.5 5 5" }],
    ["path", { d: "m21.5 10.5-5 5" }],
    ["circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor" }]
  ];

  // node_modules/lucide/dist/esm/icons/tag.mjs
  var Tag = [
    [
      "path",
      {
        d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"
      }
    ],
    ["circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor" }]
  ];

  // node_modules/lucide/dist/esm/icons/tags.mjs
  var Tags = [
    [
      "path",
      {
        d: "M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z"
      }
    ],
    ["path", { d: "M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193" }],
    ["circle", { cx: "10.5", cy: "6.5", r: ".5", fill: "currentColor" }]
  ];

  // node_modules/lucide/dist/esm/icons/tally-1.mjs
  var Tally1 = [["path", { d: "M4 4v16" }]];

  // node_modules/lucide/dist/esm/icons/tally-2.mjs
  var Tally2 = [
    ["path", { d: "M4 4v16" }],
    ["path", { d: "M9 4v16" }]
  ];

  // node_modules/lucide/dist/esm/icons/tally-3.mjs
  var Tally3 = [
    ["path", { d: "M4 4v16" }],
    ["path", { d: "M9 4v16" }],
    ["path", { d: "M14 4v16" }]
  ];

  // node_modules/lucide/dist/esm/icons/tally-4.mjs
  var Tally4 = [
    ["path", { d: "M4 4v16" }],
    ["path", { d: "M9 4v16" }],
    ["path", { d: "M14 4v16" }],
    ["path", { d: "M19 4v16" }]
  ];

  // node_modules/lucide/dist/esm/icons/tally-5.mjs
  var Tally5 = [
    ["path", { d: "M4 4v16" }],
    ["path", { d: "M9 4v16" }],
    ["path", { d: "M14 4v16" }],
    ["path", { d: "M19 4v16" }],
    ["path", { d: "M22 6 2 18" }]
  ];

  // node_modules/lucide/dist/esm/icons/target.mjs
  var Target = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["circle", { cx: "12", cy: "12", r: "6" }],
    ["circle", { cx: "12", cy: "12", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/tangent.mjs
  var Tangent = [
    ["circle", { cx: "17", cy: "4", r: "2" }],
    ["path", { d: "M15.59 5.41 5.41 15.59" }],
    ["circle", { cx: "4", cy: "17", r: "2" }],
    ["path", { d: "M12 22s-4-9-1.5-11.5S22 12 22 12" }]
  ];

  // node_modules/lucide/dist/esm/icons/telescope.mjs
  var Telescope = [
    [
      "path",
      {
        d: "m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"
      }
    ],
    ["path", { d: "m13.56 11.747 4.332-.924" }],
    ["path", { d: "m16 21-3.105-6.21" }],
    [
      "path",
      {
        d: "M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"
      }
    ],
    ["path", { d: "m6.158 8.633 1.114 4.456" }],
    ["path", { d: "m8 21 3.105-6.21" }],
    ["circle", { cx: "12", cy: "13", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/tent-tree.mjs
  var TentTree = [
    ["circle", { cx: "4", cy: "4", r: "2" }],
    ["path", { d: "m14 5 3-3 3 3" }],
    ["path", { d: "m14 10 3-3 3 3" }],
    ["path", { d: "M17 14V2" }],
    ["path", { d: "M17 14H7l-5 8h20Z" }],
    ["path", { d: "M8 14v8" }],
    ["path", { d: "m9 14 5 8" }]
  ];

  // node_modules/lucide/dist/esm/icons/tent.mjs
  var Tent = [
    ["path", { d: "M3.5 21 14 3" }],
    ["path", { d: "M20.5 21 10 3" }],
    ["path", { d: "M15.5 21 12 15l-3.5 6" }],
    ["path", { d: "M2 21h20" }]
  ];

  // node_modules/lucide/dist/esm/icons/terminal.mjs
  var Terminal = [
    ["path", { d: "M12 19h8" }],
    ["path", { d: "m4 17 6-6-6-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/test-tube.mjs
  var TestTube = [
    ["path", { d: "M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2" }],
    ["path", { d: "M8.5 2h7" }],
    ["path", { d: "M14.5 16h-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/test-tube-diagonal.mjs
  var TestTubeDiagonal = [
    ["path", { d: "M21 7 6.82 21.18a2.83 2.83 0 0 1-3.99-.01a2.83 2.83 0 0 1 0-4L17 3" }],
    ["path", { d: "m16 2 6 6" }],
    ["path", { d: "M12 16H4" }]
  ];

  // node_modules/lucide/dist/esm/icons/test-tubes.mjs
  var TestTubes = [
    ["path", { d: "M9 2v17.5A2.5 2.5 0 0 1 6.5 22A2.5 2.5 0 0 1 4 19.5V2" }],
    ["path", { d: "M20 2v17.5a2.5 2.5 0 0 1-2.5 2.5a2.5 2.5 0 0 1-2.5-2.5V2" }],
    ["path", { d: "M3 2h7" }],
    ["path", { d: "M14 2h7" }],
    ["path", { d: "M9 16H4" }],
    ["path", { d: "M20 16h-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-align-center.mjs
  var TextAlignCenter = [
    ["path", { d: "M21 5H3" }],
    ["path", { d: "M17 12H7" }],
    ["path", { d: "M19 19H5" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-align-end.mjs
  var TextAlignEnd = [
    ["path", { d: "M21 5H3" }],
    ["path", { d: "M21 12H9" }],
    ["path", { d: "M21 19H7" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-align-justify-center.mjs
  var TextAlignJustifyCenter = [
    ["path", { d: "M3 5h18" }],
    ["path", { d: "M3 12h18" }],
    ["path", { d: "M7 19h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-align-justify-end.mjs
  var TextAlignJustifyEnd = [
    ["path", { d: "M3 5h18" }],
    ["path", { d: "M3 12h18" }],
    ["path", { d: "M11 19h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-align-justify-start.mjs
  var TextAlignJustifyStart = [
    ["path", { d: "M3 5h18" }],
    ["path", { d: "M3 12h18" }],
    ["path", { d: "M3 19h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-align-justify.mjs
  var TextAlignJustify = [
    ["path", { d: "M3 5h18" }],
    ["path", { d: "M3 12h18" }],
    ["path", { d: "M3 19h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-align-start.mjs
  var TextAlignStart = [
    ["path", { d: "M21 5H3" }],
    ["path", { d: "M15 12H3" }],
    ["path", { d: "M17 19H3" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-cursor-input.mjs
  var TextCursorInput = [
    ["path", { d: "M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6" }],
    ["path", { d: "M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7" }],
    ["path", { d: "M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" }],
    ["path", { d: "M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1" }],
    ["path", { d: "M9 6v12" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-cursor.mjs
  var TextCursor = [
    ["path", { d: "M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1" }],
    ["path", { d: "M7 22h1a4 4 0 0 0 4-4" }],
    ["path", { d: "M7 2h1a4 4 0 0 1 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-initial.mjs
  var TextInitial = [
    ["path", { d: "M15 5h6" }],
    ["path", { d: "M15 12h6" }],
    ["path", { d: "M3 19h18" }],
    ["path", { d: "m3 12 3.553-7.724a.5.5 0 0 1 .894 0L11 12" }],
    ["path", { d: "M3.92 10h6.16" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-quote.mjs
  var TextQuote = [
    ["path", { d: "M17 5H3" }],
    ["path", { d: "M21 12H8" }],
    ["path", { d: "M21 19H8" }],
    ["path", { d: "M3 12v7" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-search.mjs
  var TextSearch = [
    ["path", { d: "M21 5H3" }],
    ["path", { d: "M10 12H3" }],
    ["path", { d: "M10 19H3" }],
    ["circle", { cx: "17", cy: "15", r: "3" }],
    ["path", { d: "m21 19-1.9-1.9" }]
  ];

  // node_modules/lucide/dist/esm/icons/text-wrap.mjs
  var TextWrap = [
    ["path", { d: "m16 16-3 3 3 3" }],
    ["path", { d: "M3 12h14.5a1 1 0 0 1 0 7H13" }],
    ["path", { d: "M3 19h6" }],
    ["path", { d: "M3 5h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/theater.mjs
  var Theater = [
    ["path", { d: "M2 10s3-3 3-8" }],
    ["path", { d: "M22 10s-3-3-3-8" }],
    ["path", { d: "M10 2c0 4.4-3.6 8-8 8" }],
    ["path", { d: "M14 2c0 4.4 3.6 8 8 8" }],
    ["path", { d: "M2 10s2 2 2 5" }],
    ["path", { d: "M22 10s-2 2-2 5" }],
    ["path", { d: "M8 15h8" }],
    ["path", { d: "M2 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" }],
    ["path", { d: "M14 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" }]
  ];

  // node_modules/lucide/dist/esm/icons/thermometer-snowflake.mjs
  var ThermometerSnowflake = [
    ["path", { d: "m10 20-1.25-2.5L6 18" }],
    ["path", { d: "M10 4 8.75 6.5 6 6" }],
    ["path", { d: "M10.585 15H10" }],
    ["path", { d: "M2 12h6.5L10 9" }],
    ["path", { d: "M20 14.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z" }],
    ["path", { d: "m4 10 1.5 2L4 14" }],
    ["path", { d: "m7 21 3-6-1.5-3" }],
    ["path", { d: "m7 3 3 6h2" }]
  ];

  // node_modules/lucide/dist/esm/icons/thermometer-sun.mjs
  var ThermometerSun = [
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M12 8a4 4 0 0 0-1.645 7.647" }],
    ["path", { d: "M2 12h2" }],
    ["path", { d: "M20 14.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z" }],
    ["path", { d: "m4.93 4.93 1.41 1.41" }],
    ["path", { d: "m6.34 17.66-1.41 1.41" }]
  ];

  // node_modules/lucide/dist/esm/icons/thermometer.mjs
  var Thermometer = [["path", { d: "M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" }]];

  // node_modules/lucide/dist/esm/icons/thumbs-down.mjs
  var ThumbsDown = [
    [
      "path",
      {
        d: "M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"
      }
    ],
    ["path", { d: "M17 14V2" }]
  ];

  // node_modules/lucide/dist/esm/icons/thumbs-up.mjs
  var ThumbsUp = [
    [
      "path",
      {
        d: "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"
      }
    ],
    ["path", { d: "M7 10v12" }]
  ];

  // node_modules/lucide/dist/esm/icons/tic-tac-toe.mjs
  var TicTacToe = [
    ["path", { d: "M12 2v20" }],
    ["path", { d: "m21 16-5 5" }],
    ["path", { d: "m21 21-5-5" }],
    ["path", { d: "M22 12H2" }],
    ["path", { d: "M8 3 3 8" }],
    ["path", { d: "M8 8 3 3" }],
    ["circle", { cx: "18.5", cy: "5.5", r: "2.5" }],
    ["circle", { cx: "5.5", cy: "18.5", r: "2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/ticket-check.mjs
  var TicketCheck = [
    [
      "path",
      {
        d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
      }
    ],
    ["path", { d: "m9 12 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/ticket-minus.mjs
  var TicketMinus = [
    [
      "path",
      {
        d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
      }
    ],
    ["path", { d: "M9 12h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/ticket-percent.mjs
  var TicketPercent = [
    [
      "path",
      {
        d: "M2 9a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
      }
    ],
    ["path", { d: "M9 9h.01" }],
    ["path", { d: "m15 9-6 6" }],
    ["path", { d: "M15 15h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/ticket-plus.mjs
  var TicketPlus = [
    [
      "path",
      {
        d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
      }
    ],
    ["path", { d: "M9 12h6" }],
    ["path", { d: "M12 9v6" }]
  ];

  // node_modules/lucide/dist/esm/icons/ticket-slash.mjs
  var TicketSlash = [
    [
      "path",
      {
        d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
      }
    ],
    ["path", { d: "m9.5 14.5 5-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/ticket.mjs
  var Ticket = [
    [
      "path",
      {
        d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
      }
    ],
    ["path", { d: "M13 5v2" }],
    ["path", { d: "M13 17v2" }],
    ["path", { d: "M13 11v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/ticket-x.mjs
  var TicketX = [
    [
      "path",
      {
        d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
      }
    ],
    ["path", { d: "m9.5 14.5 5-5" }],
    ["path", { d: "m9.5 9.5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/tickets-plane.mjs
  var TicketsPlane = [
    ["path", { d: "M10.5 17h1.227a2 2 0 0 0 1.345-.52L18 12" }],
    ["path", { d: "m12 13.5 3.794.506" }],
    ["path", { d: "m3.173 8.18 11-5a2 2 0 0 1 2.647.993L18.56 8" }],
    ["path", { d: "M6 10V8" }],
    ["path", { d: "M6 14v1" }],
    ["path", { d: "M6 19v2" }],
    ["rect", { x: "2", y: "8", width: "20", height: "13", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/tickets.mjs
  var Tickets = [
    ["path", { d: "m3.173 8.18 11-5a2 2 0 0 1 2.647.993L18.56 8" }],
    ["path", { d: "M6 10V8" }],
    ["path", { d: "M6 14v1" }],
    ["path", { d: "M6 19v2" }],
    ["rect", { x: "2", y: "8", width: "20", height: "13", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/timeline.mjs
  var Timeline = [
    ["path", { d: "M4 12h.01" }],
    ["path", { d: "M4 16h.01" }],
    ["path", { d: "M4 20h.01" }],
    ["path", { d: "M4 4h.01" }],
    ["path", { d: "M4 8h.01" }],
    [
      "path",
      {
        d: "M9.414 13.414a2 2 0 0 0 1.414.586H19a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-8.172a2 2 0 0 0-1.414.586L8 12z"
      }
    ],
    [
      "path",
      {
        d: "M9.414 21.414a2 2 0 0 0 1.414.586H19a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-8.172a2 2 0 0 0-1.414.586L8 20z"
      }
    ],
    [
      "path",
      {
        d: "M9.414 5.414A2 2 0 0 0 10.828 6H19a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-8.172a2 2 0 0 0-1.414.586L8 4z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/timer-off.mjs
  var TimerOff = [
    ["path", { d: "M10 2h4" }],
    ["path", { d: "M4.6 11a8 8 0 0 0 1.7 8.7 8 8 0 0 0 8.7 1.7" }],
    ["path", { d: "M7.4 7.4a8 8 0 0 1 10.3 1 8 8 0 0 1 .9 10.2" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M12 12v-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/timer-reset.mjs
  var TimerReset = [
    ["path", { d: "M10 2h4" }],
    ["path", { d: "M12 14v-4" }],
    ["path", { d: "M4 13a8 8 0 0 1 8-7 8 8 0 1 1-5.3 14L4 17.6" }],
    ["path", { d: "M9 17H4v5" }]
  ];

  // node_modules/lucide/dist/esm/icons/timer.mjs
  var Timer = [
    ["line", { x1: "10", x2: "14", y1: "2", y2: "2" }],
    ["line", { x1: "12", x2: "15", y1: "14", y2: "11" }],
    ["circle", { cx: "12", cy: "14", r: "8" }]
  ];

  // node_modules/lucide/dist/esm/icons/toggle-right.mjs
  var ToggleRight = [
    ["circle", { cx: "15", cy: "12", r: "3" }],
    ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "7" }]
  ];

  // node_modules/lucide/dist/esm/icons/toilet.mjs
  var Toilet = [
    [
      "path",
      {
        d: "M7 12h13a1 1 0 0 1 1 1 5 5 0 0 1-5 5h-.598a.5.5 0 0 0-.424.765l1.544 2.47a.5.5 0 0 1-.424.765H5.402a.5.5 0 0 1-.424-.765L7 18"
      }
    ],
    ["path", { d: "M8 18a5 5 0 0 1-5-5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" }]
  ];

  // node_modules/lucide/dist/esm/icons/toggle-left.mjs
  var ToggleLeft = [
    ["circle", { cx: "9", cy: "12", r: "3" }],
    ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "7" }]
  ];

  // node_modules/lucide/dist/esm/icons/tombstone.mjs
  var Tombstone = [
    ["path", { d: "M11 10h2" }],
    ["path", { d: "M19 21V10a7 7 0 00-14 0v11" }],
    ["path", { d: "M2 21h20" }],
    ["path", { d: "M9 14h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/tool-case.mjs
  var ToolCase = [
    ["path", { d: "M10 15h4" }],
    [
      "path",
      {
        d: "m14.5 4.058.571-1.429a1 1 0 011.3-.558l5 2a1 1 0 01.549.534.88.88 0 01.01.765l-2.332 5.83"
      }
    ],
    [
      "path",
      {
        d: "M15.634 11a2 2 0 00-.186-.34l-1.17-1.757 1.31-1.656a2 2 0 00-2.109-3.165l-2.032.57-1.17-1.758a2 2 0 00-3.664 1.028l-.086 2.11-2.032.568a2 2 0 00-.155 3.8l1.617.6"
      }
    ],
    ["path", { d: "M4 12.006A1 1 0 014.994 11H19a1 1 0 011 1v7a2 2 0 01-2 2H6a2 2 0 01-2-2z" }]
  ];

  // node_modules/lucide/dist/esm/icons/toolbox.mjs
  var Toolbox = [
    ["path", { d: "M16 12v4" }],
    ["path", { d: "M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" }],
    [
      "path",
      {
        d: "M17 6a2 2 0 011.414.586l3 3A2 2 0 0122 11v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8a2 2 0 01.586-1.414l3-3A2 2 0 017 6z"
      }
    ],
    ["path", { d: "M2 14h20" }],
    ["path", { d: "M8 12v4" }]
  ];

  // node_modules/lucide/dist/esm/icons/toothbrush.mjs
  var Toothbrush = [
    ["path", { d: "M15 11c-2 2-4 2-6 4l-7 7" }],
    [
      "path",
      {
        d: "m22 4-7.414 7.414-2-2A2 2 0 0114 6c0-.512.196-1.024.586-1.414A2 2 0 0116 4a2 2 0 013.262-1.552l2.152 2.138"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/toothbrush-sparkles.mjs
  var ToothbrushSparkles = [
    ["path", { d: "M10 3H8" }],
    ["path", { d: "M14.586 11.414 22 4" }],
    ["path", { d: "M15 11a8 8 0 01-.429.4" }],
    [
      "path",
      {
        d: "m2 22 7-7c1.857-1.857 3.714-1.99 5.571-3.6l-1.985-1.986A2 2 0 0114 6a2 2 0 012-2 2 2 0 013.262-1.552l2.152 2.138"
      }
    ],
    ["path", { d: "M20 15v4" }],
    ["path", { d: "M22 17h-4" }],
    ["path", { d: "M4 5v4" }],
    ["path", { d: "M6 7H2" }],
    ["path", { d: "M9 2v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/tornado.mjs
  var Tornado = [
    ["path", { d: "M21 4H3" }],
    ["path", { d: "M18 8H6" }],
    ["path", { d: "M19 12H9" }],
    ["path", { d: "M16 16h-6" }],
    ["path", { d: "M11 20H9" }]
  ];

  // node_modules/lucide/dist/esm/icons/torus.mjs
  var Torus = [
    ["ellipse", { cx: "12", cy: "11", rx: "3", ry: "2" }],
    ["ellipse", { cx: "12", cy: "12.5", rx: "10", ry: "8.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/touchpad-off.mjs
  var TouchpadOff = [
    ["path", { d: "M12 20v-6" }],
    ["path", { d: "M19.656 14H22" }],
    ["path", { d: "M2 14h12" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" }],
    ["path", { d: "M9.656 4H20a2 2 0 0 1 2 2v10.344" }]
  ];

  // node_modules/lucide/dist/esm/icons/touchpad.mjs
  var Touchpad = [
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
    ["path", { d: "M2 14h20" }],
    ["path", { d: "M12 20v-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/towel-rack.mjs
  var TowelRack = [
    ["path", { d: "M22 7h-2" }],
    [
      "path",
      {
        d: "M6.5 3h11A2.5 2.5 0 0 1 20 5.5V20a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V5.5a1 1 0 0 0-5 0V17a1 1 0 0 0 1 1h4"
      }
    ],
    ["path", { d: "M9 7H2" }]
  ];

  // node_modules/lucide/dist/esm/icons/tower-control.mjs
  var TowerControl = [
    ["path", { d: "M18.2 12.27 20 6H4l1.8 6.27a1 1 0 0 0 .95.73h10.5a1 1 0 0 0 .96-.73Z" }],
    ["path", { d: "M8 13v9" }],
    ["path", { d: "M16 22v-9" }],
    ["path", { d: "m9 6 1 7" }],
    ["path", { d: "m15 6-1 7" }],
    ["path", { d: "M12 6V2" }],
    ["path", { d: "M13 2h-2" }]
  ];

  // node_modules/lucide/dist/esm/icons/toy-brick.mjs
  var ToyBrick = [
    ["rect", { width: "18", height: "12", x: "3", y: "8", rx: "1" }],
    ["path", { d: "M10 8V5c0-.6-.4-1-1-1H6a1 1 0 0 0-1 1v3" }],
    ["path", { d: "M19 8V5c0-.6-.4-1-1-1h-3a1 1 0 0 0-1 1v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/tractor.mjs
  var Tractor = [
    ["path", { d: "m10 11 11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20" }],
    ["path", { d: "M16 18h-5" }],
    ["path", { d: "M18 5a1 1 0 0 0-1 1v5.573" }],
    ["path", { d: "M3 4h8.129a1 1 0 0 1 .99.863L13 11.246" }],
    ["path", { d: "M4 11V4" }],
    ["path", { d: "M7 15h.01" }],
    ["path", { d: "M8 10.1V4" }],
    ["circle", { cx: "18", cy: "18", r: "2" }],
    ["circle", { cx: "7", cy: "15", r: "5" }]
  ];

  // node_modules/lucide/dist/esm/icons/traffic-cone.mjs
  var TrafficCone = [
    ["path", { d: "M16.05 10.966a5 2.5 0 0 1-8.1 0" }],
    [
      "path",
      {
        d: "m16.923 14.049 4.48 2.04a1 1 0 0 1 .001 1.831l-8.574 3.9a2 2 0 0 1-1.66 0l-8.574-3.91a1 1 0 0 1 0-1.83l4.484-2.04"
      }
    ],
    ["path", { d: "M16.949 14.14a5 2.5 0 1 1-9.9 0L10.063 3.5a2 2 0 0 1 3.874 0z" }],
    ["path", { d: "M9.194 6.57a5 2.5 0 0 0 5.61 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/train-front-tunnel.mjs
  var TrainFrontTunnel = [
    ["path", { d: "M2 22V12a10 10 0 1 1 20 0v10" }],
    ["path", { d: "M15 6.8v1.4a3 2.8 0 1 1-6 0V6.8" }],
    ["path", { d: "M10 15h.01" }],
    ["path", { d: "M14 15h.01" }],
    ["path", { d: "M10 19a4 4 0 0 1-4-4v-3a6 6 0 1 1 12 0v3a4 4 0 0 1-4 4Z" }],
    ["path", { d: "m9 19-2 3" }],
    ["path", { d: "m15 19 2 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/trailer.mjs
  var Trailer = [
    ["path", { d: "M10 11.341V10" }],
    ["path", { d: "M14 13v-3" }],
    ["path", { d: "M18 17V8a2 2 0 00-2-2H4a2 2 0 00-2 2v7a2 2 0 002 2h2" }],
    ["path", { d: "M22 15v1a1 1 0 01-1 1H10" }],
    ["path", { d: "M6 11.341V10" }],
    ["circle", { cx: "8", cy: "17", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/train-front.mjs
  var TrainFront = [
    ["path", { d: "M8 3.1V7a4 4 0 0 0 8 0V3.1" }],
    ["path", { d: "m9 15-1-1" }],
    ["path", { d: "m15 15 1-1" }],
    ["path", { d: "M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z" }],
    ["path", { d: "m8 19-2 3" }],
    ["path", { d: "m16 19 2 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/train-track.mjs
  var TrainTrack = [
    ["path", { d: "M2 17 17 2" }],
    ["path", { d: "m2 14 8 8" }],
    ["path", { d: "m5 11 8 8" }],
    ["path", { d: "m8 8 8 8" }],
    ["path", { d: "m11 5 8 8" }],
    ["path", { d: "m14 2 8 8" }],
    ["path", { d: "M7 22 22 7" }]
  ];

  // node_modules/lucide/dist/esm/icons/tram-front.mjs
  var TramFront = [
    ["rect", { width: "16", height: "16", x: "4", y: "3", rx: "2" }],
    ["path", { d: "M4 11h16" }],
    ["path", { d: "M12 3v8" }],
    ["path", { d: "m8 19-2 3" }],
    ["path", { d: "m18 22-2-3" }],
    ["path", { d: "M8 15h.01" }],
    ["path", { d: "M16 15h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/transgender.mjs
  var Transgender = [
    ["path", { d: "M12 16v6" }],
    ["path", { d: "M14 20h-4" }],
    ["path", { d: "M18 2h4v4" }],
    ["path", { d: "m2 2 7.17 7.17" }],
    ["path", { d: "M2 5.355V2h3.357" }],
    ["path", { d: "m22 2-7.17 7.17" }],
    ["path", { d: "M8 5 5 8" }],
    ["circle", { cx: "12", cy: "12", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/trash-off.mjs
  var TrashOff = [
    ["path", { d: "M10 11v6" }],
    ["path", { d: "M14 17v-3" }],
    ["path", { d: "M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-1.576.768" }],
    ["path", { d: "M19 6v7.344" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M21 6h-9.344" }],
    ["path", { d: "M3 6h3" }],
    ["path", { d: "M5 6v14a2 2 0 002 2h10a2 2 0 002-2v-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/trash.mjs
  var Trash = [
    ["path", { d: "M10 11v6" }],
    ["path", { d: "M14 11v6" }],
    ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }],
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }]
  ];

  // node_modules/lucide/dist/esm/icons/tree-deciduous.mjs
  var TreeDeciduous = [
    [
      "path",
      {
        d: "M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z"
      }
    ],
    ["path", { d: "M12 19v3" }]
  ];

  // node_modules/lucide/dist/esm/icons/tree-palm.mjs
  var TreePalm = [
    ["path", { d: "M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4" }],
    ["path", { d: "M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3" }],
    [
      "path",
      {
        d: "M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35"
      }
    ],
    ["path", { d: "M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14" }]
  ];

  // node_modules/lucide/dist/esm/icons/tree-pine.mjs
  var TreePine = [
    [
      "path",
      {
        d: "m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"
      }
    ],
    ["path", { d: "M12 22v-3" }]
  ];

  // node_modules/lucide/dist/esm/icons/trees.mjs
  var Trees = [
    ["path", { d: "M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" }],
    ["path", { d: "M7 16v6" }],
    ["path", { d: "M13 19v3" }],
    [
      "path",
      {
        d: "M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/trending-down.mjs
  var TrendingDown = [
    ["path", { d: "M16 17h6v-6" }],
    ["path", { d: "m22 17-8.5-8.5-5 5L2 7" }]
  ];

  // node_modules/lucide/dist/esm/icons/trending-up-down.mjs
  var TrendingUpDown = [
    ["path", { d: "M14.828 14.828 21 21" }],
    ["path", { d: "M21 16v5h-5" }],
    ["path", { d: "m21 3-9 9-4-4-6 6" }],
    ["path", { d: "M21 8V3h-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/trending-up.mjs
  var TrendingUp = [
    ["path", { d: "M16 7h6v6" }],
    ["path", { d: "m22 7-8.5 8.5-5-5L2 17" }]
  ];

  // node_modules/lucide/dist/esm/icons/triangle-dashed.mjs
  var TriangleDashed = [
    ["path", { d: "M10.17 4.193a2 2 0 0 1 3.666.013" }],
    ["path", { d: "M14 21h2" }],
    ["path", { d: "m15.874 7.743 1 1.732" }],
    ["path", { d: "m18.849 12.952 1 1.732" }],
    ["path", { d: "M21.824 18.18a2 2 0 0 1-1.835 2.824" }],
    ["path", { d: "M4.024 21a2 2 0 0 1-1.839-2.839" }],
    ["path", { d: "m5.136 12.952-1 1.732" }],
    ["path", { d: "M8 21h2" }],
    ["path", { d: "m8.102 7.743-1 1.732" }]
  ];

  // node_modules/lucide/dist/esm/icons/triangle-exclamation-point.mjs
  var TriangleExclamationPoint = [
    ["path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }],
    ["path", { d: "M12 9v4" }],
    ["path", { d: "M12 17h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/triangle.mjs
  var Triangle = [
    ["path", { d: "M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/triangle-right.mjs
  var TriangleRight = [
    ["path", { d: "M22 18a2 2 0 0 1-2 2H3c-1.1 0-1.3-.6-.4-1.3L20.4 4.3c.9-.7 1.6-.4 1.6.7Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/triangles-centerline-dashed-horizontal.mjs
  var TrianglesCenterlineDashedHorizontal = [
    ["path", { d: "M10 12H8" }],
    ["path", { d: "M16 12h-2" }],
    ["path", { d: "M22 12h-2" }],
    ["path", { d: "M4 12H2" }],
    [
      "path",
      { d: "M7.298 20.288A1 1 0 008 22h8a1 1 0 00.703-1.712l-3.991-3.99a1 1 0 00-1.424-.001z" }
    ],
    ["path", { d: "M7.298 3.712A1 1 0 018 2h8a1 1 0 01.703 1.712l-3.991 3.99a1 1 0 01-1.424.001z" }]
  ];

  // node_modules/lucide/dist/esm/icons/triangles-centerline-dashed-vertical.mjs
  var TrianglesCenterlineDashedVertical = [
    ["path", { d: "M12 14v2" }],
    ["path", { d: "M12 20v2" }],
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M12 8v2" }],
    [
      "path",
      { d: "M20.288 16.703A1 1 0 0022 16V8a1 1 0 00-1.712-.703l-3.99 3.991a1 1 0 00-.001 1.424z" }
    ],
    ["path", { d: "M3.712 16.703A1 1 0 012 16V8a1 1 0 011.712-.703l3.99 3.991a1 1 0 01.001 1.424z" }]
  ];

  // node_modules/lucide/dist/esm/icons/trophy.mjs
  var Trophy = [
    ["path", { d: "M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" }],
    ["path", { d: "M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" }],
    ["path", { d: "M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" }],
    ["path", { d: "M4 22h16" }],
    ["path", { d: "M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" }],
    ["path", { d: "M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" }]
  ];

  // node_modules/lucide/dist/esm/icons/truck-electric.mjs
  var TruckElectric = [
    ["path", { d: "M14 19V7a2 2 0 0 0-2-2H9" }],
    ["path", { d: "M15 19H9" }],
    ["path", { d: "M19 19h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.38a1 1 0 0 0-.78-.38H14" }],
    ["path", { d: "M2 13v5a1 1 0 0 0 1 1h2" }],
    ["path", { d: "M4 3 2.15 5.15a.495.495 0 0 0 .35.86h2.15a.47.47 0 0 1 .35.86L3 9.02" }],
    ["circle", { cx: "17", cy: "19", r: "2" }],
    ["circle", { cx: "7", cy: "19", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/truck.mjs
  var Truck = [
    ["path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }],
    ["path", { d: "M15 18H9" }],
    [
      "path",
      { d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" }
    ],
    ["circle", { cx: "17", cy: "18", r: "2" }],
    ["circle", { cx: "7", cy: "18", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/tube-lotion.mjs
  var TubeLotion = [
    ["path", { d: "M15 18v3a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-3" }],
    [
      "path",
      {
        d: "M17 2a2 2 0 0 1 1.6 3.2A8 8 0 0 0 17 10v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-6a8 8 0 0 0-1.6-4.8A2 2 0 0 1 7 2z"
      }
    ],
    ["path", { d: "M7 10a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/turkish-lira.mjs
  var TurkishLira = [
    ["path", { d: "m14 10-8 4" }],
    ["path", { d: "M14 5 6 9" }],
    ["path", { d: "M18 12a8 8 0 01-7.003 7.937c-.547.07-.997-.385-.997-.937V4" }]
  ];

  // node_modules/lucide/dist/esm/icons/turntable.mjs
  var Turntable = [
    ["path", { d: "M10 12.01h.01" }],
    ["path", { d: "M18 8v4a8 8 0 0 1-1.07 4" }],
    ["circle", { cx: "10", cy: "12", r: "4" }],
    ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/turtle.mjs
  var Turtle = [
    [
      "path",
      {
        d: "m12 10 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a8 8 0 1 0-16 0v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3l2-4h4Z"
      }
    ],
    ["path", { d: "M4.82 7.9 8 10" }],
    ["path", { d: "M15.18 7.9 12 10" }],
    ["path", { d: "M16.93 10H20a2 2 0 0 1 0 4H2" }]
  ];

  // node_modules/lucide/dist/esm/icons/tv-minimal-play.mjs
  var TvMinimalPlay = [
    [
      "path",
      {
        d: "M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z"
      }
    ],
    ["path", { d: "M7 21h10" }],
    ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/tv-minimal.mjs
  var TvMinimal = [
    ["path", { d: "M7 21h10" }],
    ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/tv.mjs
  var Tv = [
    ["path", { d: "m17 2-5 5-5-5" }],
    ["rect", { width: "20", height: "15", x: "2", y: "7", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/type-outline.mjs
  var TypeOutline = [
    [
      "path",
      {
        d: "M14 16.5a.5.5 0 0 0 .5.5h.5a2 2 0 0 1 0 4H9a2 2 0 0 1 0-4h.5a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5V8a2 2 0 0 1-4 0V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-4 0v-.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/type.mjs
  var Type = [
    ["path", { d: "M12 4v16" }],
    ["path", { d: "M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" }],
    ["path", { d: "M9 20h6" }]
  ];

  // node_modules/lucide/dist/esm/icons/umbrella-off.mjs
  var UmbrellaOff = [
    ["path", { d: "M12 13v7a2 2 0 0 0 4 0" }],
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M18.656 13h2.336a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-12.07-7.51" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M5.961 5.957a10.28 10.28 0 0 0-3.922 5.769A1 1 0 0 0 3 13h10" }]
  ];

  // node_modules/lucide/dist/esm/icons/umbrella.mjs
  var Umbrella = [
    ["path", { d: "M12 13v7a2 2 0 0 0 4 0" }],
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z" }]
  ];

  // node_modules/lucide/dist/esm/icons/underline.mjs
  var Underline = [
    ["path", { d: "M6 4v6a6 6 0 0 0 12 0V4" }],
    ["line", { x1: "4", x2: "20", y1: "20", y2: "20" }]
  ];

  // node_modules/lucide/dist/esm/icons/undo-2.mjs
  var Undo2 = [
    ["path", { d: "M9 14 4 9l5-5" }],
    ["path", { d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" }]
  ];

  // node_modules/lucide/dist/esm/icons/undo-dot.mjs
  var UndoDot = [
    ["path", { d: "M21 17a9 9 0 0 0-15-6.7L3 13" }],
    ["path", { d: "M3 7v6h6" }],
    ["circle", { cx: "12", cy: "17", r: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/undo.mjs
  var Undo = [
    ["path", { d: "M3 7v6h6" }],
    ["path", { d: "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" }]
  ];

  // node_modules/lucide/dist/esm/icons/unfold-horizontal.mjs
  var UnfoldHorizontal = [
    ["path", { d: "M16 12h6" }],
    ["path", { d: "M8 12H2" }],
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M12 8v2" }],
    ["path", { d: "M12 14v2" }],
    ["path", { d: "M12 20v2" }],
    ["path", { d: "m19 15 3-3-3-3" }],
    ["path", { d: "m5 9-3 3 3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/unfold-vertical.mjs
  var UnfoldVertical = [
    ["path", { d: "M12 22v-6" }],
    ["path", { d: "M12 8V2" }],
    ["path", { d: "M4 12H2" }],
    ["path", { d: "M10 12H8" }],
    ["path", { d: "M16 12h-2" }],
    ["path", { d: "M22 12h-2" }],
    ["path", { d: "m15 19-3 3-3-3" }],
    ["path", { d: "m15 5-3-3-3 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/ungroup.mjs
  var Ungroup = [
    ["rect", { x: "11", y: "14", width: "10", height: "7", rx: "2" }],
    ["rect", { x: "3", y: "3", width: "10", height: "7", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/university.mjs
  var University = [
    ["path", { d: "M14 21v-3a2 2 0 0 0-4 0v3" }],
    ["path", { d: "M18 12h.01" }],
    ["path", { d: "M18 16h.01" }],
    [
      "path",
      {
        d: "M22 7a1 1 0 0 0-1-1h-2a2 2 0 0 1-1.143-.359L13.143 2.36a2 2 0 0 0-2.286-.001L6.143 5.64A2 2 0 0 1 5 6H3a1 1 0 0 0-1 1v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"
      }
    ],
    ["path", { d: "M6 12h.01" }],
    ["path", { d: "M6 16h.01" }],
    ["circle", { cx: "12", cy: "10", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/unlink-2.mjs
  var Unlink2 = [["path", { d: "M15 7h2a5 5 0 0 1 0 10h-2m-6 0H7A5 5 0 0 1 7 7h2" }]];

  // node_modules/lucide/dist/esm/icons/unlink.mjs
  var Unlink = [
    [
      "path",
      {
        d: "m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"
      }
    ],
    [
      "path",
      { d: "m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" }
    ],
    ["line", { x1: "8", x2: "8", y1: "2", y2: "5" }],
    ["line", { x1: "2", x2: "5", y1: "8", y2: "8" }],
    ["line", { x1: "16", x2: "16", y1: "19", y2: "22" }],
    ["line", { x1: "19", x2: "22", y1: "16", y2: "16" }]
  ];

  // node_modules/lucide/dist/esm/icons/unplug.mjs
  var Unplug = [
    ["path", { d: "m19 5 3-3" }],
    ["path", { d: "m2 22 3-3" }],
    ["path", { d: "M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" }],
    ["path", { d: "M7.5 13.5 10 11" }],
    ["path", { d: "M10.5 16.5 13 14" }],
    ["path", { d: "m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/upload.mjs
  var Upload = [
    ["path", { d: "M12 3v12" }],
    ["path", { d: "m17 8-5-5-5 5" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/usb-c-port.mjs
  var UsbCPort = [
    ["path", { d: "M6 12h12" }],
    ["rect", { x: "2", y: "8", width: "20", height: "8", rx: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/usb.mjs
  var Usb = [
    ["circle", { cx: "10", cy: "7", r: "1" }],
    ["circle", { cx: "4", cy: "20", r: "1" }],
    ["path", { d: "M4.7 19.3 19 5" }],
    ["path", { d: "m21 3-3 1 2 2Z" }],
    ["path", { d: "M9.26 7.68 5 12l2 5" }],
    ["path", { d: "m10 14 5 2 3.5-3.5" }],
    ["path", { d: "m18 12 1-1 1 1-1 1Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-check.mjs
  var UserCheck = [
    ["path", { d: "m16 11 2 2 4-4" }],
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: "9", cy: "7", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-cog.mjs
  var UserCog = [
    ["path", { d: "M10 15H6a4 4 0 0 0-4 4v2" }],
    ["path", { d: "m14.305 16.53.923-.382" }],
    ["path", { d: "m15.228 13.852-.923-.383" }],
    ["path", { d: "m16.852 12.228-.383-.923" }],
    ["path", { d: "m16.852 17.772-.383.924" }],
    ["path", { d: "m19.148 12.228.383-.923" }],
    ["path", { d: "m19.53 18.696-.382-.924" }],
    ["path", { d: "m20.772 13.852.924-.383" }],
    ["path", { d: "m20.772 16.148.924.383" }],
    ["circle", { cx: "18", cy: "15", r: "3" }],
    ["circle", { cx: "9", cy: "7", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-group.mjs
  var UserGroup = [
    ["path", { d: "M17 21v-1a2 2 0 00-2-2H9a2 2 0 00-2 2v1" }],
    ["path", { d: "M19 10h1a2 2 0 012 2v1" }],
    ["path", { d: "M5 10H4a2 2 0 00-2 2v1" }],
    ["circle", { cx: "12", cy: "11", r: "3" }],
    ["circle", { cx: "18", cy: "4", r: "2" }],
    ["circle", { cx: "6", cy: "4", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-key.mjs
  var UserKey = [
    ["path", { d: "M20 11v6" }],
    ["path", { d: "M20 13h2" }],
    ["path", { d: "M3 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 2.072.578" }],
    ["circle", { cx: "10", cy: "7", r: "4" }],
    ["circle", { cx: "20", cy: "19", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-lock.mjs
  var UserLock = [
    ["path", { d: "M19 16v-2a2 2 0 0 0-4 0v2" }],
    ["path", { d: "M9.5 15H7a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: "10", cy: "7", r: "4" }],
    ["rect", { x: "13", y: "16", width: "8", height: "5", rx: ".899" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-minus.mjs
  var UserMinus = [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: "9", cy: "7", r: "4" }],
    ["line", { x1: "22", x2: "16", y1: "11", y2: "11" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-pen.mjs
  var UserPen = [
    ["path", { d: "M11.5 15H7a4 4 0 0 0-4 4v2" }],
    [
      "path",
      {
        d: "M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
      }
    ],
    ["circle", { cx: "10", cy: "7", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-plus.mjs
  var UserPlus = [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: "9", cy: "7", r: "4" }],
    ["line", { x1: "19", x2: "19", y1: "8", y2: "14" }],
    ["line", { x1: "22", x2: "16", y1: "11", y2: "11" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-arrow-left.mjs
  var UserRoundArrowLeft = [
    ["path", { d: "m19 16-3 3" }],
    ["path", { d: "M2 21a8 8 0 0 1 12.664-6.5" }],
    ["path", { d: "M22 19h-6l3 3" }],
    ["circle", { cx: "10", cy: "8", r: "5" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-check.mjs
  var UserRoundCheck = [
    ["path", { d: "M2 21a8 8 0 0 1 13.292-6" }],
    ["circle", { cx: "10", cy: "8", r: "5" }],
    ["path", { d: "m16 19 2 2 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-cog.mjs
  var UserRoundCog = [
    ["path", { d: "m14.305 19.53.923-.382" }],
    ["path", { d: "m15.228 16.852-.923-.383" }],
    ["path", { d: "m16.852 15.228-.383-.923" }],
    ["path", { d: "m16.852 20.772-.383.924" }],
    ["path", { d: "m19.148 15.228.383-.923" }],
    ["path", { d: "m19.53 21.696-.382-.924" }],
    ["path", { d: "M2 21a8 8 0 0 1 10.434-7.62" }],
    ["path", { d: "m20.772 16.852.924-.383" }],
    ["path", { d: "m20.772 19.148.924.383" }],
    ["circle", { cx: "10", cy: "8", r: "5" }],
    ["circle", { cx: "18", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-group.mjs
  var UserRoundGroup = [
    ["path", { d: "M17 21a5 5 0 00-10 0" }],
    ["path", { d: "M22 10.5a3.5 3.5 0 00-5.507-2.868" }],
    ["path", { d: "M7.507 7.632A3.5 3.5 0 002 10.5" }],
    ["circle", { cx: "12", cy: "13", r: "3" }],
    ["circle", { cx: "18.5", cy: "4.5", r: "2.5" }],
    ["circle", { cx: "5.5", cy: "4.5", r: "2.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-key.mjs
  var UserRoundKey = [
    ["path", { d: "M19 11v6" }],
    ["path", { d: "M19 13h2" }],
    ["path", { d: "M2 21a8 8 0 0 1 12.868-6.349" }],
    ["circle", { cx: "10", cy: "8", r: "5" }],
    ["circle", { cx: "19", cy: "19", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-minus.mjs
  var UserRoundMinus = [
    ["path", { d: "M2 21a8 8 0 0 1 13.292-6" }],
    ["circle", { cx: "10", cy: "8", r: "5" }],
    ["path", { d: "M22 19h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-pen.mjs
  var UserRoundPen = [
    ["path", { d: "M2 21a8 8 0 0 1 10.821-7.487" }],
    [
      "path",
      {
        d: "M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
      }
    ],
    ["circle", { cx: "10", cy: "8", r: "5" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-plus.mjs
  var UserRoundPlus = [
    ["path", { d: "M2 21a8 8 0 0 1 13.292-6" }],
    ["circle", { cx: "10", cy: "8", r: "5" }],
    ["path", { d: "M19 16v6" }],
    ["path", { d: "M22 19h-6" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-search.mjs
  var UserRoundSearch = [
    ["circle", { cx: "10", cy: "8", r: "5" }],
    ["path", { d: "M2 21a8 8 0 0 1 10.434-7.62" }],
    ["circle", { cx: "18", cy: "18", r: "3" }],
    ["path", { d: "m22 22-1.9-1.9" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-shield.mjs
  var UserRoundShield = [
    ["path", { d: "M2 21a8 8 0 0 1 8-8 5 5 0 1 1 4.845-3.759" }],
    [
      "path",
      {
        d: "M22 17.5c0 2.5-1.75 3.75-3.83 4.474a.5.5 0 0 1-.335-.005C15.75 21.25 14 20 14 17.5V14a.5.5 0 0 1 .5-.499c1 0 2.25-.6 3.12-1.36a.6.6 0 0 1 .76-.001c.875.765 2.12 1.36 3.12 1.36a.5.5 0 0 1 .5.5z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-star.mjs
  var UserRoundStar = [
    [
      "path",
      {
        d: "M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.867l-1.156-1.152a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"
      }
    ],
    ["path", { d: "M2 21a8 8 0 0 1 6.778-7.905" }],
    ["path", { d: "M8.927 12.885a5 5 0 1 1 6.061-4.535" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round-x.mjs
  var UserRoundX = [
    ["path", { d: "m16.5 16.5 5 5" }],
    ["path", { d: "M2 21a8 8 0 0 1 11.531-7.18" }],
    ["path", { d: "m21.5 16.5-5 5" }],
    ["circle", { cx: "10", cy: "8", r: "5" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-search.mjs
  var UserSearch = [
    ["circle", { cx: "10", cy: "7", r: "4" }],
    ["path", { d: "M10.3 15H7a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: "17", cy: "17", r: "3" }],
    ["path", { d: "m21 21-1.9-1.9" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-round.mjs
  var UserRound = [
    ["circle", { cx: "12", cy: "8", r: "5" }],
    ["path", { d: "M20 21a8 8 0 0 0-16 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-shield.mjs
  var UserShield = [
    ["path", { d: "M10 15H6a4 4 0 0 0-4 4v2" }],
    [
      "path",
      {
        d: "M22 17.5c0 2.499-1.75 3.749-3.83 4.474a.5.5 0 0 1-.335-.005c-2.085-.72-3.835-1.97-3.835-4.47V14a.5.5 0 0 1 .5-.499c1 0 2.25-.6 3.12-1.36a.6.6 0 0 1 .76-.001c.875.765 2.12 1.36 3.12 1.36a.5.5 0 0 1 .5.5z"
      }
    ],
    ["circle", { cx: "9", cy: "7", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-star.mjs
  var UserStar = [
    [
      "path",
      {
        d: "M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"
      }
    ],
    ["path", { d: "M8 15H7a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: "10", cy: "7", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/user.mjs
  var User = [
    ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: "12", cy: "7", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/user-x.mjs
  var UserX = [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: "9", cy: "7", r: "4" }],
    ["line", { x1: "17", x2: "22", y1: "8", y2: "13" }],
    ["line", { x1: "22", x2: "17", y1: "8", y2: "13" }]
  ];

  // node_modules/lucide/dist/esm/icons/users-collaboration.mjs
  var UsersCollaboration = [
    ["path", { d: "M12.925 3.047a9 9 0 017.616 6.11" }],
    ["path", { d: "M13 22a2 2 0 012-2h4a2 2 0 012 2" }],
    ["path", { d: "M3 12a2 2 0 012-2h4a2 2 0 012 2" }],
    ["path", { d: "M3.889 15.9a9 9 0 005.247 4.632" }],
    ["circle", { cx: "17", cy: "14", r: "2" }],
    ["circle", { cx: "7", cy: "4", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/users-round-collaboration.mjs
  var UsersRoundCollaboration = [
    ["path", { d: "M20.453 8.911a9 9 0 00-6.696-5.738" }],
    ["path", { d: "M21 22a4 4 0 00-8 0" }],
    ["path", { d: "M3 12a4 4 0 017.963-.543" }],
    ["path", { d: "M3.889 15.9a9 9 0 005.247 4.632" }],
    ["circle", { cx: "17", cy: "15", r: "3" }],
    ["circle", { cx: "7", cy: "5", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/users-round.mjs
  var UsersRound = [
    ["path", { d: "M18 21a8 8 0 0 0-16 0" }],
    ["circle", { cx: "10", cy: "8", r: "5" }],
    ["path", { d: "M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" }]
  ];

  // node_modules/lucide/dist/esm/icons/users.mjs
  var Users = [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["circle", { cx: "9", cy: "7", r: "4" }]
  ];

  // node_modules/lucide/dist/esm/icons/utensils-crossed.mjs
  var UtensilsCrossed = [
    ["path", { d: "m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" }],
    ["path", { d: "M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" }],
    ["path", { d: "m2.1 21.8 6.4-6.3" }],
    ["path", { d: "m19 5-7 7" }]
  ];

  // node_modules/lucide/dist/esm/icons/utensils.mjs
  var Utensils = [
    ["path", { d: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" }],
    ["path", { d: "M7 2v20" }],
    ["path", { d: "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" }]
  ];

  // node_modules/lucide/dist/esm/icons/utility-pole.mjs
  var UtilityPole = [
    ["path", { d: "M12 2v20" }],
    ["path", { d: "M2 5h20" }],
    ["path", { d: "M3 3v2" }],
    ["path", { d: "M7 3v2" }],
    ["path", { d: "M17 3v2" }],
    ["path", { d: "M21 3v2" }],
    ["path", { d: "m19 5-7 7-7-7" }]
  ];

  // node_modules/lucide/dist/esm/icons/van.mjs
  var Van = [
    [
      "path",
      {
        d: "M13 6v5a1 1 0 0 0 1 1h6.102a1 1 0 0 1 .712.298l.898.91a1 1 0 0 1 .288.702V17a1 1 0 0 1-1 1h-3"
      }
    ],
    ["path", { d: "M5 18H3a1 1 0 0 1-1-1V8a2 2 0 0 1 2-2h12c1.1 0 2.1.8 2.4 1.8l1.176 4.2" }],
    ["path", { d: "M9 18h5" }],
    ["circle", { cx: "16", cy: "18", r: "2" }],
    ["circle", { cx: "7", cy: "18", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/variable.mjs
  var Variable = [
    ["path", { d: "M8 21s-4-3-4-9 4-9 4-9" }],
    ["path", { d: "M16 3s4 3 4 9-4 9-4 9" }],
    ["line", { x1: "15", x2: "9", y1: "9", y2: "15" }],
    ["line", { x1: "9", x2: "15", y1: "9", y2: "15" }]
  ];

  // node_modules/lucide/dist/esm/icons/vault.mjs
  var Vault = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor" }],
    ["path", { d: "m7.9 7.9 2.7 2.7" }],
    ["circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor" }],
    ["path", { d: "m13.4 10.6 2.7-2.7" }],
    ["circle", { cx: "7.5", cy: "16.5", r: ".5", fill: "currentColor" }],
    ["path", { d: "m7.9 16.1 2.7-2.7" }],
    ["circle", { cx: "16.5", cy: "16.5", r: ".5", fill: "currentColor" }],
    ["path", { d: "m13.4 13.4 2.7 2.7" }],
    ["circle", { cx: "12", cy: "12", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/vector-polygon.mjs
  var VectorPolygon = [
    ["path", { d: "m12.828 4.813 5.344 2.375" }],
    ["path", { d: "m15.769 18.153 3.461-8.306" }],
    ["path", { d: "m5.687 14.074 7.625 4.852" }],
    ["path", { d: "M9.772 5.579 5.228 11.42" }],
    ["circle", { cx: "11", cy: "4", r: "2" }],
    ["circle", { cx: "15", cy: "20", r: "2" }],
    ["circle", { cx: "20", cy: "8", r: "2" }],
    ["circle", { cx: "4", cy: "13", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/vector-square.mjs
  var VectorSquare = [
    ["path", { d: "M17.055 4.533a24 24 0 00-10.11 0" }],
    ["path", { d: "M19.467 17.055a24 24 0 000-10.11" }],
    ["path", { d: "M4.533 6.945a24 24 0 000 10.11" }],
    ["path", { d: "M6.945 19.467a24 24 0 0010.11 0" }],
    ["circle", { cx: "19", cy: "19", r: "2" }],
    ["circle", { cx: "19", cy: "5", r: "2" }],
    ["circle", { cx: "5", cy: "19", r: "2" }],
    ["circle", { cx: "5", cy: "5", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/vegan.mjs
  var Vegan = [
    ["path", { d: "M16 8q6 0 6-6-6 0-6 6" }],
    ["path", { d: "M17.41 3.59a10 10 0 1 0 3 3" }],
    ["path", { d: "M2 2a26.6 26.6 0 0 1 10 20c.9-6.82 1.5-9.5 4-14" }]
  ];

  // node_modules/lucide/dist/esm/icons/venetian-mask.mjs
  var VenetianMask = [
    ["path", { d: "M18 11c-1.5 0-2.5.5-3 2" }],
    [
      "path",
      {
        d: "M4 6a2 2 0 0 0-2 2v4a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V8a2 2 0 0 0-2-2h-3a8 8 0 0 0-5 2 8 8 0 0 0-5-2z"
      }
    ],
    ["path", { d: "M6 11c1.5 0 2.5.5 3 2" }]
  ];

  // node_modules/lucide/dist/esm/icons/venus-and-mars.mjs
  var VenusAndMars = [
    ["path", { d: "M10 20h4" }],
    ["path", { d: "M12 16v6" }],
    ["path", { d: "M17 2h4v4" }],
    ["path", { d: "m21 2-5.46 5.46" }],
    ["circle", { cx: "12", cy: "11", r: "5" }]
  ];

  // node_modules/lucide/dist/esm/icons/venus.mjs
  var Venus = [
    ["path", { d: "M12 15v7" }],
    ["path", { d: "M9 19h6" }],
    ["circle", { cx: "12", cy: "9", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/vibrate-off.mjs
  var VibrateOff = [
    ["path", { d: "m2 8 2 2-2 2 2 2-2 2" }],
    ["path", { d: "m22 8-2 2 2 2-2 2 2 2" }],
    ["path", { d: "M8 8v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2" }],
    ["path", { d: "M16 10.34V6c0-.55-.45-1-1-1h-4.34" }],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
  ];

  // node_modules/lucide/dist/esm/icons/vibrate.mjs
  var Vibrate = [
    ["path", { d: "m2 8 2 2-2 2 2 2-2 2" }],
    ["path", { d: "m22 8-2 2 2 2-2 2 2 2" }],
    ["rect", { width: "8", height: "14", x: "8", y: "5", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/video-off.mjs
  var VideoOff = [
    ["path", { d: "M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196" }],
    ["path", { d: "M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/video.mjs
  var Video = [
    ["path", { d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" }],
    ["rect", { x: "2", y: "6", width: "14", height: "12", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/videotape.mjs
  var Videotape = [
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
    ["path", { d: "M2 8h20" }],
    ["circle", { cx: "8", cy: "14", r: "2" }],
    ["path", { d: "M8 12h8" }],
    ["circle", { cx: "16", cy: "14", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/view.mjs
  var View = [
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" }],
    ["path", { d: "M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" }],
    ["circle", { cx: "12", cy: "12", r: "1" }],
    [
      "path",
      {
        d: "M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/virus-off.mjs
  var VirusOff = [
    ["path", { d: "M10.01 10h.01" }],
    ["path", { d: "M12 14.991h.01" }],
    ["path", { d: "M12 22v-3" }],
    ["path", { d: "M12 2v3" }],
    ["path", { d: "M13 22h-2" }],
    ["path", { d: "M13 2h-2" }],
    ["path", { d: "m16.5 19.794-1-1.733" }],
    ["path", { d: "m16.5 4.205-1 1.732" }],
    ["path", { d: "M18.891 13.235a7 7 0 00-8.126-8.126" }],
    ["path", { d: "m19.794 7.5-1.732 1" }],
    ["path", { d: "M2 12h3" }],
    ["path", { d: "M2 13v-2" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M22 12h-3" }],
    ["path", { d: "M22 13v-2" }],
    ["path", { d: "m4.206 16.5 1.732-1" }],
    ["path", { d: "m4.206 7.5 1.732 1" }],
    ["path", { d: "M7.05 7.05a7 7 0 009.9 9.9" }],
    ["path", { d: "m7.5 19.794 1-1.733" }],
    ["path", { d: "M9 12h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/virus.mjs
  var Virus = [
    ["path", { d: "M12 14.991h.01" }],
    ["path", { d: "M12 22v-3" }],
    ["path", { d: "M12 2v3" }],
    ["path", { d: "M13 22h-2" }],
    ["path", { d: "M13 2h-2" }],
    ["path", { d: "M13.99 10H14" }],
    ["path", { d: "m16.5 19.794-1-1.733" }],
    ["path", { d: "m16.5 4.205-1 1.732" }],
    ["path", { d: "m19.794 16.5-1.732-1" }],
    ["path", { d: "m19.794 7.5-1.732 1" }],
    ["path", { d: "M2 12h3" }],
    ["path", { d: "M2 13v-2" }],
    ["path", { d: "M22 12h-3" }],
    ["path", { d: "M22 13v-2" }],
    ["path", { d: "m4.206 16.5 1.732-1" }],
    ["path", { d: "m4.206 7.5 1.732 1" }],
    ["path", { d: "m7.5 19.794 1-1.733" }],
    ["path", { d: "m7.5 4.205 1 1.732" }],
    ["path", { d: "M9 12h.01" }],
    ["circle", { cx: "12", cy: "12", r: "7" }]
  ];

  // node_modules/lucide/dist/esm/icons/volleyball.mjs
  var Volleyball = [
    ["path", { d: "M11 7a16 16 20 0 1 10.98 4.362" }],
    ["path", { d: "M12 12a13 13 0 0 1-8.66 5" }],
    ["path", { d: "M16.83 13.634a16 16 0 0 1-9.267 7.328" }],
    ["path", { d: "M20.66 17A13 13 0 0 0 12 12a13 13 0 0 1 0-10" }],
    ["path", { d: "M8.17 15.366a16 16 0 0 1-1.713-11.69" }],
    ["circle", { cx: "12", cy: "12", r: "10" }]
  ];

  // node_modules/lucide/dist/esm/icons/voicemail.mjs
  var Voicemail = [
    ["circle", { cx: "6", cy: "12", r: "4" }],
    ["circle", { cx: "18", cy: "12", r: "4" }],
    ["line", { x1: "6", x2: "18", y1: "16", y2: "16" }]
  ];

  // node_modules/lucide/dist/esm/icons/volume-1.mjs
  var Volume1 = [
    [
      "path",
      {
        d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
      }
    ],
    ["path", { d: "M16 9a5 5 0 0 1 0 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/volume-2.mjs
  var Volume2 = [
    [
      "path",
      {
        d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
      }
    ],
    ["path", { d: "M16 9a5 5 0 0 1 0 6" }],
    ["path", { d: "M19.364 18.364a9 9 0 0 0 0-12.728" }]
  ];

  // node_modules/lucide/dist/esm/icons/volume-off.mjs
  var VolumeOff = [
    ["path", { d: "M16 9a5 5 0 0 1 .95 2.293" }],
    ["path", { d: "M19.364 5.636a9 9 0 0 1 1.889 9.96" }],
    ["path", { d: "m2 2 20 20" }],
    [
      "path",
      {
        d: "m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11"
      }
    ],
    ["path", { d: "M9.828 4.172A.686.686 0 0 1 11 4.657v.686" }]
  ];

  // node_modules/lucide/dist/esm/icons/volume-x.mjs
  var VolumeX = [
    [
      "path",
      {
        d: "M11 4.702a.7.7 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.7.7 0 0 0 11 19.298z"
      }
    ],
    ["path", { d: "m16.5 14.5 5-5" }],
    ["path", { d: "m16.5 9.5 5 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/volume.mjs
  var Volume = [
    [
      "path",
      {
        d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/vote.mjs
  var Vote = [
    ["path", { d: "m9 12 2 2 4-4" }],
    ["path", { d: "M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" }],
    ["path", { d: "M22 19H2" }]
  ];

  // node_modules/lucide/dist/esm/icons/wallet-cards.mjs
  var WalletCards = [
    ["path", { d: "M3 11h3.75a2 2 0 0 1 1.6.8l.45.6a4 4 0 0 0 6.4 0l.45-.6a2 2 0 0 1 1.6-.8H21" }],
    ["path", { d: "M3 7h18" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/wallet-minimal.mjs
  var WalletMinimal = [
    ["path", { d: "M17 14h.01" }],
    ["path", { d: "M7 7h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14" }]
  ];

  // node_modules/lucide/dist/esm/icons/wallet.mjs
  var Wallet = [
    [
      "path",
      {
        d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"
      }
    ],
    ["path", { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/wallpaper.mjs
  var Wallpaper = [
    ["path", { d: "M12 17v4" }],
    ["path", { d: "M8 21h8" }],
    ["path", { d: "m9 17 6.1-6.1a2 2 0 0 1 2.81.01L22 15" }],
    ["circle", { cx: "8", cy: "9", r: "2" }],
    ["rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/wand-sparkles.mjs
  var WandSparkles = [
    [
      "path",
      {
        d: "m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"
      }
    ],
    ["path", { d: "m14 7 3 3" }],
    ["path", { d: "M5 6v4" }],
    ["path", { d: "M19 14v4" }],
    ["path", { d: "M10 2v2" }],
    ["path", { d: "M7 8H3" }],
    ["path", { d: "M21 16h-4" }],
    ["path", { d: "M11 3H9" }]
  ];

  // node_modules/lucide/dist/esm/icons/wand.mjs
  var Wand = [
    ["path", { d: "M15 4V2" }],
    ["path", { d: "M15 16v-2" }],
    ["path", { d: "M8 9h2" }],
    ["path", { d: "M20 9h2" }],
    ["path", { d: "M17.8 11.8 19 13" }],
    ["path", { d: "M15 9h.01" }],
    ["path", { d: "M17.8 6.2 19 5" }],
    ["path", { d: "m3 21 9-9" }],
    ["path", { d: "M12.2 6.2 11 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/warehouse.mjs
  var Warehouse = [
    ["path", { d: "M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11" }],
    [
      "path",
      {
        d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z"
      }
    ],
    ["path", { d: "M6 13h12" }],
    ["path", { d: "M6 17h12" }]
  ];

  // node_modules/lucide/dist/esm/icons/watch.mjs
  var Watch = [
    ["path", { d: "M12 10v2.2l1.6 1" }],
    ["path", { d: "m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05" }],
    ["path", { d: "m7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05" }],
    ["circle", { cx: "12", cy: "12", r: "6" }]
  ];

  // node_modules/lucide/dist/esm/icons/washing-machine.mjs
  var WashingMachine = [
    ["path", { d: "M3 6h3" }],
    ["path", { d: "M17 6h.01" }],
    ["rect", { width: "18", height: "20", x: "3", y: "2", rx: "2" }],
    ["circle", { cx: "12", cy: "13", r: "5" }],
    ["path", { d: "M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5" }]
  ];

  // node_modules/lucide/dist/esm/icons/waves-arrow-down.mjs
  var WavesArrowDown = [
    ["path", { d: "M12 10L12 2" }],
    ["path", { d: "M16 6L12 10L8 6" }],
    [
      "path",
      {
        d: "M2 15C2.6 15.5 3.2 16 4.5 16C7 16 7 14 9.5 14C12.1 14 11.9 16 14.5 16C17 16 17 14 19.5 14C20.8 14 21.4 14.5 22 15"
      }
    ],
    [
      "path",
      {
        d: "M2 21C2.6 21.5 3.2 22 4.5 22C7 22 7 20 9.5 20C12.1 20 11.9 22 14.5 22C17 22 17 20 19.5 20C20.8 20 21.4 20.5 22 21"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/waves-arrow-up.mjs
  var WavesArrowUp = [
    ["path", { d: "M12 2v8" }],
    [
      "path",
      {
        d: "M2 15c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
      }
    ],
    [
      "path",
      {
        d: "M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
      }
    ],
    ["path", { d: "m8 6 4-4 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/waves-ladder.mjs
  var WavesLadder = [
    ["path", { d: "M19 5a2 2 0 0 0-2 2v11" }],
    [
      "path",
      {
        d: "M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
      }
    ],
    ["path", { d: "M7 13h10" }],
    ["path", { d: "M7 9h10" }],
    ["path", { d: "M9 5a2 2 0 0 0-2 2v11" }]
  ];

  // node_modules/lucide/dist/esm/icons/waves-horizontal.mjs
  var WavesHorizontal = [
    ["path", { d: "M2 12q2.5 2 5 0t5 0 5 0 5 0" }],
    ["path", { d: "M2 19q2.5 2 5 0t5 0 5 0 5 0" }],
    ["path", { d: "M2 5q2.5 2 5 0t5 0 5 0 5 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/waves-vertical.mjs
  var WavesVertical = [
    ["path", { d: "M12 2q2 2.5 0 5t0 5 0 5 0 5" }],
    ["path", { d: "M19 2q2 2.5 0 5t0 5 0 5 0 5" }],
    ["path", { d: "M5 2q2 2.5 0 5t0 5 0 5 0 5" }]
  ];

  // node_modules/lucide/dist/esm/icons/waypoints.mjs
  var Waypoints = [
    ["path", { d: "m10.586 5.414-5.172 5.172" }],
    ["path", { d: "m18.586 13.414-5.172 5.172" }],
    ["path", { d: "M6 12h12" }],
    ["circle", { cx: "12", cy: "20", r: "2" }],
    ["circle", { cx: "12", cy: "4", r: "2" }],
    ["circle", { cx: "20", cy: "12", r: "2" }],
    ["circle", { cx: "4", cy: "12", r: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/webcam.mjs
  var Webcam = [
    ["circle", { cx: "12", cy: "10", r: "8" }],
    ["circle", { cx: "12", cy: "10", r: "3" }],
    ["path", { d: "M7 22h10" }],
    ["path", { d: "M12 22v-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/webcam-off.mjs
  var WebcamOff = [
    ["path", { d: "M12 22v-4" }],
    ["path", { d: "M12.754 7.096a3 3 0 0 1 2.15 2.15" }],
    ["path", { d: "M12.863 12.873a3 3 0 0 1-3.736-3.735" }],
    ["path", { d: "M16.566 16.57A8 8 0 0 1 5.43 5.433" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M7 22h10" }],
    ["path", { d: "M8.478 2.817a8 8 0 0 1 10.705 10.705" }]
  ];

  // node_modules/lucide/dist/esm/icons/webhook-off.mjs
  var WebhookOff = [
    ["path", { d: "M17 17h-5c-1.09-.02-1.94.92-2.5 1.9A3 3 0 1 1 2.57 15" }],
    ["path", { d: "M9 3.4a4 4 0 0 1 6.52.66" }],
    ["path", { d: "m6 17 3.1-5.8a2.5 2.5 0 0 0 .057-2.05" }],
    ["path", { d: "M20.3 20.3a4 4 0 0 1-2.3.7" }],
    ["path", { d: "M18.6 13a4 4 0 0 1 3.357 3.414" }],
    ["path", { d: "m12 6 .6 1" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/webhook.mjs
  var Webhook = [
    ["path", { d: "M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" }],
    ["path", { d: "m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" }],
    ["path", { d: "m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8" }]
  ];

  // node_modules/lucide/dist/esm/icons/weight-tilde.mjs
  var WeightTilde = [
    [
      "path",
      {
        d: "M6.5 8a2 2 0 0 0-1.906 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8z"
      }
    ],
    ["path", { d: "M7.999 15a2.5 2.5 0 0 1 4 0 2.5 2.5 0 0 0 4 0" }],
    ["circle", { cx: "12", cy: "5", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/weight.mjs
  var Weight = [
    ["circle", { cx: "12", cy: "5", r: "3" }],
    [
      "path",
      {
        d: "M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/wheat.mjs
  var Wheat = [
    ["path", { d: "M2 22 16 8" }],
    [
      "path",
      { d: "M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" }
    ],
    [
      "path",
      { d: "M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" }
    ],
    [
      "path",
      { d: "M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" }
    ],
    ["path", { d: "M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" }],
    [
      "path",
      {
        d: "M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"
      }
    ],
    [
      "path",
      {
        d: "M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"
      }
    ],
    [
      "path",
      {
        d: "M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/wheat-off.mjs
  var WheatOff = [
    ["path", { d: "m2 22 10-10" }],
    ["path", { d: "m16 8-1.17 1.17" }],
    [
      "path",
      { d: "M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" }
    ],
    ["path", { d: "m8 8-.53.53a3.5 3.5 0 0 0 0 4.94L9 15l1.53-1.53c.55-.55.88-1.25.98-1.97" }],
    ["path", { d: "M10.91 5.26c.15-.26.34-.51.56-.73L13 3l1.53 1.53a3.5 3.5 0 0 1 .28 4.62" }],
    ["path", { d: "M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" }],
    [
      "path",
      {
        d: "M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"
      }
    ],
    ["path", { d: "m16 16-.53.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.49 3.49 0 0 1 1.97-.98" }],
    ["path", { d: "M18.74 13.09c.26-.15.51-.34.73-.56L21 11l-1.53-1.53a3.5 3.5 0 0 0-4.62-.28" }],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
  ];

  // node_modules/lucide/dist/esm/icons/whistle.mjs
  var Whistle = [
    ["path", { d: "M10 6v4" }],
    ["path", { d: "M21 6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.675A7 7 0 1 1 9 6z" }]
  ];

  // node_modules/lucide/dist/esm/icons/whole-word.mjs
  var WholeWord = [
    ["circle", { cx: "7", cy: "12", r: "3" }],
    ["path", { d: "M10 9v6" }],
    ["circle", { cx: "17", cy: "12", r: "3" }],
    ["path", { d: "M14 7v8" }],
    ["path", { d: "M22 17v1c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1" }]
  ];

  // node_modules/lucide/dist/esm/icons/wifi-cog.mjs
  var WifiCog = [
    ["path", { d: "m14.305 19.53.923-.382" }],
    ["path", { d: "m15.228 16.852-.923-.383" }],
    ["path", { d: "m16.852 15.228-.383-.923" }],
    ["path", { d: "m16.852 20.772-.383.924" }],
    ["path", { d: "m19.148 15.228.383-.923" }],
    ["path", { d: "m19.53 21.696-.382-.924" }],
    ["path", { d: "M2 8.82a15 15 0 0120 0" }],
    ["path", { d: "m20.772 16.852.924-.383" }],
    ["path", { d: "m20.772 19.148.924.383" }],
    ["path", { d: "M5 12.859a10 10 0 0110.18-2.342" }],
    ["path", { d: "M8.5 16.429a5 5 0 011.998-1.2" }],
    ["circle", { cx: "18", cy: "18", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/wifi-lock.mjs
  var WifiLock = [
    ["path", { d: "M2 8.82a15 15 0 0120 0" }],
    ["path", { d: "M20 16v-2a2 2 0 00-4 0v2" }],
    ["path", { d: "M5 12.859a10 10 0 018.436-2.756" }],
    ["path", { d: "M8.5 16.429a5 5 0 011.794-1.13" }],
    ["rect", { x: "14", y: "16", width: "8", height: "5", rx: "1" }]
  ];

  // node_modules/lucide/dist/esm/icons/wifi-high.mjs
  var WifiHigh = [
    ["path", { d: "M12 20h.01" }],
    ["path", { d: "M5 12.859a10 10 0 0 1 14 0" }],
    ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/wifi-low.mjs
  var WifiLow = [
    ["path", { d: "M12 20h.01" }],
    ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/wifi-off.mjs
  var WifiOff = [
    ["path", { d: "M12 20h.01" }],
    ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0" }],
    ["path", { d: "M5 12.859a10 10 0 0 1 5.17-2.69" }],
    ["path", { d: "M19 12.859a10 10 0 0 0-2.007-1.523" }],
    ["path", { d: "M2 8.82a15 15 0 0 1 4.177-2.643" }],
    ["path", { d: "M22 8.82a15 15 0 0 0-11.288-3.764" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/wifi-pen.mjs
  var WifiPen = [
    ["path", { d: "M2 8.82a15 15 0 0 1 20 0" }],
    [
      "path",
      {
        d: "M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
      }
    ],
    ["path", { d: "M5 12.859a10 10 0 0 1 10.5-2.222" }],
    ["path", { d: "M8.5 16.429a5 5 0 0 1 3-1.406" }]
  ];

  // node_modules/lucide/dist/esm/icons/wifi-sync.mjs
  var WifiSync = [
    ["path", { d: "M11.965 10.105v4L13.5 12.5a5 5 0 0 1 8 1.5" }],
    ["path", { d: "M11.965 14.105h4" }],
    ["path", { d: "M17.965 18.105h4L20.43 19.71a5 5 0 0 1-8-1.5" }],
    ["path", { d: "M2 8.82a15 15 0 0 1 20 0" }],
    ["path", { d: "M21.965 22.105v-4" }],
    ["path", { d: "M5 12.86a10 10 0 0 1 3-2.032" }],
    ["path", { d: "M8.5 16.429h.01" }]
  ];

  // node_modules/lucide/dist/esm/icons/wifi-zero.mjs
  var WifiZero = [["path", { d: "M12 20h.01" }]];

  // node_modules/lucide/dist/esm/icons/wifi.mjs
  var Wifi = [
    ["path", { d: "M12 20h.01" }],
    ["path", { d: "M2 8.82a15 15 0 0 1 20 0" }],
    ["path", { d: "M5 12.859a10 10 0 0 1 14 0" }],
    ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0" }]
  ];

  // node_modules/lucide/dist/esm/icons/wind-arrow-down.mjs
  var WindArrowDown = [
    ["path", { d: "M10 2v8" }],
    ["path", { d: "M12.8 21.6A2 2 0 1 0 14 18H2" }],
    ["path", { d: "M17.5 10a2.5 2.5 0 1 1 2 4H2" }],
    ["path", { d: "m6 6 4 4 4-4" }]
  ];

  // node_modules/lucide/dist/esm/icons/wind-arrow-up.mjs
  var WindArrowUp = [
    ["path", { d: "M10 2v8" }],
    ["path", { d: "M12.8 21.6A2 2 0 1 0 14 18H2" }],
    ["path", { d: "M17.5 10a2.5 2.5 0 1 1 2 4H2" }],
    ["path", { d: "m6 6 4 -4 4 4" }]
  ];

  // node_modules/lucide/dist/esm/icons/wind.mjs
  var Wind = [
    ["path", { d: "M12.8 19.6A2 2 0 1 0 14 16H2" }],
    ["path", { d: "M17.5 8a2.5 2.5 0 1 1 2 4H2" }],
    ["path", { d: "M9.8 4.4A2 2 0 1 1 11 8H2" }]
  ];

  // node_modules/lucide/dist/esm/icons/wine-off.mjs
  var WineOff = [
    ["path", { d: "M8 22h8" }],
    ["path", { d: "M7 10h3m7 0h-1.343" }],
    ["path", { d: "M12 15v7" }],
    [
      "path",
      {
        d: "M7.307 7.307A12.33 12.33 0 0 0 7 10a5 5 0 0 0 7.391 4.391M8.638 2.981C8.75 2.668 8.872 2.34 9 2h6c1.5 4 2 6 2 8 0 .407-.05.809-.145 1.198"
      }
    ],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
  ];

  // node_modules/lucide/dist/esm/icons/wine.mjs
  var Wine = [
    ["path", { d: "M8 22h8" }],
    ["path", { d: "M7 10h10" }],
    ["path", { d: "M12 15v7" }],
    ["path", { d: "M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" }]
  ];

  // node_modules/lucide/dist/esm/icons/worm.mjs
  var Worm = [
    ["path", { d: "m19 12-1.5 3" }],
    ["path", { d: "M19.63 18.81 22 20" }],
    [
      "path",
      {
        d: "M6.47 8.23a1.68 1.68 0 0 1 2.44 1.93l-.64 2.08a6.76 6.76 0 0 0 10.16 7.67l.42-.27a1 1 0 1 0-2.73-4.21l-.42.27a1.76 1.76 0 0 1-2.63-1.99l.64-2.08A6.66 6.66 0 0 0 3.94 3.9l-.7.4a1 1 0 1 0 2.55 4.34z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/workflow.mjs
  var Workflow = [
    ["rect", { width: "8", height: "8", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M7 11v4a2 2 0 0 0 2 2h4" }],
    ["rect", { width: "8", height: "8", x: "13", y: "13", rx: "2" }]
  ];

  // node_modules/lucide/dist/esm/icons/wrench-off.mjs
  var WrenchOff = [
    [
      "path",
      {
        d: "M10.747 5.093a6 6 0 0 1 6.841-2.882c.438.12.54.662.219.984L14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-2.882 6.842"
      }
    ],
    ["path", { d: "m13.5 13.5-7.88 7.88a1 1 0 0 1-2.999-3l7.88-7.88" }],
    ["path", { d: "m2 2 20 20" }]
  ];

  // node_modules/lucide/dist/esm/icons/wrench.mjs
  var Wrench = [
    [
      "path",
      {
        d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/x-line-top.mjs
  var XLineTop = [
    ["path", { d: "M18 4H6" }],
    ["path", { d: "M18 8 6 20" }],
    ["path", { d: "m6 8 12 12" }]
  ];

  // node_modules/lucide/dist/esm/icons/x.mjs
  var X = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];

  // node_modules/lucide/dist/esm/icons/zap-off.mjs
  var ZapOff = [
    ["path", { d: "M10.768 5.111 13.44 2.44a1.5 1.5 0 012.474 1.561l-1.633 4.625" }],
    ["path", { d: "m18.889 13.232.672-.672A1.5 1.5 0 0018.5 10h-2.844" }],
    ["path", { d: "m2 2 20 20" }],
    [
      "path",
      {
        d: "m7.94 7.94-3.5 3.499A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l5.5-5.5"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/zap.mjs
  var Zap = [
    [
      "path",
      {
        d: "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-aquarius.mjs
  var ZodiacAquarius = [
    [
      "path",
      {
        d: "m2 10 2.456-3.684a.7.7 0 0 1 1.106-.013l2.39 3.413a.7.7 0 0 0 1.096-.001l2.402-3.432a.7.7 0 0 1 1.098 0l2.402 3.432a.7.7 0 0 0 1.098 0l2.389-3.413a.7.7 0 0 1 1.106.013L22 10"
      }
    ],
    [
      "path",
      {
        d: "m2 18.002 2.456-3.684a.7.7 0 0 1 1.106-.013l2.39 3.413a.7.7 0 0 0 1.097 0l2.402-3.432a.7.7 0 0 1 1.098 0l2.402 3.432a.7.7 0 0 0 1.098 0l2.389-3.413a.7.7 0 0 1 1.106.013L22 18.002"
      }
    ]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-aries.mjs
  var ZodiacAries = [
    ["path", { d: "M12 7.5a4.5 4.5 0 1 1 5 4.5" }],
    ["path", { d: "M7 12a4.5 4.5 0 1 1 5-4.5V21" }]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-cancer.mjs
  var ZodiacCancer = [
    ["path", { d: "M21 14.5A9 6.5 0 0 1 5.5 19" }],
    ["path", { d: "M3 9.5A9 6.5 0 0 1 18.5 5" }],
    ["circle", { cx: "17.5", cy: "14.5", r: "3.5" }],
    ["circle", { cx: "6.5", cy: "9.5", r: "3.5" }]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-capricorn.mjs
  var ZodiacCapricorn = [
    ["path", { d: "M11 21a3 3 0 0 0 3-3V6.5a1 1 0 0 0-7 0" }],
    ["path", { d: "M7 19V6a3 3 0 0 0-3-3h0" }],
    ["circle", { cx: "17", cy: "17", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-gemini.mjs
  var ZodiacGemini = [
    ["path", { d: "M16 4.525v14.948" }],
    ["path", { d: "M20 3A17 17 0 0 1 4 3" }],
    ["path", { d: "M4 21a17 17 0 0 1 16 0" }],
    ["path", { d: "M8 4.525v14.948" }]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-leo.mjs
  var ZodiacLeo = [
    ["path", { d: "M10 16c0-4-3-4.5-3-8a5 5 0 0 1 10 0c0 3.466-3 6.196-3 10a3 3 0 0 0 6 0" }],
    ["circle", { cx: "7", cy: "16", r: "3" }]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-libra.mjs
  var ZodiacLibra = [
    [
      "path",
      { d: "M3 16h6.857c.162-.012.19-.323.038-.38a6 6 0 1 1 4.212 0c-.153.057-.125.368.038.38H21" }
    ],
    ["path", { d: "M3 20h18" }]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-ophiuchus.mjs
  var ZodiacOphiuchus = [
    ["path", { d: "M3 10A6.06 6.06 0 0 1 12 10 A6.06 6.06 0 0 0 21 10" }],
    ["path", { d: "M6 3v12a6 6 0 0 0 12 0V3" }]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-pisces.mjs
  var ZodiacPisces = [
    ["path", { d: "M19 21a15 15 0 0 1 0-18" }],
    ["path", { d: "M20 12H4" }],
    ["path", { d: "M5 3a15 15 0 0 1 0 18" }]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-sagittarius.mjs
  var ZodiacSagittarius = [
    ["path", { d: "M15 3h6v6" }],
    ["path", { d: "M21 3 3 21" }],
    ["path", { d: "m9 9 6 6" }]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-scorpio.mjs
  var ZodiacScorpio = [
    ["path", { d: "M10 19V5.5a1 1 0 0 1 5 0V17a2 2 0 0 0 2 2h5l-3-3" }],
    ["path", { d: "m22 19-3 3" }],
    ["path", { d: "M5 19V5.5a1 1 0 0 1 5 0" }],
    ["path", { d: "M5 5.5A2.5 2.5 0 0 0 2.5 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-virgo.mjs
  var ZodiacVirgo = [
    ["path", { d: "M11 5.5a1 1 0 0 1 5 0V16a5 5 0 0 0 5 5" }],
    ["path", { d: "M16 11.5a1 1 0 0 1 5 0V16a5 5 0 0 1-5 5" }],
    ["path", { d: "M6 19V6a3 3 0 0 0-3-3h0" }],
    ["path", { d: "M6 5.5a1 1 0 0 1 5 0V19" }]
  ];

  // node_modules/lucide/dist/esm/icons/zodiac-taurus.mjs
  var ZodiacTaurus = [
    ["circle", { cx: "12", cy: "15", r: "6" }],
    ["path", { d: "M18 3A6 6 0 0 1 6 3" }]
  ];

  // node_modules/lucide/dist/esm/icons/zoom-in.mjs
  var ZoomIn = [
    ["circle", { cx: "11", cy: "11", r: "8" }],
    ["line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65" }],
    ["line", { x1: "11", x2: "11", y1: "8", y2: "14" }],
    ["line", { x1: "8", x2: "14", y1: "11", y2: "11" }]
  ];

  // node_modules/lucide/dist/esm/icons/zoom-out.mjs
  var ZoomOut = [
    ["circle", { cx: "11", cy: "11", r: "8" }],
    ["line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65" }],
    ["line", { x1: "8", x2: "14", y1: "11", y2: "11" }]
  ];

  // src/lib/icons.js
  function attrsToString(attrs = {}) {
    return Object.entries(attrs).filter(([key]) => key !== "key").map(([key, value]) => {
      const name = key === "strokeWidth" ? "stroke-width" : key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${name}="${String(value).replace(/"/g, "&quot;")}"`;
    }).join(" ");
  }
  function nodeToSvg(node) {
    if (!Array.isArray(node)) return "";
    const [tag, attrs, children] = node;
    const childHtml = Array.isArray(children) ? children.map(nodeToSvg).join("") : "";
    const a = attrsToString(attrs);
    return `<${tag}${a ? ` ${a}` : ""}>${childHtml}</${tag}>`;
  }
  var ALL_ICON_NAMES = Object.keys(iconsAndAliases_exports).sort();
  var FOLDER_COLORS = [
    "#e11d2e",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#14b8a6",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
    "#f43f5e",
    "#64748b",
    "#a3a3a3"
  ];
  function getIconSvg(name) {
    const iconNode = iconsAndAliases_exports[name] || iconsAndAliases_exports.Folder;
    const inner = Array.isArray(iconNode) ? iconNode.map(nodeToSvg).join("") : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  }
  function iconHtml(name, className = "tf-icon") {
    const raw = getIconSvg(name);
    return raw.replace("<svg ", `<svg class="${className}" aria-hidden="true" `);
  }
  function searchIcons(query, limit = 72) {
    const q = (query || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!q) {
      const preferred = [
        "Folder",
        "Gamepad2",
        "Music",
        "Newspaper",
        "GraduationCap",
        "Cpu",
        "Clapperboard",
        "Dumbbell",
        "Utensils",
        "Plane",
        "Briefcase",
        "Heart",
        "Code2",
        "Mic",
        "Camera",
        "Globe",
        "Star",
        "Zap",
        "BookOpen",
        "Car",
        "Radio",
        "Wrench",
        "Baby",
        "Landmark"
      ].filter((n) => iconsAndAliases_exports[n]);
      const rest = ALL_ICON_NAMES.filter((n) => !preferred.includes(n));
      return [...preferred, ...rest].slice(0, limit);
    }
    const scored = [];
    for (const name of ALL_ICON_NAMES) {
      const key = name.toLowerCase();
      if (key === q) scored.push({ name, score: 0 });
      else if (key.startsWith(q)) scored.push({ name, score: 1 });
      else if (key.includes(q)) scored.push({ name, score: 2 });
    }
    scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
    return scored.slice(0, limit).map((s) => s.name);
  }
  function renderIconPickerHtml({
    selectedIcon: selectedIcon2 = "Folder",
    query = "",
    selectedColor: selectedColor2 = "#e11d2e",
    searchAttr = 'data-role="icon-search"',
    gridAttr = 'data-role="icon-grid"',
    labelAttr = 'data-role="icon-label"'
  }) {
    const names = searchIcons(query);
    const q = String(query || "").replace(/"/g, "&quot;");
    return `
    <div class="tf-icon-picker">
      <div class="tf-field-label-row">
        <span class="tf-field-label">Icon</span>
        <span class="tf-icon-selected-label" ${labelAttr}>${selectedIcon2}</span>
      </div>
      <input class="tf-mgr-input tf-icon-search" ${searchAttr} type="search" placeholder="Search Lucide icons\u2026" value="${q}" aria-label="Search icons" />
      <div class="tf-mgr-icons" ${gridAttr} role="listbox" aria-label="Icons">
        ${names.map(
      (name) => `
          <button type="button" class="tf-mgr-icon" data-icon="${name}" role="option" aria-selected="${name === selectedIcon2}" title="${name}" style="${name === selectedIcon2 ? `color:${selectedColor2};border-color:${selectedColor2}` : ""}">
            ${iconHtml(name, "tf-icon")}
          </button>`
    ).join("")}
      </div>
    </div>
  `;
  }
  function renderColorPickerHtml(selectedColor2 = "#e11d2e", { customAttr = 'data-role="color-custom"' } = {}) {
    const selected = selectedColor2.toLowerCase();
    const isPreset = FOLDER_COLORS.some((c) => c.toLowerCase() === selected);
    return `
    <div class="tf-color-row" data-role="color-row" role="listbox" aria-label="Folder color">
      ${FOLDER_COLORS.map(
      (color) => `
        <button type="button" class="tf-color-swatch" data-color="${color}" role="option" aria-label="${color}" aria-selected="${color.toLowerCase() === selected}" style="background:${color}" title="${color}"></button>`
    ).join("")}
      <label class="tf-color-custom-wrap" title="Custom color">
        <input type="color" class="tf-color-custom" ${customAttr} value="${selectedColor2}" aria-label="Custom color" aria-selected="${isPreset ? "false" : "true"}" />
      </label>
    </div>
  `;
  }

  // src/lib/youtube.js
  function parseChannelFromHref(href) {
    if (!href) return null;
    try {
      const url = new URL(href, "https://www.youtube.com");
      const path = url.pathname;
      let m = path.match(/^\/channel\/(UC[\w-]+)/i);
      if (m) return { id: m[1], handle: "", url: url.pathname };
      m = path.match(/^\/@([\w.-]+)/);
      if (m) return { id: `@${m[1]}`, handle: `@${m[1]}`, url: url.pathname };
      m = path.match(/^\/c\/([\w.-]+)/);
      if (m) return { id: `c/${m[1]}`, handle: m[1], url: url.pathname };
      m = path.match(/^\/user\/([\w.-]+)/);
      if (m) return { id: `user/${m[1]}`, handle: m[1], url: url.pathname };
    } catch {
      return null;
    }
    return null;
  }
  function extractChannelFromGuideItem(el) {
    const link = el.querySelector("a#endpoint") || el.querySelector("a.yt-simple-endpoint") || el.closest("a") || el.querySelector("a");
    if (!link) return null;
    const href = link.getAttribute("href") || "";
    const parsed = parseChannelFromHref(href);
    if (!parsed) return null;
    const titleEl = el.querySelector("#guide-entry-title") || el.querySelector(".title") || el.querySelector("yt-formatted-string") || link;
    const name = (titleEl?.textContent || "").trim() || parsed.handle || "Channel";
    const img = el.querySelector("img");
    const avatarUrl = img?.src || img?.getAttribute("src") || "";
    return {
      id: parsed.id,
      name,
      handle: parsed.handle || "",
      avatarUrl,
      href: href.startsWith("http") ? href : `https://www.youtube.com${href}`
    };
  }
  function findUcIdInPage() {
    const candidates = [
      document.querySelector('meta[itemprop="channelId"]')?.content,
      document.querySelector('link[itemprop="url"]')?.href,
      document.querySelector('meta[property="og:url"]')?.content,
      document.querySelector('link[rel="canonical"]')?.href,
      document.querySelector('#page-header a[href*="/channel/UC"]')?.href,
      document.querySelector('yt-page-header-view-model a[href*="/channel/UC"]')?.href
    ].filter(Boolean);
    for (const value of candidates) {
      const m = String(value).match(/\/channel\/(UC[\w-]+)/i) || String(value).match(/^(UC[\w-]+)$/);
      if (m) return m[1];
    }
    return null;
  }
  function channelIdentityKeys(channel) {
    if (!channel) return [];
    const keys = /* @__PURE__ */ new Set();
    if (channel.id) keys.add(channel.id);
    if (channel.handle) keys.add(channel.handle);
    if (channel.id?.startsWith("@")) keys.add(channel.id);
    return [...keys];
  }
  function folderHasChannel(folder, channel) {
    const ids = new Set(folder?.channelIds || []);
    return channelIdentityKeys(channel).some((k) => ids.has(k));
  }
  function extractChannelFromPage() {
    const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
    const parsed = parseChannelFromHref(location.href) || parseChannelFromHref(canonical);
    if (!parsed) return null;
    const handle = parsed.handle || (parsed.id.startsWith("@") ? parsed.id : "") || "";
    const ucId = findUcIdInPage();
    const id = ucId || parsed.id;
    const name = document.querySelector("#page-header h1")?.textContent || document.querySelector("yt-page-header-view-model h1")?.textContent || document.querySelector('meta[property="og:title"]')?.content || document.querySelector("#channel-name yt-formatted-string")?.textContent || document.querySelector("ytd-channel-name yt-formatted-string")?.textContent || handle || "Channel";
    const avatarUrl = document.querySelector("#page-header img")?.src || document.querySelector("yt-page-header-view-model img")?.src || document.querySelector('meta[property="og:image"]')?.content || document.querySelector("#avatar img")?.src || "";
    return {
      id,
      name: name.trim(),
      handle,
      avatarUrl,
      href: location.href,
      ucId: ucId || ""
    };
  }
  function isChannelPage() {
    const p = location.pathname;
    return /^\/@[\w.-]+/.test(p) || /^\/channel\/UC[\w-]+/i.test(p) || /^\/c\/[\w.-]+/.test(p) || /^\/user\/[\w.-]+/.test(p);
  }

  // src/lib/newness.js
  function collectNewChannelIds() {
    const ids = /* @__PURE__ */ new Set();
    const entries = document.querySelectorAll(
      "ytd-guide-entry-renderer, yt-guide-entry-renderer"
    );
    for (const entry of entries) {
      if (entry.closest("#tf-sidebar-section")) continue;
      const hasDot = entry.querySelector("#newness-dot:not([hidden])") || entry.querySelector(".guide-entry-new-unseen-dot") || entry.querySelector('[class*="newness"]');
      const badge = entry.querySelector(
        '.guide-entry-count, #guide-entry-count, .yt-spec-status-badge, [class*="badge"]'
      );
      const badgeText = (badge?.textContent || "").trim();
      const hasBadge = Boolean(badgeText && /\d+/.test(badgeText));
      const title = entry.querySelector("#guide-entry-title, .title, yt-formatted-string") || entry.querySelector("a");
      let bold = false;
      if (title) {
        const weight = Number.parseInt(getComputedStyle(title).fontWeight, 10);
        bold = weight >= 500;
        if (title.hasAttribute("is-empty")) bold = false;
      }
      if (!hasDot && !hasBadge && !bold) continue;
      const channel = extractChannelFromGuideItem(entry);
      if (channel?.id) ids.add(channel.id);
    }
    return ids;
  }

  // src/content/manager.js
  var TF_PATH = "/feed/tubefolders";
  var PAGE_ID = "tf-manager-page";
  var selectedIcon = "Folder";
  var selectedColor = "#e11d2e";
  var iconQuery = "";
  var draftName = "";
  var unbound = null;
  var navBound = false;
  var openMenuId = null;
  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function send(type, payload = {}) {
    return safeSendMessage({ type, ...payload });
  }
  function channelLabel(ch) {
    return ch?.name || ch?.handle || ch?.id || "Channel";
  }
  function isTubeFoldersRoute() {
    return location.pathname === TF_PATH || location.hash === "#tubefolders";
  }
  function findPrimaryHost() {
    return document.querySelector("ytd-page-manager#page-manager") || document.querySelector("#page-manager") || document.querySelector("#content") || document.body;
  }
  function hideYouTubeBrowse(hide) {
    const browse = document.querySelectorAll(
      "ytd-page-manager > ytd-browse, ytd-page-manager > ytd-watch-flexy, ytd-page-manager > ytd-search"
    );
    browse.forEach((el) => {
      if (hide) el.setAttribute("data-tf-hidden", "1");
      else el.removeAttribute("data-tf-hidden");
    });
    document.documentElement.classList.toggle("tf-manager-page-open", hide);
  }
  function closeMenus(page) {
    openMenuId = null;
    page?.querySelectorAll(".tf-folder-menu[open], .tf-folder-menu-panel").forEach((el) => {
      if (el.tagName === "DETAILS") el.open = false;
      else el.hidden = true;
    });
    page?.querySelectorAll("[data-menu-panel]").forEach((el) => {
      el.hidden = true;
    });
  }
  function refreshIconGrid(page) {
    const grid = page.querySelector('[data-role="icon-grid"]');
    const label = page.querySelector('[data-role="icon-label"]');
    if (!grid) return;
    const names = searchIcons(iconQuery);
    grid.innerHTML = names.map((name) => {
      const selected = name === selectedIcon;
      return `
    <button type="button" class="tf-mgr-icon" data-icon="${name}" role="option" aria-selected="${selected}" title="${name}" style="${selected ? `color:${escapeHtml(selectedColor)};border-color:${escapeHtml(selectedColor)}` : ""}">
      ${iconHtml(name, "tf-icon")}
    </button>`;
    }).join("");
    if (label) label.textContent = selectedIcon;
    updateCreateState(page);
  }
  function updateCreateState(page) {
    const name = draftName.trim();
    page.querySelectorAll('[data-action="create"]').forEach((btn) => {
      btn.disabled = !name;
    });
    page.querySelectorAll('.tf-create-card .tf-mgr-icon[aria-selected="true"]').forEach((btn) => {
      btn.style.color = selectedColor;
      btn.style.borderColor = selectedColor;
    });
    page.querySelectorAll(".tf-create-card [data-color]").forEach((btn) => {
      btn.setAttribute(
        "aria-selected",
        btn.dataset.color?.toLowerCase() === selectedColor.toLowerCase() ? "true" : "false"
      );
    });
    const custom = page.querySelector('.tf-create-card [data-role="color-custom"]');
    if (custom) {
      const isPreset = FOLDER_COLORS.some(
        (c) => c.toLowerCase() === selectedColor.toLowerCase()
      );
      custom.value = selectedColor;
      custom.setAttribute("aria-selected", isPreset ? "false" : "true");
      custom.closest(".tf-color-custom-wrap")?.classList.toggle("is-selected", !isPreset);
    }
  }
  function renderAuthChip(auth) {
    if (auth) {
      return `
      <div class="tf-manager-user">
        ${auth.photoURL ? `<img src="${escapeHtml(auth.photoURL)}" alt="" width="24" height="24" />` : `<span class="tf-manager-user-fallback">${iconHtml("User", "tf-icon")}</span>`}
        <span class="tf-manager-user-name" title="${escapeHtml(auth.email || "")}">${escapeHtml(
        auth.displayName || "Signed in"
      )}</span>
        <button type="button" class="tf-mgr-btn ghost tf-mgr-btn-sm" data-action="signout">Sign out</button>
      </div>`;
    }
    return `
    <div class="tf-manager-user">
      <span class="tf-manager-user-name">Not signed in</span>
      <button type="button" class="tf-mgr-btn tf-mgr-btn-sm" data-action="signin">Sign in</button>
    </div>`;
  }
  function renderChannelChip(ch, folderId) {
    const label = channelLabel(ch);
    const avatar = ch.avatarUrl ? `<img class="tf-channel-avatar" src="${escapeHtml(ch.avatarUrl)}" alt="" width="20" height="20" loading="lazy" />` : `<span class="tf-channel-avatar tf-channel-avatar-fallback">${escapeHtml(
      (label[0] || "?").toUpperCase()
    )}</span>`;
    return `
    <li class="tf-channel-chip"
        draggable="true"
        data-channel-id="${escapeHtml(ch.id)}"
        data-from-folder="${escapeHtml(folderId)}"
        tabindex="0">
      ${avatar}
      <span class="tf-channel-chip-name">${escapeHtml(label)}</span>
    </li>`;
  }
  function renderFolderCard(folder, channels) {
    const items = (folder.channelIds || []).map((id) => channels[id]).filter(Boolean);
    const color = folder.color || "#e11d2e";
    const menuOpen = openMenuId === folder.id;
    return `
    <article class="tf-manager-folder" data-id="${folder.id}" data-drop-folder="${folder.id}">
      <header class="tf-folder-card-header">
        <span class="tf-folder-icon" style="color:${escapeHtml(color)}">${iconHtml(
      folder.icon || "Folder",
      "tf-icon tf-icon-lg"
    )}</span>
        <div class="tf-folder-card-meta">
          <strong class="tf-folder-card-name">${escapeHtml(folder.name)}</strong>
          <span class="tf-mgr-count">${items.length} channel${items.length === 1 ? "" : "s"}</span>
        </div>
        <div class="tf-folder-menu">
          <button type="button" class="tf-mgr-btn ghost tf-mgr-icon-btn" data-action="toggle-menu" data-id="${folder.id}" aria-haspopup="menu" aria-expanded="${menuOpen}" aria-label="Folder actions">
            ${iconHtml("Ellipsis", "tf-icon")}
          </button>
          <div class="tf-folder-menu-panel" data-menu-panel="${folder.id}" role="menu" ${menuOpen ? "" : "hidden"}>
            <button type="button" role="menuitem" data-action="menu-color" data-id="${folder.id}">Color</button>
            <button type="button" role="menuitem" data-action="menu-icon" data-id="${folder.id}">Icon</button>
            <button type="button" role="menuitem" data-action="rename" data-id="${folder.id}">Rename</button>
            <button type="button" role="menuitem" class="danger" data-action="delete" data-id="${folder.id}">Delete</button>
          </div>
        </div>
      </header>
      <ul class="tf-channel-list" data-drop-folder="${folder.id}">
        ${items.length ? items.map((ch) => renderChannelChip(ch, folder.id)).join("") : `<li class="tf-folder-empty-channels">No channels yet \u2014 drag one here or use Add to folder</li>`}
      </ul>
      <div class="tf-folder-subpanel" data-subpanel="${folder.id}" hidden></div>
    </article>`;
  }
  async function renderBody(page) {
    const library = await getLibrary();
    const auth = await getAuthMeta();
    const folders = library.folders || [];
    const channels = library.channels || {};
    const body = page.querySelector(".tf-manager-body");
    const headerRight = page.querySelector('[data-role="header-right"]');
    if (!body) return;
    if (headerRight) {
      headerRight.innerHTML = renderAuthChip(auth);
    }
    const createDisabled = !draftName.trim();
    body.innerHTML = `
    <div class="tf-manager-status" data-role="status" role="status" aria-live="polite"></div>

    <div class="tf-manager-grid">
      <section class="tf-manager-create" aria-label="Create folder">
        <div class="tf-create-card">
          <h2 class="tf-create-title">New folder</h2>

          <div class="tf-name-row">
            <input
              class="tf-mgr-input"
              data-role="folder-name"
              type="text"
              maxlength="48"
              placeholder="Folder name"
              value="${escapeHtml(draftName)}"
              aria-label="Folder name"
            />
            <button
              type="button"
              class="tf-mgr-btn tf-create-plus"
              data-action="create"
              aria-label="Create folder"
              title="Create folder"
              ${createDisabled ? "disabled" : ""}
            >${iconHtml("Plus", "tf-icon")}</button>
          </div>

          <div class="tf-field">
            <span class="tf-field-label">Color</span>
            ${renderColorPickerHtml(selectedColor)}
          </div>

          <div class="tf-field">
            ${renderIconPickerHtml({
      selectedIcon,
      query: iconQuery,
      selectedColor
    })}
          </div>
        </div>
      </section>

      <section class="tf-manager-folders" aria-label="Your folders">
        <div class="tf-folders-heading">
          <h2>Your folders</h2>
          <span class="tf-folders-count">${folders.length}</span>
        </div>
        ${folders.length === 0 ? `<div class="tf-folders-empty">
                <div class="tf-folders-empty-icon">${iconHtml("FolderPlus", "tf-icon")}</div>
                <p>No folders yet \u2014 create your first one</p>
              </div>` : `<div class="tf-folders-list">${folders.map((folder) => renderFolderCard(folder, channels)).join("")}</div>`}
      </section>
    </div>
  `;
    const search = body.querySelector('[data-role="icon-search"]');
    if (search) {
      search.addEventListener("input", () => {
        iconQuery = search.value;
        refreshIconGrid(page);
      });
    }
    const nameInput = body.querySelector('[data-role="folder-name"]');
    if (nameInput) {
      nameInput.addEventListener("input", () => {
        draftName = nameInput.value;
        updateCreateState(page);
      });
    }
    bindDragAndDrop(page);
  }
  function setStatus(page, message, isError = false) {
    const el = page.querySelector('[data-role="status"]');
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("error", Boolean(isError));
    el.classList.toggle("is-visible", Boolean(message));
  }
  function bindDragAndDrop(page) {
    let dragChannelId = null;
    let dragFromFolder = null;
    page.querySelectorAll('.tf-channel-chip[draggable="true"]').forEach((chip) => {
      chip.addEventListener("dragstart", (e) => {
        dragChannelId = chip.dataset.channelId;
        dragFromFolder = chip.dataset.fromFolder;
        chip.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", dragChannelId);
        e.dataTransfer.setData(
          "application/x-tf-channel",
          JSON.stringify({ channelId: dragChannelId, fromFolderId: dragFromFolder })
        );
      });
      chip.addEventListener("dragend", () => {
        chip.classList.remove("is-dragging");
        page.querySelectorAll(".is-drop-target").forEach((el) => el.classList.remove("is-drop-target"));
        dragChannelId = null;
        dragFromFolder = null;
      });
    });
    page.querySelectorAll("[data-drop-folder]").forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const card = zone.closest(".tf-manager-folder") || zone;
        card.classList.add("is-drop-target");
      });
      zone.addEventListener("dragleave", (e) => {
        if (!zone.contains(e.relatedTarget)) {
          const card = zone.closest(".tf-manager-folder") || zone;
          card.classList.remove("is-drop-target");
        }
      });
      zone.addEventListener("drop", async (e) => {
        e.preventDefault();
        const card = zone.closest(".tf-manager-folder") || zone;
        card.classList.remove("is-drop-target");
        const toFolderId = zone.dataset.dropFolder || card.dataset.id;
        let payload = { channelId: dragChannelId, fromFolderId: dragFromFolder };
        try {
          const raw = e.dataTransfer.getData("application/x-tf-channel");
          if (raw) payload = JSON.parse(raw);
        } catch {
        }
        if (!payload.channelId || !toFolderId || payload.fromFolderId === toFolderId) return;
        try {
          await moveChannelToFolder(payload.channelId, payload.fromFolderId, toFolderId);
          await send("tf-sync");
          setStatus(page, "Channel moved");
          await renderBody(page);
        } catch (err) {
          setStatus(page, err.message || "Move failed", true);
        }
      });
    });
  }
  async function showFolderColorPanel(page, folderId) {
    const host = page.querySelector(`[data-subpanel="${folderId}"]`);
    if (!host) return;
    const lib = await getLibrary();
    const folder = lib.folders.find((f) => f.id === folderId);
    if (!folder) return;
    host.hidden = false;
    host.innerHTML = `
    <div class="tf-subpanel-inner">
      <span class="tf-field-label">Pick a color</span>
      ${renderColorPickerHtml(folder.color || "#e11d2e", {
      customAttr: `data-role="folder-color-custom" data-folder-id="${folderId}"`
    }).replace(
      /data-color="/g,
      `data-folder-color="${folderId}" data-color="`
    )}
      <button type="button" class="tf-mgr-btn ghost tf-mgr-btn-sm" data-action="close-subpanel" data-id="${folderId}">Done</button>
    </div>
  `;
  }
  async function showFolderIconPanel(page, folderId) {
    const host = page.querySelector(`[data-subpanel="${folderId}"]`);
    if (!host) return;
    const lib = await getLibrary();
    const folder = lib.folders.find((f) => f.id === folderId);
    if (!folder) return;
    let q = "";
    const color = folder.color || "#e11d2e";
    const renderGrid = () => {
      const names = searchIcons(q, 48);
      return names.map((name) => {
        const selected = name === (folder.icon || "Folder");
        return `<button type="button" class="tf-mgr-icon" data-folder-icon="${folderId}" data-icon="${name}" aria-selected="${selected}" title="${name}" style="${selected ? `color:${color};border-color:${color}` : ""}">${iconHtml(name, "tf-icon")}</button>`;
      }).join("");
    };
    host.hidden = false;
    host.innerHTML = `
    <div class="tf-subpanel-inner">
      <span class="tf-field-label">Pick an icon</span>
      <input class="tf-mgr-input tf-icon-search" data-role="folder-icon-search" data-folder-id="${folderId}" type="search" placeholder="Search icons\u2026" />
      <div class="tf-mgr-icons tf-mgr-icons-compact" data-role="folder-icon-grid">${renderGrid()}</div>
      <button type="button" class="tf-mgr-btn ghost tf-mgr-btn-sm" data-action="close-subpanel" data-id="${folderId}">Done</button>
    </div>
  `;
    const search = host.querySelector('[data-role="folder-icon-search"]');
    const grid = host.querySelector('[data-role="folder-icon-grid"]');
    search?.addEventListener("input", () => {
      q = search.value;
      if (grid) grid.innerHTML = renderGrid();
    });
  }
  async function handleAction(page, action, target) {
    try {
      if (action === "close") {
        closeManager({ navigateHome: true });
        return;
      }
      if (action === "signin") {
        setStatus(page, "Opening Google sign-in\u2026");
        const res = await send("tf-signin");
        if (!res.ok) throw new Error(res.error || "Sign-in failed");
        setStatus(page, `Signed in as ${res.user?.displayName || res.user?.email || "user"}`);
        await renderBody(page);
        return;
      }
      if (action === "signout") {
        await send("tf-signout");
        setStatus(page, "Signed out");
        await renderBody(page);
        return;
      }
      if (action === "create") {
        const name = draftName.trim();
        if (!name) return;
        await createFolder({ name, icon: selectedIcon, color: selectedColor });
        draftName = "";
        iconQuery = "";
        await send("tf-sync");
        setStatus(page, "Folder created");
        await renderBody(page);
        return;
      }
      if (action === "toggle-menu") {
        const id = target.dataset.id;
        const panel = page.querySelector(`[data-menu-panel="${id}"]`);
        const wasOpen = openMenuId === id;
        closeMenus(page);
        if (!wasOpen && panel) {
          openMenuId = id;
          panel.hidden = false;
          target.setAttribute("aria-expanded", "true");
        }
        return;
      }
      if (action === "menu-color") {
        const id = target.dataset.id;
        closeMenus(page);
        await showFolderColorPanel(page, id);
        return;
      }
      if (action === "menu-icon") {
        const id = target.dataset.id;
        closeMenus(page);
        await showFolderIconPanel(page, id);
        return;
      }
      if (action === "close-subpanel") {
        const host = page.querySelector(`[data-subpanel="${target.dataset.id}"]`);
        if (host) {
          host.hidden = true;
          host.innerHTML = "";
        }
        return;
      }
      if (action === "rename") {
        closeMenus(page);
        const id = target.dataset.id;
        const next = prompt("Folder name");
        if (!next || !next.trim()) return;
        await updateFolder(id, { name: next.trim() });
        await send("tf-sync");
        setStatus(page, "Folder renamed");
        await renderBody(page);
        return;
      }
      if (action === "delete") {
        closeMenus(page);
        const id = target.dataset.id;
        if (!confirm("Delete this folder? Channels stay on YouTube \u2014 only the folder is removed.")) {
          return;
        }
        await deleteFolder(id);
        await send("tf-sync");
        setStatus(page, "Folder deleted");
        await renderBody(page);
      }
    } catch (err) {
      setStatus(page, err.message || "Something went wrong", true);
    }
  }
  function ensurePageShell() {
    let page = document.getElementById(PAGE_ID);
    if (page) return page;
    page = document.createElement("div");
    page.id = PAGE_ID;
    page.className = "tf-root tf-manager-page";
    page.innerHTML = `
    <div class="tf-manager-page-inner" role="main" aria-label="TubeFolders">
      <header class="tf-manager-header">
        <div class="tf-manager-brand">
          ${iconHtml("Folder", "tf-icon tf-page-icon")}
          <h1>TubeFolders</h1>
        </div>
        <div class="tf-manager-header-right" data-role="header-right"></div>
      </header>
      <div class="tf-manager-body"></div>
    </div>
  `;
    page.addEventListener("click", async (e) => {
      const folderColorBtn = e.target.closest("[data-folder-color]");
      if (folderColorBtn && page.contains(folderColorBtn)) {
        const folderId = folderColorBtn.dataset.folderColor;
        const color = folderColorBtn.dataset.color;
        await updateFolder(folderId, { color });
        await send("tf-sync");
        setStatus(page, "Color updated");
        await renderBody(page);
        return;
      }
      const folderIconBtn = e.target.closest("[data-folder-icon]");
      if (folderIconBtn && page.contains(folderIconBtn)) {
        const folderId = folderIconBtn.dataset.folderIcon;
        const icon = folderIconBtn.dataset.icon;
        await updateFolder(folderId, { icon });
        await send("tf-sync");
        setStatus(page, `Icon set to ${icon}`);
        await renderBody(page);
        return;
      }
      const colorBtn = e.target.closest("[data-color]:not([data-folder-color])");
      if (colorBtn && page.contains(colorBtn) && !colorBtn.dataset.folderColor) {
        if (!colorBtn.closest("[data-subpanel]")) {
          selectedColor = colorBtn.dataset.color;
          updateCreateState(page);
          refreshIconGrid(page);
          return;
        }
      }
      const iconBtn = e.target.closest("[data-icon]:not([data-folder-icon])");
      if (iconBtn && page.contains(iconBtn) && !iconBtn.dataset.folderIcon) {
        if (!iconBtn.closest("[data-subpanel]")) {
          selectedIcon = iconBtn.dataset.icon;
          refreshIconGrid(page);
          return;
        }
      }
      const actionBtn = e.target.closest("[data-action]");
      if (actionBtn && page.contains(actionBtn)) {
        await handleAction(page, actionBtn.dataset.action, actionBtn);
        return;
      }
      if (!e.target.closest(".tf-folder-menu")) {
        closeMenus(page);
      }
    });
    page.addEventListener("input", (e) => {
      if (e.target.matches?.('[data-role="color-custom"]')) {
        selectedColor = e.target.value;
        updateCreateState(page);
        refreshIconGrid(page);
      }
      if (e.target.matches?.('[data-role="folder-color-custom"]')) {
        const folderId = e.target.dataset.folderId;
        const color = e.target.value;
        updateFolder(folderId, { color }).then(async () => {
          await send("tf-sync");
          setStatus(page, "Color updated");
          await renderBody(page);
        });
      }
    });
    page.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenus(page);
    });
    findPrimaryHost().appendChild(page);
    return page;
  }
  async function openManager() {
    if (!isTubeFoldersRoute()) {
      history.pushState({ tubefolders: true }, "", TF_PATH);
    }
    hideYouTubeBrowse(true);
    const page = ensurePageShell();
    page.hidden = false;
    await renderBody(page);
    if (!unbound) {
      unbound = onLibraryChange(() => {
        const el = document.getElementById(PAGE_ID);
        if (el && !el.hidden) renderBody(el);
      });
    }
    bindNavigation();
  }
  function closeManager({ navigateHome = false } = {}) {
    const page = document.getElementById(PAGE_ID);
    if (page) page.hidden = true;
    hideYouTubeBrowse(false);
    if (navigateHome && isTubeFoldersRoute()) {
      location.assign("/feed/subscriptions");
    }
  }
  function syncManagerRoute() {
    if (isTubeFoldersRoute()) openManager();
    else closeManager({ navigateHome: false });
  }
  function bindNavigation() {
    if (navBound) return;
    navBound = true;
    window.addEventListener("popstate", () => syncManagerRoute());
    document.addEventListener("yt-navigate-finish", () => {
      setTimeout(syncManagerRoute, 50);
    });
  }

  // src/content/sidebar.js
  var SECTION_ID = "tf-sidebar-section";
  function guideSections() {
    return [
      ...document.querySelectorAll(
        "#sections > ytd-guide-section-renderer, ytd-guide-renderer #sections > ytd-guide-section-renderer"
      )
    ];
  }
  function sectionEntries(section) {
    return [...section.querySelectorAll(":scope ytd-guide-entry-renderer")].map((entry) => {
      const title = (entry.querySelector("#guide-entry-title, yt-formatted-string")?.textContent || "").replace(/\s+/g, " ").trim();
      const href = entry.querySelector("a#endpoint, a.yt-simple-endpoint")?.getAttribute("href") || "";
      return { title, href, entry };
    });
  }
  function findSubscriptionsSection() {
    for (const section of guideSections()) {
      const entries = sectionEntries(section);
      if (!entries.length) continue;
      const first = entries[0];
      if (first.href.includes("/feed/subscriptions") || /^subscriptions$/i.test(first.title)) {
        return section;
      }
      if (entries.some((e) => e.href.includes("/feed/subscriptions"))) {
        return section;
      }
    }
    return null;
  }
  function isCorrectPlacement(node) {
    const next = node?.nextElementSibling;
    if (!next || next.tagName !== "YTD-GUIDE-SECTION-RENDERER") return false;
    const entries = sectionEntries(next);
    return entries.some(
      (e) => e.href.includes("/feed/subscriptions") || /^subscriptions$/i.test(e.title)
    );
  }
  function placeSection(node) {
    const subscriptions = findSubscriptionsSection();
    if (subscriptions?.parentElement) {
      subscriptions.parentElement.insertBefore(node, subscriptions);
      return true;
    }
    const sections = guideSections();
    if (sections[0]) {
      sections[0].insertAdjacentElement("afterend", node);
      return true;
    }
    return false;
  }
  function channelHref(channel) {
    if (channel.href) return channel.href;
    const id = channel.id || "";
    if (id.startsWith("UC")) return `https://www.youtube.com/channel/${id}`;
    if (id.startsWith("@")) return `https://www.youtube.com/${id}`;
    if (id.startsWith("c/")) return `https://www.youtube.com/${id}`;
    if (id.startsWith("user/")) return `https://www.youtube.com/${id}`;
    return `https://www.youtube.com/${id}`;
  }
  function chevronHtml(open = false) {
    return iconHtml(open ? "ChevronDown" : "ChevronRight", "tf-icon tf-yt-chevron");
  }
  function buildSection(library, newIds) {
    const section = document.createElement("div");
    section.id = SECTION_ID;
    section.className = "tf-root tf-guide-section";
    const folders = library.folders || [];
    const channels = library.channels || {};
    section.innerHTML = `
    <button type="button" class="tf-guide-header tf-sidebar-open" title="Manage TubeFolders">
      <span class="tf-guide-title">TubeFolders</span>
      <span class="tf-guide-chevron">${chevronHtml(false)}</span>
    </button>
    <div class="tf-guide-items">
      ${folders.length === 0 ? `<button type="button" class="tf-guide-empty tf-sidebar-open">Create folders</button>` : folders.map((folder) => {
      const items = (folder.channelIds || []).map((id) => channels[id]).filter(Boolean);
      const color = folder.color || "#e11d2e";
      return `
            <div class="tf-folder" data-folder-id="${folder.id}" data-open="false" style="--tf-folder-color:${escapeAttr(color)}">
              <button type="button" class="tf-folder-toggle" aria-expanded="false">
                <span class="tf-folder-icon" style="color:${escapeAttr(color)}">${iconHtml(
        folder.icon || "Folder",
        "tf-icon"
      )}</span>
                <span class="tf-folder-name">${escapeHtml2(folder.name)}</span>
                <span class="tf-chevron">${chevronHtml(false)}</span>
              </button>
              <div class="tf-folder-channels">
                ${items.length ? items.map((ch) => {
        const isNew = newIds.has(ch.id) || ch.handle && newIds.has(ch.handle);
        return `
                  <a class="tf-channel-link${isNew ? " tf-channel-new" : ""}" href="${escapeAttr(
          channelHref(ch)
        )}">
                    ${ch.avatarUrl ? `<img src="${escapeAttr(ch.avatarUrl)}" alt="" width="24" height="24" />` : `<span class="tf-avatar-fallback"></span>`}
                    <span>${escapeHtml2(ch.name || ch.handle || ch.id)}</span>
                  </a>`;
      }).join("") : `<button type="button" class="tf-guide-empty tf-sidebar-open">No channels yet</button>`}
              </div>
            </div>`;
    }).join("")}
    </div>
  `;
    section.addEventListener("click", (e) => {
      if (e.target.closest(".tf-sidebar-open")) {
        e.preventDefault();
        openManager();
        return;
      }
      const toggle = e.target.closest(".tf-folder-toggle");
      if (!toggle) return;
      const folder = toggle.closest(".tf-folder");
      const open = folder.getAttribute("data-open") === "true";
      const nextOpen = !open;
      folder.setAttribute("data-open", nextOpen ? "true" : "false");
      toggle.setAttribute("aria-expanded", nextOpen ? "true" : "false");
      const chevron = toggle.querySelector(".tf-chevron");
      if (chevron) chevron.innerHTML = chevronHtml(nextOpen);
    });
    return section;
  }
  function escapeHtml2(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escapeAttr(str) {
    return escapeHtml2(str).replace(/'/g, "&#39;");
  }
  async function renderSidebar() {
    const existing = document.getElementById(SECTION_ID);
    const openFolders = new Set(
      [...existing?.querySelectorAll('.tf-folder[data-open="true"]') || []].map(
        (el) => el.dataset.folderId
      )
    );
    const library = await getLibrary();
    const newIds = collectNewChannelIds();
    const next = buildSection(library, newIds);
    for (const id of openFolders) {
      const folder = next.querySelector(`.tf-folder[data-folder-id="${id}"]`);
      if (folder) {
        folder.setAttribute("data-open", "true");
        const toggle = folder.querySelector(".tf-folder-toggle");
        const chevron = folder.querySelector(".tf-chevron");
        if (toggle) toggle.setAttribute("aria-expanded", "true");
        if (chevron) chevron.innerHTML = chevronHtml(true);
      }
    }
    existing?.remove();
    if (!placeSection(next)) return;
    if (!isCorrectPlacement(next)) {
      next.remove();
      placeSection(next);
    }
  }
  function startSidebar() {
    renderSidebar();
    onLibraryChange(() => renderSidebar());
  }

  // src/content/highlight.js
  function guideEntries() {
    return [
      ...document.querySelectorAll(
        "ytd-guide-entry-renderer, yt-guide-entry-renderer"
      )
    ];
  }
  function isInsideTubeFolders(el) {
    return Boolean(el.closest("#tf-sidebar-section"));
  }
  function channelMatchesId(channel, id, meta) {
    if (!channel || !id) return false;
    if (channel.id === id) return true;
    if (channel.handle && (channel.handle === id || channel.handle === meta?.handle)) return true;
    const handle = channel.handle?.replace(/^@/, "") || "";
    const metaHandle = meta?.handle?.replace(/^@/, "") || "";
    if (handle && (id === handle || id === `@${handle}` || handle === metaHandle)) return true;
    if (channel.name && meta?.name && channel.name.toLowerCase() === meta.name.toLowerCase()) {
      return true;
    }
    return false;
  }
  function folderColorForChannel(channel, library) {
    for (const folder of library.folders || []) {
      for (const id of folder.channelIds || []) {
        const meta = library.channels?.[id];
        if (channelMatchesId(channel, id, meta)) {
          return folder.color || "#e11d2e";
        }
      }
    }
    return null;
  }
  async function highlightSubscriptions() {
    const library = await getLibrary();
    for (const entry of guideEntries()) {
      if (isInsideTubeFolders(entry)) continue;
      const channel = extractChannelFromGuideItem(entry);
      if (!channel) {
        entry.classList.remove("tf-filed", "tf-unfiled");
        entry.style.removeProperty("--tf-folder-bar");
        delete entry.dataset.tfChannelId;
        continue;
      }
      const color = folderColorForChannel(channel, library);
      const isFiled = Boolean(color);
      entry.classList.toggle("tf-filed", isFiled);
      entry.classList.toggle("tf-unfiled", !isFiled);
      entry.dataset.tfChannelId = channel.id;
      if (isFiled) entry.style.setProperty("--tf-folder-bar", color);
      else entry.style.removeProperty("--tf-folder-bar");
    }
  }
  function startHighlight() {
    highlightSubscriptions();
    onLibraryChange(() => highlightSubscriptions());
  }

  // src/content/channel-page.js
  var PANEL_ID = "tf-channel-panel";
  var BTN_ID = "tf-add-folder-btn";
  var WRAP_ID = "tf-add-folder-wrap";
  var openPanelState = null;
  var lastChannelKey = "";
  function requestSync() {
    safeSendMessage({ type: "tf-sync" });
  }
  function escapeHtml3(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function channelKey(channel) {
    if (!channel) return "";
    return channelIdentityKeys(channel).join("|") || channel.id || "";
  }
  function findSubscribeInsertion() {
    const header = document.querySelector("#page-header yt-flexible-actions-view-model") || document.querySelector(
      "yt-page-header-view-model yt-flexible-actions-view-model"
    ) || document.querySelector("yt-flexible-actions-view-model");
    if (header) {
      const subVm2 = header.querySelector("yt-subscribe-button-view-model") || header.querySelector(".ytSubscribeButtonViewModelHost");
      if (subVm2) {
        const action = subVm2.closest(".ytFlexibleActionsViewModelAction") || subVm2;
        return { anchor: action, mode: "after", host: header };
      }
    }
    const subVm = document.querySelector(
      "#page-header yt-subscribe-button-view-model, yt-page-header-view-model yt-subscribe-button-view-model"
    );
    if (subVm) {
      const action = subVm.closest(".ytFlexibleActionsViewModelAction") || subVm;
      return { anchor: action, mode: "after", host: action.parentElement };
    }
    return null;
  }
  function positionPanel(panel, anchorBtn) {
    if (!panel || !anchorBtn?.isConnected) {
      removePanel();
      return;
    }
    const rect = anchorBtn.getBoundingClientRect();
    const panelW = panel.offsetWidth || 280;
    const panelH = panel.offsetHeight || 200;
    const gap = 8;
    const margin = 12;
    let top = rect.bottom + gap;
    if (top + panelH > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - gap - panelH);
    }
    let left = rect.left;
    if (left + panelW > window.innerWidth - margin) {
      left = window.innerWidth - panelW - margin;
    }
    if (left < margin) left = margin;
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.transform = "none";
  }
  function removePanel() {
    if (openPanelState) {
      window.removeEventListener("scroll", openPanelState.onScroll, true);
      window.removeEventListener("resize", openPanelState.onScroll);
      document.removeEventListener("pointerdown", openPanelState.onPointer, true);
      document.removeEventListener("keydown", openPanelState.onKey, true);
      openPanelState = null;
    }
    document.getElementById(PANEL_ID)?.remove();
  }
  async function openAssignPanel(anchorBtn) {
    removePanel();
    const channel = extractChannelFromPage();
    if (!channel || !anchorBtn) return;
    const library = await getLibrary();
    const folders = library.folders || [];
    const membership = new Set(
      folders.filter((f) => folderHasChannel(f, channel)).map((f) => f.id)
    );
    const key = channelKey(channel);
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "tf-root";
    panel.dataset.channelKey = key;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Add to folders");
    panel.innerHTML = `
    <div class="tf-panel-header">
      <div class="tf-panel-heading">
        <h3>Add to folders</h3>
        <div class="tf-channel-meta">${escapeHtml3(channel.name)}</div>
      </div>
      <button type="button" class="tf-close" aria-label="Close">${iconHtml("X", "tf-icon")}</button>
    </div>
    <div class="tf-check-list">
      ${folders.length ? folders.map((folder) => {
      const color = folder.color || "#e11d2e";
      const checked = membership.has(folder.id);
      return `
        <label>
          <input type="checkbox" value="${folder.id}" ${checked ? "checked" : ""} />
          <span style="color:${escapeHtml3(color)}">${iconHtml(
        folder.icon || "Folder",
        "tf-icon"
      )}</span>
          <span>${escapeHtml3(folder.name)}</span>
        </label>`;
    }).join("") : `<div class="tf-guide-empty">Create a folder first \u2014 click TubeFolders in the sidebar.</div>`}
    </div>
    <div class="tf-panel-actions">
      <button type="button" class="tf-save">Save</button>
    </div>
  `;
    document.documentElement.appendChild(panel);
    positionPanel(panel, anchorBtn);
    const onScroll = () => removePanel();
    const onPointer = (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (panel.contains(t) || anchorBtn.contains(t) || t === anchorBtn) return;
      removePanel();
    };
    const onKey = (e) => {
      if (e.key === "Escape") removePanel();
    };
    openPanelState = {
      panel,
      anchor: anchorBtn,
      channelKey: key,
      onScroll,
      onPointer,
      onKey
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    setTimeout(() => {
      if (openPanelState?.panel === panel) {
        document.addEventListener("pointerdown", onPointer, true);
        document.addEventListener("keydown", onKey, true);
      }
    }, 0);
    panel.querySelector(".tf-close").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      removePanel();
    });
    panel.querySelector(".tf-save").addEventListener("click", async () => {
      const ids = [...panel.querySelectorAll('input[type="checkbox"]:checked')].map(
        (el) => el.value
      );
      const fresh = extractChannelFromPage() || channel;
      await setChannelFolders(fresh, ids);
      requestSync();
      updateButtonLabel(ids.length);
      removePanel();
    });
  }
  async function updateButtonLabel(forcedCount) {
    const btn = document.getElementById(BTN_ID);
    if (!btn) return;
    let count = forcedCount;
    if (count == null) {
      const channel = extractChannelFromPage();
      if (!channel) return;
      const library = await getLibrary();
      count = library.folders.filter((f) => folderHasChannel(f, channel)).length;
    }
    btn.innerHTML = `${iconHtml("FolderPlus", "tf-icon")} <span class="tf-add-folder-label">${count > 0 ? `Folders (${count})` : "Add to folder"}</span>`;
  }
  async function ensureSubscribeButton() {
    if (!isChannelPage()) {
      document.getElementById(WRAP_ID)?.remove();
      removePanel();
      lastChannelKey = "";
      return false;
    }
    const channel = extractChannelFromPage();
    const key = channelKey(channel);
    if (key && key !== lastChannelKey) {
      removePanel();
      lastChannelKey = key;
    }
    if (openPanelState && openPanelState.channelKey !== key) {
      removePanel();
    }
    const existing = document.getElementById(BTN_ID);
    if (existing) {
      const wrap2 = document.getElementById(WRAP_ID);
      const spot2 = findSubscribeInsertion();
      const staleChannel = wrap2?.dataset?.channelKey && wrap2.dataset.channelKey !== key;
      if (staleChannel || wrap2 && spot2?.anchor && wrap2.previousElementSibling !== spot2.anchor && wrap2.parentElement !== spot2.host) {
        wrap2.remove();
        removePanel();
      } else {
        if (wrap2 && key) wrap2.dataset.channelKey = key;
        await updateButtonLabel();
        return true;
      }
    }
    const spot = findSubscribeInsertion();
    if (!spot?.anchor) return false;
    const wrap = document.createElement("div");
    wrap.id = WRAP_ID;
    wrap.className = "tf-root tf-add-folder-wrap ytFlexibleActionsViewModelAction";
    if (key) wrap.dataset.channelKey = key;
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.className = [
      "tf-add-folder-btn",
      "ytSpecButtonShapeNextHost",
      "ytSpecButtonShapeNextTonal",
      "ytSpecButtonShapeNextMono",
      "ytSpecButtonShapeNextSizeM",
      "ytSpecButtonShapeNextIconLeading"
    ].join(" ");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (openPanelState?.anchor === btn) {
        removePanel();
        return;
      }
      openAssignPanel(btn);
    });
    wrap.appendChild(btn);
    spot.anchor.insertAdjacentElement("afterend", wrap);
    await updateButtonLabel();
    return true;
  }
  function startChannelPanel() {
    if (!isExtensionAlive()) return;
    ensureSubscribeButton();
    onLibraryChange(() => {
      if (!isExtensionAlive()) return;
      ensureSubscribeButton();
    });
    document.addEventListener("yt-navigate-start", () => {
      removePanel();
    });
    document.addEventListener("yt-navigate-finish", () => {
      removePanel();
      lastChannelKey = "";
      setTimeout(() => ensureSubscribeButton(), 50);
    });
    let tries = 0;
    const timer = setInterval(() => {
      if (!isExtensionAlive()) {
        clearInterval(timer);
        return;
      }
      tries += 1;
      ensureSubscribeButton().then((ok) => {
        if (ok || tries > 40) clearInterval(timer);
      });
    }, 500);
  }
  async function refreshChannelPanel() {
    await ensureSubscribeButton();
  }

  // src/content/main.js
  var FONT_URL = isExtensionAlive() ? chrome.runtime.getURL("assets/fonts/Outfit-Variable.ttf") : "";
  function ensureFont() {
    if (document.getElementById("tf-font-style")) return;
    const style = document.createElement("style");
    style.id = "tf-font-style";
    style.textContent = `
    @font-face {
      font-family: 'Outfit';
      src: url('${FONT_URL}') format('truetype');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
    }
  `;
    document.documentElement.appendChild(style);
  }
  function refreshAll() {
    if (!isExtensionAlive()) return;
    ensureFont();
    renderSidebar();
    highlightSubscriptions();
    refreshChannelPanel();
    syncManagerRoute();
  }
  function observeSpa() {
    document.addEventListener("yt-navigate-finish", () => {
      setTimeout(refreshAll, 300);
    });
    let timer = null;
    const obs = new MutationObserver(() => {
      if (!isExtensionAlive()) {
        obs.disconnect();
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!isExtensionAlive()) return;
        if (!document.getElementById("tf-sidebar-section")) {
          renderSidebar();
        }
        highlightSubscriptions();
        refreshChannelPanel();
      }, 400);
    });
    const start = () => {
      const root = document.querySelector("#content, ytd-app, body") || document.documentElement;
      obs.observe(root, { childList: true, subtree: true });
    };
    if (document.body) start();
    else document.addEventListener("DOMContentLoaded", start, { once: true });
  }
  if (isExtensionAlive()) {
    ensureFont();
    startSidebar();
    startHighlight();
    startChannelPanel();
    observeSpa();
    setTimeout(refreshAll, 1e3);
    setTimeout(refreshAll, 3e3);
  }
})();
/*! Bundled license information:

lucide/dist/esm/icons/a-arrow-down.mjs:
lucide/dist/esm/icons/a-arrow-up.mjs:
lucide/dist/esm/icons/a-large-small.mjs:
lucide/dist/esm/icons/accessibility.mjs:
lucide/dist/esm/icons/activity.mjs:
lucide/dist/esm/icons/ad.mjs:
lucide/dist/esm/icons/air-vent.mjs:
lucide/dist/esm/icons/airplay.mjs:
lucide/dist/esm/icons/alarm-clock-check.mjs:
lucide/dist/esm/icons/alarm-clock-minus.mjs:
lucide/dist/esm/icons/alarm-clock-off.mjs:
lucide/dist/esm/icons/alarm-clock-plus.mjs:
lucide/dist/esm/icons/alarm-clock.mjs:
lucide/dist/esm/icons/alarm-smoke.mjs:
lucide/dist/esm/icons/align-center-horizontal.mjs:
lucide/dist/esm/icons/align-center-vertical.mjs:
lucide/dist/esm/icons/align-end-horizontal.mjs:
lucide/dist/esm/icons/align-end-vertical.mjs:
lucide/dist/esm/icons/align-horizontal-distribute-center.mjs:
lucide/dist/esm/icons/align-horizontal-distribute-end.mjs:
lucide/dist/esm/icons/align-horizontal-distribute-start.mjs:
lucide/dist/esm/icons/align-horizontal-justify-center.mjs:
lucide/dist/esm/icons/align-horizontal-justify-end.mjs:
lucide/dist/esm/icons/align-horizontal-justify-start.mjs:
lucide/dist/esm/icons/align-horizontal-space-around.mjs:
lucide/dist/esm/icons/align-horizontal-space-between.mjs:
lucide/dist/esm/icons/align-start-horizontal.mjs:
lucide/dist/esm/icons/align-start-vertical.mjs:
lucide/dist/esm/icons/align-vertical-distribute-center.mjs:
lucide/dist/esm/icons/align-vertical-distribute-end.mjs:
lucide/dist/esm/icons/align-vertical-distribute-start.mjs:
lucide/dist/esm/icons/align-vertical-justify-center.mjs:
lucide/dist/esm/icons/align-vertical-justify-end.mjs:
lucide/dist/esm/icons/align-vertical-justify-start.mjs:
lucide/dist/esm/icons/align-vertical-space-around.mjs:
lucide/dist/esm/icons/align-vertical-space-between.mjs:
lucide/dist/esm/icons/ampersand.mjs:
lucide/dist/esm/icons/ambulance.mjs:
lucide/dist/esm/icons/ampersands.mjs:
lucide/dist/esm/icons/amphora.mjs:
lucide/dist/esm/icons/anchor.mjs:
lucide/dist/esm/icons/angle.mjs:
lucide/dist/esm/icons/antenna.mjs:
lucide/dist/esm/icons/aperture.mjs:
lucide/dist/esm/icons/anvil.mjs:
lucide/dist/esm/icons/app-window-mac.mjs:
lucide/dist/esm/icons/app-window.mjs:
lucide/dist/esm/icons/apple.mjs:
lucide/dist/esm/icons/archive-arrow-down.mjs:
lucide/dist/esm/icons/archive-arrow-up.mjs:
lucide/dist/esm/icons/archive-x.mjs:
lucide/dist/esm/icons/archive.mjs:
lucide/dist/esm/icons/armchair.mjs:
lucide/dist/esm/icons/armenian-dram.mjs:
lucide/dist/esm/icons/arrow-big-down-dash.mjs:
lucide/dist/esm/icons/arrow-big-down.mjs:
lucide/dist/esm/icons/arrow-big-left-dash.mjs:
lucide/dist/esm/icons/arrow-big-left.mjs:
lucide/dist/esm/icons/arrow-big-right-dash.mjs:
lucide/dist/esm/icons/arrow-big-right.mjs:
lucide/dist/esm/icons/arrow-big-up-dash.mjs:
lucide/dist/esm/icons/arrow-big-up.mjs:
lucide/dist/esm/icons/arrow-down-0-1.mjs:
lucide/dist/esm/icons/arrow-down-1-0.mjs:
lucide/dist/esm/icons/arrow-down-a-z.mjs:
lucide/dist/esm/icons/arrow-down-from-line.mjs:
lucide/dist/esm/icons/arrow-down-left.mjs:
lucide/dist/esm/icons/arrow-down-narrow-wide.mjs:
lucide/dist/esm/icons/arrow-down-right.mjs:
lucide/dist/esm/icons/arrow-down-to-dot.mjs:
lucide/dist/esm/icons/arrow-down-to-line.mjs:
lucide/dist/esm/icons/arrow-down-up.mjs:
lucide/dist/esm/icons/arrow-down-wide-narrow.mjs:
lucide/dist/esm/icons/arrow-down-z-a.mjs:
lucide/dist/esm/icons/arrow-down.mjs:
lucide/dist/esm/icons/arrow-left-from-line.mjs:
lucide/dist/esm/icons/arrow-left-right.mjs:
lucide/dist/esm/icons/arrow-left-to-line.mjs:
lucide/dist/esm/icons/arrow-left.mjs:
lucide/dist/esm/icons/arrow-right-from-line.mjs:
lucide/dist/esm/icons/arrow-right-left.mjs:
lucide/dist/esm/icons/arrow-right-to-line.mjs:
lucide/dist/esm/icons/arrow-right.mjs:
lucide/dist/esm/icons/arrow-up-0-1.mjs:
lucide/dist/esm/icons/arrow-up-1-0.mjs:
lucide/dist/esm/icons/arrow-up-a-z.mjs:
lucide/dist/esm/icons/arrow-up-down.mjs:
lucide/dist/esm/icons/arrow-up-from-dot.mjs:
lucide/dist/esm/icons/arrow-up-from-line.mjs:
lucide/dist/esm/icons/arrow-up-left.mjs:
lucide/dist/esm/icons/arrow-up-right.mjs:
lucide/dist/esm/icons/arrow-up-narrow-wide.mjs:
lucide/dist/esm/icons/arrow-up-to-line.mjs:
lucide/dist/esm/icons/arrow-up-z-a.mjs:
lucide/dist/esm/icons/arrow-up-wide-narrow.mjs:
lucide/dist/esm/icons/arrows-up-from-line.mjs:
lucide/dist/esm/icons/asterisk.mjs:
lucide/dist/esm/icons/arrow-up.mjs:
lucide/dist/esm/icons/astroid.mjs:
lucide/dist/esm/icons/at-sign.mjs:
lucide/dist/esm/icons/atom.mjs:
lucide/dist/esm/icons/audio-lines-off.mjs:
lucide/dist/esm/icons/audio-lines-x.mjs:
lucide/dist/esm/icons/audio-lines.mjs:
lucide/dist/esm/icons/audio-waveform.mjs:
lucide/dist/esm/icons/avocado.mjs:
lucide/dist/esm/icons/award.mjs:
lucide/dist/esm/icons/axe.mjs:
lucide/dist/esm/icons/axis-3d.mjs:
lucide/dist/esm/icons/azerbaijani-manat.mjs:
lucide/dist/esm/icons/baby.mjs:
lucide/dist/esm/icons/backpack.mjs:
lucide/dist/esm/icons/badge-cent.mjs:
lucide/dist/esm/icons/bacon.mjs:
lucide/dist/esm/icons/badge-check.mjs:
lucide/dist/esm/icons/badge-dollar-sign.mjs:
lucide/dist/esm/icons/badge-euro.mjs:
lucide/dist/esm/icons/badge-exclamation-point.mjs:
lucide/dist/esm/icons/badge-indian-rupee.mjs:
lucide/dist/esm/icons/badge-minus.mjs:
lucide/dist/esm/icons/badge-info.mjs:
lucide/dist/esm/icons/badge-japanese-yen.mjs:
lucide/dist/esm/icons/badge-percent.mjs:
lucide/dist/esm/icons/badge-plus.mjs:
lucide/dist/esm/icons/badge-pound-sterling.mjs:
lucide/dist/esm/icons/badge-question-mark.mjs:
lucide/dist/esm/icons/badge-russian-ruble.mjs:
lucide/dist/esm/icons/badge-swiss-franc.mjs:
lucide/dist/esm/icons/badge-turkish-lira.mjs:
lucide/dist/esm/icons/badge-x.mjs:
lucide/dist/esm/icons/badge.mjs:
lucide/dist/esm/icons/ball-wave.mjs:
lucide/dist/esm/icons/baggage-claim.mjs:
lucide/dist/esm/icons/balloon.mjs:
lucide/dist/esm/icons/ban.mjs:
lucide/dist/esm/icons/banana.mjs:
lucide/dist/esm/icons/bandage.mjs:
lucide/dist/esm/icons/banknote-arrow-down.mjs:
lucide/dist/esm/icons/bangladeshi-taka.mjs:
lucide/dist/esm/icons/banknote-arrow-up.mjs:
lucide/dist/esm/icons/banknote-check.mjs:
lucide/dist/esm/icons/banknote-x.mjs:
lucide/dist/esm/icons/banknote.mjs:
lucide/dist/esm/icons/barcode.mjs:
lucide/dist/esm/icons/barrel.mjs:
lucide/dist/esm/icons/baseline.mjs:
lucide/dist/esm/icons/bath.mjs:
lucide/dist/esm/icons/battery-exclamation-point.mjs:
lucide/dist/esm/icons/battery-charging.mjs:
lucide/dist/esm/icons/battery-full.mjs:
lucide/dist/esm/icons/battery-low.mjs:
lucide/dist/esm/icons/battery-medium.mjs:
lucide/dist/esm/icons/battery-plus.mjs:
lucide/dist/esm/icons/battery.mjs:
lucide/dist/esm/icons/beaker.mjs:
lucide/dist/esm/icons/bean.mjs:
lucide/dist/esm/icons/bean-off.mjs:
lucide/dist/esm/icons/bed-double.mjs:
lucide/dist/esm/icons/bed-single.mjs:
lucide/dist/esm/icons/bed.mjs:
lucide/dist/esm/icons/beef-off.mjs:
lucide/dist/esm/icons/beef.mjs:
lucide/dist/esm/icons/beer-off.mjs:
lucide/dist/esm/icons/beer.mjs:
lucide/dist/esm/icons/belarusian-ruble.mjs:
lucide/dist/esm/icons/bell-check.mjs:
lucide/dist/esm/icons/bell-dot.mjs:
lucide/dist/esm/icons/bell-electric.mjs:
lucide/dist/esm/icons/bell-minus.mjs:
lucide/dist/esm/icons/bell-plus.mjs:
lucide/dist/esm/icons/bell-off.mjs:
lucide/dist/esm/icons/bell-ring.mjs:
lucide/dist/esm/icons/bell.mjs:
lucide/dist/esm/icons/between-horizontal-end.mjs:
lucide/dist/esm/icons/between-horizontal-start.mjs:
lucide/dist/esm/icons/between-vertical-end.mjs:
lucide/dist/esm/icons/between-vertical-start.mjs:
lucide/dist/esm/icons/biceps-flexed.mjs:
lucide/dist/esm/icons/bike.mjs:
lucide/dist/esm/icons/binary.mjs:
lucide/dist/esm/icons/binoculars.mjs:
lucide/dist/esm/icons/biohazard.mjs:
lucide/dist/esm/icons/bird.mjs:
lucide/dist/esm/icons/birdhouse.mjs:
lucide/dist/esm/icons/bitcoin.mjs:
lucide/dist/esm/icons/blend.mjs:
lucide/dist/esm/icons/blender.mjs:
lucide/dist/esm/icons/blinds.mjs:
lucide/dist/esm/icons/blocks.mjs:
lucide/dist/esm/icons/bluetooth-connected.mjs:
lucide/dist/esm/icons/bluetooth-off.mjs:
lucide/dist/esm/icons/bluetooth-searching.mjs:
lucide/dist/esm/icons/bluetooth.mjs:
lucide/dist/esm/icons/bolt.mjs:
lucide/dist/esm/icons/bomb.mjs:
lucide/dist/esm/icons/bone-fracture.mjs:
lucide/dist/esm/icons/bone.mjs:
lucide/dist/esm/icons/book-a.mjs:
lucide/dist/esm/icons/book-audio.mjs:
lucide/dist/esm/icons/book-bookmark.mjs:
lucide/dist/esm/icons/book-check.mjs:
lucide/dist/esm/icons/book-copy.mjs:
lucide/dist/esm/icons/book-dashed.mjs:
lucide/dist/esm/icons/book-down.mjs:
lucide/dist/esm/icons/book-exclamation-point.mjs:
lucide/dist/esm/icons/book-headphones.mjs:
lucide/dist/esm/icons/book-heart.mjs:
lucide/dist/esm/icons/book-image.mjs:
lucide/dist/esm/icons/book-key.mjs:
lucide/dist/esm/icons/book-lock.mjs:
lucide/dist/esm/icons/book-minus.mjs:
lucide/dist/esm/icons/book-open-check.mjs:
lucide/dist/esm/icons/book-open-text.mjs:
lucide/dist/esm/icons/book-open.mjs:
lucide/dist/esm/icons/book-plus.mjs:
lucide/dist/esm/icons/book-search.mjs:
lucide/dist/esm/icons/book-text.mjs:
lucide/dist/esm/icons/book-type.mjs:
lucide/dist/esm/icons/book-up.mjs:
lucide/dist/esm/icons/book-up-2.mjs:
lucide/dist/esm/icons/book-user.mjs:
lucide/dist/esm/icons/book-x.mjs:
lucide/dist/esm/icons/book.mjs:
lucide/dist/esm/icons/bookmark-check.mjs:
lucide/dist/esm/icons/bookmark-minus.mjs:
lucide/dist/esm/icons/bookmark-off.mjs:
lucide/dist/esm/icons/bookmark-plus.mjs:
lucide/dist/esm/icons/bookmark-x.mjs:
lucide/dist/esm/icons/bookmark.mjs:
lucide/dist/esm/icons/boom-box.mjs:
lucide/dist/esm/icons/bot-message-square.mjs:
lucide/dist/esm/icons/bot-off.mjs:
lucide/dist/esm/icons/bot.mjs:
lucide/dist/esm/icons/bottle-wine.mjs:
lucide/dist/esm/icons/bow-arrow.mjs:
lucide/dist/esm/icons/box.mjs:
lucide/dist/esm/icons/boxes-linked.mjs:
lucide/dist/esm/icons/boxes.mjs:
lucide/dist/esm/icons/braces.mjs:
lucide/dist/esm/icons/brackets.mjs:
lucide/dist/esm/icons/brain-circuit.mjs:
lucide/dist/esm/icons/brain-cog.mjs:
lucide/dist/esm/icons/brain-off.mjs:
lucide/dist/esm/icons/brain.mjs:
lucide/dist/esm/icons/brick-wall-fire.mjs:
lucide/dist/esm/icons/brick-wall-shield.mjs:
lucide/dist/esm/icons/brick-wall.mjs:
lucide/dist/esm/icons/bridge.mjs:
lucide/dist/esm/icons/briefcase-business.mjs:
lucide/dist/esm/icons/briefcase-conveyor-belt.mjs:
lucide/dist/esm/icons/briefcase-medical.mjs:
lucide/dist/esm/icons/briefcase-plus.mjs:
lucide/dist/esm/icons/briefcase.mjs:
lucide/dist/esm/icons/bring-to-front.mjs:
lucide/dist/esm/icons/broccoli.mjs:
lucide/dist/esm/icons/broom-sparkles.mjs:
lucide/dist/esm/icons/broom.mjs:
lucide/dist/esm/icons/brush-cleaning.mjs:
lucide/dist/esm/icons/brush.mjs:
lucide/dist/esm/icons/bubbles.mjs:
lucide/dist/esm/icons/bug-off.mjs:
lucide/dist/esm/icons/bug-play.mjs:
lucide/dist/esm/icons/bug.mjs:
lucide/dist/esm/icons/building-complex-plus.mjs:
lucide/dist/esm/icons/building-complex.mjs:
lucide/dist/esm/icons/building.mjs:
lucide/dist/esm/icons/bus.mjs:
lucide/dist/esm/icons/bus-front.mjs:
lucide/dist/esm/icons/cable.mjs:
lucide/dist/esm/icons/cable-car.mjs:
lucide/dist/esm/icons/cake-slice.mjs:
lucide/dist/esm/icons/cake.mjs:
lucide/dist/esm/icons/calendar-1.mjs:
lucide/dist/esm/icons/calculator.mjs:
lucide/dist/esm/icons/calendar-arrow-down.mjs:
lucide/dist/esm/icons/calendar-arrow-left.mjs:
lucide/dist/esm/icons/calendar-arrow-right.mjs:
lucide/dist/esm/icons/calendar-arrow-up.mjs:
lucide/dist/esm/icons/calendar-check-2.mjs:
lucide/dist/esm/icons/calendar-chevrons-left.mjs:
lucide/dist/esm/icons/calendar-check.mjs:
lucide/dist/esm/icons/calendar-chevrons-right.mjs:
lucide/dist/esm/icons/calendar-clock.mjs:
lucide/dist/esm/icons/calendar-cog.mjs:
lucide/dist/esm/icons/calendar-days.mjs:
lucide/dist/esm/icons/calendar-fold.mjs:
lucide/dist/esm/icons/calendar-minus-2.mjs:
lucide/dist/esm/icons/calendar-heart.mjs:
lucide/dist/esm/icons/calendar-minus.mjs:
lucide/dist/esm/icons/calendar-off.mjs:
lucide/dist/esm/icons/calendar-plus-2.mjs:
lucide/dist/esm/icons/calendar-plus.mjs:
lucide/dist/esm/icons/calendar-range.mjs:
lucide/dist/esm/icons/calendar-search.mjs:
lucide/dist/esm/icons/calendar-sync.mjs:
lucide/dist/esm/icons/calendar-x-2.mjs:
lucide/dist/esm/icons/calendar-x.mjs:
lucide/dist/esm/icons/calendar.mjs:
lucide/dist/esm/icons/calendars.mjs:
lucide/dist/esm/icons/camera-off.mjs:
lucide/dist/esm/icons/camera.mjs:
lucide/dist/esm/icons/can-soda.mjs:
lucide/dist/esm/icons/can.mjs:
lucide/dist/esm/icons/candy-cane.mjs:
lucide/dist/esm/icons/candy-off.mjs:
lucide/dist/esm/icons/candy.mjs:
lucide/dist/esm/icons/cannabis-off.mjs:
lucide/dist/esm/icons/cannabis.mjs:
lucide/dist/esm/icons/captions-off.mjs:
lucide/dist/esm/icons/captions.mjs:
lucide/dist/esm/icons/car-battery.mjs:
lucide/dist/esm/icons/car-front.mjs:
lucide/dist/esm/icons/car-taxi-front.mjs:
lucide/dist/esm/icons/car.mjs:
lucide/dist/esm/icons/caravan.mjs:
lucide/dist/esm/icons/card-sim.mjs:
lucide/dist/esm/icons/carrot.mjs:
lucide/dist/esm/icons/carton-off.mjs:
lucide/dist/esm/icons/carton.mjs:
lucide/dist/esm/icons/case-lower.mjs:
lucide/dist/esm/icons/case-sensitive.mjs:
lucide/dist/esm/icons/case-upper.mjs:
lucide/dist/esm/icons/cassette-tape.mjs:
lucide/dist/esm/icons/cast.mjs:
lucide/dist/esm/icons/castle.mjs:
lucide/dist/esm/icons/cat.mjs:
lucide/dist/esm/icons/cctv-off.mjs:
lucide/dist/esm/icons/cctv.mjs:
lucide/dist/esm/icons/certificate.mjs:
lucide/dist/esm/icons/chart-area.mjs:
lucide/dist/esm/icons/chart-bar-big.mjs:
lucide/dist/esm/icons/chart-bar-decreasing.mjs:
lucide/dist/esm/icons/chart-bar-increasing.mjs:
lucide/dist/esm/icons/chart-bar.mjs:
lucide/dist/esm/icons/chart-bar-stacked.mjs:
lucide/dist/esm/icons/chart-bell-curve.mjs:
lucide/dist/esm/icons/chart-candlestick.mjs:
lucide/dist/esm/icons/chart-column-big.mjs:
lucide/dist/esm/icons/chart-column-increasing.mjs:
lucide/dist/esm/icons/chart-column-decreasing.mjs:
lucide/dist/esm/icons/chart-column-stacked.mjs:
lucide/dist/esm/icons/chart-column.mjs:
lucide/dist/esm/icons/chart-gantt.mjs:
lucide/dist/esm/icons/chart-line.mjs:
lucide/dist/esm/icons/chart-network.mjs:
lucide/dist/esm/icons/chart-no-axes-column-decreasing.mjs:
lucide/dist/esm/icons/chart-no-axes-column-increasing.mjs:
lucide/dist/esm/icons/chart-no-axes-column.mjs:
lucide/dist/esm/icons/chart-no-axes-combined.mjs:
lucide/dist/esm/icons/chart-no-axes-gantt.mjs:
lucide/dist/esm/icons/chart-pie.mjs:
lucide/dist/esm/icons/chart-quadrant.mjs:
lucide/dist/esm/icons/chart-radar.mjs:
lucide/dist/esm/icons/chart-scatter.mjs:
lucide/dist/esm/icons/chart-spline.mjs:
lucide/dist/esm/icons/check-check.mjs:
lucide/dist/esm/icons/check.mjs:
lucide/dist/esm/icons/check-line.mjs:
lucide/dist/esm/icons/chef-hat.mjs:
lucide/dist/esm/icons/cherry.mjs:
lucide/dist/esm/icons/chess-bishop.mjs:
lucide/dist/esm/icons/chess-king.mjs:
lucide/dist/esm/icons/chess-knight.mjs:
lucide/dist/esm/icons/chess-pawn.mjs:
lucide/dist/esm/icons/chevron-down.mjs:
lucide/dist/esm/icons/chess-queen.mjs:
lucide/dist/esm/icons/chess-rook.mjs:
lucide/dist/esm/icons/chevron-first.mjs:
lucide/dist/esm/icons/chevron-last.mjs:
lucide/dist/esm/icons/chevron-left.mjs:
lucide/dist/esm/icons/chevron-right.mjs:
lucide/dist/esm/icons/chevron-up.mjs:
lucide/dist/esm/icons/chevrons-down-up.mjs:
lucide/dist/esm/icons/chevrons-down.mjs:
lucide/dist/esm/icons/chevrons-left-right-ellipsis.mjs:
lucide/dist/esm/icons/chevrons-left-right.mjs:
lucide/dist/esm/icons/chevrons-left.mjs:
lucide/dist/esm/icons/chevrons-right-left.mjs:
lucide/dist/esm/icons/chevrons-right.mjs:
lucide/dist/esm/icons/chevrons-up-down.mjs:
lucide/dist/esm/icons/chevrons-up.mjs:
lucide/dist/esm/icons/church.mjs:
lucide/dist/esm/icons/cigarette-off.mjs:
lucide/dist/esm/icons/cigarette.mjs:
lucide/dist/esm/icons/circle-arrow-down.mjs:
lucide/dist/esm/icons/circle-arrow-left.mjs:
lucide/dist/esm/icons/circle-arrow-out-down-left.mjs:
lucide/dist/esm/icons/circle-arrow-out-down-right.mjs:
lucide/dist/esm/icons/circle-arrow-out-up-left.mjs:
lucide/dist/esm/icons/circle-arrow-out-up-right.mjs:
lucide/dist/esm/icons/circle-arrow-right.mjs:
lucide/dist/esm/icons/circle-arrow-up.mjs:
lucide/dist/esm/icons/circle-check-big.mjs:
lucide/dist/esm/icons/circle-check.mjs:
lucide/dist/esm/icons/circle-chevron-down.mjs:
lucide/dist/esm/icons/circle-chevron-left.mjs:
lucide/dist/esm/icons/circle-chevron-right.mjs:
lucide/dist/esm/icons/circle-chevron-up.mjs:
lucide/dist/esm/icons/circle-chevrons-down.mjs:
lucide/dist/esm/icons/circle-chevrons-left.mjs:
lucide/dist/esm/icons/circle-chevrons-right.mjs:
lucide/dist/esm/icons/circle-chevrons-up.mjs:
lucide/dist/esm/icons/circle-dashed-check.mjs:
lucide/dist/esm/icons/circle-dashed.mjs:
lucide/dist/esm/icons/circle-divide.mjs:
lucide/dist/esm/icons/circle-dollar-sign.mjs:
lucide/dist/esm/icons/circle-dot-dashed.mjs:
lucide/dist/esm/icons/circle-dot.mjs:
lucide/dist/esm/icons/circle-ellipsis.mjs:
lucide/dist/esm/icons/circle-equal.mjs:
lucide/dist/esm/icons/circle-euro.mjs:
lucide/dist/esm/icons/circle-fading-arrow-up.mjs:
lucide/dist/esm/icons/circle-exclamation-point.mjs:
lucide/dist/esm/icons/circle-fading-check.mjs:
lucide/dist/esm/icons/circle-fading-play.mjs:
lucide/dist/esm/icons/circle-fading-plus.mjs:
lucide/dist/esm/icons/circle-gauge.mjs:
lucide/dist/esm/icons/circle-letter-a.mjs:
lucide/dist/esm/icons/circle-letter-c.mjs:
lucide/dist/esm/icons/circle-letter-b.mjs:
lucide/dist/esm/icons/circle-letter-d.mjs:
lucide/dist/esm/icons/circle-letter-e.mjs:
lucide/dist/esm/icons/circle-letter-f.mjs:
lucide/dist/esm/icons/circle-letter-g.mjs:
lucide/dist/esm/icons/circle-letter-h.mjs:
lucide/dist/esm/icons/circle-letter-j.mjs:
lucide/dist/esm/icons/circle-letter-i.mjs:
lucide/dist/esm/icons/circle-letter-k.mjs:
lucide/dist/esm/icons/circle-letter-l.mjs:
lucide/dist/esm/icons/circle-letter-m.mjs:
lucide/dist/esm/icons/circle-letter-n.mjs:
lucide/dist/esm/icons/circle-letter-o.mjs:
lucide/dist/esm/icons/circle-letter-p-off.mjs:
lucide/dist/esm/icons/circle-letter-p.mjs:
lucide/dist/esm/icons/circle-letter-q.mjs:
lucide/dist/esm/icons/circle-letter-r.mjs:
lucide/dist/esm/icons/circle-letter-s.mjs:
lucide/dist/esm/icons/circle-letter-t.mjs:
lucide/dist/esm/icons/circle-letter-u.mjs:
lucide/dist/esm/icons/circle-letter-w.mjs:
lucide/dist/esm/icons/circle-letter-v.mjs:
lucide/dist/esm/icons/circle-letter-x.mjs:
lucide/dist/esm/icons/circle-letter-y.mjs:
lucide/dist/esm/icons/circle-letter-z.mjs:
lucide/dist/esm/icons/circle-minus.mjs:
lucide/dist/esm/icons/circle-off.mjs:
lucide/dist/esm/icons/circle-pause.mjs:
lucide/dist/esm/icons/circle-percent.mjs:
lucide/dist/esm/icons/circle-pile.mjs:
lucide/dist/esm/icons/circle-play.mjs:
lucide/dist/esm/icons/circle-plus.mjs:
lucide/dist/esm/icons/circle-pound-sterling.mjs:
lucide/dist/esm/icons/circle-power.mjs:
lucide/dist/esm/icons/circle-question-mark.mjs:
lucide/dist/esm/icons/circle-slash-2.mjs:
lucide/dist/esm/icons/circle-slash.mjs:
lucide/dist/esm/icons/circle-small.mjs:
lucide/dist/esm/icons/circle-star.mjs:
lucide/dist/esm/icons/circle-stop.mjs:
lucide/dist/esm/icons/circle-user-round.mjs:
lucide/dist/esm/icons/circle-user.mjs:
lucide/dist/esm/icons/circle-x.mjs:
lucide/dist/esm/icons/circle.mjs:
lucide/dist/esm/icons/circuit-board.mjs:
lucide/dist/esm/icons/citrus.mjs:
lucide/dist/esm/icons/clapperboard.mjs:
lucide/dist/esm/icons/clef-alto.mjs:
lucide/dist/esm/icons/clef-bass.mjs:
lucide/dist/esm/icons/clef-treble.mjs:
lucide/dist/esm/icons/clipboard-check.mjs:
lucide/dist/esm/icons/clipboard-clock.mjs:
lucide/dist/esm/icons/clipboard-copy.mjs:
lucide/dist/esm/icons/clipboard-list.mjs:
lucide/dist/esm/icons/clipboard-minus.mjs:
lucide/dist/esm/icons/clipboard-paste.mjs:
lucide/dist/esm/icons/clipboard-pen-line.mjs:
lucide/dist/esm/icons/clipboard-pen.mjs:
lucide/dist/esm/icons/clipboard-plus.mjs:
lucide/dist/esm/icons/clipboard-type.mjs:
lucide/dist/esm/icons/clipboard-x.mjs:
lucide/dist/esm/icons/clipboard.mjs:
lucide/dist/esm/icons/clock-1.mjs:
lucide/dist/esm/icons/clock-10.mjs:
lucide/dist/esm/icons/clock-11.mjs:
lucide/dist/esm/icons/clock-2.mjs:
lucide/dist/esm/icons/clock-12.mjs:
lucide/dist/esm/icons/clock-3.mjs:
lucide/dist/esm/icons/clock-4.mjs:
lucide/dist/esm/icons/clock-5.mjs:
lucide/dist/esm/icons/clock-6.mjs:
lucide/dist/esm/icons/clock-7.mjs:
lucide/dist/esm/icons/clock-8.mjs:
lucide/dist/esm/icons/clock-9.mjs:
lucide/dist/esm/icons/clock-arrow-down.mjs:
lucide/dist/esm/icons/clock-arrow-left.mjs:
lucide/dist/esm/icons/clock-arrow-right.mjs:
lucide/dist/esm/icons/clock-arrow-up.mjs:
lucide/dist/esm/icons/clock-check.mjs:
lucide/dist/esm/icons/clock-exclamation-point.mjs:
lucide/dist/esm/icons/clock-fading.mjs:
lucide/dist/esm/icons/clock-plus.mjs:
lucide/dist/esm/icons/clock.mjs:
lucide/dist/esm/icons/closed-caption.mjs:
lucide/dist/esm/icons/cloud-backup.mjs:
lucide/dist/esm/icons/cloud-check.mjs:
lucide/dist/esm/icons/cloud-cog.mjs:
lucide/dist/esm/icons/cloud-download.mjs:
lucide/dist/esm/icons/cloud-drizzle.mjs:
lucide/dist/esm/icons/cloud-exclamation-point.mjs:
lucide/dist/esm/icons/cloud-fog.mjs:
lucide/dist/esm/icons/cloud-lightning.mjs:
lucide/dist/esm/icons/cloud-moon-rain.mjs:
lucide/dist/esm/icons/cloud-hail.mjs:
lucide/dist/esm/icons/cloud-moon.mjs:
lucide/dist/esm/icons/cloud-off.mjs:
lucide/dist/esm/icons/cloud-rain-wind.mjs:
lucide/dist/esm/icons/cloud-rain.mjs:
lucide/dist/esm/icons/cloud-snow.mjs:
lucide/dist/esm/icons/cloud-sun-rain.mjs:
lucide/dist/esm/icons/cloud-sun.mjs:
lucide/dist/esm/icons/cloud-sync.mjs:
lucide/dist/esm/icons/cloud-upload.mjs:
lucide/dist/esm/icons/cloud.mjs:
lucide/dist/esm/icons/cloudy.mjs:
lucide/dist/esm/icons/clover.mjs:
lucide/dist/esm/icons/club.mjs:
lucide/dist/esm/icons/code-xml.mjs:
lucide/dist/esm/icons/code.mjs:
lucide/dist/esm/icons/coffee.mjs:
lucide/dist/esm/icons/coins.mjs:
lucide/dist/esm/icons/cog.mjs:
lucide/dist/esm/icons/columns-2.mjs:
lucide/dist/esm/icons/columns-3-cog.mjs:
lucide/dist/esm/icons/columns-3.mjs:
lucide/dist/esm/icons/columns-4.mjs:
lucide/dist/esm/icons/combine.mjs:
lucide/dist/esm/icons/command.mjs:
lucide/dist/esm/icons/compass.mjs:
lucide/dist/esm/icons/component.mjs:
lucide/dist/esm/icons/computer.mjs:
lucide/dist/esm/icons/concierge-bell.mjs:
lucide/dist/esm/icons/cone.mjs:
lucide/dist/esm/icons/construction.mjs:
lucide/dist/esm/icons/contact-round.mjs:
lucide/dist/esm/icons/contact.mjs:
lucide/dist/esm/icons/container.mjs:
lucide/dist/esm/icons/cookie.mjs:
lucide/dist/esm/icons/contrast.mjs:
lucide/dist/esm/icons/cooking-pot.mjs:
lucide/dist/esm/icons/copy-check.mjs:
lucide/dist/esm/icons/copy-minus.mjs:
lucide/dist/esm/icons/copy-plus.mjs:
lucide/dist/esm/icons/copy-slash.mjs:
lucide/dist/esm/icons/copy-x.mjs:
lucide/dist/esm/icons/copy.mjs:
lucide/dist/esm/icons/copyleft.mjs:
lucide/dist/esm/icons/corner-down-left.mjs:
lucide/dist/esm/icons/corner-down-right.mjs:
lucide/dist/esm/icons/corner-left-down.mjs:
lucide/dist/esm/icons/corner-left-up.mjs:
lucide/dist/esm/icons/corner-right-down.mjs:
lucide/dist/esm/icons/corner-right-up.mjs:
lucide/dist/esm/icons/corner-up-left.mjs:
lucide/dist/esm/icons/corner-up-right.mjs:
lucide/dist/esm/icons/cpu-ai.mjs:
lucide/dist/esm/icons/cpu.mjs:
lucide/dist/esm/icons/creative-commons.mjs:
lucide/dist/esm/icons/credit-card-check.mjs:
lucide/dist/esm/icons/credit-card-minus.mjs:
lucide/dist/esm/icons/credit-card-plus.mjs:
lucide/dist/esm/icons/credit-card-reader.mjs:
lucide/dist/esm/icons/credit-card-x.mjs:
lucide/dist/esm/icons/credit-card.mjs:
lucide/dist/esm/icons/croissant.mjs:
lucide/dist/esm/icons/crop.mjs:
lucide/dist/esm/icons/cross.mjs:
lucide/dist/esm/icons/crosshair.mjs:
lucide/dist/esm/icons/crown.mjs:
lucide/dist/esm/icons/cuboid.mjs:
lucide/dist/esm/icons/cup-soda.mjs:
lucide/dist/esm/icons/cupcake.mjs:
lucide/dist/esm/icons/currency.mjs:
lucide/dist/esm/icons/cylinder.mjs:
lucide/dist/esm/icons/dam.mjs:
lucide/dist/esm/icons/database-arrow-down.mjs:
lucide/dist/esm/icons/database-arrow-up.mjs:
lucide/dist/esm/icons/database-backup.mjs:
lucide/dist/esm/icons/database-check.mjs:
lucide/dist/esm/icons/database-cog.mjs:
lucide/dist/esm/icons/database-minus.mjs:
lucide/dist/esm/icons/database-plus.mjs:
lucide/dist/esm/icons/database-search.mjs:
lucide/dist/esm/icons/database-x.mjs:
lucide/dist/esm/icons/database-zap.mjs:
lucide/dist/esm/icons/database.mjs:
lucide/dist/esm/icons/decimals-arrow-left.mjs:
lucide/dist/esm/icons/decimals-arrow-right.mjs:
lucide/dist/esm/icons/delete.mjs:
lucide/dist/esm/icons/dessert.mjs:
lucide/dist/esm/icons/diagram-flow-horizontal.mjs:
lucide/dist/esm/icons/diagram-flow-vertical.mjs:
lucide/dist/esm/icons/diameter.mjs:
lucide/dist/esm/icons/diamond-minus.mjs:
lucide/dist/esm/icons/diamond-percent.mjs:
lucide/dist/esm/icons/diamond-plus.mjs:
lucide/dist/esm/icons/diamond.mjs:
lucide/dist/esm/icons/dice-1.mjs:
lucide/dist/esm/icons/dice-2.mjs:
lucide/dist/esm/icons/dice-3.mjs:
lucide/dist/esm/icons/dice-4.mjs:
lucide/dist/esm/icons/dice-5.mjs:
lucide/dist/esm/icons/dice-6.mjs:
lucide/dist/esm/icons/dices.mjs:
lucide/dist/esm/icons/diff.mjs:
lucide/dist/esm/icons/disc-3.mjs:
lucide/dist/esm/icons/disc-album.mjs:
lucide/dist/esm/icons/disc-2.mjs:
lucide/dist/esm/icons/disc.mjs:
lucide/dist/esm/icons/divide.mjs:
lucide/dist/esm/icons/dna-off.mjs:
lucide/dist/esm/icons/dna.mjs:
lucide/dist/esm/icons/dock.mjs:
lucide/dist/esm/icons/dog.mjs:
lucide/dist/esm/icons/dollar-sign.mjs:
lucide/dist/esm/icons/dome.mjs:
lucide/dist/esm/icons/donut.mjs:
lucide/dist/esm/icons/door-closed-cog.mjs:
lucide/dist/esm/icons/door-closed-locked.mjs:
lucide/dist/esm/icons/door-closed-package.mjs:
lucide/dist/esm/icons/door-closed.mjs:
lucide/dist/esm/icons/door-open.mjs:
lucide/dist/esm/icons/dot.mjs:
lucide/dist/esm/icons/door-stairwell.mjs:
lucide/dist/esm/icons/download.mjs:
lucide/dist/esm/icons/drama.mjs:
lucide/dist/esm/icons/drafting-compass.mjs:
lucide/dist/esm/icons/drill.mjs:
lucide/dist/esm/icons/drone.mjs:
lucide/dist/esm/icons/droplet-off.mjs:
lucide/dist/esm/icons/droplet.mjs:
lucide/dist/esm/icons/droplets.mjs:
lucide/dist/esm/icons/drum.mjs:
lucide/dist/esm/icons/drumstick.mjs:
lucide/dist/esm/icons/dumbbell.mjs:
lucide/dist/esm/icons/ear-off.mjs:
lucide/dist/esm/icons/ear.mjs:
lucide/dist/esm/icons/earbuds-off.mjs:
lucide/dist/esm/icons/earbuds.mjs:
lucide/dist/esm/icons/earth-lock.mjs:
lucide/dist/esm/icons/earth.mjs:
lucide/dist/esm/icons/eclipse.mjs:
lucide/dist/esm/icons/egg-off.mjs:
lucide/dist/esm/icons/egg-fried.mjs:
lucide/dist/esm/icons/egg.mjs:
lucide/dist/esm/icons/eighth-note.mjs:
lucide/dist/esm/icons/eighth-notes.mjs:
lucide/dist/esm/icons/eject.mjs:
lucide/dist/esm/icons/ellipse.mjs:
lucide/dist/esm/icons/ellipsis-vertical.mjs:
lucide/dist/esm/icons/ellipsis.mjs:
lucide/dist/esm/icons/emirati-dirham.mjs:
lucide/dist/esm/icons/engine.mjs:
lucide/dist/esm/icons/equal-approximately-not.mjs:
lucide/dist/esm/icons/equal-approximately.mjs:
lucide/dist/esm/icons/equal-not.mjs:
lucide/dist/esm/icons/equal.mjs:
lucide/dist/esm/icons/eraser.mjs:
lucide/dist/esm/icons/euro.mjs:
lucide/dist/esm/icons/ethernet-port.mjs:
lucide/dist/esm/icons/ev-charger.mjs:
lucide/dist/esm/icons/expand.mjs:
lucide/dist/esm/icons/external-link.mjs:
lucide/dist/esm/icons/eye-closed.mjs:
lucide/dist/esm/icons/eye-dashed.mjs:
lucide/dist/esm/icons/eye-off.mjs:
lucide/dist/esm/icons/eye.mjs:
lucide/dist/esm/icons/face-angry.mjs:
lucide/dist/esm/icons/face-expressionless.mjs:
lucide/dist/esm/icons/face-grinning.mjs:
lucide/dist/esm/icons/face-neutral.mjs:
lucide/dist/esm/icons/face-slightly-frowning.mjs:
lucide/dist/esm/icons/face-slightly-smiling-plus.mjs:
lucide/dist/esm/icons/factory.mjs:
lucide/dist/esm/icons/face-slightly-smiling.mjs:
lucide/dist/esm/icons/fan.mjs:
lucide/dist/esm/icons/fast-forward.mjs:
lucide/dist/esm/icons/faucet.mjs:
lucide/dist/esm/icons/feather.mjs:
lucide/dist/esm/icons/fence.mjs:
lucide/dist/esm/icons/ferris-wheel.mjs:
lucide/dist/esm/icons/file-archive.mjs:
lucide/dist/esm/icons/file-axis-3d.mjs:
lucide/dist/esm/icons/file-badge.mjs:
lucide/dist/esm/icons/file-box.mjs:
lucide/dist/esm/icons/file-braces-corner.mjs:
lucide/dist/esm/icons/file-braces.mjs:
lucide/dist/esm/icons/file-chart-column-increasing.mjs:
lucide/dist/esm/icons/file-chart-column.mjs:
lucide/dist/esm/icons/file-chart-line.mjs:
lucide/dist/esm/icons/file-chart-pie.mjs:
lucide/dist/esm/icons/file-check-corner.mjs:
lucide/dist/esm/icons/file-check.mjs:
lucide/dist/esm/icons/file-clock.mjs:
lucide/dist/esm/icons/file-code-corner.mjs:
lucide/dist/esm/icons/file-code.mjs:
lucide/dist/esm/icons/file-cog.mjs:
lucide/dist/esm/icons/file-database.mjs:
lucide/dist/esm/icons/file-diff.mjs:
lucide/dist/esm/icons/file-digit.mjs:
lucide/dist/esm/icons/file-down.mjs:
lucide/dist/esm/icons/file-exclamation-point.mjs:
lucide/dist/esm/icons/file-headphone.mjs:
lucide/dist/esm/icons/file-heart.mjs:
lucide/dist/esm/icons/file-image.mjs:
lucide/dist/esm/icons/file-input.mjs:
lucide/dist/esm/icons/file-key.mjs:
lucide/dist/esm/icons/file-lock.mjs:
lucide/dist/esm/icons/file-minus-corner.mjs:
lucide/dist/esm/icons/file-minus.mjs:
lucide/dist/esm/icons/file-output.mjs:
lucide/dist/esm/icons/file-music.mjs:
lucide/dist/esm/icons/file-pen-line.mjs:
lucide/dist/esm/icons/file-pen.mjs:
lucide/dist/esm/icons/file-play.mjs:
lucide/dist/esm/icons/file-plus-corner.mjs:
lucide/dist/esm/icons/file-plus.mjs:
lucide/dist/esm/icons/file-question-mark.mjs:
lucide/dist/esm/icons/file-scan.mjs:
lucide/dist/esm/icons/file-search-corner.mjs:
lucide/dist/esm/icons/file-search.mjs:
lucide/dist/esm/icons/file-signal.mjs:
lucide/dist/esm/icons/file-sliders.mjs:
lucide/dist/esm/icons/file-spreadsheet.mjs:
lucide/dist/esm/icons/file-stack.mjs:
lucide/dist/esm/icons/file-symlink.mjs:
lucide/dist/esm/icons/file-terminal.mjs:
lucide/dist/esm/icons/file-text.mjs:
lucide/dist/esm/icons/file-type-corner.mjs:
lucide/dist/esm/icons/file-type.mjs:
lucide/dist/esm/icons/file-up.mjs:
lucide/dist/esm/icons/file-user.mjs:
lucide/dist/esm/icons/file-video-camera.mjs:
lucide/dist/esm/icons/file-volume.mjs:
lucide/dist/esm/icons/file-x-corner.mjs:
lucide/dist/esm/icons/file-x.mjs:
lucide/dist/esm/icons/file.mjs:
lucide/dist/esm/icons/files.mjs:
lucide/dist/esm/icons/film.mjs:
lucide/dist/esm/icons/fingerprint-pattern.mjs:
lucide/dist/esm/icons/fire-extinguisher.mjs:
lucide/dist/esm/icons/fish-off.mjs:
lucide/dist/esm/icons/fish-symbol.mjs:
lucide/dist/esm/icons/fish.mjs:
lucide/dist/esm/icons/fishing-hook.mjs:
lucide/dist/esm/icons/fishing-rod.mjs:
lucide/dist/esm/icons/flag-off.mjs:
lucide/dist/esm/icons/flag-triangle-left.mjs:
lucide/dist/esm/icons/flag-triangle-right.mjs:
lucide/dist/esm/icons/flag.mjs:
lucide/dist/esm/icons/flame-kindling.mjs:
lucide/dist/esm/icons/flame.mjs:
lucide/dist/esm/icons/flashlight.mjs:
lucide/dist/esm/icons/flask-conical-off.mjs:
lucide/dist/esm/icons/flashlight-off.mjs:
lucide/dist/esm/icons/flask-conical.mjs:
lucide/dist/esm/icons/flask-round.mjs:
lucide/dist/esm/icons/flower.mjs:
lucide/dist/esm/icons/flower-2.mjs:
lucide/dist/esm/icons/focus.mjs:
lucide/dist/esm/icons/fold-horizontal.mjs:
lucide/dist/esm/icons/fold-vertical.mjs:
lucide/dist/esm/icons/folder-bookmark.mjs:
lucide/dist/esm/icons/folder-archive.mjs:
lucide/dist/esm/icons/folder-check.mjs:
lucide/dist/esm/icons/folder-clock.mjs:
lucide/dist/esm/icons/folder-closed.mjs:
lucide/dist/esm/icons/folder-code.mjs:
lucide/dist/esm/icons/folder-cog.mjs:
lucide/dist/esm/icons/folder-dot.mjs:
lucide/dist/esm/icons/folder-down.mjs:
lucide/dist/esm/icons/folder-git-2.mjs:
lucide/dist/esm/icons/folder-git.mjs:
lucide/dist/esm/icons/folder-heart.mjs:
lucide/dist/esm/icons/folder-input.mjs:
lucide/dist/esm/icons/folder-kanban.mjs:
lucide/dist/esm/icons/folder-key.mjs:
lucide/dist/esm/icons/folder-lock.mjs:
lucide/dist/esm/icons/folder-minus.mjs:
lucide/dist/esm/icons/folder-open-dot.mjs:
lucide/dist/esm/icons/folder-output.mjs:
lucide/dist/esm/icons/folder-open.mjs:
lucide/dist/esm/icons/folder-pen.mjs:
lucide/dist/esm/icons/folder-plus.mjs:
lucide/dist/esm/icons/folder-root.mjs:
lucide/dist/esm/icons/folder-search-2.mjs:
lucide/dist/esm/icons/folder-search.mjs:
lucide/dist/esm/icons/folder-symlink.mjs:
lucide/dist/esm/icons/folder-sync.mjs:
lucide/dist/esm/icons/folder-tree.mjs:
lucide/dist/esm/icons/folder-user.mjs:
lucide/dist/esm/icons/folder-up.mjs:
lucide/dist/esm/icons/folder-users.mjs:
lucide/dist/esm/icons/folder.mjs:
lucide/dist/esm/icons/folder-x.mjs:
lucide/dist/esm/icons/folders.mjs:
lucide/dist/esm/icons/footprints.mjs:
lucide/dist/esm/icons/forklift.mjs:
lucide/dist/esm/icons/form.mjs:
lucide/dist/esm/icons/frame.mjs:
lucide/dist/esm/icons/forward.mjs:
lucide/dist/esm/icons/fuel.mjs:
lucide/dist/esm/icons/fullscreen.mjs:
lucide/dist/esm/icons/funnel-plus.mjs:
lucide/dist/esm/icons/funnel-x.mjs:
lucide/dist/esm/icons/funnel.mjs:
lucide/dist/esm/icons/galaxy.mjs:
lucide/dist/esm/icons/gallery-horizontal-end.mjs:
lucide/dist/esm/icons/gallery-horizontal.mjs:
lucide/dist/esm/icons/gallery-thumbnails.mjs:
lucide/dist/esm/icons/gallery-vertical-end.mjs:
lucide/dist/esm/icons/gallery-vertical.mjs:
lucide/dist/esm/icons/gamepad-2.mjs:
lucide/dist/esm/icons/gamepad-directional.mjs:
lucide/dist/esm/icons/gamepad.mjs:
lucide/dist/esm/icons/gap-vertical.mjs:
lucide/dist/esm/icons/gap-horizontal.mjs:
lucide/dist/esm/icons/gauge.mjs:
lucide/dist/esm/icons/gavel.mjs:
lucide/dist/esm/icons/gem.mjs:
lucide/dist/esm/icons/georgian-lari.mjs:
lucide/dist/esm/icons/germ-off.mjs:
lucide/dist/esm/icons/germ.mjs:
lucide/dist/esm/icons/ghost.mjs:
lucide/dist/esm/icons/gift.mjs:
lucide/dist/esm/icons/git-branch-minus.mjs:
lucide/dist/esm/icons/git-branch.mjs:
lucide/dist/esm/icons/git-branch-plus.mjs:
lucide/dist/esm/icons/git-commit-horizontal.mjs:
lucide/dist/esm/icons/git-commit-vertical.mjs:
lucide/dist/esm/icons/git-compare-arrows.mjs:
lucide/dist/esm/icons/git-compare.mjs:
lucide/dist/esm/icons/git-fork.mjs:
lucide/dist/esm/icons/git-graph.mjs:
lucide/dist/esm/icons/git-merge-conflict.mjs:
lucide/dist/esm/icons/git-merge.mjs:
lucide/dist/esm/icons/git-pull-request-arrow.mjs:
lucide/dist/esm/icons/git-pull-request-closed.mjs:
lucide/dist/esm/icons/git-pull-request-create-arrow.mjs:
lucide/dist/esm/icons/git-pull-request-create.mjs:
lucide/dist/esm/icons/git-pull-request-draft.mjs:
lucide/dist/esm/icons/git-pull-request.mjs:
lucide/dist/esm/icons/glasses.mjs:
lucide/dist/esm/icons/glass-water.mjs:
lucide/dist/esm/icons/globe-ban.mjs:
lucide/dist/esm/icons/globe-check.mjs:
lucide/dist/esm/icons/globe-code.mjs:
lucide/dist/esm/icons/globe-lock.mjs:
lucide/dist/esm/icons/globe-off.mjs:
lucide/dist/esm/icons/globe-plus.mjs:
lucide/dist/esm/icons/globe-x.mjs:
lucide/dist/esm/icons/globe.mjs:
lucide/dist/esm/icons/goal.mjs:
lucide/dist/esm/icons/gpu.mjs:
lucide/dist/esm/icons/graduation-cap.mjs:
lucide/dist/esm/icons/grape.mjs:
lucide/dist/esm/icons/graph-hub.mjs:
lucide/dist/esm/icons/graph-star.mjs:
lucide/dist/esm/icons/grid-2x2-check.mjs:
lucide/dist/esm/icons/grid-2x2-plus.mjs:
lucide/dist/esm/icons/grid-2x2-x.mjs:
lucide/dist/esm/icons/grid-2x2.mjs:
lucide/dist/esm/icons/grid-3x2.mjs:
lucide/dist/esm/icons/grid-3x3.mjs:
lucide/dist/esm/icons/grip-horizontal.mjs:
lucide/dist/esm/icons/grip-vertical.mjs:
lucide/dist/esm/icons/grip.mjs:
lucide/dist/esm/icons/groceries.mjs:
lucide/dist/esm/icons/group.mjs:
lucide/dist/esm/icons/guitar-electric.mjs:
lucide/dist/esm/icons/guitar.mjs:
lucide/dist/esm/icons/half-note.mjs:
lucide/dist/esm/icons/ham.mjs:
lucide/dist/esm/icons/hamburger.mjs:
lucide/dist/esm/icons/hammer.mjs:
lucide/dist/esm/icons/hand-coins.mjs:
lucide/dist/esm/icons/hand-fist.mjs:
lucide/dist/esm/icons/hand-grab.mjs:
lucide/dist/esm/icons/hand-heart.mjs:
lucide/dist/esm/icons/hand-helping.mjs:
lucide/dist/esm/icons/hand-metal.mjs:
lucide/dist/esm/icons/hand-platter.mjs:
lucide/dist/esm/icons/hand.mjs:
lucide/dist/esm/icons/handbag.mjs:
lucide/dist/esm/icons/handle-bottom-right.mjs:
lucide/dist/esm/icons/handshake.mjs:
lucide/dist/esm/icons/hard-drive-download.mjs:
lucide/dist/esm/icons/hard-drive-upload.mjs:
lucide/dist/esm/icons/hard-drive.mjs:
lucide/dist/esm/icons/hard-hat.mjs:
lucide/dist/esm/icons/hash.mjs:
lucide/dist/esm/icons/hat-glasses.mjs:
lucide/dist/esm/icons/haze.mjs:
lucide/dist/esm/icons/hd.mjs:
lucide/dist/esm/icons/hdmi-port.mjs:
lucide/dist/esm/icons/heading-1.mjs:
lucide/dist/esm/icons/heading-2.mjs:
lucide/dist/esm/icons/heading-3.mjs:
lucide/dist/esm/icons/heading-4.mjs:
lucide/dist/esm/icons/heading-5.mjs:
lucide/dist/esm/icons/headphone-off.mjs:
lucide/dist/esm/icons/heading-6.mjs:
lucide/dist/esm/icons/headphones.mjs:
lucide/dist/esm/icons/headset.mjs:
lucide/dist/esm/icons/heart-crack.mjs:
lucide/dist/esm/icons/heart-handshake.mjs:
lucide/dist/esm/icons/heart-minus.mjs:
lucide/dist/esm/icons/heart-off.mjs:
lucide/dist/esm/icons/heart-plus.mjs:
lucide/dist/esm/icons/heart-pulse.mjs:
lucide/dist/esm/icons/heart-x.mjs:
lucide/dist/esm/icons/heart.mjs:
lucide/dist/esm/icons/heater.mjs:
lucide/dist/esm/icons/helicopter.mjs:
lucide/dist/esm/icons/hexagon.mjs:
lucide/dist/esm/icons/highlighter.mjs:
lucide/dist/esm/icons/hiking-stick.mjs:
lucide/dist/esm/icons/hockey-stick.mjs:
lucide/dist/esm/icons/hop-off.mjs:
lucide/dist/esm/icons/hop.mjs:
lucide/dist/esm/icons/hospital.mjs:
lucide/dist/esm/icons/hot-air-balloon.mjs:
lucide/dist/esm/icons/hotel.mjs:
lucide/dist/esm/icons/hourglass-cog.mjs:
lucide/dist/esm/icons/hourglass.mjs:
lucide/dist/esm/icons/house-cog.mjs:
lucide/dist/esm/icons/house-heart.mjs:
lucide/dist/esm/icons/house-plug.mjs:
lucide/dist/esm/icons/house-plus.mjs:
lucide/dist/esm/icons/house-wifi.mjs:
lucide/dist/esm/icons/house.mjs:
lucide/dist/esm/icons/houses.mjs:
lucide/dist/esm/icons/ice-cream-bowl.mjs:
lucide/dist/esm/icons/ice-cream-cone.mjs:
lucide/dist/esm/icons/id-card-lanyard.mjs:
lucide/dist/esm/icons/id-card.mjs:
lucide/dist/esm/icons/image-down.mjs:
lucide/dist/esm/icons/image-minus.mjs:
lucide/dist/esm/icons/image-off.mjs:
lucide/dist/esm/icons/image-play.mjs:
lucide/dist/esm/icons/image-up.mjs:
lucide/dist/esm/icons/image-plus.mjs:
lucide/dist/esm/icons/image-upscale.mjs:
lucide/dist/esm/icons/image.mjs:
lucide/dist/esm/icons/images.mjs:
lucide/dist/esm/icons/import.mjs:
lucide/dist/esm/icons/inbox.mjs:
lucide/dist/esm/icons/indian-rupee.mjs:
lucide/dist/esm/icons/infinity.mjs:
lucide/dist/esm/icons/info.mjs:
lucide/dist/esm/icons/inspection-panel.mjs:
lucide/dist/esm/icons/italic.mjs:
lucide/dist/esm/icons/iteration-ccw.mjs:
lucide/dist/esm/icons/iteration-cw.mjs:
lucide/dist/esm/icons/iv-bag.mjs:
lucide/dist/esm/icons/japanese-yen.mjs:
lucide/dist/esm/icons/joystick.mjs:
lucide/dist/esm/icons/kanban.mjs:
lucide/dist/esm/icons/kayak.mjs:
lucide/dist/esm/icons/kazakh-tenge.mjs:
lucide/dist/esm/icons/key-round.mjs:
lucide/dist/esm/icons/key-square.mjs:
lucide/dist/esm/icons/key.mjs:
lucide/dist/esm/icons/keyboard-music.mjs:
lucide/dist/esm/icons/keyboard-off.mjs:
lucide/dist/esm/icons/keyboard.mjs:
lucide/dist/esm/icons/lambda.mjs:
lucide/dist/esm/icons/lamp-ceiling.mjs:
lucide/dist/esm/icons/lamp-desk.mjs:
lucide/dist/esm/icons/lamp-floor.mjs:
lucide/dist/esm/icons/lamp-wall-down.mjs:
lucide/dist/esm/icons/lamp-wall-up.mjs:
lucide/dist/esm/icons/lamp.mjs:
lucide/dist/esm/icons/land-plot.mjs:
lucide/dist/esm/icons/landmark.mjs:
lucide/dist/esm/icons/languages.mjs:
lucide/dist/esm/icons/laptop-minimal-check.mjs:
lucide/dist/esm/icons/laptop-minimal.mjs:
lucide/dist/esm/icons/laptop.mjs:
lucide/dist/esm/icons/lasso-select.mjs:
lucide/dist/esm/icons/laser.mjs:
lucide/dist/esm/icons/lasso.mjs:
lucide/dist/esm/icons/layer-arrow-down.mjs:
lucide/dist/esm/icons/layer-arrow-up.mjs:
lucide/dist/esm/icons/layers-2.mjs:
lucide/dist/esm/icons/layers-arrow-down.mjs:
lucide/dist/esm/icons/layers-arrow-up.mjs:
lucide/dist/esm/icons/layers-minus.mjs:
lucide/dist/esm/icons/layers-plus.mjs:
lucide/dist/esm/icons/layers.mjs:
lucide/dist/esm/icons/layout-arrow-down.mjs:
lucide/dist/esm/icons/layout-arrow-right.mjs:
lucide/dist/esm/icons/layout-dashboard.mjs:
lucide/dist/esm/icons/layout-freeform.mjs:
lucide/dist/esm/icons/layout-grid-circles.mjs:
lucide/dist/esm/icons/layout-grid.mjs:
lucide/dist/esm/icons/layout-list.mjs:
lucide/dist/esm/icons/layout-panel-left.mjs:
lucide/dist/esm/icons/layout-panel-top.mjs:
lucide/dist/esm/icons/layout-template.mjs:
lucide/dist/esm/icons/leaf.mjs:
lucide/dist/esm/icons/leafy-green.mjs:
lucide/dist/esm/icons/lectern.mjs:
lucide/dist/esm/icons/lens-concave.mjs:
lucide/dist/esm/icons/lens-convex.mjs:
lucide/dist/esm/icons/lens.mjs:
lucide/dist/esm/icons/letter-a.mjs:
lucide/dist/esm/icons/letter-b.mjs:
lucide/dist/esm/icons/letter-c.mjs:
lucide/dist/esm/icons/letter-d.mjs:
lucide/dist/esm/icons/letter-e.mjs:
lucide/dist/esm/icons/letter-f.mjs:
lucide/dist/esm/icons/letter-g.mjs:
lucide/dist/esm/icons/letter-h.mjs:
lucide/dist/esm/icons/letter-i.mjs:
lucide/dist/esm/icons/letter-j.mjs:
lucide/dist/esm/icons/letter-k.mjs:
lucide/dist/esm/icons/letter-l.mjs:
lucide/dist/esm/icons/letter-m.mjs:
lucide/dist/esm/icons/letter-n.mjs:
lucide/dist/esm/icons/letter-o.mjs:
lucide/dist/esm/icons/letter-p.mjs:
lucide/dist/esm/icons/letter-q.mjs:
lucide/dist/esm/icons/letter-r.mjs:
lucide/dist/esm/icons/letter-s.mjs:
lucide/dist/esm/icons/letter-t.mjs:
lucide/dist/esm/icons/letter-spacing.mjs:
lucide/dist/esm/icons/letter-u.mjs:
lucide/dist/esm/icons/letter-v.mjs:
lucide/dist/esm/icons/letter-w.mjs:
lucide/dist/esm/icons/letter-x.mjs:
lucide/dist/esm/icons/letter-y.mjs:
lucide/dist/esm/icons/letter-z.mjs:
lucide/dist/esm/icons/library-big.mjs:
lucide/dist/esm/icons/letters.mjs:
lucide/dist/esm/icons/library.mjs:
lucide/dist/esm/icons/life-buoy.mjs:
lucide/dist/esm/icons/ligature.mjs:
lucide/dist/esm/icons/lightbulb-off.mjs:
lucide/dist/esm/icons/lightbulb.mjs:
lucide/dist/esm/icons/lighthouse.mjs:
lucide/dist/esm/icons/line-dot-bottom-vertical.mjs:
lucide/dist/esm/icons/line-dot-left-horizontal.mjs:
lucide/dist/esm/icons/line-dot-right-horizontal.mjs:
lucide/dist/esm/icons/line-dot-top-vertical.mjs:
lucide/dist/esm/icons/line-height.mjs:
lucide/dist/esm/icons/line-squiggle.mjs:
lucide/dist/esm/icons/line-style.mjs:
lucide/dist/esm/icons/link-2-off.mjs:
lucide/dist/esm/icons/link.mjs:
lucide/dist/esm/icons/link-2.mjs:
lucide/dist/esm/icons/list-check.mjs:
lucide/dist/esm/icons/list-checks.mjs:
lucide/dist/esm/icons/list-chevrons-down-up.mjs:
lucide/dist/esm/icons/list-chevrons-up-down.mjs:
lucide/dist/esm/icons/list-clock.mjs:
lucide/dist/esm/icons/list-collapse.mjs:
lucide/dist/esm/icons/list-end.mjs:
lucide/dist/esm/icons/list-filter-plus.mjs:
lucide/dist/esm/icons/list-filter.mjs:
lucide/dist/esm/icons/list-indent-decrease.mjs:
lucide/dist/esm/icons/list-indent-increase.mjs:
lucide/dist/esm/icons/list-minus.mjs:
lucide/dist/esm/icons/list-music.mjs:
lucide/dist/esm/icons/list-ordered.mjs:
lucide/dist/esm/icons/list-plus.mjs:
lucide/dist/esm/icons/list-restart.mjs:
lucide/dist/esm/icons/list-sort-ascending.mjs:
lucide/dist/esm/icons/list-sort-descending.mjs:
lucide/dist/esm/icons/list-start.mjs:
lucide/dist/esm/icons/list-todo.mjs:
lucide/dist/esm/icons/list-tree.mjs:
lucide/dist/esm/icons/list-video.mjs:
lucide/dist/esm/icons/list-x.mjs:
lucide/dist/esm/icons/list.mjs:
lucide/dist/esm/icons/loader-circle.mjs:
lucide/dist/esm/icons/loader-pinwheel.mjs:
lucide/dist/esm/icons/loader.mjs:
lucide/dist/esm/icons/locate-off.mjs:
lucide/dist/esm/icons/locate-fixed.mjs:
lucide/dist/esm/icons/locate.mjs:
lucide/dist/esm/icons/lock-keyhole-open.mjs:
lucide/dist/esm/icons/lock-keyhole.mjs:
lucide/dist/esm/icons/lock-open.mjs:
lucide/dist/esm/icons/lock.mjs:
lucide/dist/esm/icons/log-in.mjs:
lucide/dist/esm/icons/log-out.mjs:
lucide/dist/esm/icons/logs.mjs:
lucide/dist/esm/icons/lollipop.mjs:
lucide/dist/esm/icons/luggage.mjs:
lucide/dist/esm/icons/magnet.mjs:
lucide/dist/esm/icons/mail-badge.mjs:
lucide/dist/esm/icons/mail-check.mjs:
lucide/dist/esm/icons/mail-clock.mjs:
lucide/dist/esm/icons/mail-dot.mjs:
lucide/dist/esm/icons/mail-exclamation-point.mjs:
lucide/dist/esm/icons/mail-minus.mjs:
lucide/dist/esm/icons/mail-open.mjs:
lucide/dist/esm/icons/mail-pen.mjs:
lucide/dist/esm/icons/mail-plus.mjs:
lucide/dist/esm/icons/mail-question-mark.mjs:
lucide/dist/esm/icons/mail-search.mjs:
lucide/dist/esm/icons/mail-x.mjs:
lucide/dist/esm/icons/mail.mjs:
lucide/dist/esm/icons/mailbox.mjs:
lucide/dist/esm/icons/mails.mjs:
lucide/dist/esm/icons/mango.mjs:
lucide/dist/esm/icons/map-minus.mjs:
lucide/dist/esm/icons/map-pin-check-inside.mjs:
lucide/dist/esm/icons/map-pin-check.mjs:
lucide/dist/esm/icons/map-pin-house.mjs:
lucide/dist/esm/icons/map-pin-minus-inside.mjs:
lucide/dist/esm/icons/map-pin-minus.mjs:
lucide/dist/esm/icons/map-pin-off.mjs:
lucide/dist/esm/icons/map-pin-pen.mjs:
lucide/dist/esm/icons/map-pin-plus-inside.mjs:
lucide/dist/esm/icons/map-pin-plus.mjs:
lucide/dist/esm/icons/map-pin-search.mjs:
lucide/dist/esm/icons/map-pin-x-inside.mjs:
lucide/dist/esm/icons/map-pin-x.mjs:
lucide/dist/esm/icons/map-pin.mjs:
lucide/dist/esm/icons/map-pinned.mjs:
lucide/dist/esm/icons/map-plus.mjs:
lucide/dist/esm/icons/map.mjs:
lucide/dist/esm/icons/margin-bottom.mjs:
lucide/dist/esm/icons/margin-horizontal.mjs:
lucide/dist/esm/icons/margin-left.mjs:
lucide/dist/esm/icons/margin-right.mjs:
lucide/dist/esm/icons/margin-top.mjs:
lucide/dist/esm/icons/margin-vertical.mjs:
lucide/dist/esm/icons/margin.mjs:
lucide/dist/esm/icons/mars-stroke.mjs:
lucide/dist/esm/icons/mars.mjs:
lucide/dist/esm/icons/martini.mjs:
lucide/dist/esm/icons/maximize-2.mjs:
lucide/dist/esm/icons/maximize.mjs:
lucide/dist/esm/icons/medal.mjs:
lucide/dist/esm/icons/megaphone-off.mjs:
lucide/dist/esm/icons/megaphone.mjs:
lucide/dist/esm/icons/memory-stick.mjs:
lucide/dist/esm/icons/menu.mjs:
lucide/dist/esm/icons/merge.mjs:
lucide/dist/esm/icons/message-circle-check.mjs:
lucide/dist/esm/icons/message-circle-dashed-check.mjs:
lucide/dist/esm/icons/message-circle-dashed.mjs:
lucide/dist/esm/icons/message-circle-code.mjs:
lucide/dist/esm/icons/message-circle-exclamation-point.mjs:
lucide/dist/esm/icons/message-circle-heart.mjs:
lucide/dist/esm/icons/message-circle-more.mjs:
lucide/dist/esm/icons/message-circle-off.mjs:
lucide/dist/esm/icons/message-circle-plus.mjs:
lucide/dist/esm/icons/message-circle-question-mark.mjs:
lucide/dist/esm/icons/message-circle-reply.mjs:
lucide/dist/esm/icons/message-circle-text.mjs:
lucide/dist/esm/icons/message-circle-x.mjs:
lucide/dist/esm/icons/message-circle.mjs:
lucide/dist/esm/icons/message-square-check.mjs:
lucide/dist/esm/icons/message-square-code.mjs:
lucide/dist/esm/icons/message-square-dashed.mjs:
lucide/dist/esm/icons/message-square-diff.mjs:
lucide/dist/esm/icons/message-square-dot.mjs:
lucide/dist/esm/icons/message-square-exclamation-point.mjs:
lucide/dist/esm/icons/message-square-heart.mjs:
lucide/dist/esm/icons/message-square-lock.mjs:
lucide/dist/esm/icons/message-square-more.mjs:
lucide/dist/esm/icons/message-square-off.mjs:
lucide/dist/esm/icons/message-square-plus.mjs:
lucide/dist/esm/icons/message-square-quote.mjs:
lucide/dist/esm/icons/message-square-reply.mjs:
lucide/dist/esm/icons/message-square-share.mjs:
lucide/dist/esm/icons/message-square-text.mjs:
lucide/dist/esm/icons/message-square-x.mjs:
lucide/dist/esm/icons/message-square.mjs:
lucide/dist/esm/icons/messages-circle.mjs:
lucide/dist/esm/icons/messages-square.mjs:
lucide/dist/esm/icons/metronome.mjs:
lucide/dist/esm/icons/mic-off.mjs:
lucide/dist/esm/icons/mic-audio-lines.mjs:
lucide/dist/esm/icons/mic-signal.mjs:
lucide/dist/esm/icons/mic-vocal.mjs:
lucide/dist/esm/icons/mic.mjs:
lucide/dist/esm/icons/microchip.mjs:
lucide/dist/esm/icons/microscope.mjs:
lucide/dist/esm/icons/microwave.mjs:
lucide/dist/esm/icons/midi-port.mjs:
lucide/dist/esm/icons/milestone.mjs:
lucide/dist/esm/icons/milk-off.mjs:
lucide/dist/esm/icons/milk.mjs:
lucide/dist/esm/icons/minimize-2.mjs:
lucide/dist/esm/icons/minimize.mjs:
lucide/dist/esm/icons/minus.mjs:
lucide/dist/esm/icons/mirror-rectangular.mjs:
lucide/dist/esm/icons/mirror-round.mjs:
lucide/dist/esm/icons/monitor-activity.mjs:
lucide/dist/esm/icons/monitor-check.mjs:
lucide/dist/esm/icons/monitor-cloud.mjs:
lucide/dist/esm/icons/monitor-cog.mjs:
lucide/dist/esm/icons/monitor-dot.mjs:
lucide/dist/esm/icons/monitor-down.mjs:
lucide/dist/esm/icons/monitor-pause.mjs:
lucide/dist/esm/icons/monitor-off.mjs:
lucide/dist/esm/icons/monitor-pc.mjs:
lucide/dist/esm/icons/monitor-play.mjs:
lucide/dist/esm/icons/monitor-smartphone.mjs:
lucide/dist/esm/icons/monitor-speaker.mjs:
lucide/dist/esm/icons/monitor-stop.mjs:
lucide/dist/esm/icons/monitor-up.mjs:
lucide/dist/esm/icons/monitor-x.mjs:
lucide/dist/esm/icons/monitor.mjs:
lucide/dist/esm/icons/moon-star.mjs:
lucide/dist/esm/icons/moon.mjs:
lucide/dist/esm/icons/mop.mjs:
lucide/dist/esm/icons/mop-sparkles.mjs:
lucide/dist/esm/icons/mosque.mjs:
lucide/dist/esm/icons/motorbike.mjs:
lucide/dist/esm/icons/mountain-snow.mjs:
lucide/dist/esm/icons/mountain.mjs:
lucide/dist/esm/icons/mouse-left.mjs:
lucide/dist/esm/icons/mouse-off.mjs:
lucide/dist/esm/icons/mouse-pointer-2.mjs:
lucide/dist/esm/icons/mouse-pointer-2-off.mjs:
lucide/dist/esm/icons/mouse-pointer-ban.mjs:
lucide/dist/esm/icons/mouse-pointer-click.mjs:
lucide/dist/esm/icons/mouse-pointer.mjs:
lucide/dist/esm/icons/mouse-right.mjs:
lucide/dist/esm/icons/mouse.mjs:
lucide/dist/esm/icons/mouth-off.mjs:
lucide/dist/esm/icons/mouth.mjs:
lucide/dist/esm/icons/move-3d.mjs:
lucide/dist/esm/icons/move-diagonal-2.mjs:
lucide/dist/esm/icons/move-diagonal.mjs:
lucide/dist/esm/icons/move-down-right.mjs:
lucide/dist/esm/icons/move-down-left.mjs:
lucide/dist/esm/icons/move-down.mjs:
lucide/dist/esm/icons/move-horizontal.mjs:
lucide/dist/esm/icons/move-left.mjs:
lucide/dist/esm/icons/move-right.mjs:
lucide/dist/esm/icons/move-up-left.mjs:
lucide/dist/esm/icons/move-up-right.mjs:
lucide/dist/esm/icons/move-up.mjs:
lucide/dist/esm/icons/move-vertical.mjs:
lucide/dist/esm/icons/move.mjs:
lucide/dist/esm/icons/navigation-2-off.mjs:
lucide/dist/esm/icons/navigation-2.mjs:
lucide/dist/esm/icons/navigation-off.mjs:
lucide/dist/esm/icons/nepali-rupee.mjs:
lucide/dist/esm/icons/navigation.mjs:
lucide/dist/esm/icons/network.mjs:
lucide/dist/esm/icons/newspaper.mjs:
lucide/dist/esm/icons/nfc.mjs:
lucide/dist/esm/icons/non-binary.mjs:
lucide/dist/esm/icons/notebook-dot.mjs:
lucide/dist/esm/icons/notebook-pen.mjs:
lucide/dist/esm/icons/notebook-tabs.mjs:
lucide/dist/esm/icons/notebook-text.mjs:
lucide/dist/esm/icons/notebook.mjs:
lucide/dist/esm/icons/notepad-text-dashed.mjs:
lucide/dist/esm/icons/notepad-text.mjs:
lucide/dist/esm/icons/numbers.mjs:
lucide/dist/esm/icons/nut.mjs:
lucide/dist/esm/icons/nut-off.mjs:
lucide/dist/esm/icons/octagon-exclamation-point.mjs:
lucide/dist/esm/icons/octagon-pause.mjs:
lucide/dist/esm/icons/octagon-minus.mjs:
lucide/dist/esm/icons/octagon-x.mjs:
lucide/dist/esm/icons/octagon.mjs:
lucide/dist/esm/icons/omega.mjs:
lucide/dist/esm/icons/opacity.mjs:
lucide/dist/esm/icons/option.mjs:
lucide/dist/esm/icons/orbit.mjs:
lucide/dist/esm/icons/origami.mjs:
lucide/dist/esm/icons/package-check.mjs:
lucide/dist/esm/icons/package-2.mjs:
lucide/dist/esm/icons/package-minus.mjs:
lucide/dist/esm/icons/package-open.mjs:
lucide/dist/esm/icons/package-pen.mjs:
lucide/dist/esm/icons/package-plus.mjs:
lucide/dist/esm/icons/package-question-mark.mjs:
lucide/dist/esm/icons/package-search.mjs:
lucide/dist/esm/icons/package-x.mjs:
lucide/dist/esm/icons/package.mjs:
lucide/dist/esm/icons/paint-bucket.mjs:
lucide/dist/esm/icons/paint-roller.mjs:
lucide/dist/esm/icons/paintbrush-vertical.mjs:
lucide/dist/esm/icons/paintbrush.mjs:
lucide/dist/esm/icons/palette.mjs:
lucide/dist/esm/icons/panda.mjs:
lucide/dist/esm/icons/panel-bottom-close.mjs:
lucide/dist/esm/icons/panel-bottom-dashed.mjs:
lucide/dist/esm/icons/panel-bottom-open.mjs:
lucide/dist/esm/icons/panel-bottom.mjs:
lucide/dist/esm/icons/panel-left-close.mjs:
lucide/dist/esm/icons/panel-left-dashed.mjs:
lucide/dist/esm/icons/panel-left-open.mjs:
lucide/dist/esm/icons/panel-left-right-dashed.mjs:
lucide/dist/esm/icons/panel-left.mjs:
lucide/dist/esm/icons/panel-right-close.mjs:
lucide/dist/esm/icons/panel-right-dashed.mjs:
lucide/dist/esm/icons/panel-right-open.mjs:
lucide/dist/esm/icons/panel-right.mjs:
lucide/dist/esm/icons/panel-top-bottom-dashed.mjs:
lucide/dist/esm/icons/panel-top-close.mjs:
lucide/dist/esm/icons/panel-top-dashed.mjs:
lucide/dist/esm/icons/panel-top-open.mjs:
lucide/dist/esm/icons/panel-top.mjs:
lucide/dist/esm/icons/panels-right-bottom.mjs:
lucide/dist/esm/icons/panels-left-bottom.mjs:
lucide/dist/esm/icons/panels-top-left.mjs:
lucide/dist/esm/icons/paper-bag.mjs:
lucide/dist/esm/icons/paperclip.mjs:
lucide/dist/esm/icons/parasol.mjs:
lucide/dist/esm/icons/parentheses.mjs:
lucide/dist/esm/icons/park.mjs:
lucide/dist/esm/icons/parking-meter.mjs:
lucide/dist/esm/icons/pause.mjs:
lucide/dist/esm/icons/party-popper.mjs:
lucide/dist/esm/icons/paw-print.mjs:
lucide/dist/esm/icons/pc-case.mjs:
lucide/dist/esm/icons/pen-line.mjs:
lucide/dist/esm/icons/pen-off.mjs:
lucide/dist/esm/icons/pen-tool.mjs:
lucide/dist/esm/icons/pen.mjs:
lucide/dist/esm/icons/pencil-line.mjs:
lucide/dist/esm/icons/pencil-off.mjs:
lucide/dist/esm/icons/pencil-ruler.mjs:
lucide/dist/esm/icons/pencil-sparkles.mjs:
lucide/dist/esm/icons/pencil.mjs:
lucide/dist/esm/icons/pentagon.mjs:
lucide/dist/esm/icons/percent.mjs:
lucide/dist/esm/icons/perfume-bottle.mjs:
lucide/dist/esm/icons/person-standing.mjs:
lucide/dist/esm/icons/phi.mjs:
lucide/dist/esm/icons/philippine-peso.mjs:
lucide/dist/esm/icons/phone-call.mjs:
lucide/dist/esm/icons/phone-forwarded.mjs:
lucide/dist/esm/icons/phone-incoming.mjs:
lucide/dist/esm/icons/phone-log.mjs:
lucide/dist/esm/icons/phone-missed.mjs:
lucide/dist/esm/icons/phone-off.mjs:
lucide/dist/esm/icons/phone-outgoing.mjs:
lucide/dist/esm/icons/pi.mjs:
lucide/dist/esm/icons/phone.mjs:
lucide/dist/esm/icons/piano.mjs:
lucide/dist/esm/icons/pickaxe.mjs:
lucide/dist/esm/icons/picture-in-picture-2.mjs:
lucide/dist/esm/icons/picture-in-picture.mjs:
lucide/dist/esm/icons/piggy-bank.mjs:
lucide/dist/esm/icons/pilcrow-left.mjs:
lucide/dist/esm/icons/pilcrow-right.mjs:
lucide/dist/esm/icons/pilcrow.mjs:
lucide/dist/esm/icons/pill-bottle.mjs:
lucide/dist/esm/icons/pill.mjs:
lucide/dist/esm/icons/pin-off.mjs:
lucide/dist/esm/icons/pipette.mjs:
lucide/dist/esm/icons/pin.mjs:
lucide/dist/esm/icons/pizza.mjs:
lucide/dist/esm/icons/plane-takeoff.mjs:
lucide/dist/esm/icons/plane-landing.mjs:
lucide/dist/esm/icons/plane.mjs:
lucide/dist/esm/icons/plant-pot.mjs:
lucide/dist/esm/icons/play-off.mjs:
lucide/dist/esm/icons/play.mjs:
lucide/dist/esm/icons/playing-card.mjs:
lucide/dist/esm/icons/playing-cards.mjs:
lucide/dist/esm/icons/playing-cards-fan.mjs:
lucide/dist/esm/icons/plug-2.mjs:
lucide/dist/esm/icons/plug-zap.mjs:
lucide/dist/esm/icons/plug.mjs:
lucide/dist/esm/icons/plus.mjs:
lucide/dist/esm/icons/pocket-knife.mjs:
lucide/dist/esm/icons/podium.mjs:
lucide/dist/esm/icons/pointer.mjs:
lucide/dist/esm/icons/pointer-off.mjs:
lucide/dist/esm/icons/popcorn.mjs:
lucide/dist/esm/icons/popsicle.mjs:
lucide/dist/esm/icons/pound-sterling.mjs:
lucide/dist/esm/icons/power-off.mjs:
lucide/dist/esm/icons/power.mjs:
lucide/dist/esm/icons/presentation.mjs:
lucide/dist/esm/icons/printer-3d.mjs:
lucide/dist/esm/icons/printer-check.mjs:
lucide/dist/esm/icons/printer-x.mjs:
lucide/dist/esm/icons/printer.mjs:
lucide/dist/esm/icons/projector.mjs:
lucide/dist/esm/icons/proportions.mjs:
lucide/dist/esm/icons/puzzle.mjs:
lucide/dist/esm/icons/pyramid.mjs:
lucide/dist/esm/icons/qr-code.mjs:
lucide/dist/esm/icons/quote.mjs:
lucide/dist/esm/icons/rabbit.mjs:
lucide/dist/esm/icons/radar.mjs:
lucide/dist/esm/icons/radiation.mjs:
lucide/dist/esm/icons/radical.mjs:
lucide/dist/esm/icons/radio-off.mjs:
lucide/dist/esm/icons/radio-receiver.mjs:
lucide/dist/esm/icons/radio-tower.mjs:
lucide/dist/esm/icons/radio.mjs:
lucide/dist/esm/icons/radius.mjs:
lucide/dist/esm/icons/rainbow.mjs:
lucide/dist/esm/icons/rat.mjs:
lucide/dist/esm/icons/ratio.mjs:
lucide/dist/esm/icons/receipt-euro.mjs:
lucide/dist/esm/icons/receipt-cent.mjs:
lucide/dist/esm/icons/receipt-indian-rupee.mjs:
lucide/dist/esm/icons/receipt-pound-sterling.mjs:
lucide/dist/esm/icons/receipt-japanese-yen.mjs:
lucide/dist/esm/icons/receipt-russian-ruble.mjs:
lucide/dist/esm/icons/receipt-swiss-franc.mjs:
lucide/dist/esm/icons/receipt-text.mjs:
lucide/dist/esm/icons/receipt-turkish-lira.mjs:
lucide/dist/esm/icons/receipt.mjs:
lucide/dist/esm/icons/rectangle-circle.mjs:
lucide/dist/esm/icons/rectangle-ellipsis.mjs:
lucide/dist/esm/icons/rectangle-goggles.mjs:
lucide/dist/esm/icons/rectangle-vertical.mjs:
lucide/dist/esm/icons/rectangle-horizontal.mjs:
lucide/dist/esm/icons/recycle.mjs:
lucide/dist/esm/icons/redo-2.mjs:
lucide/dist/esm/icons/redo-dot.mjs:
lucide/dist/esm/icons/redo.mjs:
lucide/dist/esm/icons/refresh-ccw-dot.mjs:
lucide/dist/esm/icons/refresh-ccw.mjs:
lucide/dist/esm/icons/refresh-cw-off.mjs:
lucide/dist/esm/icons/refresh-cw.mjs:
lucide/dist/esm/icons/regex.mjs:
lucide/dist/esm/icons/refrigerator.mjs:
lucide/dist/esm/icons/remove-formatting.mjs:
lucide/dist/esm/icons/repeat-1.mjs:
lucide/dist/esm/icons/repeat-2.mjs:
lucide/dist/esm/icons/repeat-off.mjs:
lucide/dist/esm/icons/replace-all.mjs:
lucide/dist/esm/icons/repeat.mjs:
lucide/dist/esm/icons/replace.mjs:
lucide/dist/esm/icons/reply-all.mjs:
lucide/dist/esm/icons/reply.mjs:
lucide/dist/esm/icons/rewind.mjs:
lucide/dist/esm/icons/ribbon.mjs:
lucide/dist/esm/icons/road.mjs:
lucide/dist/esm/icons/robot-arm.mjs:
lucide/dist/esm/icons/robot-vacuum.mjs:
lucide/dist/esm/icons/rocket.mjs:
lucide/dist/esm/icons/rocking-chair.mjs:
lucide/dist/esm/icons/roller-coaster.mjs:
lucide/dist/esm/icons/rose.mjs:
lucide/dist/esm/icons/rotate-3d.mjs:
lucide/dist/esm/icons/rotate-ccw-key.mjs:
lucide/dist/esm/icons/rotate-ccw-clock.mjs:
lucide/dist/esm/icons/rotate-ccw-square.mjs:
lucide/dist/esm/icons/rotate-ccw.mjs:
lucide/dist/esm/icons/rotate-cw-clock.mjs:
lucide/dist/esm/icons/rotate-cw-fading-clock.mjs:
lucide/dist/esm/icons/rotate-cw-square.mjs:
lucide/dist/esm/icons/rotate-cw.mjs:
lucide/dist/esm/icons/route-off.mjs:
lucide/dist/esm/icons/router.mjs:
lucide/dist/esm/icons/route.mjs:
lucide/dist/esm/icons/rows-2.mjs:
lucide/dist/esm/icons/rows-3.mjs:
lucide/dist/esm/icons/rows-4.mjs:
lucide/dist/esm/icons/rss.mjs:
lucide/dist/esm/icons/rugby-ball.mjs:
lucide/dist/esm/icons/ruler-dimension-line.mjs:
lucide/dist/esm/icons/ruler.mjs:
lucide/dist/esm/icons/russian-ruble.mjs:
lucide/dist/esm/icons/sailboat.mjs:
lucide/dist/esm/icons/salad.mjs:
lucide/dist/esm/icons/sandwich.mjs:
lucide/dist/esm/icons/satellite-dish.mjs:
lucide/dist/esm/icons/satellite.mjs:
lucide/dist/esm/icons/saudi-riyal.mjs:
lucide/dist/esm/icons/save-all.mjs:
lucide/dist/esm/icons/save-check.mjs:
lucide/dist/esm/icons/save-off.mjs:
lucide/dist/esm/icons/save-pen.mjs:
lucide/dist/esm/icons/save-plus.mjs:
lucide/dist/esm/icons/save.mjs:
lucide/dist/esm/icons/scale-3d.mjs:
lucide/dist/esm/icons/scale.mjs:
lucide/dist/esm/icons/scaling.mjs:
lucide/dist/esm/icons/scan-barcode.mjs:
lucide/dist/esm/icons/scan-box.mjs:
lucide/dist/esm/icons/scan-eye.mjs:
lucide/dist/esm/icons/scan-face.mjs:
lucide/dist/esm/icons/scan-heart.mjs:
lucide/dist/esm/icons/scan-line.mjs:
lucide/dist/esm/icons/scan-qr-code.mjs:
lucide/dist/esm/icons/scan-search.mjs:
lucide/dist/esm/icons/scan-square.mjs:
lucide/dist/esm/icons/scan-text.mjs:
lucide/dist/esm/icons/scan.mjs:
lucide/dist/esm/icons/school.mjs:
lucide/dist/esm/icons/scissors-line-dashed.mjs:
lucide/dist/esm/icons/scissors.mjs:
lucide/dist/esm/icons/scooter.mjs:
lucide/dist/esm/icons/scratch-blocks.mjs:
lucide/dist/esm/icons/screen-share-off.mjs:
lucide/dist/esm/icons/screen-share.mjs:
lucide/dist/esm/icons/screw.mjs:
lucide/dist/esm/icons/scroll-text.mjs:
lucide/dist/esm/icons/scroll.mjs:
lucide/dist/esm/icons/search-check.mjs:
lucide/dist/esm/icons/search-code.mjs:
lucide/dist/esm/icons/search-exclamation-point.mjs:
lucide/dist/esm/icons/search-slash.mjs:
lucide/dist/esm/icons/search.mjs:
lucide/dist/esm/icons/search-x.mjs:
lucide/dist/esm/icons/section.mjs:
lucide/dist/esm/icons/send-horizontal.mjs:
lucide/dist/esm/icons/send-to-back.mjs:
lucide/dist/esm/icons/send.mjs:
lucide/dist/esm/icons/separator-horizontal.mjs:
lucide/dist/esm/icons/separator-vertical.mjs:
lucide/dist/esm/icons/server-cog.mjs:
lucide/dist/esm/icons/server-crash.mjs:
lucide/dist/esm/icons/server-plus.mjs:
lucide/dist/esm/icons/server-nas.mjs:
lucide/dist/esm/icons/server-off.mjs:
lucide/dist/esm/icons/server.mjs:
lucide/dist/esm/icons/settings-2.mjs:
lucide/dist/esm/icons/settings.mjs:
lucide/dist/esm/icons/shapes.mjs:
lucide/dist/esm/icons/share-2.mjs:
lucide/dist/esm/icons/share.mjs:
lucide/dist/esm/icons/sheet.mjs:
lucide/dist/esm/icons/shell.mjs:
lucide/dist/esm/icons/shelving-unit.mjs:
lucide/dist/esm/icons/shield-ban.mjs:
lucide/dist/esm/icons/shield-check.mjs:
lucide/dist/esm/icons/shield-cog-corner.mjs:
lucide/dist/esm/icons/shield-cog.mjs:
lucide/dist/esm/icons/shield-ellipsis.mjs:
lucide/dist/esm/icons/shield-exclamation-point.mjs:
lucide/dist/esm/icons/shield-half.mjs:
lucide/dist/esm/icons/shield-house.mjs:
lucide/dist/esm/icons/shield-keyhole.mjs:
lucide/dist/esm/icons/shield-lock.mjs:
lucide/dist/esm/icons/shield-minus.mjs:
lucide/dist/esm/icons/shield-off.mjs:
lucide/dist/esm/icons/shield-plus.mjs:
lucide/dist/esm/icons/shield-question-mark.mjs:
lucide/dist/esm/icons/shield-user.mjs:
lucide/dist/esm/icons/shield-x.mjs:
lucide/dist/esm/icons/shield.mjs:
lucide/dist/esm/icons/ship-cargo.mjs:
lucide/dist/esm/icons/ship-wheel.mjs:
lucide/dist/esm/icons/ship.mjs:
lucide/dist/esm/icons/shirt.mjs:
lucide/dist/esm/icons/shopping-bag.mjs:
lucide/dist/esm/icons/shopping-basket.mjs:
lucide/dist/esm/icons/shopping-cart-minus.mjs:
lucide/dist/esm/icons/shopping-cart-plus.mjs:
lucide/dist/esm/icons/shopping-cart.mjs:
lucide/dist/esm/icons/shovel.mjs:
lucide/dist/esm/icons/shower-head.mjs:
lucide/dist/esm/icons/shredder.mjs:
lucide/dist/esm/icons/shrimp-off.mjs:
lucide/dist/esm/icons/shrimp.mjs:
lucide/dist/esm/icons/shuffle.mjs:
lucide/dist/esm/icons/shrink.mjs:
lucide/dist/esm/icons/shrub.mjs:
lucide/dist/esm/icons/signal-high.mjs:
lucide/dist/esm/icons/sigma.mjs:
lucide/dist/esm/icons/signal-low.mjs:
lucide/dist/esm/icons/signal-medium.mjs:
lucide/dist/esm/icons/signal-zero.mjs:
lucide/dist/esm/icons/signal.mjs:
lucide/dist/esm/icons/signature.mjs:
lucide/dist/esm/icons/signpost-big.mjs:
lucide/dist/esm/icons/signpost.mjs:
lucide/dist/esm/icons/siren-off.mjs:
lucide/dist/esm/icons/siren.mjs:
lucide/dist/esm/icons/sixteenth-notes.mjs:
lucide/dist/esm/icons/skip-back.mjs:
lucide/dist/esm/icons/skip-forward.mjs:
lucide/dist/esm/icons/skull.mjs:
lucide/dist/esm/icons/slash.mjs:
lucide/dist/esm/icons/slice.mjs:
lucide/dist/esm/icons/sliders-horizontal.mjs:
lucide/dist/esm/icons/sliders-vertical.mjs:
lucide/dist/esm/icons/smartphone-charging.mjs:
lucide/dist/esm/icons/smartphone-nfc.mjs:
lucide/dist/esm/icons/smartphone-user-round.mjs:
lucide/dist/esm/icons/snail.mjs:
lucide/dist/esm/icons/smartphone.mjs:
lucide/dist/esm/icons/snowflake.mjs:
lucide/dist/esm/icons/sofa.mjs:
lucide/dist/esm/icons/soap-dispenser-droplet.mjs:
lucide/dist/esm/icons/solar-panel.mjs:
lucide/dist/esm/icons/soup.mjs:
lucide/dist/esm/icons/spade.mjs:
lucide/dist/esm/icons/space.mjs:
lucide/dist/esm/icons/sparkle.mjs:
lucide/dist/esm/icons/sparkles.mjs:
lucide/dist/esm/icons/speaker.mjs:
lucide/dist/esm/icons/spell-check-2.mjs:
lucide/dist/esm/icons/speech.mjs:
lucide/dist/esm/icons/spell-check.mjs:
lucide/dist/esm/icons/spline-pointer.mjs:
lucide/dist/esm/icons/spline.mjs:
lucide/dist/esm/icons/split.mjs:
lucide/dist/esm/icons/spool.mjs:
lucide/dist/esm/icons/sport-shoe.mjs:
lucide/dist/esm/icons/spotlight.mjs:
lucide/dist/esm/icons/sprout.mjs:
lucide/dist/esm/icons/spray-can.mjs:
lucide/dist/esm/icons/square-activity.mjs:
lucide/dist/esm/icons/square-arrow-down.mjs:
lucide/dist/esm/icons/square-arrow-down-left.mjs:
lucide/dist/esm/icons/square-arrow-down-right.mjs:
lucide/dist/esm/icons/square-arrow-left.mjs:
lucide/dist/esm/icons/square-arrow-out-down-left.mjs:
lucide/dist/esm/icons/square-arrow-out-down-right.mjs:
lucide/dist/esm/icons/square-arrow-out-up-left.mjs:
lucide/dist/esm/icons/square-arrow-out-up-right.mjs:
lucide/dist/esm/icons/square-arrow-right-enter.mjs:
lucide/dist/esm/icons/square-arrow-right-exit.mjs:
lucide/dist/esm/icons/square-arrow-right.mjs:
lucide/dist/esm/icons/square-arrow-up-left.mjs:
lucide/dist/esm/icons/square-arrow-up-right.mjs:
lucide/dist/esm/icons/square-arrow-up.mjs:
lucide/dist/esm/icons/square-asterisk.mjs:
lucide/dist/esm/icons/square-bookmark.mjs:
lucide/dist/esm/icons/square-bottom-dashed-scissors.mjs:
lucide/dist/esm/icons/square-centerline-dashed-horizontal.mjs:
lucide/dist/esm/icons/square-centerline-dashed-vertical.mjs:
lucide/dist/esm/icons/square-chart-gantt.mjs:
lucide/dist/esm/icons/square-check-big.mjs:
lucide/dist/esm/icons/square-check.mjs:
lucide/dist/esm/icons/square-chevron-down.mjs:
lucide/dist/esm/icons/square-chevron-left.mjs:
lucide/dist/esm/icons/square-chevron-right.mjs:
lucide/dist/esm/icons/square-chevron-up.mjs:
lucide/dist/esm/icons/square-chevrons-down.mjs:
lucide/dist/esm/icons/square-chevrons-left.mjs:
lucide/dist/esm/icons/square-chevrons-right.mjs:
lucide/dist/esm/icons/square-chevrons-up.mjs:
lucide/dist/esm/icons/square-code.mjs:
lucide/dist/esm/icons/square-dashed-bottom-code.mjs:
lucide/dist/esm/icons/square-dashed-bottom.mjs:
lucide/dist/esm/icons/square-dashed-kanban.mjs:
lucide/dist/esm/icons/square-dashed-mouse-pointer.mjs:
lucide/dist/esm/icons/square-dashed-plus.mjs:
lucide/dist/esm/icons/square-dashed-text.mjs:
lucide/dist/esm/icons/square-dashed-top-solid.mjs:
lucide/dist/esm/icons/square-dashed-x-corner.mjs:
lucide/dist/esm/icons/square-dashed-x.mjs:
lucide/dist/esm/icons/square-dashed.mjs:
lucide/dist/esm/icons/square-dimensions.mjs:
lucide/dist/esm/icons/square-divide.mjs:
lucide/dist/esm/icons/square-dot.mjs:
lucide/dist/esm/icons/square-equal.mjs:
lucide/dist/esm/icons/square-exclamation-point.mjs:
lucide/dist/esm/icons/square-function.mjs:
lucide/dist/esm/icons/square-kanban-plus.mjs:
lucide/dist/esm/icons/square-kanban.mjs:
lucide/dist/esm/icons/square-letter-a.mjs:
lucide/dist/esm/icons/square-letter-b.mjs:
lucide/dist/esm/icons/square-letter-c.mjs:
lucide/dist/esm/icons/square-letter-d.mjs:
lucide/dist/esm/icons/square-letter-e.mjs:
lucide/dist/esm/icons/square-letter-f.mjs:
lucide/dist/esm/icons/square-letter-g.mjs:
lucide/dist/esm/icons/square-letter-h.mjs:
lucide/dist/esm/icons/square-letter-j.mjs:
lucide/dist/esm/icons/square-letter-i.mjs:
lucide/dist/esm/icons/square-letter-k.mjs:
lucide/dist/esm/icons/square-letter-l.mjs:
lucide/dist/esm/icons/square-letter-m.mjs:
lucide/dist/esm/icons/square-letter-n.mjs:
lucide/dist/esm/icons/square-letter-o.mjs:
lucide/dist/esm/icons/square-letter-p-off.mjs:
lucide/dist/esm/icons/square-letter-p.mjs:
lucide/dist/esm/icons/square-letter-q.mjs:
lucide/dist/esm/icons/square-letter-s.mjs:
lucide/dist/esm/icons/square-letter-r.mjs:
lucide/dist/esm/icons/square-letter-t.mjs:
lucide/dist/esm/icons/square-letter-u.mjs:
lucide/dist/esm/icons/square-letter-v.mjs:
lucide/dist/esm/icons/square-letter-w.mjs:
lucide/dist/esm/icons/square-letter-x.mjs:
lucide/dist/esm/icons/square-letter-y.mjs:
lucide/dist/esm/icons/square-letter-z.mjs:
lucide/dist/esm/icons/square-library.mjs:
lucide/dist/esm/icons/square-menu.mjs:
lucide/dist/esm/icons/square-minus.mjs:
lucide/dist/esm/icons/square-mouse-pointer.mjs:
lucide/dist/esm/icons/square-off.mjs:
lucide/dist/esm/icons/square-padding-horizontal.mjs:
lucide/dist/esm/icons/square-padding-left.mjs:
lucide/dist/esm/icons/square-padding-bottom.mjs:
lucide/dist/esm/icons/square-padding-right.mjs:
lucide/dist/esm/icons/square-padding-top.mjs:
lucide/dist/esm/icons/square-padding-vertical.mjs:
lucide/dist/esm/icons/square-padding.mjs:
lucide/dist/esm/icons/square-pause.mjs:
lucide/dist/esm/icons/square-pen.mjs:
lucide/dist/esm/icons/square-percent.mjs:
lucide/dist/esm/icons/square-pi.mjs:
lucide/dist/esm/icons/square-pilcrow.mjs:
lucide/dist/esm/icons/square-play.mjs:
lucide/dist/esm/icons/square-plus.mjs:
lucide/dist/esm/icons/square-power.mjs:
lucide/dist/esm/icons/square-radical.mjs:
lucide/dist/esm/icons/square-round-corner.mjs:
lucide/dist/esm/icons/square-scissors.mjs:
lucide/dist/esm/icons/square-sigma.mjs:
lucide/dist/esm/icons/square-slash.mjs:
lucide/dist/esm/icons/square-sparkles.mjs:
lucide/dist/esm/icons/square-split-horizontal.mjs:
lucide/dist/esm/icons/square-split-vertical.mjs:
lucide/dist/esm/icons/square-square.mjs:
lucide/dist/esm/icons/square-stack.mjs:
lucide/dist/esm/icons/square-stop.mjs:
lucide/dist/esm/icons/square-star.mjs:
lucide/dist/esm/icons/square-terminal.mjs:
lucide/dist/esm/icons/square-text.mjs:
lucide/dist/esm/icons/square-user-round.mjs:
lucide/dist/esm/icons/square-user.mjs:
lucide/dist/esm/icons/square-x.mjs:
lucide/dist/esm/icons/squares-exclude.mjs:
lucide/dist/esm/icons/square.mjs:
lucide/dist/esm/icons/squares-intersect.mjs:
lucide/dist/esm/icons/squares-unite.mjs:
lucide/dist/esm/icons/squares-subtract.mjs:
lucide/dist/esm/icons/squircle-dashed.mjs:
lucide/dist/esm/icons/squircle.mjs:
lucide/dist/esm/icons/squirrel.mjs:
lucide/dist/esm/icons/star-check.mjs:
lucide/dist/esm/icons/stamp.mjs:
lucide/dist/esm/icons/star-half.mjs:
lucide/dist/esm/icons/star-minus.mjs:
lucide/dist/esm/icons/star-off.mjs:
lucide/dist/esm/icons/star-plus.mjs:
lucide/dist/esm/icons/star-x.mjs:
lucide/dist/esm/icons/star.mjs:
lucide/dist/esm/icons/step-back.mjs:
lucide/dist/esm/icons/step-forward.mjs:
lucide/dist/esm/icons/stethoscope.mjs:
lucide/dist/esm/icons/sticker.mjs:
lucide/dist/esm/icons/sticky-note-check.mjs:
lucide/dist/esm/icons/sticky-note-minus.mjs:
lucide/dist/esm/icons/sticky-note-off.mjs:
lucide/dist/esm/icons/sticky-note-plus.mjs:
lucide/dist/esm/icons/sticky-note-x.mjs:
lucide/dist/esm/icons/sticky-note.mjs:
lucide/dist/esm/icons/sticky-notes.mjs:
lucide/dist/esm/icons/stone.mjs:
lucide/dist/esm/icons/store.mjs:
lucide/dist/esm/icons/stretch-horizontal.mjs:
lucide/dist/esm/icons/stretch-vertical.mjs:
lucide/dist/esm/icons/strikethrough.mjs:
lucide/dist/esm/icons/subscript.mjs:
lucide/dist/esm/icons/summary.mjs:
lucide/dist/esm/icons/sun-dim.mjs:
lucide/dist/esm/icons/sun-medium.mjs:
lucide/dist/esm/icons/sun-moon.mjs:
lucide/dist/esm/icons/sun-snow.mjs:
lucide/dist/esm/icons/sun.mjs:
lucide/dist/esm/icons/sunrise.mjs:
lucide/dist/esm/icons/sunset.mjs:
lucide/dist/esm/icons/superscript.mjs:
lucide/dist/esm/icons/swatch-book.mjs:
lucide/dist/esm/icons/swiss-franc.mjs:
lucide/dist/esm/icons/switch-camera.mjs:
lucide/dist/esm/icons/sword.mjs:
lucide/dist/esm/icons/swords.mjs:
lucide/dist/esm/icons/table-2.mjs:
lucide/dist/esm/icons/table-cells-merge.mjs:
lucide/dist/esm/icons/syringe.mjs:
lucide/dist/esm/icons/table-cells-split.mjs:
lucide/dist/esm/icons/table-columns-split.mjs:
lucide/dist/esm/icons/table-of-contents.mjs:
lucide/dist/esm/icons/table-properties.mjs:
lucide/dist/esm/icons/table-rows-split.mjs:
lucide/dist/esm/icons/table.mjs:
lucide/dist/esm/icons/tablet-smartphone.mjs:
lucide/dist/esm/icons/tablet.mjs:
lucide/dist/esm/icons/tablets.mjs:
lucide/dist/esm/icons/tag-plus.mjs:
lucide/dist/esm/icons/tag-x.mjs:
lucide/dist/esm/icons/tag.mjs:
lucide/dist/esm/icons/tags.mjs:
lucide/dist/esm/icons/tally-1.mjs:
lucide/dist/esm/icons/tally-2.mjs:
lucide/dist/esm/icons/tally-3.mjs:
lucide/dist/esm/icons/tally-4.mjs:
lucide/dist/esm/icons/tally-5.mjs:
lucide/dist/esm/icons/target.mjs:
lucide/dist/esm/icons/tangent.mjs:
lucide/dist/esm/icons/telescope.mjs:
lucide/dist/esm/icons/tent-tree.mjs:
lucide/dist/esm/icons/tent.mjs:
lucide/dist/esm/icons/terminal.mjs:
lucide/dist/esm/icons/test-tube.mjs:
lucide/dist/esm/icons/test-tube-diagonal.mjs:
lucide/dist/esm/icons/test-tubes.mjs:
lucide/dist/esm/icons/text-align-center.mjs:
lucide/dist/esm/icons/text-align-end.mjs:
lucide/dist/esm/icons/text-align-justify-center.mjs:
lucide/dist/esm/icons/text-align-justify-end.mjs:
lucide/dist/esm/icons/text-align-justify-start.mjs:
lucide/dist/esm/icons/text-align-justify.mjs:
lucide/dist/esm/icons/text-align-start.mjs:
lucide/dist/esm/icons/text-cursor-input.mjs:
lucide/dist/esm/icons/text-cursor.mjs:
lucide/dist/esm/icons/text-initial.mjs:
lucide/dist/esm/icons/text-quote.mjs:
lucide/dist/esm/icons/text-search.mjs:
lucide/dist/esm/icons/text-wrap.mjs:
lucide/dist/esm/icons/theater.mjs:
lucide/dist/esm/icons/thermometer-snowflake.mjs:
lucide/dist/esm/icons/thermometer-sun.mjs:
lucide/dist/esm/icons/thermometer.mjs:
lucide/dist/esm/icons/thumbs-down.mjs:
lucide/dist/esm/icons/thumbs-up.mjs:
lucide/dist/esm/icons/tic-tac-toe.mjs:
lucide/dist/esm/icons/ticket-check.mjs:
lucide/dist/esm/icons/ticket-minus.mjs:
lucide/dist/esm/icons/ticket-percent.mjs:
lucide/dist/esm/icons/ticket-plus.mjs:
lucide/dist/esm/icons/ticket-slash.mjs:
lucide/dist/esm/icons/ticket.mjs:
lucide/dist/esm/icons/ticket-x.mjs:
lucide/dist/esm/icons/tickets-plane.mjs:
lucide/dist/esm/icons/tickets.mjs:
lucide/dist/esm/icons/timeline.mjs:
lucide/dist/esm/icons/timer-off.mjs:
lucide/dist/esm/icons/timer-reset.mjs:
lucide/dist/esm/icons/timer.mjs:
lucide/dist/esm/icons/toggle-right.mjs:
lucide/dist/esm/icons/toilet.mjs:
lucide/dist/esm/icons/toggle-left.mjs:
lucide/dist/esm/icons/tombstone.mjs:
lucide/dist/esm/icons/tool-case.mjs:
lucide/dist/esm/icons/toolbox.mjs:
lucide/dist/esm/icons/toothbrush.mjs:
lucide/dist/esm/icons/toothbrush-sparkles.mjs:
lucide/dist/esm/icons/tornado.mjs:
lucide/dist/esm/icons/torus.mjs:
lucide/dist/esm/icons/touchpad-off.mjs:
lucide/dist/esm/icons/touchpad.mjs:
lucide/dist/esm/icons/towel-rack.mjs:
lucide/dist/esm/icons/tower-control.mjs:
lucide/dist/esm/icons/toy-brick.mjs:
lucide/dist/esm/icons/tractor.mjs:
lucide/dist/esm/icons/traffic-cone.mjs:
lucide/dist/esm/icons/train-front-tunnel.mjs:
lucide/dist/esm/icons/trailer.mjs:
lucide/dist/esm/icons/train-front.mjs:
lucide/dist/esm/icons/train-track.mjs:
lucide/dist/esm/icons/tram-front.mjs:
lucide/dist/esm/icons/transgender.mjs:
lucide/dist/esm/icons/trash-off.mjs:
lucide/dist/esm/icons/trash.mjs:
lucide/dist/esm/icons/tree-deciduous.mjs:
lucide/dist/esm/icons/tree-palm.mjs:
lucide/dist/esm/icons/tree-pine.mjs:
lucide/dist/esm/icons/trees.mjs:
lucide/dist/esm/icons/trending-down.mjs:
lucide/dist/esm/icons/trending-up-down.mjs:
lucide/dist/esm/icons/trending-up.mjs:
lucide/dist/esm/icons/triangle-dashed.mjs:
lucide/dist/esm/icons/triangle-exclamation-point.mjs:
lucide/dist/esm/icons/triangle.mjs:
lucide/dist/esm/icons/triangle-right.mjs:
lucide/dist/esm/icons/triangles-centerline-dashed-horizontal.mjs:
lucide/dist/esm/icons/triangles-centerline-dashed-vertical.mjs:
lucide/dist/esm/icons/trophy.mjs:
lucide/dist/esm/icons/truck-electric.mjs:
lucide/dist/esm/icons/truck.mjs:
lucide/dist/esm/icons/tube-lotion.mjs:
lucide/dist/esm/icons/turkish-lira.mjs:
lucide/dist/esm/icons/turntable.mjs:
lucide/dist/esm/icons/turtle.mjs:
lucide/dist/esm/icons/tv-minimal-play.mjs:
lucide/dist/esm/icons/tv-minimal.mjs:
lucide/dist/esm/icons/tv.mjs:
lucide/dist/esm/icons/type-outline.mjs:
lucide/dist/esm/icons/type.mjs:
lucide/dist/esm/icons/umbrella-off.mjs:
lucide/dist/esm/icons/umbrella.mjs:
lucide/dist/esm/icons/underline.mjs:
lucide/dist/esm/icons/undo-2.mjs:
lucide/dist/esm/icons/undo-dot.mjs:
lucide/dist/esm/icons/undo.mjs:
lucide/dist/esm/icons/unfold-horizontal.mjs:
lucide/dist/esm/icons/unfold-vertical.mjs:
lucide/dist/esm/icons/ungroup.mjs:
lucide/dist/esm/icons/university.mjs:
lucide/dist/esm/icons/unlink-2.mjs:
lucide/dist/esm/icons/unlink.mjs:
lucide/dist/esm/icons/unplug.mjs:
lucide/dist/esm/icons/upload.mjs:
lucide/dist/esm/icons/usb-c-port.mjs:
lucide/dist/esm/icons/usb.mjs:
lucide/dist/esm/icons/user-check.mjs:
lucide/dist/esm/icons/user-cog.mjs:
lucide/dist/esm/icons/user-group.mjs:
lucide/dist/esm/icons/user-key.mjs:
lucide/dist/esm/icons/user-lock.mjs:
lucide/dist/esm/icons/user-minus.mjs:
lucide/dist/esm/icons/user-pen.mjs:
lucide/dist/esm/icons/user-plus.mjs:
lucide/dist/esm/icons/user-round-arrow-left.mjs:
lucide/dist/esm/icons/user-round-check.mjs:
lucide/dist/esm/icons/user-round-cog.mjs:
lucide/dist/esm/icons/user-round-group.mjs:
lucide/dist/esm/icons/user-round-key.mjs:
lucide/dist/esm/icons/user-round-minus.mjs:
lucide/dist/esm/icons/user-round-pen.mjs:
lucide/dist/esm/icons/user-round-plus.mjs:
lucide/dist/esm/icons/user-round-search.mjs:
lucide/dist/esm/icons/user-round-shield.mjs:
lucide/dist/esm/icons/user-round-star.mjs:
lucide/dist/esm/icons/user-round-x.mjs:
lucide/dist/esm/icons/user-search.mjs:
lucide/dist/esm/icons/user-round.mjs:
lucide/dist/esm/icons/user-shield.mjs:
lucide/dist/esm/icons/user-star.mjs:
lucide/dist/esm/icons/user.mjs:
lucide/dist/esm/icons/user-x.mjs:
lucide/dist/esm/icons/users-collaboration.mjs:
lucide/dist/esm/icons/users-round-collaboration.mjs:
lucide/dist/esm/icons/users-round.mjs:
lucide/dist/esm/icons/users.mjs:
lucide/dist/esm/icons/utensils-crossed.mjs:
lucide/dist/esm/icons/utensils.mjs:
lucide/dist/esm/icons/utility-pole.mjs:
lucide/dist/esm/icons/van.mjs:
lucide/dist/esm/icons/variable.mjs:
lucide/dist/esm/icons/vault.mjs:
lucide/dist/esm/icons/vector-polygon.mjs:
lucide/dist/esm/icons/vector-square.mjs:
lucide/dist/esm/icons/vegan.mjs:
lucide/dist/esm/icons/venetian-mask.mjs:
lucide/dist/esm/icons/venus-and-mars.mjs:
lucide/dist/esm/icons/venus.mjs:
lucide/dist/esm/icons/vibrate-off.mjs:
lucide/dist/esm/icons/vibrate.mjs:
lucide/dist/esm/icons/video-off.mjs:
lucide/dist/esm/icons/video.mjs:
lucide/dist/esm/icons/videotape.mjs:
lucide/dist/esm/icons/view.mjs:
lucide/dist/esm/icons/virus-off.mjs:
lucide/dist/esm/icons/virus.mjs:
lucide/dist/esm/icons/volleyball.mjs:
lucide/dist/esm/icons/voicemail.mjs:
lucide/dist/esm/icons/volume-1.mjs:
lucide/dist/esm/icons/volume-2.mjs:
lucide/dist/esm/icons/volume-off.mjs:
lucide/dist/esm/icons/volume-x.mjs:
lucide/dist/esm/icons/volume.mjs:
lucide/dist/esm/icons/vote.mjs:
lucide/dist/esm/icons/wallet-cards.mjs:
lucide/dist/esm/icons/wallet-minimal.mjs:
lucide/dist/esm/icons/wallet.mjs:
lucide/dist/esm/icons/wallpaper.mjs:
lucide/dist/esm/icons/wand-sparkles.mjs:
lucide/dist/esm/icons/wand.mjs:
lucide/dist/esm/icons/warehouse.mjs:
lucide/dist/esm/icons/watch.mjs:
lucide/dist/esm/icons/washing-machine.mjs:
lucide/dist/esm/icons/waves-arrow-down.mjs:
lucide/dist/esm/icons/waves-arrow-up.mjs:
lucide/dist/esm/icons/waves-ladder.mjs:
lucide/dist/esm/icons/waves-horizontal.mjs:
lucide/dist/esm/icons/waves-vertical.mjs:
lucide/dist/esm/icons/waypoints.mjs:
lucide/dist/esm/icons/webcam.mjs:
lucide/dist/esm/icons/webcam-off.mjs:
lucide/dist/esm/icons/webhook-off.mjs:
lucide/dist/esm/icons/webhook.mjs:
lucide/dist/esm/icons/weight-tilde.mjs:
lucide/dist/esm/icons/weight.mjs:
lucide/dist/esm/icons/wheat.mjs:
lucide/dist/esm/icons/wheat-off.mjs:
lucide/dist/esm/icons/whistle.mjs:
lucide/dist/esm/icons/whole-word.mjs:
lucide/dist/esm/icons/wifi-cog.mjs:
lucide/dist/esm/icons/wifi-lock.mjs:
lucide/dist/esm/icons/wifi-high.mjs:
lucide/dist/esm/icons/wifi-low.mjs:
lucide/dist/esm/icons/wifi-off.mjs:
lucide/dist/esm/icons/wifi-pen.mjs:
lucide/dist/esm/icons/wifi-sync.mjs:
lucide/dist/esm/icons/wifi-zero.mjs:
lucide/dist/esm/icons/wifi.mjs:
lucide/dist/esm/icons/wind-arrow-down.mjs:
lucide/dist/esm/icons/wind-arrow-up.mjs:
lucide/dist/esm/icons/wind.mjs:
lucide/dist/esm/icons/wine-off.mjs:
lucide/dist/esm/icons/wine.mjs:
lucide/dist/esm/icons/worm.mjs:
lucide/dist/esm/icons/workflow.mjs:
lucide/dist/esm/icons/wrench-off.mjs:
lucide/dist/esm/icons/wrench.mjs:
lucide/dist/esm/icons/x-line-top.mjs:
lucide/dist/esm/icons/x.mjs:
lucide/dist/esm/icons/zap-off.mjs:
lucide/dist/esm/icons/zap.mjs:
lucide/dist/esm/icons/zodiac-aquarius.mjs:
lucide/dist/esm/icons/zodiac-aries.mjs:
lucide/dist/esm/icons/zodiac-cancer.mjs:
lucide/dist/esm/icons/zodiac-capricorn.mjs:
lucide/dist/esm/icons/zodiac-gemini.mjs:
lucide/dist/esm/icons/zodiac-leo.mjs:
lucide/dist/esm/icons/zodiac-libra.mjs:
lucide/dist/esm/icons/zodiac-ophiuchus.mjs:
lucide/dist/esm/icons/zodiac-pisces.mjs:
lucide/dist/esm/icons/zodiac-sagittarius.mjs:
lucide/dist/esm/icons/zodiac-scorpio.mjs:
lucide/dist/esm/icons/zodiac-virgo.mjs:
lucide/dist/esm/icons/zodiac-taurus.mjs:
lucide/dist/esm/icons/zoom-in.mjs:
lucide/dist/esm/icons/zoom-out.mjs:
lucide/dist/esm/iconsAndAliases.mjs:
lucide/dist/esm/lucide.mjs:
  (**
   * @license lucide v1.69.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=content.js.map
