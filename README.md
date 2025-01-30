# Rewriting HTML with Cloudflare

## Motivation

When customizing Shoptet projects with code, one of the limitations is the inability to manipulate the HTML outside of dedicated fields (e.g. global `<head>` code). Using Cloudflare as a proxy opens up this possibility. With [Cloudflare Workers](https://developers.cloudflare.com/workers/) and [Workers Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/), it is possible to programmatically modify the HTML before it reaches the user. The purpose of this package is to provide a starting point for developing customization workers.

Benefits of using Cloudflare workers for HTML rewriting include

- Avoid flashing and moving elements due to client-side JavaScript customizations.
- Less burden on client devices. This is especially noticeable on older mobile devices or on slow networks, where client-side JavaScript customizations inadvertently increase page load times.

One potential drawback is that the browser must wait a bit longer for the HTML document itself. However, this time can be minimized to tens of milliseconds.

## Start with a simple local setup

This will give you a simple Cloudflare Worker that can be run locally:

- Requirements:
  - Node.js installed on your system
- Clone this repo and navigate to its root directory
- Run `npm i`.
- ~~Run `npm run dev:local` Due to Cloudflare restrictions, you must use `npm run dev:remote` when developing against the site that is already using Cloudflare as a proxy.~~
- Currently, the only way to use rewriting is to use `npm run dev:remote` for which you need to be logged in a (free) Cloudflare account. The usage counts towards your trier plan limits.
- At <http://localhost:8787/> you should see a modified showcase project <https://classic.shoptet.cz/> The project can be switched by changing `SHOP_URL` env variable in `wrangler.toml`.
- You can play around with `src/index.ts` and see your changes applied.

## Production use

- Requirements:
  - Shoptet project using Cloudflare as proxy (see [Shoptet docs](https://podpora.shoptet.cz/hc/cs/articles/7128655751826-Cloudflare))
  - Cloudflare account with access to project's Cloudflare dashboard. You will need `All domains` access with `Cloudflare Workers Admin` rights.
- Run `npm run dev:remote` for local development.
- Run `npm run deploy:production` to deploy using Wrangler.
- Once you have deployed the worker, set up Workers Routes in the Cloudflare dashboard of the selected domain. This tells Cloudflare which routes to trigger your worker on. It is important to exclude common system routes, assets, etc. to save resources and prevent unexpected behavior. Recommended disabled routes are listed [here](/src/config/recommended-disabled-routes.json). The list is not exhaustive and should be adjusted to the specific project. Various HTML modals can be affected by the worker, for example, so it is recommended to test the worker in all user scenarios.

Example of typical settings of Workers Routes (see [docs](https://developers.cloudflare.com/workers/configuration/routing/routes/) for matching rules):

<img src="docs/img/cloudflare-navigation.png" alt="Cloudflare navigation" style="margin: 20px; padding: 10px; border: 1px solid gray" />

<img src="docs/img/routes-setting.png" alt="Wourker Routes settings" style="margin: 20px; padding: 10px; border: 1px solid gray" />

## Parsing the entire document vs HTMLRewriter

This example uses [node-html-parser](https://www.npmjs.com/package/node-html-parser), which parses the entire HTML document into memory. It offers similar possibilities as DOM manipulation in the browser (`querySelector` etc.). This makes it suitable for large changes in HTML documents. Average slowdown of TTFB with `node-html-parser` is about 50-70ms. We recommend it for most use cases.

Switch to the `with-html-rewriter` branch to use Cloudflare's own [HTMLRewriter](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/). Its main appeal is that it rewrites HTML while streaming the response, making it faster in comparison to libraries like `node-html-parser` or `cheerio`. On the other hand, its modifying capabilities are limited. For example, by definition, you cannot change an element based on another element further down in the HTML document, because the former is already sent to the user when the latter is processed. The average slowdown of TTFB with HTMLRewriter is about 15ms. We recommend it for cases where only very simple HTML changes are required.

## FAQ

### How to deploy worker to staging environment

To deploy your worker to a staging environment (where you can show your changes to a client, for example) instead of production, you can use worker environment variables. In the example, this is what `npm run deploy:staging` does. It will publish your worker to a `workers.dev` URL where it will run in dev mode, similar to localhost. See the Cloudflare documentation for more information on deployments and environment variables.

## Possible future enhancements of this starter

- Adding livereload to `dev:remote` (currently not available)
- Example of developing and deploying worker together with client-side customizations (JavaScript and CSS) in an unified workflow. This is doable since Cloudflare Workers can serve static assets.
- Deployment with GitHub actions
