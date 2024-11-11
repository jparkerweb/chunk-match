import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { matchChunks } from '../chunk-match.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve node_modules directory (only for highlight.js)
app.use('/node_modules/highlight.js', express.static(
  path.join(__dirname, 'node_modules/highlight.js')
));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Chunking API endpoint
app.post('/api/match', async (req, res) => {
    try {
        const { documents, query, maxResults, minSimilarity, chunkingOptions } = req.body;

        // Input validation
        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return res.status(400).json({ error: 'Documents array is required' });
        }
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Process options
        const processedOptions = {
            maxResults: parseInt(maxResults),
            minSimilarity: parseFloat(minSimilarity),
            chunkingOptions: {
                ...chunkingOptions,
                maxTokenSize: parseInt(chunkingOptions.maxTokenSize),
                similarityThreshold: parseFloat(chunkingOptions.similarityThreshold),
                dynamicThresholdLowerBound: parseFloat(chunkingOptions.dynamicThresholdLowerBound),
                dynamicThresholdUpperBound: parseFloat(chunkingOptions.dynamicThresholdUpperBound),
                numSimilaritySentencesLookahead: parseInt(chunkingOptions.numSimilaritySentencesLookahead),
                combineChunks: chunkingOptions.combineChunks === true,
                combineChunksSimilarityThreshold: parseFloat(chunkingOptions.combineChunksSimilarityThreshold),
                onnxEmbeddingModelQuantized: chunkingOptions.onnxEmbeddingModelQuantized === true
            }
        };

        const results = await matchChunks(documents, query, processedOptions);
        res.json(results);
    } catch (error) {
        console.error('Error processing match:', error);
        res.status(500).json({ 
            error: 'Error processing match',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something broke!',
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
