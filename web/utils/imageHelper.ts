// web/utils/imageHelper.ts

export const getDirectImageUrl = (url?: string | null) => {
  if (!url) return undefined;

  const cleanUrl = url.trim();

  // 1. Se já for Base64 (data:image...), retorna ele mesmo
  if (cleanUrl.startsWith("data:")) {
      return cleanUrl;
  }

  // 2. Google Drive
  let fileId = "";
  const match1 = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const match2 = cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);

  if (match1 && match1[1]) fileId = match1[1];
  else if (match2 && match2[1]) fileId = match2[1];

  if (fileId) {
    // Tenta usar o link de exportação direta que é mais compatível com tags IMG de impressão
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // 3. Dropbox
  if (cleanUrl.includes("dropbox.com")) {
    return cleanUrl.replace("?dl=0", "").replace("?dl=1", "") + "?raw=1";
  }

  // 4. Retorna original se não for Drive/Dropbox
  return cleanUrl;
};