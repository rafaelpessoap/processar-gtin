const fs = require('fs');
const path = require('path');

const ARQUIVOS_DIR = path.join(__dirname, 'arquivos');
const OUTPUT_FILE = path.join(__dirname, 'produtos_com_gtin.csv');

// Helper to parse a CSV line handling quotes
function parseCSVLine(text) {
    const result = [];
    let cell = '';
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (insideQuote && nextChar === '"') {
                // Escaped quote
                cell += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                insideQuote = !insideQuote;
            }
        } else if (char === ',' && !insideQuote) {
            // End of cell
            result.push(cell);
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell);
    return result;
}

// Helper to safely read file lines handling different line endings
function readFileLines(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Normalize line endings and split
    // We need to be careful about newlines inside quotes.
    // A simple split by \n might break if there are newlines in descriptions.
    // For this specific task, let's assume standard CSV where records are on new lines.
    // If we encounter issues, we might need a more complex parser.
    // Given the previous file view, descriptions seemed to have HTML which might contain newlines?
    // Let's check the file content again mentally... yes, there were HTML tags.
    // The previous view showed lines starting with line numbers, which suggests the file view tool handled newlines.
    // However, a robust CSV parser should handle newlines in quotes.
    
    // Let's implement a character-by-character parser for the whole file to be safe.
    return content; 
}

function parseCSV(content) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuote = false;
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (insideQuote && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                insideQuote = !insideQuote;
            }
        } else if (char === ',' && !insideQuote) {
            currentRow.push(currentCell);
            currentCell = '';
        } else if ((char === '\r' || char === '\n') && !insideQuote) {
            // Handle line breaks
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            currentRow.push(currentCell);
            if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
                 rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    // Push last row if exists
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }
    
    return rows;
}

function main() {
    console.log('Iniciando processamento...');
    
    if (!fs.existsSync(ARQUIVOS_DIR)) {
        console.error(`Diretório não encontrado: ${ARQUIVOS_DIR}`);
        return;
    }

    const files = fs.readdirSync(ARQUIVOS_DIR).filter(f => f.toLowerCase().endsWith('.csv'));
    console.log(`Encontrados ${files.length} arquivos CSV.`);

    const allProducts = [];
    let filesProcessed = 0;

    files.forEach(file => {
        const filePath = path.join(ARQUIVOS_DIR, file);
        console.log(`Lendo arquivo: ${file}`);
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const rows = parseCSV(content);

            if (rows.length === 0) return;

            // Find headers
            const header = rows[0];
            const idxSku = header.indexOf('Código (SKU)');
            const idxDesc = header.indexOf('Descrição');
            const idxGtin = header.indexOf('GTIN/EAN');

            if (idxSku === -1 || idxDesc === -1 || idxGtin === -1) {
                console.warn(`  [AVISO] Arquivo ${file} ignorado: colunas obrigatórias não encontradas.`);
                return;
            }

            // Process rows
            let countInFile = 0;
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                // Ensure row has enough columns
                if (row.length <= Math.max(idxSku, idxDesc, idxGtin)) continue;

                const gtin = row[idxGtin].trim();
                
                if (gtin) {
                    allProducts.push({
                        sku: row[idxSku],
                        descricao: row[idxDesc],
                        gtin: gtin
                    });
                    countInFile++;
                }
            }
            console.log(`  -> ${countInFile} produtos com GTIN encontrados.`);
            filesProcessed++;
        } catch (err) {
            console.error(`  [ERRO] Falha ao processar ${file}:`, err.message);
        }
    });

    console.log(`\nTotal de produtos encontrados: ${allProducts.length}`);

    // Generate Output CSV
    // Header
    let csvContent = '"Código (SKU)","Descrição","GTIN/EAN"\n';
    
    allProducts.forEach(p => {
        // Escape quotes in content if necessary (though we just read them, let's be safe)
        const sku = p.sku.replace(/"/g, '""');
        const desc = p.descricao.replace(/"/g, '""');
        const gtin = p.gtin.replace(/"/g, '""');
        
        csvContent += `"${sku}","${desc}","${gtin}"\n`;
    });

    fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf8');
    console.log(`Arquivo gerado com sucesso: ${OUTPUT_FILE}`);
}

main();
