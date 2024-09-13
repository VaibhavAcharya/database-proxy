import { createFactory } from "https://deno.land/x/hono/helper.ts";
import { Client } from "https://deno.land/x/postgres/mod.ts";
import { z } from "https://deno.land/x/zod/mod.ts";

export type HonoEnv = {
  Bindings: Record<string | number | symbol, never>;
  Variables: Record<string | number | symbol, never>;
};

const factory = createFactory<HonoEnv>();

const app = factory.createApp();

app.post("/api/postgres/query", async (c) => {
  const body = await c.req.json();

  const bodyParseResult = z.object({
    connectionString: z.string(),
    query: z.string(),
  }).safeParse(body);

  if (!bodyParseResult.success) {
    return c.json({
      data: null,
      error: {
        message: "Invalid request body",
        cause: bodyParseResult.error,
      },
    }, {
      status: 400,
    });
  }

  const payload = bodyParseResult.data;

  try {
    const client = new Client(payload.connectionString);

    const result = await client.queryArray(payload.query);

    return c.json({
      data: result.rows,
      error: null,
    })
  } catch (error) {
    return c.json({
      data: null,
      error: {
        message: "Error while executing query",
        cause: error,
      },
    }, {
      status: 500,
    });
  }
});

Deno.serve(app.fetch);
