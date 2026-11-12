import type { Language } from "@/lib/constants";

type Text = Record<Language, string>;

/** When this notice last changed. Update it with any change below. */
export const PRIVACY_UPDATED: Text = { en: "Last updated 12 November 2026", ms: "Dikemas kini 12 November 2026" };

export const PRIVACY_SUMMARY: Text = {
  en: "DriveMy keeps your account and your learning results so you can see your progress. We never sell your data. You can download or delete all of it in Settings, at any time.",
  ms: "DriveMy menyimpan akaun dan keputusan pembelajaran anda supaya anda dapat melihat kemajuan anda. Kami tidak sekali-kali menjual data anda. Anda boleh memuat turun atau memadam semuanya di Tetapan, pada bila-bila masa.",
};

/**
 * Each section is a heading and short facts. Keep them true to the code and database: what is stored
 * (src/types/database.ts, supabase/migrations), the retention windows (20260804000200_data_retention.sql),
 * the security log (20260804000300_audit_log.sql), the device storage (src/lib/testProgress.ts, consent.ts,
 * the stores) and the services the app calls.
 */
export const PRIVACY_SECTIONS: { id: string; title: Text; items: Text[] }[] = [
  {
    id: "keep",
    title: { en: "What we keep", ms: "Apa yang kami simpan" },
    items: [
      {
        en: "Your account: your email address. If you sign in with Google, also the name and profile picture link that Google shares.",
        ms: "Akaun anda: alamat e-mel anda. Jika anda log masuk dengan Google, juga nama dan pautan gambar profil yang dikongsi oleh Google.",
      },
      {
        en: "Your results: quiz and mock test answers and scores, simulator runs, and the Learn and RPK / RSM topics you have finished.",
        ms: "Keputusan anda: jawapan dan markah kuiz serta ujian percubaan, larian simulator, dan topik Belajar serta RPK / RSM yang telah anda selesaikan.",
      },
      {
        en: "Your colour test answers and result. This is health-related, so we keep it for a shorter time.",
        ms: "Jawapan dan keputusan ujian warna anda. Ini maklumat berkaitan kesihatan, jadi kami menyimpannya untuk tempoh yang lebih singkat.",
      },
      {
        en: "How many times a day you press Listen, so narration stays within its daily limit.",
        ms: "Berapa kali sehari anda menekan Dengar, supaya bacaan suara kekal dalam had hariannya.",
      },
      {
        en: "A security log entry, with your email address, when your account is created and when it is deleted.",
        ms: "Catatan log keselamatan, berserta alamat e-mel anda, apabila akaun anda dicipta dan apabila ia dipadam.",
      },
    ],
  },
  {
    id: "device",
    title: { en: "Kept on this device", ms: "Disimpan pada peranti ini" },
    items: [
      {
        en: "Your sign-in, theme, language and error report choice.",
        ms: "Log masuk, tema, bahasa dan pilihan laporan ralat anda.",
      },
      {
        en: "An unfinished test, so you can carry on where you left off, and results waiting to upload after you were offline. Signing out clears unfinished tests.",
        ms: "Ujian yang belum selesai, supaya anda boleh menyambungnya, dan keputusan yang menunggu untuk dimuat naik selepas anda di luar talian. Log keluar akan memadam ujian yang belum selesai.",
      },
    ],
  },
  {
    id: "why",
    title: { en: "Why we keep it", ms: "Mengapa kami menyimpannya" },
    items: [
      {
        en: "To mark your tests, show your progress, let you carry on where you left off and keep the app working. We do not sell your data or use it for advertising.",
        ms: "Untuk menanda ujian anda, menunjukkan kemajuan anda, membolehkan anda menyambung dari tempat anda berhenti dan memastikan aplikasi berfungsi. Kami tidak menjual data anda atau menggunakannya untuk pengiklanan.",
      },
    ],
  },
  {
    id: "others",
    title: { en: "Who else handles it", ms: "Pihak lain yang mengendalikannya" },
    items: [
      {
        en: "Supabase stores your account and results and runs sign-in.",
        ms: "Supabase menyimpan akaun dan keputusan anda serta mengendalikan log masuk.",
      },
      {
        en: "Vercel hosts the website and, like any web host, sees your IP address when you visit.",
        ms: "Vercel menjadi hos laman web dan, seperti mana-mana hos web, dapat melihat alamat IP anda apabila anda melawat.",
      },
      {
        en: "Google, only if you choose to sign in with Google.",
        ms: "Google, hanya jika anda memilih untuk log masuk dengan Google.",
      },
      {
        en: "Cloudflare, when bot protection is switched on, checks that a password reset or sign-up email request comes from a person.",
        ms: "Cloudflare, apabila perlindungan bot dihidupkan, memastikan permintaan menetapkan semula kata laluan atau e-mel pendaftaran datang daripada manusia.",
      },
      {
        en: "Fish Audio turns the text on screen into speech when you press Listen. It does not get your email address, account details or scores.",
        ms: "Fish Audio menukar teks di skrin kepada suara apabila anda menekan Dengar. Ia tidak menerima alamat e-mel, butiran akaun atau markah anda.",
      },
      {
        en: "Sentry receives error reports only if you allow them. Reports leave out personal details and the parts of web addresses that can hold sign-in codes.",
        ms: "Sentry menerima laporan ralat hanya jika anda membenarkannya. Laporan tidak mengandungi butiran peribadi dan bahagian alamat web yang boleh mengandungi kod log masuk.",
      },
    ],
  },
  {
    id: "time",
    title: { en: "How long we keep it", ms: "Berapa lama kami menyimpannya" },
    items: [
      {
        en: "Quiz, mock test and simulator results: 2 years after each attempt.",
        ms: "Keputusan kuiz, ujian percubaan dan simulator: 2 tahun selepas setiap percubaan.",
      },
      {
        en: "Colour test results: 1 year after each test.",
        ms: "Keputusan ujian warna: 1 tahun selepas setiap ujian.",
      },
      {
        en: "Your account and finished topics: until you delete your account.",
        ms: "Akaun dan topik yang telah selesai: sehingga anda memadam akaun anda.",
      },
      {
        en: "The security log entry: kept after your account is deleted, as a record that the deletion happened.",
        ms: "Catatan log keselamatan: disimpan selepas akaun anda dipadam, sebagai rekod bahawa pemadaman telah berlaku.",
      },
    ],
  },
  {
    id: "choices",
    title: { en: "Your choices", ms: "Pilihan anda" },
    items: [
      {
        en: "Export My Data downloads everything we hold about you as a file.",
        ms: "Eksport Data Saya memuat turun semua data yang kami simpan tentang anda sebagai satu fail.",
      },
      {
        en: "Reset Progress deletes your results but keeps your account. Delete Account removes your account and everything in it.",
        ms: "Tetapkan Semula Kemajuan memadam keputusan anda tetapi mengekalkan akaun. Padam Akaun membuang akaun anda dan semua isinya.",
      },
      {
        en: "Error reporting lets you allow or stop error reports.",
        ms: "Laporan ralat membolehkan anda membenarkan atau menghentikan laporan ralat.",
      },
      {
        en: "DriveMy follows Malaysia's Personal Data Protection Act 2010.",
        ms: "DriveMy mematuhi Akta Perlindungan Data Peribadi 2010 Malaysia.",
      },
    ],
  },
];
