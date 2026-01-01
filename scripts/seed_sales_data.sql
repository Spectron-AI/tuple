-- Sales Demo Database Schema and Sample Data
-- This creates a comprehensive sales database with ~100k records

USE sales_demo;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS regions;
DROP TABLE IF EXISTS sales_reps;

-- Create regions table
CREATE TABLE regions (
    region_id INT PRIMARY KEY AUTO_INCREMENT,
    region_name VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    timezone VARCHAR(50)
);

-- Create categories table
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id INT,
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);

-- Create sales_reps table
CREATE TABLE sales_reps (
    rep_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    region_id INT,
    hire_date DATE,
    commission_rate DECIMAL(5,4) DEFAULT 0.05,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

-- Create customers table
CREATE TABLE customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100),
    contact_email VARCHAR(100),
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50),
    region_id INT,
    customer_segment ENUM('Enterprise', 'SMB', 'Startup', 'Consumer') DEFAULT 'SMB',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lifetime_value DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

-- Create products table
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    category_id INT,
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    stock_quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 10,
    is_discontinued BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Create orders table
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    order_date DATE NOT NULL,
    customer_id INT NOT NULL,
    sales_rep_id INT,
    order_status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned') DEFAULT 'Pending',
    shipping_method ENUM('Standard', 'Express', 'Overnight', 'Pickup') DEFAULT 'Standard',
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('Credit Card', 'Debit Card', 'PayPal', 'Wire Transfer', 'Invoice') DEFAULT 'Credit Card',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_date DATE,
    delivered_date DATE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (sales_rep_id) REFERENCES sales_reps(rep_id)
);

-- Create order_items table
CREATE TABLE order_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    line_total DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Insert regions
INSERT INTO regions (region_name, country, timezone) VALUES
('North America East', 'USA', 'America/New_York'),
('North America West', 'USA', 'America/Los_Angeles'),
('North America Central', 'USA', 'America/Chicago'),
('Europe West', 'UK', 'Europe/London'),
('Europe Central', 'Germany', 'Europe/Berlin'),
('Asia Pacific', 'Japan', 'Asia/Tokyo'),
('Latin America', 'Brazil', 'America/Sao_Paulo'),
('Middle East', 'UAE', 'Asia/Dubai'),
('Southeast Asia', 'Singapore', 'Asia/Singapore'),
('Australia', 'Australia', 'Australia/Sydney');

-- Insert categories
INSERT INTO categories (category_name, description, parent_category_id) VALUES
('Electronics', 'Electronic devices and accessories', NULL),
('Software', 'Software products and licenses', NULL),
('Hardware', 'Computer hardware components', NULL),
('Services', 'Professional services', NULL),
('Accessories', 'Various accessories', NULL),
('Laptops', 'Portable computers', 1),
('Smartphones', 'Mobile phones', 1),
('Tablets', 'Tablet devices', 1),
('Enterprise Software', 'Business software solutions', 2),
('Consumer Software', 'Personal use software', 2),
('Servers', 'Server hardware', 3),
('Networking', 'Network equipment', 3),
('Consulting', 'Technical consulting', 4),
('Support', 'Technical support services', 4),
('Cables & Adapters', 'Connectivity accessories', 5);

-- Insert sales reps
INSERT INTO sales_reps (first_name, last_name, email, phone, region_id, hire_date, commission_rate) VALUES
('John', 'Smith', 'john.smith@tuple.io', '+1-555-0101', 1, '2020-01-15', 0.08),
('Sarah', 'Johnson', 'sarah.johnson@tuple.io', '+1-555-0102', 2, '2019-06-20', 0.10),
('Michael', 'Williams', 'michael.williams@tuple.io', '+1-555-0103', 3, '2021-03-10', 0.07),
('Emily', 'Brown', 'emily.brown@tuple.io', '+44-555-0104', 4, '2020-08-05', 0.09),
('David', 'Jones', 'david.jones@tuple.io', '+49-555-0105', 5, '2018-11-12', 0.11),
('Lisa', 'Garcia', 'lisa.garcia@tuple.io', '+81-555-0106', 6, '2022-02-28', 0.06),
('James', 'Martinez', 'james.martinez@tuple.io', '+55-555-0107', 7, '2021-07-19', 0.08),
('Jennifer', 'Anderson', 'jennifer.anderson@tuple.io', '+971-555-0108', 8, '2020-04-22', 0.09),
('Robert', 'Taylor', 'robert.taylor@tuple.io', '+65-555-0109', 9, '2019-09-30', 0.10),
('Amanda', 'Thomas', 'amanda.thomas@tuple.io', '+61-555-0110', 10, '2022-01-05', 0.07);

