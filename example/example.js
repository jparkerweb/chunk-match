import { matchChunks } from '../chunk-match.js';
import fs from 'fs';

const textFiles = ['text-1.txt', 'text-2.txt', 'text-3.txt', 'text-4.txt', 'text-5.txt', 'text-6.txt', 'text-7.txt', 'text-8.txt', 'text-9.txt', 'text-10.txt'];
const documents = await Promise.all(textFiles.map(async (textFile) => {
    let text = await fs.promises.readFile(textFile, 'utf8');
    return { document_name: textFile, document_text: text };
}));


const options = {
    maxResults: 15,
    minSimilarity: 0.5,
    chunkingOptions: {
        maxTokenSize: 500,
        similarityThreshold: 0.5,
        dynamicThresholdLowerBound: 0.3,
        dynamicThresholdUpperBound: 0.8,
        numSimilaritySentencesLookahead: 2,
        combineChunks: true,
        combineChunksSimilarityThreshold: 0.5,
        onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
        onnxEmbeddingModelQuantized: true,
        chunkPrefixDocument: "search_document",
        chunkPrefixQuery: "search_query"
    }
};

const results = await matchChunks(documents, 'cosine similarity LLM RAG vector embeddings', options);

console.log(results);
