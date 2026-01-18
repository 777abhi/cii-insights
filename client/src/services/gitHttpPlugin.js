import { CapacitorHttp } from '@capacitor/core';
import { Buffer } from 'buffer';

export const capacitorHttpPlugin = {
  async request({ url, method, headers, body }) {
    let data = null;

    // Handle request body
    // For clone/pull (git-upload-pack), the body is text-based negotiation.
    // For push (git-receive-pack), the body contains the packfile (binary).
    // CapacitorHttp 'data' field: if string, sent as body.
    // If we use 'utf8', it works for negotiation.
    // If we ever support push, we might need to revisit this or assume 'utf8' handles binary cleanly enough (it doesn't).
    // But since we are read-only for now, utf8 is safer for negotiation than base64.
    if (body) {
      const chunks = [];
      for await (const chunk of body) {
        chunks.push(chunk);
      }
      // Use utf8 instead of base64 to prevent 400 Bad Request on negotiation
      data = Buffer.concat(chunks).toString('utf8');
    }

    try {
      const response = await CapacitorHttp.request({
        url,
        method,
        headers,
        data,
        // We request arraybuffer (blob) to handle binary git packfiles correctly
        responseType: 'arraybuffer'
      });

      // Capacitor returns binary data as base64 string when responseType is arraybuffer/blob
      let responseBody = response.data;
      if (typeof responseBody === 'string') {
        responseBody = Buffer.from(responseBody, 'base64');
      } else {
          // If it's somehow not a string (e.g. JSON object automatically parsed?), handle it.
          // For git, we expect binary.
          if (typeof responseBody === 'object') {
              responseBody = Buffer.from(JSON.stringify(responseBody));
          }
      }

      return {
        url,
        method,
        headers: response.headers,
        statusCode: response.status,
        statusMessage: response.status === 200 ? 'OK' : `HTTP ${response.status}`,
        body: [responseBody] // Return as an array (iterable) of Uint8Array/Buffer
      };
    } catch (error) {
      console.error('Git HTTP Plugin Error:', error);
      throw error;
    }
  }
};
