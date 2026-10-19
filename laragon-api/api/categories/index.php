<?php
require __DIR__ . '/../../config/bootstrap.php';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rows = $pdo->query('SELECT c.*, COUNT(b.id) AS book_count FROM categories c LEFT JOIN books b ON b.category_id=c.id GROUP BY c.id ORDER BY c.name')->fetchAll();
    respond(['success' => true, 'data' => $rows]);
}
$authUser = authenticate($pdo);
$data = input();
$stmt = $pdo->prepare('INSERT INTO categories (kode,name,color,icon,description) VALUES (?,?,?,?,?)');
$stmt->execute([$data['kode'], $data['name'], $data['color'] ?? null, $data['icon'] ?? null, $data['description'] ?? null]);
respond(['success' => true, 'id' => (int)$pdo->lastInsertId()], 201);
