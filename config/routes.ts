export type RouteType = 'link' | 'group';

export interface BaseRoute {
  path?: string;
  tag: string;
  label: string;
  disabled?: boolean
}

export interface LinkRoute extends BaseRoute{
  type: 'link';
}

export interface GroupRoute {
  type: 'group';
  tag: string;
  label: string;
  subroutes?: BaseRoute[];
}

export type Route = LinkRoute | GroupRoute;

export const routes: Route[] = [
  {
    type: 'link',
    path: '/',
    label: 'Home',
    tag: 'route:home',
  },
  {
    type: 'link',
    path: '/blocks',
    label: 'Blocks',
    tag: 'route:blocks',
  },
  {
    type: 'link',
    path: '/transactions',
    label: 'Transactions',
    tag: 'route:transactions',
  },
  // {
  //   type: 'link',
  //   path: '/nfts',
  //   label: 'NFTs',
  //   tag: 'route:nfts',
  // },
  // {
  //   type: 'link',
  //   path: '/tokens',
  //   label: 'Tokens',
  //   tag: 'route:tokens',
  // },
  {
    type: 'link',
    path: '/tokens/trending',
    label: 'Top Statistics',
    tag: 'route:top-statistics',
  },
]

export default routes
