import { ServerWebSocket } from "bun"
import { User } from "."

export function handleUsername(ws: ServerWebSocket<User>, message: string) {
	if (!message.length) {
		ws.send("Username:")
		return
	}
	ws.data.userid = message
	ws.send("Room:")
}

export function handleRoom(ws: ServerWebSocket<User>, message: string) {
	if (!message.length) {
		ws.send("Room:")
		return
	}
	ws.data.room = message
	ws.subscribe(ws.data.room)
	ws.publish(ws.data.room, `${ws.data.userid} has joined the room`)
	ws.send(`You joined the '${ws.data.room}' room`)
}

export function generateUniqueID() {
	return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
