import { FriendlyTime, HabboClubLevelEnum, RateFlatMessageComposer, GuideSessionCreateMessageComposer, GuideSessionAttachedMessageEvent, GuideSessionStartedMessageEvent, GuideSessionMessageMessageComposer, GuideSessionMessageMessageEvent, GuideSessionRequesterCancelsMessageComposer, GuideSessionResolvedMessageComposer, GuideSessionEndedMessageEvent, GuideSessionErrorMessageEvent, GuideSessionPartnerIsTypingMessageEvent, PerkAllowancesMessageEvent, PerkEnum, GuideSessionOnDutyUpdateMessageComposer, GuideOnDutyStatusMessageEvent, GuideSessionGuideDecidesMessageComposer, GuideSessionDetachedMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreateLinkEvent, GetConfiguration, GetRoomEngine, GetSessionDataManager, LocalizeFormattedNumber, LocalizeShortNumber, LocalizeText, SendMessageComposer, getAuthHeaders } from '../../api';
import { LayoutCurrencyIcon } from '../../common';
import { useAchievements, useMessageEvent, useNavigator, usePurse, useRoom } from '../../hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  HelpCircle, ShieldAlert, MessageCircle, Scale, Settings,
  User, MessageSquare, Check, ChevronLeft, ChevronRight, Send,
  Loader2, CheckCircle2, Clock, AlertTriangle, Sparkles, Gift,
  Info, ZoomIn, ZoomOut, MessageSquareDashed, ThumbsUp,
} from 'lucide-react';

function CurrencyIcon({ type }: { type: string }) {
  const assetsUrl = GetConfiguration<string>('currency.asset.icon.url', '').replace('%type%', type);
  return <img src={assetsUrl} alt={type} className="w-4 h-4" style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />;
}

function CatalogIcon({ iconId }: { iconId: number }) {
  const imageUrl = GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/');
  return <img src={`${imageUrl}catalogue/icon_${iconId}.png`} alt="" className="w-5 h-5" style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />;
}

const TOOL_ICONS: { iconId: number; label: string; link: string }[] = [
  { iconId: 69, label: "Marktplatz", link: "marketplace/toggle" },
  { iconId: 71, label: "Preisliste", link: "pricelist/toggle" },
  { iconId: 1004, label: "Werkstatt", link: "workshop/toggle" },
  { iconId: 221, label: "Sets", link: "sets/toggle" },
];

const HELP_INDEX = [
  { icon: ShieldAlert, title: "Jemand melden", desc: "Melde einen Spieler wegen Fehlverhalten", color: "text-red-400", bg: "bg-red-500/10", hover: "hover:border-red-500/20" },
  { icon: MessageCircle, title: "Live-Support", desc: "Chatte direkt mit einem Teammitglied", color: "text-blue-400", bg: "bg-blue-500/10", hover: "hover:border-blue-500/20" },
  { icon: Scale, title: "Mein Sanktionsstatus", desc: "Prüfe ob Sanktionen gegen dich vorliegen", color: "text-amber-400", bg: "bg-amber-500/10", hover: "hover:border-amber-500/20" },
];

const DEMO_USERS = ["Player123", "xXDarkLordXx", "Habbo_Fan99"];
const DEMO_CHATS = ["lol du bist so schlecht", "geh weg noob", "ich hack dich", "du stinkst"];
const DEMO_CATEGORIES = [
  { name: "Beleidigung", topics: ["Verbale Beleidigung", "Rassismus", "Sexuelle Belästigung"] },
  { name: "Betrug", topics: ["Scamming", "Account-Diebstahl"] },
  { name: "Unangemessener Name", topics: ["Beleidigender Name", "Werbung im Namen"] },
  { name: "Spam", topics: ["Chat-Spam", "Handels-Spam"] },
];

