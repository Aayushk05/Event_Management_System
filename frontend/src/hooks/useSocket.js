import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

let socketInstance = null;

export const useSocket = () => {
  const socketRef = useRef(null);

  const getSocket = useCallback(() => {
    if (!socketInstance) {
      const token = localStorage.getItem("token");
      socketInstance = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
        auth: { token },
        transports: ["websocket", "polling"],
      });
      socketInstance.on("connect_error", (err) => {
        console.warn("Socket connect error:", err.message);
      });
    }
    socketRef.current = socketInstance;
    return socketInstance;
  }, []);

  const destroySocket = useCallback(() => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  }, []);

  return { getSocket, destroySocket };
};

export const useForumSocket = (eventId, handlers) => {
  const { getSocket } = useSocket();

  useEffect(() => {
    if (!eventId) return;
    const socket = getSocket();

    socket.emit("join_forum", eventId);

    if (handlers.onMessage)     socket.on("new_message",       handlers.onMessage);
    if (handlers.onAnnouncement) socket.on("new_announcement",  handlers.onAnnouncement);
    if (handlers.onDelete)      socket.on("message_deleted",    handlers.onDelete);
    if (handlers.onPin)         socket.on("message_pinned",     handlers.onPin);
    if (handlers.onReaction)    socket.on("reaction_updated",   handlers.onReaction);
    if (handlers.onTyping)      socket.on("user_typing",        handlers.onTyping);
    if (handlers.onStopTyping)  socket.on("user_stop_typing",   handlers.onStopTyping);

    return () => {
      socket.emit("leave_forum", eventId);
      socket.off("new_message");
      socket.off("new_announcement");
      socket.off("message_deleted");
      socket.off("message_pinned");
      socket.off("reaction_updated");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [eventId]);

  const emitTyping    = useCallback(() => getSocket().emit("typing",      { eventId }), [eventId]);
  const emitStopTyping = useCallback(() => getSocket().emit("stop_typing", { eventId }), [eventId]);

  return { emitTyping, emitStopTyping };
};