-- Insert products (50 products)
INSERT INTO products (product_name, sku, category_id, unit_price, cost_price, stock_quantity, reorder_level) VALUES
('MacBook Pro 16"', 'LAP-MBP16-001', 6, 2499.00, 1800.00, 150, 20),
('MacBook Air M2', 'LAP-MBA-002', 6, 1299.00, 950.00, 200, 25),
('Dell XPS 15', 'LAP-DXPS-003', 6, 1799.00, 1300.00, 120, 15),
('ThinkPad X1 Carbon', 'LAP-TPX1-004', 6, 1649.00, 1200.00, 100, 15),
('HP Spectre x360', 'LAP-HPS-005', 6, 1449.00, 1050.00, 80, 10),
('iPhone 15 Pro', 'PHN-IP15P-001', 7, 1199.00, 850.00, 500, 50),
('iPhone 15', 'PHN-IP15-002', 7, 999.00, 700.00, 600, 60),
('Samsung Galaxy S24', 'PHN-SGS24-003', 7, 899.00, 650.00, 400, 40),
('Google Pixel 8', 'PHN-GP8-004', 7, 699.00, 500.00, 300, 30),
('iPad Pro 12.9"', 'TAB-IPAD-001', 8, 1099.00, 800.00, 250, 25),
('iPad Air', 'TAB-IPDA-002', 8, 599.00, 430.00, 300, 30),
('Samsung Galaxy Tab S9', 'TAB-SGT-003', 8, 849.00, 600.00, 180, 20),
('Microsoft 365 Business', 'SW-M365B-001', 9, 299.00, 0.00, 9999, 0),
('Adobe Creative Cloud', 'SW-ACC-002', 9, 599.00, 0.00, 9999, 0),
('Salesforce Enterprise', 'SW-SFE-003', 9, 1500.00, 0.00, 9999, 0),
('Slack Business+', 'SW-SLK-004', 9, 149.00, 0.00, 9999, 0),
('Zoom Business', 'SW-ZM-005', 9, 199.00, 0.00, 9999, 0),
('Windows 11 Pro', 'SW-W11P-006', 10, 199.00, 0.00, 9999, 0),
('Microsoft Office Home', 'SW-MOH-007', 10, 149.00, 0.00, 9999, 0),
('Dell PowerEdge R750', 'SRV-DPE-001', 11, 8999.00, 6500.00, 30, 5),
('HP ProLiant DL380', 'SRV-HPP-002', 11, 7499.00, 5400.00, 25, 5),
('Cisco Catalyst 9300', 'NET-CC93-001', 12, 4999.00, 3600.00, 40, 8),
('Ubiquiti UniFi Switch', 'NET-UUS-002', 12, 799.00, 580.00, 100, 15),
('Aruba Access Point', 'NET-AAP-003', 12, 599.00, 430.00, 150, 20),
('Technical Consulting (hourly)', 'SVC-TC-001', 13, 250.00, 120.00, 9999, 0),
('Architecture Review', 'SVC-AR-002', 13, 5000.00, 2500.00, 9999, 0),
('Premium Support (annual)', 'SVC-PS-001', 14, 2999.00, 1000.00, 9999, 0),
('Standard Support (annual)', 'SVC-SS-002', 14, 999.00, 400.00, 9999, 0),
('USB-C Hub', 'ACC-UCH-001', 15, 79.00, 35.00, 500, 50),
('HDMI Cable 6ft', 'ACC-HDM-002', 15, 19.99, 5.00, 1000, 100),
('Thunderbolt 4 Cable', 'ACC-TB4-003', 15, 49.00, 20.00, 400, 40),
('Wireless Mouse', 'ACC-WM-004', 15, 59.00, 25.00, 600, 60),
('Mechanical Keyboard', 'ACC-MK-005', 15, 149.00, 65.00, 300, 30),
('Monitor Stand', 'ACC-MS-006', 15, 89.00, 40.00, 250, 25),
('Laptop Bag', 'ACC-LB-007', 15, 129.00, 55.00, 400, 40),
('AirPods Pro', 'ACC-APP-008', 5, 249.00, 180.00, 350, 35),
('Galaxy Buds Pro', 'ACC-GBP-009', 5, 199.00, 140.00, 280, 28),
('Magic Keyboard', 'ACC-MKB-010', 5, 299.00, 210.00, 200, 20),
('Magic Trackpad', 'ACC-MTP-011', 5, 149.00, 105.00, 180, 18),
('27" 4K Monitor', 'ACC-MON-012', 5, 549.00, 380.00, 120, 12),
('Webcam HD', 'ACC-WC-013', 5, 99.00, 45.00, 400, 40),
('Docking Station', 'ACC-DS-014', 5, 299.00, 180.00, 150, 15),
('External SSD 1TB', 'ACC-SSD-015', 5, 129.00, 75.00, 350, 35),
('Power Bank 20000mAh', 'ACC-PB-016', 5, 59.00, 28.00, 500, 50),
('Screen Protector', 'ACC-SP-017', 5, 29.99, 8.00, 800, 80),
('Phone Case Premium', 'ACC-PC-018', 5, 49.00, 18.00, 600, 60),
('Wireless Charger', 'ACC-WCH-019', 5, 39.00, 15.00, 450, 45),
('USB-C to Lightning', 'ACC-UCL-020', 15, 24.99, 8.00, 700, 70),
('Ethernet Adapter', 'ACC-EA-021', 15, 34.99, 12.00, 350, 35),
('Privacy Screen', 'ACC-PRS-022', 5, 69.00, 30.00, 200, 20);

