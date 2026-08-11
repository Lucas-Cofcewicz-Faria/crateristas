import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
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
  try {
    const sql = getDb();
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
