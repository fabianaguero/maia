export async function loadDecodedAudioBuffer(input: {
  url: string;
  context: AudioContext;
  fetchImpl?: typeof fetch;
}): Promise<AudioBuffer> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(input.url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching guide track`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return input.context.decodeAudioData(arrayBuffer);
}
