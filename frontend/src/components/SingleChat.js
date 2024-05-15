import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import { IconButton, Spinner, useToast } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowBackIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import crypto from "crypto";

import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
import {
  computeSecret,
  decryptPublicKey,
  getOtheruserPublicKey,
  masterEncryptionKey,
  encryptSymmetricKeyWithECDH,
  decryptSymmetricKeyWithECDH,
} from "../lib/utils";
import {
  decryptGroupChatMessage,
  decryptMessage,
  encryptGroupChatMessage,
  encryptMessage,
} from "../lib/encryption";
const ENDPOINT = "http://localhost:5000";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [sharedSecret, setSharedSecret] = useState("");

  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config,
      );

      setMessages(data);
      setLoading(false);

      // Single Chat
      // Get other user public key
      const otherPublicKey = getOtheruserPublicKey(
        selectedChat.publicKeys,
        user._id,
      );

      const unlayeredPublicKey = decryptPublicKey(
        otherPublicKey,
        masterEncryptionKey,
      );

      // Generate Shared Secret
      const computedSecret = computeSecret(unlayeredPublicKey, user.name);
      setSharedSecret(computedSecret);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const sendMessage = async (event) => {
    if (!selectedChat) return;
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat,
          },
          config,
        );

        setMessages([...messages, data]);

        // Encrypt newMessage
        const content = data.content;
        let encryptedMessage;
        let dataToSend;

        // if (selectedChat.isGroupChat) {
        //   const symmetricKey = crypto.randomBytes(32);

        //   const otherUserLayeredPublicKeys = selectedChat.publicKeys;

        //   let otherUserUnlayeredPublicKeys = {};

        //   // Unlayer them
        //   for (const key in otherUserLayeredPublicKeys) {
        //     const otherUserPublicKey = decryptPublicKey(
        //       otherUserLayeredPublicKeys[key],
        //       masterEncryptionKey,
        //     );

        //     otherUserUnlayeredPublicKeys[key] = otherUserPublicKey;
        //   }

        //   let encryptedSymmetricKeys = {};

        //   for (const key in otherUserUnlayeredPublicKeys) {
        //     const encryptedSymmetricKey = encryptSymmetricKeyWithECDH(
        //       otherUserUnlayeredPublicKeys[key],
        //       symmetricKey,
        //       user.name,
        //     );

        //     encryptedSymmetricKeys[key] = encryptedSymmetricKey;
        //   }

        //   encryptedMessage = encryptGroupChatMessage(content, symmetricKey);

        //   dataToSend = {
        //     ...data,
        //     content: encryptedMessage,
        //     encryptedSymmetricKeys,
        //   };
        // } else {
          encryptedMessage = encryptMessage(sharedSecret, content);
          dataToSend = {
            ...data,
            content: encryptedMessage,
          };
        // }

        socket.emit("new message", dataToSend);
      } catch (error) {
        console.log(error);
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        // Decrypt received message
        let contentObj;
        const encryptedMessage = newMessageRecieved.content;

        // if (selectedChatCompare.isGroupChat) {
        //   const { encryptedSymmetricKeys } = newMessageRecieved;

        //   const senderLayeredPublicKey =
        //     selectedChatCompare.publicKeys[newMessageRecieved.sender._id];

        //   const senderUnlayeredPublicKey = decryptPublicKey(
        //     senderLayeredPublicKey,
        //     masterEncryptionKey,
        //   );

        //   const encryptedSymmetricKey = encryptedSymmetricKeys[user._id];

        //   const decryptedSymmetricKey = decryptSymmetricKeyWithECDH(
        //     senderUnlayeredPublicKey,
        //     encryptedSymmetricKey,
        //     user.name,
        //   );

        //   console.log({
        //     decryptedSymmetricKey,
        //   });

        //   const decryptedMessage = decryptGroupChatMessage(
        //     encryptedMessage,
        //     decryptedSymmetricKey,
        //   );
        //   contentObj = {
        //     ...newMessageRecieved,
        //     content: decryptedMessage,
        //   };
        // } else {
          const { iv, encryptedData } = encryptedMessage;
          const decryptedMessage = decryptMessage(
            sharedSecret,
            iv,
            encryptedData,
          );

          contentObj = {
            ...newMessageRecieved,
            content: decryptedMessage,
          };
        // }

        setMessages([...messages, contentObj]);
      }
    });
  });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            d="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Text>
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
            >
              {istyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    // height={50}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
              />
            </FormControl>
          </Box>
        </>
      ) : (
        // to get socket.io on same page
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
