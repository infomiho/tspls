import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";

import { z } from "zod";

import { getCookie, setCookie } from "hono/cookie";

const shadowUserIdCookieName = "shadowUserId";

export default createRoute(async (c) => {
  const shadowUserId =
    getCookie(c, shadowUserIdCookieName) ?? generateRandomString(32);

  setCookie(c, shadowUserIdCookieName, shadowUserId, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

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
            Typescript Playground Link Shortener
          </h1>
        </div>

        {links.length == 0 ? (
          <p class="text-gray-600">No links yet. Create one below.</p>
        ) : null}

        <ul>
          {links.map((link) => (
            <li class="flex items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg mt-2">
              <div class="flex gap-4 items-center">
                <a
                  href={`https://tspls.dev/${link.shortId}`}
                  class="text-blue-500"
                  target="_blank"
                >
                  {link.shortId} ↗️
                </a>
                <p class="text-gray-600">{link.description}</p>
              </div>

              <div>
                {/* Button Copy with copy icon right of the text */}
                <button
                  class="p-2 bg-blue-500 text-white rounded flex items-center gap-1"
                  onclick={`navigator.clipboard.writeText('https://tspls.dev/${link.shortId}')`}
                >
                  Copy{" "}
                  <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M20 4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 12H9v-2h10v2zm0-3H9v-2h10v2zm-5-3H9V8h5v2z"
                    ></path>
                  </svg>
                </button>
              </div>
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
          <code class="bg-gray-100 p-1 rounded">{shadowUserId}</code>
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
    const shadowUserId = getCookie(c, shadowUserIdCookieName);

    if (!shadowUserId) {
      // TODO: handle error better
      return c.redirect("/create");
    }

    const data = c.req.valid("form");

    const url = new URL(data.destination);

    if (
      url.hostname !== "www.typescriptlang.org" ||
      !url.pathname.startsWith("/play")
    ) {
      return c.redirect("/create");
    }

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
