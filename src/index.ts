import { ServerWebSocket } from "bun";
import { generateUniqueID, handleRoom, handleUsername } from "./utils";

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
      let data = {
        room: 'info',
        userId: ws.data.userid
      }
      ws.send(JSON.stringify(data));
      arrayClients.push(ws);
    },

    message(ws, message) {
      if (typeof message !== "string") return;

      try {
        const parsedMessage = JSON.parse(message);

        // arrayClients.forEach(client => {
        //   if (parsedMessage.to && parsedMessage.to === client.data.userid) {
        //     client.send(message);
        //     return;
        //   }
        // });

		  
          if (!ws.data.userid) return handleUsername(ws, message);
          if (!ws.data.room) return handleRoom(ws, message);
          ws.publish(ws.data.room, `${message}`);

      } catch (error) {
        console.error("Error al analizar el mensaje:", error);
      }
    },
    close(ws) {
      if (!ws.data.room) return;
      server.publish(ws.data.room, `${ws.data.userid} has left the room`);
      for (let i = arrayClients.length - 1; i >= 0; i--) {
        if (arrayClients[1].data.userid === ws.data.userid) {
            arrayClients.splice(i, 1);
        }
      }
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);

process.on("SIGINT", () => {
  server.stop();
});

