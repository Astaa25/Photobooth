import postgres from 'postgres';
import { env } from '../apps/server/src/config/env.js';

async function main() {
  const sql = postgres(env.DATABASE_URL, { connect_timeout: 5 });

  try {
    const [event] = await sql`SELECT id FROM events WHERE is_active = true LIMIT 1`;
    console.log('Active event ID:', event.id);

    // Test insert visitor
    const [vis] = await sql`
      INSERT INTO visitors (event_id, nickname) 
      VALUES (${event.id}, 'Budi Test') 
      RETURNING *
    `;
    console.log('Inserted visitor:', vis);

    // Test insert queue ticket
    const [ticket] = await sql`
      INSERT INTO queue_tickets (event_id, visitor_id, number, status)
      VALUES (${event.id}, ${vis.id}, 99, 'queued')
      RETURNING *
    `;
    console.log('Inserted ticket:', ticket);

    // Clean up test record
    await sql`DELETE FROM queue_tickets WHERE id = ${ticket.id}`;
    await sql`DELETE FROM visitors WHERE id = ${vis.id}`;
    console.log('Cleaned up test record cleanly!');

    process.exit(0);
  } catch (err: any) {
    console.error('Test CRUD failed:', err.message);
    process.exit(1);
  }
}

main();
