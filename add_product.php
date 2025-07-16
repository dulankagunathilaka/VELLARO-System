<?php
require_once 'config.php';
require_once 'header.php';

$error = '';
$success = '';

// Get categories for dropdown
$categories = array();
$cat_query = "SELECT id, name FROM categories ORDER BY name";
$cat_result = $conn->query($cat_query);
if ($cat_result->num_rows > 0) {
    while ($row = $cat_result->fetch_assoc()) {
        $categories[$row['id']] = $row['name'];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $category_id = intval($_POST['category_id']);
    $name = trim($_POST['name']);
    $colors = explode(',', trim($_POST['colors']));
    $colors = array_map('trim', $colors);
    $colors_json = json_encode($colors);
    
    // Prices
    $price_s = floatval($_POST['price_s']);
    $price_m = floatval($_POST['price_m']);
    $price_l = floatval($_POST['price_l']);
    $price_xl = floatval($_POST['price_xl']);
    $price_2xl = floatval($_POST['price_2xl']);
    $price_3xl = floatval($_POST['price_3xl']);
    
    // Stocks
    $stock_s = intval($_POST['stock_s']);
    $stock_m = intval($_POST['stock_m']);
    $stock_l = intval($_POST['stock_l']);
    $stock_xl = intval($_POST['stock_xl']);
    $stock_2xl = intval($_POST['stock_2xl']);
    $stock_3xl = intval($_POST['stock_3xl']);
    
    // Validate
    if (empty($name) || empty($category_id)) {
        $error = 'Product name and category are required';
    } elseif (empty($colors)) {
        $error = 'At least one color is required';
    } else {
        $stmt = $conn->prepare("INSERT INTO products (
            category_id, name, price_s, price_m, price_l, price_xl, price_2xl, price_3xl,
            stock_s, stock_m, stock_l, stock_xl, stock_2xl, stock_3xl, colors
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmt->bind_param("isddddddiiiiiiis", 
            $category_id, $name, $price_s, $price_m, $price_l, $price_xl, $price_2xl, $price_3xl,
            $stock_s, $stock_m, $stock_l, $stock_xl, $stock_2xl, $stock_3xl, $colors_json);
        
        if ($stmt->execute()) {
            $success = 'Product added successfully!';
            $_POST = array(); // Clear form
        } else {
            $error = 'Error adding product: ' . $conn->error;
        }
        
        $stmt->close();
    }
}
?>

<div class="form-container">
    <h2>Add New T-Shirt Product</h2>
    
    <?php if ($error): ?>
        <div class="alert alert-danger"><?= $error ?></div>
    <?php endif; ?>
    
    <?php if ($success): ?>
        <div class="alert alert-success"><?= $success ?></div>
    <?php endif; ?>
    
    <form method="POST" enctype="multipart/form-data">
        <div class="form-group">
            <label for="category_id">Category</label>
            <select id="category_id" name="category_id" class="form-control" required>
                <option value="">Select a category</option>
                <?php foreach ($categories as $id => $name): ?>
                    <option value="<?= $id ?>" <?= ($_POST['category_id'] ?? '') == $id ? 'selected' : '' ?>>
                        <?= htmlspecialchars($name) ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>
        
        <div class="form-group">
            <label for="name">Product Name</label>
            <input type="text" id="name" name="name" class="form-control" 
                   value="<?= htmlspecialchars($_POST['name'] ?? '') ?>" required>
        </div>
        
        <div class="form-group">
            <label for="colors">Colors (comma separated)</label>
            <input type="text" id="colors" name="colors" class="form-control" 
                   value="<?= htmlspecialchars($_POST['colors'] ?? '') ?>" 
                   placeholder="e.g., Red, Blue, Black" required>
        </div>
        
        <h3>Pricing</h3>
        <div class="price-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            <div class="form-group">
                <label for="price_s">Price (S)</label>
                <input type="number" step="0.01" id="price_s" name="price_s" class="form-control" 
                       value="<?= htmlspecialchars($_POST['price_s'] ?? '0') ?>" required>
            </div>
            
            <div class="form-group">
                <label for="price_m">Price (M)</label>
                <input type="number" step="0.01" id="price_m" name="price_m" class="form-control" 
                       value="<?= htmlspecialchars($_POST['price_m'] ?? '0') ?>" required>
            </div>
            
            <div class="form-group">
                <label for="price_l">Price (L)</label>
                <input type="number" step="0.01" id="price_l" name="price_l" class="form-control" 
                       value="<?= htmlspecialchars($_POST['price_l'] ?? '0') ?>" required>
            </div>
            
            <div class="form-group">
                <label for="price_xl">Price (XL)</label>
                <input type="number" step="0.01" id="price_xl" name="price_xl" class="form-control" 
                       value="<?= htmlspecialchars($_POST['price_xl'] ?? '0') ?>" required>
            </div>
            
            <div class="form-group">
                <label for="price_2xl">Price (2XL)</label>
                <input type="number" step="0.01" id="price_2xl" name="price_2xl" class="form-control" 
                       value="<?= htmlspecialchars($_POST['price_2xl'] ?? '0') ?>" required>
            </div>
            
            <div class="form-group">
                <label for="price_3xl">Price (3XL)</label>
                <input type="number" step="0.01" id="price_3xl" name="price_3xl" class="form-control" 
                       value="<?= htmlspecialchars($_POST['price_3xl'] ?? '0') ?>" required>
            </div>
        </div>
        
        <h3>Initial Stock</h3>
        <div class="stock-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            <div class="form-group">
                <label for="stock_s">Stock (S)</label>
                <input type="number" id="stock_s" name="stock_s" class="form-control" 
                       value="<?= htmlspecialchars($_POST['stock_s'] ?? '0') ?>" min="0" required>
            </div>
            
            <div class="form-group">
                <label for="stock_m">Stock (M)</label>
                <input type="number" id="stock_m" name="stock_m" class="form-control" 
                       value="<?= htmlspecialchars($_POST['stock_m'] ?? '0') ?>" min="0" required>
            </div>
            
            <div class="form-group">
                <label for="stock_l">Stock (L)</label>
                <input type="number" id="stock_l" name="stock_l" class="form-control" 
                       value="<?= htmlspecialchars($_POST['stock_l'] ?? '0') ?>" min="0" required>
            </div>
            
            <div class="form-group">
                <label for="stock_xl">Stock (XL)</label>
                <input type="number" id="stock_xl" name="stock_xl" class="form-control" 
                       value="<?= htmlspecialchars($_POST['stock_xl'] ?? '0') ?>" min="0" required>
            </div>
            
            <div class="form-group">
                <label for="stock_2xl">Stock (2XL)</label>
                <input type="number" id="stock_2xl" name="stock_2xl" class="form-control" 
                       value="<?= htmlspecialchars($_POST['stock_2xl'] ?? '0') ?>" min="0" required>
            </div>
            
            <div class="form-group">
                <label for="stock_3xl">Stock (3XL)</label>
                <input type="number" id="stock_3xl" name="stock_3xl" class="form-control" 
                       value="<?= htmlspecialchars($_POST['stock_3xl'] ?? '0') ?>" min="0" required>
            </div>
        </div>
        
        <div class="form-group">
            <label for="image">Product Image (optional)</label>
            <input type="file" id="image" name="image" class="form-control">
        </div>
        
        <button type="submit" class="btn">Add Product</button>
    </form>
</div>

<?php require_once 'footer.php'; ?>