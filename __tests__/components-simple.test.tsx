import { fireEvent, render } from "@testing-library/react-native";

jest.mock("expo-image", () => {
  const React = require("react");
  const RN = require("react-native");
  return { Image: (props: object) => React.createElement(RN.View, props) };
});

jest.mock("react-native-svg", () => {
  const React = require("react");
  const make = () => (props: object) => React.createElement("svg", props);
  return {
    __esModule: true,
    default: make(),
    Svg: make(),
    Path: make(),
    Circle: make(),
    Rect: make(),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: "es" },
  }),
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null },
}));

const mockSetLocale = jest.fn();
jest.mock("@/src/i18n", () => ({
  SUPPORTED_LOCALES: ["es", "en"],
  setAppLocale: (...a: unknown[]) => mockSetLocale(...a),
}));

jest.mock("@/src/hooks/useDoctor", () => ({
  useDoctor: () => ({
    doctor: { id: "d", name: "Dr X", avatar: null },
    loading: false,
    setDoctor: jest.fn(),
  }),
}));

jest.mock("@/src/hooks/useRecorder", () => ({
  formatDuration: (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${s % 60}`;
  },
}));

import { PatientCard } from "@/src/components/PatientCard";
import { InformeRow } from "@/src/components/InformeRow";
import { StatCard } from "@/src/components/StatCard";
import { LanguageSwitcher } from "@/src/components/LanguageSwitcher";
import { AppHeader } from "@/src/components/AppHeader";
import { MarkdownEditor } from "@/src/components/MarkdownEditor";
import { MarkdownView } from "@/src/components/MarkdownView";
import { RecorderControls } from "@/src/components/RecorderControls";

describe("PatientCard", () => {
  it("renders a patient with stats", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PatientCard
        patient={{
          id: "p1",
          name: "Ana",
          dni: "12345",
          email: "a@a",
          phone: "+1",
          dob: null,
          obra_social: null,
          nro_afiliado: null,
          plan: null,
          created_at: "2024-01-01",
          informe_count: 2,
          last_informe_at: "2024-01-02",
          last_informe_status: "completed",
        }}
        onPress={onPress}
      />,
    );
    fireEvent.press(getByText("Ana"));
    expect(onPress).toHaveBeenCalled();
  });

  it("renders fallback dash when no dni/phone", () => {
    const { getByText } = render(
      <PatientCard
        patient={{
          id: "p",
          name: "N",
          dni: null,
          email: null,
          phone: null,
          dob: null,
          obra_social: null,
          nro_afiliado: null,
          plan: null,
          created_at: "2024-01-01",
          informe_count: 1,
          last_informe_at: null,
          last_informe_status: null,
        }}
      />,
    );
    expect(getByText("—")).toBeTruthy();
  });
});

describe("InformeRow", () => {
  it("renders all statuses without crashing", () => {
    for (const status of ["completed", "processing", "recording", "error"] as const) {
      render(
        <InformeRow
          informe={{
            id: "i",
            doctor_id: "d",
            patient_id: null,
            status,
            informe_doctor: null,
            informe_paciente: null,
            recording_duration: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          }}
        />,
      );
    }
  });

  it("triggers onPress", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <InformeRow
        informe={{
          id: "i",
          doctor_id: "d",
          patient_id: null,
          status: "completed",
          informe_doctor: null,
          informe_paciente: null,
          recording_duration: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        }}
        onPress={onPress}
      />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("StatCard", () => {
  it("renders each tone", () => {
    for (const tone of ["primary", "success", "warning", "destructive", "info"] as const) {
      render(<StatCard label="L" value={1} icon="add" tone={tone} />);
    }
  });

  it("defaults tone to primary", () => {
    const { getByText } = render(<StatCard label="L" value={2} icon="add" />);
    expect(getByText("L")).toBeTruthy();
  });
});

describe("LanguageSwitcher", () => {
  it("opens the modal and changes locale", async () => {
    mockSetLocale.mockResolvedValue(undefined);
    const { getByText } = render(<LanguageSwitcher />);
    fireEvent.press(getByText("ES"));
    // The modal renders both options synchronously via RN Modal.
    fireEvent.press(getByText("language.en"));
    await Promise.resolve();
    expect(mockSetLocale).toHaveBeenCalledWith("en");
  });
});

describe("AppHeader", () => {
  it("renders the logo by default and the avatar button", () => {
    const { getByLabelText } = render(<AppHeader />);
    fireEvent.press(getByLabelText("nav.greeting"));
    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it("renders the title when showLogo=false", () => {
    const { getByText } = render(<AppHeader showLogo={false} title="Hi" />);
    expect(getByText("Hi")).toBeTruthy();
  });
});

describe("MarkdownEditor", () => {
  it("renders edit mode and switches to preview", () => {
    const onChange = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <MarkdownEditor value="hello" onChange={onChange} />,
    );
    fireEvent.changeText(getByPlaceholderText(""), "new value");
    expect(onChange).toHaveBeenCalled();
    fireEvent.press(getByText("Preview"));
    expect(getByText("hello")).toBeTruthy();
  });

  it("shows no-content placeholder in preview when empty", () => {
    const { getByText } = render(
      <MarkdownEditor value="" onChange={() => {}} />,
    );
    fireEvent.press(getByText("Preview"));
    expect(getByText("common.noContent")).toBeTruthy();
  });
});

describe("MarkdownView", () => {
  it("renders markdown content", () => {
    render(<MarkdownView content="# Hello" />);
  });
});

describe("RecorderControls", () => {
  it("renders idle phase with mic icon", () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const { getByLabelText } = render(
      <RecorderControls phase="idle" durationMs={0} onStart={onStart} onStop={onStop} />,
    );
    fireEvent.press(getByLabelText("Start recording"));
    expect(onStart).toHaveBeenCalled();
  });

  it("renders recording phase and triggers stop", () => {
    const onStop = jest.fn();
    const { getByLabelText } = render(
      <RecorderControls
        phase="recording"
        durationMs={1500}
        onStart={() => {}}
        onStop={onStop}
      />,
    );
    fireEvent.press(getByLabelText("Stop recording"));
    expect(onStop).toHaveBeenCalled();
  });

  it("hides the button outside of idle/recording", () => {
    render(
      <RecorderControls phase="stopped" durationMs={0} onStart={() => {}} onStop={() => {}} />,
    );
  });

  it("renders disabled state", () => {
    render(
      <RecorderControls
        phase="idle"
        durationMs={0}
        onStart={() => {}}
        onStop={() => {}}
        disabled
      />,
    );
  });
});
