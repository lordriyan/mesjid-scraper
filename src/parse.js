var Excel = require("exceljs");
const { readdirSync, readFileSync } = require("fs");

const spreadsheet_path = "./src/template/spreadsheet.xlsx";
const input_path = "./data/collection/";
const output_path = "./data/spreadsheet/";

async function start() {
  // Get all file inside data directory
  const dir = readdirSync(input_path);

  dir.forEach(async (item, index) => {
    console.log(`Parse file : ${item}`);

    // Open file json
    var jsonString = readFileSync(input_path + item);

    // Parse json
    var json = JSON.parse(jsonString);

    // Open spreadsheet
    var workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(spreadsheet_path);
    var worksheet = workbook.getWorksheet(1);

    // Fill the sheet
    json.result.forEach((masjid) => {
      var row = worksheet.getRow(worksheet.rowCount + 1);
      row.getCell("A").value = masjid.id;
      row.getCell("B").value = masjid.image;
      row.getCell("C").value = masjid.nama;
      row.getCell("D").value = masjid.address;
      row.getCell("E").value = masjid.email;
      row.getCell("F").value = masjid.phone;
      row.getCell("G").value = masjid.website;
      row.commit();
    });

    // Save
    return workbook.xlsx.writeFile(output_path + item.replace("json", "xlsx"));
  });
}

start();
