export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  count: number;
};

export type Shelf = {
  id: string;
  name: string;
  location: string;
  floor: number;
  categories: string[];
  capacity: number;
  occupied: number;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  categoryId: string;
  shelfId: string;
  shelfPosition: string;
  cover: string;
  rating: number;
  year: number;
  pages: number;
  isbn: string;
  available: boolean;
  stock: number;
  description: string;
  publisher: string;
  recommended: boolean;
};

export type LoanRule = {
  id: string;
  type: string;
  duration: number;
  maxRenewals: number;
  fine: number;
  description: string;
  eligibility: string;
};

export const categories: Category[] = [
  {
    id: "novel",
    name: "Novel & Fiksi",
    color: "bg-sky-100 text-sky-700",
    icon: "BookOpen",
    description: "Karya fiksi, novel, cerpen, dan sastra",
    count: 128,
  },
  {
    id: "science",
    name: "Sains & Teknologi",
    color: "bg-indigo-100 text-indigo-700",
    icon: "Microscope",
    description: "Ilmu pengetahuan alam, teknologi, dan komputer",
    count: 95,
  },
  {
    id: "history",
    name: "Sejarah & Budaya",
    color: "bg-cyan-100 text-cyan-700",
    icon: "Landmark",
    description: "Sejarah dunia, budaya, dan peradaban",
    count: 74,
  },
  {
    id: "children",
    name: "Buku Anak",
    color: "bg-green-100 text-green-700",
    icon: "Baby",
    description: "Cerita anak, dongeng, dan buku bergambar",
    count: 112,
  },
  {
    id: "selfhelp",
    name: "Pengembangan Diri",
    color: "bg-purple-100 text-purple-700",
    icon: "TrendingUp",
    description: "Motivasi, kepemimpinan, dan karier",
    count: 63,
  },
  {
    id: "religion",
    name: "Agama & Filsafat",
    color: "bg-blue-100 text-blue-700",
    icon: "Star",
    description: "Keagamaan, filsafat, dan etika",
    count: 88,
  },
];

export const shelves: Shelf[] = [
  {
    id: "A",
    name: "Rak A",
    location: "Lantai 1 – Sayap Kiri",
    floor: 1,
    categories: ["novel"],
    capacity: 200,
    occupied: 182,
  },
  {
    id: "B",
    name: "Rak B",
    location: "Lantai 1 – Sayap Kanan",
    floor: 1,
    categories: ["children"],
    capacity: 150,
    occupied: 110,
  },
  {
    id: "C",
    name: "Rak C",
    location: "Lantai 2 – Depan",
    floor: 2,
    categories: ["science"],
    capacity: 180,
    occupied: 95,
  },
  {
    id: "D",
    name: "Rak D",
    location: "Lantai 2 – Belakang",
    floor: 2,
    categories: ["history"],
    capacity: 160,
    occupied: 74,
  },
  {
    id: "E",
    name: "Rak E",
    location: "Lantai 3 – Tengah",
    floor: 3,
    categories: ["selfhelp"],
    capacity: 120,
    occupied: 63,
  },
  {
    id: "F",
    name: "Rak F",
    location: "Lantai 3 – Pojok",
    floor: 3,
    categories: ["religion"],
    capacity: 140,
    occupied: 88,
  },
];

