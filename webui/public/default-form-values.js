const defaultFormValues = {
    maxResults: 10,
    minSimilarity: 0.475,
    maxTokenSize: 500,
    similarityThreshold: 0.5,
    dynamicThresholdLowerBound: 0.4,
    dynamicThresholdUpperBound: 0.8,
    numSimilaritySentencesLookahead: 3,
    combineChunks: true,
    combineChunksSimilarityThreshold: 0.5,
    onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
    dtype: "q8",
    localModelPath: "./models",
    modelCacheDir: "./models",
    chunkPrefixDocument: null,
    chunkPrefixQuery: null
};

export default defaultFormValues;
