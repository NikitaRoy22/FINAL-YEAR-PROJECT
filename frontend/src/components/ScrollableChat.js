import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";

const ScrollableChat = ({ messages }) => {
  const { user } = ChatState();

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => {
          // Parse updatedAt into a Date object
          const updatedAtDate = new Date(m.updatedAt);
          
          // Get hour and minute from the Date object
          const hour = updatedAtDate.getHours();
          const minute = updatedAtDate.getMinutes();
          
          // Format hour and minute as HH:MM
          const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          // Calculate padding based on message length
          //const padding = `${Math.min(Math.max(10, m.content.length), 50)}px`;

          // Define styles for the message box
          const messageStyle = {
              backgroundColor: m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0",
              borderRadius: "20px",
              padding: 15, // Dynamic padding based on message length
              maxWidth: "60vw", // Limit maximum width to 60% of the parent div
              wordWrap: "break-word", // Allow long words to break and wrap
              whiteSpace: "pre-line", // Preserve line breaks
              marginLeft: user._id === m.sender._id ? "auto" : "0",
              marginRight: user._id === m.sender._id ? "0" : "auto",
              marginTop: "5px", // Adjusted marginTop for better spacing
            };

          return (
            <div style={{ display: "flex", flexDirection: user._id === m.sender._id ? "row-reverse" : "row" }} key={m._id}>
              {(isSameSender(messages, m, i, user._id) ||
                isLastMessage(messages, i, user._id)) && (
                <Tooltip label={m.sender.name} placement={user._id === m.sender._id ? "bottom-end" : "bottom-start"} hasArrow>
                  <Avatar
                    mt="7px"
                    mr={1}
                    size="sm"
                    cursor="pointer"
                    name={m.sender.name}
                    src={m.sender.pic}
                  />
                </Tooltip>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: user._id === m.sender._id ? "flex-end" : "flex-start" }}>
                <span
                  style={messageStyle}
                >
                  {m.content}
                </span>
                <div style={{ textAlign: "right", fontSize: "0.8rem", marginTop: "5px" }}>
                  {formattedTime} | {updatedAtDate.toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>
          );
        })}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
