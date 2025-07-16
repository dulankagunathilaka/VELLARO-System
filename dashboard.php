<?php
require_once 'config.php';
require_once 'header.php';

// Get today's sales
$today_sales = 0;
$today_profit = 0;
$today_query = "SELECT COUNT(*) as count, SUM(profit_generated) as profit FROM orders 
                WHERE DATE(order_date) = CURDATE() AND confirmed = TRUE";
$today_result = $conn->query($today_query);
if ($today_result->num_rows > 0) {
    $today_data = $today_result->fetch_assoc();
    $today_sales = $today_data['count'];
    $today_profit = $today_data['profit'] ?? 0;
}

// Get weekly sales
$weekly_sales = 0;
$weekly_profit = 0;
$weekly_query = "SELECT COUNT(*) as count, SUM(profit_generated) as profit FROM orders 
                 WHERE YEARWEEK(order_date, 1) = YEARWEEK(CURDATE(), 1) AND confirmed = TRUE";
$weekly_result = $conn->query($weekly_query);
if ($weekly_result->num_rows > 0) {
    $weekly_data = $weekly_result->fetch_assoc();
    $weekly_sales = $weekly_data['count'];
    $weekly_profit = $weekly_data['profit'] ?? 0;
}

// Get monthly sales
$monthly_sales = 0;
$monthly_profit = 0;
$monthly_query = "SELECT COUNT(*) as count, SUM(profit_generated) as profit FROM orders 
                  WHERE MONTH(order_date) = MONTH(CURDATE()) 
                  AND YEAR(order_date) = YEAR(CURDATE()) 
                  AND confirmed = TRUE";
$monthly_result = $conn->query($monthly_query);
if ($monthly_result->num_rows > 0) {
    $monthly_data = $monthly_result->fetch_assoc();
    $monthly_sales = $monthly_data['count'];
    $monthly_profit = $monthly_data['profit'] ?? 0;
}

// Get yearly sales
$yearly_sales = 0;
$yearly_profit = 0;
$yearly_query = "SELECT COUNT(*) as count, SUM(profit_generated) as profit FROM orders 
                 WHERE YEAR(order_date) = YEAR(CURDATE()) AND confirmed = TRUE";
$yearly_result = $conn->query($yearly_query);
if ($yearly_result->num_rows > 0) {
    $yearly_data = $yearly_result->fetch_assoc();
    $yearly_sales = $yearly_data['count'];
    $yearly_profit = $yearly_data['profit'] ?? 0;
}
?>

<div class="dashboard-container">
    <h1>VELLARO Dashboard</h1>
    
    <div class="stats-grid">
        <div class="stat-card">
            <h3>Today's Sales</h3>
            <p class="stat-value"><?= $today_sales ?></p>
            <p class="stat-profit">Profit: Rs. <?= number_format($today_profit, 2) ?></p>
        </div>
        
        <div class="stat-card">
            <h3>This Week</h3>
            <p class="stat-value"><?= $weekly_sales ?></p>
            <p class="stat-profit">Profit: Rs. <?= number_format($weekly_profit, 2) ?></p>
        </div>
        
        <div class="stat-card">
            <h3>This Month</h3>
            <p class="stat-value"><?= $monthly_sales ?></p>
            <p class="stat-profit">Profit: Rs. <?= number_format($monthly_profit, 2) ?></p>
        </div>
        
        <div class="stat-card">
            <h3>This Year</h3>
            <p class="stat-value"><?= $yearly_sales ?></p>
            <p class="stat-profit">Profit: Rs. <?= number_format($yearly_profit, 2) ?></p>
        </div>
    </div>
    
    <div class="quick-actions">
        <a href="add_category.php" class="action-btn">Add Category</a>
        <a href="add_product.php" class="action-btn">Add T-Shirt</a>
        <a href="create_order.php" class="action-btn">Create Order</a>
        <a href="reports.php" class="action-btn">Generate Reports</a>
    </div>
    
    <div class="recent-orders">
        <h2>Recent Orders</h2>
        <?php
        $recent_query = "SELECT o.*, p.name as product_name FROM orders o 
                         JOIN products p ON o.product_id = p.id 
                         ORDER BY order_date DESC LIMIT 5";
        $recent_result = $conn->query($recent_query);
        
        if ($recent_result->num_rows > 0) {
            echo '<table class="orders-table">';
            echo '<tr><th>Order ID</th><th>Product</th><th>Size</th><th>Color</th><th>Qty</th><th>Customer</th><th>Date</th><th>Status</th></tr>';
            
            while ($row = $recent_result->fetch_assoc()) {
                $status = $row['confirmed'] ? '<span class="confirmed">Confirmed</span>' : '<span class="pending">Pending</span>';
                echo "<tr>
                    <td>{$row['id']}</td>
                    <td>{$row['product_name']}</td>
                    <td>{$row['size']}</td>
                    <td>{$row['color']}</td>
                    <td>{$row['quantity']}</td>
                    <td>{$row['customer_name']}</td>
                    <td>" . date('M d, Y', strtotime($row['order_date'])) . "</td>
                    <td>$status</td>
                </tr>";
            }
            
            echo '</table>';
        } else {
            echo '<p>No recent orders found.</p>';
        }
        ?>
    </div>
</div>

<?php require_once 'footer.php'; ?>