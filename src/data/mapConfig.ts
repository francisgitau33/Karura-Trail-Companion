export const mapConfig = {
  appName: 'Karura Forest Trail Companion',
  sponsorName: "Kenya Children’s Home",
  tagline:
    'A free digital trail companion for Karura Forest visitors, developed as a public resource by Kenya Children’s Home.',
  center: {
    lat: -1.236,
    lng: 36.821,
  },
  defaultZoom: 14,
  showPrototypeBanner: true,
  donation: {
    paybill: '[Insert PayBill Number]',
    accountReference: 'Karura Map',
    websiteUrl: '[Insert Kenya Children’s Home Website]',
  },
};

export type MapConfig = typeof mapConfig;
