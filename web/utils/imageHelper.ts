// web/utils/imageHelper.ts

export const getDirectImageUrl = (url?: string | null) => {
  if (!url) return undefined; // Retorna undefined para não quebrar componentes de imagem

  const cleanUrl = url.trim();

  // 1. Lógica para o Google Drive
  if (cleanUrl.includes("drive.google.com") || cleanUrl.includes("docs.google.com")) {
    let fileId = "";

    // Padrão 1: /file/d/ID_DO_ARQUIVO/view
    const match1 = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    
    // Padrão 2: id=ID_DO_ARQUIVO
    const match2 = cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);

    if (match1 && match1[1]) {
      fileId = match1[1];
    } else if (match2 && match2[1]) {
      fileId = match2[1];
    }

    if (fileId) {
      // Método "Universal" de exportação de visualização
      // Funciona melhor para imagens .webp, .png e .jpg
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }

  // 2. Dropbox
  if (cleanUrl.includes("dropbox.com")) {
    return cleanUrl.replace("?dl=0", "").replace("?dl=1", "") + "?raw=1";
  }

  // 3. Imgur e outros (retorna o link original)
  return cleanUrl;
};