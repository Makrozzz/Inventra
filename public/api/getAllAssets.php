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
    
    // Query to get ALL columns from ASSET table
    $query = "SELECT * FROM ASSET LIMIT 100";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $assets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get column information for the frontend
    $columnQuery = "DESCRIBE ASSET";
    $stmt = $pdo->prepare($columnQuery);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return response with both data and column information
    echo json_encode([
        "success" => true,
        "data" => $assets,
        "columns" => $columns,
        "count" => count($assets),
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