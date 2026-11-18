-- Balance the answer lengths so the longest option is no more likely to be right than any other (the audit found 31
-- questions whose correct option was clearly the longest). Only distractor wording changes; every correct option and
-- correct_index stays as it was. Re-running sets the same values, so it is safe to run twice.
UPDATE public.kpp_questions SET options_en = '["Designated U-turn","One-way traffic","Turn right only","Keep to the right side"]'::jsonb, options_ms = '["Tempat pusingan U","Trafik sehala","Belok kanan sahaja","Ikut sebelah kanan"]'::jsonb
  WHERE id = '618f6ddc-44b0-41a6-bb5d-953abc1f9115';
UPDATE public.kpp_questions SET options_en = '["Pass either side of the island","Limited clearance beside the road","Obstacle at the traffic divider","Risk of falling rocks ahead"]'::jsonb, options_ms = '["Lalui pulau dari mana-mana sisi","Kelegaan laluan terhad di hadapan","Halangan di pembahagi jalan","Risiko runtuhan batu"]'::jsonb
  WHERE id = '11a7d793-f8d2-5188-acd6-e158ecdb8de1';
UPDATE public.kpp_questions SET options_en = '["End of the posted speed limit","Stop for children crossing","No sounding of the horn here","Stop at the next junction"]'::jsonb, options_ms = '["Had laju yang dipaparkan tamat","Berhenti untuk kanak-kanak melintas","Dilarang membunyikan hon","Berhenti di persimpangan"]'::jsonb
  WHERE id = '87c01b4c-a79f-4ab8-adb8-77b40efab05a';
UPDATE public.kpp_questions SET options_en = '["No entry over 8 tonnes","Stop for children crossing","End of the posted speed limit","No sounding the horn"]'::jsonb, options_ms = '["Kenderaan melebihi 8 tan dilarang masuk","Berhenti untuk kanak-kanak melintas","Had laju yang dipaparkan telah tamat","Dilarang membunyikan hon di kawasan ini"]'::jsonb
  WHERE id = '6a33c973-7421-44f3-80f3-6f5b01da7697';
UPDATE public.kpp_questions SET options_en = '["After the road ahead is clear","Just before you reach the crest","Just as you reach the crest","As soon as the car ahead slows"]'::jsonb, options_ms = '["Selepas laluan di hadapan jelas","Sebelum tiba di puncak","Sebaik tiba di puncak","Sebaik kereta itu memperlahankan kenderaan"]'::jsonb
  WHERE id = '0d97dca7-2614-5fcb-b113-146a76b77964';
UPDATE public.kpp_questions SET options_en = '["Just after passing the first exit","Before entering the roundabout","Just before reaching the first exit","After leaving the roundabout"]'::jsonb, options_ms = '["Sejurus selepas melepasi susur pertama","Sebelum anda memasuki bulatan itu","Sejurus sebelum tiba di susur pertama","Selepas anda meninggalkan bulatan itu"]'::jsonb
  WHERE id = '6dcd330d-4a32-5383-817f-3a76e538698e';
UPDATE public.kpp_questions SET options_en = '["Ease off the accelerator","Brake in short pulses","Steer toward the shoulder","Hold your current speed"]'::jsonb, options_ms = '["Lepaskan pedal minyak perlahan-lahan","Tekan brek beberapa kali secara berselang","Pusing stereng ke arah bahu jalan","Kekalkan kelajuan anda yang sedia ada"]'::jsonb
  WHERE id = 'ffe902fd-7396-59cb-8ec1-cff2252f89cd';
UPDATE public.kpp_questions SET options_en = '["Ignoring a marked no-entry sign","Passing another car on the left","Blocking a pedestrian crossing","Joining an unapproved road race"]'::jsonb, options_ms = '["Mengabaikan tanda dilarang masuk yang jelas","Memotong kereta lain di sebelah kiri jalan","Menghalang lintasan pejalan kaki yang ditanda","Menyertai perlumbaan jalan tanpa kebenaran"]'::jsonb
  WHERE id = '0473f3eb-da5d-55bc-bb69-beeb1d3cc5eb';
UPDATE public.kpp_questions SET options_en = '["Lorries and articulated trailers","Tractors and mobile machinery","Buses and passenger vans","Motorcars and small vans"]'::jsonb, options_ms = '["Lori dan treler bersendi berat","Traktor dan jentera bergerak","Bas dan van penumpang awam","Motokar dan van kecil persendirian"]'::jsonb
  WHERE id = 'c09e9bbb-24c4-50d8-b46d-6693d9139416';
UPDATE public.kpp_questions SET options_en = '["Lorries and articulated trailers","Tractors and mobile machinery","Buses and passenger vans","Motorcars and small vans"]'::jsonb, options_ms = '["Lori dan treler bersendi berat","Traktor dan jentera bergerak","Bas dan van penumpang awam","Motokar dan van kecil persendirian"]'::jsonb
  WHERE id = '465b5662-6db9-52d5-9b13-f10f2001e782';
