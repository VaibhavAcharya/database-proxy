import { z } from "zod";
import { Client } from "pg";
import { waitUntil } from "@vercel/functions";

export const maxDuration = 60;

const payloadSchema = z.object({
  connectionString: z.string(),
  query: z.string(),
});

export async function POST(req: Request) {
  const bodyJson = await req.json();

  const payloadParseResult = payloadSchema.safeParse(bodyJson);

  if (!payloadParseResult.success) {
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

  const payload = payloadParseResult.data;

  console.log(payload);

  try {
    const client = new Client(payload.connectionString);

    console.log("client");

    await client.connect();

    console.log("connected");

    const result = await client.query(payload.query);

    console.log("result");

    waitUntil(client.end());

    return new Response(
      JSON.stringify({
        data: result.rows,
        error: null,
      }),
    );
  } catch (error) {
    console.error(error);

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
