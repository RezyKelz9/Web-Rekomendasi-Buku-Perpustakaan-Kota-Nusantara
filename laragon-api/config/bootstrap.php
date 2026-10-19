<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once __DIR__ . '/database.php';

function input(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function respond(array $payload, int $status = 200): never {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function publicUser(array $user): array {
    unset($user['password_hash']);
    return $user;
}

function authenticate(PDO $pdo): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        respond(['success' => false, 'message' => 'Autentikasi diperlukan.'], 401);
    }
    $token = $m[1];
    $stmt = $pdo->prepare('SELECT * FROM users WHERE auth_token=? AND status="active" LIMIT 1');
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    if (!$user) {
        respond(['success' => false, 'message' => 'Token tidak valid atau sesi telah berakhir.'], 401);
    }
    return $user;
}

function generateToken(): string {
    return bin2hex(random_bytes(32));
}

function generateMemberCode(PDO $pdo, string $jenisAnggota, string $role): string {
    $prefix = match ($role === 'member' ? 'member' : 'staff') {
        'member' => match ($jenisAnggota) {
            'Umum' => 'UMM',
            'Pelajar' => 'PLJ',
            'Dosen/Pengajar' => 'DOS',
            default => 'UMM',
        },
        'staff' => match ($role) {
            'admin' => 'ADM',
            'staff' => 'STF',
            'petugasRak' => 'PTR',
            default => 'ADM',
        },
    };

    $stmt = $pdo->prepare("SELECT MAX(CAST(SUBSTRING(member_code, 5) AS UNSIGNED)) FROM users WHERE member_code LIKE ?");
    $stmt->execute([$prefix . '-%']);
    $next = ((int)$stmt->fetchColumn()) + 1;
    return sprintf('%s-%04d', $prefix, $next);
}
