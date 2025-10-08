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
    
    // First, let's check what columns are available in the PROJECT table
    $columnQuery = "DESCRIBE PROJECT";
    $stmt = $pdo->prepare($columnQuery);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get column names for debugging
    $columnNames = array_column($columns, 'Field');
    
    // Try to query the PROJECT table with actual column names
    // Start with basic query to see what data is available
    $query = "SELECT * FROM PROJECT LIMIT 10";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $rawProjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map the data to expected format based on available columns
    // The PROJECT table appears to be project-asset allocations, so let's adapt the data
    $projects = [];
    foreach ($rawProjects as $project) {
        $mappedProject = [
            'id' => (int)$project['Project_ID'],
            'name' => $project['PM_Contract_Name'] ?? 'Project #' . $project['Project_ID'],
            'client' => 'Customer ID: ' . ($project['Cust_ID'] ?? 'Unknown'),
            'status' => 'Active', // Default status since no status field exists
            'startDate' => '2024-01-01', // Default start date
            'endDate' => '2024-12-31', // Default end date
            'postSupport' => $project['PM_Contract_Name'] ?? 'Standard Support',
            'description' => 'Asset allocation project with ' . ($project['Allocation_Qty'] ?? '0') . ' units (Serial: ' . ($project['Serial_Number'] ?? 'N/A') . ')',
            'assetsCount' => (int)($project['Allocation_Qty'] ?? 0),
            'serialNumber' => $project['Serial_Number'] ?? 'N/A',
            'staffId' => $project['Staff_ID'] ?? 'N/A'
        ];
        
        $projects[] = $mappedProject;
    }
    
    // Format dates for better display
    foreach ($projects as &$project) {
        // Format dates to YYYY-MM-DD format if they exist
        if (!empty($project['startDate'])) {
            $project['startDate'] = date('Y-m-d', strtotime($project['startDate']));
        }
        if (!empty($project['endDate'])) {
            $project['endDate'] = date('Y-m-d', strtotime($project['endDate']));
        }
        
        // Ensure numeric values
        $project['id'] = (int)$project['id'];
        $project['assetsCount'] = (int)$project['assetsCount'];
        
        // Set default values if empty
        if (empty($project['client'])) $project['client'] = 'Unknown Client';
        if (empty($project['status'])) $project['status'] = 'Planning';
        if (empty($project['postSupport'])) $project['postSupport'] = 'Standard Support';
        if (empty($project['description'])) $project['description'] = 'No description available';
    }
    
    // Return response
    echo json_encode([
        "success" => true,
        "data" => $projects,
        "count" => count($projects),
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