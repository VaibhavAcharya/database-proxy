import { createFactory } from "https://deno.land/x/hono/helper.ts";
import { cors } from "https://deno.land/x/hono/middleware.ts";
import { z } from "https://deno.land/x/zod/mod.ts";
import postgres from 'https://deno.land/x/postgresjs/mod.js'

export type HonoEnv = {
  Bindings: Record<string | number | symbol, never>;
  Variables: Record<string | number | symbol, never>;
};

const factory = createFactory<HonoEnv>();

const app = factory.createApp();

app.use(cors());

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
    const client = postgres(payload.connectionString);

    const result = await client`${payload.query}`;

    return c.json({
      data: result,
      error: null,
    })
  } catch (error) {
    console.error(error);

    return c.json({
      data: null,
      error: {
        message: "Error while executing query",
        cause: error,
        cause_string: JSON.stringify(error),
      },
    }, {
      status: 500,
    });
  }
});

Deno.serve(app.fetch);
