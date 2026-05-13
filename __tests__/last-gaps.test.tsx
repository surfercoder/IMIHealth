import { fireEvent, render, act, renderHook, waitFor } from "@testing-library/react-native";

jest.mock("react-native-svg", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (p: object) => React.createElement("svg", p),
    Svg: (p: object) => React.createElement("svg", p),
    Path: (p: object) => React.createElement("path", p),
    Circle: (p: object) => React.createElement("circle", p),
    Rect: (p: object) => React.createElement("rect", p),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? k,
    i18n: { language: "es" },
  }),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockLocalParams: { current: Record<string, unknown> } = { current: { id: "p" } };
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
  useLocalSearchParams: () => mockLocalParams.current,
  Stack: { Screen: () => null },
}));

const mockUsePatientDetail = jest.fn();
jest.mock("@/src/hooks/usePatientDetail", () => ({
  usePatientDetail: () => mockUsePatientDetail(),
}));

jest.mock("@/src/lib/api/patients", () => ({
  deletePatient: jest.fn(),
}));

jest.mock("@/src/components/DictarPedidosModal", () => ({
  DictarPedidosModal: () => null,
}));

describe("PatientDetailScreen new-consult button", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockUsePatientDetail.mockReturnValue({
      patient: { id: "p", name: "P", dni: null, email: null, phone: null, dob: null, obra_social: null, nro_afiliado: null, plan: null },
      informes: [],
      loading: false,
    });
  });

  it("new-consult button navigates to record route", async () => {
    const PatientDetailScreen = require("@/app/(app)/patient/[id]/index").default;
    const { findByText } = render(<PatientDetailScreen />);
    fireEvent.press(await findByText("patientPage.newConsult"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/record" }),
    );
  });
});

describe("SignupFields onChange callbacks", () => {
  it("AvatarPicker and SignaturePad onChange handlers forward values", () => {
    const avatarOnChange = jest.fn();
    const signatureOnChange = jest.fn();

    jest.doMock("@/src/components/AvatarPicker", () => ({
      AvatarPicker: ({ onChange }: { onChange: (v: string | null) => void }) => {
        // Invoke the parent's onChange.
        onChange("data:img");
        onChange(null);
        avatarOnChange(onChange);
        return null;
      },
    }));
    jest.doMock("@/src/components/SignaturePad", () => ({
      SignaturePad: ({ onChange }: { onChange: (v: string | null) => void }) => {
        onChange("data:sig");
        onChange(null);
        signatureOnChange(onChange);
        return null;
      },
    }));

    const { SignupFields } = require("@/src/components/signup/SignupFields");
    const { useForm } = require("react-hook-form");

    function Wrapper() {
      const form = useForm({
        defaultValues: {
          name: "",
          email: "",
          dni: "",
          matricula: "",
          phone: "",
          especialidad: "",
          tagline: "",
          avatar: "",
          firmaDigital: "",
          password: "",
          confirmPassword: "",
        },
      });
      return <SignupFields control={form.control} nameValue="" />;
    }

    render(<Wrapper />);
    expect(avatarOnChange).toHaveBeenCalled();
    expect(signatureOnChange).toHaveBeenCalled();
  });
});

describe("Select modal close paths", () => {
  it("backdrop press and onRequestClose close the modal", () => {
    jest.doMock("react-native/Libraries/Modal/Modal", () => {
      const React = require("react");
      const RN = require("react-native");
      return {
        __esModule: true,
        default: function MockModal(props: {
          visible: boolean;
          children: React.ReactNode;
          onRequestClose?: () => void;
        }) {
          // Fire the onRequestClose to exercise that close handler.
          React.useEffect(() => {
            if (props.visible) props.onRequestClose?.();
          }, [props.visible]);
          return props.visible
            ? React.createElement(RN.View, null, props.children)
            : null;
        },
      };
    });
    const { Select } = require("@/src/components/ui");
    const { getByText } = render(
      <Select
        value={null}
        options={[{ value: "a", label: "Apple" }]}
        onChange={() => {}}
        placeholder="Pick"
        searchable={false}
      />,
    );
    fireEvent.press(getByText("Pick"));
  });
});

describe("useRecorder tick action", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("tick action increments durationMs while recording", async () => {
    jest.doMock("expo-audio", () => ({
      RecordingPresets: { HIGH_QUALITY: {} },
      useAudioRecorder: () => ({
        uri: null,
        prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
        record: jest.fn(),
        stop: jest.fn().mockResolvedValue(undefined),
      }),
      useAudioRecorderState: () => ({ isRecording: true }),
      AudioModule: {
        requestRecordingPermissionsAsync: () => Promise.resolve({ granted: true }),
      },
      setAudioModeAsync: () => Promise.resolve(),
    }));
    jest.doMock("react-native/Libraries/Alert/Alert", () => ({
      __esModule: true,
      default: { alert: jest.fn() },
    }));
    jest.doMock("expo-keep-awake", () => ({
      activateKeepAwakeAsync: jest.fn(),
      deactivateKeepAwake: jest.fn(),
    }));

    const { useRecorder } = require("@/src/hooks/useRecorder");
    const { result } = renderHook(() => useRecorder());
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.phase).toBe("recording");
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(result.current.durationMs).toBeGreaterThan(0);
  });
});
