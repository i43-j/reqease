import { useBooking } from "@/hooks/useBooking";
import { StepIndicator } from "./StepIndicator";
import { RouteSelect } from "./RouteSelect";
import { RoomSelect } from "./RoomSelect";
import { EquipmentPicker } from "./EquipmentPicker";
import { DateTimePicker } from "./DateTimePicker";
import { Confirmation } from "./Confirmation";
import { Success } from "./Success";

function getSteps(route: string | null): string[] {
  if (route === "A") return ["Route", "Room", "Date & Time", "Confirm", "Done"];
  if (route === "B") return ["Route", "Equipment", "Date & Time", "Confirm", "Done"];
  return ["Route", "Room", "Equipment", "Date & Time", "Confirm", "Done"];
}

function getStepComponent(route: string | null, step: number) {
  if (step === 0) return <RouteSelect />;

  if (route === "A") {
    if (step === 1) return <RoomSelect />;
    if (step === 2) return <DateTimePicker />;
    if (step === 3) return <Confirmation />;
    return <Success />;
  }

  if (route === "B") {
    if (step === 1) return <EquipmentPicker />;
    if (step === 2) return <DateTimePicker />;
    if (step === 3) return <Confirmation />;
    return <Success />;
  }

  // Route C
  if (step === 1) return <RoomSelect />;
  if (step === 2) return <EquipmentPicker />;
  if (step === 3) return <DateTimePicker />;
  if (step === 4) return <Confirmation />;
  return <Success />;
}

export function BookingWizard() {
  const { state, step } = useBooking();
  const steps = getSteps(state.route);

  return (
    <div className="container max-w-5xl py-6 space-y-2">
      {state.route && step < steps.length - 1 && (
        <StepIndicator steps={steps} currentStep={step} />
      )}
      {getStepComponent(state.route, step)}
    </div>
  );
}
