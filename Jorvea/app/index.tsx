import { HomeScreen } from "../src/screens";
import AuthGuard from "../src/components/AuthGuard";

export default function Index() {
  return (
    <AuthGuard>
      <HomeScreen />
    </AuthGuard>
  );
}
