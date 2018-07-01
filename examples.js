export const query = {
  bike_type: 'road',
  size: 54,
  ship_date: '<' + new Date(),
  '!price': ['> 1000', '< 600'],
  '(condition)': 'like new',
  colors: '(black OR gray) AND red',
  uses: ['triathalon', 'commute', '&city'],
  brand: ['Giant~', 'Spec*'],
  '?2': ['wheels', 'pedals'],
  '?skinny tires': ['specs.*', 'keywords^2']
};

export const config = {
  url: 'https://myserver.com/es/_search',
  size: 25,
  match: 3,
  sortBy: 'price^',
  log: true,
  test: false
};