UPDATE public.kpp_questions SET options_en = '["To stop certain shifts happening by accident","To help the selector move more quickly","To make selected gears easier to read","To let the driver skip every other position"]'::jsonb, options_ms = '["Untuk mengelakkan pertukaran tertentu secara tidak sengaja","Untuk membantu tuil gear bergerak dengan lebih pantas","Untuk memudahkan pemandu membaca gear yang terpilih","Untuk membolehkan pemandu melangkau kedudukan tertentu"]'::jsonb
  WHERE id = '24a7d974-4d7d-5f22-ba42-83d30a9eb19b';
UPDATE public.kpp_questions SET options_en = '["Press it slightly","Press it fully","Pump it once","Leave it released"]'::jsonb, options_ms = '["Tekan sedikit sahaja","Tekan hingga ke lantai","Pam pedal sekali sahaja","Biarkan tanpa ditekan"]'::jsonb
  WHERE id = '623e6fb6-3f4a-517a-990a-e9cc460d8a63';
UPDATE public.kpp_questions SET options_en = '["Lane for motorcycles","Lane for bicycles only","Lane for taxis only","Lane for buses only"]'::jsonb, options_ms = '["Lorong untuk motosikal","Lorong untuk basikal","Lorong untuk teksi","Lorong untuk bas"]'::jsonb
  WHERE id = '0b3f246b-27af-4deb-9b93-7592a6112c73';
UPDATE public.kpp_questions SET options_en = '["Vehicle parking","Medical clinic","JPJ weighing station","Public telephone"]'::jsonb, options_ms = '["Tempat letak kenderaan","Klinik perubatan awam","Stesen timbang berat JPJ","Telefon awam berhampiran"]'::jsonb
  WHERE id = '7cda3fa2-5e1c-4d7c-ba26-cb0548d8f17e';
UPDATE public.kpp_questions SET options_en = '["No vehicle entry","No overtaking","No stopping","No through road"]'::jsonb, options_ms = '["Kenderaan dilarang masuk","Dilarang memotong di sini","Dilarang berhenti di sini","Jalan buntu di hadapan"]'::jsonb
  WHERE id = '9bc55720-9eb3-4489-ad21-4dbbba79c4c9';
UPDATE public.kpp_questions SET options_en = '["Left lane closes a short way ahead","Keep to the right of an obstacle","Traffic merges in from the right","Route changes direction to the right"]'::jsonb, options_ms = '["Lorong kiri ditutup di hadapan","Lalu di kanan halangan","Trafik bercantum dari kanan","Laluan berubah arah ke kanan"]'::jsonb
  WHERE id = '17df082e-fa2d-4185-b851-27b406e30262';
UPDATE public.kpp_questions SET options_en = '["Glance over the shoulder toward that lane","Look once more in the interior mirror","Check the centre of the windscreen glass","Watch the car immediately ahead of you"]'::jsonb, options_ms = '["Toleh ke bahu menghala ke lorong itu","Lihat semula cermin pandang belakang","Periksa bahagian tengah cermin hadapan","Perhatikan kereta tepat di hadapan"]'::jsonb
  WHERE id = 'b5fdad05-db5f-4eb6-b96c-9f04cb02f6d7';
UPDATE public.kpp_questions SET options_en = '["The extra weight takes more room to stop","The extra length takes more room to turn","The added mirrors widen the blind spot","The tow connection changes the steering angle"]'::jsonb, options_ms = '["Berat tambahan memerlukan ruang berhenti lebih panjang","Panjang tambahan memerlukan ruang membelok lebih luas","Cermin tambahan itu meluaskan lagi titik buta pemandu","Sambungan tunda mengubah sudut pusingan stereng"]'::jsonb
  WHERE id = 'a74faff9-2e9f-492e-b9c2-532a412d20f8';
UPDATE public.kpp_questions SET options_en = '["Follow another car to your destination","Slow and find a safe place to stop","Hold speed and follow the edge line","Stop immediately in the traffic lane"]'::jsonb, options_ms = '["Ikut kereta lain di hadapan hingga ke destinasi anda","Perlahankan kenderaan dan cari tempat selamat untuk berhenti","Kekalkan kelajuan dan ikut garisan tepi jalan sahaja","Berhenti serta-merta di tengah lorong trafik yang sibuk"]'::jsonb
  WHERE id = 'd27c6db1-4853-4e8a-959f-401dcd2abf6b';
UPDATE public.kpp_questions SET options_en = '["Stop safely and get people out","Open the bonnet before stopping","Keep driving to the nearest workshop","Wait inside for the smoke to clear"]'::jsonb, options_ms = '["Berhenti dengan selamat dan keluarkan semua orang","Buka bonet dahulu sebelum anda berhenti sepenuhnya","Terus memandu ke bengkel yang terdekat dengan anda","Tunggu di dalam kereta sehingga asap hilang"]'::jsonb
  WHERE id = '72e8b298-4df6-4963-934d-3b47dfa62377';
