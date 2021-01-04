import { createWriteStream } from 'fs';
import path from 'path';

const uploadFile = async (file) => {
  const { filename, createReadStream } = await file;

  return new Promise((resolve, reject) =>
    createReadStream()
      .pipe(createWriteStream(path.join(__dirname, `../images/${filename}`)))
      .on('finish', () => resolve(path.join(__dirname, `../images/${filename}`)))
      .on('error', () => reject()),
  );
};

export default uploadFile;
