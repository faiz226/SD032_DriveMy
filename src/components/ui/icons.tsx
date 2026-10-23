/**
 * Every icon in DriveMy, drawn from Hugeicons (free stroke-rounded set,
 * https://hugeicons.com). Components keep the names and props the app already
 * used (size, weight, className, aria-*), so a screen imports from here and
 * never from an icon package directly: one family, one place to change it.
 *
 * The free set has a single stroke style, so `weight` maps onto stroke width:
 * "fill" and "bold" draw heavier, which is how active states read.
 */
import * as React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Activity01Icon,
  Alert02Icon,
  AnalyticsUpIcon,
  ArrowDataTransferHorizontalIcon,
  ArrowDown01Icon,
  ArrowDown02Icon,
  ArrowDownToLineIcon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowLeftBigIcon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowRightBigIcon,
  ArrowUp01Icon,
  ArrowUp02Icon,
  ArrowUpToLineIcon,
  Book01Icon,
  Bookmark01Icon,
  BookOpen01Icon,
  Brain01Icon,
  BulbIcon,
  Calendar03Icon,
  Cancel01Icon,
  CancelCircleIcon,
  Car01Icon,
  CarParking01Icon,
  ChampionIcon,
  CheckmarkCircle02Icon,
  CircleArrowLeft01Icon,
  CircleArrowRight01Icon,
  CircleIcon,
  ClipboardIcon,
  Clock01Icon,
  CompassIcon,
  ComputerIcon,
  DashboardSpeed02Icon,
  DashboardSquare01Icon,
  DiscIcon,
  Download01Icon,
  FilterIcon,
  Flag02Icon,
  FlashIcon,
  FlashlightIcon,
  GitMergeIcon,
  GridViewIcon,
  Home01Icon,
  InformationCircleIcon,
  LanguageCircleIcon,
  LeftToRightListBulletIcon,
  LockIcon,
  Logout01Icon,
  Mail01Icon,
  MapIcon,
  Menu01Icon,
  Moon02Icon,
  MountainIcon,
  PauseIcon,
  PlayIcon,
  QrCodeIcon,
  Refresh01Icon,
  RotateLeft01Icon,
  RotateRight01Icon,
  Route01Icon,
  Search01Icon,
  SearchAddIcon,
  SearchMinusIcon,
  SecurityCheckIcon,
  SecurityWarningIcon,
  Settings01Icon,
  Shield01Icon,
  SquareIcon,
  StarIcon,
  StopIcon,
  Sun03Icon,
  Target02Icon,
  Task01Icon,
  Tick02Icon,
  UserGroupIcon,
  UserIcon,
  Video01Icon,
  ViewIcon,
  ViewOffSlashIcon,
  VolumeHighIcon,
  WavesIcon,
  WifiOff01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

export type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "ref"> {
  size?: number | string;
  weight?: IconWeight;
  mirrored?: boolean;
}

export type Icon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

const STROKE: Record<IconWeight, number> = {
  thin: 1,
  light: 1.3,
  regular: 1.6,
  duotone: 1.6,
  bold: 2,
  fill: 2,
};

function icon(svg: IconSvgElement, name: string): Icon {
  const Component = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = "1em", weight = "regular", mirrored, style, strokeWidth, ...props }, ref) => (
      <HugeiconsIcon
        ref={ref}
        icon={svg}
        size={size}
        strokeWidth={typeof strokeWidth === "number" ? strokeWidth : STROKE[weight]}
        style={mirrored ? { transform: "scaleX(-1)", ...style } : style}
        {...props}
      />
    ),
  );
  Component.displayName = name;
  return Component;
}

