<?php
declare(strict_types=1);

$config = parse_ini_file(__DIR__ . '/../.env') ?: [];
$host = $config['DB_HOST'] ?? '127.0.0.1';
$name = $config['DB_NAME'] ?? 'perpustakaan_nusantara';
$user = $config['DB_USER'] ?? 'root';
$pass = $config['DB_PASS'] ?? '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    exit(json_encode(['success' => false, 'message' => 'Koneksi database gagal.']));
}
