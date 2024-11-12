// import form default values
import defaultFormValues from './default-form-values.js';

// Load sample text on page load
fetch('sample.txt')
    .then(response => response.text())
    .then(text => {
        // Find the first document's textarea
        const firstDocTextarea = document.querySelector('.document-entry textarea[name="documentText"]');
        if (firstDocTextarea) {
            firstDocTextarea.value = text;
        }
    })
    .catch(error => console.error('Error loading sample text:', error));

// Load and populate model options
fetch('models.json')
    .then(response => response.json())
    .then(data => {
        const select = document.getElementById('onnxEmbeddingModel');
        data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.label;
            select.appendChild(option);
        });
        
        // Set default model value after options are populated
        select.value = defaultFormValues.onnxEmbeddingModel;
    })
    .catch(error => console.error('Error loading models:', error));

// Update range input displays
document.querySelectorAll('input[type="range"]').forEach(input => {
    const display = input.nextElementSibling;
    
    // Create inner elements if they don't exist
    if (!display.querySelector('.number')) {
        const number = document.createElement('span');
        number.className = 'number';
        const description = document.createElement('span');
        description.className = 'description';
        display.appendChild(number);
        display.appendChild(description);
    }

    // Update similarity display
    function updateSimilarityDisplay(value) {
        const number = display.querySelector('.number');
        const description = display.querySelector('.description');
        
        // Only update similarity descriptions for relevant sliders
        const similaritySliders = [
            'similarityThreshold',
            'combineChunksSimilarityThreshold',
            'dynamicThresholdLowerBound',
            'dynamicThresholdUpperBound',
            'minSimilarity'
        ];
        
        if (similaritySliders.includes(input.id)) {
            const val = parseFloat(value);
            let className, text;
            
            if (val < 0.5) {
                className = 'similarity-low';
                text = 'low similarity';
            } else if (val <= 0.7) {
                className = 'similarity-moderate';
                text = 'moderately similar';
            } else {
                className = 'similarity-high';
                text = 'very similar';
            }
            
            number.className = 'number ' + className;
            number.textContent = val.toFixed(3);
            description.className = 'description ' + className;
            description.textContent = text;
        } else {
            number.textContent = value;
            description.textContent = '';
        }
    }

    // Initial update
    updateSimilarityDisplay(input.value);

    // Update on change
    input.addEventListener('input', (e) => updateSimilarityDisplay(e.target.value));
});

const combineChunksToggle = document.getElementById('combineChunks');
const dependentControls = document.querySelectorAll('.depends-on-combine-chunks');

// Update dependent controls
function updateDependentControls() {
    const isEnabled = combineChunksToggle.checked;
    dependentControls.forEach(control => {
        if (isEnabled) {
            // Show controls
            control.style.display = 'block';
            // Use setTimeout to ensure display: block takes effect first
            setTimeout(() => {
                control.classList.remove('hidden');
                const inputs = control.querySelectorAll('input');
                inputs.forEach(input => input.disabled = false);
            }, 10);
        } else {
            // Hide controls
            control.classList.add('hidden');
            const inputs = control.querySelectorAll('input');
            inputs.forEach(input => input.disabled = true);
            // Remove display: none after transition completes
            control.addEventListener('transitionend', function handler() {
                if (!combineChunksToggle.checked) {
                    control.style.display = 'none';
                }
                control.removeEventListener('transitionend', handler);
            });
        }
    });
}

// Initial state
updateDependentControls();

// Listen for changes
combineChunksToggle.addEventListener('change', updateDependentControls);

// Form submission handler
const form = document.getElementById('chunkForm');
const resultsContainer = document.getElementById('results');
const resultsJson = document.getElementById('resultsJson');
const downloadButton = document.getElementById('downloadButton');
const resultsFooter = document.querySelector('.results-footer');

// Clear results and hide download button initially
resultsJson.textContent = '';
resultsFooter.classList.remove('visible');

// Add spinner element reference
const spinner = document.createElement('div');
spinner.className = 'spinner';
resultsJson.parentNode.insertBefore(spinner, resultsJson);

