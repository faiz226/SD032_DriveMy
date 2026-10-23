// DriveMy patch (the only local change to the vendored bklit source): upstream
// hardcodes "en-US", so a Malay reader saw English dates on every chart. These
// keep the upstream `.format(value)` shape but follow <html lang>, which the
// app sets from the learner's language. Re-apply after updating bklit.
const pageLocale = () => (typeof document !== "undefined" && document.documentElement.lang === "ms" ? "ms-MY" : "en-MY");

const dateFormatter = (options: Intl.DateTimeFormatOptions) => ({
  format: (value: Date | number) => new Intl.DateTimeFormat(pageLocale(), options).format(value),
});

export const shortDateFmt = dateFormatter({
  month: "short",
  day: "numeric",
});

export const weekdayDateFmt = dateFormatter({
  weekday: "short",
  month: "short",
  day: "numeric",
});

export const hmsTimeFmt = dateFormatter({
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export const intFmt = (value: number) => new Intl.NumberFormat(pageLocale()).format(value);