export const books: Book[] = [
  {
    id: "1",
    title: "Laskar Pelangi",
    author: "Andrea Hirata",
    categoryId: "novel",
    shelfId: "A",
    shelfPosition: "A-01-03",
    cover: "https://upload.wikimedia.org/wikipedia/id/8/8e/Laskar_pelangi_sampul.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.9,
    year: 2005,
    pages: 534,
    isbn: "978-979-1227-24-5",
    available: true,
    stock: 3,
    description: "Novel inspiratif tentang semangat belajar anak-anak Belitung yang penuh keterbatasan namun kaya mimpi dan persahabatan.",
    publisher: "Bentang Pustaka",
    recommended: true,
  },
  {
    id: "2",
    title: "Bumi Manusia",
    author: "Pramoedya Ananta Toer",
    categoryId: "novel",
    shelfId: "A",
    shelfPosition: "A-01-07",
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1565658920i/1398034.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.8,
    year: 1980,
    pages: 380,
    isbn: "978-979-407-313-5",
    available: true,
    stock: 1,
    description: "Kisah epik tentang perjuangan manusia melawan kolonialisme dan penindasan di era Hindia Belanda.",
    publisher: "Lentera Dipantara",
    recommended: true,
  },
  {
    id: "3",  
    title: "Blue Lock Volume 17",
    author: "Muneyuki Kaneshiro",
    categoryId: "novel",
    shelfId: "B",
    shelfPosition: "B-02-03",
    cover: "https://m.media-amazon.com/images/I/811YkJWCoCL._UF1000,1000_QL80_.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.5,
    year: 2026,
    pages: 200,
    isbn: "9786347375902",
    stock: 2,
    available: true,
    description: "Setiap orang menampilkan performa yang mendobrak batasan di laga Timnas U-20 melawan Blue Lock Eleven! Konflik Itoshi Bersaudara berkembang makin dalam dengan permainan level super yang tidak terprediksi, sementara Nagi, Bachira, dan Isagi terus mendesak demi gol masing-masing! Bisakah impian serta determinasi Jinpachi Ego menghancurleburkan sepak bola Jepang? Siapakah yang akan membawa gol kemenangan di laga ini? Menuju era baru sepak bola Jepang! Egoisme akan jadi kunci yang membuka pintu tersebut!! Penghujung laga Blue Lock Eleven vs Timnas U-20 Jepang! Saksikan langsung pahlawan yang lahir di negeri ini!!",
    publisher: "Kodansha Comics",
    recommended: true,
  },
  {
    id: "4",
    title: "Sapiens: Riwayat Singkat Umat Manusia",
    author: "Yuval Noah Harari",
    categoryId: "history",
    shelfId: "D",
    shelfPosition: "D-03-05",
    cover: "https://cdn.gramedia.com/uploads/images/1/28180/image_highres/HCO_SAPI2018MTH06.jpeg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.8,
    year: 2011,
    pages: 443,
    isbn: "978-0-06-231609-7",
    stock: 4,
    available: true,
    description: "Perjalanan Homo sapiens dari zaman batu hingga revolusi ilmiah yang mengubah dunia secara menyeluruh.",
    publisher: "KPG",
    recommended: false,
  },
  {
    id: "5",
    title: "Si Kancil dan Buaya",
    author: "Tim Penulis Cerita Rakyat",
    categoryId: "children",
    shelfId: "B",
    shelfPosition: "B-01-02",
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1671055832i/3552822.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.5,
    year: 2018,
    pages: 48,
    isbn: "978-602-123-456-7",
    available: true,
    stock: 5,
    description: "Dongeng klasik nusantara tentang kecerdikan si Kancil yang berhasil mengalahkan kawanan buaya.",
    publisher: "Erlangga",
    recommended: true,
  },
  {
    id: "6",
    title: "Atomic Habits",
    author: "James Clear",
    categoryId: "selfhelp",
    shelfId: "E",
    shelfPosition: "E-01-04",
    cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCuog6ZzxlrlCa1v0DPRS22EWf8mSwwlgO07_PrtLuLJ-rgoIachbO1GZ-&s=10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.9,
    year: 2018,
    pages: 320,
    isbn: "978-0-7352-1129-2",
    available: true,
    stock: 2,
    description: "Panduan praktis membangun kebiasaan baik dan menghilangkan kebiasaan buruk melalui perubahan kecil yang konsisten.",
    publisher: "Gramedia",
    recommended: true,
  },
  {
    id: "7",
    title: "Negeri 5 Menara",
    author: "A. Fuadi",
    categoryId: "novel",
    shelfId: "A",
    shelfPosition: "A-02-01",
    cover: "https://cdn.gramedia.com/uploads/items/9789792248616_negeri-5-menara-_cu-cover-baru_.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.6,
    year: 2009,
    pages: 423,
    isbn: "978-979-655-234-6",
    available: true,
    stock: 2,
    description: "Kisah enam sahabat dari pesantren Gontor yang bermimpi meraih pendidikan di lima penjuru dunia.",
    publisher: "Gramedia",
    recommended: false,
  },
  {
    id: "8",
    title: "The Universe in a Nutshell",
    author: "Stephen Hawking",
    categoryId: "science",
    shelfId: "C",
    shelfPosition: "C-02-12",
    cover: "https://upload.wikimedia.org/wikipedia/en/6/6c/Cover_Universe_in_a_nutshell.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.5,
    year: 2001,
    pages: 224,
    isbn: "978-0-553-80202-3",
    stock: 3,
    available: true,
    description: "Eksplorasi mendalam tentang fisika modern, dari teori relativitas hingga dunia kuantum.",
    publisher: "Bantam Books",
    recommended: false,
  },
  {
    id: "9",
    title: "Sejarah Indonesia Modern",
    author: "M.C. Ricklefs",
    categoryId: "history",
    shelfId: "D",
    shelfPosition: "D-01-08",
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1352252491i/3420576.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.4,
    year: 2005,
    pages: 680,
    isbn: "978-979-9100-25-2",
    available: true,
    stock: 1,
    description: "Tinjauan komprehensif tentang perjalanan sejarah Indonesia dari abad ke-16 hingga era reformasi.",
    publisher: "Serambi",
    recommended: false,
  },
  {
    id: "10",
    title: "Petualangan Sherina",
    author: "Dhania Paramita",
    categoryId: "children",
    shelfId: "B",
    shelfPosition: "B-02-05",
    cover: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgNTB49pWYIA-kbFwx8t7SbEoFNIsHr79l-xbmwJ0zI2SSmeAhAmTktDPFdUrNkpAWFAiu2ybDitOT3yGUpcH-V942BPUm28DUjJDW73qp0_b5P9N2x9oDE87uX8mq-2BMzplh5UahwYjCF/s1600/sherina.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.7,
    year: 2000,
    pages: 72,
    isbn: "978-602-789-012-3",
    available: false,
    stock: 0,
    description: "Petualangan seru Sherina dan Sadam di hutan Jawa Barat penuh misteri dan keberanian.",
    publisher: "Mizan",
    recommended: false,
  },
  {
    id: "11",
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    categoryId: "selfhelp",
    shelfId: "E",
    shelfPosition: "E-02-03",
    cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa-VhVmPDuaRa3fnFNgL4JA8gE0ry03vTYng&s?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.7,
    year: 1989,
    pages: 381,
    isbn: "978-0-7432-6951-3",
    available: true,
    stock: 4,
    description: "Tujuh kebiasaan yang dimiliki oleh orang-orang yang sangat efektif dalam kehidupan dan pekerjaan.",
    publisher: "FranklinCovey",
    recommended: false,
  },
  {
    id: "12",
    title: "Dilan: Dia adalah Dilanku",
    author: "Pidi Baiq",
    categoryId: "novel",
    shelfId: "A",
    shelfPosition: "A-03-09",
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1442310576i/22037542.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.3,
    year: 2014,
    pages: 348,
    isbn: "978-602-7949-34-0",
    stock: 7,
    available: true,
    description: "Kisah cinta remaja SMA Bandung tahun 1990 yang manis, lucu, dan penuh kenangan tak terlupakan.",
    publisher: "Pastel Books",
    recommended: true
  },
  {
    id: "13",
    title: "Sejarah Dunia yang Disembunyikan",
    author: "Jonathan Black",
    categoryId: "religion",
    shelfId: "C",
    shelfPosition: "C-03-11",
    cover: "https://cdn.gramedia.com/uploads/products/kr--5nc55r.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.8,
    year: 2024,
    pages: 636,
    isbn: "9786232201934",
    available: true,
    stock: 4,
    description: "Banyak orang mengatakan bahwa sejarah ditulis oleh para pemenang. Hal ini sama sekali tak mengejutkan alias wajar belaka. Tetapi, bagaimana jika sejarah—atau apa yang kita ketahui sebagai sejarah—ditulis oleh orang yang salah? Bagaimana jika semua yang telah kita ketahui hanyalah bagian dari cerita yang salah tersebut?",
    publisher: "Alvabet",
    recommended: false
  },
  {
    id: "14",
    title: "Blue Lock Volume 18",
    author: "Muneyuki Kaneshiro",
    categoryId: "novel",
    shelfId: "B",
    shelfPosition: "B-02-04",
    cover: "https://image.gramedia.net/rs:fit:0:0/plain/https://cdn.gramedia.com/uploads/product-metas/1x48-8x31c.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.8,
    year: 2026, 
    pages: 192,
    isbn: "9786347574107",
    available: true,
    stock: 3,
    description: "Blue Lock Project: Phase Two, dimulai! Para Egoist menuju medan tempur yang lebih menantang!! Usai memenangkan laga fenomenal melawan Timnas U-20 Jepang, Isagi dan Blue Lock serta-merta jadi pahlawan. Para striker kemudian menikmati masa liburan yang singkat, sebelum tantangan yang baru dari Jinpachi Ego datang! Para Egoist yang terus dirasuki gelora itu harus kembali bertarung di medan tempur yang mempertaruhkan masa depan dan membuktikan eksistensi mereka! Lalu, siapakah orang-orang baru yang telah menanti? Rival berikutnya adalah 5 tim besar Eropa! Liga Neo Egoist, dimulai!!",
    publisher: "Phoenix Gramedia Indonesia",
    recommended: false
  },
  {
    id: "15",
    title: "Seporsi Mie Ayam Sebelum Mati",
    author: "Brian Khrisna",
    categoryId: "novel",
    shelfId: "B",
    shelfPosition: "B-05-04",
    cover: "https://image.gramedia.net/rs:fit:0:0/plain/https://cdn.gramedia.com/uploads/product-metas/semv-ptm-e.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    rating: 4.5,
    year: 2025,
    pages: 216,
    isbn: "9786020531328",
    available: true,    stock: 2,    description: "Seperti malam-malam lain, aku pulang selepas lembur. Orang-orang di kantor yang sudah menikah, mereka akan pulang ke keluarganya masing-masing. Sementara aku yang tidak punya siapa-siapa ini, sekarang masih duduk sendirian di parkiran mobil yang sudah lengang, bersama sebotol bir, rokok murah, dan sepotong kue ulang tahunku sendiri yang kubeli dari toko manisan dekat kantor.Aku takut kalau ternyata selama ini aku tidak pernah berhasil menjalani hidup seperti sebagaimana seharusnya. Di kepalaku sekarang, pertanyaan ini semakin lama semakin membesar. “Pantaskah hidup ini kulanjutkan?”Aku berdiri menatap ke langit malam.Kini tekadku sudah bulat.Aku akan bunuh diri 24 jam dari sekarang.",
    publisher: "Gramedia Widiasarana Indonesia",
    recommended: false
  },
];

export const loanRules: LoanRule[] = [
  {
    id: "1",
    type: "Peminjaman Standar",
    duration: 7,
    maxRenewals: 1,
    fine: 500,
    description: "Berlaku untuk semua anggota umum perpustakaan",
    eligibility: "Semua anggota terdaftar",
  },
  {
    id: "2",
    type: "Peminjaman Pelajar",
    duration: 14,
    maxRenewals: 2,
    fine: 300,
    description: "Khusus untuk siswa/mahasiswa dengan kartu pelajar aktif",
    eligibility: "Siswa SD, SMP, SMA, Mahasiswa",
  },
  {
    id: "3",
    type: "Peminjaman Referensi",
    duration: 3,
    maxRenewals: 0,
    fine: 1000,
    description: "Buku referensi dan kamus hanya boleh dipinjam jangka pendek",
    eligibility: "Semua anggota terdaftar",
  },
  {
    id: "4",
    type: "Peminjaman Guru/Dosen",
    duration: 30,
    maxRenewals: 3,
    fine: 200,
    description: "Untuk tenaga pengajar dengan surat keterangan resmi",
    eligibility: "Guru dan Dosen",
  },
];
