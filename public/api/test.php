<?php
include 'config.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

try {
    // Test database connection
    if (!isset($pdo)) {
        throw new Exception("PDO not initialized");
    }
    
    // Test connection
    $stmt = $pdo->query("SELECT 1");
    $result = $stmt->fetch();
    
    // Get database info
    $stmt = $pdo->query("SELECT DATABASE() as current_db");
    $db_info = $stmt->fetch();
    
    // List tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        "success" => true,
        "message" => "Database connection successful",
        "database" => $db_info['current_db'],
        "tables" => $tables,
        "connection_status" => "OK",
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => "Database error",
        "message" => $e->getMessage(),
        "code" => $e->getCode(),
        "timestamp" => date('Y-m-d H:i:s')
    ]);
} catch(Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => "Connection error", 
        "message" => $e->getMessage(),
        "timestamp" => date('Y-m-d H:i:s')
    ]);
}
?>