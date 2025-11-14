CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    raw_value FLOAT NOT NULL,
    unit VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS emission_factors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_type VARCHAR(100) UNIQUE NOT NULL,
    factor FLOAT NOT NULL,
    factor_unit VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS human_count (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    humans INT NOT NULL
);

INSERT INTO emission_factors (source_type, factor, factor_unit) VALUES
('electricity', 0.708, 'kg_co2e_per_kwh'),
('bus_diesel', 2.68, 'kg_co2e_per_liter'),
('canteen_lpg', 2.93, 'kg_co2e_per_kg'),
('waste_landfill', 1.25, 'kg_co2e_per_kg')
ON DUPLICATE KEY UPDATE
    factor = VALUES(factor),
    factor_unit = VALUES(factor_unit);
