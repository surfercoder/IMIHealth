import { fireEvent, render } from "@testing-library/react-native";

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
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("@/src/components/informe-actions", () => {
  const React = require("react");
  const RN = require("react-native");
  const Stub = (label: string) => () => React.createElement(RN.Text, null, label);
  return {
    CopyButton: Stub("copy"),
    EmailButton: Stub("email"),
    ViewPdfButton: Stub("pdf"),
    WhatsAppDoctorButton: Stub("wa-doc"),
    WhatsAppPatientButton: Stub("wa-pat"),
    CertificadoButton: Stub("cert"),
    PedidosButton: Stub("ped"),
  };
});

jest.mock("@/src/components/MarkdownView", () => {
  const React = require("react");
  const RN = require("react-native");
  return { MarkdownView: (p: { content: string }) => React.createElement(RN.Text, null, p.content) };
});

jest.mock("@/src/components/MarkdownEditor", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    MarkdownEditor: (p: { value: string; onChange: (v: string) => void }) =>
      React.createElement(RN.TextInput, {
        testID: "editor",
        value: p.value,
        onChangeText: p.onChange,
      }),
  };
});

import { DoctorReportCard } from "@/src/components/informe/DoctorReportCard";
import { PatientReportCard } from "@/src/components/informe/PatientReportCard";

const doctor = { id: "d", email: "d@x", phone: "+1", name: "Dr" } as never;
const patient = { id: "p", name: "P", email: "p@x", phone: "+1" } as never;

describe("DoctorReportCard", () => {
  it("renders read mode with action buttons when ready", () => {
    const { getByText } = render(
      <DoctorReportCard
        doctor={doctor}
        editing={false}
        saving={false}
        isReady
        content="Doctor notes"
        draft=""
        consentBlock=""
        onDraftChange={() => {}}
        onStartEdit={() => {}}
        onCancel={() => {}}
        onSave={() => {}}
      />,
    );
    expect(getByText("Doctor notes")).toBeTruthy();
    expect(getByText("email")).toBeTruthy();
  });

  it("renders empty placeholder when content empty", () => {
    const { getByText } = render(
      <DoctorReportCard
        doctor={null}
        editing={false}
        saving={false}
        isReady={false}
        content="   "
        draft=""
        consentBlock=""
        onDraftChange={() => {}}
        onStartEdit={() => {}}
        onCancel={() => {}}
        onSave={() => {}}
      />,
    );
    expect(getByText("common.noContent")).toBeTruthy();
  });

  it("renders edit mode and triggers save/cancel", () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const { getByText } = render(
      <DoctorReportCard
        doctor={doctor}
        editing
        saving={false}
        isReady
        content=""
        draft="d"
        consentBlock=""
        onDraftChange={() => {}}
        onStartEdit={() => {}}
        onCancel={onCancel}
        onSave={onSave}
      />,
    );
    fireEvent.press(getByText("common.save"));
    fireEvent.press(getByText("common.cancel"));
    expect(onSave).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it("Edit button starts edit when not editing", () => {
    const onStartEdit = jest.fn();
    const { getByText } = render(
      <DoctorReportCard
        doctor={null}
        editing={false}
        saving={false}
        isReady={false}
        content="x"
        draft=""
        consentBlock=""
        onDraftChange={() => {}}
        onStartEdit={onStartEdit}
        onCancel={() => {}}
        onSave={() => {}}
      />,
    );
    fireEvent.press(getByText("common.edit"));
    expect(onStartEdit).toHaveBeenCalled();
  });
});

describe("PatientReportCard", () => {
  it("renders ready state with actions", () => {
    const { getByText } = render(
      <PatientReportCard
        informeId="i"
        doctor={doctor}
        patient={patient}
        editing={false}
        saving={false}
        isReady
        content="patient notes"
        doctorContent="d"
        draft=""
        onDraftChange={() => {}}
        onStartEdit={() => {}}
        onCancel={() => {}}
        onSave={() => {}}
      />,
    );
    expect(getByText("patient notes")).toBeTruthy();
    expect(getByText("pdf")).toBeTruthy();
  });

  it("renders empty content + edit mode", () => {
    const onSave = jest.fn();
    const { getByText } = render(
      <PatientReportCard
        informeId="i"
        doctor={null}
        patient={null}
        editing
        saving={false}
        isReady={false}
        content=""
        doctorContent=""
        draft=""
        onDraftChange={() => {}}
        onStartEdit={() => {}}
        onCancel={() => {}}
        onSave={onSave}
      />,
    );
    fireEvent.press(getByText("common.save"));
    expect(onSave).toHaveBeenCalled();
  });

  it("starts edit on edit button press", () => {
    const onStartEdit = jest.fn();
    const { getByText } = render(
      <PatientReportCard
        informeId="i"
        doctor={null}
        patient={null}
        editing={false}
        saving={false}
        isReady={false}
        content="x"
        doctorContent=""
        draft=""
        onDraftChange={() => {}}
        onStartEdit={onStartEdit}
        onCancel={() => {}}
        onSave={() => {}}
      />,
    );
    fireEvent.press(getByText("common.edit"));
    expect(onStartEdit).toHaveBeenCalled();
  });

  it("renders placeholder when patient empty content", () => {
    const { getByText } = render(
      <PatientReportCard
        informeId="i"
        doctor={null}
        patient={null}
        editing={false}
        saving={false}
        isReady
        content="   "
        doctorContent=""
        draft=""
        onDraftChange={() => {}}
        onStartEdit={() => {}}
        onCancel={() => {}}
        onSave={() => {}}
      />,
    );
    expect(getByText("common.noContent")).toBeTruthy();
  });
});
