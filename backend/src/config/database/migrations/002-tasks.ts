/* eslint-disable camelcase */
type MigrationBuilder = any;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Task catalogue
  pgm.createTable("tasks", {
    id: {
      primaryKey: true,
      type: "uuid",
      notNull: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: {
      type: "VARCHAR(150)",
      notNull: true,
    },
    category: {
      type: "VARCHAR(100)",
      notNull: true,
    },
    short_description: {
      type: "VARCHAR(255)",
      notNull: true,
    },
    created_at: {
      type: "TIMESTAMPTZ",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex("tasks", "category", { name: "idx_tasks_category" });

  // Seed 25 tasks across 5 categories, modelled on app.padosipro.com
  const tasks = [
    // Home Cleaning
    { name: "Full Home Deep Cleaning", category: "Home Cleaning", desc: "Thorough cleaning of all rooms, surfaces and fixtures." },
    { name: "Kitchen Deep Cleaning", category: "Home Cleaning", desc: "Grease removal, appliance wipe-down and cabinet scrub." },
    { name: "Bathroom Sanitisation", category: "Home Cleaning", desc: "Tiles, toilet, basin and mirror cleaned and disinfected." },
    { name: "Sofa & Carpet Shampooing", category: "Home Cleaning", desc: "Foam extraction cleaning for sofas and carpets." },
    { name: "Window & Glass Cleaning", category: "Home Cleaning", desc: "Streak-free cleaning of all windows and glass surfaces." },

    // Plumbing
    { name: "Tap & Faucet Repair", category: "Plumbing", desc: "Fix leaking or dripping taps and replace washers." },
    { name: "Drain Unclogging", category: "Plumbing", desc: "Clear blocked drains in kitchen, bathroom or floor." },
    { name: "Toilet Repair & Replacement", category: "Plumbing", desc: "Fix flush mechanism, seat or replace the entire toilet unit." },
    { name: "Pipe Leak Repair", category: "Plumbing", desc: "Locate and seal leaking pipes in walls or under sinks." },
    { name: "Water Heater Installation", category: "Plumbing", desc: "Install or replace electric or solar water heaters." },

    // Electrical
    { name: "Switchboard & Socket Repair", category: "Electrical", desc: "Fix faulty switches, sockets and MCB issues." },
    { name: "Fan Installation", category: "Electrical", desc: "Install ceiling or wall-mounted fans safely." },
    { name: "Light Fixture Installation", category: "Electrical", desc: "Install LED panels, tube lights or decorative fixtures." },
    { name: "Inverter & UPS Installation", category: "Electrical", desc: "Setup and wire home inverters and battery backups." },
    { name: "CCTV & Doorbell Wiring", category: "Electrical", desc: "Install wiring for surveillance cameras and video doorbells." },

    // Carpentry & Furniture
    { name: "Furniture Assembly", category: "Carpentry & Furniture", desc: "Assemble flat-pack furniture from IKEA, Pepperfry, etc." },
    { name: "Door & Window Repair", category: "Carpentry & Furniture", desc: "Fix hinges, latches and alignment issues on doors and windows." },
    { name: "Wardrobe Installation", category: "Carpentry & Furniture", desc: "Custom fit and install sliding or swing-door wardrobes." },
    { name: "Wall Shelves & TV Unit Mounting", category: "Carpentry & Furniture", desc: "Drill and securely mount shelves, brackets and TV units." },
    { name: "False Ceiling Work", category: "Carpentry & Furniture", desc: "Install or repair gypsum or PVC false ceilings." },

    // Appliance Services
    { name: "AC Service & Gas Refill", category: "Appliance Services", desc: "Annual service, filter cleaning and refrigerant top-up." },
    { name: "Washing Machine Repair", category: "Appliance Services", desc: "Diagnose and fix drum, motor or electronic faults." },
    { name: "Refrigerator Repair", category: "Appliance Services", desc: "Fix cooling issues, thermostat or compressor problems." },
    { name: "Microwave Oven Repair", category: "Appliance Services", desc: "Repair heating element, turntable or door faults." },
    { name: "RO Water Purifier Service", category: "Appliance Services", desc: "Filter replacement, membrane cleaning and performance check." },
  ];

  for (const t of tasks) {
    // Escape single quotes by doubling them (standard SQL)
    const esc = (s: string) => `'${s.replace(/'/g, "''")}'`;
    pgm.sql(
      `INSERT INTO tasks (name, category, short_description) VALUES (${esc(t.name)}, ${esc(t.category)}, ${esc(t.desc)})`,
    );
  }

  // User ↔ Task selection (many-to-many)
  pgm.createTable("user_tasks", {
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },
    task_id: {
      type: "uuid",
      notNull: true,
      references: '"tasks"',
      onDelete: "CASCADE",
    },
    created_at: {
      type: "TIMESTAMPTZ",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.addConstraint("user_tasks", "pk_user_tasks", {
    primaryKey: ["user_id", "task_id"],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("user_tasks");
  pgm.dropTable("tasks");
}