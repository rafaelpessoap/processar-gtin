# Processador de GTIN

Este projeto contém um script em Node.js para extrair informações de produtos (SKU, Descrição e GTIN/EAN) de arquivos CSV.

## Funcionalidade

O script `processar-gtin.js` varre a pasta `arquivos`, lê todos os arquivos `.csv` encontrados e gera um arquivo consolidado chamado `produtos_com_gtin.csv` contendo apenas os produtos que possuem o campo "GTIN/EAN" preenchido.

## Como Usar

1.  Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2.  Coloque seus arquivos CSV na pasta `arquivos` dentro do diretório do projeto.
3.  Abra o terminal na pasta do projeto.
4.  Execute o comando:

    ```bash
    node processar-gtin.js
    ```

5.  O arquivo `produtos_com_gtin.csv` será gerado na raiz do projeto.

## Estrutura do Projeto

-   `processar-gtin.js`: O script principal.
-   `arquivos/`: Pasta onde devem ficar os arquivos CSV de entrada (ignorada pelo Git).
-   `produtos_com_gtin.csv`: Arquivo de saída gerado (ignorado pelo Git).
