<?php
require __DIR__ . '/../../config/bootstrap.php';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rows = $pdo->query('SELECT r.*, GROUP_CONCAT(c.kode) AS categories FROM shelves r LEFT JOIN shelf_categories sc ON sc.shelf_id=r.id LEFT JOIN categories c ON c.id=sc.category_id GROUP BY r.id ORDER BY r.kode')->fetchAll();
    respond(['success' => true, 'data' => $rows]);
}
$authUser = authenticate($pdo);
respond(['success' => false, 'message' => 'Method tidak didukung.'], 405);
