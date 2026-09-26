import { useState, useEffect } from "react";
import axios from "axios";

function Sidebar({ selectedConversationId, onSelectConversation, onNewChat, refreshTrigger }) {
  const [conversations, setConversations] = useState([]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [refreshTrigger]);

  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/conversations",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversations([res.data, ...conversations]);
      onSelectConversation(res.data._id);
      if (onNewChat) onNewChat();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <button onClick={handleNewChat}>+ New Chat</button>
      <h3>Chats</h3>
      <ul>
        {conversations.map((conv) => (
          <li
            key={conv._id}
            onClick={() => onSelectConversation(conv._id)}
            style={{
              fontWeight: conv._id === selectedConversationId ? "bold" : "normal",
              cursor: "pointer",
            }}
          >
            {conv.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;