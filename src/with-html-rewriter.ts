import { Env } from './types/env';

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

		// Pass through system or asset URLs
		// These should be ideally never reached in the first place, see docs/recommended-disabled-routes.md
		if (
			url.pathname.startsWith('/admin/') ||
			url.pathname.startsWith('/user/') ||
			url.pathname.startsWith('/cms/') ||
			url.pathname.startsWith('/shop/dist/')
		) {
			return response;
		}

		// Pass through ajax requests to /action/*
		if (url.pathname.startsWith('/action/')) {
			return response;
		}

		// If response is not HTML, it should pass through
		if (!response.headers.get('Content-Type')?.startsWith('text/html')) {
			return response;
		}

		// Modify header with HTMLRewriter
		const rewriter = new HTMLRewriter();
		rewriter.on('#header', {
			element(element) {
				element.after('<div class="container"><h1>Hello from Cloudflare Workers using HTMLRewriter</h1></div>', { html: true });
			},
		});

		// Return modified HTML
		return rewriter.transform(response);
	},
};
