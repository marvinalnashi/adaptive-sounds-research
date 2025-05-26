import { Server } from 'socket.io';
import type { NextApiRequest } from 'next';
import type { NextApiResponseServerIO } from '@/types/next';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
    if (!res.socket.server.io) {
        const io = new Server(res.socket.server);
        res.socket.server.io = io;

        io.on("connection", (socket) => {
            console.log("Client connected:", socket.id);

            socket.on("ring", (data) => {
                console.log("Trigger received:", data);
                io.emit("trigger-ring", data);
            });
        });
    }
    res.end();
}
