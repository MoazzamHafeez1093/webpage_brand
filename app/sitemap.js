export default function sitemap() {
  return [
    {
      url: 'https://www.houseofaslam.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.houseofaslam.com/shop/all',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];
}
