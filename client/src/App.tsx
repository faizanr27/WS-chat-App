import { useEffect, useRef, useState, KeyboardEvent } from "react";

// Message types
interface BaseMessage {
  type: string;
  message: string;
}

interface ChatMessage extends BaseMessage {
  type: 'chat' | 'self' | 'info';
}

// WebSocket message types
interface WSBaseMessage {
  type: string;
  payload?: unknown;
}

interface WSCreateMessage extends WSBaseMessage {
  type: 'create';
  payload: {
    roomId: string;
  };
}

interface WSJoinMessage extends WSBaseMessage {
  type: 'join';
  payload: {
    roomId: string;
  };
}

interface WSChatMessage extends WSBaseMessage {
  type: 'chat';
  payload: {
    message: string;
  };
}

// Server response types
interface WSServerMessage {
  type: 'error' | 'success' | 'info' | 'chat';
  message: string;
}

type WSOutgoingMessage = WSCreateMessage | WSJoinMessage | WSChatMessage;

function App() {
  // const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(
    localStorage.getItem("currentRoom") || null
  );
  const [error, setError] = useState<string>("");
  const [showChat, setShowChat] = useState<boolean>(
    localStorage.getItem("showChat") === "true"
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // const ws = new WebSocket("wss://ws-chat-app-production.up.railway.app");
    const ws = new WebSocket("ws://localhost:8080");
    ws.onopen = () => console.log("WebSocket connection established");

    ws.onmessage = (event: MessageEvent) => {
      const data: WSServerMessage = JSON.parse(event.data);

      switch (data.type) {
        case 'error':
          setError(data.message);
          break;
        case 'success':
          setError("");
          if (inputRef.current?.value) {
            setCurrentRoom(inputRef.current.value);
            localStorage.setItem("currentRoom", inputRef.current.value);
            setShowChat(true);
            localStorage.setItem("showChat", "true");
          }
          break;
        case 'info':
          setError("");
          setMessages(prev => [...prev, { type: 'info', message: data.message }]);
          break;
        case 'chat':
          setMessages(prev => [...prev, { type: 'chat', message: data.message }]);
          break;
      }
    };

    ws.onerror = (error: Event) => console.error("WebSocket error:", error);
    ws.onclose = () => console.log("WebSocket connection closed");

    wsRef.current = ws;
    // setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const sendWSMessage = (message: WSOutgoingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      setError("WebSocket connection not open");
    }
  };

  const createRoom = () => {
    const roomId = inputRef.current?.value;
    if (!roomId) {
      setError("Please enter a room name");
      return;
    }

    sendWSMessage({
      type: 'create',
      payload: { roomId }
    });
  };

  const joinRoom = () => {
    const roomId = inputRef.current?.value;
    if (!roomId) {
      setError("Please enter a room name");
      return;
    }

    sendWSMessage({
      type: 'join',
      payload: { roomId }
    });

    setCurrentRoom(roomId);
    setShowChat(true);
  };

  const sendMessage = () => {
    const message = messageRef.current?.value;
    if (!message) return;

    sendWSMessage({
      type: 'chat',
      payload: { message }
    });

    setMessages(prev => [...prev, { type: 'self', message }]);
    if (messageRef.current) {
      messageRef.current.value = '';
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="bg-gray-900 h-screen">
      <div className="flex justify-center items-center h-full text-white">
        {!showChat ? (
          <div className="bg-gray-800/30 border-gray-700/60 border p-4 rounded-lg h-[300px] min-w-[350px] flex flex-col gap-2 justify-center items-center">
            <h1 className="text-bold text-xl">Chat Room</h1>
            <input
              type="text"
              className="p-2 rounded-md outline-none focus:border-black/50 border border-gray-700 bg-inherit"
              ref={inputRef}
              placeholder="Enter room name"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                className="bg-gray-950/60 rounded-md p-2 hover:bg-gray-950/20 hover:border-gray-600/50 hover:border"
                onClick={createRoom}
              >
                Create Room
              </button>
              <button
                className="bg-gray-950/60 rounded-md p-2 hover:bg-gray-950/20 hover:border-gray-600/50 hover:border"
                onClick={joinRoom}
              >
                Join Room
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/30 border-gray-700/60 border p-4 rounded-lg h-[600px] min-w-[500px] flex flex-col gap-2">
            <h2 className="text-lg">Room: {currentRoom}</h2>
            <div className="bg-gray-900/60 p-4 rounded-lg flex-1 overflow-y-auto">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 max-w-max rounded-lg mb-2 ${
                    msg.type === 'self'
                      ? 'bg-blue-500 ml-auto'
                      : msg.type === 'info'
                        ? 'bg-gray-700 mx-auto'
                        : 'bg-gray-600'
                  }`}
                >
                  {msg.message}
                </div>
              ))}
            </div>
            <div className="flex items-center flex-row gap-2">
              <input
                ref={messageRef}
                type="text"
                placeholder="Type your message..."
                className="flex-1 p-2 rounded-md outline-none focus:border-black/50 border border-gray-700 bg-inherit"
                onKeyPress={handleKeyPress}
              />
              <button
                onClick={sendMessage}
                className="bg-gray-950/60 rounded-md p-2 hover:bg-gray-950/20 hover:border-gray-600/50 hover:border"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;