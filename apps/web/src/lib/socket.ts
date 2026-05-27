import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@oruclass/types";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return ""; // use relative path, Next.js will proxy it
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
};

export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(getBaseUrl(), {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket(): AppSocket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
