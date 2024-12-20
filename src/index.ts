import { parse } from 'node-html-parser';
import { Env } from './types/env';
import { matchesDisabledRoute } from './utils/routes';

export default {
	async fetch(request: Request, env: Env) {
		let response: Response;
		const url = new URL(request.url);

		// In development, construct request and add suppress header to get non-modified HTML
		// In production, pass request to origin server as is
		if (env.ENVIRONMENT === 'development') {
			const headers = new Headers(request.headers);
			headers.set('X-Suppress-HTML-Rewrite', '1');
			const devRequest = new Request(request, { headers });

			response = await fetch(`${env.SHOP_URL!.replace(/\/$/, '')}${url.pathname}${url.search}${url.hash}`, devRequest);
		} else {
			response = await fetch(request);
		}

		// If request has suppress header (see above), it should pass through
		if (request.headers.get('X-Suppress-HTML-Rewrite') === '1') {
			return response;
		}

		// If response is not ok, it should pass through
		if (!response.ok) {
			return response;
		}

		// If response is not HTML, it should pass through
		if (!response.headers.get('Content-Type')?.startsWith('text/html')) {
			return response;
		}

		// Pass through system or asset URLs. These should be ideally never reached in the first place, see README.md
		if (matchesDisabledRoute(url)) {
			return response;
		}

		// Load page with node-html-parser
		const html = await response.text();
		const root = parse(html);

		// Add content to header
		const header = root.querySelector('#header');
		header?.insertAdjacentHTML('afterend', '<div class="container"><h1>Hello from Cloudflare Workers using node-html-parser</h1></div>');

		// Return modified HTML
		return new Response(root.toString(), response);
	},
};
