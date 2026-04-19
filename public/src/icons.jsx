// Minimal line icons (Lucide-style). Consistent 1.5 stroke, 20px default.
const Icon = ({ children, size = 20, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...rest}>{children}</svg>
);

const Home = (p) => <Icon {...p}><path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></Icon>;
const Calendar = (p) => <Icon {...p}><rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M3 10h18M8 3v3M16 3v3"/></Icon>;
const Users = (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.7-3.3 3.4-5 6.5-5s5.8 1.7 6.5 5"/><circle cx="17" cy="7" r="2.5"/><path d="M16 13c2.5 0 4.5 1.2 5.5 4"/></Icon>;
const Wallet = (p) => <Icon {...p}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 9h18M17 14h1.5"/><path d="M17 6V4a1 1 0 0 0-1.3-1L4 6"/></Icon>;
const FileText = (p) => <Icon {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></Icon>;
const MessageCircle = (p) => <Icon {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l.9-5A8 8 0 1 1 21 12z"/></Icon>;
const Settings = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></Icon>;
const Plus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const Search = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
const ChevronRight = (p) => <Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>;
const ChevronDown = (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>;
const ChevronLeft = (p) => <Icon {...p}><path d="m15 6-6 6 6 6"/></Icon>;
const MapPin = (p) => <Icon {...p}><path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></Icon>;
const Clock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
const Download = (p) => <Icon {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></Icon>;
const Upload = (p) => <Icon {...p}><path d="M12 17V5M7 10l5-5 5 5M5 21h14"/></Icon>;
const Mail = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></Icon>;
const Phone = (p) => <Icon {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.8.6A2 2 0 0 1 22 16.9z"/></Icon>;
const Edit = (p) => <Icon {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></Icon>;
const Trash = (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></Icon>;
const Check = (p) => <Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>;
const X = (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>;
const AlertCircle = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></Icon>;
const Send = (p) => <Icon {...p}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></Icon>;
const MoreH = (p) => <Icon {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Icon>;
const Bell = (p) => <Icon {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>;
const LogOut = (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Icon>;
const Sparkles = (p) => <Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/></Icon>;
const Filter = (p) => <Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></Icon>;
const List = (p) => <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Icon>;
const Grid = (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Icon>;
const Tent = (p) => <Icon {...p}><path d="M3.5 21 12 4l8.5 17"/><path d="M12 4v17M9 21l3-4 3 4"/></Icon>;
const Compass = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="m14.5 9.5-2 5-5 2 2-5z"/></Icon>;
const Leaf = (p) => <Icon {...p}><path d="M11 20A7 7 0 0 1 4 13V5a1 1 0 0 1 1-1h8a7 7 0 0 1 7 7 9 9 0 0 1-9 9z"/><path d="M4 21 14 11"/></Icon>;
const Flame = (p) => <Icon {...p}><path d="M12 2s5 4 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 0 2 3 3 3 0 0-2 0-3 0-3z"/></Icon>;
const Printer = (p) => <Icon {...p}><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></Icon>;
const FileDown = (p) => <Icon {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 12v6M9 15l3 3 3-3"/></Icon>;
const Paperclip = (p) => <Icon {...p}><path d="m21 12-9 9a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 1 1 5.2 5.2L9.6 18.2a1.8 1.8 0 1 1-2.6-2.6L16 7"/></Icon>;
const PiggyBank = (p) => <Icon {...p}><path d="M20 12.5c0 3.5-3.6 6.5-8 6.5s-8-3-8-6.5c0-2 1-3.8 2.5-5"/><circle cx="15.5" cy="12" r=".8" fill="currentColor"/><path d="M13 5.5a3.5 3.5 0 0 0-6.5 2M20 10.5c1.5 0 2 1 2 2s-.5 2-2 2"/></Icon>;

Object.assign(window, {
  IconHome: Home, IconCalendar: Calendar, IconUsers: Users, IconWallet: Wallet,
  IconFileText: FileText, IconMessageCircle: MessageCircle, IconSettings: Settings,
  IconPlus: Plus, IconSearch: Search, IconChevronRight: ChevronRight,
  IconChevronDown: ChevronDown, IconChevronLeft: ChevronLeft, IconMapPin: MapPin,
  IconClock: Clock, IconDownload: Download, IconUpload: Upload, IconMail: Mail,
  IconPhone: Phone, IconEdit: Edit, IconTrash: Trash, IconCheck: Check, IconX: X,
  IconAlertCircle: AlertCircle, IconSend: Send, IconMoreH: MoreH, IconBell: Bell,
  IconLogOut: LogOut, IconSparkles: Sparkles, IconFilter: Filter, IconList: List,
  IconGrid: Grid, IconTent: Tent, IconCompass: Compass, IconLeaf: Leaf,
  IconFlame: Flame, IconPrinter: Printer, IconFileDown: FileDown,
  IconPaperclip: Paperclip, IconPiggyBank: PiggyBank,
});
