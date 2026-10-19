<?php
require __DIR__ . '/../../config/bootstrap.php';
$data = input();
foreach (['namaLengkap', 'email', 'password', 'username', 'nip'] as $field) {
    if (empty($data[$field])) respond(['success' => false, 'message' => 'Data admin belum lengkap.'], 422);
}
$check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$check->execute([strtolower(trim($data['email']))]);
if ($check->fetch()) respond(['success' => false, 'message' => 'Email sudah terdaftar.'], 409);

$stmt = $pdo->prepare('INSERT INTO users (nama_lengkap,email,username,nip,password_hash,alamat,role,status) VALUES (?,?,?,?,?,?,"admin","active")');
$stmt->execute([trim($data['namaLengkap']), strtolower(trim($data['email'])), trim($data['username']), trim($data['nip']), password_hash($data['password'], PASSWORD_DEFAULT), $data['alamat'] ?? 'Kantor Perpustakaan Kota Nusantara']);
$id = (int)$pdo->lastInsertId();
$role = $data['role'] ?? 'admin';
$memberCode = generateMemberCode($pdo, '', $role);
$pdo->prepare('UPDATE users SET member_code=? WHERE id=?')->execute([$memberCode, $id]);
$stmt = $pdo->prepare('SELECT id,nama_lengkap,email,username,nip,alamat,nomor_hp,jenis_anggota,membership_type,role,status,member_code FROM users WHERE id=?');
$stmt->execute([$id]);
$user = $stmt->fetch();
respond(['success' => true, 'message' => 'Registrasi admin berhasil.', 'user' => $user], 201);
