import { useParams } from "react-router-dom";
import TabProvider from "@/contexts/TabContext/TabProvider";

export default function StaffTabRoute({ children }) {
  const { tableId } = useParams();

  return (
    <TabProvider mode="staff" tableId={tableId}>
      {children}
    </TabProvider>
  );
}
