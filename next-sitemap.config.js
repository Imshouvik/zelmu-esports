const { supabaseAdmin } = require('./supabaseAdmin');

module.exports = {
  siteUrl: 'https://zelmu.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/api/*', '/admin/*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/admin/'] },
    ],
  },
  additionalPaths: async (config) => {
    // Fetch all community post IDs
    const { data: posts } = await supabaseAdmin.from('posts').select('id');
    // Fetch all tournament IDs
    const { data: tournaments } = await supabaseAdmin.from('tournaments').select('id');
    const postPaths = (posts || []).map(post => ({ loc: `/community/${post.id}` }));
    const tournamentPaths = (tournaments || []).map(t => ({ loc: `/tournaments/${t.id}` }));
    return [...postPaths, ...tournamentPaths];
  },
}; 