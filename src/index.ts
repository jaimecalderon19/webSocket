import { ServerWebSocket } from "bun";
import { generateUniqueID } from "./utils";

const user = {
  room: "notifications",
  userid: "",
};

export type User = typeof user;

const arrayClients:Array<ServerWebSocket<User>> = [];

const server = Bun.serve<User>({
  fetch(req, server) {
    const url = new URL(req.url);
    const room = url.searchParams.get("room");
    user.room = room ? room : 'notifications';

    if (server.upgrade(req, { data: { ...user } })) return;
    return new Response(null, {
      status: 301,
      headers: {
        Location: "https://railway.app/template/BLofAq?referralCode=bonus",
      },
    });
  },

  websocket: {
    open(ws) {
	    ws.subscribe(ws.data.room)
	    ws.data.userid = generateUniqueID();
      ws.send(`userId: ${ws.data.userid} room: ${ws.data.room}`);
      arrayClients.push(ws);
    },

    message(ws, message) {
      if (typeof message !== "string") return;

      try {
        const parsedMessage = JSON.parse(message);

        arrayClients.forEach(client => {
          if (parsedMessage.to && parsedMessage.to === client.data.userid) {
            // Verificar si el mensaje tiene un destinatario específico
            console.log("enconro un user");
            const responseMessage = {
              type: "message",
              content: parsedMessage.content,
            };
            client.send(JSON.stringify(responseMessage));
          }
        });

        // if (parsedMessage.to && parsedMessage.to === ws.data.userid) {
        //   // Verificar si el mensaje tiene un destinatario específico
        //   const responseMessage = {
        //     type: "message",
        //     content: parsedMessage.content,
        //   };
        //   ws.send(JSON.stringify(responseMessage));
        // } else {

		  
        //   if (!ws.data.userid) return handleUsername(ws, message);
        //   if (!ws.data.room) return handleRoom(ws, message);
        //   ws.publish(ws.data.room, `${ws.data.userid}: ${message}`);
        // }
      } catch (error) {
        console.error("Error al analizar el mensaje:", error);
      }
    },
    close(ws) {
      if (!ws.data.room) return;
      server.publish(ws.data.room, `${ws.data.userid} has left the room`);
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);

process.on("SIGINT", () => {
  server.stop();
});

