<?php
require __DIR__ . '/../../config/bootstrap.php';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // GET is public — no auth required

    $sql = "SELECT b.*, c.kode AS category_id, r.kode AS shelf_id, GREATEST(b.stock - COALESCE((SELECT COUNT(*) FROM loans l WHERE l.book_id=b.id AND l.status IN ('Dipinjam','Menunggu')),0),0) AS available_stock FROM books b LEFT JOIN categories c ON c.id=b.category_id LEFT JOIN shelves r ON r.id=b.shelf_id ORDER BY b.id DESC";
    $books = $pdo->query($sql)->fetchAll();
    respond(['success' => true, 'data' => $books]);
}
$data = input();
$authUser = authenticate($pdo);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stmt = $pdo->prepare('INSERT INTO books (title,author,category_id,shelf_id,shelf_position,cover,rating,published_year,pages,isbn,stock,description,publisher,recommended) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([$data['title'], $data['author'], $data['categoryId'], $data['shelfId'], $data['shelfPosition'] ?? null, $data['cover'] ?? null, $data['rating'] ?? 0, $data['year'] ?? null, $data['pages'] ?? null, $data['isbn'] ?? null, $data['stock'] ?? 0, $data['description'] ?? null, $data['publisher'] ?? null, !empty($data['recommended'])]);
    respond(['success' => true, 'id' => (int)$pdo->lastInsertId()], 201);
}
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) respond(['success' => false, 'message' => 'ID buku tidak valid.'], 422);
    $check = $pdo->prepare('SELECT id FROM books WHERE id=?');
    $check->execute([$id]);
    if (!$check->fetch()) respond(['success' => false, 'message' => 'Buku tidak ditemukan.'], 404);
    $stmt = $pdo->prepare('UPDATE books SET title=?,author=?,category_id=?,shelf_id=?,shelf_position=?,cover=?,rating=?,published_year=?,pages=?,isbn=?,stock=?,description=?,publisher=?,recommended=? WHERE id=?');
    $stmt->execute([$data['title'], $data['author'], $data['categoryId'], $data['shelfId'], $data['shelfPosition'] ?? null, $data['cover'] ?? null, $data['rating'] ?? 0, $data['year'] ?? null, $data['pages'] ?? null, $data['isbn'] ?? null, $data['stock'] ?? 0, $data['description'] ?? null, $data['publisher'] ?? null, !empty($data['recommended']), $id]);
    respond(['success' => true, 'message' => 'Buku berhasil diperbarui.']);
}
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
    if ($id <= 0) respond(['success' => false, 'message' => 'ID buku tidak valid.'], 422);
    $pdo->prepare('DELETE FROM books WHERE id=?')->execute([$id]);
    respond(['success' => true, 'message' => 'Buku berhasil dihapus.']);
}
respond(['success' => false, 'message' => 'Method tidak didukung.'], 405);
