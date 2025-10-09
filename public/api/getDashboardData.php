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
    
    // Get total assets count
    $totalAssetsQuery = "SELECT COUNT(*) as total FROM ASSET";
    $stmt = $pdo->prepare($totalAssetsQuery);
    $stmt->execute();
    $totalAssets = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get active assets count
    $activeAssetsQuery = "SELECT COUNT(*) as active FROM ASSET WHERE Asset_Status = 'Active'";
    $stmt = $pdo->prepare($activeAssetsQuery);
    $stmt->execute();
    $activeAssets = $stmt->fetch(PDO::FETCH_ASSOC)['active'];
    
    // Get total value (estimate based on status)
    $totalValueQuery = "SELECT 
        SUM(CASE 
            WHEN Asset_Status = 'Active' THEN 1000
            WHEN Asset_Status = 'Maintenance' THEN 500
            ELSE 100
        END) as total_value 
        FROM ASSET";
    $stmt = $pdo->prepare($totalValueQuery);
    $stmt->execute();
    $totalValue = $stmt->fetch(PDO::FETCH_ASSOC)['total_value'] ?? 0;
    
    // Get total customers (count distinct asset statuses as proxy)
    $totalCustomersQuery = "SELECT COUNT(DISTINCT Asset_Status) as customers FROM ASSET WHERE Asset_Status IS NOT NULL";
    $stmt = $pdo->prepare($totalCustomersQuery);
    $stmt->execute();
    $totalCustomers = $stmt->fetch(PDO::FETCH_ASSOC)['customers'];
    
    // Get customer asset data for chart (group by Asset_Status)
    $customerAssetQuery = "SELECT 
        Asset_Status as customer,
        COUNT(*) as devices
        FROM ASSET 
        WHERE Asset_Status IS NOT NULL
        GROUP BY Asset_Status 
        ORDER BY devices DESC 
        LIMIT 5";
    $stmt = $pdo->prepare($customerAssetQuery);
    $stmt->execute();
    $customerAssetData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get recent assets using only known columns from getProducts.php
    $recentAssetsQuery = "SELECT 
        Serial_Number as id,
        Asset_ModelName as name,
        COALESCE(Accessories, 'General') as category,
        Asset_Status as status,
        'Office' as location,
        CASE 
            WHEN Asset_Status = 'Active' THEN 1000
            WHEN Asset_Status = 'Maintenance' THEN 500
            ELSE 100
        END as value
        FROM ASSET 
        ORDER BY Serial_Number DESC 
        LIMIT 5";
    $stmt = $pdo->prepare($recentAssetsQuery);
    $stmt->execute();
    $recentAssets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Prepare response data
    $dashboardData = [
        "stats" => [
            "totalAssets" => (int)$totalAssets,
            "activeAssets" => (int)$activeAssets,
            "totalCustomers" => (int)$totalCustomers,
            "totalValue" => (int)$totalValue
        ],
        "customerAssetData" => $customerAssetData,
        "recentAssets" => $recentAssets
    ];
    
    // Return response
    echo json_encode([
        "success" => true,
        "data" => $dashboardData,
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