import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";

import { z } from "zod";

import { getCookie, setCookie } from "hono/cookie";

export default createRoute(async (c) => {
  const shadowUserId = getCookie(c, "shadowUserId") ?? generateRandomString(32);

  setCookie(c, "shadowUserId", shadowUserId);

  const links = await c.get("prisma").link.findMany({
    where: {
      shadowUserId,
    },
  });

  return c.render(
    <>
      <div class="bg-white md:shadow p-4">
        <div class="flex items-center mb-4">
          <h1 class="flex-1 font-bold text-xl">
            We have {links.length} {links.length == 1 ? "link" : "links"}
          </h1>
        </div>

        {links.length == 0 ? (
          <p class="text-gray-600">No links yet. Create one below.</p>
        ) : null}

        <ul>
          {links.map((link) => (
            <li>
              <form method="POST" action={`/todos/${link.id}/toggle`}>
                <a
                  href={link.destination}
                  target="_blank"
                  class="text-blue-500 underline"
                >
                  {link.shortId} - {link.description}{" "}
                  <svg
                    class="w-4 h-4 inline-block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </a>
              </form>
            </li>
          ))}
        </ul>
      </div>

      <div class="rounded bg-white shadow">
        <form class="flex flex-col gap-1" method="post">
          <input
            type="text"
            name="destination"
            class="p-4 w-full"
            placeholder="🔗 Link"
            required
          />
          <input
            type="text"
            name="description"
            class="p-4 w-full"
            placeholder="📝 Description"
          />
          <button class="p-4 bg-blue-500 text-white w-full">Create Link</button>
        </form>
      </div>

      <div class="bg-white md:shadow p-4 mt-4">
        <h2 class="font-bold text-xl">Your Shadow User ID</h2>
        <p class="text-gray-600">
          Your shadow user ID is used to group your links together.
        </p>
        <p class="text-gray-600 mt-2">
          Current value:{" "}
          <code class="bg-gray-100 p-1 rounded">
            {shadowUserId}
          </code>
        </p>
      </div>
    </>
  );
});

const CreateLinkSchema = z.object({
  destination: z.string().url(),
  description: z.string().optional(),
});

export const POST = createRoute(
  zValidator("form", CreateLinkSchema),
  async (c) => {
    const shadowUserId = getCookie(c, "shadowUserId");

    if (!shadowUserId) {
      // TODO: handle error better
      return c.redirect("/create");
    }

    const data = c.req.valid("form");

    await c.get("prisma").link.create({
      data: {
        shortId: generateRandomString(6),
        shadowUserId,
        ...data,
      },
    });

    return c.redirect("/create");
  }
);

function generateRandomString(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}
