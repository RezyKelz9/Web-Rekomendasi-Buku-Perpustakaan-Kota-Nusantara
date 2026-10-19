<?php
require __DIR__ . '/../../config/bootstrap.php';
$authUser = authenticate($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $role = $_GET['role'] ?? null;
    $sql = 'SELECT id, nama_lengkap, email, username, nip, nomor_hp, alamat, jenis_anggota, membership_type, role, status, member_code, created_at FROM users WHERE (:role IS NULL OR role=:role) ORDER BY created_at DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['role' => $role]);
    $users = $stmt->fetchAll();
    $users = array_map(function ($u) {
        $u['id'] = (int)$u['id'];
        return $u;
    }, $users);
    respond(['success' => true, 'data' => $users]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = input();
    $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
    if (!$id) respond(['success' => false, 'message' => 'ID tidak valid.'], 422);
    $stmt = $pdo->prepare('DELETE FROM users WHERE id=?');
    $stmt->execute([$id]);
    respond(['success' => true, 'message' => 'Akun berhasil dihapus.']);
}

respond(['success' => false, 'message' => 'Method tidak didukung.'], 405);
