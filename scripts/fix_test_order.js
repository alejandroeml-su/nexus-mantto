const { Client } = require('pg');

async function seedTestData() {
  const client = new Client({
    connectionString: 'postgres://postgres:postgres@localhost:5432/mantto'
  });

  try {
    await client.connect();
    
    // Find the maintenance ID
    const res = await client.query("SELECT id FROM mantenimientos WHERE id::text LIKE '30a74c96%' OR id::text LIKE '30A74C96%' LIMIT 1");
    
    if (res.rows.length === 0) {
      console.log("No se encontró la orden OT-30A74C96");
      return;
    }

    const mid = res.rows[0].id;
    console.log(`Generando datos para mantenimiento ID: ${mid}`);

    // Update main description if empty
    await client.query("UPDATE mantenimientos SET descripcion = 'Mantenimiento correctivo por falla en sistema de enfriamiento y cambio de filtros.', creado_por = 'Ing. Roberto Méndez' WHERE id = $1", [mid]);

    // Delete existing test data for this order to avoid duplicates
    await client.query("DELETE FROM mantenimiento_actividades WHERE mantenimiento_id = $1", [mid]);
    await client.query("DELETE FROM mantenimiento_items WHERE mantenimiento_id = $1", [mid]);

    // Insert Activities
    const activities = [
      ['Inspección visual inicial y diagnóstico', '2026-03-13 08:00:00', '2026-03-13 08:30:00'],
      ['Limpieza profunda de panal de radiador', '2026-03-13 08:30:00', '2026-03-13 10:00:00'],
      ['Reemplazo de manguera de alta presión', '2026-03-13 10:00:00', '2026-03-13 11:30:00'],
      ['Purga de sistema y prueba de presión', '2026-03-13 11:30:00', '2026-03-13 12:30:00']
    ];

    for (const [desc, start, end] of activities) {
      await client.query(
        "INSERT INTO mantenimiento_actividades (mantenimiento_id, descripcion, fecha_inicio, fecha_fin) VALUES ($1, $2, $3, $4)",
        [mid, desc, start, end]
      );
    }

    // Insert Items
    const items = [
      ['Manguera Reforzada 2"', 1, 45.50],
      ['Abrazaderas de acero inox', 4, 12.00],
      ['Refrigerante concentrado 5L', 2, 28.75],
      ['Filtro de aire industrial', 1, 85.00]
    ];

    for (const [desc, qty, price] of items) {
      await client.query(
        "INSERT INTO mantenimiento_items (mantenimiento_id, descripcion, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)",
        [mid, desc, qty, price]
      );
    }

    // Update total cost
    const totalCostRes = await client.query("SELECT SUM(total) as total_cost FROM mantenimiento_items WHERE mantenimiento_id = $1", [mid]);
    const totalCost = totalCostRes.rows[0].total_cost || 0;
    await client.query("UPDATE mantenimientos SET costo = $1 WHERE id = $2", [totalCost, mid]);

    console.log("¡Datos de prueba generados exitosamente!");

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

seedTestData();
