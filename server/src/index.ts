import { WebSocketServer, WebSocket } from "ws";
require('dotenv').config()


const port: number = parseInt(process.env.PORT || "8080", 10);


const wss = new WebSocketServer({ 
    port: port,
    host: '0.0.0.0'
});

const rooms: Map<string, Set<WebSocket>> = new Map();

wss.on("connection", (socket) => {

    socket.on("message", (message) => {

        const parsedMessage = JSON.parse(message.toString())

        if(parsedMessage.type === "create"){
            const roomId = parsedMessage.payload.roomId;
            
            if(rooms.has(roomId)){
                socket.send(JSON.stringify({ type: 'error', message: 'Room already exists' }));
            }
            rooms.set(roomId, new Set())
            rooms.get(roomId)?.add(socket)
            socket.send(JSON.stringify({ type: 'success', message: 'Room created' }));

        }


        if(parsedMessage.type === "join"){
            const roomId = parsedMessage.payload.roomId;

            if (!rooms.has(roomId)) {
                socket.send(JSON.stringify({ type: 'error', message: 'Room does not exist' }));
            }
            rooms.get(roomId)!.add(socket)

            console.log(`User joined room: ${roomId}`);
            socket.send(JSON.stringify({ type: "info", message: `Joined room ${roomId}` }));
        }




        if (parsedMessage.type == "chat") {
            console.log("user wants to chat");
            
            let currentUserRoom : string | null = null

            for(const [roomId, sockets] of rooms){
                if (sockets.has(socket)) {
                    currentUserRoom = roomId;
                    break
                }
            }

            if (!currentUserRoom){
                socket.send(JSON.stringify({ type: "error", message: "You are not in a room" }));
                return;
            }

            console.log(`Broadcasting message in room: ${currentUserRoom}`);
            const chatMessage = parsedMessage.payload.message;

            rooms.get(currentUserRoom)?.forEach((clientSocket) => {
                if (clientSocket !== socket && clientSocket.readyState === WebSocket.OPEN) {
                    clientSocket.send(JSON.stringify({ type: "chat", message: chatMessage }));
                }
            });
            

        }
    })

    socket.on("close", ()=> {
        console.log("client disconnected");

        for (const [roomId, sockets] of rooms) {
            if (sockets.delete(socket)) {
                console.log(`User removed from room: ${roomId}`);
                if (sockets.size === 0) {
                    rooms.delete(roomId);
                    console.log(`Room deleted: ${roomId}`);
                }
            }
        }
        
    })
    

})