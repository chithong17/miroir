import zlib from "zlib";

const uint16 = (buffer, offset) => buffer.readUInt16LE(offset);
const uint32 = (buffer, offset) => buffer.readUInt32LE(offset);
const text = (buffer) => buffer.toString("utf8");

const normalizePath = (path) => {
  const parts = [];

  path.split("/").forEach((part) => {
    if (!part || part === ".") return;
    if (part === "..") {
      parts.pop();
      return;
    }
    parts.push(part);
  });

  return parts.join("/");
};

const resolveTarget = (basePath, target) => {
  if (target.startsWith("/")) {
    return normalizePath(target.slice(1));
  }

  const baseParts = basePath.split("/");
  baseParts.pop();
  return normalizePath([...baseParts, target].join("/"));
};

const getRelMap = (xml) => {
  const relationships = new Map();
  const relationshipPattern = /<Relationship\b[^>]*>/g;
  let match;

  while ((match = relationshipPattern.exec(xml))) {
    const tag = match[0];
    const id = /Id="([^"]+)"/.exec(tag)?.[1];
    const target = /Target="([^"]+)"/.exec(tag)?.[1];

    if (id && target) {
      relationships.set(id, target);
    }
  }

  return relationships;
};

const findEndOfCentralDirectory = (buffer) => {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (uint32(buffer, offset) === 0x06054b50) {
      return offset;
    }
  }

  return -1;
};

const unzipEntries = (buffer) => {
  const entries = new Map();
  const eocdOffset = findEndOfCentralDirectory(buffer);

  if (eocdOffset === -1) {
    return entries;
  }

  const totalEntries = uint16(buffer, eocdOffset + 10);
  let offset = uint32(buffer, eocdOffset + 16);

  for (let index = 0; index < totalEntries; index += 1) {
    if (uint32(buffer, offset) !== 0x02014b50) break;

    const compressionMethod = uint16(buffer, offset + 10);
    const compressedSize = uint32(buffer, offset + 20);
    const fileNameLength = uint16(buffer, offset + 28);
    const extraLength = uint16(buffer, offset + 30);
    const commentLength = uint16(buffer, offset + 32);
    const localHeaderOffset = uint32(buffer, offset + 42);
    const fileName = text(buffer.subarray(offset + 46, offset + 46 + fileNameLength));

    const localNameLength = uint16(buffer, localHeaderOffset + 26);
    const localExtraLength = uint16(buffer, localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);

    if (compressionMethod === 0) {
      entries.set(fileName, Buffer.from(compressed));
    } else if (compressionMethod === 8) {
      entries.set(fileName, zlib.inflateRawSync(compressed));
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
};

const getWorkbookSheets = (entries) => {
  const workbookXml = entries.get("xl/workbook.xml");
  const relsXml = entries.get("xl/_rels/workbook.xml.rels");

  if (!workbookXml || !relsXml) {
    return [];
  }

  const rels = getRelMap(text(relsXml));
  const sheets = [];
  const sheetPattern = /<sheet\b[^>]*>/g;
  let match;

  while ((match = sheetPattern.exec(text(workbookXml)))) {
    const tag = match[0];
    const name = /name="([^"]+)"/.exec(tag)?.[1];
    const relId = /r:id="([^"]+)"/.exec(tag)?.[1];
    const target = relId ? rels.get(relId) : null;

    if (name && target) {
      sheets.push({
        name,
        path: resolveTarget("xl/workbook.xml", target),
      });
    }
  }

  return sheets;
};

const parseAnchoredImages = ({ entries, sheetPath }) => {
  const sheetXml = entries.get(sheetPath);
  if (!sheetXml) return [];

  const drawingRelId = /<drawing\b[^>]*r:id="([^"]+)"/.exec(text(sheetXml))?.[1];
  if (!drawingRelId) return [];

  const sheetFileName = sheetPath.split("/").pop();
  const sheetRelsPath = sheetPath.replace(sheetFileName, `_rels/${sheetFileName}.rels`);
  const sheetRelsXml = entries.get(sheetRelsPath);
  if (!sheetRelsXml) return [];

  const drawingTarget = getRelMap(text(sheetRelsXml)).get(drawingRelId);
  if (!drawingTarget) return [];

  const drawingPath = resolveTarget(sheetPath, drawingTarget);
  const drawingXml = entries.get(drawingPath);
  if (!drawingXml) return [];

  const drawingFileName = drawingPath.split("/").pop();
  const drawingRelsPath = drawingPath.replace(
    drawingFileName,
    `_rels/${drawingFileName}.rels`
  );
  const drawingRelsXml = entries.get(drawingRelsPath);
  if (!drawingRelsXml) return [];

  const drawingRels = getRelMap(text(drawingRelsXml));
  const xml = text(drawingXml);
  const anchors = [];
  const anchorPattern = /<xdr:(?:twoCellAnchor|oneCellAnchor)\b[\s\S]*?<\/xdr:(?:twoCellAnchor|oneCellAnchor)>/g;
  let match;

  while ((match = anchorPattern.exec(xml))) {
    const anchorXml = match[0];
    const row = Number(/<xdr:row>(\d+)<\/xdr:row>/.exec(anchorXml)?.[1]);
    const col = Number(/<xdr:col>(\d+)<\/xdr:col>/.exec(anchorXml)?.[1]);
    const relId = /<a:blip\b[^>]*r:embed="([^"]+)"/.exec(anchorXml)?.[1];
    const target = relId ? drawingRels.get(relId) : null;

    if (Number.isFinite(row) && Number.isFinite(col) && target) {
      const mediaPath = resolveTarget(drawingPath, target);
      const imageBuffer = entries.get(mediaPath);

      if (imageBuffer) {
        anchors.push({
          rowNumber: row + 1,
          columnIndex: col,
          fileName: mediaPath.split("/").pop(),
          buffer: imageBuffer,
        });
      }
    }
  }

  return anchors;
};

export const extractImagesByRowFromWorkbook = (buffer, sheetName = "Products") => {
  const entries = unzipEntries(buffer);
  const sheets = getWorkbookSheets(entries);
  const sheet = sheets.find((candidate) => candidate.name === sheetName) || sheets[0];

  if (!sheet) {
    return new Map();
  }

  const imagesByRow = new Map();
  parseAnchoredImages({ entries, sheetPath: sheet.path }).forEach((image) => {
    const existing = imagesByRow.get(image.rowNumber);

    if (!existing || image.columnIndex > existing.columnIndex) {
      imagesByRow.set(image.rowNumber, image);
    }
  });

  return imagesByRow;
};
