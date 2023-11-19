var Excel = require("exceljs");
var workbook = new Excel.Workbook();
const { readFileSync, writeFileSync } = require("fs");

var end_point = [
  // {
  //   url: "https://simas.kemenag.go.id/page/search/masjid/0/0/0/0/?p=",
  //   lokasi: "All",
  // },
  {
    url: "https://simas.kemenag.go.id/page/search/masjid/11/0/0/0/?p=",
    lokasi: "DKI Jakarta",
  },
  {
    url: "https://simas.kemenag.go.id/page/search/masjid/13/164/0/0/?p=",
    lokasi: "Kab. Bogor",
  },
  {
    url: "https://simas.kemenag.go.id/page/search/masjid/13/181/0/0/?p=",
    lokasi: "Kota. Bogor",
  },
  {
    url: "https://simas.kemenag.go.id/page/search/masjid/13/186/0/0/?p=",
    lokasi: "Depok",
  },
  {
    url: "https://simas.kemenag.go.id/page/search/masjid/12/158/0/0/?p=",
    lokasi: "Kab. Tangerang",
  },
  {
    url: "https://simas.kemenag.go.id/page/search/masjid/12/160/0/0/?p=",
    lokasi: "Kota. Tangerang",
  },
  {
    url: "https://simas.kemenag.go.id/page/search/masjid/12/163/0/0/?p=",
    lokasi: "Kota. Tangerang Selatan",
  },
  {
    url: "https://simas.kemenag.go.id/page/search/masjid/13/185/0/0/?p=",
    lokasi: "Kota. Bekasi",
  },
  {
    url: "https://simas.kemenag.go.id/page/search/masjid/13/179/0/0/?p=",
    lokasi: "Kab. Bekasi",
  },
];

async function start(data) {
  var json_path = `./data/collection/${slugify(data.lokasi)}.json`;

  // Open file json, create new one if don't exist
  try {
    var jsonString = readFileSync(json_path);
  } catch (error) {
    var jsonString = readFileSync("./src/template/collection.json");
    writeFileSync(json_path, jsonString, "utf8");
  }

  // Parse json
  var json = JSON.parse(jsonString);

  // Page route
  var page_from = json.nextpage;
  var page_to = await getMaxPage(data.url);

  //! Step 1

  // Pindai semua halaman
  while (page_from <= page_to) {
    // Gabung endpoint dan halaman menjadi url
    var url = data.url + page_from;

    // Send to console that begin to fetching
    console.log(
      `Fetch halaman: ${url} | ${page_from} dari ${page_to} (${
        (100 / page_to) * page_from
      } %)`
    );

    // GET Request ke url
    var response = await fetch(url);
    var body = await response.text();

    // Regex declaration of search page
    var regex_search = {
      url: /<p><a href="(.*?)"/gm,
      image: /img src="(.*?)" \/>/gm,
      nama: /<div class="search-result-content">\n\s+<h4>(.*?)<\/h4>/gm,
      address:
        /<div class="search-result-content">\n\s+<h4>.*?<\/h4>\n\s+<p>(.*?)<\/p>\n/gm,
    };

    // Search each pattern regex on body
    for (const key in regex_search) {
      if (regex_search.hasOwnProperty(key))
        regex_search[key] = getData(body, regex_search[key]);
    }

    // Dump to json each data
    regex_search.url.forEach((url, i) => {
      // Open file json
      var jsonString = readFileSync(json_path);
      // Parse json
      var json = JSON.parse(jsonString);
      // Add data to json
      json.result.push({
        url,
        image: regex_search.image[i],
        nama: regex_search.nama[i],
        address: regex_search.address[i],
      });
      // Set last page
      json.nextpage = page_from + 1;
      // Write to json
      try {
        writeFileSync(json_path, JSON.stringify(json, null, 2), "utf8");
      } catch (error) {
        console.log("An error has occurred ", error);
      }
    });

    // Next page
    page_from++;
  }

  //! Step 2

  // Open file json
  var jsonString = readFileSync(json_path);

  // Parse json
  var json = JSON.parse(jsonString);

  var index = 0;
  while (index < json.result.length) {
    var item = json.result[index];

    if (item.id) {
      index++;
      continue;
    }

    // Send to console that begin to fetching
    console.log(
      `Fetch detail: ${item.url} | ${index + 1} dari ${json.result.length} (${
        (100 / json.result.length) * (index + 1)
      } %)`
    );

    // GET Request ke url
    var response = await fetch(item.url);
    var body = await response.text();

    // Pattern declaration
    var regex_detail = {
      id: /class="font-black">(.*?)<\/a>/gm,
      website: /span>&nbsp;\s+<a href="(.*?)" target="_blank">/gm,
      phone: /class="ti-mobile"><\/i>\n\s+<p>(.*?)<\/p>/gm,
      email: /class="ti-email"><\/i>\n\s+<p>(.*?)<\/p>/gm,
    };

    // Search each pattern regex on body
    for (const key in regex_detail) {
      if (regex_detail.hasOwnProperty(key))
        regex_detail[key] = getData(body, regex_detail[key]);

      if (typeof regex_detail[key] === "object" && regex_detail[key] != null) {
        regex_detail[key] = regex_detail[key][0];
      }
    }

    // Dump to json each data
    json.result[index] = {
      ...json.result[index],
      id: regex_detail?.id || "-",
      email: regex_detail?.email || "-",
      phone: regex_detail?.phone || "-",
      website: regex_detail?.website || "-",
    };

    try {
      writeFileSync(json_path, JSON.stringify(json, null, 2), "utf8");
    } catch (error) {
      console.log("An error has occurred ", error);
    }

    index++;
  }
}

end_point.forEach(async (element) => {
  await start(element);
});

async function getMaxPage(url) {
  var response = await fetch(url + "999999");
  return parseInt(getData(response.url, /\?p=(.*?)$/gm)[0]);
}

const getData = (html, pattern) => {
  a = html.match(pattern);
  a = a ? a.map((item) => new RegExp(pattern, "gm").exec(item)[1]) : null;
  return a;
};

function slugify(str) {
  return String(str)
    .normalize("NFKD") // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, "") // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -]/g, "") // remove non-alphanumeric characters
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // remove consecutive hyphens
}