// Add this function near the top of the file
function scrollToResults() {
    if (window.innerWidth <= 800) {
        const resultsWrapper = document.querySelector('.results-wrapper');
        if (resultsWrapper) {
            resultsWrapper.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Add document handling
const documentsContainer = document.getElementById('documents-container');
const addDocumentButton = document.getElementById('addDocument');

addDocumentButton.addEventListener('click', () => {
    const newDoc = document.createElement('div');
    newDoc.className = 'document-entry';
    newDoc.innerHTML = `
        <div class="form-group document-name-group">
            <label for="documentName">Document Name:</label>
            <div class="input-with-buttons">
                <input type="text" name="documentName" required>
                <button type="button" class="remove-document secondary-button">Remove</button>
            </div>
        </div>
        <div class="form-group">
            <label for="documentText">Document Text:</label>
            <textarea name="documentText" required></textarea>
        </div>
    `;
    documentsContainer.appendChild(newDoc);
});

documentsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-document')) {
        e.target.closest('.document-entry').remove();
    }
});

// Update form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const downloadButton = document.getElementById('downloadButton');
    const defaultMessage = document.getElementById('defaultMessage');
    
    try {
        submitButton.disabled = true;
        downloadButton.disabled = true;
        spinner.classList.add('visible');
        resultsJson.style.display = 'none';
        defaultMessage.style.display = 'none';
        
        // Scroll to results immediately when we show the spinner
        scrollToResults();

        // Collect documents
        const documents = [];
        const documentEntries = documentsContainer.querySelectorAll('.document-entry');
        documentEntries.forEach(entry => {
            documents.push({
                document_name: entry.querySelector('[name="documentName"]').value,
                document_text: entry.querySelector('[name="documentText"]').value
            });
        });

        // Get form data
        const formData = new FormData(form);
        const data = {
            documents,
            query: formData.get('query'),
            maxResults: formData.get('maxResults'),
            minSimilarity: formData.get('minSimilarity'),
            chunkingOptions: {
                maxTokenSize: formData.get('maxTokenSize'),
                similarityThreshold: formData.get('similarityThreshold'),
                dynamicThresholdLowerBound: formData.get('dynamicThresholdLowerBound'),
                dynamicThresholdUpperBound: formData.get('dynamicThresholdUpperBound'),
                numSimilaritySentencesLookahead: formData.get('numSimilaritySentencesLookahead'),
                combineChunks: form.elements['combineChunks'].checked,
                combineChunksSimilarityThreshold: formData.get('combineChunksSimilarityThreshold'),
                onnxEmbeddingModel: formData.get('onnxEmbeddingModel'),
                dtype: formData.get('dtype'),
                chunkPrefixDocument: formData.get('chunkPrefixDocument') || undefined,
                chunkPrefixQuery: formData.get('chunkPrefixQuery') || undefined
            }
        };
        
        const startTime = performance.now();
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || 'Failed to process match');
        }
        
        // Display results
        const result = await response.json();
        const endTime = performance.now();
        const processingTime = ((endTime - startTime) / 1000).toFixed(2);
        
        // Update display code...
        spinner.classList.remove('visible');
        defaultMessage.style.display = 'none';
        resultsJson.style.display = 'block';

        const codeElement = document.createElement('code');
        codeElement.className = 'language-json';
        const formattedJson = JSON.stringify(result, null, 2);
        codeElement.textContent = formattedJson;
        
        resultsJson.textContent = '';
        resultsJson.appendChild(codeElement);
        hljs.highlightElement(codeElement);
        
        // Update stats
        document.getElementById('processingTime').textContent = `Total Time: ${processingTime}s`;
        document.getElementById('chunkCount').textContent = `Matches: ${result.length}`;

        // Calculate and display average token length if available
        if (result.length > 0 && result[0].token_length !== undefined) {
            const avgTokens = Math.round(
                result.reduce((sum, chunk) => sum + chunk.token_length, 0) / result.length
            );
            document.getElementById('avgTokenLength').textContent = `Avg Tokens: ${avgTokens}`;
        } else {
            document.getElementById('avgTokenLength').textContent = '';
        }

        downloadButton.disabled = false;
        scrollToResults();
        
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message);
        downloadButton.disabled = true;
        spinner.classList.remove('visible');
        resultsJson.style.display = 'block';
    } finally {
        submitButton.disabled = false;
    }
});

// Initialize download button as disabled
document.getElementById('downloadButton').disabled = true;

// Document buttons handler
document.querySelectorAll('.document-buttons button').forEach(button => {
    button.addEventListener('click', async () => {
        const fileType = button.dataset.file;
        const fileName = `${fileType}.txt`;
        const documentEntry = button.closest('.document-entry');
        
        try {
            const response = await fetch(fileName);
            if (!response.ok) throw new Error(`Failed to load ${fileName}`);
            
            const text = await response.text();
            const textArea = documentEntry.querySelector('textarea[name="documentText"]');
            const nameInput = documentEntry.querySelector('input[name="documentName"]');
            
            if (textArea) textArea.value = text;
            if (nameInput) nameInput.value = `${fileType} text`;
        } catch (error) {
            console.error('Error loading text file:', error);
            showToast(`Failed to load ${fileName}`);
        }
    });
});

