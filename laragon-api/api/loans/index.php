<?php
require __DIR__ . '/../../config/bootstrap.php';

$authUser = authenticate($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $requestedUserId = $_GET['userId'] ?? null;
    $status = $_GET['status'] ?? null;
    if ($authUser['role'] !== 'admin' && $requestedUserId !== null && (int)$requestedUserId !== (int)$authUser['id']) {
        respond(['success' => false, 'message' => 'Anda hanya dapat melihat pinjaman Anda sendiri.'], 403);
    }
    $userId = $requestedUserId ?? ($authUser['role'] !== 'admin' ? (string)$authUser['id'] : null);
    $sql = 'SELECT l.*, b.title, b.author, b.cover, u.nama_lengkap AS user_name, u.jenis_anggota AS user_type FROM loans l JOIN books b ON b.id=l.book_id JOIN users u ON u.id=l.user_id WHERE (:userId IS NULL OR l.user_id=:userId) AND (:status IS NULL OR l.status=:status) ORDER BY l.borrowed_at DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['userId' => $userId, 'status' => $status]);
    $loans = $stmt->fetchAll();
    $loans = array_map(function ($loan) {
        $loan['id'] = (int)$loan['id'];
        $loan['user_id'] = (int)$loan['user_id'];
        $loan['book_id'] = (int)$loan['book_id'];
        $loan['duration'] = (int)$loan['duration'];
        $loan['fine'] = (float)$loan['fine'];
        $loan['is_favorite'] = (bool)$loan['is_favorite'];
        $loan['payment_status'] = $loan['payment_status'] ?? 'unpaid';
        return $loan;
    }, $loans);
    respond(['success' => true, 'data' => $loans]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = input();
    $userId = (int)($data['userId'] ?? 0);
    if ($userId !== (int)$authUser['id'] && $authUser['role'] !== 'admin') {
        respond(['success' => false, 'message' => 'Anda hanya dapat membuat pinjaman untuk diri sendiri.'], 403);
    }
    $pdo->beginTransaction();
    $stock = $pdo->prepare('SELECT stock FROM books WHERE id=? FOR UPDATE');
    $stock->execute([(int)$data['bookId']]);
    $book = $stock->fetch();
    if (!$book || (int)$book['stock'] < 1) { $pdo->rollBack(); respond(['success' => false, 'message' => 'Buku tidak tersedia.'], 422); }

    $bookId = (int)$data['bookId'];
    $duration = (int)($data['duration'] ?? 7);
    $isFavorite = !empty($data['isFavorite']) ? 1 : 0;
    $userName = $data['userName'] ?? '';
    $userType = $data['userType'] ?? 'Umum';

    $checkLoan = $pdo->prepare("SELECT id FROM loans WHERE user_id=? AND book_id=? AND status IN ('Menunggu','Dipinjam')");
    $checkLoan->execute([$userId, $bookId]);
    if ($checkLoan->fetch()) { $pdo->rollBack(); respond(['success' => false, 'message' => 'Anda sudah meminjam buku ini.'], 422); }

    $stmt = $pdo->prepare("INSERT INTO loans (user_id,book_id,borrowed_at,due_at,duration,fine,is_favorite,payment_status,status) VALUES (?,?,NOW(),DATE_ADD(NOW(), INTERVAL ? DAY),?,0,?,'unpaid','Menunggu')");
    $stmt->execute([$userId, $bookId, $duration, $duration, $isFavorite]);
    $loanId = (int)$pdo->lastInsertId();
    $pdo->commit();

    $loan = $pdo->prepare("SELECT l.*, b.title, b.author, b.cover FROM loans l JOIN books b ON b.id=l.book_id WHERE l.id=?");
    $loan->execute([$loanId]);
    $loan = $loan->fetch();
    $loan['user_name'] = $userName;
    $loan['user_type'] = $userType;
    $loan['id'] = (int)$loan['id'];
    $loan['user_id'] = (int)$loan['user_id'];
    $loan['book_id'] = (int)$loan['book_id'];
    $loan['duration'] = (int)$loan['duration'];
    $loan['fine'] = (float)$loan['fine'];
    $loan['is_favorite'] = (bool)$loan['is_favorite'];
    respond(['success' => true, 'data' => $loan], 201);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = input();
    $id = (int)$data['id'];
    $action = $data['action'] ?? '';
    $fine = isset($data['fine']) ? (float)$data['fine'] : 0;

    $stmt = $pdo->prepare('SELECT * FROM loans WHERE id=?');
    $stmt->execute([$id]);
    $loan = $stmt->fetch();
    if (!$loan) respond(['success' => false, 'message' => 'Peminjaman tidak ditemukan.'], 404);

    switch ($action) {
        case 'approve':
            $dueAt = date('Y-m-d H:i:s', strtotime('+' . (int)$loan['duration'] . ' days'));
            $pdo->beginTransaction();
            $pdo->prepare("UPDATE loans SET status='Dipinjam', due_at=? WHERE id=?")->execute([$dueAt, $id]);
            $pdo->prepare("UPDATE books SET stock=stock-1 WHERE id=? AND stock>0")->execute([(int)$loan['book_id']]);
            $pdo->commit();
            respond(['success' => true, 'message' => 'Peminjaman disetujui.']);
        case 'reject':
            $pdo->prepare("UPDATE loans SET status='Ditolak' WHERE id=?")->execute([$id]);
            respond(['success' => true, 'message' => 'Peminjaman ditolak.']);
        case 'return':
            $paymentStatus = $fine > 0 ? 'unpaid' : 'paid';
            $pdo->beginTransaction();
            $pdo->prepare("UPDATE loans SET status='Dikembalikan', returned_at=NOW(), fine=?, payment_status=? WHERE id=?")->execute([$fine, $paymentStatus, $id]);
            $pdo->prepare("UPDATE books SET stock=stock+1 WHERE id=?")->execute([(int)$loan['book_id']]);
            $pdo->commit();
            respond(['success' => true, 'message' => 'Buku dikembalikan.']);
        case 'pay':
            $pdo->prepare("UPDATE loans SET payment_status='paid' WHERE id=?")->execute([$id]);
            respond(['success' => true, 'message' => 'Pembayaran berhasil.']);
        case 'confirm':
            $stmt = $pdo->prepare("SELECT fine, payment_status, book_id FROM loans WHERE id=?");
            $stmt->execute([$id]);
            $currentLoan = $stmt->fetch();
            if ($currentLoan && (float)$currentLoan['fine'] > 0 && $currentLoan['payment_status'] === 'unpaid') {
                respond(['success' => false, 'message' => 'Anggota belum membayar denda.'], 422);
            }
            $pdo->prepare("UPDATE loans SET status='Selesai', returned_at=NOW(), fine=? WHERE id=?")->execute([$fine, $id]);
            respond(['success' => true, 'message' => 'Pengembalian dikonfirmasi.']);
        default:
            respond(['success' => false, 'message' => 'Aksi tidak dikenal.'], 422);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = input();
    $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
    $stmt = $pdo->prepare('DELETE FROM loans WHERE id=?');
    $stmt->execute([$id]);
    respond(['success' => true, 'message' => 'Peminjaman dihapus.']);
}

respond(['success' => false, 'message' => 'Method tidak didukung.'], 405);
