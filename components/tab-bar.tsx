import ChatBadge from "./chat-badge";
import TabBarClient from "./tab-bar-client";

export default function TabBar() {
  return <TabBarClient chatBadge={<ChatBadge />} />;
}

