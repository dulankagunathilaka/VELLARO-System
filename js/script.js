document.addEventListener('DOMContentLoaded', function() {
    // Initialize data with prices
    let orders = JSON.parse(localStorage.getItem('vellaroOrders')) || [];
    let products = JSON.parse(localStorage.getItem('vellaroProducts')) || [];
    let categories = JSON.parse(localStorage.getItem('vellaroCategories')) || [
        { id: 1, name: 'Vellaro POLO', price: 1499 },
        { id: 2, name: 'Vellaro T shirt', price: 1199 },
        { id: 3, name: 'Vellaro Back Print', price: 1699 },
        { id: 4, name: 'Crop top', price: 1099 },
        { id: 5, name: 'Brink T shirt', price: 899 }
    ];
    let colors = JSON.parse(localStorage.getItem('vellaroColors')) || [
        { id: 1, name: 'Black' },
        { id: 2, name: 'White' },
        { id: 3, name: 'Red' },
        { id: 4, name: 'Blue' },
        { id: 5, name: 'Green' }
    ];
    const sizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
    
    // Initialize inventory if empty
    if (products.length === 0) {
        // Create some sample inventory
        categories.forEach(category => {
            colors.forEach(color => {
                sizes.forEach(size => {
                    products.push({
                        id: products.length + 1,
                        categoryId: category.id,
                        colorId: color.id,
                        size: size,
                        stock: Math.floor(Math.random() * 50) + 10,
                        price: category.price
                    });
                });
            });
        });
        saveProducts();
    }
    
    // Initialize UI
    initDashboard();
    renderOrdersTable();
    renderProductsTable();
    renderCategoriesTable();
    renderInventoryTable();
    initCharts();
    
    // Dark mode toggle
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    darkModeSwitch.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.checked);
    });
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        darkModeSwitch.checked = true;
        document.body.classList.add('dark-mode');
    }
    
    // Event listeners
    document.getElementById('addContactBtn').addEventListener('click', addContactField);
    document.getElementById('addOrderItemBtn').addEventListener('click', addOrderItem);
    document.getElementById('confirmOrderBtn').addEventListener('click', confirmOrder);
    document.getElementById('saveProductBtn').addEventListener('click', saveProduct);
    document.getElementById('saveCategoryBtn').addEventListener('click', saveCategory);
    document.getElementById('updateInventoryBtn').addEventListener('click', updateInventory);
    document.getElementById('orderSearch').addEventListener('input', renderOrdersTable);
    document.getElementById('orderFilter').addEventListener('change', renderOrdersTable);
    document.getElementById('inventoryCategoryFilter').addEventListener('change', renderInventoryTable);
    document.getElementById('inventoryColorFilter').addEventListener('change', renderInventoryTable);
    document.getElementById('inventorySizeFilter').addEventListener('change', renderInventoryTable);
    document.getElementById('generateReport').addEventListener('click', generateReport);
    document.getElementById('exportPdf').addEventListener('click', exportAsPdf);
    document.getElementById('exportPng').addEventListener('click', exportAsPng);
    
    // Initialize modals
    const newOrderModal = new bootstrap.Modal(document.getElementById('newOrderModal'));
    const addProductModal = new bootstrap.Modal(document.getElementById('addProductModal'));
    const addCategoryModal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
    const editInventoryModal = new bootstrap.Modal(document.getElementById('editInventoryModal'));
    
    // Populate dropdowns in new order modal when shown
    document.getElementById('newOrderModal').addEventListener('shown.bs.modal', function() {
        populateCategoryDropdowns();
        populateColorDropdowns();
        calculateOrderTotal();
    });
    
    // Add event listeners to calculate order total when items change
    document.getElementById('orderItems').addEventListener('change', function(e) {
        if (e.target.classList.contains('product-category') || 
            e.target.classList.contains('product-quantity')) {
            calculateOrderTotal();
        }
    });
    
    // Populate dropdowns in add product modal when shown
    document.getElementById('addProductModal').addEventListener('shown.bs.modal', function() {
        const categorySelect = document.getElementById('productCategory');
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(category => {
            categorySelect.innerHTML += `<option value="${category.id}">${category.name} (Rs. ${category.price})</option>`;
        });
        
        const colorSelect = document.getElementById('productColor');
        colorSelect.innerHTML = '<option value="">Select Color</option>';
        colors.forEach(color => {
            colorSelect.innerHTML += `<option value="${color.id}">${color.name}</option>`;
        });
    });
    
    // Initialize dashboard
    function initDashboard() {
        updateSalesFigures();
        renderRecentOrders();
    }
    
    // Update sales figures on dashboard
    function updateSalesFigures() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
        thisWeek.setHours(0, 0, 0, 0);
        
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        
        const thisYear = new Date();
        thisYear.setMonth(0, 1);
        thisYear.setHours(0, 0, 0, 0);
        
        const todaySales = orders.filter(order => new Date(order.date) >= today);
        const weeklySales = orders.filter(order => new Date(order.date) >= thisWeek);
        const monthlySales = orders.filter(order => new Date(order.date) >= thisMonth);
        const yearlySales = orders.filter(order => new Date(order.date) >= thisYear);
        
        document.getElementById('todaySales').textContent = todaySales.length;
        document.getElementById('weeklySales').textContent = weeklySales.length;
        document.getElementById('monthlySales').textContent = monthlySales.length;
        document.getElementById('yearlySales').textContent = yearlySales.length;
        
        document.getElementById('todayProfit').textContent = todaySales.reduce((sum, order) => sum + order.profit, 0);
        document.getElementById('weeklyProfit').textContent = weeklySales.reduce((sum, order) => sum + order.profit, 0);
        document.getElementById('monthlyProfit').textContent = monthlySales.reduce((sum, order) => sum + order.profit, 0);
        document.getElementById('yearlyProfit').textContent = yearlySales.reduce((sum, order) => sum + order.profit, 0);
    }
    
    // Calculate order total in the new order modal
    function calculateOrderTotal() {
        let total = 0;
        let profit = 0;
        
        document.querySelectorAll('.order-item').forEach(itemEl => {
            const categoryId = parseInt(itemEl.querySelector('.product-category').value);
            const quantity = parseInt(itemEl.querySelector('.product-quantity').value) || 0;
            
            if (categoryId) {
                const category = categories.find(c => c.id === categoryId);
                if (category) {
                    total += category.price * quantity;
                    profit += 50 * quantity; // Rs. 50 profit per item
                }
            }
        });
        
        document.getElementById('orderTotalPreview').textContent = total;
        document.getElementById('orderProfitPreview').textContent = profit;
    }
    
    // Render recent orders table
    function renderRecentOrders() {
        const tableBody = document.getElementById('recentOrdersTable');
        tableBody.innerHTML = '';
        
        const recentOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        
        recentOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.items.length} items</td>
                <td>Rs. ${order.total}</td>
                <td><span class="badge bg-success">Completed</span></td>
                <td>${formatDate(order.date)}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Render orders table with pagination
    function renderOrdersTable() {
        const tableBody = document.getElementById('ordersTable');
        tableBody.innerHTML = '';
        
        const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
        const filter = document.getElementById('orderFilter').value;
        
        let filteredOrders = [...orders];
        
        // Apply search filter
        if (searchTerm) {
            filteredOrders = filteredOrders.filter(order => 
                order.customerName.toLowerCase().includes(searchTerm) || 
                order.id.toString().includes(searchTerm) ||
                order.contact.some(c => c.includes(searchTerm))
            );
        }
        
        // Apply time filter
        const now = new Date();
        if (filter === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filteredOrders = filteredOrders.filter(order => new Date(order.date) >= today);
        } else if (filter === 'week') {
            const thisWeek = new Date();
            thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
            thisWeek.setHours(0, 0, 0, 0);
            filteredOrders = filteredOrders.filter(order => new Date(order.date) >= thisWeek);
        } else if (filter === 'month') {
            const thisMonth = new Date();
            thisMonth.setDate(1);
            thisMonth.setHours(0, 0, 0, 0);
            filteredOrders = filteredOrders.filter(order => new Date(order.date) >= thisMonth);
        }
        
        // Pagination
        const itemsPerPage = 20;
        const pageCount = Math.ceil(filteredOrders.length / itemsPerPage);
        const currentPage = 1;
        
        renderPagination('ordersPagination', pageCount, currentPage, (page) => {
            displayOrdersPage(filteredOrders, page, itemsPerPage);
        });
        
        displayOrdersPage(filteredOrders, currentPage, itemsPerPage);
    }
    
    // Display a page of orders
    function displayOrdersPage(orders, page, itemsPerPage) {
        const tableBody = document.getElementById('ordersTable');
        tableBody.innerHTML = '';
        
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, orders.length);
        const pageOrders = orders.slice(startIndex, endIndex);
        
        pageOrders.forEach(order => {
            const row = document.createElement('tr');
            const productList = order.items.map(item => {
                const category = categories.find(c => c.id === item.categoryId);
                const color = colors.find(c => c.id === item.colorId);
                return `${category ? category.name : 'Unknown'} (${color ? color.name : 'Unknown'}, ${item.size}, Qty: ${item.quantity})`;
            }).join('<br>');
            
            const contactList = order.contact.map(c => c).join('<br>');
            
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.address}</td>
                <td>${contactList}</td>
                <td>${productList}</td>
                <td>${order.paymentMethod}</td>
                <td>Rs. ${order.total}</td>
                <td>Rs. ${order.profit}</td>
                <td>${formatDate(order.date)}</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-order" data-id="${order.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-order').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = parseInt(this.getAttribute('data-id'));
                deleteOrder(orderId);
            });
        });
    }
    
    // Render products table
    function renderProductsTable() {
        const tableBody = document.getElementById('productsTable');
        tableBody.innerHTML = '';
        
        // Group products by category and color
        const groupedProducts = {};
        
        products.forEach(product => {
            const key = `${product.categoryId}-${product.colorId}`;
            if (!groupedProducts[key]) {
                groupedProducts[key] = {
                    categoryId: product.categoryId,
                    colorId: product.colorId,
                    sizes: [],
                    stock: 0,
                    price: product.price
                };
            }
            groupedProducts[key].sizes.push(product.size);
            groupedProducts[key].stock += product.stock;
        });
        
        Object.values(groupedProducts).forEach(group => {
            const category = categories.find(c => c.id === group.categoryId);
            const color = colors.find(c => c.id === group.colorId);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${group.categoryId}-${group.colorId}</td>
                <td>${category ? category.name : 'Unknown'}</td>
                <td>${color ? color.name : 'Unknown'}</td>
                <td>${group.sizes.join(', ')}</td>
                <td>${group.stock}</td>
                <td>Rs. ${group.price}</td>
                <td>
                    <button class="btn btn-sm btn-info view-inventory" 
                            data-category-id="${group.categoryId}" 
                            data-color-id="${group.colorId}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-inventory').forEach(btn => {
            btn.addEventListener('click', function() {
                const categoryId = parseInt(this.getAttribute('data-category-id'));
                const colorId = parseInt(this.getAttribute('data-color-id'));
                
                // Set filters and switch to inventory tab
                document.getElementById('inventoryCategoryFilter').value = categoryId;
                document.getElementById('inventoryColorFilter').value = colorId;
                
                // Switch to inventory tab
                const inventoryTab = new bootstrap.Tab(document.querySelector('#inventory-tab'));
                inventoryTab.show();
                
                renderInventoryTable();
            });
        });
    }
    
    // Render categories table
    function renderCategoriesTable() {
        const tableBody = document.getElementById('categoriesTable');
        tableBody.innerHTML = '';
        
        categories.forEach(category => {
            const productCount = products.filter(p => p.categoryId === category.id).length;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>Rs. ${category.price}</td>
                <td>${productCount}</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-category" data-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', function() {
                const categoryId = parseInt(this.getAttribute('data-id'));
                deleteCategory(categoryId);
            });
        });
    }
    
    // Render inventory table
    function renderInventoryTable() {
        const tableBody = document.getElementById('inventoryTable');
        tableBody.innerHTML = '';
        
        const categoryFilter = document.getElementById('inventoryCategoryFilter').value;
        const colorFilter = document.getElementById('inventoryColorFilter').value;
        const sizeFilter = document.getElementById('inventorySizeFilter').value;
        
        let filteredProducts = [...products];
        
        if (categoryFilter) {
            filteredProducts = filteredProducts.filter(p => p.categoryId == categoryFilter);
        }
        
        if (colorFilter) {
            filteredProducts = filteredProducts.filter(p => p.colorId == colorFilter);
        }
        
        if (sizeFilter) {
            filteredProducts = filteredProducts.filter(p => p.size === sizeFilter);
        }
        
        // Pagination
        const itemsPerPage = 20;
        const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);
        const currentPage = 1;
        
        renderPagination('inventoryPagination', pageCount, currentPage, (page) => {
            displayInventoryPage(filteredProducts, page, itemsPerPage);
        });
        
        displayInventoryPage(filteredProducts, currentPage, itemsPerPage);
        
        // Populate filter dropdowns if empty
        if (document.getElementById('inventoryCategoryFilter').options.length <= 1) {
            populateFilterDropdowns();
        }
    }
    
    // Display a page of inventory
    function displayInventoryPage(products, page, itemsPerPage) {
        const tableBody = document.getElementById('inventoryTable');
        tableBody.innerHTML = '';
        
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, products.length);
        const pageProducts = products.slice(startIndex, endIndex);
        
        pageProducts.forEach(product => {
            const category = categories.find(c => c.id === product.categoryId);
            const color = colors.find(c => c.id === product.colorId);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${category ? category.name : 'Unknown'}</td>
                <td>${color ? color.name : 'Unknown'}</td>
                <td>${product.size}</td>
                <td>${product.stock}</td>
                <td>Rs. ${product.price}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-inventory" 
                            data-id="${product.id}"
                            data-category="${category ? category.name : 'Unknown'}"
                            data-color="${color ? color.name : 'Unknown'}"
                            data-size="${product.size}"
                            data-stock="${product.stock}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-inventory').forEach(btn => {
            btn.addEventListener('click', function() {
                document.getElementById('inventoryId').value = this.getAttribute('data-id');
                document.getElementById('inventoryProductName').textContent = this.getAttribute('data-category');
                document.getElementById('inventoryColorName').textContent = this.getAttribute('data-color');
                document.getElementById('inventorySizeName').textContent = this.getAttribute('data-size');
                document.getElementById('inventoryStock').value = this.getAttribute('data-stock');
                
                const modal = new bootstrap.Modal(document.getElementById('editInventoryModal'));
                modal.show();
            });
        });
    }
    
    // Populate filter dropdowns
    function populateFilterDropdowns() {
        const categorySelect = document.getElementById('inventoryCategoryFilter');
        categorySelect.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            categorySelect.innerHTML += `<option value="${category.id}">${category.name} (Rs. ${category.price})</option>`;
        });
        
        const colorSelect = document.getElementById('inventoryColorFilter');
        colorSelect.innerHTML = '<option value="">All Colors</option>';
        colors.forEach(color => {
            colorSelect.innerHTML += `<option value="${color.id}">${color.name}</option>`;
        });
        
        const sizeSelect = document.getElementById('inventorySizeFilter');
        sizeSelect.innerHTML = '<option value="">All Sizes</option>';
        sizes.forEach(size => {
            sizeSelect.innerHTML += `<option value="${size}">${size}</option>`;
        });
    }
    
    // Populate category dropdowns in new order modal
    function populateCategoryDropdowns() {
        const categorySelects = document.querySelectorAll('.product-category');
        categorySelects.forEach(select => {
            select.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(category => {
                select.innerHTML += `<option value="${category.id}">${category.name} (Rs. ${category.price})</option>`;
            });
        });
    }
    
    // Populate color dropdowns in new order modal
    function populateColorDropdowns() {
        const colorSelects = document.querySelectorAll('.product-color');
        colorSelects.forEach(select => {
            select.innerHTML = '<option value="">Select Color</option>';
            colors.forEach(color => {
                select.innerHTML += `<option value="${color.id}">${color.name}</option>`;
            });
        });
    }
    
    // Add contact field to new order form
    function addContactField() {
        const container = document.getElementById('additionalContacts');
        const newContact = document.createElement('div');
        newContact.className = 'input-group mt-2';
        newContact.innerHTML = `
            <input type="tel" class="form-control" placeholder="Additional Contact Number">
            <button class="btn btn-outline-danger remove-contact" type="button">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(newContact);
        
        // Add event listener to remove button
        newContact.querySelector('.remove-contact').addEventListener('click', function() {
            container.removeChild(newContact);
        });
    }
    
    // Add order item to new order form
    function addOrderItem() {
        const container = document.getElementById('orderItems');
        const newItem = document.createElement('div');
        newItem.className = 'order-item row mb-3 p-3 bg-light rounded';
        newItem.innerHTML = `
            <div class="col-md-4">
                <label class="form-label">Product Category</label>
                <select class="form-select product-category" required>
                    <option value="">Select Category</option>
                    ${categories.map(c => `<option value="${c.id}">${c.name} (Rs. ${c.price})</option>`).join('')}
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label">Color</label>
                <select class="form-select product-color" required>
                    <option value="">Select Color</option>
                    ${colors.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label">Size</label>
                <select class="form-select product-size" required>
                    <option value="">Select Size</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL</option>
                    <option value="3XL">3XL</option>
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label">Quantity</label>
                <input type="number" class="form-control product-quantity" min="1" value="1" required>
            </div>
            <div class="col-md-2 d-flex align-items-end">
                <button type="button" class="btn btn-danger remove-item-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(newItem);
        
        // Add event listener to remove button
        newItem.querySelector('.remove-item-btn').addEventListener('click', function() {
            if (document.querySelectorAll('.order-item').length > 1) {
                container.removeChild(newItem);
                calculateOrderTotal();
            }
        });
        
        // Add event listeners to calculate total when changed
        newItem.querySelector('.product-category').addEventListener('change', calculateOrderTotal);
        newItem.querySelector('.product-quantity').addEventListener('change', calculateOrderTotal);
    }
    
    // Confirm new order
    function confirmOrder() {
        const form = document.getElementById('newOrderForm');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        const customerName = document.getElementById('customerName').value;
        const customerAddress = document.getElementById('customerAddress').value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        // Get primary contact
        const primaryContact = document.getElementById('customerContact').value;
        const contacts = [primaryContact];
        
        // Get additional contacts
        document.querySelectorAll('#additionalContacts input').forEach(input => {
            if (input.value) contacts.push(input.value);
        });
        
        // Get order items
        const items = [];
        let hasStockIssue = false;
        let orderTotal = 0;
        let orderProfit = 0;
        
        document.querySelectorAll('.order-item').forEach(itemEl => {
            const categoryId = parseInt(itemEl.querySelector('.product-category').value);
            const colorId = parseInt(itemEl.querySelector('.product-color').value);
            const size = itemEl.querySelector('.product-size').value;
            const quantity = parseInt(itemEl.querySelector('.product-quantity').value);
            
            // Check stock availability
            const product = products.find(p => 
                p.categoryId === categoryId && 
                p.colorId === colorId && 
                p.size === size
            );
            
            if (!product || product.stock < quantity) {
                hasStockIssue = true;
                const category = categories.find(c => c.id === categoryId);
                const color = colors.find(c => c.id === colorId);
                alert(`Insufficient stock for ${category ? category.name : 'Unknown'} (${color ? color.name : 'Unknown'}, ${size}). Available: ${product ? product.stock : 0}`);
                return;
            }
            
            const category = categories.find(c => c.id === categoryId);
            if (category) {
                orderTotal += category.price * quantity;
                orderProfit += 50 * quantity; // Rs. 50 profit per item
            }
            
            items.push({
                categoryId,
                colorId,
                size,
                quantity
            });
        });
        
        if (hasStockIssue || items.length === 0) {
            return;
        }
        
        // Create new order
        const newOrder = {
            id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
            customerName,
            address: customerAddress,
            contact: contacts,
            paymentMethod,
            items,
            total: orderTotal,
            profit: orderProfit,
            date: new Date().toISOString()
        };
        
        // Update stock
        items.forEach(item => {
            const productIndex = products.findIndex(p => 
                p.categoryId === item.categoryId && 
                p.colorId === item.colorId && 
                p.size === item.size
            );
            
            if (productIndex !== -1) {
                products[productIndex].stock -= item.quantity;
            }
        });
        
        // Save data
        orders.push(newOrder);
        saveOrders();
        saveProducts();
        
        // Reset form and close modal
        form.reset();
        form.classList.remove('was-validated');
        document.getElementById('additionalContacts').innerHTML = '';
        
        // Reset order items to one
        const orderItems = document.getElementById('orderItems');
        orderItems.innerHTML = `
            <div class="order-item row mb-3 p-3 bg-light rounded">
                <div class="col-md-4">
                    <label class="form-label">Product Category</label>
                    <select class="form-select product-category" required>
                        <option value="">Select Category</option>
                        ${categories.map(c => `<option value="${c.id}">${c.name} (Rs. ${c.price})</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-2">
                    <label class="form-label">Color</label>
                    <select class="form-select product-color" required>
                        <option value="">Select Color</option>
                        ${colors.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-2">
                    <label class="form-label">Size</label>
                    <select class="form-select product-size" required>
                        <option value="">Select Size</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="2XL">2XL</option>
                        <option value="3XL">3XL</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <label class="form-label">Quantity</label>
                    <input type="number" class="form-control product-quantity" min="1" value="1" required>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="button" class="btn btn-danger remove-item-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners to remove button
        orderItems.querySelector('.remove-item-btn').addEventListener('click', function() {
            // Don't allow removing the last item
            if (document.querySelectorAll('.order-item').length > 1) {
                orderItems.removeChild(this.closest('.order-item'));
                calculateOrderTotal();
            }
        });
        
        // Add event listeners to calculate total when changed
        orderItems.querySelector('.product-category').addEventListener('change', calculateOrderTotal);
        orderItems.querySelector('.product-quantity').addEventListener('change', calculateOrderTotal);
        
        // Reset totals
        document.getElementById('orderTotalPreview').textContent = '0';
        document.getElementById('orderProfitPreview').textContent = '0';
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('newOrderModal'));
        modal.hide();
        
        // Show success message
        showAlert('Order created successfully!', 'success');
        
        // Update UI
        initDashboard();
        renderOrdersTable();
        renderInventoryTable();
    }
    
    // Save new product
    function saveProduct() {
        const form = document.getElementById('addProductForm');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        const categoryId = parseInt(document.getElementById('productCategory').value);
        const colorId = parseInt(document.getElementById('productColor').value);
        const initialStock = parseInt(document.getElementById('initialStock').value) || 0;
        
        // Get selected sizes
        const selectedSizes = [];
        sizes.forEach(size => {
            if (document.getElementById(`size${size}`).checked) {
                selectedSizes.push(size);
            }
        });
        
        if (selectedSizes.length === 0) {
            alert('Please select at least one size');
            return;
        }
        
        // Get category price
        const category = categories.find(c => c.id === categoryId);
        if (!category) {
            alert('Invalid category selected');
            return;
        }
        
        // Create products for each size
        selectedSizes.forEach(size => {
            // Check if product already exists
            const exists = products.some(p => 
                p.categoryId === categoryId && 
                p.colorId === colorId && 
                p.size === size
            );
            
            if (exists) {
                alert(`Product with this category, color and size ${size} already exists`);
                return;
            }
            
            // Create new product
            products.push({
                id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
                categoryId,
                colorId,
                size,
                stock: initialStock,
                price: category.price
            });
        });
        
        // Save data
        saveProducts();
        
        // Reset form and close modal
        form.reset();
        form.classList.remove('was-validated');
        sizes.forEach(size => {
            document.getElementById(`size${size}`).checked = false;
        });
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
        modal.hide();
        
        // Show success message
        showAlert('Product(s) added successfully!', 'success');
        
        // Update UI
        renderProductsTable();
        renderInventoryTable();
        populateFilterDropdowns();
    }
    
    // Save new category
    function saveCategory() {
        const form = document.getElementById('addCategoryForm');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        const categoryName = document.getElementById('categoryName').value.trim();
        const categoryPrice = parseInt(document.getElementById('categoryPrice').value);
        
        // Check if category already exists
        if (categories.some(c => c.name.toLowerCase() === categoryName.toLowerCase())) {
            alert('Category already exists');
            return;
        }
        
        // Add new category
        categories.push({
            id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
            name: categoryName,
            price: categoryPrice
        });
        
        // Save data
        saveCategories();
        
        // Reset form and close modal
        form.reset();
        form.classList.remove('was-validated');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
        modal.hide();
        
        // Show success message
        showAlert('Category added successfully!', 'success');
        
        // Update UI
        renderCategoriesTable();
        populateFilterDropdowns();
    }
    
    // Update inventory
    function updateInventory() {
        const form = document.getElementById('editInventoryForm');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        const productId = parseInt(document.getElementById('inventoryId').value);
        const newStock = parseInt(document.getElementById('inventoryStock').value);
        
        // Find and update product
        const productIndex = products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            products[productIndex].stock = newStock;
            saveProducts();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editInventoryModal'));
            modal.hide();
            
            // Show success message
            showAlert('Inventory updated successfully!', 'success');
            
            // Update UI
            renderProductsTable();
            renderInventoryTable();
        }
    }
    
    // Delete order
    function deleteOrder(orderId) {
        if (confirm('Are you sure you want to delete this order?')) {
            const orderIndex = orders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                // Restore stock if needed
                const order = orders[orderIndex];
                order.items.forEach(item => {
                    const productIndex = products.findIndex(p => 
                        p.categoryId === item.categoryId && 
                        p.colorId === item.colorId && 
                        p.size === item.size
                    );
                    
                    if (productIndex !== -1) {
                        products[productIndex].stock += item.quantity;
                    }
                });
                
                // Remove order
                orders.splice(orderIndex, 1);
                saveOrders();
                saveProducts();
                
                // Show success message
                showAlert('Order deleted successfully!', 'success');
                
                // Update UI
                initDashboard();
                renderOrdersTable();
                renderInventoryTable();
            }
        }
    }
    
    // Delete category
    function deleteCategory(categoryId) {
        // Check if category is used in any products
        const productsUsingCategory = products.filter(p => p.categoryId === categoryId);
        
        if (productsUsingCategory.length > 0) {
            alert('Cannot delete category because it is used in products');
            return;
        }
        
        if (confirm('Are you sure you want to delete this category?')) {
            const categoryIndex = categories.findIndex(c => c.id === categoryId);
            if (categoryIndex !== -1) {
                categories.splice(categoryIndex, 1);
                saveCategories();
                
                // Show success message
                showAlert('Category deleted successfully!', 'success');
                
                // Update UI
                renderCategoriesTable();
                populateFilterDropdowns();
            }
        }
    }
    
    // Generate report
    function generateReport() {
        const reportType = document.getElementById('reportType').value;
        const tableBody = document.getElementById('reportTable');
        tableBody.innerHTML = '';
        
        let reportData = [];
        const now = new Date();
        
        if (reportType === 'daily') {
            // Last 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(now.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDate = new Date(date);
                nextDate.setDate(date.getDate() + 1);
                
                const dayOrders = orders.filter(o => {
                    const orderDate = new Date(o.date);
                    return orderDate >= date && orderDate < nextDate;
                });
                
                const totalQuantity = dayOrders.reduce((sum, order) => 
                    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
                
                const totalRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
                const totalProfit = dayOrders.reduce((sum, order) => sum + order.profit, 0);
                
                reportData.push({
                    period: formatDate(date),
                    orders: dayOrders.length,
                    quantity: totalQuantity,
                    revenue: totalRevenue,
                    profit: totalProfit
                });
            }
        } else if (reportType === 'weekly') {
            // Last 12 weeks
            for (let i = 11; i >= 0; i--) {
                const weekStart = new Date();
                weekStart.setDate(now.getDate() - (now.getDay() + (i * 7)));
                weekStart.setHours(0, 0, 0, 0);
                
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                
                const weekOrders = orders.filter(o => {
                    const orderDate = new Date(o.date);
                    return orderDate >= weekStart && orderDate < weekEnd;
                });
                
                const totalQuantity = weekOrders.reduce((sum, order) => 
                    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
                
                const totalRevenue = weekOrders.reduce((sum, order) => sum + order.total, 0);
                const totalProfit = weekOrders.reduce((sum, order) => sum + order.profit, 0);
                
                reportData.push({
                    period: `Week ${formatDate(weekStart)} to ${formatDate(new Date(weekEnd.getTime() - 1))}`,
                    orders: weekOrders.length,
                    quantity: totalQuantity,
                    revenue: totalRevenue,
                    profit: totalProfit
                });
            }
        } else if (reportType === 'monthly') {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const monthStart = new Date();
                monthStart.setMonth(now.getMonth() - i, 1);
                monthStart.setHours(0, 0, 0, 0);
                
                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthStart.getMonth() + 1);
                
                const monthOrders = orders.filter(o => {
                    const orderDate = new Date(o.date);
                    return orderDate >= monthStart && orderDate < monthEnd;
                });
                
                const totalQuantity = monthOrders.reduce((sum, order) => 
                    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
                
                const totalRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0);
                const totalProfit = monthOrders.reduce((sum, order) => sum + order.profit, 0);
                
                reportData.push({
                    period: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
                    orders: monthOrders.length,
                    quantity: totalQuantity,
                    revenue: totalRevenue,
                    profit: totalProfit
                });
            }
        } else if (reportType === 'yearly') {
            // Last 5 years
            for (let i = 4; i >= 0; i--) {
                const yearStart = new Date();
                yearStart.setFullYear(now.getFullYear() - i, 0, 1);
                yearStart.setHours(0, 0, 0, 0);
                
                const yearEnd = new Date(yearStart);
                yearEnd.setFullYear(yearStart.getFullYear() + 1);
                
                const yearOrders = orders.filter(o => {
                    const orderDate = new Date(o.date);
                    return orderDate >= yearStart && orderDate < yearEnd;
                });
                
                const totalQuantity = yearOrders.reduce((sum, order) => 
                    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
                
                const totalRevenue = yearOrders.reduce((sum, order) => sum + order.total, 0);
                const totalProfit = yearOrders.reduce((sum, order) => sum + order.profit, 0);
                
                reportData.push({
                    period: yearStart.getFullYear().toString(),
                    orders: yearOrders.length,
                    quantity: totalQuantity,
                    revenue: totalRevenue,
                    profit: totalProfit
                });
            }
        }
        
        // Display report data
        reportData.forEach(data => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.period}</td>
                <td>${data.orders}</td>
                <td>${data.quantity}</td>
                <td>Rs. ${data.revenue}</td>
                <td>Rs. ${data.profit}</td>
            `;
            tableBody.appendChild(row);
        });
        
        // Update charts
        updateReportCharts(reportData);
    }
    
    // Update report charts
    function updateReportCharts(reportData) {
        const labels = reportData.map(item => item.period);
        const revenueData = reportData.map(item => item.revenue);
        const profitData = reportData.map(item => item.profit);
        
        // Sales Report Chart
        const salesCtx = document.getElementById('salesReportChart').getContext('2d');
        if (window.salesReportChart) {
            window.salesReportChart.destroy();
        }
        window.salesReportChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Revenue',
                        data: revenueData,
                        borderColor: 'rgba(78, 115, 223, 1)',
                        backgroundColor: 'rgba(78, 115, 223, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Profit',
                        data: profitData,
                        borderColor: 'rgba(28, 200, 138, 1)',
                        backgroundColor: 'rgba(28, 200, 138, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: Rs. ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rs. ' + value;
                            }
                        }
                    }
                }
            }
        });
        
        // Products Report Chart
        const productsCtx = document.getElementById('productsReportChart').getContext('2d');
        if (window.productsReportChart) {
            window.productsReportChart.destroy();
        }
        
        // Get top selling categories
        const categorySales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const category = categories.find(c => c.id === item.categoryId);
                if (category) {
                    if (!categorySales[category.name]) {
                        categorySales[category.name] = 0;
                    }
                    categorySales[category.name] += item.quantity * category.price;
                }
            });
        });
        
        const sortedCategories = Object.entries(categorySales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        window.productsReportChart = new Chart(productsCtx, {
            type: 'bar',
            data: {
                labels: sortedCategories.map(item => item[0]),
                datasets: [{
                    label: 'Revenue by Category',
                    data: sortedCategories.map(item => item[1]),
                    backgroundColor: [
                        'rgba(78, 115, 223, 0.8)',
                        'rgba(28, 200, 138, 0.8)',
                        'rgba(246, 194, 62, 0.8)',
                        'rgba(231, 74, 59, 0.8)',
                        'rgba(54, 185, 204, 0.8)'
                    ],
                    borderColor: [
                        'rgba(78, 115, 223, 1)',
                        'rgba(28, 200, 138, 1)',
                        'rgba(246, 194, 62, 1)',
                        'rgba(231, 74, 59, 1)',
                        'rgba(54, 185, 204, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Revenue: Rs. ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rs. ' + value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Export as PDF
    function exportAsPdf() {
        const activeTab = document.querySelector('.tab-pane.active');
        const element = activeTab.querySelector('.card');
        
        const opt = {
            margin: 10,
            filename: `vellaro-report-${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // New Promise-based usage:
        html2pdf().from(element).set(opt).save();
    }
    
    // Export as PNG
    function exportAsPng() {
        const activeTab = document.querySelector('.tab-pane.active');
        const element = activeTab.querySelector('.card');
        
        html2canvas(element).then(canvas => {
            const link = document.createElement('a');
            link.download = `vellaro-report-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
    
    // Initialize charts
    function initCharts() {
        // Sales chart
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        window.salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Revenue',
                    data: Array(12).fill().map(() => Math.floor(Math.random() * 50000) + 20000),
                    backgroundColor: 'rgba(78, 115, 223, 0.05)',
                    borderColor: 'rgba(78, 115, 223, 1)',
                    pointBackgroundColor: 'rgba(78, 115, 223, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Revenue: Rs. ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return 'Rs. ' + value;
                            }
                        }
                    }
                }
            }
        });
        
        // Products chart
        const productsCtx = document.getElementById('productsChart').getContext('2d');
        
        // Get top selling categories
        const categorySales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const category = categories.find(c => c.id === item.categoryId);
                if (category) {
                    if (!categorySales[category.name]) {
                        categorySales[category.name] = 0;
                    }
                    categorySales[category.name] += item.quantity;
                }
            });
        });
        
        const sortedCategories = Object.entries(categorySales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        window.productsChart = new Chart(productsCtx, {
            type: 'doughnut',
            data: {
                labels: sortedCategories.map(item => item[0]),
                datasets: [{
                    data: sortedCategories.map(item => item[1]),
                    backgroundColor: [
                        'rgba(78, 115, 223, 0.8)',
                        'rgba(28, 200, 138, 0.8)',
                        'rgba(246, 194, 62, 0.8)',
                        'rgba(231, 74, 59, 0.8)',
                        'rgba(54, 185, 204, 0.8)'
                    ],
                    borderColor: [
                        'rgba(78, 115, 223, 1)',
                        'rgba(28, 200, 138, 1)',
                        'rgba(246, 194, 62, 1)',
                        'rgba(231, 74, 59, 1)',
                        'rgba(54, 185, 204, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw} units`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
    
    // Render pagination
    function renderPagination(containerId, pageCount, currentPage, clickHandler) {
        const pagination = document.getElementById(containerId);
        pagination.innerHTML = '';
        
        if (pageCount <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                clickHandler(currentPage - 1);
            }
        });
        pagination.appendChild(prevLi);
        
        // Page buttons
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pageCount, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        if (startPage > 1) {
            const firstLi = document.createElement('li');
            firstLi.className = 'page-item';
            firstLi.innerHTML = `<a class="page-link" href="#">1</a>`;
            firstLi.addEventListener('click', (e) => {
                e.preventDefault();
                clickHandler(1);
            });
            pagination.appendChild(firstLi);
            
            if (startPage > 2) {
                const ellipsisLi = document.createElement('li');
                ellipsisLi.className = 'page-item disabled';
                ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
                pagination.appendChild(ellipsisLi);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageLi.addEventListener('click', (e) => {
                e.preventDefault();
                clickHandler(i);
            });
            pagination.appendChild(pageLi);
        }
        
        if (endPage < pageCount) {
            if (endPage < pageCount - 1) {
                const ellipsisLi = document.createElement('li');
                ellipsisLi.className = 'page-item disabled';
                ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
                pagination.appendChild(ellipsisLi);
            }
            
            const lastLi = document.createElement('li');
            lastLi.className = 'page-item';
            lastLi.innerHTML = `<a class="page-link" href="#">${pageCount}</a>`;
            lastLi.addEventListener('click', (e) => {
                e.preventDefault();
                clickHandler(pageCount);
            });
            pagination.appendChild(lastLi);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === pageCount ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < pageCount) {
                clickHandler(currentPage + 1);
            }
        });
        pagination.appendChild(nextLi);
    }
    
    // Show alert message
    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show alert-animated`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('main');
        container.insertBefore(alert, container.firstChild);
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 3000);
    }
    
    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Save orders to localStorage
    function saveOrders() {
        localStorage.setItem('vellaroOrders', JSON.stringify(orders));
    }
    
    // Save products to localStorage
    function saveProducts() {
        localStorage.setItem('vellaroProducts', JSON.stringify(products));
    }
    
    // Save categories to localStorage
    function saveCategories() {
        localStorage.setItem('vellaroCategories', JSON.stringify(categories));
    }
});