import { z } from "zod";
import { Client } from "pg";
import { waitUntil } from "@vercel/functions";

export const maxDuration = 60;

const payloadSchema = z.object({
  connectionString: z.string(),
  query: z.string(),
});

export async function POST(req: Request) {
  console.log(`request received`);

  const bodyJson = await req.json();

  console.log(`body json parsed`);

  console.log(`validating payload`);

  const payloadParseResult = payloadSchema.safeParse(bodyJson);

  console.log(`got payload validation result`);

  if (!payloadParseResult.success) {
    console.error(`payload validation failed`);

    return new Response(
      JSON.stringify({
        data: null,
        error: {
          message: "Invalid request body",
          cause: payloadParseResult.error,
        },
      }),
      {
        status: 400,
      },
    );
  }

  console.log(`payload validated`);

  const payload = payloadParseResult.data;

  try {
    console.log(`initializing client`);

    const client = new Client({
      connectionString: payload.connectionString,
    });

    console.log(`client initialized`);

    console.log(`connecting client`);

    await client.connect();

    console.log(`connected`);

    console.log(`executing query`);

    const result = await client.query(payload.query);

    console.log(`query executed`);

    console.log(`queueing client to be closed`);

    waitUntil(client.end());

    console.log(`client close queued`);

    return new Response(
      JSON.stringify({
        data: result.rows,
        error: null,
      }),
    );
  } catch (error) {
    console.error(`error while executing query`, error);

    return new Response(
      JSON.stringify({
        data: null,
        error: {
          message: "Error while executing query",
          cause: error,
        },
      }),
      {
        status: 500,
      },
    );
  }
}
