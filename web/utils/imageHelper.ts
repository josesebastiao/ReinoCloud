// web/utils/imageHelper.ts

export const getDirectImageUrl = (url?: string | null) => {
  if (!url) return "/default-avatar.png"; // Ou null, se preferir tratar no componente

  // 1. Verifica se é um link do Google Drive
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    // Tenta extrair o ID do arquivo
    // Padrão comum: /file/d/ID_DO_ARQUIVO/view
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    
    if (match && match[1]) {
      const fileId = match[1];
      // Retorna o link direto da thumbnail em alta resolução (sz=w1000 = largura 1000px)
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  }

  // 2. Se for link do Dropbox (ajuste comum: dl=0 para raw=1)
  if (url.includes("dropbox.com")) {
    return url.replace("?dl=0", "").replace("?dl=1", "") + "?raw=1";
  }

  // 3. Se for outro link normal (internet), retorna ele mesmo
  return url;
};