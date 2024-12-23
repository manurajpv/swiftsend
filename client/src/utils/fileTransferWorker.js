self.onmessage = async (e) => {
  const { file, chunkIndex, totalChunks } = e.data;

  // Read the chunk
  const arrayBuffer = await file.arrayBuffer();

  // Post the processed chunk back
  self.postMessage({
    chunkData: arrayBuffer,
    chunkIndex,
    totalChunks,
  });
};
