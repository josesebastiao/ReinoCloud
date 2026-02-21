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

export const compressImageFile = (file: File, maxWidth = 1000, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      img.onload = () => {
        try {
          const ratio = img.width / img.height;
          let targetW = img.width;
          let targetH = img.height;
          if (img.width > maxWidth) {
            targetW = maxWidth;
            targetH = Math.round(maxWidth / ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');
          ctx.drawImage(img, 0, 0, targetW, targetH);
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Canvas toBlob failed'));
            const r = new FileReader();
            r.onloadend = () => resolve(r.result as string);
            r.onerror = reject;
            r.readAsDataURL(blob);
          }, 'image/jpeg', quality);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const uploadToImgbb = async (base64DataUrl: string) => {
  // Prefer calling internal server route which keeps the API key secret
  const res = await fetch('/api/imgbb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64DataUrl })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Upload para imgbb falhou: ' + txt);
  }
  const json = await res.json();
  return json.url as string;
};

export const cacheImage = (imageUrl: string, base64DataUrl: string) => {
  try {
    const key = 'imgcache:' + encodeURIComponent(imageUrl);
    localStorage.setItem(key, base64DataUrl);
  } catch (e) {
    console.warn('Não foi possível salvar cache de imagem:', e);
  }
};

export const getCachedImage = (imageUrl?: string | null) => {
  try {
    if (!imageUrl) return undefined;
    const key = 'imgcache:' + encodeURIComponent(imageUrl);
    return localStorage.getItem(key) || undefined;
  } catch (e) {
    return undefined;
  }
};