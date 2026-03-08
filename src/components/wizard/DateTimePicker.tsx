import { useBooking } from "@/hooks/useBooking";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { EARLIEST_HOUR, LATEST_HOUR } from "@/config/constants";
import { cn } from "@/lib/utils";
import { isWeekend } from "date-fns";

function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let h = EARLIEST_HOUR; h <= LATEST_HOUR; h++) {
    times.push(`${h.toString().padStart(2, "0")}:00`);
    if (h < LATEST_HOUR) times.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return times;
}

const TIME_OPTIONS = generateTimeOptions();

export function DateTimePicker() {
  const { state, setBookingDate, setStartTime, setEndTime, setRoomReason, setStep } = useBooking();

  const getPrevStep = () => {
    if (state.route === "A") return 1;
    if (state.route === "B") return 1;
    return 2; // Route C
  };

  const getNextStep = () => {
    if (state.route === "A") return 3;
    if (state.route === "B") return 3;
    return 4; // Route C
  };

  const canContinue = state.bookingDate && state.startTime && state.endTime && state.startTime < state.endTime;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setStep(getPrevStep())}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Pick Date & Time</h2>
          <p className="text-muted-foreground">Weekdays only, 7:00 AM – 4:00 PM</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={state.bookingDate ?? undefined}
              onSelect={d => setBookingDate(d ?? null)}
              disabled={date => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || isWeekend(date);
              }}
              className={cn("p-3 pointer-events-auto")}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Time</label>
            <Select value={state.startTime} onValueChange={setStartTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Time</label>
            <Select value={state.endTime} onValueChange={setEndTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.filter(t => !state.startTime || t > state.startTime).map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state.startTime && state.endTime && state.startTime >= state.endTime && (
            <p className="text-sm text-destructive">End time must be after start time.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setStep(getNextStep())} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
