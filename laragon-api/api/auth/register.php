<?php
require __DIR__ . '/../../config/bootstrap.php';
$data = input();
foreach (['namaLengkap', 'email', 'password'] as $field) {
    if (empty($data[$field])) respond(['success' => false, 'message' => 'Data pendaftaran belum lengkap.'], 422);
}
$check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$check->execute([strtolower(trim($data['email']))]);
if ($check->fetch()) respond(['success' => false, 'message' => 'Email sudah terdaftar.'], 409);

$stmt = $pdo->prepare('INSERT INTO users (nama_lengkap,email,password_hash,nomor_hp,alamat,jenis_anggota,membership_type,role,status) VALUES (?,?,?,?,?,?,?,"member","active")');
$stmt->execute([
    trim($data['namaLengkap']), strtolower(trim($data['email'])), password_hash($data['password'], PASSWORD_DEFAULT),
    $data['nomorHP'] ?? null, $data['alamat'] ?? '', $data['jenisAnggota'] ?? 'Umum', $data['membershipType'] ?? 'Umum'
]);
$id = (int)$pdo->lastInsertId();
$jenisAnggota = $data['jenisAnggota'] ?? 'Umum';
$memberCode = generateMemberCode($pdo, $jenisAnggota, 'member');
$pdo->prepare('UPDATE users SET member_code=? WHERE id=?')->execute([$memberCode, $id]);
$stmt = $pdo->prepare('SELECT id,nama_lengkap,email,username,nip,alamat,nomor_hp,jenis_anggota,membership_type,role,status,member_code FROM users WHERE id=?');
$stmt->execute([$id]);
$user = $stmt->fetch();
respond(['success' => true, 'message' => 'Registrasi berhasil.', 'user' => $user]);