-- Create stored procedure to generate customers
DELIMITER //
CREATE PROCEDURE generate_customers(IN num_customers INT)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE company_prefixes VARCHAR(500) DEFAULT 'Tech,Digital,Global,Smart,Cloud,Data,Cyber,Net,Web,Info,Soft,Hard,Micro,Macro,Ultra,Mega,Super,Pro,Elite,Prime';
    DECLARE company_suffixes VARCHAR(500) DEFAULT 'Solutions,Systems,Technologies,Innovations,Dynamics,Analytics,Services,Labs,Works,Corp,Inc,Group,Partners,Ventures,Networks';
    DECLARE segments VARCHAR(100) DEFAULT 'Enterprise,SMB,Startup,Consumer';
    DECLARE cities VARCHAR(500) DEFAULT 'New York,Los Angeles,Chicago,Houston,Phoenix,Philadelphia,San Antonio,San Diego,Dallas,San Jose,London,Berlin,Tokyo,Sydney,Singapore,Dubai,Sao Paulo,Toronto,Mumbai,Seoul';
    
    WHILE i < num_customers DO
        INSERT INTO customers (company_name, contact_name, contact_email, phone, city, country, region_id, customer_segment, lifetime_value)
        VALUES (
            CONCAT(
                ELT(1 + FLOOR(RAND() * 20), 'Tech','Digital','Global','Smart','Cloud','Data','Cyber','Net','Web','Info','Soft','Hard','Micro','Macro','Ultra','Mega','Super','Pro','Elite','Prime'),
                ' ',
                ELT(1 + FLOOR(RAND() * 15), 'Solutions','Systems','Technologies','Innovations','Dynamics','Analytics','Services','Labs','Works','Corp','Inc','Group','Partners','Ventures','Networks'),
                ' ',
                LPAD(i, 4, '0')
            ),
            CONCAT('Contact ', i),
            CONCAT('contact', i, '@company', i, '.com'),
            CONCAT('+1-555-', LPAD(FLOOR(RAND() * 10000), 4, '0')),
            ELT(1 + FLOOR(RAND() * 20), 'New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose','London','Berlin','Tokyo','Sydney','Singapore','Dubai','Sao Paulo','Toronto','Mumbai','Seoul'),
            ELT(1 + FLOOR(RAND() * 10), 'USA','USA','USA','USA','UK','Germany','Japan','Australia','Singapore','UAE'),
            1 + FLOOR(RAND() * 10),
            ELT(1 + FLOOR(RAND() * 4), 'Enterprise','SMB','Startup','Consumer'),
            ROUND(RAND() * 500000, 2)
        );
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- Generate 5000 customers
CALL generate_customers(5000);
DROP PROCEDURE generate_customers;