const modal = document.getElementById('codeModal');
const getCodeBtn = document.getElementById('getCodeButton');
const closeBtn = document.querySelector('.close');
const copyBtn = document.getElementById('copyCode');
const codeExample = document.querySelector('#codeExample code');

// Get Code button handler
getCodeBtn.onclick = () => {
    // Get all form data and properly handle checkbox values
    const formData = {};
    const formElements = form.elements;
    
    for (let element of formElements) {
        if (element.type === 'checkbox') {
            formData[element.name] = element.checked;
        } else if (element.name) {
            formData[element.name] = element.value;
        }
    }
    
    codeExample.textContent = generateCode(formData);
    modal.style.display = "block";
    document.body.style.overflow = 'hidden';  // Prevent body scrolling
    delete codeExample.dataset.highlighted;
    hljs.highlightElement(codeExample);
};

// Generate Code function
function generateCode(formData) {
    // Collect documents data
    const documents = Array.from(documentsContainer.querySelectorAll('.document-entry')).map(entry => ({
        document_name: entry.querySelector('[name="documentName"]').value,
        document_text: entry.querySelector('[name="documentText"]').value
    }));

    // Format documents array for display
    const documentsStr = documents.map(doc => 
        `    {
        document_name: "${doc.document_name}",
        document_text: "${doc.document_text.substring(0, 50)}..."
    }`).join(',\n');

    // Map dtype value to string
    const dtypeValues = ['fp32', 'fp16', 'q8', 'q4'];
    const dtype = dtypeValues[parseInt(formData.dtype)] || 'fp32';

    return `// import the chunk-match library
import { matchChunks } from 'chunk-match';

// define the documents array
const documents = [
${documentsStr}
];

// define your search query
const query = "${formData.query}";

// define your options
const options = {
    maxResults: ${formData.maxResults},
    minSimilarity: ${formData.minSimilarity},
    chunkingOptions: {
        maxTokenSize: ${formData.maxTokenSize},
        similarityThreshold: ${formData.similarityThreshold},
        dynamicThresholdLowerBound: ${formData.dynamicThresholdLowerBound},
        dynamicThresholdUpperBound: ${formData.dynamicThresholdUpperBound},
        numSimilaritySentencesLookahead: ${formData.numSimilaritySentencesLookahead},
        combineChunks: ${formData.combineChunks},
        combineChunksSimilarityThreshold: ${formData.combineChunksSimilarityThreshold},
        onnxEmbeddingModel: "${formData.onnxEmbeddingModel}",
        dtype: "${dtype}"${formData.chunkPrefixDocument ? `,
        chunkPrefixDocument: "${formData.chunkPrefixDocument}"` : ''}${formData.chunkPrefixQuery ? `,
        chunkPrefixQuery: "${formData.chunkPrefixQuery}"` : ''}
    }
};

// call the matchChunks function
const results = await matchChunks(documents, query, options);

// results will contain matched chunks with similarity scores
console.log(results);`;
}

// Close Modal button handler
closeBtn.onclick = () => {
    modal.style.display = "none";
    document.body.style.overflow = '';  // Restore body scrolling
};

// Close Modal on click outside
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = '';  // Restore body scrolling
    }
};

// Copy Code button handler
copyBtn.onclick = () => {
    navigator.clipboard.writeText(codeExample.textContent)
        .then(() => {
            copyBtn.textContent = "Copied!";
            showToast('Code copied to clipboard!', 'success');
            setTimeout(() => {
                copyBtn.textContent = "Copy Code";
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            showToast('Failed to copy code to clipboard');
        });
};

// Close Modal button handler
const closeModalBtn = document.getElementById('closeModal');
closeModalBtn.onclick = () => {
    modal.style.display = "none";
    document.body.style.overflow = '';  // Restore body scrolling
};

// Toast functionality
function showToast(message, type = 'error', duration = 7000) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;

    // Clear any existing toasts
    toastContainer.innerHTML = '';
    toastContainer.classList.add('visible');
    toastContainer.appendChild(toast);

    // Function to dismiss toast
    function dismissToast() {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            toastContainer.classList.remove('visible');
            toastContainer.innerHTML = '';
        }, 300);
    }

    // Add click handlers
    toastContainer.onclick = dismissToast;
    toast.onclick = (e) => {
        e.stopPropagation(); // Prevent double-firing with container click
        dismissToast();
    };

    // Auto dismiss after duration
    const timeoutId = setTimeout(dismissToast, duration);

    // Clear timeout if manually dismissed
    toastContainer.addEventListener('click', () => {
        clearTimeout(timeoutId);
    }, { once: true });
}

