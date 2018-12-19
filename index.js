const fs = require('fs');
const util = require('util');
const path = require('path');
const got = require('got');
const convert = require('html-to-json-data');
const { group, text, href } = require('html-to-json-data/definitions');
const google = require('@google/maps').createClient({
  key: process.env.GMAPS_API_KEY,
  Promise: Promise,
});
const writeFile = util.promisify(fs.writeFile);

const ENGLISH = 'en';
const JAPANESE = 'ja';
const ENGLISH_LIST = 'https://www.2020games.metro.tokyo.jp/eng/taikaijyunbi/taikai/kaijyou/index.html';
const JAPANESE_LIST = 'https://www.2020games.metro.tokyo.jp/taikaijyunbi/taikai/kaijyou/index.html';
const ID_REGEX = /\/kaijyou_(\d+)\//i;
const SPEACIAL_ADDRESSES = {
  'https://www.2020games.metro.tokyo.jp/taikaijyunbi/taikai/kaijyou/kaijyou_12/index.html': '東京都品川区八潮四丁目',
  'https://www.2020games.metro.tokyo.jp/eng/taikaijyunbi/taikai/kaijyou/kaijyou_20/index.html': '376-3, Nishimachi, Chofu, Tokyo',
  'https://www.2020games.metro.tokyo.jp/eng/taikaijyunbi/taikai/kaijyou/kaijyou_07/index.html': '1-chome, Ariake, Koto-ku, Tokyo',
};

async function generate() {
  const list = await generateList();
  await writeFile(path.join(__dirname, './venues.json'), JSON.stringify(list, null, 2));
}

async function generateList() {
  const english = await getListOfVenueNames(ENGLISH_LIST, ENGLISH);
  const japanese = await getListOfVenueNames(JAPANESE_LIST, JAPANESE);
  const list = joinLists(english, japanese);

  for (const venue of list) {
    await addAddress(venue, ENGLISH);
    await addAddress(venue, JAPANESE);
    await geocodeAddress(venue);
  }
  return list;
}

async function getListOfVenueNames(source, language) {
  const { body } = await got(source);
  const itemDefinition = {
    name: text('a'),
    href: href('a', source),
  };

  const list = convert(body, {
    olympic: group('article ul:nth-of-type(2) li', itemDefinition),
    paralympic: group('article ul:nth-of-type(3) li', itemDefinition),
  });

  // Index byt the url minus the regional language
  return list.olympic.reduce(
    (all, venue) => assign(all, venue, 'olympic', language),
    list.paralympic.reduce((all, venue) => assign(all, venue, 'paralympic', language), {}),
  );
}

function assign(map, venue, type, language) {
  const [, id] = venue.href.match(ID_REGEX) || [];
  if (!id) throw new Error(`Could not find id of venue ${venue.href}`);

  if (map[id]) {
    map[id][type] = true;
  } else {
    map[id] = {
      [`href_${language}`]: venue.href,
      [`name_${language}`]: venue.name,
      [type]: true,
    };
  }
  return map;
}

function joinLists(...args) {
  const map = args.reduce((all, list) => {
    Object.keys(list).forEach((key) => {
      all[key] = Object.assign(all[key] || {}, list[key]);
    });
    return all;
  }, {});
  return Object.values(map);
}

async function addAddress(venue, language) {
  const href = venue[`href_${language}`];
  if (SPEACIAL_ADDRESSES[href]) {
    venue[`address_${language}`] = SPEACIAL_ADDRESSES[href];
  } else {
    const { body } = await got(href);
    const withReference = addAddressReference(body);
    const address = convert(withReference, text('.my_placeholder'));
    if (!address) {
      fs.writeFileSync('./original.html', body);
      fs.writeFileSync('./after.html', withReference);
      throw new Error(`Couldn't find an address on ${href}`);
    }
    venue[`address_${language}`] = address;
  }
}

const ADDRESS_REPLACER = /div class="bg-h2">\s*<h2>(Address|所在地)<\/h2>\s*<\/div>\s*<p>/im;
function addAddressReference(body) {
  return body.replace(ADDRESS_REPLACER, 'p class="my_placeholder">');
}

async function geocodeAddress(venue) {
  const response = await google.geocode({ address: venue.name_ja, region: 'jp' }).asPromise();
  const results = response.json.results;
  const resultWithGeometry = results.find((res) => res.geometry);
  if (!resultWithGeometry) throw new Error(`Could not find the geometry on ${venue.href_ja}`);
  venue.lat = resultWithGeometry.geometry.location.lat;
  venue.lon = resultWithGeometry.geometry.location.lng;
}

if (require.main === module) {
  generate();
}
