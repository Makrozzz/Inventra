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
    
    // Query the ASSET table from the database
    $query = "SELECT 
        Serial_Number as id,
        Asset_ModelName as name,
        COALESCE(Accessories, 'N/A') as accessories,
        Asset_Status as status,
        CASE 
            WHEN Asset_Status = 'Active' THEN '1000'
            WHEN Asset_Status = 'Maintenance' THEN '500'
            ELSE '100'
        END as price,
        CASE 
            WHEN Asset_Status = 'Active' THEN '10'
            WHEN Asset_Status = 'Maintenance' THEN '1'
            ELSE '0'
        END as quantity
        FROM ASSET 
        LIMIT 100";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return response
    echo json_encode([
        "success" => true,
        "data" => $products,
        "count" => count($products),
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