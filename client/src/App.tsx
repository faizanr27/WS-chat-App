import { useEffect, useRef, useState } from "react"

function App() {
const [socket, setSocket] = useState()
const [messages, setMessages] = useState(["hi there", "hello", "how are you?"])
const inputRef = useRef();
const wsRef = useRef();

const sendMessage = () => {
  if(!socket){
    return;
  }
  const message = inputRef.current.value;
  wsRef.current.send(JSON.stringify({
    type: 'chat',
    payload: {
      message: message
    }
  }))
}

  useEffect(()=>{
    const ws = new WebSocket('ws://localhost:8080')
    setSocket(ws)

    ws.onmessage = (e) => {
      setMessages(m => [...m, e.data])
    }

    wsRef.current = ws
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "join",
        payload: {
          roomId: "red"
        }
      }))
    }
    return () => {
      ws.close()
    }
    
  }, [])

  return (
    <div className="bg-gray-900 h-screen">
      <div className="flex justify-center items-center h-full text-white">
        <div className="bg-gray-800/80 p-4 rounded-lg h-[600px] min-w-[500px] flex flex-col gap-2">
        <div className="bg-gray-900/60 p-4 rounded-lg flex-1 overflow-y-scroll">
        {messages.map(message => <div className="bg-white text-black p-2 max-w-max rounded-lg mb-2">{message}</div>)}
        </div>
        <div className="flex items-center flex-row gap-2">
          <input ref={inputRef} type="text" placeholder="type your message..." className="flex-1 p-2 rounded-md outline-none focus:border-black/50 focus:border  bg-inherit"/>
          <button onClick={sendMessage} className="bg-gray-950/60 rounded-md p-2">Send</button>
        </div>
        </div>
      </div>
    </div>
  )
}

export default App
