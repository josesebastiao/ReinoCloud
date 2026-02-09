// web/utils/imageHelper.ts

export const getDirectImageUrl = (url?: string | null) => {
  if (!url) return undefined;

  const cleanUrl = url.trim();

  // 1. Extrair ID do Google Drive
  let fileId = "";
  // Tenta pegar o ID de links comuns (/file/d/...)
  const match1 = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  // Tenta pegar o ID de links de exportação (id=...)
  const match2 = cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);

  if (match1 && match1[1]) fileId = match1[1];
  else if (match2 && match2[1]) fileId = match2[1];

  // 2. Se achou ID do Drive, gera o link direto da CDN (LH3)
  if (fileId) {
    // =s3000 pede a imagem em alta resolução
    return `https://lh3.googleusercontent.com/d/${fileId}=s3000`;
  }

  // 3. Dropbox (ajuste para raw)
  if (cleanUrl.includes("dropbox.com")) {
    return cleanUrl.replace("?dl=0", "").replace("?dl=1", "") + "?raw=1";
  }

  // 4. Retorna original se não for Drive/Dropbox
  return cleanUrl;
};