// Add this with your other event listeners
document.querySelector('.info-icon').addEventListener('click', () => {
    showToast('More model choices can be added by updating the "models.json" file in the "webui" directory.', 'info', 7000);
});

// Add after other initialization code
const resultsContent = document.querySelector('.results-content');

// Create and add the resize toggle button
const processingTimeSpan = document.getElementById('processingTime');

// Create and add the resize toggle button
const resizeToggle = document.createElement('button');
resizeToggle.className = 'resize-toggle';
resizeToggle.innerHTML = `
    <svg viewBox="0 0 24 24">
        <path d="M17 8.5L20 11.5L17 14.5M7 8.5L4 11.5L7 14.5M5.5 11.5H18.5" 
              stroke="white" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
              fill="none"/>
    </svg>
`;
resizeToggle.title = "Toggle text wrapping";
processingTimeSpan.parentNode.insertBefore(resizeToggle, processingTimeSpan.nextSibling);

// Add click handler
resizeToggle.addEventListener('click', () => {
    resultsJson.classList.toggle('wrapped');
    resizeToggle.classList.toggle('wrapped');
});


const dtypeInput = document.getElementById('dtype');
const dtypeDisplay = dtypeInput.nextElementSibling;

function updateDtypeDisplay(value) {
    const dtypeValues = {
        0: { text: 'fp32 - Full Precision', class: 'precision-full' },
        1: { text: 'fp16 - Half Precision', class: 'precision-half' },
        2: { text: 'q8 - 8-bit Quantized', class: 'precision-q8' },
        3: { text: 'q4 - 4-bit Quantized', class: 'precision-q4' }
    };
    
    const dtype = dtypeValues[value];
    const number = dtypeDisplay.querySelector('.number');
    const description = dtypeDisplay.querySelector('.description');
    
    number.className = `number ${dtype.class}`;
    number.textContent = value;
    description.className = `description ${dtype.class}`;
    description.textContent = dtype.text;
}

// Initial update
updateDtypeDisplay(dtypeInput.value);

// Update on change
dtypeInput.addEventListener('input', (e) => updateDtypeDisplay(e.target.value));

// Fetch and display version
fetch('/version')
    .then(response => response.json())
    .then(data => {
        document.getElementById('version').textContent = `v${data.version}`;
    })
    .catch(error => console.error('Error fetching version:', error));

// Add this function after the imports
function setDefaultFormValues() {
    // Set range inputs
    const rangeInputs = {
        maxResults: defaultFormValues.maxResults,
        minSimilarity: defaultFormValues.minSimilarity,
        maxTokenSize: defaultFormValues.maxTokenSize,
        similarityThreshold: defaultFormValues.similarityThreshold,
        dynamicThresholdLowerBound: defaultFormValues.dynamicThresholdLowerBound,
        dynamicThresholdUpperBound: defaultFormValues.dynamicThresholdUpperBound,
        numSimilaritySentencesLookahead: defaultFormValues.numSimilaritySentencesLookahead,
        combineChunksSimilarityThreshold: defaultFormValues.combineChunksSimilarityThreshold,
    };

    // Set each range input and trigger their display updates
    Object.entries(rangeInputs).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event('input'));
        }
    });

    // Set checkbox
    const combineChunksCheckbox = document.getElementById('combineChunks');
    if (combineChunksCheckbox) {
        combineChunksCheckbox.checked = defaultFormValues.combineChunks;
        combineChunksCheckbox.dispatchEvent(new Event('change'));
    }

    // Set text inputs
    const textInputs = {
        chunkPrefixDocument: defaultFormValues.chunkPrefixDocument,
        chunkPrefixQuery: defaultFormValues.chunkPrefixQuery
    };

    Object.entries(textInputs).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input && value !== null) {
            input.value = value;
        }
    });

    // Set dtype (model precision)
    const dtypeInput = document.getElementById('dtype');
    if (dtypeInput) {
        const dtypeValues = { fp32: 0, fp16: 1, q8: 2, q4: 3 };
        dtypeInput.value = dtypeValues[defaultFormValues.dtype] || 0;
        dtypeInput.dispatchEvent(new Event('input'));
    }
}

setDefaultFormValues();