CREATE DATABASE IF NOT EXISTS perpustakaan_nusantara CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE perpustakaan_nusantara;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, nama_lengkap VARCHAR(120) NOT NULL, email VARCHAR(120) NOT NULL UNIQUE,
  username VARCHAR(60) NULL UNIQUE, nip VARCHAR(60) NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, nomor_hp VARCHAR(30) NULL,
  alamat TEXT NULL, jenis_anggota VARCHAR(60) NULL, membership_type ENUM('Umum','Pelajar','Premium') NULL,
  role ENUM('member','admin') NOT NULL DEFAULT 'member',   status ENUM('active','pending','inactive','blocked') NOT NULL DEFAULT 'active',
  member_code VARCHAR(20) NULL UNIQUE,
  auth_token VARCHAR(64) NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE categories (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, kode VARCHAR(40) NOT NULL UNIQUE, name VARCHAR(100) NOT NULL, color VARCHAR(100), icon VARCHAR(50), description TEXT);
CREATE TABLE shelves (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, kode VARCHAR(20) NOT NULL UNIQUE, name VARCHAR(100) NOT NULL, location VARCHAR(150), floor TINYINT UNSIGNED, capacity INT UNSIGNED DEFAULT 0);
CREATE TABLE shelf_categories (shelf_id INT UNSIGNED NOT NULL, category_id INT UNSIGNED NOT NULL, PRIMARY KEY(shelf_id, category_id), FOREIGN KEY(shelf_id) REFERENCES shelves(id) ON DELETE CASCADE, FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE);
CREATE TABLE books (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, author VARCHAR(160) NOT NULL, category_id INT UNSIGNED NULL, shelf_id INT UNSIGNED NULL, shelf_position VARCHAR(50), cover TEXT, rating DECIMAL(2,1) DEFAULT 0, published_year SMALLINT UNSIGNED, pages SMALLINT UNSIGNED, isbn VARCHAR(30) UNIQUE, stock INT UNSIGNED NOT NULL DEFAULT 0, description TEXT, publisher VARCHAR(150), recommended BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL, FOREIGN KEY(shelf_id) REFERENCES shelves(id) ON DELETE SET NULL);
CREATE TABLE loan_rules (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, type VARCHAR(100) NOT NULL, duration_days TINYINT UNSIGNED NOT NULL, max_renewals TINYINT UNSIGNED NOT NULL DEFAULT 0, fine_per_day DECIMAL(12,2) NOT NULL DEFAULT 0, description TEXT, eligibility VARCHAR(150));
CREATE TABLE IF NOT EXISTS loans (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  book_id INT UNSIGNED NOT NULL,
  borrowed_at DATETIME NOT NULL,
  due_at DATETIME NOT NULL,
  returned_at DATETIME NULL,
  duration INT UNSIGNED NOT NULL DEFAULT 7,
  fine DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  status ENUM('Menunggu','Dipinjam','Dikembalikan','Selesai','Ditolak') NOT NULL DEFAULT 'Menunggu',
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(book_id) REFERENCES books(id)
);

CREATE TABLE IF NOT EXISTS ratings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  loan_id INT UNSIGNED NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

INSERT INTO categories (kode,name,color,icon,description) VALUES ('novel','Novel & Fiksi','bg-sky-100 text-sky-700','BookOpen','Karya fiksi, novel, cerpen, dan sastra'),('science','Sains & Teknologi','bg-indigo-100 text-indigo-700','Microscope','Ilmu pengetahuan dan teknologi'),('history','Sejarah & Budaya','bg-cyan-100 text-cyan-700','Landmark','Sejarah dunia dan budaya'),('children','Buku Anak','bg-green-100 text-green-700','Baby','Buku dan cerita anak'),('selfhelp','Pengembangan Diri','bg-purple-100 text-purple-700','TrendingUp','Motivasi dan karier'),('religion','Agama & Filsafat','bg-blue-100 text-blue-700','Star','Keagamaan dan filsafat');
INSERT INTO loan_rules (type,duration_days,max_renewals,fine_per_day,description,eligibility) VALUES ('Peminjaman Standar',7,1,500,'Peminjaman anggota umum','Semua anggota'),('Peminjaman Pelajar',14,2,300,'Peminjaman pelajar','Pelajar'),('Peminjaman Referensi',3,0,1000,'Peminjaman referensi','Semua anggota'),('Peminjaman Guru/Dosen',30,3,200,'Peminjaman pengajar','Guru dan Dosen');
