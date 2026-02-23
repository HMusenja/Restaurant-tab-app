import { useParams } from "react-router-dom";
import TabProvider from "@/contexts/TabContext/TabProvider";

export default function GuestTabRoute({ children }) {
  const { token } = useParams();

  return (
    <TabProvider mode="guest" token={token}>
      {children}
    </TabProvider>
  );
}