export const Activity = icon(Activity01Icon, "Activity");
export const ArrowCircleLeft = icon(CircleArrowLeft01Icon, "ArrowCircleLeft");
export const ArrowCircleRight = icon(CircleArrowRight01Icon, "ArrowCircleRight");
export const ArrowClockwise = icon(RotateRight01Icon, "ArrowClockwise");
export const ArrowCounterClockwise = icon(RotateLeft01Icon, "ArrowCounterClockwise");
export const ArrowDown = icon(ArrowDown02Icon, "ArrowDown");
export const ArrowFatLeft = icon(ArrowLeftBigIcon, "ArrowFatLeft");
export const ArrowFatRight = icon(ArrowRightBigIcon, "ArrowFatRight");
export const ArrowLeft = icon(ArrowLeft02Icon, "ArrowLeft");
export const ArrowLineDown = icon(ArrowDownToLineIcon, "ArrowLineDown");
export const ArrowLineUp = icon(ArrowUpToLineIcon, "ArrowLineUp");
export const ArrowRight = icon(ArrowRight02Icon, "ArrowRight");
export const ArrowsClockwise = icon(Refresh01Icon, "ArrowsClockwise");
export const ArrowsLeftRight = icon(ArrowDataTransferHorizontalIcon, "ArrowsLeftRight");
export const ArrowUp = icon(ArrowUp02Icon, "ArrowUp");
export const Bell = icon(Alert02Icon, "Bell");
export const Book = icon(Book01Icon, "Book");
export const BookmarkSimple = icon(Bookmark01Icon, "BookmarkSimple");
export const BookOpen = icon(BookOpen01Icon, "BookOpen");
export const Brain = icon(Brain01Icon, "Brain");
export const Calendar = icon(Calendar03Icon, "Calendar");
export const Car = icon(Car01Icon, "Car");
export const CaretDown = icon(ArrowDown01Icon, "CaretDown");
export const CaretLeft = icon(ArrowLeft01Icon, "CaretLeft");
export const CaretRight = icon(ArrowRight01Icon, "CaretRight");
export const CaretUp = icon(ArrowUp01Icon, "CaretUp");
export const ChartLineUp = icon(AnalyticsUpIcon, "ChartLineUp");
export const Check = icon(Tick02Icon, "Check");
export const CheckCircle = icon(CheckmarkCircle02Icon, "CheckCircle");
export const Circle = icon(CircleIcon, "Circle");
export const Clipboard = icon(ClipboardIcon, "Clipboard");
export const ClipboardText = icon(Task01Icon, "ClipboardText");
export const Clock = icon(Clock01Icon, "Clock");
export const Compass = icon(CompassIcon, "Compass");
export const Disc = icon(DiscIcon, "Disc");
export const Download = icon(Download01Icon, "Download");
export const Envelope = icon(Mail01Icon, "Envelope");
export const Eye = icon(ViewIcon, "Eye");
export const EyeSlash = icon(ViewOffSlashIcon, "EyeSlash");
export const Flag = icon(Flag02Icon, "Flag");
export const FunnelSimple = icon(FilterIcon, "FunnelSimple");
export const Gauge = icon(DashboardSpeed02Icon, "Gauge");
export const Gear = icon(Settings01Icon, "Gear");
export const GitMerge = icon(GitMergeIcon, "GitMerge");
export const GridFour = icon(GridViewIcon, "GridFour");
export const Headlights = icon(FlashlightIcon, "Headlights");
export const House = icon(Home01Icon, "House");
export const Info = icon(InformationCircleIcon, "Info");
export const Lightbulb = icon(BulbIcon, "Lightbulb");
export const Lightning = icon(FlashIcon, "Lightning");
export const List = icon(Menu01Icon, "List");
export const ListBullets = icon(LeftToRightListBulletIcon, "ListBullets");
export const Lock = icon(LockIcon, "Lock");
export const MagnifyingGlass = icon(Search01Icon, "MagnifyingGlass");
export const MagnifyingGlassMinus = icon(SearchMinusIcon, "MagnifyingGlassMinus");
export const MagnifyingGlassPlus = icon(SearchAddIcon, "MagnifyingGlassPlus");
export const MapTrifold = icon(MapIcon, "MapTrifold");
export const Monitor = icon(ComputerIcon, "Monitor");
export const Moon = icon(Moon02Icon, "Moon");
export const Mountains = icon(MountainIcon, "Mountains");
export const Parking = icon(CarParking01Icon, "Parking");
export const Path = icon(Route01Icon, "Path");
export const Pause = icon(PauseIcon, "Pause");
export const Play = icon(PlayIcon, "Play");
export const QrCode = icon(QrCodeIcon, "QrCode");
export const Shield = icon(Shield01Icon, "Shield");
export const ShieldCheck = icon(SecurityCheckIcon, "ShieldCheck");
export const ShieldWarning = icon(SecurityWarningIcon, "ShieldWarning");
export const SignOut = icon(Logout01Icon, "SignOut");
export const SpeakerHigh = icon(VolumeHighIcon, "SpeakerHigh");
export const Square = icon(SquareIcon, "Square");
export const SquaresFour = icon(DashboardSquare01Icon, "SquaresFour");
export const Star = icon(StarIcon, "Star");
export const Stop = icon(StopIcon, "Stop");
export const Sun = icon(Sun03Icon, "Sun");
export const Target = icon(Target02Icon, "Target");
export const Translate = icon(LanguageCircleIcon, "Translate");
export const TrendUp = icon(AnalyticsUpIcon, "TrendUp");
export const Trophy = icon(ChampionIcon, "Trophy");
export const User = icon(UserIcon, "User");
export const Users = icon(UserGroupIcon, "Users");
export const VideoCamera = icon(Video01Icon, "VideoCamera");
export const Warning = icon(Alert02Icon, "Warning");
export const Waves = icon(WavesIcon, "Waves");
export const WifiSlash = icon(WifiOff01Icon, "WifiSlash");
export const Wrench = icon(Wrench01Icon, "Wrench");
export const X = icon(Cancel01Icon, "X");
export const XCircle = icon(CancelCircleIcon, "XCircle");
