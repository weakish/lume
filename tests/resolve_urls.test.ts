import { assertStrictEquals as equals } from "../deps/assert.ts";
import { getSite, testPage } from "./utils.ts";
import resolveUrls from "../plugins/resolve_urls.ts";
import { Element } from "../deps/dom.ts";
import { Page } from "../core.ts";

Deno.test("relative_url plugin", async () => {
  const site = getSite({
    test: true,
    src: "resolve_urls",
  });

  site.copy("statics", "");
  site.use(resolveUrls());
  await site.build();

  testPage(site, "/index", (page) => {
    equals(getHref(page, 0), "/bar");
    equals(getHref(page, 1), "foo");
    equals(getHref(page, 2), "./foo");
    equals(getHref(page, 3), "../foo");
    equals(getHref(page, 4), "#foo");
    equals(getHref(page, 5), "?foo=bar");
    equals(getHref(page, 6), "/other/");
    equals(getHref(page, 7), "/other/");
    equals(getHref(page, 8), "https://domain.com");
  });

  testPage(site, "/articles/article-1", (page) => {
    equals(getHref(page, 0), "/drafts/second-article/");
    equals(getHref(page, 1), "/other/");
    equals(getHref(page, 2), "/");
  });

  testPage(site, "/articles/article-2", (page) => {
    equals(getHref(page, 0), "/articles/first-article/");
    equals(getHref(page, 1), "/other/");
    equals(getHref(page, 2), "/");
  });

  testPage(site, "/other", (page) => {
    equals(getHref(page, 0), "/robots.txt");
  });
});

function getHref(page: Page, pos: number) {
  const a = page.document?.querySelectorAll("a")[pos] as Element | null;

  if (!a) {
    return;
  }

  return a.getAttribute("href");
}