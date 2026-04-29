/* JSON file–based storage (no database needed for demo) */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function readCollection(collection) {
  const fp = getFilePath(collection);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, "[]", "utf-8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch {
    return [];
  }
}

function writeCollection(collection, data) {
  fs.writeFileSync(getFilePath(collection), JSON.stringify(data, null, 2), "utf-8");
}

function insert(collection, record) {
  const data = readCollection(collection);
  data.push(record);
  writeCollection(collection, data);
  return record;
}

function findOne(collection, predicate) {
  return readCollection(collection).find(predicate) || null;
}

function findMany(collection, predicate) {
  const data = readCollection(collection);
  return predicate ? data.filter(predicate) : data;
}

function deleteOne(collection, predicate) {
  const data = readCollection(collection);
  const idx = data.findIndex(predicate);
  if (idx === -1) return false;
  data.splice(idx, 1);
  writeCollection(collection, data);
  return true;
}

module.exports = { insert, findOne, findMany, deleteOne, readCollection };
