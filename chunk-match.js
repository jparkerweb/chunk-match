import { chunkit, cramit } from 'semantic-chunking';
import { cosineSimilarity } from './utils/similarity.js';
import { DEFAULT_CONFIG } from './config.js';
// -----------------------------------------------------------------
// -- Match text chunks against a query using semantic similarity --
// -----------------------------------------------------------------
async function matchChunks(documents, query, options = {}) {
    const {
        maxResults = DEFAULT_CONFIG.maxResults,
        minSimilarity = DEFAULT_CONFIG.minSimilarity,
        chunkingOptions = {}
    } = options;

    // Input validation
    if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('Documents array must not be empty');
    }
    if (typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Query must be a non-empty string');
    }

    let {
        maxTokenSize = DEFAULT_CONFIG.maxTokenSize,
        similarityThreshold = DEFAULT_CONFIG.similarityThreshold,
        dynamicThresholdLowerBound = DEFAULT_CONFIG.dynamicThresholdLowerBound,
        dynamicThresholdUpperBound = DEFAULT_CONFIG.dynamicThresholdUpperBound,
        numSimilaritySentencesLookahead = DEFAULT_CONFIG.numSimilaritySentencesLookahead,
        combineChunks = DEFAULT_CONFIG.combineChunks,
        combineChunksSimilarityThreshold = DEFAULT_CONFIG.combineChunksSimilarityThreshold,
        onnxEmbeddingModel = DEFAULT_CONFIG.onnxEmbeddingModel,
        onnxEmbeddingModelQuantized, // legacy boolean (remove in next major version)
        dtype = DEFAULT_CONFIG.dtype,
        localModelPath = DEFAULT_CONFIG.localModelPath,
        modelCacheDir = DEFAULT_CONFIG.modelCacheDir,
        chunkPrefixDocument = DEFAULT_CONFIG.chunkPrefixDocument,
        chunkPrefixQuery = DEFAULT_CONFIG.chunkPrefixQuery
    } = chunkingOptions;

    // if legacy boolean is used (onnxEmbeddingModelQuantized), set dtype (model precision) to 'q8'
    if (onnxEmbeddingModelQuantized === true) { dtype = 'q8'; }

    // Configure chunkit options
    const chunkitOptions = {
        logging: false,
        maxTokenSize,
        similarityThreshold,
        dynamicThresholdLowerBound,
        dynamicThresholdUpperBound,
        numSimilaritySentencesLookahead,
        combineChunks,
        combineChunksSimilarityThreshold,
        onnxEmbeddingModel,
        dtype,
        localModelPath,
        modelCacheDir,
        returnEmbedding: true,
        returnTokenLength: true,
        chunkPrefix: chunkPrefixDocument,
        excludeChunkPrefixInResults: true
    };

    // Configure cramit options
    const cramitOptions = {
        logging: false,
        maxTokenSize,
        onnxEmbeddingModel,
        dtype,
        localModelPath,
        modelCacheDir,
        returnEmbedding: true,
        returnTokenLength: true,
        chunkPrefix: chunkPrefixQuery,
        excludeChunkPrefixInResults: true
    };

    // Process all documents and get chunks with embeddings
    const chunkedDocs = await Promise.all(
        documents.map(async (doc) => {
            const chunks = await chunkit(
                [doc], 
                chunkitOptions
            );
            return chunks.map(chunk => ({
                ...chunk,
                document_name: doc.document_name
            }));
        })
    );

    // Flatten chunks from all documents
    const allChunks = chunkedDocs.flat();

    // Get query embedding
    const queryChunk = await cramit(
        [{ document_name: 'query', document_text: query }],
        cramitOptions
    );
    const queryEmbedding = queryChunk[0].embedding;

    // Calculate similarities and sort results
    const results = allChunks
        .map(chunk => ({
            chunk: chunk.text,
            document_name: chunk.document_name,
            document_id: chunk.document_id,
            chunk_number: chunk.chunk_number,
            token_length: chunk.token_length,
            similarity: cosineSimilarity(chunk.embedding, queryEmbedding)
        }))
        .filter(result => result.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults);

    results.sort((a, b) => {
        if (a.document_id === b.document_id) {
            return a.chunk_number - b.chunk_number;
        }
        return a.document_id - b.document_id;
    });

    return results;
}

export { matchChunks };
