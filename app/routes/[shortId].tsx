import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";

import { z } from "zod";

const ShortIdRouteSchema = z.object({ shortId: z.string() })

export default createRoute(zValidator("param", ShortIdRouteSchema), async (c) => {
  const { shortId } = c.req.valid("param")

  const link = await c.get("prisma").link.findUnique({
    where: {
      shortId,
    },
  });

  if (!link) {
    // TODO: decide if this is the best
    return c.redirect("/create")
  }

  return c.redirect(link.destination, 301);
});