UPDATE public.kpp_questions SET options_en = '["Move closer to the kerb and pass","Hold speed and sound the horn","Slow down and watch for crossings","Focus on the vehicle directly ahead"]'::jsonb, options_ms = '["Gerakkan kenderaan lebih dekat dengan bebendul","Kekalkan kelajuan dan bunyikan hon","Perlahankan kenderaan dan awasi orang melintas","Tumpukan pada kenderaan di hadapan"]'::jsonb
  WHERE id = '150bc84a-ea3b-4011-81ab-38571f4101a1';
UPDATE public.kpp_questions SET options_en = '["Ease off and slow down","Hold your present speed","Speed up to pass sooner","Coast with no braking"]'::jsonb, options_ms = '["Lepaskan pemecut dan perlahankan kenderaan","Kekalkan kelajuan semasa anda sekarang","Pecut untuk berselisih dengan lebih awal","Luncur terus tanpa menekan sebarang brek"]'::jsonb
  WHERE id = 'af2d18c2-aaed-4ba5-bf1c-16e221339f38';
UPDATE public.kpp_questions SET options_en = '["Keep speed and lengthen your gap","Slow down only before bends","Reduce speed to suit your view","Match the speed of the car ahead"]'::jsonb, options_ms = '["Kekalkan kelajuan dan tambah jarak antara kereta","Perlahankan hanya apabila hampir ke selekoh","Kurangkan kelajuan mengikut jarak penglihatan","Ikut sahaja kelajuan kereta di hadapan anda"]'::jsonb
  WHERE id = 'bfba9c8d-4fee-49cd-8b97-2c10411e6ee1';
UPDATE public.kpp_questions SET options_en = '["Lane for motorcycles","Lane for bicycles only","Lane for taxis only","Lane for buses only"]'::jsonb, options_ms = '["Lorong untuk motosikal","Lorong untuk basikal","Lorong untuk teksi","Lorong untuk bas"]'::jsonb
  WHERE id = '4c0eff6f-4697-4507-8eb9-f549620ea53b';
UPDATE public.kpp_questions SET options_en = '["Vehicle parking","Medical clinic","JPJ weighing station","Public telephone"]'::jsonb, options_ms = '["Tempat letak kenderaan","Klinik perubatan awam","Stesen timbang berat JPJ","Telefon awam berhampiran"]'::jsonb
  WHERE id = 'eac102da-1618-4740-9fb1-61b86a8dc3d8';
UPDATE public.kpp_questions SET options_en = '["No vehicle entry","No overtaking","No stopping","No through road"]'::jsonb, options_ms = '["Kenderaan dilarang masuk","Dilarang memotong di sini","Dilarang berhenti di sini","Jalan buntu di hadapan"]'::jsonb
  WHERE id = '8ad02e8f-35fd-4fd6-8001-2db5a212b360';
UPDATE public.kpp_questions SET options_en = '["Left lane closes a short way ahead","Keep to the right of an obstacle","Traffic merges in from the right","Route changes direction to the right"]'::jsonb, options_ms = '["Lorong kiri ditutup di hadapan","Lalu di kanan halangan","Trafik bercantum dari kanan","Laluan berubah arah ke kanan"]'::jsonb
  WHERE id = '941391f7-6766-45f4-9602-a4c5dcd4b190';
UPDATE public.kpp_questions SET options_en = '["Stay in the right lane for a while","Return to the normal driving lane","Stay in the centre lane for a while","Return to the emergency lane"]'::jsonb, options_ms = '["Kekal di lorong kanan","Ke lorong pemanduan kiri","Kekal di lorong tengah","Kembali ke lorong kecemasan"]'::jsonb
  WHERE id = '28ca7bbe-107c-4a5b-a425-c3f8b540fa92';
UPDATE public.kpp_questions SET options_en = '["The child safety lock","The central locking switch","The remote door lock","The driver’s door lock"]'::jsonb, options_ms = '["Kunci keselamatan kanak-kanak","Suis kunci pusat kenderaan","Kunci pintu kawalan jauh","Kunci pintu bahagian pemandu"]'::jsonb
  WHERE id = 'd386ae6b-f4e1-47be-8e66-e36db96987a2';
UPDATE public.kpp_questions SET options_en = '["Pull off at a suitable stopping place","Keep going behind another vehicle","Slow and stay in the live lane","Continue until visibility improves"]'::jsonb, options_ms = '["Berhenti di tempat yang sesuai di luar aliran trafik","Teruskan di belakang kenderaan lain di hadapan","Perlahankan kenderaan dan kekal di lorong trafik","Teruskan sehingga penglihatan bertambah baik"]'::jsonb
  WHERE id = 'fe4bc5b6-b1dd-4fca-aaab-7332bf8b3c74';
UPDATE public.kpp_questions SET options_en = '["The front windscreen only","The rear windscreen only","Both side windows only","Front and rear windscreens"]'::jsonb, options_ms = '["Cermin hadapan kereta sahaja","Cermin belakang kereta sahaja","Kedua-dua tingkap sisi kereta","Cermin hadapan dan belakang"]'::jsonb
  WHERE id = '51e88c29-b477-422e-9071-ac2cf9fcff76';
