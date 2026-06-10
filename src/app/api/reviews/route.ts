import { NextResponse } from 'next/server';
import { getDbClient, initDatabase } from '@/lib/db';

export async function GET() {
  const sql = await getDbClient();
  
  if (!sql) {
    // Graceful fallback with hardcoded reviews when database is not connected
    return NextResponse.json({
      success: true,
      fallback: true,
      message: "Database connection string missing. Displaying fallback mock data.",
      data: [
        {
          id: '1',
          name: 'Osteria Francescana',
          cuisine: 'Italiana',
          location: 'Modena, Itália',
          overall: 5,
          taste: 10,
          service: 9,
          ambiance: 9,
          cost_benefit: 7,
          costBenefit: 7,
          ux: 9,
          spend_per_person: 600,
          spendPerPerson: 600,
          price: '$$$$',
          description: "A obra-prima de Massimo Bottura. O prato 'Five Ages of Parmigiano Reggiano' é um estudo transcendental de texturas e temperaturas. Um equilíbrio perfeito entre narrativa artística, diversão e a rica herança culinária italiana.",
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
          author: 'Chef Léo',
          date: '4 de junho de 2026',
        },
        {
          id: '2',
          name: 'Sukiyabashi Jiro',
          cuisine: 'Japonesa',
          location: 'Tóquio, Japão',
          overall: 5,
          taste: 10,
          service: 10,
          ambiance: 8,
          cost_benefit: 8,
          costBenefit: 8,
          ux: 10,
          spend_per_person: 550,
          spendPerPerson: 550,
          price: '$$$$',
          description: "Uma experiência de sushi que muda vidas. O controle de temperatura do shari (arroz) coincide exatamente com a temperatura corporal, enquanto a cura precisa de cada fatia de neta (peixe) exala perfeição geracional.",
          image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80',
          author: 'Chef Sofia',
          date: '22 de maio de 2026',
        },
        {
          id: '3',
          name: 'Mirazur',
          cuisine: 'Francesa',
          location: 'Menton, França',
          overall: 5,
          taste: 9,
          service: 10,
          ambiance: 10,
          cost_benefit: 9,
          costBenefit: 9,
          ux: 8,
          spend_per_person: 480,
          spendPerPerson: 480,
          price: '$$$$',
          description: "Posicionado majestosamente sobre a costa do Mediterrâneo. O menu do chef Mauro Colagreco inspirado nos ciclos lunares é um sonho botânico. A simplicidade das beterrabas frescas do jardim com caviar local é pura poesia culinária.",
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
          author: 'Chef Mateus',
          date: '15 de abril de 2026',
        },
      ]
    });
  }

  try {
    // Auto initialize schema/seed if needed
    await initDatabase();

    const result = await sql`
      SELECT * FROM reviews 
      ORDER BY 
        CASE 
          WHEN id = '1' THEN 1
          WHEN id = '2' THEN 2
          WHEN id = '3' THEN 3
          ELSE 4
        END ASC, 
        id DESC
    `;
    return NextResponse.json({
      success: true,
      fallback: false,
      data: result
    });
  } catch (error: any) {
    console.error("Database fetch failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const sql = await getDbClient();
  if (!sql) {
    return NextResponse.json(
      { success: false, error: "Database not connected. Please add DATABASE_URL to .env.local." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { 
      id, name, cuisine, location, overall, taste, service, ambiance, 
      costBenefit, cost_benefit, ux, spendPerPerson, spend_per_person, price, description, image, images, author, date 
    } = body;

    const dbCostBenefit = costBenefit ?? cost_benefit ?? 8;
    const dbUx = ux ?? 8;
    const dbSpendPerPerson = spendPerPerson ?? spend_per_person ?? 150;
    const dbImages = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([image]);

    if (!name || !location || !description) {
      return NextResponse.json(
        { success: false, error: "Required fields missing." },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO reviews (id, name, cuisine, location, overall, taste, service, ambiance, cost_benefit, ux, spend_per_person, price, description, image, images, author, date)
      VALUES (${id}, ${name}, ${cuisine}, ${location}, ${overall}, ${taste}, ${service}, ${ambiance}, ${dbCostBenefit}, ${dbUx}, ${dbSpendPerPerson}, ${price}, ${description}, ${image}, ${dbImages}, ${author}, ${date})
    `;

    return NextResponse.json({
      success: true,
      data: body
    });
  } catch (error: any) {
    console.error("Database insert failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
