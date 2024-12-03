import routes from '../config/recommended-disabled-routes.json';

export function matchesDisabledRoute(url: URL): boolean {
	return routes.some((route) => {
		// Get pathname without leading slash and without wildcard
		const disabledPathname = route.split('/').slice(1).join('/').replace('*', '');

		if (url.pathname.startsWith(`/${disabledPathname}`)) {
			return true;
		}

		return false;
	});
}
