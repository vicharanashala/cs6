import net from 'net';

const CLAMAV_HOST = process.env.CLAMAV_HOST || '127.0.0.1';
const CLAMAV_PORT = parseInt(process.env.CLAMAV_PORT, 10) || 3310;
const SCAN_TIMEOUT = parseInt(process.env.CLAMAV_TIMEOUT, 10) || 10000; // 10 seconds

/**
 * Scans a file buffer for malware using ClamAV's INSTREAM protocol.
 *
 * The INSTREAM protocol works as follows:
 *   1. Send "zINSTREAM\0" to begin a streaming scan session.
 *   2. Send one or more chunks: 4-byte big-endian length prefix followed by the chunk data.
 *   3. Send a zero-length chunk (4 zero bytes) to signal the end of the stream.
 *   4. Read the response from ClamAV:
 *      - "stream: OK\0"         -> file is clean
 *      - "stream: <sig> FOUND\0" -> infected with <sig>
 *
 * @param {Buffer} fileBuffer - The raw file bytes to scan.
 * @returns {Promise<{ clean: boolean, reason: string }>}
 */
export const scanBuffer = (fileBuffer) => {
  return new Promise((resolve) => {
    const isProd = process.env.NODE_ENV === 'production';

    const socket = new net.Socket();
    let responseData = Buffer.alloc(0);
    let resolved = false;

    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve(result);
    };

    // Timeout handler
    socket.setTimeout(SCAN_TIMEOUT, () => {
      if (isProd) {
        finish({ clean: false, reason: 'ClamAV scan timed out. Upload blocked for safety.' });
      } else {
        console.warn('⚠️ ClamAV scan timed out. Skipping in development mode.');
        finish({ clean: true, reason: 'ClamAV timeout — skipped in dev mode.' });
      }
    });

    socket.on('error', (err) => {
      if (isProd) {
        console.error('❌ ClamAV connection error:', err.message);
        finish({ clean: false, reason: `ClamAV unavailable: ${err.message}. Upload blocked.` });
      } else {
        console.warn(`⚠️ ClamAV not available (${err.message}). Skipping scan in dev mode.`);
        finish({ clean: true, reason: `ClamAV offline — skipped in dev mode.` });
      }
    });

    socket.on('data', (chunk) => {
      responseData = Buffer.concat([responseData, chunk]);
    });

    socket.on('end', () => {
      const response = responseData.toString('utf8').replace(/\0/g, '').trim();

      if (response.endsWith('OK')) {
        finish({ clean: true, reason: 'ClamAV: File is clean.' });
      } else if (response.includes('FOUND')) {
        const signature = response.replace('stream:', '').replace('FOUND', '').trim();
        finish({ clean: false, reason: `ClamAV: Malware detected — ${signature}` });
      } else {
        // Unexpected response
        if (isProd) {
          finish({ clean: false, reason: `ClamAV: Unexpected response — "${response}". Upload blocked.` });
        } else {
          console.warn(`⚠️ ClamAV unexpected response: "${response}". Passing in dev mode.`);
          finish({ clean: true, reason: `ClamAV unexpected response — skipped in dev mode.` });
        }
      }
    });

    // Connect and stream
    socket.connect(CLAMAV_PORT, CLAMAV_HOST, () => {
      // Send INSTREAM command
      socket.write('zINSTREAM\0');

      // Stream the buffer in chunks (max 2048 bytes each to stay safe)
      const CHUNK_SIZE = 2048;
      for (let offset = 0; offset < fileBuffer.length; offset += CHUNK_SIZE) {
        const end = Math.min(offset + CHUNK_SIZE, fileBuffer.length);
        const chunk = fileBuffer.slice(offset, end);

        // 4-byte big-endian length prefix
        const lengthBuf = Buffer.alloc(4);
        lengthBuf.writeUInt32BE(chunk.length, 0);
        socket.write(lengthBuf);
        socket.write(chunk);
      }

      // Send zero-length terminator
      const zeroBuf = Buffer.alloc(4, 0);
      socket.write(zeroBuf);
    });
  });
};