const STEP_TITLES: Record<number, string> = {
  0: "Hilfe", 1: "Wen möchtest du melden?", 2: "Nachrichten auswählen", 3: "Kategorie wählen",
  4: "Beschreibe das Problem", 5: "Meldung absenden", 9: "Live-Support", 10: "Live-Support", 11: "Live-Support", 12: "Live-Support", 15: "Neue Anfrage", 16: "Fehler", 20: "Sanktionsstatus",
};

function HelpPopover() {
  const [step, setStep] = useState(0);
  const [selectedUser, setSelectedUser] = useState(-1);
  const [selectedChats, setSelectedChats] = useState<number[]>([]);
  const [selectedCat, setSelectedCat] = useState(-1);
  const [selectedTopic, setSelectedTopic] = useState(-1);
  const [message, setMessage] = useState("");

  // Live-Support State
  const [chatMessages, setChatMessages] = useState<{from: string, text: string}[]>([]);
  const [partnerName, setPartnerName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [userRequest, setUserRequest] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Guide/Admin State
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [isGuide, setIsGuide] = useState(false);
  const [helpRequestDescription, setHelpRequestDescription] = useState('');
  const [isLoopback, setIsLoopback] = useState(false);
  const hasAutoDutied = useRef(false);

  // Refs für stale closure prevention in useMessageEvent
  const stepRef = useRef(0);
  const isOnDutyRef = useRef(false);
  const isGuideRef = useRef(false);
  const isLoopbackRef = useRef(false);
  stepRef.current = step;
  isOnDutyRef.current = isOnDuty;
  isGuideRef.current = isGuide;
  isLoopbackRef.current = isLoopback;

  const reset = () => {
    stepRef.current = 0; isLoopbackRef.current = false; isGuideRef.current = false;
    setStep(0); setSelectedUser(-1); setSelectedChats([]); setSelectedCat(-1); setSelectedTopic(-1); setMessage("");
    setChatMessages([]); setPartnerName(''); setChatInput(''); setUserRequest(''); setIsTyping(false);
    setIsGuide(false); setHelpRequestDescription(''); setIsLoopback(false);
  };
  const toggleChat = (i: number) => setSelectedChats(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const goBack = () => {
    if (step === 3 && selectedCat >= 0 && selectedTopic < 0) { setSelectedCat(-1); return; }
    if (step === 9) { reset(); return; }
    if (step >= 10 && step <= 12) { return; } // Kann nicht zurück während aktiver Session
    if (step === 15) { if (!isLoopback) SendMessageComposer(new GuideSessionGuideDecidesMessageComposer(false)); reset(); return; }
    if (step === 16) { reset(); return; }
    if (step === 20) { reset(); return; }
    setStep(s => s - 1);
  };

  // Auto-transition: Step 11 → Step 12 nach kurzer Bestätigung
  useEffect(() => {
    if (step === 11) { const t = setTimeout(() => setStep(12), 1500); return () => clearTimeout(t); }
  }, [step]);

  // Auto-scroll im Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // === Auto-Duty Logik (aus GuideToolView übernommen) ===
  useMessageEvent<PerkAllowancesMessageEvent>(PerkAllowancesMessageEvent, event => {
    const parser = event.getParser();
    if (!parser.isAllowed(PerkEnum.USE_GUIDE_TOOL) && isOnDutyRef.current) {
      setIsOnDuty(false);
      SendMessageComposer(new GuideSessionOnDutyUpdateMessageComposer(false, false, false, false));
    }
    if (parser.isAllowed(PerkEnum.GIVE_GUIDE_TOUR) && !hasAutoDutied.current) {
      hasAutoDutied.current = true;
      setIsOnDuty(true);
      SendMessageComposer(new GuideSessionOnDutyUpdateMessageComposer(true, false, true, false));
    }
  });

  useMessageEvent<GuideOnDutyStatusMessageEvent>(GuideOnDutyStatusMessageEvent, event => {
    setIsOnDuty(event.getParser().onDuty);
  });

  // === Guide Session WebSocket Events (alle ignorieren im Loopback-Modus) ===
  useMessageEvent<GuideSessionAttachedMessageEvent>(GuideSessionAttachedMessageEvent, event => {
    if (isLoopbackRef.current) return;
    const parser = event.getParser();
    if (parser.asGuide && isOnDutyRef.current) {
      setHelpRequestDescription(parser.helpRequestDescription);
      setIsGuide(true);
      setStep(15);
      setPopoverOpen(true);
    }
  });

  useMessageEvent<GuideSessionStartedMessageEvent>(GuideSessionStartedMessageEvent, event => {
    if (isLoopbackRef.current) return;
    const parser = event.getParser();
    if (isGuideRef.current) {
      setPartnerName(parser.requesterName);
    } else {
      setPartnerName(parser.guideName);
    }
    setStep(11);
    setPopoverOpen(true);
  });

  useMessageEvent<GuideSessionMessageMessageEvent>(GuideSessionMessageMessageEvent, event => {
    if (isLoopbackRef.current) return;
    const parser = event.getParser();
    const from = parser.senderId === GetSessionDataManager().userId ? 'user' : 'staff';
    setChatMessages(prev => [...prev, { from, text: parser.chatMessage }]);
    setPopoverOpen(true);
  });

  useMessageEvent<GuideSessionPartnerIsTypingMessageEvent>(GuideSessionPartnerIsTypingMessageEvent, event => {
    if (isLoopbackRef.current) return;
    setIsTyping(event.getParser().isTyping);
  });

  useMessageEvent<GuideSessionEndedMessageEvent>(GuideSessionEndedMessageEvent, event => {
    if (isLoopbackRef.current) return;
    if (stepRef.current >= 9 && stepRef.current <= 16) {
      reset();
    }
  });

  useMessageEvent<GuideSessionDetachedMessageEvent>(GuideSessionDetachedMessageEvent, event => {
    if (isLoopbackRef.current) return;
    if (stepRef.current >= 9 && stepRef.current <= 16) {
      reset();
    }
  });

  useMessageEvent<GuideSessionErrorMessageEvent>(GuideSessionErrorMessageEvent, event => {
    if (isLoopbackRef.current) return;
    if (stepRef.current >= 10 && stepRef.current <= 15) {
      setStep(16);
      setPopoverOpen(true);
    }
  });

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    if (isLoopback) {
      setChatMessages(prev => [...prev, { from: 'user', text: chatInput }]);
    } else {
      SendMessageComposer(new GuideSessionMessageMessageComposer(chatInput));
    }
    setChatInput('');
  };

  const cancelRequest = () => {
    if (!isLoopback) SendMessageComposer(new GuideSessionRequesterCancelsMessageComposer());
    reset();
  };

  const endSession = () => {
    if (!isLoopback) SendMessageComposer(new GuideSessionResolvedMessageComposer());
    reset();
  };

  const acceptRequest = () => {
    if (isLoopback) {
      stepRef.current = 11;
      isGuideRef.current = true;
      setPartnerName(GetSessionDataManager().userName);
      setIsGuide(true);
      setStep(11);
    } else {
      SendMessageComposer(new GuideSessionGuideDecidesMessageComposer(true));
    }
  };

  const skipRequest = () => {
    if (!isLoopback) SendMessageComposer(new GuideSessionGuideDecidesMessageComposer(false));
    reset();
  };

  const handlePopoverChange = (open: boolean) => {
    // Verhindere Schließen während aktiver Session (stepRef für sofortige Werte)
    if (!open && stepRef.current >= 10 && stepRef.current <= 16) return;
    if (!open) reset();
    setPopoverOpen(open);
  };

  return (
    <Popover open={popoverOpen} onOpenChange={handlePopoverChange}>
      <PopoverTrigger asChild>
        <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
          <i className="icon icon-help" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[320px] p-0"
        onPointerDownOutside={(e) => { if (stepRef.current >= 10) e.preventDefault(); }}
        onInteractOutside={(e) => { if (stepRef.current >= 10) e.preventDefault(); }}
      >
        <div className="px-4 pt-3 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            {step > 0 && step !== 10 && step !== 11 && step !== 12 && step !== 15 && step !== 16 && (
              <button onClick={goBack} className="p-0.5 rounded-md hover:bg-accent/50 transition-colors">
                <ChevronLeft className="size-4 text-muted-foreground" />
              </button>
            )}
            {step === 12 ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-semibold text-foreground">{partnerName || 'Support'}</span>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            ) : (
              <>
                <HelpCircle className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{STEP_TITLES[step] ?? "Hilfe"}</span>
              </>
            )}
          </div>
          {step === 0 && <p className="text-[11px] text-muted-foreground mt-0.5">Wie können wir helfen?</p>}
        </div>

        <div className="p-3">
          {step === 0 && (
            <div className="space-y-1.5">
              {HELP_INDEX.map((item, i) => (
                <button key={item.title} onClick={() => { if (i === 0) setStep(1); if (i === 1) setStep(9); if (i === 2) setStep(20); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/40 ${item.hover} hover:bg-muted/20 transition-all text-left`}>
                  <div className={`shrink-0 p-2 rounded-lg ${item.bg}`}>
                    <item.icon className={`size-4 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground mb-2">Wähle den Spieler, den du melden möchtest</p>
              {DEMO_USERS.map((name, i) => (
                <button key={name} onClick={() => setSelectedUser(i)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${selectedUser === i ? "border-border/60 bg-accent/50" : "border-border/40 hover:bg-muted/20"}`}>
                  <div className={`shrink-0 p-1.5 rounded-lg ${selectedUser === i ? "bg-muted/50 text-foreground" : "bg-accent/30 text-muted-foreground"}`}>
                    <User className="size-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{name}</span>
                </button>
              ))}
              <div className="flex justify-end pt-2">
                <Button size="sm" className="h-7 text-xs bg-muted/50 hover:bg-accent/60 text-white border-0" disabled={selectedUser < 0} onClick={() => setStep(2)}>Weiter</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground mb-2">Wähle die Nachrichten, die du melden möchtest</p>
              {DEMO_CHATS.map((msg, i) => {
                const sel = selectedChats.includes(i);
                return (
                  <button key={i} onClick={() => toggleChat(i)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${sel ? "border-border/60 bg-accent/50" : "border-border/40 hover:bg-muted/20"}`}>
                    <div className={`shrink-0 size-5 rounded-md border flex items-center justify-center transition-all ${sel ? "border-border/80 bg-muted/50 text-foreground" : "border-border/50 bg-transparent"}`}>
                      {sel && <Check className="size-3" />}
                    </div>
                    <MessageSquare className="size-3.5 text-muted-foreground/40 shrink-0" />
                    <span className="text-xs text-foreground/80 truncate">{msg}</span>
                  </button>
                );
              })}
              <div className="flex justify-end pt-2">
                <Button size="sm" className="h-7 text-xs bg-muted/50 hover:bg-accent/60 text-white border-0" disabled={selectedChats.length === 0} onClick={() => setStep(3)}>Weiter</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-1.5">
              {selectedCat < 0 ? (
                <>
                  <p className="text-[11px] text-muted-foreground mb-2">Wähle eine Kategorie</p>
                  {DEMO_CATEGORIES.map((cat, i) => (
                    <button key={cat.name} onClick={() => { setSelectedCat(i); setSelectedTopic(-1); }} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/40 hover:bg-muted/20 transition-all text-left">
                      <span className="text-xs font-medium text-foreground">{cat.name}</span>
                      <ChevronRight className="size-4 text-muted-foreground/40" />
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button onClick={() => { setSelectedCat(-1); setSelectedTopic(-1); }} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2">
                    <ChevronLeft className="size-3.5" />Zurück zu Kategorien
                  </button>
                  {DEMO_CATEGORIES[selectedCat].topics.map((topic, i) => (
                    <button key={topic} onClick={() => setSelectedTopic(i)} className={`w-full px-3 py-2.5 rounded-xl border transition-all text-left text-xs font-medium ${selectedTopic === i ? "border-border/60 bg-accent/50 text-foreground" : "border-border/40 hover:bg-muted/20 text-foreground"}`}>
                      {topic}
                    </button>
                  ))}
                  <div className="flex justify-end pt-2">
                    <Button size="sm" className="h-7 text-xs bg-muted/50 hover:bg-accent/60 text-white border-0" disabled={selectedTopic < 0} onClick={() => setStep(4)}>Weiter</Button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">Beschreibe das Problem möglichst genau (min. 15 Zeichen)</p>
              <div className="relative">
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Was ist passiert?" rows={4} className="w-full px-3 py-2 text-xs rounded-lg border border-border/50 bg-accent/30 text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-ring resize-none" />
                <span className={`absolute bottom-2 right-2.5 text-[10px] ${message.length >= 15 ? "text-green-400" : "text-muted-foreground/40"}`}>{message.length}/15</span>
              </div>
              <div className="flex justify-end">
                <Button size="sm" className="h-7 text-xs bg-muted/50 hover:bg-accent/60 text-white border-0" disabled={message.length < 15} onClick={() => setStep(5)}>Weiter</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-2.5">
              <p className="text-[11px] text-muted-foreground">Prüfe deine Meldung und sende sie ab</p>
              <div className="px-3 py-2.5 rounded-xl border border-border/40 bg-muted/20">
                <p className="text-[10px] text-muted-foreground mb-0.5">Deine Beschreibung</p>
                <p className="text-xs text-foreground">{message}</p>
              </div>
              <div className="px-3 py-2.5 rounded-xl border border-border/40 bg-muted/20">
                <p className="text-[10px] text-muted-foreground mb-0.5">Gemeldete Nachrichten</p>
                <p className="text-xs text-foreground">{selectedChats.length} Nachricht(en) ausgewählt</p>
              </div>
              <div className="flex justify-end pt-1">
                <Button size="sm" className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white border-0" onClick={reset}>
                  <Send className="size-3" />Meldung absenden
                </Button>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">Beschreibe dein Anliegen, damit ein Teammitglied dir helfen kann (min. 15 Zeichen)</p>
              <div className="relative">
                <textarea value={userRequest} onChange={e => setUserRequest(e.target.value)} placeholder="Wie können wir dir helfen?" rows={4} maxLength={140} className="w-full px-3 py-2 text-xs rounded-lg border border-border/50 bg-accent/30 text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-ring resize-none" />
                <span className={`absolute bottom-2 right-2.5 text-[10px] ${userRequest.length >= 15 ? "text-green-400" : "text-muted-foreground/40"}`}>{userRequest.length}/140</span>
              </div>
              <Button size="sm" className="h-7 text-xs w-full bg-muted/50 hover:bg-accent/60 text-white border-0" disabled={userRequest.length < 15} onClick={() => {
                // IMMER Loopback — Emulator-Pfad unzuverlässig (isOnDuty kann false sein)
                isLoopbackRef.current = true;
                stepRef.current = 10;
                setIsLoopback(true);
                setHelpRequestDescription(userRequest);
                setStep(10);
                setPopoverOpen(true);
                setTimeout(() => { stepRef.current = 15; setStep(15); }, 800);
              }}>
                Anfrage senden
              </Button>
            </div>
          )}

          {step === 10 && (
            <div className="flex flex-col items-center text-center py-4 space-y-3">
              <Loader2 className="size-8 text-blue-400 animate-spin" />
              <div>
                <p className="text-xs font-semibold text-foreground">Deine Anfrage wird bearbeitet...</p>
                <p className="text-[11px] text-muted-foreground mt-1">Geschätzte Wartezeit: ~2 Minuten</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10" onClick={cancelRequest}>Abbrechen</Button>
            </div>
          )}

          {step === 11 && (
            <div className="flex flex-col items-center text-center py-4 space-y-3">
              <CheckCircle2 className="size-8 text-green-400" />
              <div>
                <p className="text-xs font-semibold text-foreground">Ein Teammitglied wurde gefunden!</p>
                <p className="text-[11px] text-muted-foreground mt-1">Du wirst gleich verbunden...</p>
              </div>
            </div>
          )}

          {step === 12 && (
            <div className="flex flex-col gap-2.5">
              <div className="h-[200px] overflow-y-auto space-y-2 pr-1">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-2.5 py-1.5 rounded-xl text-xs leading-relaxed ${msg.from === "user" ? "bg-muted/50 text-foreground" : "bg-accent/30 text-foreground"}`}>
                      {msg.from === "staff" && <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">{partnerName}</p>}
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="px-2.5 py-1.5 rounded-xl text-xs text-muted-foreground/60 italic">
                      {partnerName} tippt...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-1.5">
                <Input placeholder="Nachricht schreiben..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendChatMessage(); }} className="h-7 text-xs flex-1 bg-accent/30 border-border/50 text-foreground placeholder:text-muted-foreground/40" />
                <Button size="sm" className="h-7 text-xs shrink-0 bg-muted/50 hover:bg-accent/60 text-white border-0" onClick={sendChatMessage}>Senden</Button>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs w-full text-green-400 border-green-500/20 hover:bg-green-500/10" onClick={endSession}>Gespräch beenden</Button>
            </div>
          )}

          {step === 15 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="size-4 text-blue-400" />
                  <span className="text-xs font-semibold text-foreground">Neue Supportanfrage</span>
                </div>
                <p className="text-xs text-foreground/80 break-words leading-relaxed">{helpRequestDescription}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button size="sm" className="h-7 text-xs w-full bg-green-600 hover:bg-green-500 text-primary-foreground border-0" onClick={acceptRequest}>
                  Anfrage annehmen
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs w-full border-border/50 text-muted-foreground hover:bg-muted/50" onClick={skipRequest}>
                  Überspringen
                </Button>
              </div>
            </div>
          )}

          {step === 16 && (
            <div className="flex flex-col items-center text-center py-4 space-y-3">
              <AlertTriangle className="size-8 text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-foreground">Keine Helfer verfügbar</p>
                <p className="text-[11px] text-muted-foreground mt-1">Aktuell ist kein Teammitglied im Dienst. Versuche es später erneut.</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={reset}>Zurück</Button>
            </div>
          )}

          {step === 20 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-green-500/20 bg-green-500/10">
                <CheckCircle2 className="size-4 text-green-400 shrink-0" />
                <p className="text-xs font-medium text-green-300">Keine aktiven Sanktionen</p>
              </div>
              <div className="px-3 py-2.5 rounded-xl border border-border/40 bg-muted/20">
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Letzte Sanktion</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">Typ</span><span className="text-[11px] font-medium text-foreground">Mute (2 Stunden)</span></div>
                  <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">Datum</span><span className="text-[11px] font-medium text-foreground">15.02.2026, 14:32</span></div>
                  <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">Grund</span><span className="text-[11px] font-medium text-foreground">Beleidigung</span></div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 bg-muted/20">
                <Clock className="size-3.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Bewährung verbleibend</p>
                  <p className="text-xs font-medium text-foreground">3 Tage</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/20 bg-amber-500/10">
                <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-300">Bei erneutem Verstoß: Ban (24 Stunden)</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs w-full border-border/50 text-muted-foreground hover:bg-accent/50" onClick={reset}>Verstanden</Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const LEVEL_STATS = [
  { emoji: "🕐", label: "Spielzeit", value: "142 Stunden" },
  { emoji: "💬", label: "Nachrichten", value: "8.430" },
  { emoji: "🏠", label: "Räume besucht", value: "1.240" },
  { emoji: "⭐", label: "Respekt", value: "347" },
];

function LevelPopover() {
  const { achievementScore = 0 } = useAchievements();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
          <span className="text-xs font-semibold text-foreground">Lvl {Math.floor(achievementScore / 100) || 1}</span>
          <div className="w-[60px] h-[3px] bg-muted/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full" style={{ width: `${(achievementScore % 100) || 67}%` }} />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={8} className="w-[260px] p-0">
        <div className="px-4 pt-3 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-400" />
            <span className="text-sm font-bold text-foreground">Level {Math.floor(achievementScore / 100) || 1}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Erfahrener Spieler</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Progress value={achievementScore % 100 || 67} className="h-2 bg-muted/50 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-yellow-500" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground tabular-nums">{achievementScore} XP</span>
              <span className="text-[11px] font-semibold text-foreground tabular-nums">{achievementScore % 100 || 67}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {LEVEL_STATS.map(s => (
              <div key={s.label} className="px-2.5 py-2 rounded-lg border border-border/40 bg-muted/20">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs leading-none">{s.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xs font-semibold text-foreground tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10">
            <Gift className="size-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-amber-300">Nächste Belohnung</p>
              <p className="text-[10px] text-amber-400/60">Exklusiver Badge + 500 Diamanten</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const SETTINGS_TOGGLES = [
  { label: "Alten Chat bevorzugen", defaultOn: false },
  { label: "Raumeinladungen ignorieren", defaultOn: true },
  { label: "Kamera folgt nicht", defaultOn: false },
  { label: "Mehrere Objekte platzieren", defaultOn: false },
  { label: "Kaufbestätigung überspringen", defaultOn: false },
];

const VOLUME_SLIDERS = [
  { label: "System-Sounds", defaultVal: 60 },
  { label: "Möbel-Sounds", defaultVal: 40 },
  { label: "Trax-Musik", defaultVal: 80 },
];

function SettingsPopover() {
  const [toggles, setToggles] = useState(SETTINGS_TOGGLES.map(t => t.defaultOn));
  const [volumes, setVolumes] = useState(VOLUME_SLIDERS.map(v => v.defaultVal));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
          <i className="icon icon-cog" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[340px] p-0">
        <div className="px-4 pt-3 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Settings className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Einstellungen</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Allgemein</span>
            <div className="mt-2 space-y-2.5">
              {SETTINGS_TOGGLES.map((t, i) => (
                <div key={t.label} className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{t.label}</span>
                  <Switch checked={toggles[i]} onCheckedChange={v => setToggles(prev => { const n = [...prev]; n[i] = v; return n; })} />
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-accent/50" />

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Lautstärke</span>
            <div className="mt-3 space-y-4">
              {VOLUME_SLIDERS.map((v, i) => (
                <div key={v.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{v.label}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{volumes[i]}%</span>
                  </div>
                  <Slider value={[volumes[i]]} max={100} step={1} onValueChange={(val: number[]) => setVolumes(prev => { const n = [...prev]; n[i] = val[0]; return n; })} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const PurseView: FC<{}> = props => {
  const { purse = null, hcDisabled = false } = usePurse();
  const { roomSession = null } = useRoom();
  const { navigatorData = null } = useNavigator();
  const [ isZoomedIn, setIsZoomedIn ] = useState(false);

  const handleZoom = useCallback(() => {
    if(!roomSession) return;
    setIsZoomedIn(prev => {
      let scale = GetRoomEngine().getRoomInstanceRenderingCanvasScale(roomSession.roomId, 1);
      if(!prev) scale /= 2; else scale *= 2;
      GetRoomEngine().setRoomInstanceRenderingCanvasScale(roomSession.roomId, 1, scale);
      return !prev;
    });
  }, [roomSession]);

  const displayedCurrencies = useMemo(() => GetConfiguration<number[]>('system.currency.types', []), []);
  const currencyDisplayNumberShort = useMemo(() => GetConfiguration<boolean>('currency.display.number.short', false), []);

  const [offerCount, setOfferCount] = useState(0);

  useEffect(() => {
    const fetchOffers = () => {
      try {
        const cmsUrl = GetConfiguration<string>('url.prefix', '');
        const userId = GetSessionDataManager().userId;
        if (!cmsUrl || !userId) return;
        fetch(`${cmsUrl}/api/marketplace?action=my-offers-received`, { headers: getAuthHeaders() })
          .then(r => r.ok ? r.json() : [])
          .then(data => setOfferCount(Array.isArray(data) ? data.length : 0))
          .catch(() => {});
      } catch {}
    };
    fetchOffers();
    const interval = setInterval(fetchOffers, 30000);
    return () => clearInterval(interval);
  }, []);

  const getClubText = (() => {
    if (!purse) return null;
    const totalDays = ((purse.clubPeriods * 31) + purse.clubDays);
    const minutesUntilExpiration = purse.minutesUntilExpiration;
    if (purse.clubLevel === HabboClubLevelEnum.NO_CLUB) return LocalizeText('purse.clubdays.zero.amount.text');
    else if ((minutesUntilExpiration > -1) && (minutesUntilExpiration < (60 * 24))) return FriendlyTime.shortFormat(minutesUntilExpiration * 60);
    else return FriendlyTime.shortFormat(totalDays * 86400);
  })();

  const getCurrencyElements = () => {
    if (!purse || !purse.activityPoints || !purse.activityPoints.size) return null;
    const types = Array.from(purse.activityPoints.keys()).filter(type => displayedCurrencies.indexOf(type) >= 0);
    return types.map(type => {
      const amount = purse.activityPoints.get(type);
      const display = currencyDisplayNumberShort ? LocalizeShortNumber(amount) : LocalizeFormattedNumber(amount);
      return (
        <Tooltip key={type}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <CurrencyIcon type={String(type)} />
              <span className="text-xs font-semibold text-foreground tabular-nums">{display}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Währung {type}</TooltipContent>
        </Tooltip>
      );
    });
  };

  if (!purse) return null;

  const creditsDisplay = currencyDisplayNumberShort ? LocalizeShortNumber(purse.credits) : LocalizeFormattedNumber(purse.credits);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[69] pointer-events-auto inline-flex items-center gap-1 py-1.5 px-3 rounded-2xl bg-card border border-border/40 shadow-md">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <CurrencyIcon type="-1" />
              <span className="text-xs font-semibold text-foreground tabular-nums">{creditsDisplay}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Credits</TooltipContent>
        </Tooltip>

        {getCurrencyElements()}

        <div className="w-px h-6 bg-accent/50 mx-1.5" />

        <LevelPopover />

        <div className="w-px h-6 bg-accent/50 mx-1.5" />

        {!hcDisabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => CreateLinkEvent('habboUI/open/hccenter')}>
                <CurrencyIcon type="hc" />
                <span className="text-xs font-medium text-foreground">{getClubText}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Habbo Club</TooltipContent>
          </Tooltip>
        )}

        {!hcDisabled && <div className="w-px h-6 bg-accent/50 mx-1.5" />}

        {TOOL_ICONS.map(({ iconId, label, link }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <div className="relative p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => CreateLinkEvent(link)}>
                <CatalogIcon iconId={iconId} />
                {label === "Marktplatz" && offerCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none shadow-sm">{offerCount}</span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
          </Tooltip>
        ))}

        { roomSession && (
          <>
            <div className="w-px h-6 bg-accent/50 mx-1.5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={ () => CreateLinkEvent('navigator/toggle-room-info') }>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Raum Info</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={ handleZoom }>
                  { isZoomedIn ? <ZoomOut className="w-4 h-4 text-muted-foreground" /> : <ZoomIn className="w-4 h-4 text-muted-foreground" /> }
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{ isZoomedIn ? 'Herauszoomen' : 'Hineinzoomen' }</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={ () => CreateLinkEvent('chat-history/toggle') }>
                  <MessageSquareDashed className="w-4 h-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Chat-Verlauf</TooltipContent>
            </Tooltip>
            { navigatorData?.canRate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={ () => SendMessageComposer(new RateFlatMessageComposer(1)) }>
                    <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Raum bewerten</TooltipContent>
              </Tooltip>
            ) }
          </>
        ) }

        <div className="w-px h-6 bg-accent/50 mx-1.5" />

        <HelpPopover />
        <SettingsPopover />
      </div>
    </TooltipProvider>
  );
}
