# 🕵️‍♂️ chunk-match

A NodeJS library that semantically chunks text and matches it against a user query using cosine similarity for precise and relevant text retrieval.

## Installation

```bash
npm install chunk-match
```

## Features

- Semantic text chunking with configurable options
- Query matching using cosine similarity
- Configurable similarity thresholds and chunk sizes
- Returns chunks sorted by relevance with similarity scores
- Built on top of semantic-chunking for robust text processing
- Support for various ONNX embedding models

## Usage

```javascript
import { matchChunks } from 'chunk-match';

const documents = [
    {
        document_name: "doc1.txt",
        document_text: "Your document text here..."
    },
    {
        document_name: "doc2.txt",
        document_text: "Another document text..."
    }
];

const query = "What are the key points?";

const options = {
    maxResults: 5,
    minSimilarity: 0.5,
    chunkingOptions: {
        maxTokenSize: 500,
        similarityThreshold: 0.5,
        dynamicThresholdLowerBound: 0.4,
        dynamicThresholdUpperBound: 0.8,
        numSimilaritySentencesLookahead: 3,
        combineChunks: true,
        combineChunksSimilarityThreshold: 0.8,
        onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
        onnxEmbeddingModelQuantized: true,
        chunkPrefixDocument: "search_document",
        chunkPrefixQuery: "search_query"
    }
};

const results = await matchChunks(documents, query, options);
console.log(results);
```

## API

### matchChunks(documents, query, options)

#### Parameters

- `documents` **required** (Array): Array of document objects with properties:
  - `document_name` (string): Name/identifier of the document
  - `document_text` (string): Text content to be chunked and matched

- `query` **required** (string): The search query to match against documents

- `options` **optional** (Object): Configuration options
  - `maxResults` (number): Maximum number of results to return (default: 10)
  - `minSimilarity` (number): Minimum similarity threshold for matches (default: 0.475)
  - `chunkingOptions` (Object): Options for text chunking
    - `maxTokenSize` (number): Maximum token size for chunks (default: 500)
    - `similarityThreshold` (number): Threshold for semantic similarity (default: 0.5)
    - `dynamicThresholdLowerBound` (number): Lower bound for dynamic thresholding (default: 0.475)
    - `dynamicThresholdUpperBound` (number): Upper bound for dynamic thresholding (default: 0.8)
    - `numSimilaritySentencesLookahead` (number): Number of sentences to look ahead (default: 2)
    - `combineChunks` (boolean): Whether to combine similar chunks (default: true)
    - `combineChunksSimilarityThreshold` (number): Threshold for combining chunks (default: 0.6)
    - `onnxEmbeddingModel` (string): ONNX model to use for embeddings (see Models section below) (default: `Xenova/all-MiniLM-L6-v2`)
    - `onnxEmbeddingModelQuantized` (boolean): Use quantized model version for better performance (default: `true`)
    - `chunkPrefixDocument` (string): Prefix for document chunks (for embedding models that support task prefixes) (default: null)
    - `chunkPrefixQuery` (string): Prefix for query chunk (for embedding models that support task prefixes) (default: null)

#### Note on Model Loading

The first time you use a specific embedding model, it will take longer to process as the model needs to be downloaded and cached locally. Subsequent uses will be much faster since the cached model will be used.

#### Returns

Array of match results, each containing:
- `chunk` (string): The matched text chunk
- `document_name` (string): Source document name
- `document_id` (number): Document identifier
- `chunk_number` (number): Chunk sequence number
- `token_length` (number): Length in tokens
- `similarity` (number): Similarity score (0-1)

## Embedding Models

This library supports various ONNX embedding models through the `semantic-chunking` package.
Most models have a quantized version available (set `onnxEmbeddingModelQuantized: true`), which offers better performance with minimal impact on accuracy.

For a complete list of supported models and their characteristics, see the [semantic-chunking embedding models documentation](https://github.com/jparkerweb/semantic-chunking/tree/main?tab=readme-ov-file#onnxembeddingmodel).

### `onnxEmbeddingModel`

- **Type**: String
- **Default**: `Xenova/all-MiniLM-L6-v2`
- **Description**: Specifies the model used to generate sentence embeddings. Different models may yield different qualities of embeddings, affecting the chunking quality, especially in multilingual contexts.
- **Resource Link**: [ONNX Embedding Models](https://huggingface.co/models?pipeline_tag=feature-extraction&library=onnx&sort=trending)  
  Link to a filtered list of embedding models converted to ONNX library format by Xenova.  
  Refer to the Model table below for a list of suggested models and their sizes (choose a multilingual model if you need to chunk text other than English).  

### `onnxEmbeddingModelQuantized`

- **Type**: Boolean
- **Default**: `true`
- **Description**: Indicates whether to use a quantized version of the specified model. Quantized models generally offer faster performance with a slight trade-off in accuracy, which can be beneficial when processing very large datasets.


#### Curated ONNX Embedding Models

| Model                                        | Quantized | Link                                                                                                                                       | Size    |
| -------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| nomic-ai/nomic-embed-text-v1.5               | true      | [https://huggingface.co/nomic-ai/nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)                             | 138 MB  |
| nomic-ai/nomic-embed-text-v1.5               | false     | [https://huggingface.co/nomic-ai/nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)                             | 548 MB  |
| Xenova/all-MiniLM-L6-v2                      | true      | [https://huggingface.co/Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2)                                           | 23 MB   |
| Xenova/all-MiniLM-L6-v2                      | false     | [https://huggingface.co/Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2)                                           | 90.4 MB |
| Xenova/paraphrase-multilingual-MiniLM-L12-v2 | true      | [https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2) | 118 MB  |
| thenlper/gte-base                            | false     | [https://huggingface.co/thenlper/gte-base](https://huggingface.co/thenlper/gte-base)                                                       | 436 MB  |
| Xenova/all-distilroberta-v1                  | true      | [https://huggingface.co/Xenova/all-distilroberta-v1](https://huggingface.co/Xenova/all-distilroberta-v1)                                   | 82.1 MB |
| Xenova/all-distilroberta-v1                  | false     | [https://huggingface.co/Xenova/all-distilroberta-v1](https://huggingface.co/Xenova/all-distilroberta-v1)                                   | 326 MB  |
| BAAI/bge-base-en-v1.5                        | false     | [https://huggingface.co/BAAI/bge-base-en-v1.5](https://huggingface.co/BAAI/bge-base-en-v1.5)                                               | 436 MB  |
| BAAI/bge-small-en-v1.5                       | false     | [https://huggingface.co/BAAI/bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5)                                             | 133 MB  |

Each of these parameters allows you to customize the `chunkit` function to better fit the text size, content complexity, and performance requirements of your application.


## Web UI

Checkout the `webui` folder for a web-based interface for experimenting with and tuning Chunk Match settings. This tool provides a visual way to test and configure the `chunk-match` library's semantic text matching capabilities to get optimal results for your specific use case. Once you've found the best settings, you can generate code to implement them in your project.

![chunk-match_web-ui](/img/chunk-match_web-ui.gif)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Appreciation

If you enjoy this library please consider sending me a tip to support my work 😀
# [🍵 tip me here](https://ko-fi.com/jparkerweb)
