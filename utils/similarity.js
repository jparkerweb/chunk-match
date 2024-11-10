// -----------------------------------------------------
// -- Calculate cosine similarity between two vectors --
// -----------------------------------------------------
function cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
        throw new Error('Vectors must have the same length');
    }

    const dotProduct = vectorA.reduce((acc, val, i) => acc + val * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((acc, val) => acc + val * val, 0));

    return dotProduct / (magnitudeA * magnitudeB);
}

export { cosineSimilarity };
