<?php
include 'config.php';

// Set response headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

try {
    // Check if connection exists
    if (!isset($pdo)) {
        throw new Exception("Database connection not established");
    }
    
    // Get pagination parameters
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $offset = ($page - 1) * $limit;
    
    // Ensure valid pagination values
    $page = max(1, $page);
    $limit = min(max(1, $limit), 1000); // Max 1000 items per page
    
    // Get total count for pagination
    $countQuery = "SELECT COUNT(*) as total FROM ASSET";
    $stmt = $pdo->prepare($countQuery);
    $stmt->execute();
    $totalItems = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $totalPages = ceil($totalItems / $limit);
    
    // Query to get paginated columns from ASSET table
    $query = "SELECT * FROM ASSET LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $assets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get column information for the frontend
    $columnQuery = "DESCRIBE ASSET";
    $stmt = $pdo->prepare($columnQuery);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return response with both data and pagination information
    echo json_encode([
        "success" => true,
        "data" => $assets,
        "columns" => $columns,
        "count" => count($assets),
        "total" => (int)$totalItems,
        "page" => $page,
        "totalPages" => $totalPages,
        "limit" => $limit,
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => "Database error",
        "message" => $e->getMessage(),
        "timestamp" => date('Y-m-d H:i:s')
    ]);
} catch(Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => "General error",
        "message" => $e->getMessage(),
        "timestamp" => date('Y-m-d H:i:s')
    ]);
}
?>