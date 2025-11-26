const fs = require('fs');
const path = require('path');

const ARQUIVOS_DIR = path.join(__dirname, 'arquivos');
const OUTPUT_FILE = path.join(__dirname, 'produtos_com_gtin.csv');

// Função auxiliar para analisar uma linha CSV lidando com aspas
function parseCSVLine(text) {
    const result = [];
    let cell = '';
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (insideQuote && nextChar === '"') {
                // Aspas escapadas
                cell += '"';
                i++; // Pular a próxima aspa
            } else {
                // Alternar estado das aspas
                insideQuote = !insideQuote;
            }
        } else if (char === ',' && !insideQuote) {
            // Fim da célula
            result.push(cell);
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell);
    return result;
}

// Função auxiliar para ler linhas de arquivo com segurança, lidando com diferentes quebras de linha
function readFileLines(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Normalizar quebras de linha e dividir
    // Precisamos ter cuidado com quebras de linha dentro de aspas.
    // Uma simples divisão por \n pode quebrar se houver quebras de linha nas descrições.
    // Para esta tarefa específica, vamos assumir CSV padrão onde os registros estão em novas linhas.
    // Se encontrarmos problemas, podemos precisar de um analisador mais complexo.
    // Dado a visualização anterior do arquivo, as descrições pareciam ter HTML que pode conter quebras de linha.
    // Vamos verificar o conteúdo do arquivo novamente mentalmente... sim, havia tags HTML.
    // A visualização anterior mostrou linhas começando com números de linha, o que sugere que a ferramenta de visualização lidou com as quebras de linha.
    // No entanto, um analisador CSV robusto deve lidar com quebras de linha entre aspas.

    // Vamos implementar um analisador caractere por caractere para o arquivo inteiro para ser seguro.
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
            // Lidar com quebras de linha
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
    // Adicionar última linha se existir
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

            // Encontrar cabeçalhos
            const header = rows[0];
            const idxSku = header.indexOf('Código (SKU)');
            const idxDesc = header.indexOf('Descrição');
            const idxGtin = header.indexOf('GTIN/EAN');

            if (idxSku === -1 || idxDesc === -1 || idxGtin === -1) {
                console.warn(`  [AVISO] Arquivo ${file} ignorado: colunas obrigatórias não encontradas.`);
                return;
            }

            // Processar linhas
            let countInFile = 0;
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                // Garantir que a linha tenha colunas suficientes
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

    // Gerar CSV de saída
    // Cabeçalho
    let csvContent = '"Código (SKU)","Descrição","GTIN/EAN"\n';

    allProducts.forEach(p => {
        // Escapar aspas no conteúdo se necessário (embora acabamos de lê-las, vamos ser seguros)
        const sku = p.sku.replace(/"/g, '""');
        const desc = p.descricao.replace(/"/g, '""');
        const gtin = p.gtin.replace(/"/g, '""');

        csvContent += `"${sku}","${desc}","${gtin}"\n`;
    });

    fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf8');
    console.log(`Arquivo gerado com sucesso: ${OUTPUT_FILE}`);
}

main();
