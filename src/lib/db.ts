import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

export async function getDbClient() {
  if (!databaseUrl || databaseUrl.includes('ep-xxxx') || databaseUrl.includes('user:password')) {
    return null;
  }
  return neon(databaseUrl);
}

export const INITIAL_REVIEWS = [
  {
    id: '1',
    name: 'D.O.M.',
    cuisine: 'Contemporânea Brasileira',
    location: 'Jardins, São Paulo - SP',
    overall: 5,
    taste: 10,
    service: 9,
    ambiance: 9,
    cost_benefit: 7,
    ux: 9,
    spend_per_person: 450,
    price: '$$$$',
    description: "O templo gastronômico de Alex Atala. A experiência com formiga amazônica sobre capim-santo é memorável. Um manifesto brilhante da biodiversidade brasileira aplicada à alta gastronomia.",
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    author: 'Chef Léo',
    date: '4 de junho de 2026',
  },
  {
    id: '2',
    name: 'Maní',
    cuisine: 'Contemporânea',
    location: 'Jardim Paulistano, São Paulo - SP',
    overall: 5,
    taste: 10,
    service: 10,
    ambiance: 9,
    cost_benefit: 8,
    ux: 10,
    spend_per_person: 380,
    price: '$$$$',
    description: "A cozinha sensível e artística de Helena Rizzo. O clássico mil-folhas de mandioca e o peixe do dia com molho de tucupi e leite de coco equilibram perfeitamente conforto e vanguarda.",
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    author: 'Chef Sofia',
    date: '22 de maio de 2026',
  },
  {
    id: '3',
    name: 'Mocotó',
    cuisine: 'Sertaneja / Nordestina',
    location: 'Vila Medeiros, São Paulo - SP',
    overall: 5,
    taste: 9,
    service: 9,
    ambiance: 8,
    cost_benefit: 9,
    ux: 8,
    spend_per_person: 90,
    price: '$$',
    description: "O clássico do chef Rodrigo Oliveira na zona norte. O dadinho de tapioca crocante por fora e macio por dentro, acompanhado de molho de pimenta caseiro, traduz o melhor da alma brasileira.",
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80',
    author: 'Chef Mateus',
    date: '15 de abril de 2026',
  },
];

export async function initDatabase() {
  const sql = await getDbClient();
  if (!sql) return false;

  try {
    // Create the reviews table if it does not exist
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cuisine VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        overall INTEGER NOT NULL,
        taste INTEGER NOT NULL,
        service INTEGER NOT NULL,
        ambiance INTEGER NOT NULL,
        cost_benefit INTEGER DEFAULT 8,
        ux INTEGER DEFAULT 8,
        spend_per_person INTEGER DEFAULT 150,
        price VARCHAR(10) NOT NULL,
        description TEXT NOT NULL,
        image TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        date VARCHAR(100) NOT NULL
      )
    `;

    // Ensure columns exist (for existing tables)
    try {
      await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS cost_benefit INTEGER DEFAULT 8`;
      await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ux INTEGER DEFAULT 8`;
      await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS spend_per_person INTEGER DEFAULT 150`;
      await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images TEXT`;
    } catch (e) {
      console.warn("Failed to run ALTER TABLE (might not be supported by neon driver or table structure already updated):", e);
    }
    
    // Seed initial data if the table is empty
    const countResult = await sql`SELECT COUNT(*) as count FROM reviews`;
    const count = parseInt(countResult[0].count);
    
    if (count === 0) {
      for (const review of INITIAL_REVIEWS) {
        await sql`
          INSERT INTO reviews (id, name, cuisine, location, overall, taste, service, ambiance, cost_benefit, ux, spend_per_person, price, description, image, author, date)
          VALUES (${review.id}, ${review.name}, ${review.cuisine}, ${review.location}, ${review.overall}, ${review.taste}, ${review.service}, ${review.ambiance}, ${review.cost_benefit}, ${review.ux}, ${review.spend_per_person}, ${review.price}, ${review.description}, ${review.image}, ${review.author}, ${review.date})
        `;
      }
    }
    return true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return false;
  }
}