-- Create stored procedure to generate orders with items
DELIMITER //
CREATE PROCEDURE generate_orders(IN num_orders INT)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE order_id_var INT;
    DECLARE num_items INT;
    DECLARE j INT;
    DECLARE prod_id INT;
    DECLARE prod_price DECIMAL(10,2);
    DECLARE qty INT;
    DECLARE line_total DECIMAL(15,2);
    DECLARE order_total DECIMAL(15,2);
    DECLARE order_date_var DATE;
    DECLARE status_val VARCHAR(20);
    DECLARE shipped_date_var DATE;
    DECLARE delivered_date_var DATE;
    
    WHILE i < num_orders DO
        -- Random order date in the last 3 years
        SET order_date_var = DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 1095) DAY);
        
        -- Determine status based on date
        IF order_date_var < DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN
            SET status_val = ELT(1 + FLOOR(RAND() * 6), 'Delivered','Delivered','Delivered','Delivered','Cancelled','Returned');
            SET shipped_date_var = DATE_ADD(order_date_var, INTERVAL FLOOR(1 + RAND() * 3) DAY);
            SET delivered_date_var = DATE_ADD(shipped_date_var, INTERVAL FLOOR(2 + RAND() * 7) DAY);
        ELSEIF order_date_var < DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN
            SET status_val = ELT(1 + FLOOR(RAND() * 4), 'Shipped','Delivered','Delivered','Processing');
            SET shipped_date_var = DATE_ADD(order_date_var, INTERVAL FLOOR(1 + RAND() * 3) DAY);
            SET delivered_date_var = IF(status_val = 'Delivered', DATE_ADD(shipped_date_var, INTERVAL FLOOR(2 + RAND() * 5) DAY), NULL);
        ELSE
            SET status_val = ELT(1 + FLOOR(RAND() * 3), 'Pending','Processing','Shipped');
            SET shipped_date_var = IF(status_val = 'Shipped', DATE_ADD(order_date_var, INTERVAL FLOOR(1 + RAND() * 2) DAY), NULL);
            SET delivered_date_var = NULL;
        END IF;
        
        -- Insert order with placeholder total
        INSERT INTO orders (order_date, customer_id, sales_rep_id, order_status, shipping_method, shipping_cost, discount_percent, total_amount, payment_method, shipped_date, delivered_date)
        VALUES (
            order_date_var,
            1 + FLOOR(RAND() * 5000),
            1 + FLOOR(RAND() * 10),
            status_val,
            ELT(1 + FLOOR(RAND() * 4), 'Standard','Express','Overnight','Pickup'),
            ROUND(5 + RAND() * 25, 2),
            FLOOR(RAND() * 15),
            0,
            ELT(1 + FLOOR(RAND() * 5), 'Credit Card','Debit Card','PayPal','Wire Transfer','Invoice'),
            shipped_date_var,
            delivered_date_var
        );
        
        SET order_id_var = LAST_INSERT_ID();
        SET order_total = 0;
        SET num_items = 1 + FLOOR(RAND() * 5);
        SET j = 0;
        
        -- Add order items
        WHILE j < num_items DO
            SET prod_id = 1 + FLOOR(RAND() * 50);
            SELECT unit_price INTO prod_price FROM products WHERE product_id = prod_id;
            SET qty = 1 + FLOOR(RAND() * 10);
            SET line_total = prod_price * qty;
            SET order_total = order_total + line_total;
            
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
            VALUES (order_id_var, prod_id, qty, prod_price, line_total);
            
            SET j = j + 1;
        END WHILE;
        
        -- Update order total
        UPDATE orders SET total_amount = order_total WHERE order_id = order_id_var;
        
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- Generate 50,000 orders (this creates ~125,000 order items)
CALL generate_orders(50000);
DROP PROCEDURE generate_orders;

-- Create useful indexes for analytics
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_rep ON orders(sales_rep_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_customers_region ON customers(region_id);
CREATE INDEX idx_customers_segment ON customers(customer_segment);
CREATE INDEX idx_products_category ON products(category_id);

-- Update customer lifetime values based on actual orders
UPDATE customers c
SET lifetime_value = (
    SELECT COALESCE(SUM(o.total_amount), 0)
    FROM orders o
    WHERE o.customer_id = c.customer_id
    AND o.order_status NOT IN ('Cancelled', 'Returned')
);

-- Verify data
SELECT 'regions' as table_name, COUNT(*) as row_count FROM regions
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'sales_reps', COUNT(*) FROM sales_reps
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items;
