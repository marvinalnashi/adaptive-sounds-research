import { Server } from 'socket.io';
import type { NextApiRequest } from 'next';
import type { NextApiResponseServerIO } from '@/types/next';

export const config = {
    api: { bodyParser: false },
};

let connectedClients: Record<string, string> = {};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
    if (!res.socket.server.io) {
        const io = new Server(res.socket.server);
        res.socket.server.io = io;

        io.on("connection", (socket) => {
            console.log("Client connected:", socket.id);

            socket.on("join", (role) => {
                connectedClients[socket.id] = role;
                console.log(`${role} joined. Current clients:`, connectedClients);
                io.emit("status-update", Object.values(connectedClients));
            });

            socket.on("ring", (target) => {
                io.emit("trigger-ring", target);
            });

            socket.on("disconnect", () => {
                delete connectedClients[socket.id];
                io.emit("status-update", Object.values(connectedClients));
            });
        });
    }
    res.end();
}
