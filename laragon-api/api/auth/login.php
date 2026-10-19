<?php
require __DIR__ . '/../../config/bootstrap.php';
$data = input();
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
$stmt->execute([strtolower(trim($data['email'] ?? ''))]);
$user = $stmt->fetch();
if (!$user || !password_verify($data['password'] ?? '', $user['password_hash'])) respond(['success' => false, 'message' => 'Email atau password salah.'], 401);
if ($user['status'] !== 'active') respond(['success' => false, 'message' => 'Akun belum aktif atau diblokir.'], 403);
$requiredRole = $data['requiredRole'] ?? '';
if ($requiredRole === 'admin' && $user['role'] !== 'admin') respond(['success' => false, 'message' => 'Akun ini bukan administrator. Gunakan portal anggota untuk masuk.'], 403);
if ($requiredRole === 'member' && $user['role'] === 'admin') respond(['success' => false, 'message' => 'Gunakan portal administrasi untuk masuk.'], 403);

$token = generateToken();
$pdo->prepare('UPDATE users SET auth_token=? WHERE id=?')->execute([$token, (int)$user['id']]);

$userData = publicUser($user);
$userData['auth_token'] = $token;
respond(['success' => true, 'message' => 'Login berhasil.', 'user' => $userData]);
