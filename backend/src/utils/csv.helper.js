const csv = require("csvtojson");

exports.parseCsvFile = async (filePath) => {
  return await csv().fromFile(filePath);
};