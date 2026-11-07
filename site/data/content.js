/* Showrooms, opening hours and company timeline. Interface copy: i18n.js. Brands, products, inspiration: catalog.js (built from content/). */
window.TAF_SITE = {
  languages: [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'el', label: 'ΕΛ', name: 'Ελληνικά' },
    { code: 'ru', label: 'РУ', name: 'Русский' },
  ],

  // Opening hours from each showroom's Google Business profile (checked 7 Nov 2026). Day index: 0 = Sunday.
  hours: {
    nicosia:  { 1: [['09:30', '13:00'], ['15:30', '18:30']], 2: [['09:30', '13:00'], ['15:30', '18:30']], 3: [['09:30', '13:00']], 4: [['09:30', '13:00'], ['15:30', '18:30']], 5: [['09:30', '13:00'], ['15:30', '18:30']], 6: [['09:30', '14:00']], 0: [] },
    limassol: { 1: [['09:30', '13:00'], ['15:30', '18:30']], 2: [['09:30', '13:00'], ['15:30', '18:30']], 3: [['09:30', '13:00']], 4: [['09:30', '13:00'], ['15:30', '18:30']], 5: [['09:30', '13:00'], ['15:30', '18:30']], 6: [['09:30', '13:00']], 0: [] },
    larnaca:  { 1: [['09:30', '13:00'], ['15:00', '18:00']], 2: [['09:30', '13:00'], ['15:00', '18:00']], 3: [['09:30', '13:00']], 4: [['09:30', '13:00'], ['15:00', '18:00']], 5: [['09:30', '13:00'], ['15:00', '18:00']], 6: [['09:30', '13:00']], 0: [] },
    paphos:   { 1: [['09:00', '13:00'], ['15:00', '17:30']], 2: [['09:00', '13:00'], ['15:00', '17:30']], 3: [['09:00', '13:00']], 4: [['09:00', '13:00'], ['15:00', '17:30']], 5: [['09:00', '13:00'], ['15:00', '17:30']], 6: [['09:00', '13:00']], 0: [] },
  },
  stores: [
    { id: 'nicosia', address: '20–21 Achaion Street, Engomi 2413', phone: '+357 22 351366', email: 'tafnicosia1@taf.com.cy', natuzzi: { address: '3 Achaion Street, Engomi 2413', phone: '+357 22 593901' } },
    { id: 'limassol', address: '6 Makarios III Avenue, Agios Ioannis 3060', phone: '+357 25 560386', email: 'taflimassol1@taf.com.cy', natuzzi: { phone: '+357 25 750413' } },
    { id: 'larnaca', address: '125 Eleftherias Avenue, Aradippou 7102', phone: '+357 24 635034', email: 'taflarnaca2@taf.com.cy', natuzzi: {} },
    { id: 'paphos', address: '122 Mesogis Avenue, Paphos 8280', phone: '+357 26 220111', email: 'tafpafos1@taf.com.cy', natuzzi: { phone: '+357 26 220112' } },
  ],
  headOffice: { address: 'Metsovou Street, Strovolos, Nicosia', phone: '+357 22 485345', email: 'info@taf.com.cy' },
  social: { instagram: 'https://www.instagram.com/takis_angelides_furnihome', facebook: 'https://www.facebook.com/TakisAngelidesFurnihome' },

  timeline: [
    ['1965', { en: 'Takis Angelides opens his first shop in Morfou.', el: 'Ο Τάκης Αγγελίδης ανοίγει το πρώτο του κατάστημα στη Μόρφου.', ru: 'Такис Ангелидис открывает свой первый магазин в Морфу.' }],
    ['1974', { en: 'A refugee after the war, he begins again in Nicosia.', el: 'Πρόσφυγας μετά τον πόλεμο, ξεκινά ξανά στη Λευκωσία.', ru: 'Став беженцем после войны, он начинает всё заново в Никосии.' }],
    ['1992', { en: 'The first Natuzzi Italia store in Cyprus opens in Limassol.', el: 'Ανοίγει στη Λεμεσό το πρώτο κατάστημα Natuzzi Italia στην Κύπρο.', ru: 'В Лимассоле открывается первый на Кипре магазин Natuzzi Italia.' }],
    ['2004', { en: 'Alessandro Calligaris inaugurates our Larnaca showroom.', el: 'Ο Alessandro Calligaris εγκαινιάζει το κατάστημά μας στη Λάρνακα.', ru: 'Алессандро Каллигарис открывает наш салон в Ларнаке.' }],
    ['2007', { en: 'Poliform arrives in our Nicosia showroom.', el: 'Η Poliform έρχεται στο κατάστημά μας στη Λευκωσία.', ru: 'Poliform появляется в нашем салоне в Никосии.' }],
    ['Today', { en: 'The second generation leads TAF across four cities.', el: 'Η δεύτερη γενιά οδηγεί την TAF σε τέσσερις πόλεις.', ru: 'Второе поколение семьи ведёт TAF в четырёх городах.' }],
  ],
};
