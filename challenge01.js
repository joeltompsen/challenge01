const fs = require('fs');

// Mapeamento de unidades de medida
const sizeMapping = {
  "quilo": "kg",
  "quilos": "kg",
  "litro": "L",
  "litros": "L",
  "grama": "g",
  "gramas": "g",
  "mililitro": "ml",
  "mililitros": "ml"
};

// Função para normalizar o título e aplicar o mapeamento de unidades
const normalizeTitle = (title) => {
  // Remover acentos
  title = title.normalize('NFD').replace(/[\u0300-\u036f]/g, "");  // Remover acentos

  // Substituir unidades de medida conforme o mapeamento
  Object.keys(sizeMapping).forEach(unit => {
    const regex = new RegExp(`\\b${unit}\\b`, 'gi');  // Usar expressão regular para substituir as unidades
    title = title.replace(regex, sizeMapping[unit]);
  });

  // Convertendo 1000ml para 1L e 1000g para 1kg
  title = title.replace(/(\d+)\s*(ml|g)\b/g, (match, number, unit) => {
    if (unit === 'ml' && number >= 1000) {
      return `${number / 1000}L`;  // Convertendo ml para L
    }
    if (unit === 'g' && number >= 1000) {
      return `${number / 1000}kg`;  // Convertendo g para kg
    }
    return match;  // Caso não seja 1000ml ou 1000g, deixa como está
  });

  // Remover hífens e caracteres especiais
  title = title.replace(/[^a-zA-Z0-9\s]/g, '');  // Remover caracteres especiais, incluindo hífens

  // Normalizar o título (remover múltiplos espaços, converter para minúsculas, etc.)
  return title
    .toLowerCase()
    .replace(/\s+/g, ' ')  // Remover espaços extras
    .trim();
};

// Função para comparar e agrupar os produtos
const compareProducts = (products) => {
  // Função para verificar se dois títulos são semelhantes (ignorando a ordem das palavras)
  const areTitlesEqual = (title1, title2) => {
    // Normalizar os títulos
    const normalizedTitle1 = normalizeTitle(title1);
    const normalizedTitle2 = normalizeTitle(title2);

    // Dividir as palavras dos títulos e ordenar
    const words1 = normalizedTitle1.split(' ').sort().join(' ');
    const words2 = normalizedTitle2.split(' ').sort().join(' ');

    // Comparar as palavras ordenadas
    return words1 === words2;
  };

  // Agrupar produtos pela categoria (baseado no título normalizado)
  const groupedProducts = products.reduce((acc, product) => {
    // Tentar encontrar um produto já existente no grupo
    let foundGroup = false;

    for (let key in acc) {
      if (areTitlesEqual(acc[key].category, product.title)) {
        acc[key].count++;
        acc[key].products.push({
          title: product.title,
          supermarket: product.supermarket
        });
        foundGroup = true;
        break;
      }
    }

    // Se não encontrou grupo, criar um novo
    if (!foundGroup) {
      const category = normalizeTitle(product.title);
      acc[category] = {
        category: category,
        count: 1,
        products: [{
          title: product.title,
          supermarket: product.supermarket
        }]
      };
    }

    return acc;
  }, {});

  // Converter o objeto de agrupamento para um array e ordenar por categoria
  const result = Object.values(groupedProducts).sort((a, b) => {
    // Ordena pelas categorias
    if (a.category < b.category) return -1;
    if (a.category > b.category) return 1;
    return 0;
  });

  return result;
};

// Função para ler e processar o arquivo JSON
const readFileAndProcess = (filePath) => {
  // Ler o arquivo JSON
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Erro ao ler o arquivo:", err);
      return;
    }

    try {
      // Parse do conteúdo JSON
      const products = JSON.parse(data);
      
      // Chamar a função compareProducts para processar os dados
      const result = compareProducts(products);

      // Exibir o resultado
      console.log(JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.error("Erro ao parsear o arquivo JSON:", parseError);
    }
  });
};

// Chamar a função passando o caminho do arquivo
readFileAndProcess('data01.json');
