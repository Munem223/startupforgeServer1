export function serializeDocument(document) {
  if (!document) return document;
  return {
    ...document,
    _id: document._id?.toString?.() ?? document._id
  };
}

export function serializeDocuments(documents) {
  return documents.map(serializeDocument);
}
