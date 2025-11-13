import PersonaScraper from '../src/index.js';

/**
 * Basic usage examples for the Persona Scraper
 */

async function example1_singlePlatform() {
  console.log('\n=== Example 1: Scrape Single Platform (YouTube) ===\n');

  const scraper = new PersonaScraper();

  try {
    const result = await scraper.scrapePlatform('youtube', '@mkbhd', {
      maxVideos: 10,
      includeComments: false,
    });

    console.log('Channel:', result.channel.title);
    console.log('Videos collected:', result.videos.length);
    console.log('First video:', result.videos[0].title);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function example2_multiPlatform() {
  console.log('\n=== Example 2: Scrape Multiple Platforms ===\n');

  const scraper = new PersonaScraper();

  const personaName = 'TechInfluencer';
  const platforms = {
    youtube: '@mkbhd',
    twitter: 'mkbhd',
    instagram: 'mkbhd',
  };

  try {
    const result = await scraper.quickScrape(personaName, platforms);

    console.log('Persona:', result.personaName);
    console.log('Platforms scraped:', Object.keys(result.platforms).length);

    // Check each platform's results
    for (const [platform, data] of Object.entries(result.platforms)) {
      if (data.error) {
        console.log(`${platform}: Failed - ${data.error}`);
      } else {
        console.log(`${platform}: Success`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function example3_deepScrape() {
  console.log('\n=== Example 3: Deep Scrape with Maximum Data ===\n');

  const scraper = new PersonaScraper();

  const personaName = 'TechReviewer';
  const platforms = {
    youtube: '@mkbhd',
    twitter: 'mkbhd',
  };

  try {
    const result = await scraper.deepScrape(personaName, platforms);

    console.log('Persona:', result.personaName);
    console.log('Deep scrape completed!');

    // YouTube stats
    if (result.platforms.youtube && !result.platforms.youtube.error) {
      const youtube = result.platforms.youtube;
      console.log(`\nYouTube: ${youtube.videos.length} videos`);

      // Count videos with comments
      const videosWithComments = youtube.videos.filter(v => v.comments && v.comments.length > 0);
      console.log(`Videos with comments: ${videosWithComments.length}`);
    }

    // Twitter stats
    if (result.platforms.twitter && !result.platforms.twitter.error) {
      const twitter = result.platforms.twitter;
      console.log(`\nTwitter: ${twitter.tweets.length} tweets`);
      console.log(`Likes: ${twitter.likes.length}`);
      console.log(`Followers: ${twitter.followers.length}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function example4_customOptions() {
  console.log('\n=== Example 4: Custom Scraping Options ===\n');

  const scraper = new PersonaScraper();

  const personaName = 'CustomPersona';
  const platforms = {
    youtube: '@youtube',
    twitter: 'twitter',
  };

  const customOptions = {
    youtube: {
      maxVideos: 20,
      includeComments: true,
      maxComments: 10,
    },
    twitter: {
      maxTweets: 50,
      includeLikes: false,
      includeFollowers: false,
    },
  };

  try {
    const result = await scraper.scrapePersona(personaName, platforms, customOptions);

    console.log('Custom scrape completed!');
    console.log('Check the data/ directory for results');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run examples
async function runExamples() {
  console.log('='.repeat(60));
  console.log('Persona Scraper - Usage Examples');
  console.log('='.repeat(60));

  // Uncomment the examples you want to run:

  // await example1_singlePlatform();
  // await example2_multiPlatform();
  // await example3_deepScrape();
  // await example4_customOptions();

  console.log('\n' + '='.repeat(60));
  console.log('Examples completed!');
  console.log('='.repeat(60) + '\n');
}

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}

export {
  example1_singlePlatform,
  example2_multiPlatform,
  example3_deepScrape,
  example4_customOptions,
};
