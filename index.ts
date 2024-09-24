import { serve } from "bun";
import { z } from "zod";
import { Client } from "pg";

const server = serve({
  port: 8787,
  fetch: async (request) => {
    const start = performance.now();

    const url = new URL(request.url);

    console.log(`request received at ${url.pathname}`);

    if (url.pathname === "/api/query") {
      console.log(`route matched`);

      const bodyJson = await request.json();

      console.log(`body json parsed`);

      const payloadParseResult = await z
        .object({
          connectionString: z.string(),
          query: z.string(),
        })
        .safeParseAsync(bodyJson);

      console.log(`got payload validation result`);

      if (!payloadParseResult.success) {
        console.error(`payload validation failed`);

        return Response.json(
          {
            data: null,
            error: {
              message: "Invalid request body",
              cause: payloadParseResult.error,
            },
          },
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
        console.log(`closing client`);

        await client.end();

        console.log(`client closed`);

        return Response.json({
          data: result.rows,
          error: null,
          metadata: {
            duration: performance.now() - start,
          },
        });
      } catch (error) {
        console.error(`error while executing query`, error);

        return Response.json(
          {
            data: null,
            error: {
              message: "Error while executing query",
              cause: error,
            },
          },
          {
            status: 500,
          },
        );
      }
    }

    console.log(`no route matched`);

    return Response.json(
      {
        data: null,
        error: {
          message: "Not found",
          cause: null,
        },
      },
      {
        status: 404,
      },
    );
  },
  idleTimeout: 90, // 1.5 minutes
  lowMemoryMode: true,
});

console.log(`server started at ${server.hostname}:${server.port}`);
