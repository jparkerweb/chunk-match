import { chunkit, cramit } from 'semantic-chunking';
import { cosineSimilarity } from './utils/similarity.js';

// -----------------------------------------------------------------
// -- Match text chunks against a query using semantic similarity --
// -----------------------------------------------------------------
async function matchChunks(documents, query, options = {}) {
    const {
        maxResults = 10,
        minSimilarity = 0.475,
        chunkingOptions = {}
    } = options;

    // Input validation
    if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('Documents array must not be empty');
    }
    if (typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Query must be a non-empty string');
    }

    const {
        maxTokenSize,
        similarityThreshold,
        dynamicThresholdLowerBound,
        dynamicThresholdUpperBound,
        numSimilaritySentencesLookahead,
        combineChunks,
        combineChunksSimilarityThreshold,
        onnxEmbeddingModel,
        onnxEmbeddingModelQuantized,
        chunkPrefixDocument,
        chunkPrefixQuery
    } = chunkingOptions;

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
        onnxEmbeddingModelQuantized,
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
        onnxEmbeddingModelQuantized,
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
