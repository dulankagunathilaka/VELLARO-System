<?php
require_once 'config.php';
require_once 'header.php';

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name']);
    $description = trim($_POST['description']);
    
    if (empty($name)) {
        $error = 'Category name is required';
    } else {
        $stmt = $conn->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
        $stmt->bind_param("ss", $name, $description);
        
        if ($stmt->execute()) {
            $success = 'Category added successfully!';
            $_POST = array(); // Clear form
        } else {
            $error = 'Error adding category: ' . $conn->error;
        }
        
        $stmt->close();
    }
}
?>

<div class="form-container">
    <h2>Add New Category</h2>
    
    <?php if ($error): ?>
        <div class="alert alert-danger"><?= $error ?></div>
    <?php endif; ?>
    
    <?php if ($success): ?>
        <div class="alert alert-success"><?= $success ?></div>
    <?php endif; ?>
    
    <form method="POST">
        <div class="form-group">
            <label for="name">Category Name</label>
            <input type="text" id="name" name="name" class="form-control" 
                   value="<?= htmlspecialchars($_POST['name'] ?? '') ?>" required>
        </div>
        
        <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" name="description" class="form-control" 
                      rows="3"><?= htmlspecialchars($_POST['description'] ?? '') ?></textarea>
        </div>
        
        <button type="submit" class="btn">Add Category</button>
    </form>
</div>

<?php require_once 'footer.php'; ?>