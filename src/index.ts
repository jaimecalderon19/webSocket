import { generateUniqueID, handleRoom, handleUsername } from "./utils";

const user = {
  room: "notifications",
  userid: "",
};

export type User = typeof user;

const server = Bun.serve<User>({
  fetch(req, server) {
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
      ws.send(`username: ${ws.data.userid} room: ${ws.data.room}`);
    },
    message(ws, message) {
      if (typeof message !== "string") return;

      try {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.to && parsedMessage.to === ws.data.userid) {
          // Verificar si el mensaje tiene un destinatario específico
          const responseMessage = {
            type: "message",
            content: parsedMessage.content,
          };
          ws.send(JSON.stringify(responseMessage));
        } else {
          // Mensaje regular para la sala
		  console.log('handleUsername');
		  
          if (!ws.data.userid) return handleUsername(ws, message);
		  console.log('handleRoom');
          if (!ws.data.room) return handleRoom(ws, message);
		  console.log('publish');
          ws.publish(ws.data.room, `${ws.data.userid}: ${message}`);
        }
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

// Resto del código de utils...
