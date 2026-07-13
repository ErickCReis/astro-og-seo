import { EventEmitter } from "node:events";

export type CapturedResponse = {
  statusCode: number;
  headers: Record<string, string | number | string[]>;
  body: Buffer;
};

export function createRequest(method: string, body = "") {
  const request = new EventEmitter() as EventEmitter & {
    method: string;
    headers: Record<string, string>;
    setEncoding: () => void;
  };

  request.method = method;
  request.headers = {};
  request.setEncoding = () => {};

  queueMicrotask(() => {
    if (body) {
      request.emit("data", body);
    }

    request.emit("end");
  });

  return request;
}

export function createResponse() {
  const chunks: Buffer[] = [];
  let resolveEnd: (response: CapturedResponse) => void;
  const endPromise = new Promise<CapturedResponse>((resolve) => {
    resolveEnd = resolve;
  });
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string | number | string[]>,
    setHeader(name: string, value: string | number | string[]) {
      this.headers[name.toLowerCase()] = value;
    },
    end(chunk?: string | Uint8Array) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      resolveEnd({
        statusCode: this.statusCode,
        headers: this.headers,
        body: Buffer.concat(chunks),
      });
    },
  };

  return {
    response,
    endPromise,
  };
}
