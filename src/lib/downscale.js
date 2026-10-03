const MAX_EDGE = 1536;

/**
 * Read a File into the payload the audit route expects.
 * Large screenshots are downscaled on the client first: a retina capture is
 * several megabytes, which costs tokens and adds seconds the judge watches.
 */
export function prepareImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`That is a ${file.type || 'unknown'} file. Drop a PNG, JPEG, or WebP screenshot.`));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
      const outW = Math.round(w * scale);
      const outH = Math.round(h * scale);

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, outW, outH);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      URL.revokeObjectURL(url);

      resolve({
        previewUrl: dataUrl,
        width: outW,
        height: outH,
        image: { mimeType: 'image/jpeg', data: dataUrl.split(',')[1] },
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That image could not be decoded. Try a PNG or JPEG.'));
    };

    img.src = url;
  });
}
