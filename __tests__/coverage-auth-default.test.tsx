import { render } from "@testing-library/react-native";

jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
}));

jest.mock("react-native", () => ({
  AppState: { addEventListener: jest.fn() },
}));

import { useAuth } from "@/src/providers/AuthProvider";

describe("AuthProvider default context signOut", () => {
  it("invokes the no-op signOut from the default context value", async () => {
    let captured: { signOut?: () => Promise<void> } = {};
    function Probe() {
      captured = useAuth();
      return null;
    }
    render(<Probe />);
    await captured.signOut?.();
  });
});
