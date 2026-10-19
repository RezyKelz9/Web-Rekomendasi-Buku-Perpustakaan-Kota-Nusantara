<?php
require __DIR__ . '/../../config/bootstrap.php';
$authUser = authenticate($pdo);

$data = input();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $loanId = (int)($data['loanId'] ?? 0);
    $userId = (int)($data['userId'] ?? 0);
    $rating = (int)($data['rating'] ?? 0);

    if ($loanId <= 0 || $userId <= 0 || $rating < 1 || $rating > 5) {
        respond(['success' => false, 'message' => 'Data rating tidak valid.'], 422);
    }

    $check = $pdo->prepare('SELECT id FROM loans WHERE id=? AND user_id=?');
    $check->execute([$loanId, $userId]);
    if (!$check->fetch()) {
        respond(['success' => false, 'message' => 'Peminjaman tidak ditemukan.'], 404);
    }

    $stmt = $pdo->prepare('SELECT id FROM ratings WHERE loan_id=?');
    $stmt->execute([$loanId]);
    $existing = $stmt->fetch();

    if ($existing) {
        $stmt = $pdo->prepare('UPDATE ratings SET rating=?, created_at=NOW() WHERE id=?');
        $stmt->execute([$rating, (int)$existing['id']]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO ratings (loan_id, user_id, rating) VALUES (?,?,?)');
        $stmt->execute([$loanId, $userId, $rating]);
    }

    respond(['success' => true, 'message' => 'Rating berhasil disimpan.']);
}

respond(['success' => false, 'message' => 'Method tidak didukung.'], 405);
